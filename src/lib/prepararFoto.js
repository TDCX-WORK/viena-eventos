/* ─────────────────────────────────────────────────────────────────────
   Reducir una foto en el navegador antes de subirla.

   En el plan Free de Supabase no hay redimensionado al vuelo (ver
   imageUtils.js), así que lo que se sube es exactamente lo que se
   descarga cada visitante. Una foto de móvil son 4000 px y 3–8 MB; la
   tarjeta de sala la pinta a unos 440 px. El navegador tiene que
   descargarla, descomprimir 12 megapíxeles y reducirla, y eso por cada
   foto que entra en pantalla.

   Aquí se deja en 1920 px de lado largo (sobra para la galería a
   pantalla completa) y en WebP. Una foto típica pasa de 4–6 MB a unos
   200–400 kB.

   Si algo falla (formato raro, navegador antiguo) se sube la original:
   una foto pesada es mejor que una foto que no llega.
   ───────────────────────────────────────────────────────────────────── */

const LADO_MAX = 1920
const CALIDAD = 0.82

function aBlob(canvas, tipo, calidad) {
  return new Promise(resolve => canvas.toBlob(resolve, tipo, calidad))
}

/**
 * @param {File} file
 * @returns {Promise<{ blob: Blob, ext: string, tipo: string }>}
 */
export async function prepararFoto(file) {
  const original = {
    blob: file,
    ext: (file.name.split('.').pop() || 'jpg').toLowerCase(),
    tipo: file.type,
  }

  try {
    // imageOrientation: respeta el giro EXIF de las fotos de móvil. Sin
    // esto, las verticales podrían quedar tumbadas.
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * escala)
    const h = Math.round(bmp.height * escala)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close?.()

    // Safari antiguo no sabe exportar WebP y devuelve PNG sin avisar:
    // en ese caso, JPEG.
    let blob = await aBlob(canvas, 'image/webp', CALIDAD)
    let ext = 'webp'
    if (!blob || blob.type !== 'image/webp') {
      blob = await aBlob(canvas, 'image/jpeg', 0.85)
      ext = 'jpg'
    }

    // Si ya venía ligera y pequeña, no se gana nada recomprimiendo.
    if (!blob || blob.size >= file.size) return original
    return { blob, ext, tipo: blob.type }
  } catch (err) {
    console.warn('No se ha podido reducir la foto, se sube la original:', err)
    return original
  }
}