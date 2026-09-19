import { useEffect } from 'react'
import { DOMINIO } from '../lib/seo'

/* ─────────────────────────────────────────────────────────────────────
   Actualiza <title>, description, canonical y Open Graph al navegar
   entre páginas SIN recargar (react-router).

   Para Google no hace falta: cada URL llega ya con su cabecera escrita
   por scripts/prerender.js. Esto es para que la pestaña y el enlace
   copiado digan lo correcto después de un clic interno.

   Solo toca etiquetas que ya existen en index.html; no crea ninguna.
   ───────────────────────────────────────────────────────────────────── */

function fijar(selector, atributo, valor) {
  const el = document.head.querySelector(selector)
  if (el) el.setAttribute(atributo, valor)
}

export function useCabecera(cabecera) {
  const titulo = cabecera?.titulo
  const descripcion = cabecera?.descripcion
  const ruta = cabecera?.ruta

  useEffect(() => {
    if (!titulo) return
    const url = `${DOMINIO}${ruta}`

    document.title = titulo
    fijar('meta[name="description"]', 'content', descripcion)
    fijar('link[rel="canonical"]', 'href', url)
    fijar('meta[property="og:title"]', 'content', titulo)
    fijar('meta[property="og:description"]', 'content', descripcion)
    fijar('meta[property="og:url"]', 'content', url)
    fijar('meta[name="twitter:title"]', 'content', titulo)
    fijar('meta[name="twitter:description"]', 'content', descripcion)
  }, [titulo, descripcion, ruta])
}