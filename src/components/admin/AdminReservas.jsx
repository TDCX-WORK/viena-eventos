import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  BookOpen, Search, ChevronDown, ChevronUp,
  Mail, Phone, MessageSquare, Loader2, Calendar,
  Users, MapPin, Clock, Hash, CreditCard, Tag, X
} from 'lucide-react'
import styles from './AdminReservas.module.css'

const STATUS_MAP = {
  pending:   { label: 'Pendiente',  color: 'amber' },
  confirmed: { label: 'Confirmada', color: 'green' },
  cancelled: { label: 'Cancelada',  color: 'red' },
}

export default function AdminReservas() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [updating, setUpdating] = useState(null)

  useEffect(() => { loadBookings() }, [])

  async function loadBookings() {
    const { data } = await supabase
      .from('bookings')
      .select(`*, rooms(name, slug), booking_dates(*), booking_extras(*, extras(*))`)
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, newStatus) => {
    setUpdating(id)
    try {
      await supabase
        .from('bookings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b))
    } catch (err) { console.error(err) }
    finally { setUpdating(null) }
  }

  const filtered = bookings.filter(b => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        b.reference?.toLowerCase().includes(q) ||
        b.contact_name?.toLowerCase().includes(q) ||
        b.contact_email?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const JORNADA_LABELS = { manana: 'Mañana', tarde: 'Tarde', completo: 'Completa' }
  const LAYOUT_LABELS = { imperial: 'Imperial', u: 'En U', escuela: 'Escuela', teatro: 'Teatro' }

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }

  if (loading) return <p style={{ color: '#78716c' }}>Cargando reservas...</p>

  return (
    <div className={styles.wrapper}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reservas</h1>
          <p className={styles.subtitle}>{bookings.length} reserva(s) en total</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className={styles.tabBar}>
        {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
          <button
            key={s}
            className={`${styles.tab} ${filterStatus === s ? styles['tabActive_' + (s === 'all' ? 'all' : STATUS_MAP[s].color)] : ''}`}
            onClick={() => setFilterStatus(s)}
          >
            <span className={styles.tabLabel}>{s === 'all' ? 'Todas' : STATUS_MAP[s].label}</span>
            <span className={`${styles.tabCount} ${filterStatus === s ? styles['tabCountActive_' + (s === 'all' ? 'all' : STATUS_MAP[s].color)] : ''}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <Search size={16} />
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por nombre, email o referencia..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearSearch} onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={styles.emptyCard}>
          <BookOpen size={36} style={{ color: '#d4d0cb' }} />
          <p className={styles.emptyTitle}>Sin resultados</p>
          <p className={styles.emptyText}>
            No hay reservas{filterStatus !== 'all' ? ` con estado "${STATUS_MAP[filterStatus]?.label}"` : ''}
            {search ? ` que coincidan con "${search}"` : ''}.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map(b => {
            const isOpen = expanded === b.id
            const st = STATUS_MAP[b.status] || STATUS_MAP.pending
            return (
              <div key={b.id} className={`${styles.card} ${isOpen ? styles.cardOpen : ''}`}>
                {/* Card header */}
                <button className={styles.cardHeader} onClick={() => setExpanded(isOpen ? null : b.id)}>
                  <div className={styles.headerTop}>
                    <div className={styles.headerLeft}>
                      <span className={`${styles.statusDot} ${styles['dot_' + st.color]}`} />
                      <span className={styles.ref}>{b.reference}</span>
                      <span className={`${styles.badge} ${styles['badge_' + st.color]}`}>{st.label}</span>
                    </div>
                    <div className={styles.headerRight}>
                      <span className={styles.headerDate}>
                        {format(new Date(b.created_at), "d MMM yyyy", { locale: es })}
                      </span>
                      <span className={styles.chevron}>
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </div>
                  <div className={styles.headerBottom}>
                    <span className={styles.clientName}>{b.contact_name}</span>
                    <span className={styles.headerMeta}>{b.rooms?.name || '—'}</span>
                    {b.total_price && (
                      <span className={styles.headerPrice}>
                        {Number(b.total_price).toLocaleString('es-ES')} €
                      </span>
                    )}
                  </div>
                </button>

                {/* Card body */}
                {isOpen && (
                  <div className={styles.cardBody}>
                    {/* Info grid */}
                    <div className={styles.infoGrid}>
                      {/* Contact */}
                      <div className={styles.infoBlock}>
                        <h4 className={styles.infoLabel}>
                          <Users size={14} />
                          Contacto
                        </h4>
                        <div className={styles.infoContent}>
                          <div className={styles.infoRow}>
                            <Mail size={13} />
                            <span>{b.contact_email}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <Phone size={13} />
                            <span>{b.contact_phone || '—'}</span>
                          </div>
                          {b.comments && (
                            <div className={`${styles.infoRow} ${styles.commentRow}`}>
                              <MessageSquare size={13} />
                              <span>{b.comments}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Room & price */}
                      <div className={styles.infoBlock}>
                        <h4 className={styles.infoLabel}>
                          <MapPin size={14} />
                          Reserva
                        </h4>
                        <div className={styles.infoContent}>
                          <div className={styles.infoRow}>
                            <Hash size={13} />
                            <span>{b.reference}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <MapPin size={13} />
                            <span>{b.rooms?.name || '—'}</span>
                          </div>
                          <div className={styles.infoRow}>
                            <CreditCard size={13} />
                            <span className={styles.priceValue}>
                              {b.total_price ? `${Number(b.total_price).toLocaleString('es-ES')} €` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    {b.booking_dates?.length > 0 && (
                      <div className={styles.datesSection}>
                        <h4 className={styles.infoLabel}>
                          <Calendar size={14} />
                          Fechas reservadas
                        </h4>
                        <div className={styles.datesGrid}>
                          {b.booking_dates.map(d => (
                            <div key={d.id} className={styles.dateCard}>
                              <div className={styles.dateDay}>
                                {format(new Date(d.date + 'T00:00:00'), "d", { locale: es })}
                              </div>
                              <div className={styles.dateMeta}>
                                <span className={styles.dateMonth}>
                                  {format(new Date(d.date + 'T00:00:00'), "MMM yyyy", { locale: es })}
                                </span>
                                <span className={styles.dateDetails}>
                                  <Clock size={11} />
                                  {JORNADA_LABELS[d.jornada] || d.jornada}
                                  {d.layout && (
                                    <> · {LAYOUT_LABELS[d.layout] || d.layout}</>
                                  )}
                                  {d.attendees && (
                                    <> · {d.attendees} pax</>
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extras */}
                    {b.booking_extras?.length > 0 && (
                      <div className={styles.extrasSection}>
                        <h4 className={styles.infoLabel}>
                          <Tag size={14} />
                          Extras
                        </h4>
                        <div className={styles.extrasList}>
                          {b.booking_extras.map(be => (
                            <span key={be.id} className={styles.extraChip}>
                              {be.extras?.name || '—'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status actions */}
                    <div className={styles.actionsBar}>
                      {['pending', 'confirmed', 'cancelled'].map(s => (
                        <button
                          key={s}
                          className={`${styles.actionBtn} ${styles['actionBtn_' + STATUS_MAP[s].color]} ${b.status === s ? styles.actionBtnCurrent : ''}`}
                          onClick={() => updateStatus(b.id, s)}
                          disabled={b.status === s || updating === b.id}
                        >
                          {updating === b.id && b.status !== s ? <Loader2 size={14} className={styles.spin} /> : null}
                          {STATUS_MAP[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
