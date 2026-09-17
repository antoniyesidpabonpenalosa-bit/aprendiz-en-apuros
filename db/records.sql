-- ═══════════════════════════════════════════════════════════════════════════
--  Marcador global de "Aprendiz en Apuros" · esquema de la tabla de récords
-- ═══════════════════════════════════════════════════════════════════════════
--  Este archivo es la fuente de verdad del esquema: lo que corre hoy en el
--  proyecto de Supabase salió de aquí. Si hay que recrear la base (proyecto
--  nuevo, otra cuenta, entorno de pruebas), basta con pegarlo en el editor SQL.
--
--  Tras recrearla hay que actualizar URL_BASE y CLAVE en js/ranking.js con los
--  datos del proyecto nuevo.
--
--  El juego usa la clave "publishable", que es pública y viaja en el JS del
--  navegador. Por eso la seguridad real vive aquí abajo, no en la clave.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.records (
  id          uuid        primary key default gen_random_uuid(),
  nombre      text        not null,
  puntos      integer     not null,
  xp          integer     not null,
  dificultad  smallint    not null default 1,
  temporada   smallint    not null default 1,
  creado_en   timestamptz not null default now(),

  -- El juego recorta el nombre a 10 caracteres; se exige lo mismo en la base.
  constraint records_nombre_largo check (char_length(nombre) between 1 and 10),
  -- Cota generosa pero finita: el rango más alto del juego son 4.500 XP y la
  -- mejora "doble" duplica los puntos, así que una partida real no se acerca
  -- a 100.000. Esto no impide hacer trampa, solo bloquea valores absurdos.
  constraint records_puntos_rango check (puntos between 0 and 100000),
  constraint records_xp_rango     check (xp     between 0 and 100000),
  constraint records_dificultad   check (dificultad in (0, 1, 2)),
  -- 0 = terminó el día 5 (media etapa), 1 = el día 10 (titulado),
  -- 2 = el día 15 (el contrato). El día 5 existe para que el marcador tenga
  -- gente desde temprano en vez de estar vacío hasta que alguien llegue al 10.
  constraint records_temporada    check (temporada in (0, 1, 2)),
  -- Los puntos NUNCA pueden superar la XP. No es una cota inventada: en el
  -- juego S.pts y S.xp suben siempre juntos y en la misma cantidad
  -- (nucleo.js: `S.pts+=gan; S.xp+=gan`), pero S.pts además baja al comprar
  -- en la tienda y S.xp no baja nunca. Así que en una partida real esto se
  -- cumple siempre, y rechaza la marca falsificada de manual: puntaje enorme
  -- con la XP en cero.
  constraint records_puntos_no_superan_xp check (puntos <= xp)
);

-- La consulta del juego siempre es "los mejores puntajes primero".
create index records_puntos_idx on public.records (puntos desc, creado_en asc);

alter table public.records enable row level security;

-- Cualquiera puede leer la tabla: es un marcador público.
create policy "records legibles por cualquiera"
  on public.records for select
  to anon, authenticated
  using (true);

-- Cualquiera puede publicar su marca. Los CHECK de arriba filtran la basura.
create policy "cualquiera puede publicar su marca"
  on public.records for insert
  to anon, authenticated
  with check (true);

-- Sin políticas de update ni delete: RLS los niega por defecto. Una marca
-- publicada es inmutable, ni siquiera quien la creó puede tocarla.


-- ═══════════════════════════════════════════════════════════════════════════
--  Marcador del RETO DIARIO
-- ═══════════════════════════════════════════════════════════════════════════
--  Tabla aparte de `records` porque se consulta siempre por fecha: cada día
--  empieza en blanco y cualquiera puede ser primero hoy, cosa imposible en la
--  tabla histórica, que ya está decidida por quien más haya jugado.
-- ═══════════════════════════════════════════════════════════════════════════

create table public.retos (
  id          uuid        primary key default gen_random_uuid(),
  nombre      text        not null,
  puntos      integer     not null,
  xp          integer     not null,
  dificultad  smallint    not null default 1,
  fecha       date        not null,
  creado_en   timestamptz not null default now(),

  constraint retos_nombre_largo check (char_length(nombre) between 1 and 10),
  constraint retos_puntos_rango check (puntos between 0 and 100000),
  constraint retos_xp_rango     check (xp     between 0 and 100000),
  constraint retos_dificultad   check (dificultad in (0, 1, 2)),
  -- Misma invariante que en records: los puntos del reto salen de la XP que
  -- ese mismo reto acaba de sumar, así que nunca pueden superarla.
  constraint retos_puntos_no_superan_xp check (puntos <= xp)
);

-- La consulta del juego es siempre "los mejores de ESTE día".
create index retos_dia_idx on public.retos (fecha, puntos desc, creado_en asc);

alter table public.retos enable row level security;

create policy "retos legibles por cualquiera"
  on public.retos for select
  to anon, authenticated
  using (true);

-- Solo se acepta la marca del día de hoy o de ayer: sin esto, cualquiera
-- podría sembrar puntajes en fechas futuras y salir primero para siempre.
-- El margen de un día cubre los husos horarios y a quien juega a medianoche.
create policy "cualquiera publica su reto del dia"
  on public.retos for insert
  to anon, authenticated
  with check (fecha between (current_date - 1) and (current_date + 1));

-- Sin update ni delete: una marca publicada es inmutable, igual que en records.
