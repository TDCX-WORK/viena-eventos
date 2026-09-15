/* ─────────────────────────────────────────────────────────────────────
   Datos de respaldo para pintar el hero ANTES de que responda Supabase.

   El hero es lo primero que se ve y su foto es el LCP de la página. Si
   esperara a la base de datos, Google cronometraría la consulta además
   de la foto. Con esto el hero se pinta en cuanto carga el JavaScript y,
   cuando llegan los datos reales, las cifras se sustituyen sin mover
   nada de sitio (mismo texto, mismo hueco).

   MANTENER SINCRONIZADO con Supabase y con index.html (texto SEO y
   JSON-LD). Si se cambia una tarifa, una capacidad o un teléfono en el
   panel, actualizar aquí también. Si no, durante medio segundo se verá
   la cifra vieja y después saltará a la nueva.
   ───────────────────────────────────────────────────────────────────── */

export const HOTEL_ESTATICO = {
  location: 'Madrid · Plaza de España',
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