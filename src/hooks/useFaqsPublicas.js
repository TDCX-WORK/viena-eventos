import { useEffect, useState } from 'react'
// Diferido: ver lib/supabaseDiferido.js.
import { conSupabase, cuandoEsteOcioso } from '../lib/supabaseDiferido'
import { useDatosIniciales } from '../lib/datosIniciales'

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

/** Consulta sin estado. La usa el hook y también el prerender. */
export async function cargarFaqs(hotelId) {
  const supabase = await conSupabase()
  let consulta = supabase
    .from('faqs')
    .select('id, question, answer, sort_order')
    .eq('is_active', true)
    .order('sort_order')

  if (hotelId) consulta = consulta.eq('hotel_id', hotelId)

  const { data, error } = await consulta
  if (error) throw error
  return data || []
}

export function useFaqsPublicas(hotelId) {
  /* Con prerender, las preguntas ya vienen en el HTML: se arranca con
     ellas y sin estado de carga, para que el primer render coincida con
     el del servidor. Luego se refrescan igual que siempre. */
  const iniciales = useDatosIniciales()?.faqs

  const [faqs, setFaqs] = useState(() => iniciales ?? [])
  const [cargando, setCargando] = useState(!iniciales)

  useEffect(() => {
    let vivo = true

    async function cargar() {
      try {
        const data = await cargarFaqs(hotelId)
        if (vivo) setFaqs(data)
      } catch (err) {
        console.warn('No se han podido cargar las preguntas frecuentes:', err)
        // Si ya había preguntas del prerender, se quedan.
        if (vivo && !iniciales) setFaqs([])
      } finally {
        if (vivo) setCargando(false)
      }
    }

    // Igual que useHotelData: con prerender, el refresco espera.
    const cancelar = iniciales ? cuandoEsteOcioso(cargar) : (cargar(), () => {})
    return () => { vivo = false; cancelar() }
    // iniciales no cambia durante la vida de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId])

  return { faqs, cargando }
}

export default useFaqsPublicas