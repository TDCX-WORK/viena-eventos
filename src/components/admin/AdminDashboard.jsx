import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  IconInbox,
  IconCalendarWeek,
  IconCircleCheck,
  IconCoin,
  IconCheck,
  IconX,
  IconChevronDown,
  IconAlertTriangle,
  IconRefresh,
  IconMoodCheck,
  IconCalendarOff,
  IconMail,
  IconPhone,
  IconMessage,
  IconArrowRight,
  IconClock,
  IconUsers,
} from '@tabler/icons-react'
import useDashboard from '../../hooks/useDashboard'
import Paginacion from './Paginacion/Paginacion'
import styles from './AdminDashboard.module.css'

const POR_PAGINA = 5

const ESTADOS = {
  pending:   { label: 'Pendiente',  clase: 'badgeAmbar' },
  confirmed: { label: 'Confirmada', clase: 'badgeVerde' },
  cancelled: { label: 'Cancelada',  clase: 'badgeAcento' },
}

const JORNADAS = { manana: 'Mañana', tarde: 'Tarde', completo: 'Día completo' }
const LAYOUTS  = { imperial: 'Imperial', u: 'En U', escuela: 'Escuela', teatro: 'Teatro' }

const euros = (n) => `${Number(n || 0).toLocaleString('es-ES')} €`
const dia   = (iso) => format(new Date(iso + 'T00:00:00'), "d MMM", { locale: es })
const diaLargo = (iso) => format(new Date(iso + 'T00:00:00'), "EEEE d 'de' MMMM", { locale: es })

export default function AdminDashboard() {
  const navigate = useNavigate()
  const {
    pendientes, agenda, contadores, reservas,
    cargando, error, actualizando, enVivo, recargar, cambiarEstado,
  } = useDashboard()

  const [pagina, setPagina] = useState(1)
  const [abierta, setAbierta] = useState(null)

  const hoy = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  if (cargando) {
    return (
      <div className={styles.cargando}>
        <div className={styles.puntos} aria-hidden="true"><span /><span /><span /></div>
        <p>Cargando el panel…</p>
      </div>
    )
  }

  const desde = (pagina - 1) * POR_PAGINA
  const paginaActual = reservas.slice(desde, desde + POR_PAGINA)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Inicio</h1>
          <p className={styles.subtitle}>{hoy}</p>
        </div>
        {/* Solo si el canal está conectado de verdad. Un "en vivo" que
            no escucha nada es peor que no tener indicador. */}
        {enVivo && (
          <span className={styles.envivo}>
            <span className={styles.punto} aria-hidden="true" />
            En vivo
          </span>
        )}
      </div>

      {error && (
        <div className={styles.errorMsg} role="alert">
          <IconAlertTriangle size={16} stroke={1.75} />
          <span>{error}</span>
          <button type="button" className={styles.reintentar} onClick={() => recargar()}>
            <IconRefresh size={14} stroke={2} />
            Reintentar
          </button>
        </div>
      )}

      {/* ── Contadores ─────────────────────────────────────────────── */}
      <div className={styles.statsGrid}>
        <button
          type="button"
          className={`${styles.statCard} ${contadores.sinContestar > 0 ? styles.cardUrgente : ''}`}
          onClick={() => navigate('/admin/reservas')}
        >
          <div className={`${styles.statIcon} ${contadores.sinContestar > 0 ? styles.red : styles.gray}`}>
            <IconInbox size={20} stroke={1.75} />
          </div>
          <div className={styles.statValue}>{contadores.sinContestar}</div>
          <div className={styles.statLabel}>Sin contestar</div>
        </button>

        <button
          type="button"
          className={styles.statCard}
          onClick={() => navigate('/admin/disponibilidad')}
        >
          <div className={`${styles.statIcon} ${styles.blue}`}>
            <IconCalendarWeek size={20} stroke={1.75} />
          </div>
          <div className={styles.statValue}>{contadores.jornadas7}</div>
          <div className={styles.statLabel}>Jornadas · 7 días</div>
        </button>

        <button
          type="button"
          className={styles.statCard}
          onClick={() => navigate('/admin/reservas')}
        >
          <div className={`${styles.statIcon} ${styles.green}`}>
            <IconCircleCheck size={20} stroke={1.75} />
          </div>
          <div className={styles.statValue}>{contadores.confirmadasMes}</div>
          <div className={styles.statLabel}>Confirmadas este mes</div>
        </button>

        <div className={`${styles.statCard} ${styles.statCardQuieta}`}>
          <div className={`${styles.statIcon} ${styles.amber}`}>
            <IconCoin size={20} stroke={1.75} />
          </div>
          <div className={styles.statValue}>{euros(contadores.ingresosMes)}</div>
          <div className={styles.statLabel}>
            Confirmado este mes
            {contadores.ingresosPorConfirmar > 0 && (
              <span className={styles.statExtra}>
                +{euros(contadores.ingresosPorConfirmar)} por confirmar
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bento: pendientes + agenda ─────────────────────────────── */}
      <div className={styles.bento}>
        <section className={`${styles.card} ${pendientes.length > 0 ? styles.cardUrgente : ''}`}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Sin contestar</h2>
            {pendientes.length > 0 && (
              <span className={styles.contador}>{pendientes.length}</span>
            )}
          </div>

          {pendientes.length === 0 ? (
            <div className={styles.vacio}>
              <IconMoodCheck size={36} stroke={1.25} />
              <p>Nada pendiente. Las solicitudes nuevas aparecerán aquí solas.</p>
            </div>
          ) : (
            <ul className={styles.pendientesLista}>
              {pendientes.slice(0, 4).map(r => {
                const fechas = (r.booking_dates || []).map(d => d.date).sort()
                return (
                  <li key={r.id} className={styles.pendiente}>
                    <div className={styles.pendienteInfo}>
                      <div className={styles.pendienteTop}>
                        <span className={styles.ref}>{r.reference}</span>
                        <span className={styles.importe}>{euros(r.total_price)}</span>
                      </div>
                      <p className={styles.pendienteNombre}>{r.contact_name}</p>
                      <p className={styles.pendienteMeta}>
                        {r.rooms?.name || '—'}
                        {fechas.length > 0 && (
                          <> · {dia(fechas[0])}
                            {fechas.length > 1 && ` y ${fechas.length - 1} día(s) más`}
                          </>
                        )}
                      </p>
                    </div>

                    <div className={styles.pendienteAcciones}>
                      <button
                        type="button"
                        className={styles.btnAprobar}
                        onClick={() => cambiarEstado(r.id, 'confirmed')}
                        disabled={actualizando === r.id}
                      >
                        <IconCheck size={15} stroke={2} />
                        Confirmar
                      </button>
                      <button
                        type="button"
                        className={styles.btnRechazar}
                        onClick={() => cambiarEstado(r.id, 'cancelled')}
                        disabled={actualizando === r.id}
                      >
                        <IconX size={15} stroke={2} />
                        Rechazar
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {pendientes.length > 4 && (
            <button type="button" className={styles.verTodas} onClick={() => navigate('/admin/reservas')}>
              Ver las {pendientes.length} pendientes
              <IconArrowRight size={15} stroke={2} />
            </button>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Próximas jornadas</h2>
          </div>

          {agenda.length === 0 ? (
            <div className={styles.vacio}>
              <IconCalendarOff size={36} stroke={1.25} />
              <p>Sin jornadas confirmadas por delante.</p>
            </div>
          ) : (
            <ul className={styles.agenda}>
              {agenda.slice(0, 6).map(j => (
                <li key={j.id} className={styles.jornada}>
                  <span className={styles.jornadaFecha}>{dia(j.fecha)}</span>
                  <div className={styles.jornadaInfo}>
                    <span className={styles.jornadaSala}>{j.sala}</span>
                    <span className={styles.jornadaMeta}>
                      <IconClock size={12} stroke={1.75} />
                      {JORNADAS[j.jornada] || j.jornada}
                      {j.asistentes ? <> · {j.asistentes} pax</> : null}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {agenda.length > 6 && (
            <button type="button" className={styles.verTodas} onClick={() => navigate('/admin/disponibilidad')}>
              Ver el calendario
              <IconArrowRight size={15} stroke={2} />
            </button>
          )}
        </section>
      </div>

      {/* ── Últimas solicitudes ────────────────────────────────────── */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Últimas solicitudes</h2>
          <button type="button" className={styles.enlace} onClick={() => navigate('/admin/reservas')}>
            Ver todas
            <IconArrowRight size={14} stroke={2} />
          </button>
        </div>

        {reservas.length === 0 ? (
          <div className={styles.vacio}>
            <IconInbox size={36} stroke={1.25} />
            <p>Todavía no ha llegado ninguna solicitud desde la web.</p>
          </div>
        ) : (
          <>
            <ul className={styles.lista}>
              {paginaActual.map(r => {
                const est = ESTADOS[r.status] || ESTADOS.pending
                const desplegada = abierta === r.id
                const fechas = [...(r.booking_dates || [])].sort((a, b) => a.date.localeCompare(b.date))

                return (
                  <li key={r.id} className={`${styles.fila} ${desplegada ? styles.filaAbierta : ''}`}>
                    <button
                      type="button"
                      className={styles.filaCabecera}
                      onClick={() => setAbierta(desplegada ? null : r.id)}
                      aria-expanded={desplegada}
                    >
                      <span className={styles.ref}>{r.reference}</span>
                      <span className={styles.filaNombre}>{r.contact_name}</span>
                      <span className={styles.filaSala}>{r.rooms?.name || '—'}</span>
                      <span className={styles.filaImporte}>{euros(r.total_price)}</span>
                      <span className={`${styles.badge} ${styles[est.clase]}`}>{est.label}</span>
                      <IconChevronDown
                        size={18}
                        stroke={1.75}
                        className={`${styles.chevron} ${desplegada ? styles.chevronAbierto : ''}`}
                      />
                    </button>

                    {desplegada && (
                      <div className={styles.detalle}>
                        <div className={styles.detalleContacto}>
                          <span><IconMail size={13} stroke={1.75} /> {r.contact_email}</span>
                          <span><IconPhone size={13} stroke={1.75} /> {r.contact_phone || '—'}</span>
                          {r.comments && (
                            <span className={styles.comentario}>
                              <IconMessage size={13} stroke={1.75} /> {r.comments}
                            </span>
                          )}
                        </div>

                        {fechas.length > 0 && (
                          <ul className={styles.detalleFechas}>
                            {fechas.map(d => (
                              <li key={d.id} className={styles.detalleFecha}>
                                <span className={styles.detalleFechaDia}>{diaLargo(d.date)}</span>
                                <span className={styles.detalleFechaMeta}>
                                  {JORNADAS[d.jornada] || d.jornada}
                                  {d.layout && <> · {LAYOUTS[d.layout] || d.layout}</>}
                                  {d.attendees ? <> · <IconUsers size={12} stroke={1.75} /> {d.attendees}</> : null}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {r.booking_extras?.length > 0 && (
                          <div className={styles.detalleExtras}>
                            {r.booking_extras.map(be => (
                              <span key={be.id} className={styles.chip}>{be.extras?.name || '—'}</span>
                            ))}
                          </div>
                        )}

                        {r.status === 'pending' && (
                          <div className={styles.detalleAcciones}>
                            <button
                              type="button"
                              className={styles.btnAprobar}
                              onClick={() => cambiarEstado(r.id, 'confirmed')}
                              disabled={actualizando === r.id}
                            >
                              <IconCheck size={15} stroke={2} />
                              Confirmar
                            </button>
                            <button
                              type="button"
                              className={styles.btnRechazar}
                              onClick={() => cambiarEstado(r.id, 'cancelled')}
                              disabled={actualizando === r.id}
                            >
                              <IconX size={15} stroke={2} />
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <Paginacion
              total={reservas.length}
              pagina={pagina}
              porPagina={POR_PAGINA}
              onCambio={(p) => { setPagina(p); setAbierta(null) }}
              etiqueta="solicitudes"
            />
          </>
        )}
      </section>
    </div>
  )
}
