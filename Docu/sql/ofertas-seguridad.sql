-- ═══════════════════════════════════════════════════════════════════
--  Ofertas — seguridad de los códigos y contador de usos
--  Ejecutar en el SQL Editor de Supabase, después de sql/ofertas.sql.
--
--  QUÉ ARREGLA
--
--  1. La policy "Public read offers" dejaba leer la tabla entera con la
--     clave anónima, columna `code` incluida. Cualquiera con las
--     DevTools abiertas veía todos los códigos promocionales activos.
--     Se sustituye por una vista que solo enseña las ofertas
--     automáticas y que no tiene la columna `code`.
--
--  2. Los códigos pasan a comprobarse de uno en uno con una función.
--     Sin lista que descargar, no hay nada que enumerar.
--
--  3. `registrar_uso_oferta` subía el contador sin mirar el cupo. Dos
--     reservas a la vez se pisaban y `max_uses` no limitaba nada.
-- ═══════════════════════════════════════════════════════════════════


-- ── 1 · Fuera la lectura pública de la tabla ───────────────────────
-- El panel sigue leyendo con "Admin write offers", que es FOR ALL y
-- por tanto también cubre el SELECT de las sesiones autenticadas.

drop policy if exists "Public read offers" on public.offers;


-- ── 2 · Vista pública: solo las ofertas automáticas ────────────────
--
-- Sin la columna `code`. Las ofertas que sí llevan código no salen
-- aquí: se piden una a una con la función del punto 3.
--
-- `needs_code` se queda en false a propósito. El motor de JS mira
-- `oferta.code` para decidir si hace falta escribir algo; en las filas
-- de esta vista ese campo no existe, así que se aplican solas, que es
-- justo lo que son.
--
-- Se filtran también las caducadas: no hace falta mandar al navegador
-- ofertas de marzo pasado.

create or replace view public.offers_publicas as
  select
    id,
    hotel_id,
    name,
    description,
    discount_type,
    discount_value,
    starts_on,
    ends_on,
    room_slugs,
    jornadas,
    weekdays,
    min_days,
    min_attendees,
    min_amount,
    min_lead_days,
    max_lead_days,
    free_extra_ids,
    max_uses,
    uses,
    priority,
    is_active,
    false as needs_code
  from public.offers
  where is_active = true
    and code is null
    and (ends_on is null or ends_on >= current_date)
    and (max_uses is null or uses < max_uses);

-- IMPORTANTE: security_invoker = off. Con `on`, la vista se ejecutaría
-- con los permisos de quien consulta, la RLS de `offers` se aplicaría y
-- como acabamos de quitar la policy pública, anon vería cero filas. Con
-- `off` la vista corre con los permisos de su dueño: es la vista la que
-- decide qué columnas y qué filas se ven, que es exactamente lo que
-- queremos aquí.
alter view public.offers_publicas set (security_invoker = off);

grant select on public.offers_publicas to anon, authenticated;


-- ── 3 · Comprobar un código, de uno en uno ─────────────────────────
--
-- Devuelve la oferta entera —esta vez sí con `code`, que el cliente ya
-- lo ha escrito— o ninguna fila si no existe, está apagada, caducada o
-- agotada. No dice cuál de las cuatro cosas: contestar "existe pero
-- está caducado" ya es filtrar información.
--
-- La comparación va en minúsculas, igual que el índice único de la
-- tabla y que el motor de JS.

create or replace function public.oferta_por_codigo(p_codigo text)
returns table (
  id             uuid,
  hotel_id       uuid,
  name           text,
  description    text,
  discount_type  text,
  discount_value numeric,
  starts_on      date,
  ends_on        date,
  room_slugs     text[],
  jornadas       text[],
  weekdays       int[],
  min_days       int,
  min_attendees  int,
  min_amount     numeric,
  min_lead_days  int,
  max_lead_days  int,
  free_extra_ids uuid[],
  code           text,
  max_uses       int,
  uses           int,
  priority       int,
  is_active      boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.id, o.hotel_id, o.name, o.description,
    o.discount_type, o.discount_value,
    o.starts_on, o.ends_on,
    o.room_slugs, o.jornadas, o.weekdays,
    o.min_days, o.min_attendees, o.min_amount,
    o.min_lead_days, o.max_lead_days,
    o.free_extra_ids,
    o.code,
    o.max_uses, o.uses, o.priority, o.is_active
  from public.offers o
  where o.code is not null
    and lower(o.code) = lower(trim(p_codigo))
    and o.is_active = true
    and (o.ends_on is null or o.ends_on >= current_date)
    and (o.max_uses is null or o.uses < o.max_uses);
$$;

grant execute on function public.oferta_por_codigo(text) to anon, authenticated;


-- ── 4 · Contador de usos, esta vez con cupo ────────────────────────
--
-- El UPDATE bloquea la fila, así que dos reservas simultáneas se ponen
-- en fila en vez de leer las dos el mismo `uses` y sumar uno cada una.
-- La condición del cupo va dentro del propio UPDATE por lo mismo:
-- comprobarlo antes en un SELECT aparte deja una rendija entre las dos
-- consultas.
--
-- Devuelve true si se ha registrado y false si ya no quedaba cupo, para
-- que el front pueda avisar en vez de prometer un descuento que no se
-- va a aplicar.
--
-- La primera versión de esta función devolvía void, y `create or
-- replace` no puede cambiar el tipo de retorno de una función que ya
-- existe. Por eso se borra antes. El bucle recorre todas las versiones
-- que haya en public, sea cual sea su firma: así el script se puede
-- volver a ejecutar entero sin fallar y sin tener que acertar los
-- parámetros de la versión vieja.

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as firma
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'registrar_uso_oferta'
  loop
    execute 'drop function ' || f.firma || ' cascade';
  end loop;
end $$;

create function public.registrar_uso_oferta(oferta uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.offers
     set uses = uses + 1,
         updated_at = now()
   where id = oferta
     and is_active = true
     and (max_uses is null or uses < max_uses);

  return found;
end;
$$;

grant execute on function public.registrar_uso_oferta(uuid) to anon, authenticated;


-- ── 5 · Comprobación ───────────────────────────────────────────────
--
-- La primera debe devolver solo ofertas sin código y sin columna `code`.
-- La segunda, la oferta que corresponda al código que pongas.

 select * from public.offers_publicas;
 select * from public.oferta_por_codigo('VIENA25');
