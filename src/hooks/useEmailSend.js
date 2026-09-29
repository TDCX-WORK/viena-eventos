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

   EL CORREO YA NO SALE DE AQUÍ. Antes este hook llamaba a EmailJS desde
   el navegador: la clave viajaba dentro del bundle (cualquiera podía
   leerla y gastar la cuota) y la IP de cada visitante llegaba a un
   tercero. Ahora se hace un POST a /api/reserva y el envío ocurre en una
   Cloudflare Pages Function, con la clave de Brevo en un secret que el
   navegador no ve. Ver functions/api/reserva.js.
   ───────────────────────────────────────────────────────────────────── */

const ENDPOINT_CORREO = '/api/reserva'

/* Se aborta si la Function tarda demasiado. La reserva ya está guardada,
   así que dejar al cliente mirando una rueda diez segundos por un correo
   no compensa: mejor enseñarle la referencia y avisar de que el email
   puede tardar. */
const TIEMPO_MAXIMO = 8000

const formatFechas = (booking) => {
  const fechas = booking.fechas || []
  return fechas.map(f => ({
    fecha:      format(f.date, "EEEE d 'de' MMMM", { locale: es }),
    jornada:    JORNADA_LABELS[f.jornada] || f.jornada || '—',
    // Sin montaje elegido: la configuración es opcional en el wizard.
    layout:     LAYOUT_LABELS[f.layout] || 'Sin preferencia',
    asistentes: f.asistentes || '—',
    // Sábado o domingo: el correo al cliente avisa del posible suplemento.
    finde:      [0, 6].includes(f.date.getDay()),
  }))
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

/* Lo que se le manda a la Function. Las etiquetas legibles (jornada,
   montaje) se resuelven aquí porque los diccionarios viven en el
   cliente; la Function solo escapa y maqueta, no traduce nada. */
function prepararAviso(booking, hotel, desglose, referencia) {
  const basePrice   = desglose?.base ?? 0
  const extrasPrice = desglose?.extras ?? 0
  const descuento   = desglose?.descuento ?? 0
  const totalPrice  = desglose?.total ?? (basePrice + extrasPrice)
  const oferta      = desglose?.oferta || null

  return {
    referencia,
    contacto: {
      nombre:      booking.contacto.nombre,
      email:       booking.contacto.email,
      telefono:    booking.contacto.telefono,
      comentarios: booking.contacto.comentarios || '',
    },
    sala: {
      nombre: booking.room.name,
      metros: booking.room.size,
      // El mismo cálculo que hacía el hook antiguo para {{sala_capacidad}}:
      // el aforo mayor de todos los montajes posibles de la sala.
      capacidad: Math.max(...booking.room.layouts.map(l => l.max)),
    },
    fechas: formatFechas(booking),
    extras: (booking.extras || [])
      .map(id => hotel.extras.find(e => e.id === id)?.name)
      .filter(Boolean),
    precios: {
      base:      basePrice,
      extras:    extrasPrice,
      descuento: descuento,
      total:     totalPrice,
    },
    oferta: oferta
      ? {
          nombre:  oferta.name,
          codigo:  oferta.code || '',
          detalle: explicarDescuento(oferta, { dias: (desglose?.dias || []).length }),
        }
      : null,
  }
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
    /* El fallo de email NO tumba la operación. La reserva ya está
       guardada y visible en el panel; hacer fallar esto solo conseguiría
       que el cliente le diera a enviar otra vez y entraran dos reservas
       iguales.

       Se avisa por consola y se devuelve el flag. Si Brevo agota la
       cuota diaria del plan gratis (300 correos, o sea 150 reservas en
       un mismo día), este es el camino por el que se va a enterar
       alguien. */
    let emailOk = true

    try {
      const corte = AbortSignal.timeout(TIEMPO_MAXIMO)

      const respuesta = await fetch(ENDPOINT_CORREO, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(prepararAviso(booking, hotel, desglose, referencia)),
        signal:  corte,
      })

      /* La Function devuelve 200 con ok:false cuando la reserva está bien
         pero Brevo ha fallado, así que no basta con mirar respuesta.ok. */
      const resultado = await respuesta.json().catch(() => null)

      if (!respuesta.ok || !resultado?.ok) {
        emailOk = false
        console.error(
          `Reserva ${referencia} guardada, pero los correos no han salido del todo.`,
          resultado || `HTTP ${respuesta.status}`
        )
      }
    } catch (err) {
      emailOk = false
      console.error(
        `Reserva ${referencia} guardada, pero no se ha podido contactar con /api/reserva.`,
        err
      )
    }

    return { referencia, emailOk }
  }

  return { sendEmails }
}