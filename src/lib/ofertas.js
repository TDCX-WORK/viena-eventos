/* ─────────────────────────────────────────────────────────────────────
   Motor de ofertas.

   FUNCIONES PURAS, SIN REACT Y SIN SUPABASE. Lo usan dos sitios: la web
   pública para calcular lo que paga el cliente, y el panel para enseñar
   una vista previa antes de guardar una oferta. Si el cálculo viviera
   dentro de un componente, el panel enseñaría un número y la web
   cobraría otro en cuanto alguien tocara uno de los dos.

   SOLO SE APLICA UNA OFERTA: la que más rebaja al cliente. Acumular
   descuentos se descontrola enseguida y acabas regalando salas sin
   enterarte. Si dos empatan, gana la de mayor `priority`.

   NINGÚN DESCUENTO TOCA LOS EXTRAS. El porcentaje se aplica al precio
   de sala y el importe fijo va topado a ese mismo precio. Es lo que
   espera un hotel cuando dice "agosto un 20% menos": los coffee breaks
   no se regalan por temporada. Para regalar un extra está
   `free_extra_ids`, que es explícito.
   ───────────────────────────────────────────────────────────────────── */

export const TIPOS_DESCUENTO = {
  percent:   { id: 'percent',   label: 'Porcentaje',        sufijo: '%',     ayuda: 'Se resta ese % del precio de sala de cada día que cumpla las condiciones. No toca los extras.' },
  fixed:     { id: 'fixed',     label: 'Importe fijo',      sufijo: '€',     ayuda: 'Se resta esa cantidad UNA SOLA VEZ, aunque la reserva dure varios días. Nunca rebaja más de lo que cuesta la sala: no se come el catering.' },
  day_off:   { id: 'day_off',   label: 'Rebaja por día',    sufijo: '€/día', ayuda: 'Se RESTAN esos euros a cada día que cumpla las condiciones. Ej.: 30 sobre una sala de 450 € la deja en 420 €.' },
  day_price: { id: 'day_price', label: 'Precio final/día',  sufijo: '€/día', ayuda: 'Cada día que cumpla pasa a COSTAR esa cantidad: no se resta, la sustituye. Ej.: 30 sobre una sala de 450 € la deja en 30 €.' },
}

export const DIAS_SEMANA = [
  { id: 1, corto: 'L', label: 'Lunes' },
  { id: 2, corto: 'M', label: 'Martes' },
  { id: 3, corto: 'X', label: 'Miércoles' },
  { id: 4, corto: 'J', label: 'Jueves' },
  { id: 5, corto: 'V', label: 'Viernes' },
  { id: 6, corto: 'S', label: 'Sábado' },
  { id: 7, corto: 'D', label: 'Domingo' },
]

/** Día de la semana en ISO: 1 lunes … 7 domingo.
 *  getDay() devuelve 0 para el domingo, que no sirve para ordenar una
 *  semana europea. */
export function diaSemanaISO(fecha) {
  return ((fecha.getDay() + 6) % 7) + 1
}

/** yyyy-mm-dd en hora local. toISOString() daría UTC y en España, de
 *  madrugada, cambia el día. */
export function aISO(fecha) {
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${m}-${d}`
}

/** Días completos entre dos fechas, ignorando la hora. */
export function diasEntre(desde, hasta) {
  const a = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate())
  const b = new Date(hasta.getFullYear(), hasta.getMonth(), hasta.getDate())
  return Math.round((b - a) / 86400000)
}

const vacio = (arr) => !Array.isArray(arr) || arr.length === 0

/* ─────────────────────────────────────────────────────────────────────
   ¿Se puede aplicar esta oferta?

   Devuelve { aplica, dias, motivo }. `dias` son los días de la reserva
   que cumplen los filtros de fecha, jornada y día de la semana: no
   tienen por qué ser todos. Una oferta de "lunes y martes" sobre una
   reserva de lunes y miércoles descuenta solo el lunes, que es lo que
   un hotel quiere decir con eso.

   `motivo` explica por qué NO aplica. Es para la vista previa del
   panel: sin él, quien crea una oferta ve "0 €" y no sabe si se ha
   equivocado en las fechas, en la sala o en el mínimo de días.
   ───────────────────────────────────────────────────────────────────── */
export function evaluarOferta(oferta, contexto) {
  const {
    roomSlug,
    dias = [],           // [{ fecha: Date, jornada, precio }]
    asistentes = 0,
    baseTotal = 0,       // precio de sala de TODA la reserva
    codigo = null,
    hoy = new Date(),
  } = contexto

  if (!oferta.is_active) return { aplica: false, motivo: 'Está desactivada' }

  if (oferta.max_uses != null && (oferta.uses || 0) >= oferta.max_uses) {
    return { aplica: false, motivo: 'Ha llegado a su máximo de usos' }
  }

  // Con código: solo cuenta si el cliente lo ha escrito. Sin código:
  // se aplica sola.
  if (oferta.code) {
    const escrito = (codigo || '').trim().toLowerCase()
    if (escrito !== oferta.code.trim().toLowerCase()) {
      return { aplica: false, motivo: 'Necesita su código promocional' }
    }
  }

  if (!vacio(oferta.room_slugs) && !oferta.room_slugs.includes(roomSlug)) {
    return { aplica: false, motivo: 'No incluye esta sala' }
  }

  if (dias.length === 0) return { aplica: false, motivo: 'No hay fechas elegidas' }

  if (oferta.min_attendees != null && asistentes < oferta.min_attendees) {
    return { aplica: false, motivo: `Requiere al menos ${oferta.min_attendees} asistentes` }
  }

  // La antelación se mide desde HOY hasta el primer día del evento.
  const primerDia = [...dias].sort((a, b) => a.fecha - b.fecha)[0].fecha
  const antelacion = diasEntre(hoy, primerDia)

  if (oferta.min_lead_days != null && antelacion < oferta.min_lead_days) {
    return { aplica: false, motivo: `Hay que reservar con ${oferta.min_lead_days} días de antelación` }
  }
  if (oferta.max_lead_days != null && antelacion > oferta.max_lead_days) {
    return { aplica: false, motivo: `Solo para reservas a menos de ${oferta.max_lead_days} días` }
  }

  // Filtros que se evalúan día a día.
  const aplicables = dias.filter(d => {
    const iso = aISO(d.fecha)
    if (oferta.starts_on && iso < oferta.starts_on) return false
    if (oferta.ends_on   && iso > oferta.ends_on)   return false
    if (!vacio(oferta.jornadas) && !oferta.jornadas.includes(d.jornada || 'completo')) return false
    if (!vacio(oferta.weekdays) && !oferta.weekdays.includes(diaSemanaISO(d.fecha))) return false
    return true
  })

  if (aplicables.length === 0) {
    return { aplica: false, motivo: 'Ninguna de las fechas elegidas entra en la oferta' }
  }

  /* El mínimo de días se mide sobre los días que CUMPLEN la oferta, no
     sobre los que tenga la reserva.

     Antes se comparaba contra `dias.length`, y eso hacía que una oferta
     de "3 días o más, solo lunes a miércoles" se aplicara a una reserva
     de lunes, sábado y domingo: tres días reservados, uno solo dentro de
     la oferta, y el descuento salía igual. Un hotel que pide tres días
     está pidiendo tres días de los suyos. */
  const minDias = Number(oferta.min_days) || 1
  if (aplicables.length < minDias) {
    return {
      aplica: false,
      motivo: aplicables.length === dias.length
        ? `Requiere al menos ${minDias} días`
        : `Requiere al menos ${minDias} días dentro de la oferta (solo ${aplicables.length} de los elegidos entran)`,
    }
  }

  const baseAplicable = aplicables.reduce((t, d) => t + (d.precio || 0), 0)

  /* El importe mínimo se mide contra el precio de sala de TODA la
     reserva: ni el catering, ni solo los días que entran en la oferta.

     Sin catering porque los extras los factura otra empresa. Un umbral
     de "reservas desde 500 €" habla de lo que entra en caja del hotel;
     sumándole coffee breaks se activaría con 200 € de sala y 300 € de
     comida que el hotel ni cobra.

     Y sobre toda la reserva, no solo sobre los días que cumplen, porque
     antes reservar días de más podía tumbar la oferta: cinco días a
     350 € con una oferta de lunes a miércoles comparaba 700 € contra el
     mínimo teniendo 1.750 € de sala encima de la mesa. */
  if (oferta.min_amount != null && baseTotal < oferta.min_amount) {
    return {
      aplica: false,
      motivo: `Requiere un mínimo de ${oferta.min_amount} € de sala`,
    }
  }

  return { aplica: true, dias: aplicables, baseAplicable }
}

/** Cuánto rebaja esta oferta, dado que ya se sabe que aplica. */
export function calcularDescuento(oferta, { dias, baseAplicable }, contexto) {
  const { extrasIds = [], hotelExtras = [], asistentes = 0, baseTotal = 0 } = contexto

  let descuento = 0

  if (oferta.discount_type === 'percent') {
    descuento += baseAplicable * (Number(oferta.discount_value) / 100)
  } else if (oferta.discount_type === 'fixed') {
    /* Se resta una sola vez, sin repartir por días: es un cupón y así
       es como lo entiende el cliente.

       Pero topado al precio de sala de los días que cumplen. Sin el
       tope, un "−250 €" sobre la Sala Capellanes a 190 € se comía los
       190 de sala y 60 € de catering, que es comida que alguien tiene
       que comprar y cocinar. Los otros tres tipos no pueden hacer eso
       porque van atados al precio de sala; este era el único que se
       escapaba. Para regalar un extra está `free_extra_ids`, que es
       explícito. */
    descuento += Math.min(Number(oferta.discount_value), baseAplicable)
  } else if (oferta.discount_type === 'day_off') {
    // Se restan esos euros de cada día que cumple, sin bajar de cero:
    // un día de 200 € con una rebaja de 300 € cuesta 0, no −100.
    descuento += dias.reduce((t, d) => {
      return t + Math.min(d.precio || 0, Number(oferta.discount_value))
    }, 0)
  } else if (oferta.discount_type === 'day_price') {
    // Cada día que cumple pasa a costar el precio de la oferta. Si ya
    // costaba menos, no se le sube: una oferta nunca encarece.
    descuento += dias.reduce((t, d) => {
      const rebaja = (d.precio || 0) - Number(oferta.discount_value)
      return t + Math.max(0, rebaja)
    }, 0)
  }

  // Extras regalados. Se descuenta lo que costarían los que el cliente
  // haya elegido de verdad; regalar uno que no ha pedido no rebaja nada.
  const gratis = []
  let importeGratis = 0

  if (!vacio(oferta.free_extra_ids)) {
    oferta.free_extra_ids.forEach(id => {
      if (!extrasIds.includes(id)) return
      const extra = hotelExtras.find(e => e.id === id)
      if (!extra) return
      const personas = Math.max(asistentes, extra.minPersons || 1)
      const importe = (extra.pricePerPerson || 0) * personas
      importeGratis += importe
      gratis.push({ id, nombre: extra.name, importe })
    })
  }

  descuento += importeGratis

  /* Tope: la sala más lo que se haya regalado a propósito.

     Antes el tope era la reserva entera con extras, así que un descuento
     desbocado podía llegar al catering por la puerta de atrás. El
     catering lo factura otra empresa: la única forma de tocarlo es
     `free_extra_ids`, que es una decisión explícita de quien crea la
     oferta y sale escrita en el resumen del cliente. */
  const tope = baseTotal + importeGratis
  descuento = Math.min(descuento, tope)

  return { descuento: Math.round(descuento * 100) / 100, gratis }
}

/* ─────────────────────────────────────────────────────────────────────
   La única función que hace falta llamar desde fuera.

   contexto = {
     roomSlug, dias: [{ fecha: Date, jornada, precio }],
     extrasIds, hotelExtras, asistentes, baseTotal, extrasTotal,
     codigo, hoy
   }

   Devuelve siempre un objeto con la misma forma, aunque no aplique
   ninguna: así quien lo usa no tiene que comprobar si es null.
   ───────────────────────────────────────────────────────────────────── */
export function mejorOferta(ofertas, contexto) {
  const vacia = { oferta: null, descuento: 0, gratis: [], candidatas: [] }
  if (!Array.isArray(ofertas) || ofertas.length === 0) return vacia

  const candidatas = []

  ofertas.forEach(oferta => {
    const evaluacion = evaluarOferta(oferta, contexto)
    if (!evaluacion.aplica) {
      candidatas.push({ oferta, aplica: false, motivo: evaluacion.motivo, descuento: 0 })
      return
    }
    const { descuento, gratis } = calcularDescuento(oferta, evaluacion, contexto)
    candidatas.push({ oferta, aplica: true, descuento, gratis, dias: evaluacion.dias })
  })

  const validas = candidatas
    .filter(c => c.aplica && c.descuento > 0)
    .sort((a, b) =>
      b.descuento - a.descuento ||
      (b.oferta.priority || 0) - (a.oferta.priority || 0)
    )

  if (validas.length === 0) return { ...vacia, candidatas }

  const ganadora = validas[0]
  return {
    oferta: ganadora.oferta,
    descuento: ganadora.descuento,
    gratis: ganadora.gratis || [],
    dias: ganadora.dias,
    candidatas,
  }
}


/* ─────────────────────────────────────────────────────────────────────
   Escaparate: qué oferta anunciar en la tarjeta de una sala.

   Aquí todavía no hay reserva, así que no se puede saber si una oferta
   aplicará: depende de fechas, jornada, asistentes y días elegidos. Lo
   que se hace es simular la reserva MÁS PEQUEÑA posible —un solo día,
   sin extras— y quedarse con el mayor descuento. Por eso el precio se
   anuncia como "desde".

   Se simula con 0 asistentes a propósito: así una oferta con mínimo de
   asistentes no aplica y no se anuncia. Prometer de menos y cobrar lo
   dicho es preferible a lo contrario.

   SOBRE EL COSTE. La primera versión barría 90 días por sala y se
   ejecutaba en cada render: con tres salas eso eran cientos de
   evaluaciones del motor por repintado, y se notaba en el ventilador y
   en el scroll. Ahora cada oferta mira UN solo día —el primero en que
   puede valer— y como mucho una semana si está limitada a ciertos días
   de la semana. Ocho evaluaciones en el peor caso.

   Aun así conviene envolver la llamada en un useMemo: esto es puro y el
   resultado solo cambia cuando cambian las ofertas o las tarifas.
   ───────────────────────────────────────────────────────────────────── */
const ORDEN_JORNADAS = ['manana', 'tarde', 'completo']

export function ofertaEscaparate(ofertas, {
  roomSlug,
  precioMedia = 0,
  precioCompleta = 0,
  hoy = new Date(),
} = {}) {
  if (!Array.isArray(ofertas) || ofertas.length === 0) return null

  const hoy0 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  let mejor = null

  for (const oferta of ofertas) {
    // Una oferta con código no se anuncia: si se viera en la tarjeta,
    // el código dejaría de servir para nada.
    if (oferta.code) continue

    /* Con qué jornada se simula. La versión anterior daba por hecho
       "mañana" salvo que la oferta fuera solo de día completo, así que
       una oferta de solo tardes nunca llegaba a anunciarse: se simulaba
       en mañana, el filtro de jornada la tumbaba y la tarjeta salía sin
       oferta. Ahora se coge la primera jornada que la oferta permita. */
    const permitidas = !vacio(oferta.jornadas)
      ? ORDEN_JORNADAS.filter(j => oferta.jornadas.includes(j))
      : ORDEN_JORNADAS

    const jornada = permitidas[0]
    if (!jornada) continue

    const precio = jornada === 'completo' ? precioCompleta : precioMedia
    if (!precio) continue

    /* Desde cuándo se simula. Antes se empezaba siempre hoy, y con eso
       una oferta de "reserva con 30 días de antelación" nunca aparecía:
       la antelación simulada era 0 y el motor la descartaba. Se arranca
       en la primera fecha en la que la oferta puede llegar a valer. */
    let arranque = hoy0
    if (oferta.min_lead_days) {
      arranque = new Date(
        hoy0.getFullYear(), hoy0.getMonth(), hoy0.getDate() + Number(oferta.min_lead_days)
      )
    }
    if (oferta.starts_on) {
      const desde = new Date(oferta.starts_on + 'T00:00:00')
      if (desde > arranque) arranque = desde
    }

    /* Cuántos días hay que simular: los que pida la oferta. Con
       `min_days` a 3 no vale con probar uno, porque el motor la
       descartaría por no llegar al mínimo. */
    const cuantos = Math.max(1, Number(oferta.min_days) || 1)
    const conFiltroDia = !vacio(oferta.weekdays)
    const limite = conFiltroDia ? cuantos * 7 + 7 : cuantos

    const dias = []
    for (let i = 0; i < limite && dias.length < cuantos; i++) {
      const fecha = new Date(
        arranque.getFullYear(), arranque.getMonth(), arranque.getDate() + i
      )
      if (oferta.ends_on && aISO(fecha) > oferta.ends_on) break
      if (conFiltroDia && !oferta.weekdays.includes(diaSemanaISO(fecha))) continue
      dias.push({ fecha, jornada, precio })
    }

    // No caben los días que pide dentro de su propia ventana de fechas.
    if (dias.length < cuantos) continue

    const baseTotal = dias.reduce((t, d) => t + d.precio, 0)

    const r = mejorOferta([oferta], {
      roomSlug,
      dias,
      extrasIds: [],
      hotelExtras: [],
      asistentes: 0,
      baseTotal,
      extrasTotal: 0,
      codigo: null,
      hoy,
    })

    if (!r.oferta || r.descuento <= 0) continue

    /* La tarjeta enseña un precio por jornada, así que el descuento se
       reparte entre los días simulados. Con un solo día es exacto; con
       varios es la media, y por eso el precio se anuncia como "desde".
       Se redondea a euros: la tarjeta pinta el número tal cual y un
       233,33 ahí queda raro. */
    const precioRebajado = Math.max(0, Math.round(precio - r.descuento / dias.length))

    const candidato = {
      oferta: r.oferta,
      descuento: r.descuento,
      precio: precioRebajado,
      jornada,
      dias: dias.length,
    }

    // Gana la que deje el precio por jornada más bajo. Comparar
    // descuentos totales premiaría a la oferta de más días, que no es
    // lo que se está anunciando.
    if (!mejor || candidato.precio < mejor.precio) mejor = candidato
  }

  return mejor
}

/** El porqué de una oferta concreta dentro del resultado de
 *  `mejorOferta`. Sirve para poder decirle al cliente que su código es
 *  válido pero no cuadra con lo que ha elegido, en vez de dejarle
 *  mirando un total que no baja. */
export function motivoDeOferta(resultado, ofertaId) {
  if (!resultado || !ofertaId) return null
  const c = (resultado.candidatas || []).find(x => x.oferta?.id === ofertaId)
  if (!c) return null
  if (!c.aplica) return { aplica: false, motivo: c.motivo, gana: false }
  return {
    aplica: true,
    motivo: null,
    gana: resultado.oferta?.id === ofertaId,
    descuento: c.descuento,
  }
}

/* ── Ayudas para la interfaz ──────────────────────────────────────── */

/** En qué estado está una oferta hoy. Se calcula, no se guarda: una
 *  oferta guardada como "activa" puede haber caducado ayer. */
export function estadoOferta(oferta, hoy = new Date()) {
  if (!oferta.is_active) return 'desactivada'
  if (oferta.max_uses != null && (oferta.uses || 0) >= oferta.max_uses) return 'agotada'

  const iso = aISO(hoy)
  if (oferta.starts_on && iso < oferta.starts_on) return 'programada'
  if (oferta.ends_on   && iso > oferta.ends_on)   return 'caducada'
  return 'activa'
}

/** ¿Esta oferta cubre este día concreto? Para pintar el calendario del
 *  panel. Solo mira fecha y día de la semana: las condiciones que
 *  dependen de la reserva (mínimo de días, asistentes, antelación) no se
 *  pueden saber mirando un día suelto. */
export function cubreElDia(oferta, fecha) {
  if (estadoOferta(oferta) === 'desactivada') return false
  const iso = aISO(fecha)
  if (oferta.starts_on && iso < oferta.starts_on) return false
  if (oferta.ends_on   && iso > oferta.ends_on)   return false
  if (!vacio(oferta.weekdays) && !oferta.weekdays.includes(diaSemanaISO(fecha))) return false
  return true
}

/** Texto corto del descuento: "−20 %", "−50 €", "−30 €/día", "199 €/día". */
export function etiquetaDescuento(oferta) {
  const v = Number(oferta.discount_value)
  if (oferta.discount_type === 'percent')   return `−${v} %`
  if (oferta.discount_type === 'fixed')     return `−${v.toLocaleString('es-ES')} €`
  if (oferta.discount_type === 'day_off')   return `−${v.toLocaleString('es-ES')} €/día`
  if (oferta.discount_type === 'day_price') return `${v.toLocaleString('es-ES')} €/día`
  return ''
}

/** De dónde sale el número que se le resta al cliente, en una frase
 *  corta para poner junto al importe.
 *
 *  Existe porque el porcentaje se aplica al precio de sala y no al
 *  total: un 20 % sobre una reserva de 350 € de sala y 240 € de
 *  catering rebaja 70 €, no 118 €. Sin decirlo, el cliente hace la
 *  división, le sale un 11,9 % y piensa que el cálculo está mal.
 *
 *  `dias` es cuántos días de la reserva entran en la oferta, para poder
 *  distinguir "−30 €/día" de "−30 € × 3 días". */
export function explicarDescuento(oferta, { dias = 0 } = {}) {
  if (!oferta) return ''
  const v = Number(oferta.discount_value)

  if (oferta.discount_type === 'percent') {
    return `${v} % sobre el precio de sala`
  }
  if (oferta.discount_type === 'fixed') {
    return `${v.toLocaleString('es-ES')} € sobre el precio de sala`
  }
  if (oferta.discount_type === 'day_off') {
    return dias > 1
      ? `${v.toLocaleString('es-ES')} € por día · ${dias} días`
      : `${v.toLocaleString('es-ES')} € sobre el precio de sala`
  }
  if (oferta.discount_type === 'day_price') {
    return dias > 1
      ? `sala a ${v.toLocaleString('es-ES')} €/día · ${dias} días`
      : `sala a ${v.toLocaleString('es-ES')} €`
  }
  return ''
}

/** Las restricciones en frases cortas, para pintarlas como chips. */
export function resumirCondiciones(oferta, { salas = [], extras = [] } = {}) {
  const chips = []

  if (!vacio(oferta.room_slugs)) {
    const nombres = oferta.room_slugs
      .map(slug => salas.find(s => s.slug === slug)?.name || slug)
    chips.push(nombres.join(', '))
  }

  if (!vacio(oferta.weekdays)) {
    const dias = oferta.weekdays
      .slice()
      .sort((a, b) => a - b)
      .map(d => DIAS_SEMANA.find(x => x.id === d)?.label)
      .filter(Boolean)
    chips.push(`Solo ${dias.join(', ').toLowerCase()}`)
  }

  if (!vacio(oferta.jornadas)) {
    const etiquetas = { manana: 'mañana', tarde: 'tarde', completo: 'día completo' }
    chips.push(`Solo ${oferta.jornadas.map(j => etiquetas[j] || j).join(', ')}`)
  }

  if ((oferta.min_days || 1) > 1) chips.push(`${oferta.min_days} días o más`)
  if (oferta.min_attendees) chips.push(`${oferta.min_attendees} asistentes o más`)
  if (oferta.min_amount)    chips.push(`Desde ${Number(oferta.min_amount).toLocaleString('es-ES')} € de sala`)
  if (oferta.min_lead_days) chips.push(`Con ${oferta.min_lead_days} días de antelación`)
  if (oferta.max_lead_days) chips.push(`Última hora: menos de ${oferta.max_lead_days} días`)

  if (!vacio(oferta.free_extra_ids)) {
    const nombres = oferta.free_extra_ids
      .map(id => extras.find(e => e.id === id)?.name)
      .filter(Boolean)
    if (nombres.length > 0) chips.push(`Incluye ${nombres.join(', ')}`)
  }

  return chips
}