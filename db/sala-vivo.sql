-- ═══════════════════════════════════════════════════════════════════════════
-- RONDA EN VIVO y PANEL DEL INSTRUCTOR · extiende db/salas.sql
--
-- SOLO AÑADE. No modifica ni borra ninguna tabla, columna ni dato existente, y
-- no cambia la firma de ninguna función ya publicada: los clientes que no
-- conocen esto (la v39 y anteriores) siguen funcionando igual.
--
-- RONDA EN VIVO (estilo Kahoot): el instructor lanza una pregunta, todos
-- responden a la vez en su celular y el proyector muestra el podio al instante.
--   · la sala pasa a modo 'vivo' con una lista de preguntas (vivo_items: índices
--     del banco QUIZ), que escoge el instructor y leen todos;
--   · el instructor avanza con sala_vivo ('iniciar', 'revelar', 'siguiente');
--   · cada jugador responde UNA vez por pregunta con sala_responder. Los puntos
--     por rapidez los calcula el SERVIDOR con su propio reloj (de 1000 a 300 según
--     lo que tardó), no el celular. Lo que sí se confía al cliente es si acertó:
--     el banco de preguntas vive en el juego, igual que ya se confía en los
--     puntos de sala_puntuar. Aquí es un aula, no un torneo con premios.
--
-- PANEL DEL INSTRUCTOR: qué temas falló más la clase. Solo AGREGADOS por tema e
-- ítem (cuántos lo intentaron y cuántos lo fallaron): nunca quién.
--   · sala_reportar recibe, al cerrar cada ronda, lo que jugó cada alumno; un
--     alumno solo puede reportar una vez por ronda (sala_reportes), así que un
--     reintento por red caída no cuenta doble;
--   · sala_resumen lo lee el proyector.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── columnas nuevas, todas con valor por defecto ──────────────────────────
alter table privado.salas
  add column if not exists modo       text        not null default 'ritmo' check (modo in ('ritmo', 'vivo')),
  add column if not exists vivo_items smallint[]  not null default '{}'   check (cardinality(vivo_items) <= 10),
  add column if not exists q_n        smallint    not null default 0       check (q_n between 0 and 10),
  add column if not exists q_inicio   timestamptz,
  add column if not exists q_revelada boolean     not null default false,
  add column if not exists q_limite   smallint    not null default 20      check (q_limite between 5 and 60);

alter table privado.sala_jugadores
  add column if not exists respondidas smallint not null default 0 check (respondidas between 0 and 10);

-- ── respuestas de la ronda en vivo: una por jugador y pregunta ────────────
create table if not exists privado.sala_respuestas (
  jugador uuid     not null references privado.sala_jugadores (id) on delete cascade,
  codigo  text     not null references privado.salas (codigo)      on delete cascade,
  q       smallint not null check (q between 1 and 10),
  opcion  smallint not null check (opcion between -1 and 5),
  ok      boolean  not null,
  ms      integer  not null check (ms >= 0),
  puntos  integer  not null check (puntos between 0 and 1000),
  primary key (jugador, q)
);
create index if not exists sala_respuestas_codigo_idx on privado.sala_respuestas (codigo, q);

-- ── agregados del panel: por sala, tema e ítem, sin nombres ───────────────
create table if not exists privado.sala_resultados (
  codigo   text     not null references privado.salas (codigo) on delete cascade,
  tema     text     not null check (tema in ('quiz','review','sql','regex','merge','palabras',
                                              'git','parejas','terminal','orden')),
  item     smallint not null check (item between 0 and 999),
  intentos integer  not null default 0 check (intentos between 0 and 100000),
  fallos   integer  not null default 0 check (fallos between 0 and 100000),
  primary key (codigo, tema, item)
);

-- quién ya reportó qué ronda: lo que impide contar doble un reintento
create table if not exists privado.sala_reportes (
  jugador uuid     not null references privado.sala_jugadores (id) on delete cascade,
  ronda   smallint not null check (ronda between 1 and 6),
  primary key (jugador, ronda)
);

alter table privado.sala_respuestas enable row level security;
alter table privado.sala_resultados enable row level security;
alter table privado.sala_reportes   enable row level security;

-- ── mandos de la ronda en vivo (solo el instructor) ───────────────────────
-- 'iniciar'   : espera → jugando, en modo vivo, con p_items (1 a 10 índices de
--               preguntas) y p_limite segundos por pregunta; arranca la pregunta 1
-- 'revelar'   : cierra las respuestas de la pregunta actual y enseña el resultado
-- 'siguiente' : pasa a la pregunta siguiente; tras la última, la sala termina
create or replace function public.sala_vivo(
  p_codigo text, p_token text, p_accion text, p_items int[] default null, p_limite int default 20)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  cod text := upper(trim(p_codigo));
  s   privado.salas;
begin
  select * into s from privado.salas x
   where x.codigo = cod and x.host_hash = privado.huella(p_token) and x.expira > now();
  if not found then
    return false;
  end if;

  if p_accion = 'iniciar' then
    if s.estado <> 'espera' or p_items is null
       or cardinality(p_items) not between 1 and 10
       or exists (select 1 from unnest(p_items) i where i is null or i not between 0 and 999)
       or p_limite not between 5 and 60 then
      return false;
    end if;
    update privado.salas x
       set modo = 'vivo', estado = 'jugando', vivo_items = p_items::smallint[],
           q_n = 1, q_inicio = now(), q_revelada = false, q_limite = p_limite
     where x.codigo = cod;
  elsif p_accion = 'revelar' then
    if s.modo <> 'vivo' or s.estado <> 'jugando' then return false; end if;
    update privado.salas x set q_revelada = true where x.codigo = cod;
  elsif p_accion = 'siguiente' then
    if s.modo <> 'vivo' or s.estado <> 'jugando' then return false; end if;
    if s.q_n >= cardinality(s.vivo_items) then
      update privado.salas x set estado = 'fin', q_revelada = true where x.codigo = cod;
    else
      update privado.salas x
         set q_n = s.q_n + 1, q_inicio = now(), q_revelada = false
       where x.codigo = cod;
    end if;
  else
    return false;
  end if;
  return true;
end;
$$;

-- ── responder una pregunta en vivo ────────────────────────────────────────
-- Devuelve los puntos ganados (0 si falló) o -1 si no se acepta: token malo,
-- pregunta que no es la actual, ya cerrada, fuera de tiempo o ya respondida.
create or replace function public.sala_responder(
  p_id uuid, p_token text, p_q int, p_opcion int, p_ok boolean)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  s   privado.salas;
  j   privado.sala_jugadores;
  -- las variables llevan prefijo v_: sin él, "item" y "ms" chocaban con las
  -- columnas del mismo nombre en el ON CONFLICT y el INSERT
  v_ms   integer;
  v_pts  integer;
  v_item int;
begin
  select * into j from privado.sala_jugadores x
   where x.id = p_id and x.token_hash = privado.huella(p_token);
  if not found then return -1; end if;
  select * into s from privado.salas x where x.codigo = j.codigo and x.expira > now();
  if not found or s.modo <> 'vivo' or s.estado <> 'jugando'
     or s.q_n <> p_q or s.q_revelada or s.q_inicio is null then
    return -1;
  end if;
  if p_opcion is null or p_opcion not between -1 and 5 or p_ok is null then return -1; end if;

  -- el tiempo lo pone el reloj del servidor; 2 s de margen por la red
  v_ms := floor(extract(epoch from now() - s.q_inicio) * 1000)::int;
  if v_ms > s.q_limite * 1000 + 2000 then return -1; end if;
  v_pts := case when p_ok
                then greatest(300, 1000 - round(700.0 * least(v_ms, s.q_limite * 1000) / (s.q_limite * 1000))::int)
                else 0 end;

  insert into privado.sala_respuestas (jugador, codigo, q, opcion, ok, ms, puntos)
  values (j.id, j.codigo, p_q, p_opcion, p_ok, v_ms, v_pts)
  on conflict (jugador, q) do nothing;
  if not found then return -1; end if;      -- ya había respondido esta pregunta

  update privado.sala_jugadores x
     set puntos = least(100000, x.puntos + v_pts), respondidas = least(10, x.respondidas + 1)
   where x.id = j.id;

  v_item := s.vivo_items[p_q];
  insert into privado.sala_resultados (codigo, tema, item, intentos, fallos)
  values (j.codigo, 'quiz', v_item, 1, case when p_ok then 0 else 1 end)
  on conflict (codigo, tema, item)
    do update set intentos = privado.sala_resultados.intentos + 1,
                  fallos   = privado.sala_resultados.fallos + (case when p_ok then 0 else 1 end);
  return v_pts;
end;
$$;

-- ── reportar lo jugado en una ronda (para el panel) ───────────────────────
-- p_items: [[tema, ítem, acertó], ...] con un máximo de 40. Lo mal formado se
-- ignora. Una sola vez por jugador y ronda.
create or replace function public.sala_reportar(p_id uuid, p_token text, p_ronda int, p_items jsonb)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  j   privado.sala_jugadores;
  e   jsonb;
  tem text;
  itm int;
  ac  boolean;
begin
  select * into j from privado.sala_jugadores x
   where x.id = p_id and x.token_hash = privado.huella(p_token);
  if not found then return false; end if;
  if not exists (select 1 from privado.salas s where s.codigo = j.codigo and s.expira > now()) then
    return false;
  end if;
  if p_ronda is null or p_ronda not between 1 and 6
     or p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) > 40 then
    return false;
  end if;

  insert into privado.sala_reportes (jugador, ronda) values (j.id, p_ronda)
  on conflict do nothing;
  if not found then return false; end if;   -- esta ronda ya se había reportado

  for e in select * from jsonb_array_elements(p_items) loop
    begin
      if jsonb_typeof(e) = 'array' and jsonb_array_length(e) = 3 then
        tem := e ->> 0;  itm := (e ->> 1)::int;  ac := (e ->> 2)::boolean;
        if tem in ('quiz','review','sql','regex','merge','palabras','git','parejas','terminal','orden')
           and itm between 0 and 999 and ac is not null then
          insert into privado.sala_resultados (codigo, tema, item, intentos, fallos)
          values (j.codigo, tem, itm, 1, case when ac then 0 else 1 end)
          on conflict (codigo, tema, item)
            do update set intentos = privado.sala_resultados.intentos + 1,
                          fallos   = privado.sala_resultados.fallos + (case when ac then 0 else 1 end);
        end if;
      end if;
    exception when others then
      null;                                 -- un elemento roto no tumba el resto
    end;
  end loop;
  return true;
end;
$$;

-- ── el resumen que enseña el proyector ────────────────────────────────────
create or replace function public.sala_resumen(p_codigo text)
returns json
language plpgsql stable security definer set search_path = ''
as $$
declare
  cod text := upper(trim(p_codigo));
begin
  if not exists (select 1 from privado.salas s where s.codigo = cod and s.expira > now()) then
    return null;
  end if;
  return json_build_object('temas', coalesce((
    select json_agg(json_build_object('tema', r.tema, 'item', r.item,
                                      'intentos', r.intentos, 'fallos', r.fallos)
                    order by r.fallos desc, r.intentos desc, r.tema, r.item)
      from (select * from privado.sala_resultados x
             where x.codigo = cod and x.fallos > 0
             order by x.fallos desc, x.intentos desc limit 12) r), '[]'::json));
end;
$$;

-- ── sala_estado, ampliada ─────────────────────────────────────────────────
-- Misma firma y mismos campos de siempre; se AÑADEN los de la ronda en vivo.
-- 'ms' es el tiempo que lleva la pregunta según el reloj del SERVIDOR: cada
-- celular lo resta de su propio reloj y así nadie depende de que los relojes
-- coincidan.
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
    'modo', s.modo, 'items', to_json(s.vivo_items), 'q_n', s.q_n,
    'q_total', cardinality(s.vivo_items), 'revelada', s.q_revelada, 'limite', s.q_limite,
    'ms', case when s.q_inicio is null then null
               else floor(extract(epoch from now() - s.q_inicio) * 1000)::int end,
    'respondieron', (select count(*) from privado.sala_respuestas r
                      where r.codigo = s.codigo and r.q = s.q_n),
    'dist', case when s.modo = 'vivo' and s.q_revelada then (
              select json_agg(c.n order by c.o)
                from (select o, count(r.jugador) n
                        from generate_series(0, 3) o
                        left join privado.sala_respuestas r
                               on r.codigo = s.codigo and r.q = s.q_n and r.opcion = o
                       group by o) c)
            else null end,
    'jugadores', coalesce((
      select json_agg(json_build_object(
               'id', j.id, 'nombre', j.nombre, 'skin', j.skin, 'camisa', j.camisa,
               'acc', j.acc, 'av32', j.av32, 'ronda', j.ronda, 'puntos', j.puntos,
               'host', j.es_host, 'resp', j.respondidas,
               'ya', exists (select 1 from privado.sala_respuestas r
                              where r.jugador = j.id and r.q = s.q_n),
               'gan', coalesce((select r.puntos from privado.sala_respuestas r
                                 where r.jugador = j.id and r.q = s.q_n), 0))
             order by j.puntos desc, j.unido asc)
        from privado.sala_jugadores j where j.codigo = s.codigo), '[]'::json));
end;
$$;

-- ── permisos: las funciones nuevas son públicas solo las cuatro de abajo ──
revoke all on function public.sala_vivo(text, text, text, int[], int),
                       public.sala_responder(uuid, text, int, int, boolean),
                       public.sala_reportar(uuid, text, int, jsonb),
                       public.sala_resumen(text)
  from public, anon, authenticated;
grant execute on function public.sala_vivo(text, text, text, int[], int),
                          public.sala_responder(uuid, text, int, int, boolean),
                          public.sala_reportar(uuid, text, int, jsonb),
                          public.sala_resumen(text)
  to anon, authenticated;
