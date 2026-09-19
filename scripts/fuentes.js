/* ─────────────────────────────────────────────────────────────────────
   DESCARGA DE TIPOGRAFÍAS — `npm run fuentes`

   Se ejecuta A MANO, una vez, y el resultado se sube al repositorio.
   NO forma parte de `npm run build`: los ficheros ya están en
   public/fonts y el build no tiene por qué depender de que Google
   responda.

   POR QUÉ. Hasta ahora las fuentes se pedían a fonts.googleapis.com en
   cada visita. Eso significa que el navegador de cada visitante manda
   su dirección IP a Google sin que nadie le haya preguntado, lo que en
   Europa es un tratamiento de datos discutible (hay sentencias en
   Alemania al respecto) y obligaría a hablar de ello en la política de
   cookies. Sirviéndolas desde nuestro propio dominio no sale un solo
   byte hacia terceros y, de paso, se ahorran dos conexiones nuevas
   (DNS + TLS con googleapis y con gstatic) en la carga inicial.

   QUÉ BAJA. Solo el subconjunto `latin`, que es el que cubre el español
   entero —tildes, ñ, ¿, ¡— y el símbolo del euro. Los subconjuntos
   cirílico y vietnamita que sirve Google no se usan aquí.

   Son fuentes variables: un único fichero por familia cubre todos los
   pesos, así que pesan menos que los cuatro o cinco ficheros estáticos
   que harían falta si no.

   SI SE CAMBIA UN PESO O UNA FAMILIA: se toca FAMILIAS, se vuelve a
   ejecutar y se actualiza src/styles/fuentes.css a mano para que los
   `font-weight` del @font-face coincidan.

   LICENCIAS. Inter y Playfair Display son SIL Open Font License 1.1,
   que permite expresamente alojarlas uno mismo. El texto de la licencia
   se guarda junto a los ficheros.
   ───────────────────────────────────────────────────────────────────── */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = path.join(RAIZ, 'public', 'fonts')

/* Sin un User-Agent de navegador moderno, Google devuelve la versión
   antigua de la hoja: ficheros .ttf estáticos en vez de .woff2
   variables. Es el mismo truco que usan todas las herramientas de
   autoalojamiento. */
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/* Los pesos tienen que ser los mismos que pedía el <link> del
   index.html, ni uno más:
     Inter            300, 400, 500, 600
     Playfair Display 400–700 normal y 400–500 cursiva */
const FAMILIAS = [
  {
    fichero: 'inter-latin.woff2',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300..600&display=swap',
    estilo: 'normal',
  },
  {
    fichero: 'playfair-latin.woff2',
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400..700&display=swap',
    estilo: 'normal',
  },
  {
    fichero: 'playfair-latin-italic.woff2',
    url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400..500&display=swap',
    estilo: 'italic',
  },
]

/** Del CSS de Google, el bloque @font-face del subconjunto latino.
 *  Se reconoce por su unicode-range, que siempre empieza por U+0000-00FF
 *  (el latino básico más los acentos). El comentario `/* latin *` que
 *  Google pone encima no se usa porque no está garantizado. */
function urlDelLatino(css, estilo) {
  const bloques = css.match(/@font-face\s*\{[^}]*\}/g) || []

  for (const bloque of bloques) {
    if (!bloque.includes('U+0000-00FF')) continue
    // La cursiva y la redonda vienen en la misma hoja cuando se piden
    // las dos: hay que quedarse con la que toca.
    const esCursiva = /font-style:\s*italic/.test(bloque)
    if ((estilo === 'italic') !== esCursiva) continue

    const url = bloque.match(/url\((https:\/\/[^)]+\.woff2)\)/)
    if (url) return url[1]
  }
  return null
}

async function bajar(familia) {
  const respuesta = await fetch(familia.url, { headers: { 'User-Agent': UA } })
  if (!respuesta.ok) {
    throw new Error(`Google responde ${respuesta.status} para ${familia.fichero}`)
  }

  const css = await respuesta.text()
  const url = urlDelLatino(css, familia.estilo)
  if (!url) {
    throw new Error(
      `No encuentro el subconjunto latino de ${familia.fichero}. ` +
      'Puede que Google haya cambiado el formato de la hoja: revisa scripts/fuentes.js.'
    )
  }

  const fuente = await fetch(url)
  if (!fuente.ok) throw new Error(`No se descarga ${url} (${fuente.status})`)

  const bytes = Buffer.from(await fuente.arrayBuffer())
  await fs.writeFile(path.join(DESTINO, familia.fichero), bytes)

  console.log(`[fuentes] ${familia.fichero} — ${(bytes.length / 1024).toFixed(1)} kB`)
}

const LICENCIA = `Inter y Playfair Display se distribuyen bajo la SIL Open Font
License, versión 1.1, que permite alojar los ficheros en el propio servidor.

  Inter            — Copyright The Inter Project Authors
                     https://github.com/rsms/inter
  Playfair Display — Copyright The Playfair Display Project Authors
                     https://github.com/clauseggers/Playfair-Display

Texto completo de la licencia: https://openfontlicense.org

Los ficheros .woff2 de esta carpeta los descarga scripts/fuentes.js
(npm run fuentes) desde la API de Google Fonts. No se editan a mano.
`

async function main() {
  await fs.mkdir(DESTINO, { recursive: true })
  for (const familia of FAMILIAS) await bajar(familia)
  await fs.writeFile(path.join(DESTINO, 'LICENCIA.txt'), LICENCIA)
  console.log('[fuentes] Listo. Sube public/fonts al repositorio.')
}

main().catch(err => {
  console.error('[fuentes] ERROR:', err.message)
  process.exit(1)
})