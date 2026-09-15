import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { estadoOferta } from '../lib/ofertas'

/* ─────────────────────────────────────────────────────────────────────
   Ofertas: carga, alta, edición y borrado.

   Trae también salas y extras porque el formulario los necesita para
   los selectores, y la lista para traducir los slugs y los ids a
   nombres. Van en la misma tanda para no encadenar tres cargas y ver la
   pantalla montarse a trozos.
   ───────────────────────────────────────────────────────────────────── */

export function useOfertas() {
  const [ofertas, setOfertas] = useState([])
  const [salas, setSalas] = useState([])
  const [extras, setExtras] = useState([])
  const [hotelId, setHotelId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true)
    try {
      const [resHotel, resOfertas, resSalas, resExtras] = await Promise.all([
        supabase.from('hotels').select('id').eq('slug', 'suitesviena').single(),
        supabase.from('offers').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }),
        // Se traen las tarifas: la vista previa del formulario simula
        // con el precio real de la sala, no con una cifra inventada.
        supabase.from('rooms').select('id, name, slug, sort_order, pricing ( half_day, full_day, weekend_supplement )').order('sort_order'),
        supabase.from('extras').select('id, name, price_per_person, min_persons, category').order('sort_order'),
      ])

      if (resHotel.error)   throw resHotel.error
      if (resOfertas.error) throw resOfertas.error
      if (resSalas.error)   throw resSalas.error
      if (resExtras.error)  throw resExtras.error

      setHotelId(resHotel.data?.id || null)
      setOfertas(resOfertas.data || [])
      setSalas((resSalas.data || []).map(s => {
        const p = s.pricing?.[0] || {}
        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          halfDay: Number(p.half_day) || 0,
          fullDay: Number(p.full_day) || 0,
          weekendSupplement: Number(p.weekend_supplement) || 0,
        }
      }))
      setExtras((resExtras.data || []).map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        pricePerPerson: Number(e.price_per_person),
        minPersons: e.min_persons,
      })))
      setError(null)
    } catch (err) {
      console.error('Error cargando ofertas:', err)
      // El código 42P01 es "la tabla no existe": pasa si aún no se ha
      // ejecutado sql/ofertas.sql, y merece un mensaje que lo diga en
      // vez de un "error de conexión" que despista.
      setError(
        err?.code === '42P01'
          ? 'La tabla de ofertas todavía no existe. Ejecuta sql/ofertas.sql en Supabase.'
          : 'No se han podido cargar las ofertas. Comprueba la conexión y vuelve a intentarlo.'
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const contadores = useMemo(() => {
    const c = { todas: ofertas.length, activa: 0, programada: 0, caducada: 0, desactivada: 0, agotada: 0 }
    ofertas.forEach(o => { c[estadoOferta(o)] = (c[estadoOferta(o)] || 0) + 1 })
    return c
  }, [ofertas])

  /** Alta y edición comparten camino: si viene id, actualiza. */
  const guardar = useCallback(async (datos, id = null) => {
    setGuardando(true)
    try {
      const fila = {
        hotel_id: hotelId,
        name: datos.name.trim(),
        description: datos.description?.trim() || null,
        discount_type: datos.discount_type,
        discount_value: Number(datos.discount_value) || 0,
        starts_on: datos.starts_on || null,
        ends_on: datos.ends_on || null,
        room_slugs: datos.room_slugs || [],
        jornadas: datos.jornadas || [],
        weekdays: datos.weekdays || [],
        min_days: Number(datos.min_days) || 1,
        min_attendees: datos.min_attendees ? Number(datos.min_attendees) : null,
        min_amount: datos.min_amount ? Number(datos.min_amount) : null,
        min_lead_days: datos.min_lead_days ? Number(datos.min_lead_days) : null,
        max_lead_days: datos.max_lead_days ? Number(datos.max_lead_days) : null,
        free_extra_ids: datos.free_extra_ids || [],
        // Los códigos se guardan en mayúsculas: se comparan sin
        // distinguir, pero así se leen igual en todas partes.
        code: datos.code?.trim() ? datos.code.trim().toUpperCase() : null,
        max_uses: datos.max_uses ? Number(datos.max_uses) : null,
        priority: Number(datos.priority) || 0,
        is_active: datos.is_active !== false,
        updated_at: new Date().toISOString(),
      }

      const { error: err } = id
        ? await supabase.from('offers').update(fila).eq('id', id)
        : await supabase.from('offers').insert(fila)

      if (err) throw err

      await cargar({ silencioso: true })
      setError(null)
      return true
    } catch (err) {
      console.error('Error guardando la oferta:', err)
      // 23505 es violación de índice único: aquí solo puede ser el código.
      setError(
        err?.code === '23505'
          ? 'Ya existe otra oferta con ese código promocional.'
          : 'No se ha podido guardar la oferta. Vuelve a intentarlo.'
      )
      return false
    } finally {
      setGuardando(false)
    }
  }, [hotelId, cargar])

  /** Activar y desactivar es la acción más frecuente, así que va suelta
   *  y optimista: se pinta el cambio al instante. */
  const alternarActiva = useCallback(async (oferta) => {
    const previo = ofertas
    setOfertas(prev => prev.map(o => (o.id === oferta.id ? { ...o, is_active: !o.is_active } : o)))

    const { error: err } = await supabase
      .from('offers')
      .update({ is_active: !oferta.is_active, updated_at: new Date().toISOString() })
      .eq('id', oferta.id)

    if (err) {
      console.error('Error cambiando el estado:', err)
      setOfertas(previo)
      setError('No se ha podido cambiar el estado. Vuelve a intentarlo.')
      return false
    }
    setError(null)
    return true
  }, [ofertas])

  const eliminar = useCallback(async (id) => {
    const previo = ofertas
    setOfertas(prev => prev.filter(o => o.id !== id))

    const { error: err } = await supabase.from('offers').delete().eq('id', id)
    if (err) {
      console.error('Error eliminando la oferta:', err)
      setOfertas(previo)
      setError('No se ha podido eliminar la oferta. Vuelve a intentarlo.')
      return false
    }
    setError(null)
    return true
  }, [ofertas])

  return {
    ofertas, salas, extras, contadores,
    cargando, error, guardando,
    recargar: cargar, guardar, alternarActiva, eliminar,
  }
}

export default useOfertas