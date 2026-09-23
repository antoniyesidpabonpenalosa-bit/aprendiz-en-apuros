-- ═══════════════════════════════════════════════════════════════════════════
--  Anti-trampas del marcador · se aplica DESPUÉS de records.sql
-- ═══════════════════════════════════════════════════════════════════════════
--  Qué NO puede hacer esto, dicho claro: el juego corre en el navegador y no
--  hay cuentas, así que quien quiera puede inventarse UNA marca creíble y
--  mandarla a mano. Eso solo se evitaría validando la partida entera en el
--  servidor. Si pasa, la marca se borra desde el panel de Supabase.
--
--  Lo que SÍ hace:
--   1. Frena las ráfagas: un script que manda cientos de marcas se corta.
--   2. Rechaza la misma marca repetida (mismo nombre, puntos, XP, dificultad,
--      hito o fecha y grupo): nadie llena el podio copiando su fila.
--   3. Deja a los roles públicos solo con leer e insertar.
--
--  Los límites son generosos a propósito: en un aula, 30 o 40 alumnos salen a
--  internet con la MISMA IP, y pueden terminar el reto a la vez. Un jugador
--  real publica muy poco: un reto al día, la marca del sin fin solo cuando
--  supera la suya y los tres hitos de la campaña.
--
--  El juego no necesita ningún cambio: si la base rechaza una marca,
--  RANKING.publicar() devuelve false en silencio, igual que sin internet.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 3 · solo leer e insertar ───────────────────────────────────────────────
-- Supabase da por defecto todos los permisos de tabla a anon y authenticated.
-- RLS ya niega editar y borrar filas, pero TRUNCATE no pasa por RLS. Se quitan
-- todos y se devuelven solo los dos que el juego usa.
revoke all on public.records, public.retos from anon, authenticated;
grant select, insert on public.records, public.retos to anon, authenticated;

-- ── registro privado de envíos ─────────────────────────────────────────────
-- Esquema aparte: la API de Supabase solo publica "public", así que nada de
-- aquí se puede leer ni escribir desde el navegador.
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

-- Sal secreta para el hash de la IP. Sin ella, las IPv4 son tan pocas que
-- un sha256 se revertiría probando todas.
create table privado.ajustes (
  sal text not null
);
insert into privado.ajustes (sal) values (gen_random_uuid()::text || gen_random_uuid()::text);

-- Solo el hash de la IP y la hora; ni la IP ni la marca. Se borra a las 24 h.
create table privado.envios (
  quien     text        not null,
  creado_en timestamptz not null default now()
);
create index envios_quien_idx on privado.envios (quien, creado_en);
create index envios_hora_idx  on privado.envios (creado_en);
alter table privado.ajustes enable row level security;
alter table privado.envios  enable row level security;

-- ── 1 y 2 · la revisión de cada marca ──────────────────────────────────────
create or replace function privado.revisar_marca()
returns trigger
language plpgsql
security definer          -- lee privado.* aunque quien inserta sea anon
set search_path = ''
as $$
declare
  POR_MINUTO constant int := 40;
  POR_HORA   constant int := 300;
  cabeceras json;
  ip        text;
  huella    text;  -- hash de la IP con la sal
  en_minuto int;
  en_hora   int;
begin
  -- 2 · la misma marca otra vez
  if tg_table_name = 'records' then
    if exists (select 1 from public.records r
               where r.nombre = new.nombre and r.puntos = new.puntos and r.xp = new.xp
                 and r.dificultad = new.dificultad and r.temporada = new.temporada
                 and r.grupo is not distinct from new.grupo) then
      raise exception 'marca repetida' using errcode = 'P0001';
    end if;
  else
    if exists (select 1 from public.retos r
               where r.nombre = new.nombre and r.puntos = new.puntos and r.xp = new.xp
                 and r.dificultad = new.dificultad and r.fecha = new.fecha
                 and r.grupo is not distinct from new.grupo) then
      raise exception 'marca repetida' using errcode = 'P0001';
    end if;
  end if;

  -- 1 · ráfagas. La API de Supabase pasa las cabeceras de la petición.
  -- cf-connecting-ip la pone Cloudflare y el cliente no la puede falsificar;
  -- x-forwarded-for (la primera de la lista, como dice la guía de Supabase)
  -- queda de respaldo, pero el cliente puede escribirla él mismo: tras aplicar
  -- este archivo, comprobar cuál llega (ver el final). Sin ninguna, la
  -- inserción no viene de la API (el editor SQL del panel) y no se limita.
  cabeceras := nullif(current_setting('request.headers', true), '')::json;
  ip := coalesce(nullif(trim(cabeceras ->> 'cf-connecting-ip'), ''),
                 trim(split_part(cabeceras ->> 'x-forwarded-for', ',', 1)));
  if ip is null or ip = '' then
    return new;
  end if;

  huella := encode(sha256(convert_to(ip || (select a.sal from privado.ajustes a limit 1), 'UTF8')), 'hex');

  delete from privado.envios e where e.creado_en < now() - interval '1 day';

  select count(*) filter (where e.creado_en > now() - interval '1 minute'),
         count(*)
    into en_minuto, en_hora
    from privado.envios e
   where e.quien = huella
     and e.creado_en > now() - interval '1 hour';

  if en_minuto >= POR_MINUTO or en_hora >= POR_HORA then
    raise exception 'demasiadas marcas seguidas, espera un poco' using errcode = 'P0001';
  end if;

  -- Si la inserción falla después (un CHECK, por ejemplo), este registro se
  -- deshace con ella: solo cuentan las marcas que de verdad entraron.
  insert into privado.envios (quien) values (huella);
  return new;
end;
$$;

revoke all on function privado.revisar_marca() from public, anon, authenticated;

create trigger revisar_marca
  before insert on public.records
  for each row execute function privado.revisar_marca();

create trigger revisar_marca
  before insert on public.retos
  for each row execute function privado.revisar_marca();

-- ── comprobar, una vez aplicado ────────────────────────────────────────────
-- Mandar dos marcas de prueba con IP falsas distintas en x-forwarded-for:
--
--   curl "$URL/rest/v1/records" -H "apikey: $CLAVE" -H "Content-Type: application/json" \
--        -H "X-Forwarded-For: 203.0.113.1" -d '{"nombre":"PRUEBA1","puntos":1,"xp":1}'
--   (y otra igual con 203.0.113.2 y PRUEBA2)
--
--   select count(distinct quien) from privado.envios
--    where creado_en > now() - interval '5 minutes';
--
-- 1 = bien: se usó la IP real y la falsa no sirve de nada. 2 = la cabecera
-- falsa se coló y el límite se puede esquivar; habría que leer otra cabecera.
-- Después, borrar las dos filas de prueba desde el panel.

-- ── para deshacerlo todo ───────────────────────────────────────────────────
--   drop trigger revisar_marca on public.records;
--   drop trigger revisar_marca on public.retos;
--   drop schema privado cascade;
--   grant all on public.records, public.retos to anon, authenticated;
