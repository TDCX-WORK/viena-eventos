/* ─────────────────────────────────────────────────────────────────────
   Cliente de Supabase bajo demanda, para la web pública.

   El cliente completo (@supabase/supabase-js) pesa unos 215 kB sin
   comprimir: autenticación, tiempo real, storage… La portada no lo
   necesita para pintarse, porque llega prerenderizada con los datos
   dentro del HTML. Solo lo usa DESPUÉS, para refrescarlos.

   Importado de forma estática, iba dentro del JavaScript inicial y el
   móvil tenía que descargarlo y evaluarlo antes de poder pintar la
   foto del hero (PageSpeed lo cuenta en el LCP). Con import() Vite lo
   separa en su propio fichero y se descarga cuando alguien lo pide,
   con la página ya pintada.

   Los hooks públicos usan esto. El panel y el wizard de reserva siguen
   importando lib/supabase.js directamente: ya van en ficheros aparte
   que solo se cargan cuando hacen falta.
   ───────────────────────────────────────────────────────────────────── */

let promesa = null

/** Devuelve el cliente de Supabase, cargándolo la primera vez. */
export function conSupabase() {
  if (!promesa) promesa = import('./supabase').then(m => m.supabase)
  return promesa
}

/**
 * Ejecuta `fn` cuando el navegador esté libre (o a los `maxMs` como
 * mucho). Devuelve una función para cancelarlo.
 *
 * Para los refrescos de datos de la portada: el HTML ya trae los datos
 * del build, así que no corre prisa. Lanzarlos al arrancar metía la
 * carga del cliente de Supabase justo en el momento en que el móvil
 * está pintando la primera pantalla, y PageSpeed lo cuenta como
 * "tiempo de bloqueo".
 *
 * requestIdleCallback no existe en Safari: allí, un setTimeout.
 */
export function cuandoEsteOcioso(fn, maxMs = 3000) {
  if (typeof window === 'undefined') { fn(); return () => {} }
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: maxMs })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, Math.min(maxMs, 1500))
  return () => clearTimeout(id)
}