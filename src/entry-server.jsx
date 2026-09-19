/* ─────────────────────────────────────────────────────────────────────
   Entrada del PRERENDER. No llega al navegador.

   `vite build --ssr` compila este fichero a dist-server/, y
   scripts/prerender.js lo usa para:

     1. Leer Supabase                → cargarDatosIniciales()
     2. Generar el HTML de cada ruta → render(url, datos)
     3. Generar el JSON-LD del <head> → jsonLd(datos)

   Todo lo que se renderiza aquí tiene que dar el mismo resultado que el
   primer render del navegador con los mismos datos. Nada de fechas de
   "hoy", aleatorios ni window en el cuerpo de los componentes: eso va en
   efectos, que aquí no se ejecutan.
   ───────────────────────────────────────────────────────────────────── */

import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { AppRutas } from './App.jsx'
import { DatosInicialesContext } from './lib/datosIniciales'
import { cargarFilasHotel, formatearHotel } from './hooks/useHotelData'
import { cargarFaqs } from './hooks/useFaqsPublicas'
import {
  jsonLdNegocio, jsonLdSala, jsonLdMigas, cabeceraPortada, cabeceraSala, cabeceraUso, rutaSala,
} from './lib/seo'
import { USOS, resumenUso } from './lib/usos'
import { LEGALES, cabeceraLegal } from './lib/legal'

// Lo usa scripts/prerender.js directamente.
export { serializarParaScript, ID_SCRIPT_DATOS } from './lib/datosIniciales'
export { DOMINIO } from './lib/seo'

export async function cargarDatosIniciales() {
  // Si falla el hotel, falla el build: mejor seguir con el despliegue
  // anterior que publicar una portada vacía.
  const hotel = await cargarFilasHotel()

  // Las FAQ no son imprescindibles: sin ellas salen las automáticas.
  let faqs = []
  try {
    faqs = await cargarFaqs(hotel.hotelRow.id)
  } catch (err) {
    console.warn('[prerender] Sin preguntas frecuentes, se usan las automáticas:', err.message)
  }

  return { hotel, faqs }
}

export function render(url, datos) {
  return renderToString(
    <DatosInicialesContext.Provider value={datos}>
      <StaticRouter location={url}>
        <AppRutas />
      </StaticRouter>
    </DatosInicialesContext.Provider>
  )
}

/* ── Rutas públicas que se prerenderizan ──
   Cada una con su fichero, su cabecera y su JSON-LD. Las salas salen de
   Supabase: si se crea una nueva en el panel, tendrá página en el
   siguiente despliegue. */
export function rutasPublicas(datos) {
  // Copia: formatearHotel ordena arrays en el sitio.
  const hotel = formatearHotel(structuredClone(datos.hotel))

  return [
    {
      url: '/',
      archivo: 'index.html',
      cabecera: cabeceraPortada(hotel),
      jsonLd: jsonLdNegocio(hotel),
    },
    ...hotel.rooms.map(sala => ({
      url: rutaSala(sala.slug),
      archivo: `${rutaSala(sala.slug).slice(1)}.html`,
      cabecera: cabeceraSala(sala),
      jsonLd: jsonLdSala(hotel, sala),
    })),
    ...USOS.map(uso => ({
      url: uso.ruta,
      archivo: `${uso.ruta.slice(1)}.html`,
      cabecera: cabeceraUso(uso, resumenUso(hotel, uso)),
      jsonLd: jsonLdMigas(uso.etiqueta, uso.ruta),
    })),
    /* Páginas legales. No dependen de Supabase: el texto está en
       lib/legal.js. Mientras sean borrador, cabeceraLegal() les pone
       noindex y prerender.js las deja fuera del sitemap. */
    ...LEGALES.map(doc => ({
      url: doc.ruta,
      archivo: `${doc.ruta.slice(1)}.html`,
      cabecera: cabeceraLegal(doc),
      jsonLd: jsonLdMigas(doc.titulo, doc.ruta),
    })),
  ]
}