-- =====================================================================
-- EMPEZAR DE CERO — borra TODAS las reservas y TODOS los bloqueos
--
-- NO toca: salas, precios, extras, fotos, ofertas, FAQ, hotel ni el
-- usuario del panel. A las ofertas solo se les pone el contador de
-- usos a 0.
--
-- NO SE PUEDE DESHACER. Úsalo solo antes del lanzamiento.
-- =====================================================================


-- ───── PASO 1: MIRAR QUÉ SE VA A BORRAR (ejecutar solo) ─────
select 'reservas'           as que, count(*) as cuantas from public.bookings
union all
select 'fechas de reservas',          count(*) from public.booking_dates
union all
select 'extras de reservas',          count(*) from public.booking_extras
union all
select 'bloqueos manuales',           count(*) from public.blocked_dates
union all
select 'ofertas con usos > 0',        count(*) from public.offers where uses > 0;


-- ───── PASO 2: BORRAR (pegar solo este bloque y Run) ─────
begin;

delete from public.booking_extras;
delete from public.booking_dates;
delete from public.bookings;

-- Todos los bloqueos del calendario. Si la directora ya ha puesto
-- alguno REAL que quiera conservar, borra esta línea antes de ejecutar.
delete from public.blocked_dates;

-- Las ofertas se quedan, pero con el contador a cero.
update public.offers set uses = 0, updated_at = now() where uses <> 0;

commit;


-- ───── PASO 3: COMPROBAR (ejecutar solo) ─────
-- Todo debe dar 0.
--
-- select
--   (select count(*) from public.bookings)       as reservas,
--   (select count(*) from public.booking_dates)  as fechas,
--   (select count(*) from public.booking_extras) as extras,
--   (select count(*) from public.blocked_dates)  as bloqueos,
--   (select coalesce(sum(uses), 0) from public.offers) as usos_ofertas;
