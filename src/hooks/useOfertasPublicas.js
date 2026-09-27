import { useCallback, useEffect, useMemo, useState } from 'react'
// Diferido: ver lib/supabaseDiferido.js.
import { conSupabase, cuandoEsteOcioso } from '../lib/supabaseDiferido'

/* ─────────────────────────────────────────────────────────────────────
   Ofertas en la web pública.

   DOS CAMINOS DISTINTOS A PROPÓSITO:

   · Las ofertas automáticas se leen de la vista `offers_publicas`, que
     no tiene la columna `code` y solo enseña las que no lo necesitan.

   · Las de código se piden de una en una con la función
     `oferta_por_codigo`. No hay lista que descargar, así que no se
     pueden enumerar: sin saber el código no se llega a la oferta.

   Si esto se hiciera con un `select * from offers`, cualquiera vería
   todos los códigos promocionales abriendo las DevTools.

   El contador de usos NO se toca desde aquí: lo sube el trigger
   bookings_aplicar_oferta al guardar la reserva. La antigua función
   registrar_uso_oferta se ha borrado: cualquiera podía llamarla y
   agotar una oferta sin reservar nada.

   El hook NO calcula nada. Solo trae las ofertas; el cálculo vive en
   lib/ofertas.js, que es el mismo motor que usa el panel.
   ───────────────────────────────────────────────────────────────────── */

export function useOfertasPublicas(hotelId) {
  const [automaticas, setAutomaticas] = useState([])

  /* `cargando` no es estado, se deduce.

     Guardar un booleano y apagarlo a mano obligaba a llamar a
     setCargando(false) en la salida temprana de "todavía no hay
     hotelId", o sea un setState en el cuerpo de un efecto: justo lo que
     provoca un render en cascada. Guardando en su lugar PARA QUÉ hotel
     se cargó, el booleano sale solo y siempre dice la verdad, incluso
     si algún día cambia el hotel en caliente. */
  const [cargadoPara, setCargadoPara] = useState(null)
  const cargando = Boolean(hotelId) && cargadoPara !== hotelId

  // Estado del código que escribe el cliente.
  const [codigo, setCodigo] = useState('')
  const [ofertaCodigo, setOfertaCodigo] = useState(null)
  const [estadoCodigo, setEstadoCodigo] = useState('idle')  // idle | validando | ok | mal

  useEffect(() => {
    let vivo = true

    /* Sin hotel todavía no hay nada que pedir.

       Antes, con hotelId a undefined, el filtro se saltaba y se
       descargaban las ofertas de TODOS los hoteles. Como el id llega un
       instante después que el resto de datos, eso era una consulta
       inútil en cada visita, además de la buena. */
    if (!hotelId) return

    async function cargar() {
      try {
        const supabase = await conSupabase()
        const consulta = supabase
          .from('offers_publicas')
          .select('*')
          .eq('hotel_id', hotelId)

        const { data, error } = await consulta
        if (error) throw error
        if (vivo) setAutomaticas(data || [])
      } catch (err) {
        // Que no haya ofertas no puede tumbar el proceso de reserva: se
        // sigue adelante con el precio sin descuento.
        console.warn('No se han podido cargar las ofertas:', err)
        if (vivo) setAutomaticas([])
      } finally {
        if (vivo) setCargadoPara(hotelId)
      }
    }

    /* Cuando el navegador esté libre (1,5 s como mucho). Las ofertas no
       van en el HTML prerenderizado, pero la píldora del hero puede
       aparecer un instante después sin mover nada de sitio, y para
       cuando alguien llega al formulario de reserva ya están. */
    const cancelar = cuandoEsteOcioso(cargar, 1500)
    return () => { vivo = false; cancelar() }
  }, [hotelId])

  /** Comprueba un código contra la base de datos. Devuelve true si vale.
   *  La función de Postgres no distingue entre "no existe", "caducado" y
   *  "agotado": contestar cuál de las tres ya sería filtrar información. */
  const aplicarCodigo = useCallback(async (texto) => {
    const limpio = (texto || '').trim()

    if (!limpio) {
      setCodigo('')
      setOfertaCodigo(null)
      setEstadoCodigo('idle')
      return false
    }

    setEstadoCodigo('validando')

    try {
      const supabase = await conSupabase()
      const { data, error } = await supabase.rpc('oferta_por_codigo', { p_codigo: limpio })
      if (error) throw error

      const fila = Array.isArray(data) ? data[0] : data
      if (!fila) {
        setOfertaCodigo(null)
        setCodigo(limpio)
        setEstadoCodigo('mal')
        return false
      }

      setOfertaCodigo(fila)
      setCodigo(limpio)
      setEstadoCodigo('ok')
      return true
    } catch (err) {
      console.warn('No se ha podido comprobar el código:', err)
      setOfertaCodigo(null)
      setEstadoCodigo('mal')
      return false
    }
  }, [])

  const quitarCodigo = useCallback(() => {
    setCodigo('')
    setOfertaCodigo(null)
    setEstadoCodigo('idle')
  }, [])

  /* Lo que se le pasa al motor: las automáticas más, si la hay, la del
     código. El motor ya se encarga de elegir la que más rebaje. */
  const ofertas = useMemo(
    () => (ofertaCodigo ? [...automaticas, ofertaCodigo] : automaticas),
    [automaticas, ofertaCodigo]
  )

  return {
    ofertas,
    /* Solo las automáticas, sin la del código.

       El escaparate de la portada usa esta y no `ofertas`: una oferta
       con código no se anuncia, precisamente porque hace falta el
       código. Cuando el hook vivía dentro del wizard daba igual, porque
       la portada tenía su propia copia sin códigos aplicados. Ahora que
       hay una sola instancia compartida, si el cliente aplica un código
       y vuelve atrás, `ofertas` lo llevaría dentro y la portada lo
       anunciaría a los cuatro vientos. */
    automaticas,
    cargando,
    codigo,
    ofertaCodigo,
    estadoCodigo,
    aplicarCodigo,
    quitarCodigo,
  }
}

export default useOfertasPublicas