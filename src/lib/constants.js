// ── Labels centralizadas ──

export const LAYOUT_LABELS = {
  teatro:   'Teatro',
  u:        'En U',
  escuela:  'Escuela',
  imperial: 'Imperial',
}

export const JORNADA_LABELS = {
  manana:   'Mañana (9:00 – 14:00)',
  tarde:    'Tarde (15:00 – 20:00)',
  completo: 'Día completo (9:00 – 20:00)',
}

export const JORNADA_LABELS_SHORT = {
  manana:   'Mañana (9–14h)',
  tarde:    'Tarde (15–20h)',
  completo: 'Día completo (9–20h)',
}

export const JORNADAS = [
  { id: 'manana',   name: 'Mañana',       hours: '9:00–14:00',  priceKey: 'halfDay' },
  { id: 'completo', name: 'Día completo', hours: '9:00–20:00',  priceKey: 'fullDay' },
  { id: 'tarde',    name: 'Tarde',        hours: '15:00–20:00', priceKey: 'halfDay' },
]

/* ─────────────────────────────────────────────────────────────────────
   COMPOSICIÓN DE SALAS

   No hay tres salas físicas: hay dos, y una tercera que sale de juntar
   las dos. La ocupación se contagia en LOS DOS SENTIDOS:

     · Ocupar Viena o Capellanes hace imposible la combinada, porque le
       falta la mitad del espacio.
     · Ocupar la combinada ocupa las dos, porque la combinada ES las dos.

   No hay matices: da igual que sea una reserva confirmada o un bloqueo
   manual. Si el espacio unido no está disponible, ninguna de sus partes
   lo está tampoco.

   Sin esto, el sistema vende el mismo espacio dos veces: bloqueas Viena
   el martes por la mañana y Viena + Capellanes sigue apareciendo libre
   ese martes a jornada completa.

   Slugs verificados contra la base de datos.

   A futuro esto debería ser una columna de la tabla rooms, para poder
   cambiarlo desde el panel sin tocar código. Con dos salas y una
   combinación, un mapa aquí es suficiente y se lee de un vistazo.
   ───────────────────────────────────────────────────────────────────── */
export const SALAS_COMPUESTAS = {
  'viena-capellanes': ['viena', 'capellanes'],
}

/** Las salas físicas que forman una combinada. Vacío si no lo es. */
export function partesDe(slug) {
  return SALAS_COMPUESTAS[slug] || []
}

/** Las combinadas que incluyen esta sala. */
export function salasQueContienen(slug) {
  return Object.entries(SALAS_COMPUESTAS)
    .filter(([, partes]) => partes.includes(slug))
    .map(([combinada]) => combinada)
}

export function esCompuesta(slug) {
  return Boolean(SALAS_COMPUESTAS[slug])
}

/** Todas las salas que quedan ocupadas cuando se ocupa `slug`: sus
 *  partes si es combinada, y las combinadas que la incluyen si es una
 *  parte. En los dos sentidos, siempre. */
export function salasRelacionadas(slug) {
  return [...new Set([...partesDe(slug), ...salasQueContienen(slug)])]
}

/* ── Color de cada sala ─────────────────────────────────────────────
   Los chips del calendario necesitan distinguirse de un vistazo, y con
   un solo color de acento no se puede. Misma solución que el sistema de
   diseño usa para los badges de puesto: un mapa con color, fondo y
   borde, aplicado en línea; la clase solo pone la forma.

   Fuera de estos chips, el acento granate sigue siendo el único color
   fuerte de la interfaz. */
export const COLORES_SALA = {
  'viena-capellanes': { color: '#922B21', bg: '#FDF2F2', border: '#F5C6C6' },
  'viena':            { color: '#0D9488', bg: '#E1F5EE', border: '#99E2CC' },
  'capellanes':       { color: '#4F46E5', bg: '#EEEDFE', border: '#C7C3F9' },
}

export const COLOR_SALA_POR_DEFECTO = { color: '#6B6B6B', bg: '#F4F4F4', border: '#E5E5E5' }

export function colorSala(slug) {
  return COLORES_SALA[slug] || COLOR_SALA_POR_DEFECTO
}