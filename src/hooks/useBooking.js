import { useState } from 'react'
import { JORNADA_LABELS_SHORT } from '../lib/constants'
import { mejorOferta } from '../lib/ofertas'

const initialState = {
  room: null,
  jornada: null,
  fecha: null,
  fechas: [],         // [{ date, jornada, layout, asistentes }]
  extras: [],
  contacto: {
    nombre: '',
    email: '',
    telefono: '',
    comentarios: '',
    privacidad: false,
  }
}

export function useBooking(room) {
  const [booking, setBooking] = useState({ ...initialState, room })

  const updateBooking = (fields) => {
    setBooking(prev => ({ ...prev, ...fields }))
  }

  const updateContacto = (fields) => {
    setBooking(prev => ({
      ...prev,
      contacto: { ...prev.contacto, ...fields }
    }))
  }

  /** Actualiza campos de una fecha concreta por su date */
  const updateFecha = (date, fields) => {
    setBooking(prev => ({
      ...prev,
      fechas: prev.fechas.map(f =>
        f.date.getTime() === date.getTime() ? { ...f, ...fields } : f
      )
    }))
  }

  /** Lo que cuesta un día suelto de la reserva: la tarifa de la jornada
   *  más el suplemento de fin de semana, si la sala tiene uno. */
  const precioDelDia = (f) => {
    if (!booking.room) return 0
    const jornada = f.jornada || 'completo'
    const dayPrice = jornada === 'completo'
      ? booking.room.pricing.fullDay
      : booking.room.pricing.halfDay

    // Suplemento fin de semana (sábado = 6, domingo = 0)
    const day = f.date.getDay()
    const isWeekend = day === 0 || day === 6
    const supplement = isWeekend
      ? (booking.room.pricing.weekendSupplement || 0)
      : 0

    return dayPrice + supplement
  }

  /** Los días en el formato que espera el motor de ofertas. Es la misma
   *  lista que se usa para sumar el precio base, así que no puede
   *  descuadrarse con él. */
  const getDias = () =>
    (booking.fechas || []).map(f => ({
      fecha: f.date,
      jornada: f.jornada || 'completo',
      precio: precioDelDia(f),
    }))

  const getBasePrice = () => getDias().reduce((total, d) => total + d.precio, 0)

  /** Cuántas personas hay que contar para los extras: el día más lleno.
   *  Un coffee break se pide para todos, no para el mínimo. */
  const getMaxAsistentes = () =>
    (booking.fechas || []).reduce((max, f) => Math.max(max, parseInt(f.asistentes) || 0), 0)

  const getExtrasPrice = (hotel = null) => {
    if (!hotel || !booking.extras || booking.extras.length === 0) return 0
    const maxAsistentes = getMaxAsistentes()

    return booking.extras.reduce((sum, id) => {
      const extra = hotel.extras.find(e => e.id === id)
      if (!extra) return sum
      return sum + extra.pricePerPerson * Math.max(maxAsistentes, extra.minPersons)
    }, 0)
  }

  /** Precio SIN ofertas: sala más extras. Se mantiene aparte porque es
   *  el precio que se tacha en el resumen y el que se guarda como
   *  base_price + extras_price en la reserva. */
  const getTotalPrice = (hotel = null) => getBasePrice() + getExtrasPrice(hotel)

  /* ── Desglose con ofertas ────────────────────────────────────────────
     Lo único que hay que llamar desde la interfaz. El cálculo lo hace
     lib/ofertas.js, el mismo motor que usa la vista previa del panel:
     si el descuento se calculara aquí a mano, el panel enseñaría un
     número y la web cobraría otro en cuanto alguien tocara uno de los
     dos.

     `ofertas` viene de useOfertasPublicas y ya incluye, si la hay, la
     oferta del código que el cliente haya escrito.

     Devuelve siempre la misma forma aunque no aplique ninguna, para que
     quien lo use no tenga que comprobar si es null. */
  const getDesglose = (hotel = null, ofertas = [], codigo = null) => {
    const dias = getDias()
    const base = dias.reduce((t, d) => t + d.precio, 0)
    const extras = getExtrasPrice(hotel)

    const vacio = {
      base,
      extras,
      descuento: 0,
      oferta: null,
      gratis: [],
      total: base + extras,
      dias: [],
      // `candidatas` lleva, por cada oferta evaluada, si aplica y por
      // qué no. Es lo que permite decirle al cliente que su código es
      // correcto pero no cuadra con las fechas que ha elegido.
      candidatas: [],
    }

    if (!booking.room || dias.length === 0 || !Array.isArray(ofertas) || ofertas.length === 0) {
      return vacio
    }

    const resultado = mejorOferta(ofertas, {
      roomSlug: booking.room.slug,
      dias,
      extrasIds: booking.extras || [],
      hotelExtras: hotel?.extras || [],
      asistentes: getMaxAsistentes(),
      baseTotal: base,
      extrasTotal: extras,
      codigo,
      hoy: new Date(),
    })

    if (!resultado.oferta) {
      return { ...vacio, candidatas: resultado.candidatas || [] }
    }

    return {
      base,
      extras,
      descuento: resultado.descuento,
      oferta: resultado.oferta,
      gratis: resultado.gratis || [],
      candidatas: resultado.candidatas || [],
      // Los días de la reserva que entran en la oferta. El resumen los
      // usa para escribir "30 € por día · 3 días" en vez de un importe
      // suelto que no se sabe de dónde sale.
      dias: resultado.dias || [],
      // El motor ya topa el descuento al total, pero el Math.max deja
      // constancia de que una reserva nunca sale a menos de cero.
      total: Math.max(0, base + extras - resultado.descuento),
    }
  }

  const getJornadaLabel = () => {
    if (booking.fechas && booking.fechas.length > 1) {
      return `${booking.fechas.length} días`
    }
    const j = booking.fechas?.[0]?.jornada || booking.jornada
    return JORNADA_LABELS_SHORT[j] || ''
  }

  return {
    booking,
    updateBooking,
    updateFecha,
    updateContacto,
    getTotalPrice,
    getDesglose,
    getJornadaLabel,
  }
}