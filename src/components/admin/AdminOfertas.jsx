import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconCopy,
  IconTag,
  IconTicket,
  IconAlertTriangle,
  IconRefresh,
  IconChevronLeft,
  IconChevronRight,
  IconDiscount2,
} from '@tabler/icons-react'
import useOfertas from '../../hooks/useOfertas'
import {
  estadoOferta,
  etiquetaDescuento,
  resumirCondiciones,
  cubreElDia,
} from '../../lib/ofertas'
import Modal from './Modal/Modal'
import ToggleSwitch from './ToggleSwitch'
import OfertaForm from './OfertaForm'
import { OFERTA_VACIA, HOY, aFormulario, validar } from '../../lib/ofertaForm'
import styles from './AdminOfertas.module.css'

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ESTADOS = {
  activa:      { label: 'Activa',      clase: 'badgeVerde' },
  programada:  { label: 'Programada',  clase: 'badgeAzul' },
  caducada:    { label: 'Caducada',    clase: 'badgeGris' },
  agotada:     { label: 'Agotada',     clase: 'badgeAmbar' },
  desactivada: { label: 'Desactivada', clase: 'badgeGris' },
}

const FILTROS = [
  { id: 'todas',       label: 'Todas' },
  { id: 'activa',      label: 'Activas' },
  { id: 'programada',  label: 'Programadas' },
  { id: 'caducada',    label: 'Caducadas' },
  { id: 'desactivada', label: 'Desactivadas' },
]

/* Paleta de las ofertas en el calendario. No es el acento granate a
   propósito: en esta pantalla el acento es de las acciones, y las
   ofertas necesitan distinguirse unas de otras. Se reparten por orden. */
const COLORES = [
  { color: '#0D9488', bg: '#E1F5EE', border: '#99E2CC' },
  { color: '#4F46E5', bg: '#EEEDFE', border: '#C7C3F9' },
  { color: '#B45309', bg: '#FEF3C7', border: '#FCD34D' },
  { color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  { color: '#0369A1', bg: '#E0F2FE', border: '#BAE6FD' },
  { color: '#922B21', bg: '#FDF2F2', border: '#F5C6C6' },
]

function celdasDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1)
  const total = new Date(anio, mes + 1, 0).getDate()
  const desplazamiento = (primero.getDay() + 6) % 7
  const celdas = []
  for (let i = 0; i < desplazamiento; i++) celdas.push(null)
  for (let d = 1; d <= total; d++) celdas.push(d)
  while (celdas.length % 7 !== 0) celdas.push(null)
  return celdas
}

const fechaCorta = (iso) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

export default function AdminOfertas() {
  const {
    ofertas, salas, extras, contadores,
    cargando, error, guardando,
    recargar, guardar, alternarActiva, eliminar,
  } = useOfertas()

  const [filtro, setFiltro] = useState('todas')
  const [editando, setEditando] = useState(null)   // null | 'nueva' | id
  const [datos, setDatos] = useState(OFERTA_VACIA)
  const [errores, setErrores] = useState({})
  const [aBorrar, setABorrar] = useState(null)

  const hoy = HOY
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())

  const tabsRef = useRef(null)
  const indRef = useRef(null)

  /* ── Indicador de los filtros ─────────────────────────────────── */

  const colocarIndicador = useCallback(() => {
    const cont = tabsRef.current
    const ind = indRef.current
    if (!cont || !ind) return
    const botones = cont.querySelectorAll('[data-tab]')
    const idx = FILTROS.findIndex(f => f.id === filtro)
    const el = botones[idx]
    if (!el) return
    const cajaCont = cont.getBoundingClientRect()
    const cajaEl = el.getBoundingClientRect()
    ind.style.left = `${cajaEl.left - cajaCont.left + cont.scrollLeft}px`
    ind.style.width = `${cajaEl.width}px`
    ind.style.opacity = '1'
  }, [filtro])

  useLayoutEffect(() => { colocarIndicador() }, [colocarIndicador, contadores])

  useEffect(() => {
    window.addEventListener('resize', colocarIndicador)
    document.fonts?.ready.then(colocarIndicador)
    return () => window.removeEventListener('resize', colocarIndicador)
  }, [colocarIndicador])

  /* ── Datos derivados ──────────────────────────────────────────── */

  // El color va por posición en la lista completa, no en la filtrada:
  // así una oferta no cambia de color al cambiar de filtro.
  const colorDe = useMemo(() => {
    const mapa = {}
    ofertas.forEach((o, i) => { mapa[o.id] = COLORES[i % COLORES.length] })
    return mapa
  }, [ofertas])

  const visibles = useMemo(
    () => (filtro === 'todas' ? ofertas : ofertas.filter(o => estadoOferta(o) === filtro)),
    [ofertas, filtro]
  )

  const celdas = useMemo(() => celdasDelMes(anio, mes), [anio, mes])

  /* ── Acciones ─────────────────────────────────────────────────── */

  function abrirNueva() {
    setDatos({ ...OFERTA_VACIA })
    setErrores({})
    setEditando('nueva')
  }

  function abrirEdicion(oferta) {
    setDatos(aFormulario(oferta))
    setErrores({})
    setEditando(oferta.id)
  }

  /** Duplicar. Se le quita el código: dos ofertas no pueden compartirlo
   *  y guardar daría un error feo del índice único. */
  function duplicar(oferta) {
    setDatos({ ...aFormulario(oferta), name: `${oferta.name} (copia)`, code: '' })
    setErrores({})
    setEditando('nueva')
  }

  async function confirmarGuardar() {
    const fallos = validar(datos)
    setErrores(fallos)
    if (Object.keys(fallos).length > 0) return

    const ok = await guardar(datos, editando === 'nueva' ? null : editando)
    if (ok) setEditando(null)
  }

  async function confirmarBorrar() {
    const item = aBorrar
    setABorrar(null)
    await eliminar(item.id)
  }

  function irMes(delta) {
    const d = new Date(anio, mes + delta, 1)
    setAnio(d.getFullYear())
    setMes(d.getMonth())
  }

  if (cargando) {
    return (
      <div className={styles.cargando}>
        <div className={styles.puntos} aria-hidden="true"><span /><span /><span /></div>
        <p>Cargando ofertas…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ofertas</h1>
          <p className={styles.subtitle}>
            {contadores.activa} activa{contadores.activa === 1 ? '' : 's'} ·{' '}
            {contadores.programada} programada{contadores.programada === 1 ? '' : 's'} ·{' '}
            {contadores.todas} en total
          </p>
        </div>
        <button type="button" className={styles.btnPrimario} onClick={abrirNueva}>
          <IconPlus size={18} stroke={2} />
          Nueva oferta
        </button>
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

      <div className={styles.aviso}>
        <IconDiscount2 size={16} stroke={1.75} />
        <span>
          Solo se aplica una oferta por reserva: la que más rebaje al cliente. Si dos
          rebajan lo mismo, gana la de mayor prioridad.
        </span>
      </div>

      {/* ── Filtros ────────────────────────────────────────────────── */}
      <div className={styles.filtroTabs} ref={tabsRef}>
        <div ref={indRef} className={styles.filtroIndicator} aria-hidden="true" />
        {FILTROS.map(f => (
          <button
            key={f.id}
            type="button"
            data-tab
            className={`${styles.filtroTab} ${filtro === f.id ? styles.filtroActive : ''}`}
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
          >
            {f.label}
            <span className={styles.tabBadge}>
              {f.id === 'todas' ? contadores.todas : (contadores[f.id] || 0)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Lista ──────────────────────────────────────────────────── */}
      {visibles.length === 0 ? (
        <div className={styles.vacio}>
          <IconTag size={36} stroke={1.25} />
          <p>
            {ofertas.length === 0
              ? 'Todavía no hay ninguna oferta. Crea la primera con el botón de arriba.'
              : 'Ninguna oferta en este estado.'}
          </p>
        </div>
      ) : (
        <div className={styles.lista}>
          {visibles.map(o => {
            const estado = estadoOferta(o)
            const est = ESTADOS[estado]
            const c = colorDe[o.id]
            const condiciones = resumirCondiciones(o, { salas, extras })

            return (
              <article key={o.id} className={`${styles.card} ${!o.is_active ? styles.cardApagada : ''}`}>
                <div className={styles.cardIzq}>
                  <span className={styles.descuento} style={{ background: c.bg, color: c.color, borderColor: c.border }}>
                    {etiquetaDescuento(o)}
                  </span>
                </div>

                <div className={styles.cardCentro}>
                  <div className={styles.cardTop}>
                    <h2 className={styles.cardNombre}>{o.name}</h2>
                    <span className={`${styles.badge} ${styles[est.clase]}`}>{est.label}</span>
                    {o.code && (
                      <span className={styles.codigo}>
                        <IconTicket size={11} stroke={2} />
                        {o.code}
                      </span>
                    )}
                  </div>

                  {o.description && <p className={styles.cardDesc}>{o.description}</p>}

                  <p className={styles.cardFechas}>
                    {o.starts_on || o.ends_on
                      ? `${o.starts_on ? fechaCorta(o.starts_on) : 'Siempre'} → ${o.ends_on ? fechaCorta(o.ends_on) : 'sin fin'}`
                      : 'Sin límite de fechas'}
                    {o.max_uses != null && ` · ${o.uses || 0} de ${o.max_uses} usos`}
                    {o.max_uses == null && (o.uses || 0) > 0 && ` · ${o.uses} usos`}
                  </p>

                  {condiciones.length > 0 && (
                    <div className={styles.condiciones}>
                      {condiciones.map((t, i) => (
                        <span key={i} className={styles.condicion}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.cardAcciones}>
                  <ToggleSwitch
                    activo={o.is_active}
                    onCambio={() => alternarActiva(o)}
                    etiqueta={`Activar ${o.name}`}
                  />
                  <button type="button" className={styles.btnIcono} onClick={() => abrirEdicion(o)} title="Editar" aria-label={`Editar ${o.name}`}>
                    <IconPencil size={15} stroke={1.75} />
                  </button>
                  <button type="button" className={styles.btnIcono} onClick={() => duplicar(o)} title="Duplicar" aria-label={`Duplicar ${o.name}`}>
                    <IconCopy size={15} stroke={1.75} />
                  </button>
                  <button type="button" className={styles.btnIcono} onClick={() => setABorrar(o)} title="Eliminar" aria-label={`Eliminar ${o.name}`}>
                    <IconTrash size={15} stroke={1.75} />
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* ── Calendario de vigencia ─────────────────────────────────── */}
      <section className={styles.calendarioWrap}>
        <div className={styles.calHeader}>
          <div>
            <h2 className={styles.calTitulo}>
              {MESES[mes]} <span className={styles.calAnio}>{anio}</span>
            </h2>
            <span className={styles.calResumen}>Qué oferta cae cada día</span>
          </div>
          <div className={styles.calNav}>
            <button type="button" className={styles.calNavBtn} onClick={() => irMes(-1)} aria-label="Mes anterior">
              <IconChevronLeft size={17} stroke={2} />
            </button>
            <button
              type="button"
              className={styles.calHoyBtn}
              onClick={() => { setAnio(hoy.getFullYear()); setMes(hoy.getMonth()) }}
            >
              Hoy
            </button>
            <button type="button" className={styles.calNavBtn} onClick={() => irMes(1)} aria-label="Mes siguiente">
              <IconChevronRight size={17} stroke={2} />
            </button>
          </div>
        </div>

        <div className={styles.calGrid}>
          {DIAS_SEMANA.map(d => <div key={d} className={styles.calDayHeader}>{d}</div>)}

          {celdas.map((dia, i) => {
            const col = i % 7
            if (dia === null) return <div key={`h-${i}`} className={styles.calDayEmpty} />

            const fecha = new Date(anio, mes, dia)
            const activas = ofertas.filter(o => cubreElDia(o, fecha))
            const esHoy = fecha.toDateString() === hoy.toDateString()

            const clases = [
              styles.calDay,
              activas.length > 0 ? styles.calDayCon : '',
              col >= 5 ? styles.calDayFinde : '',
              esHoy ? styles.calDayHoy : '',
            ].filter(Boolean).join(' ')

            return (
              <div key={dia} className={clases}>
                <span className={styles.calDayNum}>{dia}</span>

                <div className={styles.calChips}>
                  {activas.slice(0, 3).map(o => {
                    const c = colorDe[o.id]
                    return (
                      <span
                        key={o.id}
                        className={styles.calChip}
                        style={{ background: c.bg, color: c.color, borderColor: c.border }}
                      >
                        {etiquetaDescuento(o)}
                      </span>
                    )
                  })}
                  {activas.length > 3 && (
                    <span className={styles.calChipMas}>+{activas.length - 3}</span>
                  )}
                </div>

                {/* Tarjeta al pasar el ratón: el chip solo cabe el importe,
                    así que el nombre entero de la oferta se lee aquí. */}
                {activas.length > 0 && (
                  <span className={`${styles.calTooltip} ${col >= 4 ? styles.calTooltipDer : ''}`}>
                    <span className={styles.tipFecha}>{dia} de {MESES[mes]}</span>
                    {activas.map(o => {
                      const c = colorDe[o.id]
                      return (
                        <span key={o.id} className={styles.tipFila}>
                          <span className={styles.tipDot} style={{ background: c.color }} />
                          <span className={styles.tipNombre}>{o.name}</span>
                          {o.code && <span className={styles.tipCodigo}>{o.code}</span>}
                          {!o.is_active && <span className={styles.tipApagada}>apagada</span>}
                          <span
                            className={styles.tipEtiqueta}
                            style={{ background: c.bg, color: c.color }}
                          >
                            {etiquetaDescuento(o)}
                          </span>
                        </span>
                      )
                    })}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        <p className={styles.calNota}>
          El calendario solo mira fechas y días de la semana. Las condiciones que
          dependen de la reserva —mínimo de días, asistentes, antelación o código—
          no se pueden saber mirando un día suelto.
        </p>
      </section>

      {/* ── Modal de alta y edición ────────────────────────────────── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => setEditando(null)}
        ancho={680}
        titulo={
          <>
            <IconTag size={20} stroke={1.75} />
            {editando === 'nueva' ? 'Nueva oferta' : 'Editar oferta'}
          </>
        }
        pie={
          <>
            <button type="button" className={styles.btnSecundario} onClick={() => setEditando(null)}>
              Cancelar
            </button>
            <button type="button" className={styles.btnPrimario} onClick={confirmarGuardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar oferta'}
            </button>
          </>
        }
      >
        <OfertaForm
          datos={datos}
          setDatos={setDatos}
          errores={errores}
          salas={salas}
          extras={extras}
        />
      </Modal>

      {/* ── Confirmación de borrado ────────────────────────────────── */}
      <Modal
        abierto={!!aBorrar}
        onCerrar={() => setABorrar(null)}
        variante="centrado"
        ancho={420}
        pie={
          <>
            <button type="button" className={styles.btnSecundario} onClick={() => setABorrar(null)}>
              Volver
            </button>
            <button type="button" className={styles.btnPeligro} onClick={confirmarBorrar}>
              Eliminar
            </button>
          </>
        }
      >
        {aBorrar && (
          <>
            <div className={styles.modalIcono}><IconTrash size={24} stroke={1.75} /></div>
            <h2 className={styles.modalTitulo}>Eliminar «{aBorrar.name}»</h2>
            <p className={styles.modalTexto}>
              Dejará de aplicarse en la web. Las reservas que ya la usaron conservan su
              descuento: el importe se guarda en cada reserva, no se recalcula.
            </p>
            <p className={styles.modalTexto}>
              Si solo quieres pararla un tiempo, mejor desactívala con el interruptor.
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}
