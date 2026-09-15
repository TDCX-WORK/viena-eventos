/* Constantes y helpers del formulario de ofertas.
 * Viven fuera del componente para que OfertaForm.jsx solo exporte
 * componentes y Fast Refresh funcione. */

export const OFERTA_VACIA = {
  name: '',
  description: '',
  discount_type: 'percent',
  discount_value: '',
  starts_on: '',
  ends_on: '',
  room_slugs: [],
  jornadas: [],
  weekdays: [],
  min_days: 1,
  min_attendees: '',
  min_amount: '',
  min_lead_days: '',
  max_lead_days: '',
  free_extra_ids: [],
  code: '',
  max_uses: '',
  priority: 0,
  is_active: true,
}

/** Pasa una fila de la base de datos al formato del formulario. Los
 *  null se vuelven cadena vacía porque un <input> controlado con value
 *  null se queda descontrolado y React protesta. */
export function aFormulario(oferta) {
  if (!oferta) return { ...OFERTA_VACIA }
  return {
    name: oferta.name || '',
    description: oferta.description || '',
    discount_type: oferta.discount_type || 'percent',
    discount_value: oferta.discount_value ?? '',
    starts_on: oferta.starts_on || '',
    ends_on: oferta.ends_on || '',
    room_slugs: oferta.room_slugs || [],
    jornadas: oferta.jornadas || [],
    weekdays: oferta.weekdays || [],
    min_days: oferta.min_days ?? 1,
    min_attendees: oferta.min_attendees ?? '',
    min_amount: oferta.min_amount ?? '',
    min_lead_days: oferta.min_lead_days ?? '',
    max_lead_days: oferta.max_lead_days ?? '',
    free_extra_ids: oferta.free_extra_ids || [],
    code: oferta.code || '',
    max_uses: oferta.max_uses ?? '',
    priority: oferta.priority ?? 0,
    is_active: oferta.is_active !== false,
  }
}

export function validar(datos) {
  const errores = {}
  if (!datos.name.trim()) errores.name = 'Ponle un nombre'
  if (datos.discount_value === '' || Number(datos.discount_value) <= 0) {
    errores.discount_value = 'Tiene que ser mayor que cero'
  }
  if (datos.discount_type === 'percent' && Number(datos.discount_value) > 100) {
    errores.discount_value = 'Un porcentaje no puede pasar de 100'
  }
  if (datos.starts_on && datos.ends_on && datos.starts_on > datos.ends_on) {
    errores.ends_on = 'La fecha de fin es anterior a la de inicio'
  }
  if (datos.min_lead_days && datos.max_lead_days &&
      Number(datos.min_lead_days) > Number(datos.max_lead_days)) {
    errores.max_lead_days = 'El máximo de antelación es menor que el mínimo'
  }
  return errores
}

/* Fecha de referencia para la vista previa. Se calcula una sola vez al
 * cargar el módulo, así el componente solo lee una constante estable y
 * el render se mantiene puro (nada de leer el reloj mientras se pinta). */
export const HOY = new Date()

export const JORNADAS = [
  { id: 'manana',   label: 'Mañana' },
  { id: 'tarde',    label: 'Tarde' },
  { id: 'completo', label: 'Día completo' },
]

/** Añade o quita un valor de una lista sin mutarla. */
export function alternar(lista, valor) {
  return lista.includes(valor) ? lista.filter(v => v !== valor) : [...lista, valor]
}