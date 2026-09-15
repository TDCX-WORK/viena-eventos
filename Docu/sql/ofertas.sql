-- ═══════════════════════════════════════════════════════════════════
--  Ofertas — cambios de base de datos
--  Ejecutar en el SQL Editor de Supabase.
-- ═══════════════════════════════════════════════════════════════════


-- ── 1 · La tabla ───────────────────────────────────────────────────
--
-- UNA SOLA TABLA PARA TODOS LOS TIPOS DE OFERTA. No hay una tabla por
-- cada tipo ("descuento de temporada", "última hora", "código") porque
-- todos son lo mismo con distintos filtros: un descuento que se aplica
-- si se cumplen unas condiciones. Dejando los filtros vacíos sale una
-- oferta general; rellenando unos u otros salen todos los casos.
--
-- Ejemplos de lo que se puede montar con estos campos:
--   Agosto -20%              → starts_on/ends_on + percent 20
--   Lunes y martes -10%      → weekdays {1,2} + percent 10
--   3 días o más -15%        → min_days 3 + percent 15
--   Última hora              → max_lead_days 7 + percent 15
--   Reserva anticipada       → min_lead_days 60 + percent 10
--   Código VIENA25           → code 'VIENA25' + percent 25
--   Sala Viena a 199 €/día   → room_slugs {viena} + day_price 199
--   Coffee break gratis      → free_extra_ids con el id del extra
--
-- Los arrays vacíos significan "sin restricción", que es distinto de
-- NULL: un array vacío se lee como "todas las salas", no como "ninguna".
-- Por eso llevan default '{}' y NOT NULL.

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hotels(id) on delete cascade,

  name        text not null,
  description text,

  -- QUÉ DESCUENTA
  --   percent    → un porcentaje sobre el precio de sala de los días que cumplen
  --   fixed      → un importe fijo, una sola vez por reserva
  --   day_price  → precio especial por día: cada día que cumple cuesta esto
  discount_type  text    not null default 'percent'
                 check (discount_type in ('percent', 'fixed', 'day_price')),
  discount_value numeric not null check (discount_value >= 0),

  -- CUÁNDO VALE (fechas del evento, no de la reserva)
  starts_on date,
  ends_on   date,

  -- A QUÉ APLICA. Vacío = sin restricción.
  room_slugs text[] not null default '{}',
  jornadas   text[] not null default '{}',
  weekdays   int[]  not null default '{}',   -- 1 = lunes … 7 = domingo (ISO)

  -- CONDICIONES
  min_days      int     not null default 1,
  min_attendees int,
  min_amount    numeric,

  -- ANTELACIÓN, en días entre hoy y el primer día del evento
  min_lead_days int,   -- reserva anticipada: al menos estos días antes
  max_lead_days int,   -- última hora: como mucho estos días antes

  -- EXTRAS QUE SE REGALAN con esta oferta
  free_extra_ids uuid[] not null default '{}',

  -- CÓDIGO. NULL = se aplica sola, sin que el cliente haga nada.
  code text,

  -- CONTROL
  max_uses  int,
  uses      int     not null default 0,
  priority  int     not null default 0,
  is_active boolean not null default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Un rango al revés no es un error del cliente, es un error de quien
  -- crea la oferta, y conviene que salte aquí y no dentro de tres meses.
  constraint rango_valido check (starts_on is null or ends_on is null or starts_on <= ends_on)
);

-- Los códigos se comparan sin distinguir mayúsculas, así que no puede
-- haber un 'viena25' y un 'VIENA25' a la vez.
create unique index if not exists offers_code_unico
  on public.offers (lower(code)) where code is not null;

create index if not exists offers_activas on public.offers (is_active, starts_on, ends_on);


-- ── 2 · Qué oferta se aplicó a cada reserva ────────────────────────
--
-- Sin esto, dentro de seis meses nadie sabrá por qué una reserva costó
-- 280 € en vez de 350. Se guarda el importe además del id porque la
-- oferta se puede editar o borrar después: el descuento que se le
-- prometió al cliente no puede cambiar retroactivamente.

alter table public.bookings add column if not exists offer_id        uuid references public.offers(id) on delete set null;
alter table public.bookings add column if not exists offer_name      text;
alter table public.bookings add column if not exists offer_code      text;
alter table public.bookings add column if not exists discount_amount numeric not null default 0;


-- ── 3 · Permisos ───────────────────────────────────────────────────
-- Mismo patrón que el resto de tablas: lectura pública, escritura solo
-- con sesión. La web pública necesita leerlas para poder calcular el
-- precio con descuento.

alter table public.offers enable row level security;

create policy "Public read offers"
  on public.offers for select
  using (is_active = true);

create policy "Admin write offers"
  on public.offers for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ── 4 · Contador de usos ───────────────────────────────────────────
-- Se incrementa desde el navegador con el anon key, así que hay que
-- exponerlo como función y no dar UPDATE sobre la tabla: si no,
-- cualquiera podría editar el descuento de cualquier oferta.
--
-- security definer para que corra con los permisos del dueño de la
-- función, y search_path fijado para que nadie pueda colar un esquema
-- suyo por delante.

create or replace function public.registrar_uso_oferta(oferta uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.offers set uses = uses + 1, updated_at = now() where id = oferta;
$$;

grant execute on function public.registrar_uso_oferta(uuid) to anon, authenticated;


-- ── 5 · Comprobación ───────────────────────────────────────────────
 select id, name, discount_type, discount_value, starts_on, ends_on,
        room_slugs, weekdays, code, is_active, uses
 from public.offers order by priority desc, created_at desc;
