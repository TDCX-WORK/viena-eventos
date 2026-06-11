import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useHotelData() {
  const [hotel, setHotel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchHotel() {
      try {
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

        // 4) Fechas bloqueadas
        const { data: blocked, error: bErr } = await supabase
          .from('blocked_dates')
          .select('*')
        if (bErr) throw bErr

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

        // Agrupar fechas bloqueadas por room slug con info de jornada
        const blockedByRoom = {}
        blocked.forEach(b => {
          const room = rooms.find(r => r.id === b.room_id)
          if (room) {
            if (!blockedByRoom[room.slug]) blockedByRoom[room.slug] = []
            blockedByRoom[room.slug].push({
              date: new Date(b.date + 'T00:00:00'),
              dateStr: b.date,
              jornada: b.jornada || 'completo',
            })
          }
        })

        // Gallery: combinar fotos de todas las salas + galería general
        const allRoomImages = rooms.flatMap(r =>
          (r.room_images || [])
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(img => img.url)
        )
        const allGalleryImages = (galleryRows || []).map(g => g.url)
        const gallery = [...allRoomImages, ...allGalleryImages]

        setHotel({
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
          blockedDates: blockedByRoom,
        })
      } catch (err) {
        console.error('Error cargando datos del hotel:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchHotel()
  }, [])

  return { hotel, loading, error }
}