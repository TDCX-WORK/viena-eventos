import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { salasRelacionadas } from '../lib/constants'

/* ─────────────────────────────────────────────────────────────────────
   Datos de la pantalla de Disponibilidad.

   La pantalla vieja solo conocía blocked_dates, así que enseñaba
   "Disponible" en días que tenían una reserva confirmada encima. Aquí se
   juntan las tres cosas que ocupan una sala:

     1. bloqueo   — alguien lo bloqueó a mano desde el panel
     2. reserva   — hay una reserva confirmada
     3. solicitud — hay una petición sin contestar sobre ese hueco
     4. heredado  — otra sala relacionada está ocupada

   Solo el primero se puede desbloquear desde aquí. Una reserva o una
   solicitud se gestionan en Reservas, y lo heredado desaparece cuando
   se libera la sala de la que viene.

   LAS SOLICITUDES SE VEN PERO NO OCUPAN. La web pública inserta las
   reservas con status 'pending', así que si solo se pintara lo
   confirmado, una petición recién llegada no saldría por ningún lado y
   se podría bloquear ese día sin enterarse. Se pintan, pero NO se
   propagan a las salas hermanas ni bloquean nada: hasta que no se
   confirman, no ocupan el espacio.
   ───────────────────────────────────────────────────────────────────── */

export const TIPOS = {
  bloqueo:   'bloqueo',
  reserva:   'reserva',
  solicitud: 'solicitud',
  heredado:  'heredado',
}

/** Dos jornadas del mismo día chocan si son la misma o si alguna ocupa
 *  el día entero. Mañana y tarde conviven. */
export function jornadasChocan(a, b) {
  const ja = a || 'completo'
  const jb = b || 'completo'
  return ja === jb || ja === 'completo' || jb === 'completo'
}

export function useDisponibilidad() {
  const [salas, setSalas] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [reservados, setReservados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [borrando, setBorrando] = useState(null)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true)
    try {
      const [resSalas, resBloqueos, resReservas] = await Promise.all([
        supabase.from('rooms')
          .select('id, name, slug, sort_order')
          .order('sort_order'),

        supabase.from('blocked_dates')
          .select('id, room_id, date, jornada, reason')
          .order('date'),

        // El admin sí puede leer booking_dates, así que aquí no hace
        // falta la vista occupied_slots: se lee directo y además se
        // consigue la referencia, para poder decir QUÉ reserva ocupa.
        //
        // Se piden las confirmadas Y las pendientes. Solo con las
        // confirmadas, una solicitud recién llegada de la web no
        // aparecía en el calendario, que es justo cuando más falta hace
        // verla.
        supabase.from('booking_dates')
          .select('id, date, jornada, bookings!inner(id, reference, room_id, status, contact_name)')
          .in('bookings.status', ['confirmed', 'pending'])
          .order('date'),
      ])

      if (resSalas.error) throw resSalas.error
      if (resBloqueos.error) throw resBloqueos.error
      if (resReservas.error) throw resReservas.error

      setSalas(resSalas.data || [])
      setBloqueos(resBloqueos.data || [])
      setReservados(resReservas.data || [])
      setError(null)
    } catch (err) {
      console.error('Error cargando disponibilidad:', err)
      setError('No se han podido cargar los datos. Comprueba la conexión y vuelve a intentarlo.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  /* ── Ocupación por sala y día ──────────────────────────────────────
     ocupacion[slug][fecha] = [{ jornada, tipo, id?, motivo?, ... }] */
  const ocupacion = useMemo(() => {
    const porId = {}
    salas.forEach(s => { porId[s.id] = s })

    const mapa = {}
    const vistos = {}

    function anadir(slug, fecha, jornada, item) {
      if (!slug || !fecha) return
      const j = jornada || 'completo'
      const clave = `${slug}|${fecha}|${j}|${item.tipo}|${item.desde || ''}`
      if (vistos[clave]) return
      vistos[clave] = true

      if (!mapa[slug]) mapa[slug] = {}
      if (!mapa[slug][fecha]) mapa[slug][fecha] = []
      mapa[slug][fecha].push({ jornada: j, ...item })
    }

    // 1 · Directos
    bloqueos.forEach(b => {
      const sala = porId[b.room_id]
      if (!sala) return
      anadir(sala.slug, b.date, b.jornada, {
        tipo: TIPOS.bloqueo,
        id: b.id,
        motivo: b.reason || null,
      })
    })

    reservados.forEach(r => {
      const sala = porId[r.bookings?.room_id]
      if (!sala) return
      anadir(sala.slug, r.date, r.jornada, {
        tipo: r.bookings?.status === 'confirmed' ? TIPOS.reserva : TIPOS.solicitud,
        referencia: r.bookings?.reference,
        cliente: r.bookings?.contact_name,
      })
    })

    // 2 · Heredados. Sobre una copia, para no propagar lo ya propagado.
    const base = JSON.parse(JSON.stringify(mapa))

    Object.entries(base).forEach(([slug, porFecha]) => {
      Object.entries(porFecha).forEach(([fecha, items]) => {
        items.forEach(item => {
          // Las solicitudes no se propagan: todavía no ocupan nada.
          if (item.tipo === TIPOS.solicitud) return

          // El resto sí, en los dos sentidos: si el espacio unido no
          // está libre, ninguna de sus partes lo está.
          salasRelacionadas(slug).forEach(otra => {
            anadir(otra, fecha, item.jornada, {
              tipo: TIPOS.heredado,
              desde: slug,
              motivoOriginal: item.tipo,
              referencia: item.referencia || null,
            })
          })
        })
      })
    })

    return mapa
  }, [salas, bloqueos, reservados])

  /* ── Escrituras ────────────────────────────────────────────────── */

  /** Bloquea una lista de huecos en varias salas a la vez.
   *
   *  `entradas` es [{ fecha, jornada }], no una jornada suelta: en el
   *  calendario se pueden elegir varios días y darle a cada uno la suya
   *  (uno entero, otro solo la tarde). Con un único parámetro de jornada
   *  habría que bloquear en varias tandas.
   *
   *  No usa upsert con onConflict porque eso exige un índice único sobre
   *  (room_id, date, jornada) que puede no existir; en su lugar se
   *  filtra contra lo que ya hay. */
  const bloquear = useCallback(async (roomIds, entradas, motivo) => {
    if (roomIds.length === 0 || entradas.length === 0) return false
    setGuardando(true)

    try {
      const yaHay = new Set(bloqueos.map(b => `${b.room_id}|${b.date}|${b.jornada}`))

      const filas = []
      roomIds.forEach(roomId => {
        entradas.forEach(({ fecha, jornada }) => {
          if (yaHay.has(`${roomId}|${fecha}|${jornada}`)) return
          filas.push({
            room_id: roomId,
            date: fecha,
            jornada,
            reason: motivo?.trim() || null,
          })
        })
      })

      if (filas.length === 0) {
        setError(null)
        return true
      }

      const { error: err } = await supabase.from('blocked_dates').insert(filas)
      if (err) throw err

      await cargar({ silencioso: true })
      setError(null)
      return true
    } catch (err) {
      console.error('Error bloqueando fechas:', err)
      setError('No se han podido guardar los bloqueos. Vuelve a intentarlo.')
      return false
    } finally {
      setGuardando(false)
    }
  }, [bloqueos, cargar])

  const desbloquear = useCallback(async (id) => {
    setBorrando(id)
    const previo = bloqueos
    setBloqueos(prev => prev.filter(b => b.id !== id))

    try {
      const { error: err } = await supabase.from('blocked_dates').delete().eq('id', id)
      if (err) throw err
      setError(null)
      return true
    } catch (err) {
      console.error('Error desbloqueando:', err)
      setBloqueos(previo)
      setError('No se ha podido quitar el bloqueo. Vuelve a intentarlo.')
      return false
    } finally {
      setBorrando(null)
    }
  }, [bloqueos])

  return {
    salas,
    bloqueos,
    ocupacion,
    cargando,
    error,
    guardando,
    borrando,
    recargar: cargar,
    bloquear,
    desbloquear,
  }
}

/* Aplana la estructura de ocupación a una lista de filas ordenada. La
   usan tanto la vista de meses como los exportadores.

   Vive aquí y no en disponibilidadExport.js porque ese módulo se carga
   bajo demanda (arrastra exceljs, que pesa cerca de un mega) y esta
   función hace falta en el primer render. */
export function aplanarOcupacion(ocupacion, salas) {
  const porSlug = {}
  salas.forEach(s => { porSlug[s.slug] = s })

  const filas = []
  Object.entries(ocupacion).forEach(([slug, porFecha]) => {
    Object.entries(porFecha).forEach(([fecha, items]) => {
      items.forEach(item => {
        filas.push({
          ...item,
          fecha,
          slug,
          nombreSala: porSlug[slug]?.name || slug,
          nombreOrigen: item.desde ? (porSlug[item.desde]?.name || item.desde) : null,
        })
      })
    })
  })

  const orden = { bloqueo: 0, reserva: 1, solicitud: 2, heredado: 3 }
  return filas.sort((a, b) =>
    a.fecha.localeCompare(b.fecha) ||
    (salas.findIndex(s => s.slug === a.slug) - salas.findIndex(s => s.slug === b.slug)) ||
    (orden[a.tipo] - orden[b.tipo])
  )
}

export default useDisponibilidad