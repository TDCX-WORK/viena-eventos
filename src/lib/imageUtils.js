/**
 * URLs de las imágenes de Supabase Storage.
 *
 * Supabase tiene un endpoint /render/image/ que redimensiona al vuelo,
 * pero SOLO en plan Pro o superior. En Free devuelve error y la imagen
 * no se pinta: ni en la web pública ni en el panel. Como todas las
 * imágenes remotas del proyecto pasan por aquí, eso deja el sitio
 * entero sin fotos.
 *
 * Por eso las transformaciones están detrás de un interruptor. En Free
 * se queda apagado y se sirve la URL pública tal cual, que funciona. Al
 * subir a Pro basta con poner VITE_IMAGE_TRANSFORM=true en el .env; no
 * hay que tocar ningún componente.
 *
 * Nota: apagarlo significa servir la imagen original completa. Vigila el
 * peso de lo que se sube desde el panel de Fotos, porque ya no hay nadie
 * encogiéndolas por el camino.
 */

const RUTA_OBJETO = '/storage/v1/object/public/'
const RUTA_RENDER = '/storage/v1/render/image/public/'

// Vite solo inyecta strings, así que la comparación es contra 'true'.
const TRANSFORMAR = import.meta.env.VITE_IMAGE_TRANSFORM === 'true'

/**
 * @param {string} url URL pública de Supabase Storage
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} opts.quality 1-100
 * @param {'cover'|'contain'|'fill'} opts.resize
 * @returns {string}
 */
export function getOptimizedUrl(url, { width, height, quality = 75, resize = 'cover' } = {}) {
  if (!url) return url
  if (!TRANSFORMAR) return url
  if (!width) return url

  // Cualquier cosa que no sea Storage (un asset local, una URL externa)
  // se devuelve intacta.
  if (!url.includes(RUTA_OBJETO)) return url

  const transformada = url.replace(RUTA_OBJETO, RUTA_RENDER)
  const sep = transformada.includes('?') ? '&' : '?'
  let params = `${sep}width=${width}&quality=${quality}&resize=${resize}`
  if (height) params += `&height=${height}`
  return transformada + params
}

/** Tamaños usados en el proyecto. Sin efecto mientras TRANSFORMAR sea false. */
export const IMAGE_SIZES = {
  adminThumb:   { width: 400,  height: 300, quality: 70 },
  cardImage:    { width: 800,  height: 600, quality: 80 },
  galleryThumb: { width: 500,  height: 375, quality: 70 },
  lightbox:     { width: 1400, quality: 85 },
}