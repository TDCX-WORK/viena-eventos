/* ─────────────────────────────────────────────────────────────────────
   PRERENDER — se ejecuta al final de `npm run build`.

   1. Lee Supabase (con las mismas VITE_SUPABASE_* del build).
   2. Genera el HTML real de cada ruta pública y lo escribe en dist/.
   3. Mete en ese HTML los datos usados (para que React hidrate sin
      repetir el trabajo) y el JSON-LD del negocio con precios reales.
   4. Crea dist/admin/index.html: la app vacía, sin prerender, para el
      panel.
   5. Regenera dist/sitemap.xml con la fecha del build.

   Si Supabase falla, el build falla y Cloudflare mantiene el despliegue
   anterior. Mejor eso que publicar una portada sin salas.

   Para probar sin conexión:
     PRERENDER_DATOS=ruta/a/datos.json node scripts/prerender.js
   (el JSON con la forma { hotel: {...filas}, faqs: [...] })

   PÁGINAS NUEVAS: se declaran en rutasPublicas() de
   src/entry-server.jsx, con su fichero, su cabecera y su JSON-LD.
   /salas/viena se escribe como dist/salas/viena.html: Cloudflare la
   sirve en /salas/viena sin tocar _redirects.
   ───────────────────────────────────────────────────────────────────── */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(RAIZ, 'dist')
const SERVER = path.join(RAIZ, 'dist-server')

const MARCA_APP = '<!--app-html-->'
const MARCA_DATOS = '<!--datos-iniciales-->'
const MARCA_JSONLD = '<!--jsonld-negocio-->'

/* Las dos precargas de la foto del hero (móvil y escritorio). Solo
   tienen sentido en la portada: en el resto de páginas no hay hero y
   el navegador bajaría la foto para nada. Con la `g` se quitan las dos. */
const PRECARGA_HERO = /[ \t]*<link rel="preload" as="image"[^>]*>\r?\n?/g

/* ── Cabecera por página ──
   Sustituye en la plantilla lo que cambia de una URL a otra. Si alguna
   etiqueta no se encuentra, el build falla: una página con el título o
   el canonical de otra es peor que no publicar. */
const escAttr = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const escTexto = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')

function ponerCabecera(html, { titulo, descripcion, ruta, noindex }, dominio) {
  const url = `${dominio}${ruta}`

  const reemplazar = (patron, nuevo) => {
    if (!patron.test(html)) throw new Error(`index.html: no encuentro ${patron}`)
    html = html.replace(patron, nuevo)
  }

  reemplazar(/<title>[\s\S]*?<\/title>/, () => `<title>${escTexto(titulo)}</title>`)

  // Atributos: se cambia solo el valor, lo de delante se conserva.
  const atributos = [
    [/(<meta name="description" content=")[^"]*/, descripcion],
    [/(<link rel="canonical" href=")[^"]*/, url],
    [/(<meta property="og:title" content=")[^"]*/, titulo],
    [/(<meta property="og:description" content=")[^"]*/, descripcion],
    [/(<meta property="og:url" content=")[^"]*/, url],
    [/(<meta name="twitter:title" content=")[^"]*/, titulo],
    [/(<meta name="twitter:description" content=")[^"]*/, descripcion],
  ]
  for (const [patron, valor] of atributos) {
    reemplazar(patron, (_, antes) => antes + escAttr(valor))
  }

  /* Páginas que no se quieren en Google (de momento, los borradores
     legales). Se cambia la etiqueta que ya existe en la plantilla; si
     `noindex` es falso se queda el index,follow de siempre. */
  if (noindex) {
    reemplazar(
      /<meta name="robots"[^>]*>/,
      '<meta name="robots" content="noindex, follow" />',
    )
  }

  return html
}

async function main() {
  const srv = await import(pathToFileURL(path.join(SERVER, 'entry-server.js')).href)
  const { serializarParaScript, ID_SCRIPT_DATOS, DOMINIO } = srv

  const plantilla = await fs.readFile(path.join(DIST, 'index.html'), 'utf8')
  for (const marca of [MARCA_APP, MARCA_DATOS, MARCA_JSONLD]) {
    if (!plantilla.includes(marca)) {
      throw new Error(`index.html no tiene la marca ${marca}. ¿Se ha tocado la plantilla?`)
    }
  }

  // ── Panel: la app sin prerender ni SEO ──
  // Se escribe ANTES de sobrescribir dist/index.html.
  const shellAdmin = plantilla
    .replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex, nofollow" />')
    .replace(/<link rel="canonical"[^>]*>/, '')
    .replace(PRECARGA_HERO, '')
  await fs.mkdir(path.join(DIST, 'admin'), { recursive: true })
  await fs.writeFile(path.join(DIST, 'admin', 'index.html'), shellAdmin)

  // ── Datos ──
  const datos = process.env.PRERENDER_DATOS
    ? JSON.parse(await fs.readFile(process.env.PRERENDER_DATOS, 'utf8'))
    : await srv.cargarDatosIniciales()

  const salas = datos.hotel?.rooms?.length || 0
  if (salas === 0) throw new Error('Supabase no ha devuelto ninguna sala. No se publica.')

  const scriptDatos =
    `<script id="${ID_SCRIPT_DATOS}" type="application/json">${serializarParaScript(datos)}</script>`

  // ── Rutas públicas ──
  const rutas = srv.rutasPublicas(datos)

  for (const ruta of rutas) {
    const html = srv.render(ruta.url, datos)
    const bloquesJsonLd = (Array.isArray(ruta.jsonLd) ? ruta.jsonLd : [ruta.jsonLd])
      .map(j => `<script type="application/ld+json">${serializarParaScript(j)}</script>`)
      .join('\n    ')

    const base = ruta.url === '/' ? plantilla : plantilla.replace(PRECARGA_HERO, '')
    const pagina = ponerCabecera(base, ruta.cabecera, DOMINIO)
      .replace(MARCA_APP, () => html)
      .replace(MARCA_DATOS, () => scriptDatos)
      .replace(MARCA_JSONLD, () => bloquesJsonLd)

    const destino = path.join(DIST, ruta.archivo)
    await fs.mkdir(path.dirname(destino), { recursive: true })
    await fs.writeFile(destino, pagina)
    console.log(`[prerender] ${ruta.url} → dist/${ruta.archivo} (${(pagina.length / 1024).toFixed(1)} kB)`)
  }

  // ── Sitemap ──
  const hoy = new Date().toISOString().slice(0, 10)
  // Una página con noindex en el sitemap es una señal contradictoria:
  // se le pide a Google que la rastree y que no la indexe a la vez.
  const urls = rutas.filter(r => !r.cabecera.noindex).map(r => `  <url>
    <loc>${DOMINIO}${r.url}</loc>
    <lastmod>${hoy}</lastmod>
  </url>`).join('\n')
  await fs.writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`
  )

  await fs.rm(SERVER, { recursive: true, force: true })
  console.log(`[prerender] Listo: ${rutas.length} ruta(s), ${salas} salas, ${datos.faqs?.length || 0} FAQ propias.`)
}

main()
  // El cliente de Supabase puede dejar temporizadores vivos: se sale a mano.
  .then(() => process.exit(0))
  .catch(err => {
    console.error('[prerender] ERROR:', err)
    process.exit(1)
  })