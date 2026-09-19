/* ─────────────────────────────────────────────────────────────────────
   GENERAR EL MAPA DEL ENTORNO — se ejecuta a mano, una sola vez.

     node scripts/generar-mapa.js

   Descarga de OpenStreetMap las calles, edificios, parques y agua que
   rodean al hotel y los convierte en un SVG ligero, en grises y SIN
   fondo, para la sección de contacto. También saca la posición real de
   las estaciones de metro y de los puntos de referencia.

   Crea dos ficheros:
     src/assets/mapa/entorno.svg   el dibujo
     src/assets/mapa/puntos.json   hotel, metros y referencias, ya
                                   colocados sobre el dibujo

   Opciones (variables de entorno):
     ANCHO_M=1800         metros de ancho que cubre el mapa (alto = 2/3)
     EDIFICIOS=0          sin edificios (más ligero, menos textura)
     HOTEL=40.42,-3.71    coordenadas exactas del hotel (lat,lon)
     REFRESCAR=1          volver a descargar aunque haya caché
     MAPA_DATOS=f         usar un JSON ya descargado en vez de pedirlo

   La descarga va en cuatro partes y cada una se guarda en
   scripts/.mapa-osm/ en cuanto llega. Si un servidor falla a mitad,
   al volver a ejecutar solo se pide lo que falta.

   Los datos son © colaboradores de OpenStreetMap (licencia ODbL): la
   web tiene que mostrar esa atribución junto al mapa.

   No necesita instalar nada: usa el fetch de Node 20+.
   ───────────────────────────────────────────────────────────────────── */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SALIDA = path.join(RAIZ, 'src', 'assets', 'mapa')
const CACHE = path.join(RAIZ, 'scripts', '.mapa-osm')

/* ── Hotel ─────────────────────────────────────────────────────────────
   Coordenadas de respaldo (las mismas del index.html). El script intenta
   confirmarlas con la dirección y avisa si no cuadran. */
const DIRECCION = 'Calle de Juan Álvarez Mendizábal 17, 28008 Madrid, España'
const RESPALDO = { lat: 40.425055, lon: -3.714941 }   // Google Maps, sobre el edificio

/* ── Encuadre ──────────────────────────────────────────────────────── */
const ANCHO_M = Number(process.env.ANCHO_M) || 1800
const ALTO_M = Math.round(ANCHO_M * 2 / 3)
const VB_W = 1200                       // viewBox del SVG
const VB_H = 800
const PX_POR_M = VB_W / ANCHO_M
const EDIFICIOS = process.env.EDIFICIOS !== '0'

// Para las estaciones se mira un poco más lejos: Argüelles puede caer
// fuera del dibujo y aun así interesa decir a cuántos minutos está.
const RADIO_POI_M = 1400

// Referencias que se buscan por nombre.
const REFERENCIAS = [
  { id: 'debod', nombre: 'Templo de Debod', filtro: '["name"~"Templo de Debod",i]' },
  { id: 'plaza-espana', nombre: 'Plaza de España', filtro: '["name"="Plaza de España"]["place"="square"]' },
  { id: 'palacio-real', nombre: 'Palacio Real', filtro: '["name"="Palacio Real de Madrid"]' },
  { id: 'principe-pio', nombre: 'Príncipe Pío', filtro: '["name"~"^Príncipe Pío$"]["railway"="station"]' },
]

const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const RONDAS = 3                       // vueltas completas a la lista
const ESPERA_S = [0, 20, 45]           // pausa antes de cada vuelta

const UA = 'suitesvienaeventos.com mapa (generacion unica)'

/* ── Utilidades geográficas ───────────────────────────────────────── */

const RAD = Math.PI / 180

function distanciaM(a, b) {
  const R = 6371000
  const dLat = (b.lat - a.lat) * RAD
  const dLon = (b.lon - a.lon) * RAD
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function crearProyeccion(centro) {
  const mLat = 111132.92 - 559.82 * Math.cos(2 * centro.lat * RAD)
  const mLon = 111412.84 * Math.cos(centro.lat * RAD)
  return ({ lat, lon }) => [
    VB_W / 2 + (lon - centro.lon) * mLon * PX_POR_M,
    VB_H / 2 - (lat - centro.lat) * mLat * PX_POR_M,
  ]
}

function cajaAlrededor(centro, anchoM, altoM) {
  const mLat = 111132.92
  const mLon = 111412.84 * Math.cos(centro.lat * RAD)
  const dLat = altoM / 2 / mLat
  const dLon = anchoM / 2 / mLon
  return {
    s: +(centro.lat - dLat).toFixed(6),
    w: +(centro.lon - dLon).toFixed(6),
    n: +(centro.lat + dLat).toFixed(6),
    e: +(centro.lon + dLon).toFixed(6),
  }
}

/* Douglas-Peucker: quita puntos que no cambian la forma. Con tolerancia
   de menos de un píxel no se nota y el fichero pesa la mitad. */
function simplificar(puntos, tol) {
  if (puntos.length < 3) return puntos
  const [ax, ay] = puntos[0]
  const [bx, by] = puntos[puntos.length - 1]
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  let maxD = 0
  let idx = 0
  for (let i = 1; i < puntos.length - 1; i++) {
    const [px, py] = puntos[i]
    const d = Math.abs(dy * px - dx * py + bx * ay - by * ax) / len
    if (d > maxD) { maxD = d; idx = i }
  }
  if (maxD <= tol) return [puntos[0], puntos[puntos.length - 1]]
  return [
    ...simplificar(puntos.slice(0, idx + 1), tol).slice(0, -1),
    ...simplificar(puntos.slice(idx), tol),
  ]
}

const r1 = (n) => Math.round(n * 10) / 10

function aPath(puntos, cerrar) {
  if (puntos.length < 2) return ''
  let d = `M${r1(puntos[0][0])} ${r1(puntos[0][1])}`
  for (let i = 1; i < puntos.length; i++) {
    d += `L${r1(puntos[i][0])} ${r1(puntos[i][1])}`
  }
  return cerrar ? d + 'Z' : d
}

/* ── Descargas ─────────────────────────────────────────────────────── */

async function geocodificar() {
  try {
    const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' +
      encodeURIComponent(DIRECCION)
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const [r] = await res.json()
    if (!r) throw new Error('sin resultados')
    return { lat: Number(r.lat), lon: Number(r.lon) }
  } catch (err) {
    console.warn(`[mapa] No se ha podido geocodificar la dirección (${err.message}).`)
    return null
  }
}

const dormir = (ms) => new Promise(r => setTimeout(r, ms))

async function overpass(consulta, etiqueta) {
  let ultimoError
  for (let ronda = 0; ronda < RONDAS; ronda++) {
    if (ESPERA_S[ronda]) {
      console.log(`[mapa]   Servidores ocupados. Espero ${ESPERA_S[ronda]} s y vuelvo a probar…`)
      await dormir(ESPERA_S[ronda] * 1000)
    }
    for (const url of OVERPASS) {
      const host = new URL(url).host
      try {
        process.stdout.write(`[mapa]   ${etiqueta}: ${host}… `)
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': UA,
          },
          body: 'data=' + encodeURIComponent(consulta),
          signal: AbortSignal.timeout(150_000),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const texto = await res.text()
        // Algunos servidores devuelven 200 con un error en HTML o con
        // "remark" de tiempo agotado.
        if (!texto.trimStart().startsWith('{')) throw new Error('respuesta no válida')
        const json = JSON.parse(texto)
        if (json.remark && /runtime error|timed out/i.test(json.remark)) {
          throw new Error('el servidor cortó la consulta')
        }
        console.log(`ok (${json.elements.length})`)
        return json
      } catch (err) {
        console.log(`falló (${err.name === 'TimeoutError' ? 'tiempo agotado' : err.message})`)
        ultimoError = err
      }
    }
  }
  throw new Error(`No se ha podido descargar "${etiqueta}": ${ultimoError?.message}. ` +
    'Los servidores de OpenStreetMap están saturados; prueba de nuevo en unos minutos.')
}

function construirConsultas(centro) {
  const c = cajaAlrededor(centro, ANCHO_M, ALTO_M)
  const bb = `${c.s},${c.w},${c.n},${c.e}`
  const p = cajaAlrededor(centro, RADIO_POI_M * 2, RADIO_POI_M * 2)
  const bbPoi = `${p.s},${p.w},${p.n},${p.e}`
  const cab = '[out:json][timeout:120];'

  const partes = [
    {
      id: 'calles',
      q: `${cab}
(
  way["highway"](${bb});
  way["railway"~"^(rail|light_rail)$"]["tunnel"!="yes"](${bb});
);
out geom(${bb});`,
    },
    {
      id: 'zonas',
      q: `${cab}
(
  way["leisure"~"^(park|garden|playground)$"](${bb});
  way["landuse"~"^(grass|forest|village_green|recreation_ground)$"](${bb});
  way["natural"~"^(water|wood|scrub)$"](${bb});
  way["waterway"](${bb});
);
out geom(${bb});`,
    },
    {
      id: 'puntos',
      q: `${cab}
(
  node["station"="subway"](${bbPoi});
  node["railway"="station"]["subway"="yes"](${bbPoi});
  ${REFERENCIAS.map(r => `nwr${r.filtro}(${bbPoi});`).join('\n  ')}
);
out center tags;`,
    },
  ]

  if (EDIFICIOS) {
    partes.push({
      id: 'edificios',
      q: `${cab}
way["building"](${bb});
out geom(${bb});`,
    })
  }

  return partes
}

/* Descarga las partes que falten y las junta. La caché lleva el centro
   y el ancho: si cambian, no se reutiliza. */
async function descargar(centro) {
  await fs.mkdir(CACHE, { recursive: true })
  const firma = `${centro.lat.toFixed(5)},${centro.lon.toFixed(5)},${ANCHO_M}`
  const elementos = []

  for (const parte of construirConsultas(centro)) {
    const fichero = path.join(CACHE, `${parte.id}.json`)
    let datos = null

    if (process.env.REFRESCAR !== '1') {
      try {
        const guardado = JSON.parse(await fs.readFile(fichero, 'utf8'))
        if (guardado.firma === firma) {
          datos = guardado
          console.log(`[mapa]   ${parte.id}: de la caché (${datos.elements.length})`)
        }
      } catch { /* no hay caché */ }
    }

    if (!datos) {
      datos = await overpass(parte.q, parte.id)
      datos.firma = firma
      await fs.writeFile(fichero, JSON.stringify(datos))
      // Un respiro entre partes: los servidores públicos penalizan las
      // ráfagas seguidas.
      await dormir(3000)
    }

    elementos.push(...datos.elements)
  }

  return { elements: elementos, centro }
}

/* ── Dibujo ────────────────────────────────────────────────────────── */

const CAPAS = [
  // [clase, prueba, cerrado]
  ['agua',     t => t.natural === 'water' || t.waterway, true],
  ['verde',    t => t.leisure || ['grass', 'forest', 'village_green', 'recreation_ground'].includes(t.landuse) || ['wood', 'scrub'].includes(t.natural), true],
  ['edificio', t => t.building, true],
  ['tren',     t => t.railway, false],
  ['senda',    t => ['footway', 'path', 'steps', 'pedestrian', 'cycleway', 'living_street'].includes(t.highway), false],
  ['servicio', t => ['service', 'track', 'unclassified'].includes(t.highway), false],
  ['calle',    t => ['residential', 'tertiary', 'tertiary_link'].includes(t.highway), false],
  ['avenida',  t => ['primary', 'primary_link', 'secondary', 'secondary_link', 'trunk', 'trunk_link', 'motorway'].includes(t.highway), false],
]

const ESTILOS = `
  .agua{fill:#9ca3af;fill-opacity:.18;stroke:none}
  .verde{fill:#6b7280;fill-opacity:.07;stroke:none}
  .edificio{fill:#111;fill-opacity:.045;stroke:#111;stroke-opacity:.05;stroke-width:.4}
  .tren{fill:none;stroke:#6b7280;stroke-width:1;stroke-dasharray:6 3;stroke-opacity:.5}
  .senda{fill:none;stroke:#6b7280;stroke-width:.6;stroke-opacity:.35;stroke-dasharray:2 2}
  .servicio{fill:none;stroke:#6b7280;stroke-width:.7;stroke-opacity:.35}
  .calle{fill:none;stroke:#4b5563;stroke-width:1.3;stroke-opacity:.5}
  .avenida{fill:none;stroke:#374151;stroke-width:2.6;stroke-opacity:.55}
  path{stroke-linecap:round;stroke-linejoin:round}
`

function dibujar(datos, proyectar) {
  const porCapa = Object.fromEntries(CAPAS.map(([c]) => [c, []]))

  for (const el of datos.elements) {
    if (el.type !== 'way' || !el.geometry || !el.tags) continue
    const capa = CAPAS.find(([, prueba]) => prueba(el.tags))
    if (!capa) continue
    const [clase, , cerradoCapa] = capa

    // out geom(bbox) deja huecos (null) donde la vía sale del encuadre:
    // cada tramo continuo se dibuja por separado.
    const tramos = [[]]
    for (const g of el.geometry) {
      if (!g) { tramos.push([]); continue }
      tramos[tramos.length - 1].push(proyectar(g))
    }

    const primero = el.geometry[0]
    const ultimo = el.geometry[el.geometry.length - 1]
    const cerrado = cerradoCapa && primero && ultimo &&
      primero.lat === ultimo.lat && primero.lon === ultimo.lon

    for (const tramo of tramos) {
      if (tramo.length < 2) continue
      const d = aPath(simplificar(tramo, clase === 'edificio' ? 0.6 : 0.4), cerrado)
      if (d) porCapa[clase].push(d)
    }
  }

  const grupos = CAPAS
    .map(([clase]) => porCapa[clase].length
      ? `<path class="${clase}" d="${porCapa[clase].join('')}"/>`
      : '')
    .filter(Boolean)
    .join('\n')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB_W} ${VB_H}" width="${VB_W}" height="${VB_H}" role="img" aria-label="Mapa de las calles alrededor del hotel">
<style>${ESTILOS.replace(/\s+/g, ' ').trim()}</style>
${grupos}
</svg>
`
}

/* ── Puntos ────────────────────────────────────────────────────────── */

const APIE_M_MIN = 80        // velocidad a pie
const RODEO = 1.3            // las calles no van en línea recta

function minutosAPie(metros) {
  return Math.max(1, Math.round((metros * RODEO) / APIE_M_MIN))
}

function sacarPuntos(datos, centro, proyectar) {
  const enDibujo = ([x, y]) => x >= 0 && x <= VB_W && y >= 0 && y <= VB_H
  const pos = (el) => el.center || (el.lat != null ? { lat: el.lat, lon: el.lon } : null)

  // Metro: OSM suele tener un nodo por línea o por andén. Se agrupan
  // por nombre y se promedia.
  const estaciones = new Map()
  for (const el of datos.elements) {
    const t = el.tags || {}
    const esMetro = t.station === 'subway' || (t.railway === 'station' && t.subway === 'yes')
    if (!esMetro || !t.name || !pos(el)) continue
    const nombre = t.name.replace(/^Metro\s+/i, '')
    if (!estaciones.has(nombre)) estaciones.set(nombre, { nombre, lats: [], lons: [], lineas: new Set() })
    const e = estaciones.get(nombre)
    e.lats.push(pos(el).lat)
    e.lons.push(pos(el).lon)
    for (const l of String(t.line || t.ref || '').split(/[;,]/)) if (l.trim()) e.lineas.add(l.trim())
  }

  const media = (a) => a.reduce((s, v) => s + v, 0) / a.length

  const metros = [...estaciones.values()]
    .map(e => {
      const p = { lat: media(e.lats), lon: media(e.lons) }
      const m = distanciaM(centro, p)
      const xy = proyectar(p)
      return {
        tipo: 'metro',
        nombre: e.nombre,
        lineas: [...e.lineas],
        lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6),
        x: r1(xy[0]), y: r1(xy[1]),
        dentro: enDibujo(xy),
        metros: Math.round(m),
        minutos: minutosAPie(m),
      }
    })
    .filter(e => e.metros <= RADIO_POI_M)
    .sort((a, b) => a.metros - b.metros)

  const referencias = REFERENCIAS.map(ref => {
    const el = datos.elements.find(x => {
      const t = x.tags || {}
      if (!t.name || !pos(x)) return false
      // Solo el monumento: con ese nombre hay también paradas y accesos.
      if (ref.id === 'debod') return /templo de debod/i.test(t.name) && Boolean(t.historic || t.tourism || t.building)
      if (ref.id === 'plaza-espana') return t.name === 'Plaza de España' && t.place === 'square'
      if (ref.id === 'palacio-real') return t.name === 'Palacio Real de Madrid'
      if (ref.id === 'principe-pio') return /^Príncipe Pío$/.test(t.name) && t.railway === 'station'
      return false
    })
    if (!el) {
      console.warn(`[mapa] No encuentro "${ref.nombre}" en OSM. Se omite.`)
      return null
    }
    const p = pos(el)
    const m = distanciaM(centro, p)
    const xy = proyectar(p)
    return {
      tipo: 'referencia',
      id: ref.id,
      nombre: ref.nombre,
      lat: +p.lat.toFixed(6), lon: +p.lon.toFixed(6),
      x: r1(xy[0]), y: r1(xy[1]),
      dentro: enDibujo(xy),
      metros: Math.round(m),
      minutos: minutosAPie(m),
    }
  }).filter(Boolean)

  const hotelXY = proyectar(centro)
  return {
    generado: new Date().toISOString(),
    atribucion: '© colaboradores de OpenStreetMap',
    viewBox: { ancho: VB_W, alto: VB_H },
    cobertura: { anchoMetros: ANCHO_M, altoMetros: ALTO_M },
    hotel: {
      nombre: 'Suites Viena Plaza de España',
      direccion: 'C/ Juan Álvarez Mendizábal, 17 · 28008 Madrid',
      lat: +centro.lat.toFixed(6), lon: +centro.lon.toFixed(6),
      x: r1(hotelXY[0]), y: r1(hotelXY[1]),
    },
    metros,
    referencias,
  }
}

/* ── Principal ─────────────────────────────────────────────────────── */

async function main() {
  let centro = RESPALDO
  const manual = process.env.HOTEL?.split(',').map(Number)
  const geo = process.env.MAPA_DATOS || manual ? null : await geocodificar()

  if (manual && manual.length === 2 && manual.every(Number.isFinite)) {
    centro = { lat: manual[0], lon: manual[1] }
    console.log(`[mapa] Coordenadas indicadas a mano: ${centro.lat}, ${centro.lon}`)
  } else if (geo) {
    const desvio = distanciaM(geo, RESPALDO)
    console.log(`[mapa] Dirección localizada: ${geo.lat.toFixed(6)}, ${geo.lon.toFixed(6)} ` +
      `(${Math.round(desvio)} m de las coordenadas del index.html)`)
    if (desvio > 400) {
      console.warn('[mapa] AVISO: la dirección cae lejos de las coordenadas guardadas. ' +
        'Se usan las guardadas; revisa cuál es la buena.')
    } else {
      centro = geo
    }
  } else {
    console.log(`[mapa] Se usan las coordenadas guardadas: ${centro.lat}, ${centro.lon}`)
  }

  let datos
  if (process.env.MAPA_DATOS) {
    datos = JSON.parse(await fs.readFile(process.env.MAPA_DATOS, 'utf8'))
    if (datos.centro) centro = datos.centro
    console.log(`[mapa] Usando datos de ${process.env.MAPA_DATOS}`)
  } else {
    console.log('[mapa] Descargando de OpenStreetMap (en partes)…')
    datos = await descargar(centro)
  }

  const proyectar = crearProyeccion(centro)
  const svg = dibujar(datos, proyectar)
  const puntos = sacarPuntos(datos, centro, proyectar)

  await fs.mkdir(SALIDA, { recursive: true })
  await fs.writeFile(path.join(SALIDA, 'entorno.svg'), svg)
  await fs.writeFile(path.join(SALIDA, 'puntos.json'), JSON.stringify(puntos, null, 2) + '\n')

  const kb = (Buffer.byteLength(svg) / 1024).toFixed(0)
  console.log(`\n[mapa] ✔ src/assets/mapa/entorno.svg  (${kb} kB)`)
  console.log('[mapa] ✔ src/assets/mapa/puntos.json')
  console.log(`[mapa] Centro usado: ${centro.lat.toFixed(6)}, ${centro.lon.toFixed(6)}`)
  console.log('\nMetro cercano:')
  for (const m of puntos.metros) {
    console.log(`  · ${m.nombre.padEnd(22)} ${String(m.metros).padStart(5)} m  ~${m.minutos} min${m.dentro ? '' : '  (fuera del dibujo)'}`)
  }
  console.log('Referencias:')
  for (const r of puntos.referencias) {
    console.log(`  · ${r.nombre.padEnd(22)} ${String(r.metros).padStart(5)} m  ~${r.minutos} min${r.dentro ? '' : '  (fuera del dibujo)'}`)
  }
  if (Number(kb) > 400) {
    console.log('\nPesa bastante. Prueba con EDIFICIOS=0 o con un ANCHO_M menor.')
  }
}

main().catch(err => {
  console.error('[mapa] ERROR:', err)
  process.exit(1)
})