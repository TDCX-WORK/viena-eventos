import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BookOpen, Euro, CalendarCheck, TrendingUp } from 'lucide-react'
import styles from './AdminDashboard.module.css'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ bookings: 0, pending: 0, confirmed: 0, revenue: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Total reservas
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, reference, status, contact_name, contact_email, total_price, created_at, rooms(name)')
          .order('created_at', { ascending: false })

        const all = bookings || []
        const pending = all.filter(b => b.status === 'pending').length
        const confirmed = all.filter(b => b.status === 'confirmed').length
        const revenue = all
          .filter(b => b.status !== 'cancelled')
          .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0)

        setStats({ bookings: all.length, pending, confirmed, revenue })
        setRecent(all.slice(0, 8))
      } catch (err) {
        console.error('Error cargando dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const STATUS_LABELS = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Resumen general del sistema de reservas</p>
      </div>

      {/* Stats cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(59,125,216,0.1)', color: '#3B7DD8' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <p className={styles.statValue}>{loading ? '—' : stats.bookings}</p>
            <p className={styles.statLabel}>Total reservas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(160,120,72,0.1)', color: '#A07848' }}>
            <CalendarCheck size={20} />
          </div>
          <div>
            <p className={styles.statValue}>{loading ? '—' : stats.pending}</p>
            <p className={styles.statLabel}>Pendientes</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(91,140,90,0.1)', color: '#5B8C5A' }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <p className={styles.statValue}>{loading ? '—' : stats.confirmed}</p>
            <p className={styles.statLabel}>Confirmadas</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'rgba(61,53,48,0.08)', color: '#3D3530' }}>
            <Euro size={20} />
          </div>
          <div>
            <p className={styles.statValue}>{loading ? '—' : `${stats.revenue.toLocaleString('es-ES')} €`}</p>
            <p className={styles.statLabel}>Ingresos estimados</p>
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className={styles.recentCard}>
        <h2 className={styles.recentTitle}>Últimas reservas</h2>
        {loading ? (
          <p className={styles.emptyText}>Cargando...</p>
        ) : recent.length === 0 ? (
          <p className={styles.emptyText}>No hay reservas todavía. Aparecerán aquí cuando lleguen solicitudes desde la web.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Contacto</th>
                  <th>Sala</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(b => (
                  <tr key={b.id}>
                    <td className={styles.cellRef}>{b.reference}</td>
                    <td>
                      <span className={styles.cellName}>{b.contact_name}</span>
                      <span className={styles.cellEmail}>{b.contact_email}</span>
                    </td>
                    <td>{b.rooms?.name || '—'}</td>
                    <td className={styles.cellPrice}>{b.total_price ? `${b.total_price} €` : '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles['badge_' + b.status]}`}>
                        {STATUS_LABELS[b.status] || b.status}
                      </span>
                    </td>
                    <td className={styles.cellDate}>
                      {new Date(b.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
