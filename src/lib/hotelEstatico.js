/* ─────────────────────────────────────────────────────────────────────
   Datos de respaldo del hero.

   En producción ya no se usan: la portada llega prerenderizada con los
   datos reales de Supabase (ver scripts/prerender.js). Solo entran en
   juego en `npm run dev`, donde no hay prerender, y en el aviso de error
   de la sección de salas (email y teléfono).

   Si cambian la dirección, el teléfono o el email, actualizarlos aquí.
   ───────────────────────────────────────────────────────────────────── */

export const HOTEL_ESTATICO = {
  location: 'Madrid · Plaza de España',
  address: 'C/ Juan Álvarez Mendizábal, 17, 28008 Madrid',
  phone: '+34 917 583 605',
  whatsapp: '+34 671 613 939',
  email: 'reservas@suitesviena.es',
  website: 'https://www.suitesviena.com',
}

/* Mismo formato que calcula Hero.jsx a partir de las salas. */
export const DATOS_HERO_ESTATICOS = {
  nSalas: 3,
  minM2: 27,
  maxM2: 61,
  maxPax: 40,
  desde: 190,
  moneda: '€',
  luzNatural: true,
}