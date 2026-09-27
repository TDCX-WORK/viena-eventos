import { useState, useEffect } from 'react'
// Diferido: ver lib/supabaseDiferido.js.
import { conSupabase, cuandoEsteOcioso } from '../lib/supabaseDiferido'
import { salasRelacionadas } from '../lib/constants'
import { useDatosIniciales } from '../lib/datosIniciales'

/* ─────────────────────────────────────────────────────────────────────
   Tres piezas separadas para poder usarlas también en el build:

   · cargarFilasHotel(): las consultas a Supabase, tal cual.
   · formatearHotel(filas): función pura, filas → objeto `hotel`.
   · useHotelData(): el hook. Si hay datos incrustados en el HTML
     (prerender), arranca con ellos y refresca en segundo plano.

   El prerender guarda las FILAS, no el objeto ya formateado: así el
   servidor y el navegador pasan por el mismo formatearHotel() y el
   resultado es idéntico (el objeto final lleva Date, que no sobrevive
   a JSON).
   ───────────────────────────────────────────────────────────────────── */

export async function cargarFilasHotel() {
  const supabase = await conSupabase()

  // 1) Hotel
  const { data: hotelRow, error: hErr } = await supabase
    .from('hotels')
    .select('*')
    .eq('slug', 'suitesviena')
    .single()
  if (hErr) throw hErr

  // 2) Rooms con layouts, pricing e imágenes
  const { data: rooms, error: rErr } = await supabase
    .from('rooms')
    .select(`
      *,
      room_layouts (*),
      pricing (*),
      room_images (*)
    `)
    .eq('hotel_id', hotelRow.id)
    .order('sort_order')
  if (rErr) throw rErr

  // 3) Extras
  const { data: extras, error: eErr } = await supabase
    .from('extras')
    .select('*')
    .eq('hotel_id', hotelRow.id)
    .order('sort_order')
  if (eErr) throw eErr

  // 3b) Gallery images
  const { data: galleryRows } = await supabase
    .from('gallery_images')
    .select('*')
    .eq('hotel_id', hotelRow.id)
    .order('sort_order')

  /* Desde hoy en adelante: el pasado no sirve para el calendario y,
     como estos datos van dentro del HTML prerenderizado, sin el filtro
     el histórico crecería para siempre en cada página.
     Fecha local (no toISOString, que va en UTC). */
  const ahora = new Date()
  const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`

  // 4) Fechas bloqueadas a mano desde el panel.
  // Columnas explícitas, NO '*': el público no tiene permiso para leer
  // `reason` (puede llevar nombres de clientes) y con '*' la consulta
  // entera falla.
  const { data: blocked, error: bErr } = await supabase
    .from('blocked_dates')
    .select('room_id, date, jornada')
    .gte('date', hoy)
  if (bErr) throw bErr

  /* Las reservas NO bloquean fechas, ni pendientes ni confirmadas.
     Toda solicitud pasa por la directora, que la negocia con el
     cliente, así que varios clientes pueden pedir el mismo día. Lo único
     que cierra un hueco en la web es un bloqueo manual del panel. */

  return { hotelRow, rooms, extras, galleryRows, blocked }
}

export function formatearHotel({ hotelRow, rooms, extras, galleryRows, blocked }) {
  // Transformar al formato que esperan los componentes
  const formattedRooms = rooms.map(r => {
    const p = r.pricing?.[0] || {}
    const layouts = (r.room_layouts || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(l => ({
        type: l.type,
        label: l.label,
        icon: l.type,
        max: l.max_capacity,
      }))

    const images = (r.room_images || [])
      .sort((a, b) => {
        if (a.is_cover !== b.is_cover) return a.is_cover ? -1 : 1
        return a.sort_order - b.sort_order
      })
      .map(img => img.url)

    return {
      id: r.slug,
      _dbId: r.id,
      name: r.name,
      slug: r.slug,
      size: r.size_m2,
      height: Number(r.height_m),
      naturalLight: r.natural_light,
      description: r.description,
      badge: r.badge,
      hoverBadge: r.hover_badge || null,
      hoverBadgeColor: r.hover_badge_color || null,
      images,
      layouts,
      pricing: {
        halfDay: Number(p.half_day) || 0,
        fullDay: Number(p.full_day) || 0,
        currency: p.currency || '€',
        weekendSupplement: Number(p.weekend_supplement) || 0,
        vatIncluded: p.vat_included ?? true,
      },
      amenities: ['wifi', 'proyector', 'pantalla', 'flipchart', 'agua', 'material'],
    }
  })

  const formattedExtras = extras.map(e => ({
    id: e.id,
    category: e.category,
    name: e.name,
    description: e.description,
    pricePerPerson: Number(e.price_per_person),
    minPersons: e.min_persons,
    maxPersons: e.max_persons,
    isActive: e.is_active ?? true,
  }))

  /* ── Bloqueos por sala ──────────────────────────────────────
     Solo los bloqueos manuales del panel, en una lista por slug, y
     después se propagan entre salas combinadas. */

  const porSala = {}
  const vistos = {}   // slug -> Set('fecha|jornada'), para no duplicar

  const idASlug = {}
  rooms.forEach(r => { idASlug[r.id] = r.slug })

  function anadir(slug, dateStr, jornada, origen) {
    if (!slug || !dateStr) return
    const j = jornada || 'completo'
    const clave = `${dateStr}|${j}`

    if (!porSala[slug]) { porSala[slug] = []; vistos[slug] = new Set() }
    // El mismo hueco puede llegar dos veces: un bloqueo propio y la
    // propagación desde la sala hermana. Solo se guarda una vez.
    if (vistos[slug].has(clave)) return

    vistos[slug].add(clave)
    porSala[slug].push({
      date: new Date(dateStr + 'T00:00:00'),
      dateStr,
      jornada: j,
      origen,
    })
  }

  ;(blocked || []).forEach(b => {
    anadir(idASlug[b.room_id], b.date, b.jornada, 'bloqueo')
  })


  /* Propagación entre salas combinadas.

     En los dos sentidos: si el espacio unido está bloqueado,
     ninguna de sus partes está disponible, y si una parte está
     bloqueada, el espacio unido es imposible.

     Se recorre una copia de las listas ya construidas, no las que
     se están modificando: si no, lo propagado se volvería a
     propagar en la misma pasada. Con una combinación de dos partes
     basta una pasada. */
  const base = Object.fromEntries(
    Object.entries(porSala).map(([slug, lista]) => [slug, [...lista]])
  )

  Object.entries(base).forEach(([slug, lista]) => {
    const destinos = salasRelacionadas(slug)
    if (destinos.length === 0) return

    lista.forEach(item => {
      destinos.forEach(otra => {
        anadir(otra, item.dateStr, item.jornada, `heredado:${slug}`)
      })
    })
  })

  // Gallery: combinar fotos de todas las salas + galería general
  const allRoomImages = rooms.flatMap(r =>
    (r.room_images || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(img => img.url)
  )
  const allGalleryImages = (galleryRows || []).map(g => g.url)
  const gallery = [...allRoomImages, ...allGalleryImages]

  return {
    id: hotelRow.slug,
    _dbId: hotelRow.id,
    name: hotelRow.name,
    location: hotelRow.location,
    address: hotelRow.address,
    phone: hotelRow.phone,
    whatsapp: hotelRow.whatsapp,
    email: hotelRow.email,
    website: hotelRow.website,
    gallery,
    rooms: formattedRooms,
    extras: formattedExtras,
    blockedDates: porSala,
  }
}

export function useHotelData() {
  const filasIniciales = useDatosIniciales()?.hotel

  const [hotel, setHotel] = useState(() =>
    filasIniciales ? formatearHotel(filasIniciales) : null
  )
  const [loading, setLoading] = useState(!filasIniciales)
  const [error, setError] = useState(null)

  useEffect(() => {
    let vivo = true

    async function refrescar() {
      try {
        const filas = await cargarFilasHotel()
        if (vivo) setHotel(formatearHotel(filas))
      } catch (err) {
        console.error('Error cargando datos del hotel:', err)
        /* Con datos del prerender no se enseña error: lo que hay es de
           hace poco y es mejor que una pantalla de fallo. */
        if (vivo && !filasIniciales) setError(err.message)
      } finally {
        if (vivo) setLoading(false)
      }
    }

    /* Con datos del prerender, el refresco espera a que el navegador
       esté libre: la página ya está completa y no hay prisa. Sin ellos
       (npm run dev) no hay nada que enseñar, así que va inmediato. */
    const cancelar = filasIniciales ? cuandoEsteOcioso(refrescar) : (refrescar(), () => {})
    return () => { vivo = false; cancelar() }
    // Solo al montar: filasIniciales no cambia durante la vida de la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { hotel, loading, error }
}