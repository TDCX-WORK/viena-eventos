import { useState } from 'react'
import { JORNADA_LABELS_SHORT } from '../lib/constants'

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

  const getBasePrice = () => {
    if (!booking.room) return 0
    if (booking.fechas && booking.fechas.length > 0) {
      return booking.fechas.reduce((total, f) => {
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

        return total + dayPrice + supplement
      }, 0)
    }
    return 0
  }

  const getTotalPrice = (hotel = null) => {
    const base = getBasePrice()
    if (!hotel || !booking.extras || booking.extras.length === 0) return base

    const maxAsistentes = booking.fechas.reduce((max, f) => {
      return Math.max(max, parseInt(f.asistentes) || 0)
    }, 0)

    const extrasTotal = booking.extras.reduce((sum, id) => {
      const extra = hotel.extras.find(e => e.id === id)
      if (!extra) return sum
      return sum + extra.pricePerPerson * Math.max(maxAsistentes, extra.minPersons)
    }, 0)

    return base + extrasTotal
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
    getJornadaLabel,
  }
}
