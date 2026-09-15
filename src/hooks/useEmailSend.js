import emailjs from '@emailjs/browser'
import { EMAILJS_CONFIG } from '../config/emailjs'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { LAYOUT_LABELS, JORNADA_LABELS } from '../lib/constants'
import { explicarDescuento } from '../lib/ofertas'

/* ─────────────────────────────────────────────────────────────────────
   EL ORDEN IMPORTA: PRIMERO SE GUARDA, DESPUÉS SE AVISA.

   Antes esto lanzaba los tres inserts y los dos emails a la vez con un
   Promise.all, y el guardado iba envuelto en un try/catch que se tragaba
   el error. Resultado: si la base de datos fallaba, el cliente veía la
   pantalla verde con su número de referencia y en el panel no había
   nada. La reserva existía solo en un email.

   Ahora la reserva se guarda primero y, si falla, el error sube hasta la
   interfaz y no se manda ningún correo. Cuesta unos milisegundos más que
   hacerlo en paralelo; a cambio no se pierde ninguna solicitud.

   El guardado entero lo hace `crear_reserva` en Postgres, en una sola
   transacción, y es quien genera la referencia. Aquí ya no se inventa
   ningún número: la de antes eran cuatro dígitos al azar contra una
   columna UNIQUE.
   ───────────────────────────────────────────────────────────────────── */

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

/* Guarda la reserva y devuelve la referencia que ha generado Postgres.
   Si algo falla, LANZA. No devuelve null ni se calla: quien llama tiene
   que enterarse para no enseñar una pantalla de éxito falsa. */
async function guardarReserva(booking, hotel, desglose) {
  const payload = {
    hotel_id: hotel._dbId,
    room_id:  booking.room._dbId,
    offer_id: desglose?.oferta?.id || null,

    contact_name:  booking.contacto.nombre,
    contact_email: booking.contacto.email,
    contact_phone: booking.contacto.telefono,
    comments:      booking.contacto.comentarios || null,

    base_price:      desglose?.base ?? 0,
    extras_price:    desglose?.extras ?? 0,
    discount_amount: desglose?.descuento ?? 0,
    total_price:     desglose?.total ?? ((desglose?.base ?? 0) + (desglose?.extras ?? 0)),

    dates: (booking.fechas || []).map(f => ({
      date:      format(f.date, 'yyyy-MM-dd'),
      jornada:   f.jornada,
      layout:    f.layout || '',
      // Como texto: la función lo convierte con nullif(...)::int, así un
      // campo vacío entra como null en vez de reventar el casteo.
      attendees: f.asistentes ? String(f.asistentes) : '',
    })),

    extras: booking.extras || [],
  }

  const { data, error } = await supabase.rpc('crear_reserva', { p_reserva: payload })

  if (error) {
    console.error('crear_reserva ha fallado:', error)
    throw new Error(error.message || 'No se ha podido guardar la reserva')
  }

  if (!data) {
    throw new Error('La reserva no ha devuelto referencia')
  }

  return data
}

export function useEmailSend() {

  /**
   * Guarda la reserva y avisa por email.
   *
   * @returns {Promise<{ referencia: string, emailOk: boolean }>}
   *   `emailOk` en false significa que la reserva SÍ está guardada pero
   *   los correos no han salido. No es motivo para enseñar un error: la
   *   solicitud existe y el hotel la ve en el panel. La interfaz lo
   *   avisa con otro texto para que el cliente no se quede esperando un
   *   email que no va a llegar.
   *
   * @throws si la reserva no se ha podido guardar. En ese caso no se
   *   manda ningún correo.
   */
  const sendEmails = async (booking, hotel, desglose) => {

    // ── 1 · La reserva. Si esto falla, aquí se acaba todo ──
    const referencia = await guardarReserva(booking, hotel, desglose)

    // ── 2 · Los emails ──
    const basePrice   = desglose?.base ?? 0
    const extrasPrice = desglose?.extras ?? 0
    const descuento   = desglose?.descuento ?? 0
    const totalPrice  = desglose?.total ?? (basePrice + extrasPrice)
    const oferta      = desglose?.oferta || null

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
      precio_base:    basePrice,
      precio_extras:  extrasPrice,
      descuento:      descuento,
      oferta_nombre:  oferta ? oferta.name : '',
      oferta_codigo:  oferta?.code || '',
      // Sobre qué se ha calculado el descuento. Si no se usa en la
      // plantilla de EmailJS no molesta, pero evita que el cliente
      // reciba un importe suelto que no le cuadra con el total.
      oferta_detalle: oferta ? explicarDescuento(oferta, { dias: (desglose?.dias || []).length }) : '',
      precio_total:   totalPrice,
      nombre:         booking.contacto.nombre,
      email:          booking.contacto.email,
      email_cliente:  booking.contacto.email,
      telefono:       booking.contacto.telefono,
      comentarios:    booking.contacto.comentarios || '—',
    }

    /* El fallo de email NO tumba la operación. La reserva ya está
       guardada y visible en el panel; hacer fallar esto solo
       conseguiría que el cliente le diera a enviar otra vez y entraran
       dos reservas iguales.

       Se avisa por consola y se devuelve el flag. Si EmailJS agota la
       cuota mensual del plan gratis (200 correos, o sea 100 reservas),
       este es el camino por el que se va a enterar alguien. */
    let emailOk = true

    try {
      emailjs.init(EMAILJS_CONFIG.publicKey)
      await Promise.all([
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateHotel, templateParams),
        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateCliente, templateParams),
      ])
    } catch (err) {
      console.error(
        `Reserva ${referencia} guardada, pero los emails no han salido. ` +
        'Revisa la cuota de EmailJS y los dominios permitidos.',
        err
      )
      emailOk = false
    }

    return { referencia, emailOk }
  }

  return { sendEmails }
}