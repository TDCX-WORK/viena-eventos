import { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'date-fns/locale'
import { format } from 'date-fns'
import { supabase } from '../../lib/supabase'
import {
  CalendarOff, Plus, Trash2, Loader2, Check, AlertCircle,
  Sun, Sunset, Clock, Eye, Pencil
} from 'lucide-react'
import styles from './AdminDisponibilidad.module.css'
import 'react-day-picker/dist/style.css'

const JORNADA_OPTIONS = [
  { id: 'completo', label: 'Día completo', sub: '9:00–20:00', icon: Clock },
  { id: 'manana',   label: 'Mañana',       sub: '9:00–14:00', icon: Sun },
  { id: 'tarde',    label: 'Tarde',         sub: '15:00–20:00', icon: Sunset },
]

const JORNADA_LABELS = {
  completo: 'Día completo',
  manana: 'Mañana',
  tarde: 'Tarde',
}

const JORNADA_ICONS = { completo: Clock, manana: Sun, tarde: Sunset }

export default function AdminDisponibilidad() {
  const [rooms, setRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [blocked, setBlocked] = useState([])
  const [allBlocked, setAllBlocked] = useState([]) // for global view
  const [selectedDates, setSelectedDates] = useState([])
  const [reason, setReason] = useState('')
  const [jornada, setJornada] = useState('completo')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [viewMode, setViewMode] = useState('manage') // 'manage' | 'global'

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('rooms')
        .select('id, name, slug')
        .order('sort_order')
      setRooms(data || [])
      if (data?.length > 0) setSelectedRoom(data[0].id)
      setLoading(false)
    }
    load()
  }, [])

  // Load blocked for selected room
  useEffect(() => {
    if (!selectedRoom) return
    loadRoomBlocked()
  }, [selectedRoom])

  async function loadRoomBlocked() {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .eq('room_id', selectedRoom)
      .order('date')
    setBlocked(data || [])
  }

  // Load ALL blocked dates for global view
  useEffect(() => {
    if (viewMode === 'global') loadAllBlocked()
  }, [viewMode])

  async function loadAllBlocked() {
    const { data } = await supabase
      .from('blocked_dates')
      .select('*, rooms(name)')
      .order('date')
    setAllBlocked(data || [])
  }

  const blockedDays = blocked.map(b => new Date(b.date + 'T00:00:00'))

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type })
    setTimeout(() => setFeedback(null), 3000)
  }

  const reloadBlocked = async () => {
    await loadRoomBlocked()
    if (viewMode === 'global') await loadAllBlocked()
  }

  const handleBlock = async () => {
    if (selectedDates.length === 0 || !selectedRoom) return
    setSaving(true)
    try {
      const toInsert = selectedDates.map(d => ({
        room_id: selectedRoom,
        date: format(d, 'yyyy-MM-dd'),
        reason: reason || null,
        jornada,
      }))

      const { error } = await supabase
        .from('blocked_dates')
        .upsert(toInsert, { onConflict: 'room_id,date,jornada' })

      if (error) throw error

      await reloadBlocked()
      setSelectedDates([])
      setReason('')
      showFeedback(`${toInsert.length} fecha(s) bloqueada(s) — ${JORNADA_LABELS[jornada]}`)
    } catch (err) {
      console.error(err)
      showFeedback('Error al bloquear fechas', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUnblock = async (id) => {
    setDeleting(id)
    try {
      await supabase.from('blocked_dates').delete().eq('id', id)
      setBlocked(prev => prev.filter(b => b.id !== id))
      setAllBlocked(prev => prev.filter(b => b.id !== id))
      showFeedback('Fecha desbloqueada')
    } catch (err) {
      console.error(err)
      showFeedback('Error al desbloquear', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleBlockAll = async () => {
    if (selectedDates.length === 0) return
    setSaving(true)
    try {
      const toInsert = []
      for (const room of rooms) {
        for (const d of selectedDates) {
          toInsert.push({
            room_id: room.id,
            date: format(d, 'yyyy-MM-dd'),
            reason: reason || null,
            jornada,
          })
        }
      }

      const { error } = await supabase
        .from('blocked_dates')
        .upsert(toInsert, { onConflict: 'room_id,date,jornada' })

      if (error) throw error

      await reloadBlocked()
      setSelectedDates([])
      setReason('')
      showFeedback(`Fechas bloqueadas (${JORNADA_LABELS[jornada]}) en todas las salas`)
    } catch (err) {
      console.error(err)
      showFeedback('Error al bloquear', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: '#78716c' }}>Cargando...</p>

  const currentRoomName = rooms.find(r => r.id === selectedRoom)?.name || ''

  // Group blocked dates by date (for room view)
  const groupedBlocked = blocked.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = []
    acc[b.date].push(b)
    return acc
  }, {})

  // Group ALL blocked by date (for global view)
  const globalGrouped = allBlocked.reduce((acc, b) => {
    if (!acc[b.date]) acc[b.date] = {}
    const roomName = b.rooms?.name || '—'
    if (!acc[b.date][roomName]) acc[b.date][roomName] = []
    acc[b.date][roomName].push(b)
    return acc
  }, {})

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Disponibilidad</h1>
        <p className={styles.subtitle}>Bloquea fechas por jornada para impedir reservas.</p>
      </div>

      {feedback && (
        <div className={`${styles.feedback} ${styles['feedback_' + feedback.type]}`}>
          {feedback.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* View mode toggle */}
      <div className={styles.viewToggle}>
        <button
          className={`${styles.viewBtn} ${viewMode === 'manage' ? styles.viewBtnActive : ''}`}
          onClick={() => setViewMode('manage')}
        >
          <Pencil size={15} />
          Gestionar
        </button>
        <button
          className={`${styles.viewBtn} ${viewMode === 'global' ? styles.viewBtnActive : ''}`}
          onClick={() => setViewMode('global')}
        >
          <Eye size={15} />
          Vista global
        </button>
      </div>

      {viewMode === 'manage' ? (
        <>
          {/* Room pills */}
          <div className={styles.roomPills}>
            {rooms.map(r => (
              <button
                key={r.id}
                className={`${styles.roomPill} ${selectedRoom === r.id ? styles.roomPillActive : ''}`}
                onClick={() => { setSelectedRoom(r.id); setSelectedDates([]); }}
              >
                {r.name}
              </button>
            ))}
          </div>

          <div className={styles.mainGrid}>
            {/* Calendar */}
            <div className={styles.calCard}>
              <DayPicker
                mode="multiple"
                selected={selectedDates}
                onSelect={setSelectedDates}
                locale={es}
                disabled={[{ before: new Date() }]}
                modifiers={{ blocked: blockedDays }}
                modifiersClassNames={{ blocked: styles.blockedDay }}
                numberOfMonths={1}
                showOutsideDays={false}
              />

              {selectedDates.length > 0 && (
                <div className={styles.blockForm}>
                  <p className={styles.blockCount}>
                    {selectedDates.length} día(s) seleccionado(s)
                  </p>

                  <div className={styles.jornadaSelector}>
                    <span className={styles.jornadaTitle}>Jornada a bloquear</span>
                    <div className={styles.jornadaOptions}>
                      {JORNADA_OPTIONS.map(j => {
                        const Icon = j.icon
                        return (
                          <button
                            key={j.id}
                            className={`${styles.jornadaOption} ${jornada === j.id ? styles.jornadaOptionActive : ''}`}
                            onClick={() => setJornada(j.id)}
                            type="button"
                          >
                            <Icon size={16} />
                            <span className={styles.jornadaLabel}>{j.label}</span>
                            <span className={styles.jornadaSub}>{j.sub}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <input
                    type="text"
                    className={styles.reasonInput}
                    placeholder="Motivo (opcional): festivo, mantenimiento..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                  <div className={styles.blockBtns}>
                    <button className={styles.blockBtn} onClick={handleBlock} disabled={saving}>
                      {saving ? <Loader2 size={16} className={styles.spin} /> : <Plus size={16} />}
                      Bloquear en {currentRoomName}
                    </button>
                    <button className={styles.blockBtnAll} onClick={handleBlockAll} disabled={saving}>
                      Bloquear en todas
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Blocked list for selected room */}
            <div className={styles.listCard}>
              <h3 className={styles.listTitle}>
                <CalendarOff size={16} />
                Fechas bloqueadas — {currentRoomName}
              </h3>
              {blocked.length === 0 ? (
                <p className={styles.emptyText}>No hay fechas bloqueadas para esta sala.</p>
              ) : (
                <div className={styles.blockedList}>
                  {Object.entries(groupedBlocked).map(([date, items]) => (
                    <div key={date} className={styles.blockedGroup}>
                      <div className={styles.blockedGroupDate}>
                        {format(new Date(date + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
                      </div>
                      {items.map(b => {
                        const Icon = JORNADA_ICONS[b.jornada] || Clock
                        return (
                          <div key={b.id} className={styles.blockedItem}>
                            <div className={styles.blockedInfo}>
                              <span className={`${styles.blockedJornada} ${styles['blockedJornada_' + (b.jornada || 'completo')]}`}>
                                <Icon size={12} />
                                {JORNADA_LABELS[b.jornada] || 'Día completo'}
                              </span>
                              {b.reason && <span className={styles.blockedReason}>{b.reason}</span>}
                            </div>
                            <button
                              className={styles.unblockBtn}
                              onClick={() => handleUnblock(b.id)}
                              disabled={deleting === b.id}
                              title="Desbloquear"
                            >
                              {deleting === b.id ? <Loader2 size={14} className={styles.spin} /> : <Trash2 size={14} />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* ── GLOBAL VIEW ── */
        <div className={styles.globalView}>
          {Object.keys(globalGrouped).length === 0 ? (
            <div className={styles.emptyGlobal}>
              <CalendarOff size={28} style={{ color: '#ccc' }} />
              <p>No hay fechas bloqueadas en ninguna sala.</p>
            </div>
          ) : (
            <div className={styles.globalList}>
              {Object.entries(globalGrouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, roomsMap]) => (
                <div key={date} className={styles.globalDateBlock}>
                  <div className={styles.globalDateHeader}>
                    {format(new Date(date + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })}
                  </div>
                  <div className={styles.globalRoomsList}>
                    {rooms.map(room => {
                      const items = roomsMap[room.name]
                      if (!items) return (
                        <div key={room.id} className={`${styles.globalRoomRow} ${styles.globalRoomFree}`}>
                          <span className={styles.globalRoomName}>{room.name}</span>
                          <div className={styles.globalJornadas}>
                            <span className={styles.globalFreeLabel}>Disponible</span>
                          </div>
                        </div>
                      )

                      const jornadas = items.map(i => i.jornada || 'completo')
                      const isFullyBlocked = jornadas.includes('completo') || (jornadas.includes('manana') && jornadas.includes('tarde'))

                      return (
                        <div key={room.id} className={`${styles.globalRoomRow} ${isFullyBlocked ? styles.globalRoomFullBlocked : styles.globalRoomPartial}`}>
                          <span className={styles.globalRoomName}>{room.name}</span>
                          <div className={styles.globalJornadas}>
                            {items.map(b => {
                              const Icon = JORNADA_ICONS[b.jornada] || Clock
                              return (
                                <span key={b.id} className={`${styles.globalJornadaChip} ${styles['globalJornada_' + (b.jornada || 'completo')]}`}>
                                  <Icon size={11} />
                                  {JORNADA_LABELS[b.jornada] || 'Completo'}
                                </span>
                              )
                            })}
                            {!isFullyBlocked && !jornadas.includes('manana') && (
                              <span className={styles.globalFreeChip}>
                                <Sun size={11} /> Mañana libre
                              </span>
                            )}
                            {!isFullyBlocked && !jornadas.includes('tarde') && (
                              <span className={styles.globalFreeChip}>
                                <Sunset size={11} /> Tarde libre
                              </span>
                            )}
                          </div>
                          <div className={styles.globalActions}>
                            {items.map(b => (
                              <button
                                key={b.id}
                                className={styles.globalUnblockBtn}
                                onClick={() => handleUnblock(b.id)}
                                disabled={deleting === b.id}
                                title={`Desbloquear ${JORNADA_LABELS[b.jornada] || ''}`}
                              >
                                {deleting === b.id ? <Loader2 size={12} className={styles.spin} /> : <Trash2 size={12} />}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
