import { useState, useEffect, useRef, memo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
import { Upload, Trash2, Star, Loader2, ImageIcon, PartyPopper, ChevronDown } from 'lucide-react'
import styles from './AdminFotos.module.css'

export default function AdminFotos() {
  const [rooms, setRooms] = useState([])
  const [gallery, setGallery] = useState([])
  const [hotelId, setHotelId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [expanded, setExpanded] = useState({})
  const fileInputRef = useRef(null)
  const [activeTarget, setActiveTarget] = useState(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('slug', 'suitesviena')
      .single()
    setHotelId(hotel?.id)

    const { data: roomsData } = await supabase
      .from('rooms')
      .select('id, name, slug, room_images(*)')
      .order('sort_order')

    const { data: galleryData } = await supabase
      .from('gallery_images')
      .select('*')
      .eq('hotel_id', hotel?.id)
      .order('sort_order')

    setRooms((roomsData || []).map(r => ({
      ...r,
      room_images: (r.room_images || []).sort((a, b) => a.sort_order - b.sort_order)
    })))
    setGallery(galleryData || [])
    setLoading(false)
  }

  const toggleSection = useCallback((id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const handleUploadClick = (target) => {
    setActiveTarget(target)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length || !activeTarget) return

    setUploading(activeTarget)

    try {
      if (activeTarget === 'gallery') {
        const maxOrder = Math.max(0, ...gallery.map(i => i.sort_order))
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const ext = file.name.split('.').pop().toLowerCase()
          const fileName = `eventos/${Date.now()}-${i}.${ext}`

          const { error: upErr } = await supabase.storage
            .from('salas')
            .upload(fileName, file, { contentType: file.type })
          if (upErr) { console.error(upErr); continue }

          const { data: urlData } = supabase.storage.from('salas').getPublicUrl(fileName)

          await supabase.from('gallery_images').insert({
            hotel_id: hotelId,
            url: urlData.publicUrl,
            alt_text: 'Eventos',
            sort_order: maxOrder + i + 1,
          })
        }
      } else {
        const room = rooms.find(r => r.id === activeTarget)
        const maxOrder = Math.max(0, ...room.room_images.map(i => i.sort_order))
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const ext = file.name.split('.').pop().toLowerCase()
          const fileName = `${room.slug}/${Date.now()}-${i}.${ext}`

          const { error: upErr } = await supabase.storage
            .from('salas')
            .upload(fileName, file, { contentType: file.type })
          if (upErr) { console.error(upErr); continue }

          const { data: urlData } = supabase.storage.from('salas').getPublicUrl(fileName)

          await supabase.from('room_images').insert({
            room_id: activeTarget,
            url: urlData.publicUrl,
            alt_text: room.name,
            is_cover: room.room_images.length === 0 && i === 0,
            sort_order: maxOrder + i + 1,
          })
        }
      }

      setExpanded(prev => ({ ...prev, [activeTarget]: true }))
      await loadAll()
    } catch (err) {
      console.error('Error subiendo foto:', err)
    } finally {
      setUploading(null)
      setActiveTarget(null)
      e.target.value = ''
    }
  }

  const handleDeleteRoom = async (image) => {
    if (!confirm('¿Eliminar esta foto?')) return
    setDeleting(image.id)
    try {
      const url = new URL(image.url)
      const path = url.pathname.split('/storage/v1/object/public/salas/')[1]
      if (path) await supabase.storage.from('salas').remove([decodeURIComponent(path)])
      await supabase.from('room_images').delete().eq('id', image.id)

      setRooms(prev => prev.map(r => ({
        ...r,
        room_images: r.room_images.filter(img => img.id !== image.id),
      })))
    } catch (err) { console.error(err) }
    finally { setDeleting(null) }
  }

  const handleDeleteGallery = async (image) => {
    if (!confirm('¿Eliminar esta foto?')) return
    setDeleting(image.id)
    try {
      const url = new URL(image.url)
      const path = url.pathname.split('/storage/v1/object/public/salas/')[1]
      if (path) await supabase.storage.from('salas').remove([decodeURIComponent(path)])
      await supabase.from('gallery_images').delete().eq('id', image.id)

      setGallery(prev => prev.filter(img => img.id !== image.id))
    } catch (err) { console.error(err) }
    finally { setDeleting(null) }
  }

  const handleSetCover = async (roomId, imageId) => {
    await supabase.from('room_images').update({ is_cover: false }).eq('room_id', roomId)
    await supabase.from('room_images').update({ is_cover: true }).eq('id', imageId)

    setRooms(prev => prev.map(r =>
      r.id !== roomId ? r : {
        ...r,
        room_images: r.room_images.map(img => ({
          ...img,
          is_cover: img.id === imageId,
        })),
      }
    ))
  }

  const handleMoveOrder = async (table, roomId, imgIdx, direction) => {
    const list = table === 'room_images'
      ? rooms.find(r => r.id === roomId).room_images
      : gallery
    const imgs = [...list]
    const swapIdx = imgIdx + direction
    if (swapIdx < 0 || swapIdx >= imgs.length) return

    const orderA = imgs[imgIdx].sort_order
    const orderB = imgs[swapIdx].sort_order

    await Promise.all([
      supabase.from(table).update({ sort_order: orderB }).eq('id', imgs[imgIdx].id),
      supabase.from(table).update({ sort_order: orderA }).eq('id', imgs[swapIdx].id),
    ])

    if (table === 'room_images') {
      setRooms(prev => prev.map(r => {
        if (r.id !== roomId) return r
        const updated = r.room_images.map(img => {
          if (img.id === imgs[imgIdx].id) return { ...img, sort_order: orderB }
          if (img.id === imgs[swapIdx].id) return { ...img, sort_order: orderA }
          return img
        })
        return { ...r, room_images: updated.sort((a, b) => a.sort_order - b.sort_order) }
      }))
    } else {
      setGallery(prev => {
        const updated = prev.map(img => {
          if (img.id === imgs[imgIdx].id) return { ...img, sort_order: orderB }
          if (img.id === imgs[swapIdx].id) return { ...img, sort_order: orderA }
          return img
        })
        return updated.sort((a, b) => a.sort_order - b.sort_order)
      })
    }
  }

  if (loading) return <p style={{ color: '#78716c' }}>Cargando fotos...</p>

  const totalPhotos = rooms.reduce((sum, r) => sum + r.room_images.length, 0) + gallery.length

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Fotos</h1>
        <p className={styles.subtitle}>
          {totalPhotos} fotos en total. Las fotos de salas + eventos aparecen juntas en la galería pública.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/webp,image/jpeg,image/png"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {rooms.map(room => (
        <section key={room.id} className={styles.roomCard}>
          <div className={styles.roomHeader} onClick={() => toggleSection(room.id)} role="button" tabIndex={0}>
            <h2 className={styles.roomName}>{room.name}</h2>
            <span className={styles.roomCount}>{room.room_images.length} fotos</span>
            <ChevronDown
              size={18}
              className={`${styles.chevron} ${expanded[room.id] ? styles.chevronOpen : ''}`}
            />
            <button
              className={styles.uploadBtn}
              onClick={(e) => { e.stopPropagation(); handleUploadClick(room.id) }}
              disabled={uploading === room.id}
            >
              {uploading === room.id ? <><Loader2 size={16} className={styles.spin} /> Subiendo...</> : <><Upload size={16} /> Subir fotos</>}
            </button>
          </div>

          {expanded[room.id] && (
            room.room_images.length === 0 ? (
              <div className={styles.emptyGrid}><ImageIcon size={28} /><p>Sin fotos. Sube imágenes para esta sala.</p></div>
            ) : (
              <div className={styles.photoGrid}>
                {room.room_images.map((img, idx) => (
                  <PhotoCard
                    key={img.id} img={img} idx={idx} total={room.room_images.length}
                    onSetCover={() => handleSetCover(room.id, img.id)}
                    onMove={(dir) => handleMoveOrder('room_images', room.id, idx, dir)}
                    onDelete={() => handleDeleteRoom(img)}
                    deletingId={deleting} showCover
                  />
                ))}
              </div>
            )
          )}
        </section>
      ))}

      <section className={styles.roomCard}>
        <div className={styles.roomHeader} onClick={() => toggleSection('gallery')} role="button" tabIndex={0}>
          <h2 className={styles.roomName}><PartyPopper size={18} style={{ color: '#A07848' }} /> Eventos y galería general</h2>
          <span className={styles.roomCount}>{gallery.length} fotos</span>
          <ChevronDown
            size={18}
            className={`${styles.chevron} ${expanded['gallery'] ? styles.chevronOpen : ''}`}
          />
          <button
            className={styles.uploadBtn}
            onClick={(e) => { e.stopPropagation(); handleUploadClick('gallery') }}
            disabled={uploading === 'gallery'}
          >
            {uploading === 'gallery' ? <><Loader2 size={16} className={styles.spin} /> Subiendo...</> : <><Upload size={16} /> Subir fotos</>}
          </button>
        </div>

        {expanded['gallery'] && (
          gallery.length === 0 ? (
            <div className={styles.emptyGrid}><PartyPopper size={28} /><p>Sin fotos de eventos. Sube imágenes que aparecerán en la galería pública.</p></div>
          ) : (
            <div className={styles.photoGrid}>
              {gallery.map((img, idx) => (
                <PhotoCard
                  key={img.id} img={img} idx={idx} total={gallery.length}
                  onMove={(dir) => handleMoveOrder('gallery_images', null, idx, dir)}
                  onDelete={() => handleDeleteGallery(img)}
                  deletingId={deleting}
                />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  )
}

// ── PhotoCard con lazy loading + thumbnail optimizado ──
const PhotoCard = memo(function PhotoCard({ img, idx, total, onSetCover, onMove, onDelete, deletingId, showCover }) {
  const isDeleting = deletingId === img.id
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect() } },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Thumbnail optimizado (400px width para el grid del admin)
  const thumbUrl = getOptimizedUrl(img.url, IMAGE_SIZES.adminThumb)

  return (
    <div ref={ref} className={`${styles.photoCard} ${img.is_cover ? styles.photoCardCover : ''}`}>
      <div className={styles.photoPlaceholder}>
        {inView && (
          <img
            src={thumbUrl}
            alt={img.alt_text || ''}
            className={`${styles.photoImg} ${loaded ? styles.photoImgLoaded : ''}`}
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        )}
      </div>
      <div className={styles.photoOverlay}>
        <div className={styles.photoActions}>
          {showCover && (
            <button
              className={`${styles.actionBtn} ${img.is_cover ? styles.actionBtnActive : ''}`}
              onClick={onSetCover} title="Hacer portada"
            ><Star size={14} /></button>
          )}
          <button className={styles.actionBtn} onClick={() => onMove(-1)} disabled={idx === 0} title="Mover izquierda">←</button>
          <button className={styles.actionBtn} onClick={() => onMove(1)} disabled={idx === total - 1} title="Mover derecha">→</button>
          <button
            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
            onClick={onDelete} disabled={isDeleting} title="Eliminar"
          >{isDeleting ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}</button>
        </div>
      </div>
      {img.is_cover && <span className={styles.coverBadge}><Star size={10} /> Portada</span>}
    </div>
  )
})
