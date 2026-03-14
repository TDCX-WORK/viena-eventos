import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emailjs'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const LAYOUT_LABELS = {
  teatro:   'Teatro',
  u:        'En U',
  escuela:  'Escuela',
  imperial: 'Imperial',
}

const JORNADA_LABELS = {
  manana:   'Mañana (9:00 – 14:00)',
  tarde:    'Tarde (15:00 – 20:00)',
  completo: 'Día completo (9:00 – 20:00)',
}

const generateRef = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `SV-${year}-${random}`
}

export function useEmailSend() {

  const sendEmails = async (booking, hotel, getTotalPrice) => {
    const referencia = generateRef()

    const extras = (booking.extras || [])
      .map(id => hotel.extras.find(e => e.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Ninguno'

    const fechaFormateada = booking.fecha
      ? format(booking.fecha, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })
      : '—'

    const maxCapacity = Math.max(...booking.room.layouts.map(l => l.max))

    const templateParams = {
      referencia,
      sala_nombre:    booking.room.name,
      sala_metros:    booking.room.size,
      sala_capacidad: maxCapacity,
      fecha:          fechaFormateada,
      jornada:        JORNADA_LABELS[booking.jornada] || '—',
      asistentes:     booking.asistentes,
      layout:         LAYOUT_LABELS[booking.layout] || '—',
      tipo_evento:    booking.contacto.tipoEvento,
      extras,
      precio_total:   getTotalPrice(),
      nombre:         booking.contacto.nombre,
      empresa:        booking.contacto.empresa || '—',
      email:          booking.contacto.email,
      email_cliente:  booking.contacto.email,
      telefono:       booking.contacto.telefono,
      comentarios:    booking.contacto.comentarios || '—',
    }

    emailjs.init(EMAILJS_CONFIG.publicKey)

    // Email al hotel
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateHotel,
      templateParams
    )

    // Email al cliente
    await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateCliente,
      templateParams
    )

    return referencia
  }

  return { sendEmails }
}