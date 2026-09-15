import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────────────────────────────
   Preguntas frecuentes en la web pública.

   Devuelve solo lo que hay guardado en la tabla. La decisión de qué
   enseñar cuando no hay nada NO se toma aquí: la toma el componente,
   que es quien tiene los datos del hotel para generar las automáticas.

   Que no exista la tabla (todavía no se ha ejecutado sql/faqs.sql) o
   que falle la consulta se trata igual que "no hay ninguna": la lista
   se queda vacía y el componente cae en las automáticas. Una FAQ no
   puede tumbar la portada.
   ───────────────────────────────────────────────────────────────────── */

export function useFaqsPublicas(hotelId) {
  const [faqs, setFaqs] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true

    async function cargar() {
      try {
        let consulta = supabase
          .from('faqs')
          .select('id, question, answer, sort_order')
          .eq('is_active', true)
          .order('sort_order')

        if (hotelId) consulta = consulta.eq('hotel_id', hotelId)

        const { data, error } = await consulta
        if (error) throw error
        if (vivo) setFaqs(data || [])
      } catch (err) {
        console.warn('No se han podido cargar las preguntas frecuentes:', err)
        if (vivo) setFaqs([])
      } finally {
        if (vivo) setCargando(false)
      }
    }

    cargar()
    return () => { vivo = false }
  }, [hotelId])

  return { faqs, cargando }
}

export default useFaqsPublicas