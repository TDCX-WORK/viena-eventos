import { useState } from 'react'

const initialState = {
  room: null,
  jornada: null,      // 'manana' | 'tarde' | 'completo'
  fecha: null,        // Date object
  asistentes: '',
  layout: null,       // 'teatro' | 'u' | 'escuela' | 'imperial'
  extras: [],         // array de ids de extras seleccionados
  contacto: {
    tipoEvento: '',
    nombreEvento: '',
    nombre: '',
    empresa: '',
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

  const getTotalPrice = () => {
    if (!booking.room || !booking.jornada) return 0

    let base = 0
    if (booking.jornada === 'completo') {
      base = booking.room.pricing.fullDay
    } else {
      base = booking.room.pricing.halfDay
    }

    return base
  }

  const getJornadaLabel = () => {
    const labels = {
      manana: 'Mañana (9h – 14h)',
      tarde: 'Tarde (15h – 20h)',
      completo: 'Día completo (9h – 20h)',
    }
    return labels[booking.jornada] || ''
  }

  return {
    booking,
    updateBooking,
    updateContacto,
    getTotalPrice,
    getJornadaLabel,
  }
}