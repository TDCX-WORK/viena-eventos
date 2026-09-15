import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────────────────────────────
   Preguntas frecuentes: carga, alta, edición, borrado y orden.

   Trae también salas y extras, ya con la misma forma que les da
   useHotelData. No es capricho: la pantalla necesita poder generar las
   preguntas automáticas con construirFaq(), y esa función espera ese
   formato exacto. Si aquí se devolvieran las filas crudas de Supabase,
   habría dos maneras distintas de leer lo mismo y la vista previa del
   panel diría precios que no coinciden con los de la web.
   ───────────────────────────────────────────────────────────────────── */

export function useFaqs() {
  const [faqs, setFaqs] = useState([])
  const [hotel, setHotel] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setCargando(true)
    try {
      const { data: hotelRow, error: hErr } = await supabase
        .from('hotels')
        .select('id, address, phone, email')
        .eq('slug', 'suitesviena')
        .single()
      if (hErr) throw hErr

      const [resFaqs, resSalas, resExtras] = await Promise.all([
        supabase.from('faqs').select('*').eq('hotel_id', hotelRow.id).order('sort_order'),
        supabase
          .from('rooms')
          .select('name, slug, size_m2, sort_order, pricing (*), room_layouts (*)')
          .eq('hotel_id', hotelRow.id)
          .order('sort_order'),
        supabase
          .from('extras')
          .select('category, price_per_person, is_active')
          .eq('hotel_id', hotelRow.id),
      ])

      if (resFaqs.error)   throw resFaqs.error
      if (resSalas.error)  throw resSalas.error
      if (resExtras.error) throw resExtras.error

      setFaqs(resFaqs.data || [])
      setHotel({
        _dbId: hotelRow.id,
        address: hotelRow.address,
        phone: hotelRow.phone,
        email: hotelRow.email,
        rooms: (resSalas.data || []).map(r => ({
          name: r.name,
          slug: r.slug,
          size: r.size_m2,
          pricing: {
            halfDay: Number(r.pricing?.[0]?.half_day) || 0,
            fullDay: Number(r.pricing?.[0]?.full_day) || 0,
          },
          layouts: (r.room_layouts || []).map(l => ({ max: l.max_capacity })),
        })),
        extras: (resExtras.data || []).map(e => ({
          category: e.category,
          pricePerPerson: Number(e.price_per_person),
          isActive: e.is_active ?? true,
        })),
      })
      setError(null)
    } catch (err) {
      console.error('Error cargando las preguntas frecuentes:', err)
      // 42P01 es "la tabla no existe": pasa si aún no se ha ejecutado
      // sql/faqs.sql, y merece un mensaje que lo diga en vez de un
      // "error de conexión" que no ayuda a nadie.
      setError(
        err?.code === '42P01'
          ? 'La tabla de preguntas todavía no existe. Ejecuta sql/faqs.sql en Supabase.'
          : 'No se han podido cargar las preguntas. Comprueba la conexión y vuelve a intentarlo.'
      )
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  /** Alta y edición comparten camino: si viene id, actualiza. */
  const guardar = useCallback(async (datos, id = null) => {
    if (!hotel?._dbId) return false
    setGuardando(true)
    try {
      const fila = {
        hotel_id: hotel._dbId,
        question: datos.question.trim(),
        answer: datos.answer.trim(),
        is_active: datos.is_active !== false,
      }

      // Las nuevas van al final. Se calcula aquí y no en la base de
      // datos porque un DEFAULT no puede mirar el resto de la tabla.
      if (!id) {
        fila.sort_order = faqs.reduce((max, f) => Math.max(max, f.sort_order ?? 0), -1) + 1
      }

      const { error: err } = id
        ? await supabase.from('faqs').update(fila).eq('id', id)
        : await supabase.from('faqs').insert(fila)
      if (err) throw err

      await cargar({ silencioso: true })
      setError(null)
      return true
    } catch (err) {
      console.error('Error guardando la pregunta:', err)
      setError('No se ha podido guardar la pregunta. Vuelve a intentarlo.')
      return false
    } finally {
      setGuardando(false)
    }
  }, [hotel, faqs, cargar])

  /** Inserta de golpe la lista de preguntas automáticas. Se usa desde
   *  el estado vacío, para empezar con algo escrito en vez de con una
   *  pantalla en blanco. */
  const importar = useCallback(async (preguntas) => {
    if (!hotel?._dbId || preguntas.length === 0) return false
    setGuardando(true)
    try {
      const desde = faqs.reduce((max, f) => Math.max(max, f.sort_order ?? 0), -1) + 1
      const filas = preguntas.map((p, i) => ({
        hotel_id: hotel._dbId,
        question: p.pregunta,
        answer: p.respuesta,
        sort_order: desde + i,
        is_active: true,
      }))

      const { error: err } = await supabase.from('faqs').insert(filas)
      if (err) throw err

      await cargar({ silencioso: true })
      setError(null)
      return true
    } catch (err) {
      console.error('Error importando las preguntas automáticas:', err)
      setError('No se han podido copiar las preguntas. Vuelve a intentarlo.')
      return false
    } finally {
      setGuardando(false)
    }
  }, [hotel, faqs, cargar])

  /** Activar y desactivar es lo más frecuente, así que va optimista:
   *  se pinta el cambio al instante y se deshace si falla. */
  const alternarActiva = useCallback(async (faq) => {
    const previo = faqs
    setFaqs(prev => prev.map(f => (f.id === faq.id ? { ...f, is_active: !f.is_active } : f)))

    const { error: err } = await supabase
      .from('faqs')
      .update({ is_active: !faq.is_active })
      .eq('id', faq.id)

    if (err) {
      console.error('Error cambiando el estado:', err)
      setFaqs(previo)
      setError('No se ha podido cambiar el estado. Vuelve a intentarlo.')
      return false
    }
    setError(null)
    return true
  }, [faqs])

  const eliminar = useCallback(async (id) => {
    const previo = faqs
    setFaqs(prev => prev.filter(f => f.id !== id))

    const { error: err } = await supabase.from('faqs').delete().eq('id', id)
    if (err) {
      console.error('Error eliminando la pregunta:', err)
      setFaqs(previo)
      setError('No se ha podido eliminar la pregunta. Vuelve a intentarlo.')
      return false
    }
    setError(null)
    return true
  }, [faqs])

  /* ── Orden ──────────────────────────────────────────────────────────
     Subir o bajar una pregunta es intercambiar su sort_order con el del
     vecino. Se mandan los dos UPDATE y se recarga.

     Nota: no van en una transacción. Si el segundo fallara, dos filas
     compartirían número de orden y la lista se vería desordenada, pero
     no se pierde nada y se arregla volviendo a pulsar. Para meter esto
     en una transacción de verdad haría falta una función de Postgres, y
     no compensa por reordenar siete preguntas. */
  const mover = useCallback(async (id, direccion) => {
    const ordenadas = [...faqs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    const i = ordenadas.findIndex(f => f.id === id)
    const j = direccion === 'arriba' ? i - 1 : i + 1
    if (i === -1 || j < 0 || j >= ordenadas.length) return false

    const a = ordenadas[i]
    const b = ordenadas[j]

    const previo = faqs
    setFaqs(prev => prev.map(f => {
      if (f.id === a.id) return { ...f, sort_order: b.sort_order }
      if (f.id === b.id) return { ...f, sort_order: a.sort_order }
      return f
    }))

    const [r1, r2] = await Promise.all([
      supabase.from('faqs').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('faqs').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])

    if (r1.error || r2.error) {
      console.error('Error reordenando:', r1.error || r2.error)
      setFaqs(previo)
      setError('No se ha podido cambiar el orden. Vuelve a intentarlo.')
      return false
    }
    setError(null)
    return true
  }, [faqs])

  return {
    faqs, hotel,
    cargando, error, guardando,
    recargar: cargar, guardar, importar, alternarActiva, eliminar, mover,
  }
}

export default useFaqs