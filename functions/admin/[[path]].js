/* ─────────────────────────────────────────────────────────────────────
   Cloudflare Pages Function — sirve el panel en /admin y en todas sus
   subrutas (/admin/reservas, /admin/precios…).

   Antes esto era una regla de _redirects (/admin/*  /admin/index.html
   200), pero Cloudflare no la aplicaba y al recargar una subruta daba
   404. Una Function no depende de cómo resuelva Pages los .html: pide
   la plantilla del panel (dist/admin/index.html, que se sirve en
   /admin/) y la devuelve tal cual con estado 200.

   `[[path]]` significa "/admin y cualquier cosa debajo". Solo se
   ejecuta para esas URLs; la web pública sigue siendo HTML estático.

   wrangler la detecta sola al hacer `npm run deploy`, siempre que esta
   carpeta `functions` esté en la raíz del proyecto.
   ───────────────────────────────────────────────────────────────────── */

export async function onRequest({ request, env }) {
  const plantilla = await env.ASSETS.fetch(new URL('/admin/', request.url))

  const cabeceras = new Headers(plantilla.headers)
  cabeceras.set('X-Robots-Tag', 'noindex, nofollow')
  // El HTML apunta a los assets con hash del último build: nunca en caché.
  cabeceras.set('Cache-Control', 'no-cache')

  return new Response(plantilla.body, { status: 200, headers: cabeceras })
}