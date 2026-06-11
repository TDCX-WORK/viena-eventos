import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emailjs'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { LAYOUT_LABELS, JORNADA_LABELS } from '../lib/constants'

const generateRef = () => {
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `SV-${year}-${random}`
}

const formatFechas = (booking) => {
  const fechas = booking.fechas || []
  if (fechas.length === 0) return '—'
  return fechas
    .map(f => {
      const fecha   = format(f.date, "d 'de' MMMM", { locale: es })
      const jornada = JORNADA_LABELS[f.jornada] || f.jornada
      const layout  = LAYOUT_LABELS[f.layout] || '—'
      const pax     = f.asistentes || '—'
      return `${fecha} — ${jornada} — ${layout} — ${pax} pax`
    })
    .join('\n')
}

const formatFechasHtml = (booking) => {
  const fechas = booking.fechas || []
  if (fechas.length === 0) return '<em>—</em>'
  return fechas
    .map(f => {
      const fecha   = format(f.date, "EEEE d 'de' MMMM", { locale: es })
      const jornada = JORNADA_LABELS[f.jornada] || f.jornada
      const layout  = LAYOUT_LABELS[f.layout] || '—'
      const pax     = f.asistentes || '—'
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e4df;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#3D3530;text-transform:capitalize;">${fecha}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e4df;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#57534e;">${jornada}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e4df;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#57534e;">${layout}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e8e4df;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#57534e;text-align:center;">${pax}</td>
      </tr>`
    })
    .join('')
}

const formatJornada = (booking) => {
  const fechas = booking.fechas || []
  if (fechas.length === 0) return '—'
  if (fechas.length === 1) return JORNADA_LABELS[fechas[0].jornada] || '—'
  const allSame = fechas.every(f => f.jornada === fechas[0].jornada)
  return allSame
    ? JORNADA_LABELS[fechas[0].jornada] || '—'
    : 'Mixta (ver detalle de fechas)'
}

export function useEmailSend() {

  const sendEmails = async (booking, hotel, getTotalPrice) => {
    const referencia = generateRef()
    const totalPrice = getTotalPrice(hotel)

    // ── Calcular desglose de precios ──
    const maxAsistentes = (booking.fechas || []).reduce((max, f) =>
      Math.max(max, parseInt(f.asistentes) || 0), 0)

    const extrasPrice = (booking.extras || []).reduce((sum, id) => {
      const extra = hotel.extras.find(e => e.id === id)
      if (!extra) return sum
      return sum + extra.pricePerPerson * Math.max(maxAsistentes, extra.minPersons)
    }, 0)

    const basePrice = totalPrice - extrasPrice

    // ── Preparar params de email (síncrono) ──
    const extras = (booking.extras || [])
      .map(id => hotel.extras.find(e => e.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'Ninguno'

    const maxCapacity = Math.max(...booking.room.layouts.map(l => l.max))

    const allPax = (booking.fechas || []).map(f => f.asistentes).filter(Boolean)
    const asistentesStr = allPax.length === 0
      ? '—'
      : [...new Set(allPax)].length === 1
        ? `${allPax[0]}`
        : allPax.join(', ')

    const allLayouts = [...new Set((booking.fechas || []).map(f => LAYOUT_LABELS[f.layout]).filter(Boolean))]
    const layoutStr = allLayouts.length === 0 ? '—' : allLayouts.join(', ')

    const templateParams = {
      referencia,
      sala_nombre:    booking.room.name,
      sala_metros:    booking.room.size,
      sala_capacidad: maxCapacity,
      fecha:          formatFechas(booking),
      fechas_html:    formatFechasHtml(booking),
      jornada:        formatJornada(booking),
      asistentes:     asistentesStr,
      layout:         layoutStr,
      extras,
      precio_total:   totalPrice,
      nombre:         booking.contacto.nombre,
      email:          booking.contacto.email,
      email_cliente:  booking.contacto.email,
      telefono:       booking.contacto.telefono,
      comentarios:    booking.contacto.comentarios || '—',
    }

    emailjs.init(EMAILJS_CONFIG.publicKey)

    // ── Lanzar TODO en paralelo: BD + ambos emails ──
    const saveToDb = async () => {
      try {
        const { data: bookingRow, error: bErr } = await supabase
          .from('bookings')
          .insert({
            hotel_id: hotel._dbId,
            room_id: booking.room._dbId,
            reference: referencia,
            status: 'pending',
            contact_name: booking.contacto.nombre,
            contact_email: booking.contacto.email,
            contact_phone: booking.contacto.telefono,
            comments: booking.contacto.comentarios || null,
            base_price: basePrice,
            extras_price: extrasPrice,
            total_price: totalPrice,
          })
          .select()
          .single()

        if (bErr) throw bErr

        const fechasToInsert = (booking.fechas || []).map(f => ({
          booking_id: bookingRow.id,
          date: format(f.date, 'yyyy-MM-dd'),
          jornada: f.jornada,
          layout: f.layout,
          attendees: f.asistentes || null,
        }))

        const extrasToInsert = (booking.extras || []).map(extraId => ({
          booking_id: bookingRow.id,
          extra_id: extraId,
        }))

        await Promise.all([
          fechasToInsert.length > 0
            ? supabase.from('booking_dates').insert(fechasToInsert)
            : Promise.resolve(),
          extrasToInsert.length > 0
            ? supabase.from('booking_extras').insert(extrasToInsert)
            : Promise.resolve(),
        ])
      } catch (dbErr) {
        console.error('Error guardando reserva en BD:', dbErr)
      }
    }

    await Promise.all([
      saveToDb(),
      emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateHotel, templateParams),
      emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateCliente, templateParams),
    ])

    return referencia
  }

  return { sendEmails }
}