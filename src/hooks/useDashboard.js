import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────────────────────────────
   Datos del Inicio.

   El componente de pantalla no habla con Supabase: consulta, cálculos y
   Realtime viven aquí. Así la pantalla es solo pintado y esta lógica se
   puede probar o reutilizar sin arrastrar JSX.

   UNA SOLA CONSULTA. Se trae la lista entera de reservas con sus fechas
   y se calcula todo en memoria. Con el volumen de este proyecto (un
   hotel, tres salas) es más barato que cinco consultas con contadores, y
   evita que los números de arriba y la lista de abajo se contradigan
   por haberse leído en momentos distintos.

   LA FECHA DE UNA RESERVA. Una reserva puede ocupar varios días, así que
   "cuándo es" no es un dato único. Se usa la PRIMERA de sus fechas. Si
   una reserva cruza dos meses, cuenta entera en el mes en que empieza.
   Es una convención, pero hay que elegir una y estar avisado.
   ───────────────────────────────────────────────────────────────────── */

const ESTADOS = {
  pending:   'pending',
  confirmed: 'confirmed',
  cancelled: 'cancelled',
}

/** Fecha (yyyy-mm-dd) en la que empieza la reserva. */
function fechaInicio(reserva) {
  const fechas = (reserva.booking_dates || []).map(d => d.date).sort()
  if (fechas.length > 0) return fechas[0]
  // Sin fechas asociadas (no debería pasar, pero pasa si falló el insert
  // de booking_dates) se cae hacia la fecha de creación para no perder
  // la reserva de los contadores.
  return reserva.created_at?.slice(0, 10) || null
}

function hoyISO() {
  // Fecha local, no UTC. new Date().toISOString() en España a las 00:30
  // devuelve el día anterior y la agenda se iría un día atrás.
  const d = new Date()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

function sumarDiasISO(iso, dias) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + dias)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function useDashboard() {
  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [actualizando, setActualizando] = useState(null)
  // Si el canal de Realtime está realmente conectado. La pantalla solo
  // enseña el punto verde cuando esto es true: un indicador de "en vivo"
  // que en realidad no escucha nada es peor que no tener ninguno.
  const [enVivo, setEnVivo] = useState(false)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true)
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select(`
          id, reference, status, contact_name, contact_email, contact_phone,
          comments, base_price, extras_price, total_price, created_at,
          rooms ( name, slug ),
          booking_dates ( id, date, jornada, layout, attendees ),
          booking_extras ( id, extras ( name ) )
        `)
        .order('created_at', { ascending: false })

      if (err) throw err
      setReservas(data || [])
      setError(null)
    } catch (err) {
      console.error('Error cargando el inicio:', err)
      // El mensaje se enseña en pantalla. Antes esto solo iba a la
      // consola y un fallo de red se veía igual que "no hay reservas".
      setError('No se han podido cargar las reservas. Comprueba la conexión y vuelve a intentarlo.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  /* Realtime. Si entra una solicitud desde la web mientras el panel está
     abierto, aparece sola. Se recarga en silencio para no parpadear la
     pantalla entera con los tres puntos.

     REQUISITO DE BASE DE DATOS: las tablas tienen que estar en la
     publicación supabase_realtime, que en los proyectos nuevos viene
     vacía. Si no lo están, esto se conecta igual y no llega nunca nada.
        alter publication supabase_realtime add table public.bookings;
        alter publication supabase_realtime add table public.booking_dates;
     Y si hay RLS, el usuario necesita policy de select: Realtime filtra
     los eventos con las policies de quien escucha. */
  useEffect(() => {
    const canal = supabase
      .channel('inicio-reservas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
        () => cargar({ silencioso: true }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_dates' },
        () => cargar({ silencioso: true }))
      .subscribe((estado) => {
        // Ojo: SUBSCRIBED significa que el canal se ha unido, no que la
        // tabla esté publicada. Detecta la caída de conexión y los
        // errores de permisos, no una publicación mal configurada; para
        // eso está la comprobación de pg_publication_tables.
        setEnVivo(estado === 'SUBSCRIBED')
      })

    return () => {
      setEnVivo(false)
      supabase.removeChannel(canal)
    }
  }, [cargar])

  /* ── Cálculos ──────────────────────────────────────────────────── */

  const datos = useMemo(() => {
    const hoy = hoyISO()
    const dentroDe7 = sumarDiasISO(hoy, 7)
    const mes = hoy.slice(0, 7)

    const pendientes = reservas.filter(r => r.status === ESTADOS.pending)
    const confirmadas = reservas.filter(r => r.status === ESTADOS.confirmed)

    // Jornadas confirmadas que caen de hoy en adelante, aplanadas: una
    // entrada por día reservado, no por reserva.
    const agenda = confirmadas
      .flatMap(r =>
        (r.booking_dates || [])
          .filter(d => d.date >= hoy)
          .map(d => ({
            id: d.id,
            fecha: d.date,
            jornada: d.jornada,
            layout: d.layout,
            asistentes: d.attendees,
            sala: r.rooms?.name || '—',
            referencia: r.reference,
          }))
      )
      .sort((a, b) => a.fecha.localeCompare(b.fecha))

    const jornadas7 = agenda.filter(j => j.fecha <= dentroDe7).length

    const delMes = (lista) => lista.filter(r => {
      const inicio = fechaInicio(r)
      return inicio && inicio.slice(0, 7) === mes
    })

    const confirmadasMes = delMes(confirmadas)
    const pendientesMes  = delMes(pendientes)

    const sumar = (lista) =>
      lista.reduce((t, r) => t + (Number(r.total_price) || 0), 0)

    return {
      pendientes,
      agenda,
      contadores: {
        sinContestar:    pendientes.length,
        jornadas7,
        confirmadasMes:  confirmadasMes.length,
        ingresosMes:     sumar(confirmadasMes),
        // Deliberadamente aparte: es dinero que aún puede no entrar.
        // Mezclarlo con lo confirmado daba un número que no servía para
        // tomar ninguna decisión.
        ingresosPorConfirmar: sumar(pendientesMes),
      },
    }
  }, [reservas])

  /* ── Cambiar el estado de una reserva ──────────────────────────── */

  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    setActualizando(id)

    // Optimista: se pinta el cambio ya y se deshace si la escritura
    // falla. Con una sola sala y un solo administrador el riesgo es
    // mínimo y la sensación es inmediata.
    const previo = reservas
    setReservas(prev => prev.map(r => (r.id === id ? { ...r, status: nuevoEstado } : r)))

    try {
      const { error: err } = await supabase
        .from('bookings')
        .update({ status: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err
      setError(null)
    } catch (err) {
      console.error('Error cambiando el estado:', err)
      setReservas(previo)
      setError('No se ha podido guardar el cambio. Vuelve a intentarlo.')
    } finally {
      setActualizando(null)
    }
  }, [reservas])

  return {
    ...datos,
    reservas,
    cargando,
    error,
    actualizando,
    enVivo,
    recargar: cargar,
    cambiarEstado,
  }
}

export default useDashboard