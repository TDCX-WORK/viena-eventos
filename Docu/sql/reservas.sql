-- ═══════════════════════════════════════════════════════════════════
--  Reservas — cambios de base de datos
--  Ejecutar en el SQL Editor de Supabase, por bloques, leyendo cada uno.
-- ═══════════════════════════════════════════════════════════════════


-- ── 1 · Policies que faltan ────────────────────────────────────────
-- Hoy el admin puede LEER booking_dates y booking_extras pero no
-- escribirlas, y no puede borrar reservas. En cuanto la pantalla quiera
-- editar fechas o eliminar una reserva, fallará en silencio.

create policy "Admin write booking_dates"
  on public.booking_dates for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin write booking_extras"
  on public.booking_extras for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Admin delete bookings"
  on public.bookings for delete
  using (auth.role() = 'authenticated');


-- ── 2 · Acotar el insert público ───────────────────────────────────
-- "Public insert bookings" tiene with_check = true, o sea sin condición.
-- La key anónima va en el bundle del navegador, así que cualquiera puede
-- insertar una reserva ya confirmada con precio cero. Con el bloqueo de
-- fechas del punto 4, eso sería una forma de dejar el hotel sin
-- disponibilidad desde la consola.

alter policy "Public insert bookings"
  on public.bookings
  with check (
    status = 'pending'
    and total_price >= 0
    and contact_name <> ''
    and contact_email <> ''
  );


-- ── 3 · Realtime ───────────────────────────────────────────────────
-- Para que el punto verde "En vivo" del Inicio sea de verdad.
-- Comprueba antes qué hay publicado:
--   select tablename from pg_publication_tables
--   where pubname = 'supabase_realtime';

alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.booking_dates;


-- ── 4 · El solapamiento ────────────────────────────────────────────
-- El problema: la web pública decide qué días están libres mirando SOLO
-- la tabla blocked_dates. Las reservas viven en bookings + booking_dates,
-- que nadie cruza. Resultado: confirmar una reserva no impide que otro
-- cliente reserve exactamente el mismo hueco.
--
-- Se puede resolver de dos maneras:
--
--   a) Copiar las fechas confirmadas a blocked_dates al confirmar. Deja
--      el mismo dato en dos sitios y hay que acordarse de borrarlo al
--      cancelar. Se desincroniza el día que algo falle a medias.
--
--   b) Que la web pública lea también las reservas confirmadas. Un solo
--      origen de verdad, sin escrituras y sin nada que mantener.
--
-- Se elige (b). Pero booking_dates solo la puede leer un usuario con
-- sesión, y con razón: ahí dentro hay datos de clientes. La solución es
-- una vista que exponga ÚNICAMENTE sala, día y jornada: qué está
-- ocupado, sin decir por quién.

create or replace view public.occupied_slots as
select
  b.room_id,
  d.date,
  d.jornada
from public.bookings b
join public.booking_dates d on d.booking_id = b.id
where b.status = 'confirmed';

-- La vista es propiedad de postgres, así que se salta el RLS de las
-- tablas de debajo. Eso es justo lo que se busca aquí, y es seguro
-- porque no expone ni un nombre ni un email. Si algún día se le añaden
-- columnas, hay que volver a pensarlo.
grant select on public.occupied_slots to anon, authenticated;


-- ── 5 · Red de seguridad en la propia base de datos (opcional) ──────
-- El panel ya avisa antes de confirmar algo que se solapa, pero eso es
-- una comprobación del navegador y se puede saltar. Este índice hace que
-- la base de datos lo impida de raíz: dos jornadas iguales, en la misma
-- sala y el mismo día, no pueden estar las dos confirmadas.
--
-- OJO: no cubre el caso "completo contra mañana", que son jornadas
-- distintas y sí se solapan. Para eso hace falta un trigger o una
-- restricción de exclusión. El aviso del panel sí lo cubre.
--
-- Descomentar solo cuando estés seguro de que no hay ya duplicados:
   select room_id, date, jornada, count(*)
   from occupied_slots group by 1,2,3 having count(*) > 1;

 create unique index reserva_unica_por_hueco
   on public.booking_dates (booking_id, date, jornada);


-- ── 6 · Índice que necesita Disponibilidad ─────────────────────────
-- AdminDisponibilidad hace upsert con onConflict 'room_id,date,jornada'.
-- Eso EXIGE un índice único sobre esas tres columnas o el upsert falla.
-- Comprueba si existe antes de crearlo:
   select indexname, indexdef from pg_indexes
   where schemaname = 'public' and tablename = 'blocked_dates';

 create unique index if not exists blocked_dates_unico
   on public.blocked_dates (room_id, date, jornada);
