-- ─────────────────────────────────────────────────────────────────────
-- PREGUNTAS FRECUENTES
--
-- Ejecutar entero en el editor SQL de Supabase. Es idempotente: se
-- puede volver a lanzar sin romper nada.
--
-- NO LLEVA DATOS DE EJEMPLO A PROPÓSITO. Con la tabla vacía, la web
-- pública enseña las preguntas que genera src/lib/faq.js a partir de
-- los precios y las salas que hay en la base de datos, así que están
-- siempre al día solas. En cuanto se guarda aquí la primera pregunta,
-- mandan estas y las automáticas dejan de salir.
--
-- Desde el panel hay un botón que copia las automáticas a esta tabla,
-- para tenerlas como punto de partida y luego reescribirlas.
-- ─────────────────────────────────────────────────────────────────────

create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  hotel_id    uuid not null references public.hotels (id) on delete cascade,
  question    text not null,
  answer      text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- La web pública siempre pide por hotel y ordena por sort_order.
create index if not exists faqs_hotel_orden_idx
  on public.faqs (hotel_id, sort_order);

alter table public.faqs enable row level security;

-- ── Permisos ─────────────────────────────────────────────────────────
--
-- Lectura anónima SOLO de las activas: una pregunta desactivada es un
-- borrador, y sin el filtro en la propia política cualquiera podría
-- leerla saltándose el .eq('is_active', true) del cliente.
--
-- Escritura solo con sesión. El panel entra como `authenticated`, así
-- que ahí sí ve y toca todo.

drop policy if exists "faqs lectura publica"  on public.faqs;
drop policy if exists "faqs gestion panel"    on public.faqs;

create policy "faqs lectura publica"
  on public.faqs for select
  to anon
  using (is_active = true);

create policy "faqs gestion panel"
  on public.faqs for all
  to authenticated
  using (true)
  with check (true);

-- ── updated_at automático ────────────────────────────────────────────
-- Sin esto habría que acordarse de mandarlo en cada UPDATE desde el
-- cliente, y el día que a alguien se le olvide la fecha miente.

create or replace function public.faqs_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists faqs_updated_at on public.faqs;

create trigger faqs_updated_at
  before update on public.faqs
  for each row
  execute function public.faqs_touch_updated_at();
