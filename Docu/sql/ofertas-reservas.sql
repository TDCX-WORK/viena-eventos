-- ═══════════════════════════════════════════════════════════════════
--  Ofertas — validación del alta de reservas
--  Ejecutar después de sql/ofertas-seguridad.sql.
--
--  QUÉ ARREGLA
--
--  1. La policy de INSERT de `bookings` no comprobaba nada. Con la
--     clave anónima se podía insertar una reserva con total 1 €, o peor,
--     con status 'confirmed', saltándose la revisión del hotel.
--
--  2. `registrar_uso_oferta` estaba expuesta a anon: cualquiera podía
--     llamarla en bucle desde la consola y quemar el cupo de una oferta
--     limitada sin reservar nada. Se sustituye por un trigger, así el
--     contador solo sube cuando entra una reserva de verdad.
--
--  LO QUE ESTO NO ARREGLA, Y CONVIENE TENER CLARO
--
--  El precio lo sigue calculando el navegador. Estas reglas comprueban
--  que los números sean coherentes entre sí, no que sean los correctos:
--  alguien decidido puede mandar una reserva con base_price 10 € y
--  cuadrará. Blindarlo del todo exige recalcular el precio en el
--  servidor, lo que obliga a mantener el motor de ofertas duplicado en
--  PL/pgSQL. Como la reserva entra siempre como 'pending' y el hotel la
--  confirma a mano, la defensa real es que el panel recalcule el precio
--  al abrir la reserva y avise si no coincide.
-- ═══════════════════════════════════════════════════════════════════


-- ── 1 · El alta de reservas, con condiciones ───────────────────────
--
-- `with check` se evalúa sobre la fila YA modificada por los triggers
-- BEFORE, así que la corrección del punto 2 no puede dejarla incoherente.
--
-- La tolerancia de un céntimo es por el redondeo de los porcentajes: un
-- 15 % sobre 190 € no da un número redondo y exigir igualdad exacta
-- rechazaría reservas buenas.

drop policy if exists "Public insert bookings" on public.bookings;

create policy "Public insert bookings"
  on public.bookings for insert
  with check (
    -- Una reserva nace pendiente. Confirmarla es cosa del panel.
    status = 'pending'

    and base_price      >= 0
    and extras_price    >= 0
    and discount_amount >= 0
    and total_price     >= 0

    -- Un descuento no puede superar lo que se está cobrando.
    and discount_amount <= base_price + extras_price

    -- Y las cuatro cifras tienen que contar la misma historia.
    and abs(total_price - (base_price + extras_price - discount_amount)) <= 0.01
  );


-- ── 2 · El contador de usos, por trigger ───────────────────────────
--
-- Antes lo llamaba el navegador. Ahora sube solo cuando se inserta la
-- reserva, en la misma transacción: no se puede quemar el cupo sin
-- reservar, ni queda una reserva sin contar si falla la segunda llamada.
--
-- Además resuelve la carrera del final: entre que el cliente ve el
-- descuento y le da a enviar, la oferta puede haberse agotado o
-- apagado. Si eso pasa, la reserva NO se rechaza —el cliente no tiene
-- la culpa y perder la reserva es peor— sino que entra sin descuento y
-- con el precio recalculado. El hotel verá el importe completo.
--
-- El nombre y el código de la oferta se copian aquí, del servidor, y no
-- se cogen de lo que mande el cliente.

create or replace function public.bookings_aplicar_oferta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.offers%rowtype;
begin
  -- Sin oferta, se limpia cualquier resto que venga del cliente.
  if new.offer_id is null then
    new.offer_name      := null;
    new.offer_code      := null;
    new.discount_amount := 0;
    new.total_price     := new.base_price + new.extras_price;
    return new;
  end if;

  -- El cupo se comprueba dentro del propio UPDATE: comprobarlo antes en
  -- un SELECT aparte deja una rendija entre las dos consultas. El UPDATE
  -- bloquea la fila, así que dos reservas simultáneas se ponen en fila.
  update public.offers
     set uses = uses + 1,
         updated_at = now()
   where id = new.offer_id
     and is_active = true
     and (max_uses is null or uses < max_uses)
  returning * into o;

  if not found then
    new.offer_id        := null;
    new.offer_name      := null;
    new.offer_code      := null;
    new.discount_amount := 0;
    new.total_price     := new.base_price + new.extras_price;
    return new;
  end if;

  new.offer_name := o.name;
  new.offer_code := o.code;
  return new;
end;
$$;

drop trigger if exists bookings_oferta on public.bookings;

create trigger bookings_oferta
  before insert on public.bookings
  for each row execute function public.bookings_aplicar_oferta();


-- ── 3 · Fuera la función que llamaba el navegador ──────────────────
-- La reemplaza el trigger de arriba. Mientras siga expuesta a anon, el
-- cupo de una oferta se puede quemar desde la consola del navegador.

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


-- ── 4 · Comprobación ───────────────────────────────────────────────
--
-- Las dos primeras deben fallar. La tercera debe entrar, y dejar
-- `uses` de la oferta un punto más alto.
--
 insert into public.bookings (hotel_id, room_id, reference, status,
   contact_name, contact_email, contact_phone,
   base_price, extras_price, discount_amount, total_price)
 values ('...', '...', 'TEST-1', 'confirmed', 'Test', 'a@b.c', '600',
   350, 0, 0, 350);    rechazada: status

-- insert into public.bookings (... , base_price, extras_price, discount_amount, total_price)
-- values (..., 350, 0, 0, 1);   -- rechazada: las cifras no cuadran
