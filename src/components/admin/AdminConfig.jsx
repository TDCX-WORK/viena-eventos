import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Check, Loader2, Building2, MapPin, Phone, Mail, Globe } from 'lucide-react'
import styles from './AdminConfig.module.css'

export default function AdminConfig() {
  const [hotel, setHotel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [saved, setSaved] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: h } = await supabase
        .from('hotels')
        .select('*')
        .eq('slug', 'suitesviena')
        .single()

      const { data: r } = await supabase
        .from('rooms')
        .select('id, name, slug, description, badge, hover_badge, hover_badge_color, is_active, sort_order, room_layouts(*)')
        .order('sort_order')

      setHotel(h)
      setRooms(r || [])
      setLoading(false)
    }
    load()
  }, [])

  const updateHotel = (field, value) => {
    setHotel(prev => ({ ...prev, [field]: value }))
  }

  const updateRoom = (idx, field, value) => {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const updateLayout = (roomIdx, layoutIdx, field, value) => {
    setRooms(prev => prev.map((r, i) => {
      if (i !== roomIdx) return r
      const layouts = r.room_layouts.map((l, j) =>
        j === layoutIdx ? { ...l, [field]: value } : l
      )
      return { ...r, room_layouts: layouts }
    }))
  }

  const saveHotel = async () => {
    setSaving('hotel')
    try {
      await supabase
        .from('hotels')
        .update({
          name: hotel.name,
          location: hotel.location,
          address: hotel.address,
          phone: hotel.phone,
          whatsapp: hotel.whatsapp,
          email: hotel.email,
          website: hotel.website,
        })
        .eq('id', hotel.id)
      setSaved('hotel')
      setTimeout(() => setSaved(null), 2000)
    } catch (err) { console.error(err) }
    finally { setSaving(null) }
  }

  const saveRoom = async (room, idx) => {
    setSaving(room.id)
    try {
      await supabase
        .from('rooms')
        .update({
          name: room.name,
          description: room.description,
          badge: room.badge || null,
          hover_badge: room.hover_badge || null,
          hover_badge_color: room.hover_badge_color || null,
          is_active: room.is_active,
        })
        .eq('id', room.id)

      // Update layouts
      for (const layout of room.room_layouts) {
        await supabase
          .from('room_layouts')
          .update({ max_capacity: layout.max_capacity })
          .eq('id', layout.id)
      }

      setSaved(room.id)
      setTimeout(() => setSaved(null), 2000)
    } catch (err) { console.error(err) }
    finally { setSaving(null) }
  }

  if (loading) return <p style={{ color: '#78716c' }}>Cargando configuración...</p>

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Configuración</h1>
        <p className={styles.subtitle}>Datos del hotel, textos y configuración de salas.</p>
      </div>

      {/* Hotel info */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}><Building2 size={18} /> Datos del hotel</h2>
        <div className={styles.card}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}><Building2 size={13} /> Nombre</label>
              <input className={styles.input} value={hotel.name || ''} onChange={e => updateHotel('name', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><MapPin size={13} /> Ubicación</label>
              <input className={styles.input} value={hotel.location || ''} onChange={e => updateHotel('location', e.target.value)} />
            </div>
            <div className={styles.field + ' ' + styles.fieldFull}>
              <label className={styles.label}><MapPin size={13} /> Dirección</label>
              <input className={styles.input} value={hotel.address || ''} onChange={e => updateHotel('address', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><Phone size={13} /> Teléfono</label>
              <input className={styles.input} value={hotel.phone || ''} onChange={e => updateHotel('phone', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><Phone size={13} /> WhatsApp</label>
              <input className={styles.input} value={hotel.whatsapp || ''} onChange={e => updateHotel('whatsapp', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><Mail size={13} /> Email</label>
              <input className={styles.input} value={hotel.email || ''} onChange={e => updateHotel('email', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}><Globe size={13} /> Web</label>
              <input className={styles.input} value={hotel.website || ''} onChange={e => updateHotel('website', e.target.value)} />
            </div>
          </div>
          <button className={`${styles.saveBtn} ${saved === 'hotel' ? styles.saveBtnDone : ''}`} onClick={saveHotel} disabled={saving === 'hotel'}>
            {saving === 'hotel' ? <Loader2 size={16} className={styles.spin} /> : saved === 'hotel' ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar datos del hotel</>}
          </button>
        </div>
      </section>

      {/* Rooms */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Salas</h2>
        <div className={styles.roomsGrid}>
          {rooms.map((room, rIdx) => (
            <div key={room.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardName}>{room.name}</h3>
                <label className={styles.toggle}>
                  <input type="checkbox" checked={room.is_active} onChange={e => updateRoom(rIdx, 'is_active', e.target.checked)} />
                  <span className={styles.toggleTrack} />
                </label>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.field}>
                  <label className={styles.label}>Nombre</label>
                  <input className={styles.input} value={room.name} onChange={e => updateRoom(rIdx, 'name', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Badge (foto)</label>
                  <input className={styles.input} value={room.badge || ''} placeholder="Ej: Más solicitada" onChange={e => updateRoom(rIdx, 'badge', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Badge hover (card)</label>
                  <input className={styles.input} value={room.hover_badge || ''} placeholder="Ej: -10% junio, Tu elección..." onChange={e => updateRoom(rIdx, 'hover_badge', e.target.value)} />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Color badge hover</label>
                  <div className={styles.colorField}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={room.hover_badge_color || '#B8860B'}
                      onChange={e => updateRoom(rIdx, 'hover_badge_color', e.target.value)}
                    />
                    <input
                      className={styles.input}
                      value={room.hover_badge_color || ''}
                      placeholder="#B8860B"
                      onChange={e => updateRoom(rIdx, 'hover_badge_color', e.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Descripción</label>
                  <textarea className={styles.textarea} value={room.description || ''} onChange={e => updateRoom(rIdx, 'description', e.target.value)} />
                </div>
                <div className={styles.layoutsSection}>
                  <label className={styles.label}>Aforos máximos</label>
                  <div className={styles.layoutsGrid}>
                    {(room.room_layouts || []).sort((a,b) => a.sort_order - b.sort_order).map((l, lIdx) => (
                      <div key={l.id} className={styles.layoutItem}>
                        <span className={styles.layoutName}>{l.label}</span>
                        <input
                          type="number"
                          className={styles.layoutInput}
                          value={l.max_capacity}
                          onChange={e => updateLayout(rIdx, lIdx, 'max_capacity', Number(e.target.value))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button className={`${styles.saveBtn} ${saved === room.id ? styles.saveBtnDone : ''}`} onClick={() => saveRoom(room, rIdx)} disabled={saving === room.id}>
                {saving === room.id ? <Loader2 size={16} className={styles.spin} /> : saved === room.id ? <><Check size={16} /> Guardado</> : <><Save size={16} /> Guardar</>}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
