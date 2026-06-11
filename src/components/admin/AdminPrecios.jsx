import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Euro, Save, Check, Loader2, Coffee, UtensilsCrossed } from 'lucide-react'
import styles from './AdminPrecios.module.css'

export default function AdminPrecios() {
  const [rooms, setRooms] = useState([])
  const [extras, setExtras] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null) // id del item que se está guardando
  const [saved, setSaved] = useState(null)   // id del item recién guardado

  useEffect(() => {
    async function load() {
      const { data: roomsData } = await supabase
        .from('rooms')
        .select('id, name, slug, size_m2, pricing(*)')
        .order('sort_order')

      const { data: extrasData } = await supabase
        .from('extras')
        .select('*')
        .order('sort_order')

      setRooms((roomsData || []).map(r => ({
        ...r,
        halfDay: Number(r.pricing?.[0]?.half_day) || 0,
        fullDay: Number(r.pricing?.[0]?.full_day) || 0,
        weekendSupplement: Number(r.pricing?.[0]?.weekend_supplement) || 100,
        pricingId: r.pricing?.[0]?.id,
      })))
      setExtras(extrasData || [])
      setLoading(false)
    }
    load()
  }, [])

  const updateRoom = (idx, field, value) => {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const updateExtra = (idx, field, value) => {
    setExtras(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e))
  }

  const saveRoom = async (room) => {
    setSaving(room.id)
    try {
      await supabase
        .from('pricing')
        .update({
          half_day: room.halfDay,
          full_day: room.fullDay,
          weekend_supplement: room.weekendSupplement,
          updated_at: new Date().toISOString(),
        })
        .eq('id', room.pricingId)

      setSaved(room.id)
      setTimeout(() => setSaved(null), 2000)
    } catch (err) {
      console.error('Error guardando precio:', err)
    } finally {
      setSaving(null)
    }
  }

  const saveExtra = async (extra) => {
    setSaving(extra.id)
    try {
      await supabase
        .from('extras')
        .update({
          price_per_person: extra.price_per_person,
          min_persons: extra.min_persons,
          is_active: extra.is_active,
          description: extra.description || '',
        })
        .eq('id', extra.id)

      setSaved(extra.id)
      setTimeout(() => setSaved(null), 2000)
    } catch (err) {
      console.error('Error guardando extra:', err)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <p style={{ color: '#78716c' }}>Cargando precios...</p>

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Precios</h1>
        <p className={styles.subtitle}>Modifica los precios de salas y extras. Los cambios se aplican inmediatamente en la web.</p>
      </div>

      {/* ── Salas ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Euro size={18} />
          Precios de salas
        </h2>
        <div className={styles.cardsGrid}>
          {rooms.map((room, idx) => (
            <div key={room.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardName}>{room.name}</h3>
                <span className={styles.cardMeta}>{room.size_m2} m²</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.priceRow}>
                  <label className={styles.priceLabel}>Media jornada</label>
                  <div className={styles.inputWrap}>
                    <input
                      type="number"
                      className={styles.priceInput}
                      value={room.halfDay}
                      onChange={e => updateRoom(idx, 'halfDay', Number(e.target.value))}
                    />
                    <span className={styles.inputSuffix}>€</span>
                  </div>
                </div>
                <div className={styles.priceRow}>
                  <label className={styles.priceLabel}>Jornada completa</label>
                  <div className={styles.inputWrap}>
                    <input
                      type="number"
                      className={styles.priceInput}
                      value={room.fullDay}
                      onChange={e => updateRoom(idx, 'fullDay', Number(e.target.value))}
                    />
                    <span className={styles.inputSuffix}>€</span>
                  </div>
                </div>
                <div className={styles.priceRow}>
                  <label className={styles.priceLabel}>Supl. finde/festivo</label>
                  <div className={styles.inputWrap}>
                    <input
                      type="number"
                      className={styles.priceInput}
                      value={room.weekendSupplement}
                      onChange={e => updateRoom(idx, 'weekendSupplement', Number(e.target.value))}
                    />
                    <span className={styles.inputSuffix}>€</span>
                  </div>
                </div>
              </div>
              <button
                className={`${styles.saveBtn} ${saved === room.id ? styles.saveBtnDone : ''}`}
                onClick={() => saveRoom(room)}
                disabled={saving === room.id}
              >
                {saving === room.id ? <Loader2 size={16} className={styles.spin} /> :
                 saved === room.id ? <><Check size={16} /> Guardado</> :
                 <><Save size={16} /> Guardar cambios</>}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── Extras ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <Coffee size={18} />
          Coffee breaks y menús
        </h2>
        <div className={styles.extrasTable}>
          <div className={styles.extrasHeader}>
            <span>Nombre</span>
            <span>€/persona</span>
            <span>Mín. pers.</span>
            <span>Activo</span>
            <span></span>
          </div>
          {extras.map((extra, idx) => (
            <div key={extra.id} className={styles.extrasRow}>
              <div className={styles.extraName}>
                {extra.category === 'coffee' ? <Coffee size={14} /> : <UtensilsCrossed size={14} />}
                <span>{extra.name}</span>
              </div>
              <div className={styles.inputWrap}>
                <input
                  type="number"
                  step="0.10"
                  className={styles.priceInputSmall}
                  value={extra.price_per_person}
                  onChange={e => updateExtra(idx, 'price_per_person', Number(e.target.value))}
                />
                <span className={styles.inputSuffix}>€</span>
              </div>
              <input
                type="number"
                className={styles.priceInputSmall}
                value={extra.min_persons}
                onChange={e => updateExtra(idx, 'min_persons', Number(e.target.value))}
              />
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={extra.is_active}
                  onChange={e => updateExtra(idx, 'is_active', e.target.checked)}
                />
                <span className={styles.toggleTrack} />
              </label>
              <button
                className={`${styles.saveBtnSmall} ${saved === extra.id ? styles.saveBtnDone : ''}`}
                onClick={() => saveExtra(extra)}
                disabled={saving === extra.id}
              >
                {saving === extra.id ? <Loader2 size={14} className={styles.spin} /> :
                 saved === extra.id ? <Check size={14} /> :
                 <Save size={14} />}
              </button>
              <textarea
                className={styles.descTextarea}
                value={extra.description || ''}
                onChange={e => updateExtra(idx, 'description', e.target.value)}
                placeholder="Descripción (una línea por item)…"
                rows={3}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
