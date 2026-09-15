import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────────────────────────────
   Datos de la pantalla de Reservas.

   Misma convención que useDashboard: una sola consulta con los join, los
   cálculos en memoria y la pantalla solo pinta.

   LO NUEVO AQUÍ: la detección de solapamientos. El sistema permite
   confirmar dos reservas de la misma sala, el mismo día y la misma
   jornada sin decir nada. Arreglarlo del todo es cosa de la base de
   datos (ver el SQL que acompaña a esta pantalla), pero el panel puede
   al menos avisar antes de que ocurra, que es donde se toma la decisión.
   ───────────────────────────────────────────────────────────────────── */

/** Dos jornadas del mismo día chocan si son la misma o si alguna ocupa
 *  el día entero. Mañana y tarde conviven sin problema. */
function jornadasChocan(a, b) {
  const ja = a || 'completo'
  const jb = b || 'completo'
  return ja === jb || ja === 'completo' || jb === 'completo'
}

export function useReservas() {
  const [reservas, setReservas] = useState([])
  // Las ofertas hacen falta para recalcular el descuento de una reserva
  // y comprobar que el importe guardado es el que sale de aplicarla.
  const [ofertas, setOfertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [actualizando, setActualizando] = useState(null)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true)
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select(`
          id, reference, status, room_id,
          contact_name, contact_email, contact_phone, comments,
          base_price, extras_price, discount_amount, total_price,
          offer_id, offer_name, offer_code, created_at, updated_at,
          rooms ( name, slug, pricing ( half_day, full_day, weekend_supplement ) ),
          booking_dates ( id, date, jornada, layout, attendees ),
          booking_extras ( id, extras ( id, name, price_per_person, min_persons ) )
        `)
        .order('created_at', { ascending: false })

      if (err) throw err
      setReservas(data || [])

      // Si la tabla de ofertas aún no existe, se sigue adelante: la
      // pantalla funciona igual, solo que sin poder verificar descuentos.
      const { data: ofertasData } = await supabase.from('offers').select('*')
      setOfertas(ofertasData || [])

      setError(null)
    } catch (err) {
      console.error('Error cargando reservas:', err)
      setError('No se han podido cargar las reservas. Comprueba la conexión y vuelve a intentarlo.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  /* ── Solapamientos ─────────────────────────────────────────────────
     Mapa: por cada hueco (sala + día + jornada) ya confirmado, qué
     reserva lo ocupa. Se recalcula al cambiar la lista, así que en
     cuanto confirmas una el aviso aparece en las que chocan con ella. */
  const conflictos = useMemo(() => {
    const ocupados = []
    reservas
      .filter(r => r.status === 'confirmed')
      .forEach(r => {
        (r.booking_dates || []).forEach(d => {
          ocupados.push({
            reservaId: r.id,
            referencia: r.reference,
            roomId: r.room_id,
            fecha: d.date,
            jornada: d.jornada,
          })
        })
      })

    const mapa = {}
    reservas.forEach(r => {
      // Las canceladas no molestan a nadie ni les molesta nadie.
      if (r.status === 'cancelled') return

      const choques = []
      ;(r.booking_dates || []).forEach(d => {
        ocupados.forEach(o => {
          if (o.reservaId === r.id) return
          if (o.roomId !== r.room_id) return
          if (o.fecha !== d.date) return
          if (!jornadasChocan(o.jornada, d.jornada)) return
          choques.push({ fecha: d.date, jornada: d.jornada, con: o.referencia })
        })
      })

      if (choques.length > 0) mapa[r.id] = choques
    })

    return mapa
  }, [reservas])

  const contadores = useMemo(() => ({
    all:       reservas.length,
    pending:   reservas.filter(r => r.status === 'pending').length,
    confirmed: reservas.filter(r => r.status === 'confirmed').length,
    cancelled: reservas.filter(r => r.status === 'cancelled').length,
  }), [reservas])

  /* ── Cambiar estado ────────────────────────────────────────────── */

  const cambiarEstado = useCallback(async (id, nuevoEstado) => {
    setActualizando(id)

    const previo = reservas
    setReservas(prev => prev.map(r => (r.id === id ? { ...r, status: nuevoEstado } : r)))

    try {
      const { error: err } = await supabase
        .from('bookings')
        .update({ status: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (err) throw err
      setError(null)
      return true
    } catch (err) {
      console.error('Error cambiando el estado:', err)
      setReservas(previo)
      setError('No se ha podido guardar el cambio. Vuelve a intentarlo.')
      return false
    } finally {
      setActualizando(null)
    }
  }, [reservas])

  return {
    reservas,
    ofertas,
    conflictos,
    contadores,
    cargando,
    error,
    actualizando,
    recargar: cargar,
    cambiarEstado,
  }
}

/** Filtra por estado y por texto libre. Fuera del hook porque es puro y
 *  así se puede probar solo. */
export function filtrarReservas(reservas, estado, busqueda) {
  const q = busqueda.trim().toLowerCase()

  return reservas.filter(r => {
    if (estado !== 'all' && r.status !== estado) return false
    if (!q) return true
    return (
      r.reference?.toLowerCase().includes(q) ||
      r.contact_name?.toLowerCase().includes(q) ||
      r.contact_email?.toLowerCase().includes(q) ||
      r.contact_phone?.toLowerCase().includes(q) ||
      r.rooms?.name?.toLowerCase().includes(q)
    )
  })
}

export default useReservas