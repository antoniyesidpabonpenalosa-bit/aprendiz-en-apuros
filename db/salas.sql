-- ═══════════════════════════════════════════════════════════════════════════
--  SALAS DE CLASE · se aplica después de records.sql y anti-trampas.sql
-- ═══════════════════════════════════════════════════════════════════════════
--  APLICADO en producción el 2026-09-24 (migración salas_de_clase).
--  Probado contra la API real: crear, unirse, empezar, puntuar, estado,
--  terminar, tokens falsos rechazados y tablas invisibles desde la API (404).
--  El aviso de Supabase "Public Can Execute SECURITY DEFINER Function" sobre
--  las cinco sala_* es esperado: SON la API pública y validan cada dato.
-- ───────────────────────────────────────────────────────────────────────────
--  El instructor crea una sala (dificultad + minijuegos), los aprendices se
--  unen con el código y el proyector muestra quién entró y cómo van.
--
--  Las tablas viven en el esquema "privado", que la API no publica: el
--  navegador NO puede leerlas ni escribirlas. Todo pasa por las funciones
--  sala_* de abajo, que validan cada dato y responden en una sola petición.
--
--  Sin cuentas: quien crea la sala recibe un token secreto (y cada jugador el
--  suyo). Aquí solo se guarda su hash, así que ni leyendo la base se pueden
--  suplantar. El token vive en el localStorage de ese dispositivo.
--
--  Las salas duran 12 horas y se borran solas al crear otra.
-- ═══════════════════════════════════════════════════════════════════════════

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create table privado.salas (
  -- 5 caracteres de un alfabeto sin 0/O ni 1/I, que se confunden al dictarlo
  codigo     text        primary key check (codigo ~ '^[A-HJ-NP-Z2-9]{5}$'),
  dificultad smallint    not null check (dificultad in (0, 1, 2)),
  -- los tipos de minijuego, en orden de juego: de 1 a 6
  juegos     text[]      not null check (
               cardinality(juegos) between 1 and 6
               and array_position(juegos, null) is null
               and juegos <@ array['escribir','bugs','memoria','simon','quiz','review',
                                   'merge','sql','regex','runner','terminal','orden']),
  estado     text        not null default 'espera' check (estado in ('espera', 'jugando', 'fin')),
  host_hash  text        not null,
  creada     timestamptz not null default now(),
  expira     timestamptz not null default now() + interval '12 hours'
);

create table privado.sala_jugadores (
  id          uuid        primary key default gen_random_uuid(),
  codigo      text        not null references privado.salas (codigo) on delete cascade,
  nombre      text        not null check (char_length(nombre) between 1 and 10),
  -- el personaje: índices de SKINS y CAMISAS (js/datos.js) y el accesorio
  skin        smallint    not null default 0 check (skin between 0 and 15),
  camisa      smallint    not null default 0 check (camisa between 0 and 15),
  acc         text        not null default '' check (acc ~ '^[a-z]{0,12}$'),
  av32        boolean     not null default false,
  -- rondas terminadas y puntos acumulados en la sala
  ronda       smallint    not null default 0 check (ronda between 0 and 6),
  puntos      integer     not null default 0 check (puntos between 0 and 100000),
  es_host     boolean     not null default false,
  token_hash  text        not null,
  unido       timestamptz not null default now()
);
create index sala_jugadores_codigo_idx on privado.sala_jugadores (codigo, puntos desc);

alter table privado.salas          enable row level security;
alter table privado.sala_jugadores enable row level security;

-- hash de un token: igual en todas las funciones
create or replace function privado.huella(t text) returns text
language sql immutable set search_path = ''
as $$ select encode(sha256(convert_to(coalesce(t, ''), 'UTF8')), 'hex') $$;

-- ── crear ──────────────────────────────────────────────────────────────────
create or replace function public.sala_crear(p_dificultad int, p_juegos text[])
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  ALFABETO constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   -- 32: sin sesgo con % 32
  b     bytea;
  cod   text;
  token text := gen_random_uuid()::text;
begin
  delete from privado.salas s where s.expira < now();
  if (select count(*) from privado.salas) >= 2000 then
    raise exception 'demasiadas salas abiertas' using errcode = 'P0001';
  end if;
  for intento in 1..10 loop
    b := uuid_send(gen_random_uuid());
    cod := '';
    for i in 0..4 loop
      cod := cod || substr(ALFABETO, get_byte(b, i) % 32 + 1, 1);
    end loop;
    exit when not exists (select 1 from privado.salas s where s.codigo = cod);
    cod := null;
  end loop;
  if cod is null then
    raise exception 'no se pudo generar un código' using errcode = 'P0001';
  end if;
  -- los CHECK de la tabla validan dificultad y juegos
  insert into privado.salas (codigo, dificultad, juegos, host_hash)
  values (cod, p_dificultad, p_juegos, privado.huella(token));
  return json_build_object('codigo', cod, 'token', token);
end;
$$;

-- ── unirse ─────────────────────────────────────────────────────────────────
-- p_host: el token de la sala, si quien se une es el instructor (lleva 👑).
create or replace function public.sala_unirse(
  p_codigo text, p_nombre text, p_skin int, p_camisa int, p_acc text, p_av32 boolean,
  p_host text default null)
returns json
language plpgsql security definer set search_path = ''
as $$
declare
  s     privado.salas;
  token text := gen_random_uuid()::text;
  nom   text := trim(left(upper(regexp_replace(trim(coalesce(p_nombre, '')), '\s+', ' ', 'g')), 10));
  nuevo uuid;
begin
  select * into s from privado.salas x where x.codigo = upper(trim(p_codigo)) and x.expira > now();
  if not found then
    raise exception 'sala no existe' using errcode = 'P0001';
  end if;
  if s.estado = 'fin' then
    raise exception 'sala cerrada' using errcode = 'P0001';
  end if;
  if (select count(*) from privado.sala_jugadores j where j.codigo = s.codigo) >= 60 then
    raise exception 'sala llena' using errcode = 'P0001';
  end if;
  insert into privado.sala_jugadores (codigo, nombre, skin, camisa, acc, av32, es_host, token_hash)
  values (s.codigo, coalesce(nullif(nom, ''), 'TU'),
          greatest(0, least(15, coalesce(p_skin, 0))), greatest(0, least(15, coalesce(p_camisa, 0))),
          case when coalesce(p_acc, '') ~ '^[a-z]{0,12}$' then coalesce(p_acc, '') else '' end,
          coalesce(p_av32, false),
          p_host is not null and privado.huella(p_host) = s.host_hash,
          privado.huella(token))
  returning id into nuevo;
  return json_build_object('id', nuevo, 'token', token);
end;
$$;

-- ── puntuar ────────────────────────────────────────────────────────────────
-- Se manda el TOTAL acumulado y las rondas terminadas, no un incremento: si
-- un envío se pierde, el siguiente lo corrige, y repetir uno no suma dos veces.
-- Nunca se retrocede (ni en rondas ni en puntos).
create or replace function public.sala_puntuar(p_id uuid, p_token text, p_ronda int, p_puntos int)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  update privado.sala_jugadores j
     set ronda = p_ronda, puntos = p_puntos
    from privado.salas s
   where j.id = p_id
     and j.token_hash = privado.huella(p_token)
     and s.codigo = j.codigo
     and s.expira > now()
     and s.estado in ('jugando', 'fin')
     and p_ronda between j.ronda and cardinality(s.juegos)
     and p_puntos between j.puntos and 100000;
  return found;
end;
$$;

-- ── estado (lo que sondean el proyector y la sala de espera) ───────────────
create or replace function public.sala_estado(p_codigo text)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  s privado.salas;
begin
  select * into s from privado.salas x where x.codigo = upper(trim(p_codigo)) and x.expira > now();
  if not found then
    return null;
  end if;
  return json_build_object(
    'codigo', s.codigo, 'dificultad', s.dificultad, 'juegos', s.juegos, 'estado', s.estado,
    'jugadores', coalesce((
      select json_agg(json_build_object(
               'id', j.id, 'nombre', j.nombre, 'skin', j.skin, 'camisa', j.camisa,
               'acc', j.acc, 'av32', j.av32, 'ronda', j.ronda, 'puntos', j.puntos,
               'host', j.es_host)
             order by j.puntos desc, j.unido asc)
        from privado.sala_jugadores j where j.codigo = s.codigo), '[]'::json));
end;
$$;

-- ── mandos del instructor ──────────────────────────────────────────────────
-- p_accion: 'empezar' (espera → jugando), 'terminar' (→ fin) o 'expulsar'
-- (borra al jugador p_jugador). Devuelve false si el token no es el de la sala.
create or replace function public.sala_host(p_codigo text, p_token text, p_accion text, p_jugador uuid default null)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  cod text := upper(trim(p_codigo));
begin
  if not exists (select 1 from privado.salas s
                  where s.codigo = cod and s.host_hash = privado.huella(p_token) and s.expira > now()) then
    return false;
  end if;
  if p_accion = 'empezar' then
    update privado.salas s set estado = 'jugando' where s.codigo = cod and s.estado = 'espera';
  elsif p_accion = 'terminar' then
    update privado.salas s set estado = 'fin' where s.codigo = cod;
  elsif p_accion = 'expulsar' then
    delete from privado.sala_jugadores j where j.codigo = cod and j.id = p_jugador;
  else
    return false;
  end if;
  return true;
end;
$$;

-- Solo las cinco funciones son públicas. Supabase da EXECUTE a anon por
-- defecto en las funciones de "public"; se quita a todas y se devuelve a estas.
revoke all on function privado.huella(text) from public, anon, authenticated;
revoke all on function public.sala_crear(int, text[]),
                       public.sala_unirse(text, text, int, int, text, boolean, text),
                       public.sala_puntuar(uuid, text, int, int),
                       public.sala_estado(text),
                       public.sala_host(text, text, text, uuid)
  from public;
grant execute on function public.sala_crear(int, text[]),
                          public.sala_unirse(text, text, int, int, text, boolean, text),
                          public.sala_puntuar(uuid, text, int, int),
                          public.sala_estado(text),
                          public.sala_host(text, text, text, uuid)
  to anon, authenticated;

-- ── para deshacerlo todo ───────────────────────────────────────────────────
--   drop function public.sala_crear(int, text[]);
--   drop function public.sala_unirse(text, text, int, int, text, boolean, text);
--   drop function public.sala_puntuar(uuid, text, int, int);
--   drop function public.sala_estado(text);
--   drop function public.sala_host(text, text, text, uuid);
--   drop function privado.huella(text);
--   drop table privado.sala_jugadores;
--   drop table privado.salas;
