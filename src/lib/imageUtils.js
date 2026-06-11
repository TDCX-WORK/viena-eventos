/**
 * Genera URLs optimizadas para imágenes de Supabase Storage.
 *
 * Supabase (plan Pro+) soporta transformaciones on-the-fly vía /render/image/.
 * Si no tienes Pro, las URLs pasan sin transformar pero el componente
 * OptimizedImage igualmente mejora la UX con lazy loading + placeholder.
 */

const SUPABASE_STORAGE_PATH = '/storage/v1/object/public/'
const SUPABASE_RENDER_PATH  = '/storage/v1/render/image/public/'

/**
 * @param {string} url - URL pública de Supabase Storage
 * @param {object} opts
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} opts.quality (1-100, default 75)
 * @param {'cover'|'contain'|'fill'} opts.resize
 * @returns {string}
 */
export function getOptimizedUrl(url, { width, height, quality = 75, resize = 'cover' } = {}) {
  if (!url || !width) return url

  // Solo transformar URLs de Supabase Storage
  if (!url.includes(SUPABASE_STORAGE_PATH)) return url

  try {
    const transformed = url.replace(SUPABASE_STORAGE_PATH, SUPABASE_RENDER_PATH)
    const sep = transformed.includes('?') ? '&' : '?'
    let params = `${sep}width=${width}&quality=${quality}&resize=${resize}`
    if (height) params += `&height=${height}`
    return transformed + params
  } catch {
    return url
  }
}

/**
 * Preset de tamaños comunes
 */
export const IMAGE_SIZES = {
  // Admin fotos grid
  adminThumb:   { width: 400, height: 300, quality: 70 },
  // Room card carousel
  cardImage:    { width: 800, height: 600, quality: 80 },
  // Gallery grid thumbnails
  galleryThumb: { width: 500, height: 375, quality: 70 },
  // Lightbox full
  lightbox:     { width: 1400, quality: 85 },
}
