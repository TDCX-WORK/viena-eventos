import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { salasRelacionadas } from '../lib/constants'

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

        // 4) Fechas bloqueadas a mano desde el panel
        const { data: blocked, error: bErr } = await supabase
          .from('blocked_dates')
          .select('*')
        if (bErr) throw bErr

        // 4b) Huecos ocupados por reservas ya CONFIRMADAS.
        //
        // Viene de la vista occupied_slots, que expone únicamente sala,
        // día y jornada: ni nombres ni emails, así que se puede leer sin
        // sesión. Sin esto, confirmar una reserva no impedía que otro
        // cliente reservara exactamente el mismo hueco.
        //
        // Si la vista todavía no existe, se sigue adelante con lo que
        // haya: es preferible un calendario incompleto a una web caída.
        const { data: ocupados, error: oErr } = await supabase
          .from('occupied_slots')
          .select('room_id, date, jornada')
        if (oErr) {
          console.warn(
            'No se ha podido leer occupied_slots. El calendario solo tendrá en cuenta ' +
            'los bloqueos manuales, no las reservas confirmadas. Revisa que la vista ' +
            'exista y tenga grant select para anon.',
            oErr
          )
        }

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

        /* ── Ocupación por sala ─────────────────────────────────────
           Se juntan las dos fuentes (bloqueos manuales y reservas
           confirmadas) en una sola lista por slug, y después se propaga
           entre salas combinadas. */

        const porSala = {}
        const vistos = {}   // slug -> Set('fecha|jornada'), para no duplicar

        const idASlug = {}
        rooms.forEach(r => { idASlug[r.id] = r.slug })

        function anadir(slug, dateStr, jornada, origen) {
          if (!slug || !dateStr) return
          const j = jornada || 'completo'
          const clave = `${dateStr}|${j}`

          if (!porSala[slug]) { porSala[slug] = []; vistos[slug] = new Set() }
          // El mismo hueco puede llegar por varios caminos: un bloqueo
          // manual, una reserva y la propagación desde la sala hermana.
          // Solo se guarda una vez.
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

        ;(ocupados || []).forEach(o => {
          anadir(idASlug[o.room_id], o.date, o.jornada, 'reserva')
        })

        /* Propagación entre salas combinadas.

           En los dos sentidos y para las dos fuentes: si el espacio
           unido no está disponible, ninguna de sus partes lo está, y si
           una parte está ocupada, el espacio unido es imposible. Da
           igual que venga de una reserva o de un bloqueo manual.

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
          blockedDates: porSala,
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