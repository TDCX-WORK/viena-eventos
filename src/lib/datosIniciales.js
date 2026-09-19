import { createContext, useContext } from 'react'

/* ─────────────────────────────────────────────────────────────────────
   Datos que llegan ya dentro del HTML.

   En el build, scripts/prerender.js consulta Supabase, genera el HTML de
   la portada con esos datos y los deja además en un
   <script id="datos-iniciales" type="application/json">.

   Al abrir la página, React lee ese mismo JSON y hace su primer render
   con él. Tiene que ser idéntico al del servidor: si no, React avisa de
   un "hydration mismatch" y repinta todo.

   Después los hooks vuelven a pedir los datos a Supabase por si han
   cambiado desde el último despliegue. El visitante siempre ve lo
   último; el HTML (lo que lee Google) se actualiza en cada build.

   En `npm run dev` no hay prerender: el contexto vale null y los hooks
   cargan como siempre.
   ───────────────────────────────────────────────────────────────────── */

export const DatosInicialesContext = createContext(null)

export function useDatosIniciales() {
  return useContext(DatosInicialesContext)
}

export const ID_SCRIPT_DATOS = 'datos-iniciales'

/** Navegador: lee el JSON incrustado. null si no hay (dev, /admin). */
export function leerDatosIniciales() {
  const el = document.getElementById(ID_SCRIPT_DATOS)
  if (!el) return null
  try {
    return JSON.parse(el.textContent)
  } catch {
    return null
  }
}

/** Build: JSON seguro para meter dentro de un <script>. Escapar "<"
 *  evita que un texto con "</script>" cierre la etiqueta antes de hora. */
export function serializarParaScript(datos) {
  return JSON.stringify(datos).replace(/</g, '\\u003c')
}