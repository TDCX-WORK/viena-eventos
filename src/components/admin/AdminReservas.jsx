import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  IconSearch,
  IconX,
  IconChevronDown,
  IconCheck,
  IconRotate,
  IconAlertTriangle,
  IconRefresh,
  IconMail,
  IconPhone,
  IconMessage,
  IconCalendar,
  IconUsers,
  IconClock,
  IconInbox,
  IconLayoutGrid,
} from '@tabler/icons-react'
import useReservas, { filtrarReservas } from '../../hooks/useReservas'
import { verificarReserva } from '../../lib/verificarReserva'
import Paginacion from './Paginacion/Paginacion'
import Modal from './Modal/Modal'
import styles from './AdminReservas.module.css'

const POR_PAGINA = 8

const ESTADOS = {
  pending:   { label: 'Pendiente',  badge: 'badgeAmbar',  punto: 'puntoAmbar' },
  confirmed: { label: 'Confirmada', badge: 'badgeVerde',  punto: 'puntoVerde' },
  cancelled: { label: 'Cancelada',  badge: 'badgeAcento', punto: 'puntoAcento' },
}

const FILTROS = [
  { id: 'all',       label: 'Todas' },
  { id: 'pending',   label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'cancelled', label: 'Canceladas' },
]

const JORNADAS = { manana: 'Mañana', tarde: 'Tarde', completo: 'Día completo' }
const LAYOUTS  = { imperial: 'Imperial', u: 'En U', escuela: 'Escuela', teatro: 'Teatro' }

const euros    = (n) => `${Number(n || 0).toLocaleString('es-ES')} €`
const dia      = (iso) => format(new Date(iso + 'T00:00:00'), 'd MMM', { locale: es })
const diaLargo = (iso) => format(new Date(iso + 'T00:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es })
const recibida = (iso) => format(new Date(iso), "d MMM yyyy", { locale: es })

export default function AdminReservas() {
  const {
    reservas, ofertas, conflictos, contadores,
    cargando, error, actualizando, recargar, cambiarEstado,
  } = useReservas()

  const [filtro, setFiltro] = useState('all')
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)
  const [abierta, setAbierta] = useState(null)
  const [confirmacion, setConfirmacion] = useState(null)

  // Indicador deslizante de los filtros. Mismo patrón que la navbar: la
  // posición y el ancho se miden en JS porque cada pestaña tiene un ancho
  // distinto según su texto.
  //
  // La opacidad se toca por DOM y no con un estado de React. Podría ser
  // un useState, pero entonces habría que llamar a setState dentro del
  // efecto y eso encadena un render extra en cada medición (es lo que
  // avisa react-hooks/set-state-in-effect). El indicador ya se coloca
  // manipulando el nodo; encenderlo por el mismo camino es coherente y
  // no cuesta un ciclo de render.
  const tabsRef = useRef(null)
  const indicadorRef = useRef(null)

  const colocarIndicador = useCallback(() => {
    const cont = tabsRef.current
    const ind = indicadorRef.current
    if (!cont || !ind) return

    const botones = cont.querySelectorAll('[data-tab]')
    const idx = FILTROS.findIndex(f => f.id === filtro)
    const el = botones[idx]
    if (!el) return

    const cajaCont = cont.getBoundingClientRect()
    const cajaEl = el.getBoundingClientRect()
    // scrollLeft: en móvil las pestañas se arrastran de lado, así que la
    // posición hay que medirla respecto al contenido, no al viewport.
    ind.style.left = `${cajaEl.left - cajaCont.left + cont.scrollLeft}px`
    ind.style.width = `${cajaEl.width}px`
    ind.style.opacity = '1'
  }, [filtro])

  // useLayoutEffect: coloca antes del pintado, así no se ve nunca en una
  // posición equivocada. Depende de contadores porque los números de
  // dentro de cada pestaña cambian su ancho.
  useLayoutEffect(() => {
    colocarIndicador()
  }, [colocarIndicador, contadores])

  useEffect(() => {
    window.addEventListener('resize', colocarIndicador)
    // Hasta que Inter no ha cargado, el navegador pinta con la fuente de
    // sistema y los anchos son otros.
    document.fonts?.ready.then(colocarIndicador)
    return () => window.removeEventListener('resize', colocarIndicador)
  }, [colocarIndicador])

  // Volver a la primera página se hace en el manejador, no en un efecto:
  // es consecuencia directa de una acción de la persona, no una
  // sincronización con nada externo.
  function cambiarFiltro(id) {
    setFiltro(id)
    setPagina(1)
    setAbierta(null)
  }

  function cambiarBusqueda(valor) {
    setBusqueda(valor)
    setPagina(1)
  }

  function quitarFiltros() {
    setFiltro('all')
    setBusqueda('')
    setPagina(1)
  }

  const filtradas = useMemo(
    () => filtrarReservas(reservas, filtro, busqueda),
    [reservas, filtro, busqueda]
  )

  const desde = (pagina - 1) * POR_PAGINA
  const visibles = filtradas.slice(desde, desde + POR_PAGINA)

  /** Confirmar. Si choca con otra ya confirmada, se pregunta antes. */
  function pedirConfirmar(reserva) {
    const choques = conflictos[reserva.id]
    if (choques && choques.length > 0) {
      setConfirmacion({ tipo: 'conflicto', reserva, choques })
      return
    }
    cambiarEstado(reserva.id, 'confirmed')
  }

  /** Cancelar una ya confirmada sí se pregunta: se está deshaciendo algo
   *  que el cliente ya da por bueno. Rechazar una pendiente, no. */
  function pedirCancelar(reserva) {
    if (reserva.status === 'confirmed') {
      setConfirmacion({ tipo: 'cancelar', reserva })
      return
    }
    cambiarEstado(reserva.id, 'cancelled')
  }

  async function ejecutarConfirmacion() {
    const { tipo, reserva } = confirmacion
    setConfirmacion(null)
    await cambiarEstado(reserva.id, tipo === 'conflicto' ? 'confirmed' : 'cancelled')
  }

  if (cargando) {
    return (
      <div className={styles.cargando}>
        <div className={styles.puntos} aria-hidden="true"><span /><span /><span /></div>
        <p>Cargando reservas…</p>
      </div>
    )
  }

  const totalConflictos = Object.keys(conflictos).length

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reservas</h1>
          <p className={styles.subtitle}>
            {contadores.all} en total · {contadores.pending} sin contestar
          </p>
        </div>
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

      {totalConflictos > 0 && (
        <div className={styles.aviso}>
          <IconAlertTriangle size={16} stroke={1.75} />
          <span>
            Hay {totalConflictos} reserva(s) que se solapan con otra ya confirmada
            en la misma sala y jornada. Están marcadas en la lista.
          </span>
        </div>
      )}

      {/* ── Filtros y buscador ─────────────────────────────────────── */}
      <div className={styles.barra}>
        <div className={styles.filtroTabs} ref={tabsRef}>
          <div
            ref={indicadorRef}
            className={styles.filtroIndicator}
            aria-hidden="true"
          />
          {FILTROS.map(f => (
            <button
              key={f.id}
              type="button"
              data-tab
              className={`${styles.filtroTab} ${filtro === f.id ? styles.filtroActive : ''}`}
              onClick={() => cambiarFiltro(f.id)}
              aria-pressed={filtro === f.id}
            >
              {f.label}
              <span className={styles.tabBadge}>{contadores[f.id]}</span>
            </button>
          ))}
        </div>

        <div className={styles.searchWrap}>
          <IconSearch size={16} stroke={1.75} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por referencia, nombre, email o sala…"
            value={busqueda}
            onChange={(e) => cambiarBusqueda(e.target.value)}
            aria-label="Buscar reservas"
          />
          {busqueda && (
            <button
              type="button"
              className={styles.limpiar}
              onClick={() => cambiarBusqueda('')}
              aria-label="Limpiar la búsqueda"
            >
              <IconX size={14} stroke={2} />
            </button>
          )}
        </div>
      </div>

      {/* ── Lista ──────────────────────────────────────────────────── */}
      {filtradas.length === 0 ? (
        <div className={styles.vacio}>
          <IconInbox size={36} stroke={1.25} />
          <p>
            {reservas.length === 0
              ? 'Todavía no ha llegado ninguna solicitud desde la web.'
              : 'Ninguna reserva coincide con lo que buscas.'}
          </p>
          {reservas.length > 0 && (
            <button
              type="button"
              className={styles.btnSecundario}
              onClick={quitarFiltros}
            >
              Quitar los filtros
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={styles.lista}>
            {visibles.map(r => {
              const est = ESTADOS[r.status] || ESTADOS.pending
              const desplegada = abierta === r.id
              const choques = conflictos[r.id] || []
              const fechas = [...(r.booking_dates || [])].sort((a, b) => a.date.localeCompare(b.date))
              const ocupada = actualizando === r.id

              return (
                <article
                  key={r.id}
                  className={`
                    ${styles.card}
                    ${desplegada ? styles.cardAbierta : ''}
                    ${choques.length > 0 ? styles.cardConflicto : ''}
                    ${r.status === 'cancelled' ? styles.cardCancelada : ''}
                  `}
                >
                  <button
                    type="button"
                    className={styles.cardCabecera}
                    onClick={() => setAbierta(desplegada ? null : r.id)}
                    aria-expanded={desplegada}
                  >
                    <div className={styles.cabeceraArriba}>
                      <span className={`${styles.punto} ${styles[est.punto]}`} aria-hidden="true" />
                      <span className={styles.ref}>{r.reference}</span>
                      <span className={`${styles.badge} ${styles[est.badge]}`}>{est.label}</span>
                      {choques.length > 0 && (
                        <span className={styles.badgeConflicto}>
                          <IconAlertTriangle size={11} stroke={2} />
                          Se solapa
                        </span>
                      )}
                      <span className={styles.recibida}>{recibida(r.created_at)}</span>
                      <IconChevronDown
                        size={18}
                        stroke={1.75}
                        className={`${styles.chevron} ${desplegada ? styles.chevronAbierto : ''}`}
                      />
                    </div>

                    <div className={styles.cabeceraAbajo}>
                      <span className={styles.nombre}>{r.contact_name}</span>
                      <span className={styles.meta}>{r.rooms?.name || '—'}</span>
                      {fechas.length > 0 && (
                        <span className={styles.meta}>
                          {dia(fechas[0].date)}
                          {fechas.length > 1 && ` +${fechas.length - 1}`}
                        </span>
                      )}
                      <span className={styles.precio}>{euros(r.total_price)}</span>
                    </div>
                  </button>

                  {desplegada && (
                    <div className={styles.cuerpo}>
                      {choques.length > 0 && (
                        <div className={styles.avisoInterno}>
                          <IconAlertTriangle size={15} stroke={1.75} />
                          <div>
                            <strong>Choca con otra reserva confirmada.</strong>
                            <ul>
                              {choques.map((c, i) => (
                                <li key={i}>
                                  {diaLargo(c.fecha)} · {JORNADAS[c.jornada] || c.jornada} · con {c.con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      <div className={styles.contacto}>
                        <a href={`mailto:${r.contact_email}`} className={styles.dato}>
                          <IconMail size={14} stroke={1.75} />
                          {r.contact_email}
                        </a>
                        {r.contact_phone && (
                          <a href={`tel:${r.contact_phone}`} className={styles.dato}>
                            <IconPhone size={14} stroke={1.75} />
                            {r.contact_phone}
                          </a>
                        )}
                      </div>

                      {r.comments && (
                        <div className={styles.comentario}>
                          <IconMessage size={14} stroke={1.75} />
                          <p>{r.comments}</p>
                        </div>
                      )}

                      {fechas.length > 0 && (
                        <div className={styles.bloque}>
                          <h3 className={styles.bloqueTitulo}>
                            <IconCalendar size={14} stroke={1.75} />
                            Fechas reservadas
                          </h3>
                          <ul className={styles.fechas}>
                            {fechas.map(d => (
                              <li key={d.id} className={styles.fecha}>
                                <span className={styles.fechaDia}>{diaLargo(d.date)}</span>
                                <span className={styles.fechaMeta}>
                                  <IconClock size={12} stroke={1.75} />
                                  {JORNADAS[d.jornada] || d.jornada}
                                  {d.layout && (
                                    <>
                                      <IconLayoutGrid size={12} stroke={1.75} />
                                      {LAYOUTS[d.layout] || d.layout}
                                    </>
                                  )}
                                  {d.attendees && (
                                    <>
                                      <IconUsers size={12} stroke={1.75} />
                                      {d.attendees}
                                    </>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {r.booking_extras?.length > 0 && (
                        <div className={styles.bloque}>
                          <h3 className={styles.bloqueTitulo}>Extras</h3>
                          <div className={styles.chips}>
                            {r.booking_extras.map(be => (
                              <span key={be.id} className={styles.chip}>
                                {be.extras?.name || '—'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recálculo. El precio lo calcula el navegador del
                          cliente y se guarda tal cual, así que aquí se
                          rehace con el motor y se avisa si no cuadra.
                          Un aviso no significa fraude: si las tarifas
                          cambiaron después, el precio guardado es el
                          bueno porque es el que se le prometió. */}
                      {(() => {
                        const check = verificarReserva(r, ofertas)
                        if (check.ok) return null
                        return (
                          <div className={styles.revisar}>
                            <IconAlertTriangle size={15} stroke={1.75} />
                            <div>
                              <strong>Revisa el importe</strong>
                              <ul className={styles.revisarLista}>
                                {check.avisos.map((a, i) => <li key={i}>{a}</li>)}
                              </ul>
                            </div>
                          </div>
                        )
                      })()}

                      <div className={styles.desglose}>
                        <span>Salas <b>{euros(r.base_price)}</b></span>
                        <span>Extras <b>{euros(r.extras_price)}</b></span>
                        {/* El descuento solo aparece si lo hubo. El nombre
                            de la oferta lo escribió el servidor al crear la
                            reserva, así que sigue siendo el correcto aunque
                            la oferta se haya editado o borrado después. */}
                        {Number(r.discount_amount) > 0 && (
                          <span className={styles.desgloseOferta}>
                            {r.offer_name || 'Oferta'}
                            {r.offer_code ? ` · ${r.offer_code}` : ''}
                            {' '}<b>−{euros(r.discount_amount)}</b>
                          </span>
                        )}
                        <span className={styles.desgloseTotal}>Total <b>{euros(r.total_price)}</b></span>
                      </div>

                      <div className={styles.acciones}>
                        {r.status !== 'confirmed' && (
                          <button
                            type="button"
                            className={styles.btnAprobar}
                            onClick={() => pedirConfirmar(r)}
                            disabled={ocupada}
                          >
                            <IconCheck size={15} stroke={2} />
                            {r.status === 'cancelled' ? 'Reactivar y confirmar' : 'Confirmar'}
                          </button>
                        )}

                        {r.status !== 'cancelled' && (
                          <button
                            type="button"
                            className={styles.btnRechazar}
                            onClick={() => pedirCancelar(r)}
                            disabled={ocupada}
                          >
                            <IconX size={15} stroke={2} />
                            {r.status === 'confirmed' ? 'Cancelar' : 'Rechazar'}
                          </button>
                        )}

                        {r.status !== 'pending' && (
                          <button
                            type="button"
                            className={styles.btnSecundario}
                            onClick={() => cambiarEstado(r.id, 'pending')}
                            disabled={ocupada}
                          >
                            <IconRotate size={15} stroke={2} />
                            Volver a pendiente
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </div>

          <Paginacion
            total={filtradas.length}
            pagina={pagina}
            porPagina={POR_PAGINA}
            onCambio={(p) => { setPagina(p); setAbierta(null) }}
            etiqueta="reservas"
          />
        </>
      )}

      {/* ── Confirmaciones ─────────────────────────────────────────── */}
      <Modal
        abierto={!!confirmacion}
        onCerrar={() => setConfirmacion(null)}
        variante="centrado"
        ancho={440}
        pie={
          <>
            <button type="button" className={styles.btnSecundario} onClick={() => setConfirmacion(null)}>
              Volver
            </button>
            <button
              type="button"
              className={confirmacion?.tipo === 'conflicto' ? styles.btnAprobar : styles.btnRechazar}
              onClick={ejecutarConfirmacion}
            >
              {confirmacion?.tipo === 'conflicto' ? 'Confirmar de todas formas' : 'Sí, cancelar'}
            </button>
          </>
        }
      >
        {confirmacion?.tipo === 'conflicto' ? (
          <>
            <div className={styles.modalIcono}>
              <IconAlertTriangle size={26} stroke={1.75} />
            </div>
            <h2 className={styles.modalTitulo}>La sala ya está ocupada</h2>
            <p className={styles.modalTexto}>
              {confirmacion.reserva.rooms?.name} ya tiene una reserva confirmada en:
            </p>
            <ul className={styles.modalLista}>
              {confirmacion.choques.map((c, i) => (
                <li key={i}>
                  {diaLargo(c.fecha)} · {JORNADAS[c.jornada] || c.jornada}
                  <span> (reserva {c.con})</span>
                </li>
              ))}
            </ul>
            <p className={styles.modalTexto}>
              Si la confirmas, quedarán dos reservas para el mismo espacio.
            </p>
          </>
        ) : confirmacion ? (
          <>
            <div className={`${styles.modalIcono} ${styles.modalIconoNeutro}`}>
              <IconX size={26} stroke={1.75} />
            </div>
            <h2 className={styles.modalTitulo}>Cancelar {confirmacion.reserva.reference}</h2>
            <p className={styles.modalTexto}>
              La reserva de {confirmacion.reserva.contact_name} pasará a cancelada y su
              sala quedará libre. No se envía ningún aviso al cliente: hay que
              escribirle aparte.
            </p>
          </>
        ) : null}
      </Modal>
    </div>
  )
}
