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
