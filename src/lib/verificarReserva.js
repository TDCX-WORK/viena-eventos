import { mejorOferta } from './ofertas'

/* ─────────────────────────────────────────────────────────────────────
   Recalcular una reserva ya guardada.

   POR QUÉ EXISTE ESTO. El precio lo calcula el navegador y se guarda tal
   cual. La base de datos comprueba que las cifras cuadren entre sí, pero
   no que sean las correctas: alguien puede mandar una reserva con
   base_price 10 € y pasará el filtro. Como la reserva entra siempre como
   'pending' y el hotel la confirma a mano, la defensa práctica es esta:
   recalcular al abrirla y avisar si no coincide.

   También pilla bugs propios, que es lo que va a pasar el 99 % de las
   veces: un cambio de tarifas mal propagado, un extra con mínimo de
   personas mal aplicado, un suplemento de fin de semana olvidado.

   NO ES UNA VALIDACIÓN ESTRICTA. Devuelve avisos para que un humano
   mire, no bloquea nada. Un aviso puede ser legítimo: si alguien cambió
   las tarifas después de que entrara la reserva, la base ya no cuadra y
   el precio guardado es el bueno, porque es el que se le prometió al
   cliente.
   ───────────────────────────────────────────────────────────────────── */

const CENTIMO = 0.01

const num = (v) => Number(v) || 0

/** Precio de un día suelto según las tarifas actuales de la sala. */
function precioDelDia(fecha, jornada, tarifas) {
  const base = (jornada || 'completo') === 'completo'
    ? num(tarifas.full_day)
    : num(tarifas.half_day)

  const dow = fecha.getDay()
  const finde = dow === 0 || dow === 6

  return base + (finde ? num(tarifas.weekend_supplement) : 0)
}

/**
 * @param reserva  fila de bookings con booking_dates, booking_extras y rooms
 * @param ofertas  todas las ofertas del panel, para buscar la aplicada
 * @returns { ok, avisos, calculado } — `calculado` es null si faltan datos
 */
export function verificarReserva(reserva, ofertas = []) {
  const avisos = []

  const tarifas = reserva?.rooms?.pricing?.[0]
  const dias = reserva?.booking_dates || []

  // Sin tarifas o sin fechas no hay nada que recalcular. Callarse es
  // mejor que inventar un aviso a partir de datos que no se tienen.
  if (!tarifas || dias.length === 0) {
    return { ok: true, avisos: [], calculado: null }
  }

  /* ── Sala ── */
  const base = dias.reduce(
    (t, d) => t + precioDelDia(new Date(d.date + 'T00:00:00'), d.jornada, tarifas),
    0
  )

  /* ── Extras ── */
  const asistentes = dias.reduce((max, d) => Math.max(max, parseInt(d.attendees) || 0), 0)

  const extras = (reserva.booking_extras || []).reduce((t, be) => {
    const e = be.extras
    if (!e) return t
    return t + num(e.price_per_person) * Math.max(asistentes, num(e.min_persons) || 1)
  }, 0)

  /* ── Descuento ──
     Se recalcula con la oferta tal y como está HOY. Si la han editado
     desde que entró la reserva, el número puede no coincidir sin que
     nadie haya hecho nada malo, así que ese caso se avisa aparte.

     `hoy` es la fecha en que se creó la reserva, no la de ahora: las
     condiciones de antelación se miden desde el momento de reservar. */
  let descuento = 0
  let ofertaEncontrada = null

  if (reserva.offer_id) {
    ofertaEncontrada = ofertas.find(o => o.id === reserva.offer_id) || null

    if (!ofertaEncontrada) {
      avisos.push('La oferta aplicada ya no existe: el descuento no se puede recalcular.')
      descuento = num(reserva.discount_amount)
    } else {
      const r = mejorOferta([ofertaEncontrada], {
        roomSlug: reserva.rooms?.slug,
        dias: dias.map(d => ({
          fecha: new Date(d.date + 'T00:00:00'),
          jornada: d.jornada || 'completo',
          precio: precioDelDia(new Date(d.date + 'T00:00:00'), d.jornada, tarifas),
        })),
        extrasIds: (reserva.booking_extras || []).map(be => be.extras?.id).filter(Boolean),
        hotelExtras: (reserva.booking_extras || [])
          .map(be => be.extras)
          .filter(Boolean)
          .map(e => ({
            id: e.id,
            name: e.name,
            pricePerPerson: num(e.price_per_person),
            minPersons: num(e.min_persons) || 1,
          })),
        asistentes,
        baseTotal: base,
        extrasTotal: extras,
        codigo: reserva.offer_code || null,
        hoy: new Date(reserva.created_at),
      })

      descuento = r.descuento || 0
    }
  }

  const total = Math.max(0, base + extras - descuento)

  const calculado = { base, extras, descuento, total }

  /* ── Comparación ── */
  const difiere = (a, b) => Math.abs(num(a) - num(b)) > CENTIMO

  if (difiere(base, reserva.base_price)) {
    avisos.push(`La sala debería costar ${base.toFixed(2)} € y está guardada como ${num(reserva.base_price).toFixed(2)} €.`)
  }

  if (difiere(extras, reserva.extras_price)) {
    avisos.push(`Los extras deberían costar ${extras.toFixed(2)} € y están guardados como ${num(reserva.extras_price).toFixed(2)} €.`)
  }

  if (ofertaEncontrada && difiere(descuento, reserva.discount_amount)) {
    avisos.push(`El descuento debería ser ${descuento.toFixed(2)} € y está guardado como ${num(reserva.discount_amount).toFixed(2)} €.`)
  }

  if (difiere(total, reserva.total_price)) {
    avisos.push(`El total debería ser ${total.toFixed(2)} € y está guardado como ${num(reserva.total_price).toFixed(2)} €.`)
  }

  return { ok: avisos.length === 0, avisos, calculado }
}

export default verificarReserva