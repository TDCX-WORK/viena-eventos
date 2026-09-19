import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  IconChevronLeft,
  IconChevronRight,
  IconSun,
  IconSunset,
  IconClock,
  IconPlus,
  IconTrash,
  IconX,
  IconAlertTriangle,
  IconRefresh,
  IconCalendarOff,
  IconChevronDown,
  IconArrowsJoin,
  IconLock,
  IconBookmark,
  IconLink,
  IconHourglass,
  IconFileSpreadsheet,
  IconFileTypePdf,
  IconLockOpen,
} from '@tabler/icons-react'
import useDisponibilidad, { TIPOS, aplanarOcupacion } from '../../hooks/useDisponibilidad'
import { partesDe, esCompuesta, colorSala } from '../../lib/constants'
import Modal from './Modal/Modal'
import styles from './AdminDisponibilidad.module.css'

/* Los puntos de la leyenda de TIPO no son de ninguna sala: gris neutro.
   Sin esto el cuadrado y el círculo relleno salían sin color. */
const LEYENDA_NEUTRA = { background: '#6B6B6B', borderColor: '#6B6B6B' }

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const JORNADAS = [
  { id: 'completo', corto: 'Completo', label: 'Día completo', sub: '9:00–20:00',  icon: IconClock },
  { id: 'manana',   corto: 'Mañana',   label: 'Mañana',       sub: '9:00–14:00',  icon: IconSun },
  { id: 'tarde',    corto: 'Tarde',    label: 'Tarde',        sub: '15:00–20:00', icon: IconSunset },
]

const JORNADA_LABEL = { completo: 'Día completo', manana: 'Mañana', tarde: 'Tarde' }
const JORNADA_ICON  = { completo: IconClock, manana: IconSun, tarde: IconSunset }

const TIPO_ICON = {
  [TIPOS.bloqueo]:   IconLock,
  [TIPOS.reserva]:   IconBookmark,
  [TIPOS.solicitud]: IconHourglass,
  [TIPOS.heredado]:  IconLink,
}

const TIPO_LABEL = {
  [TIPOS.bloqueo]:   'Bloqueo',
  [TIPOS.reserva]:   'Reserva',
  [TIPOS.solicitud]: 'Sin contestar',
  [TIPOS.heredado]:  'Por otra sala',
}

/* Filtro de la lista de ocupación. La cuenta de cada uno se calcula
   sobre el mes que se está mirando. */
const FILTROS_TIPO = [
  { id: 'todo',             label: 'Todo' },
  { id: TIPOS.bloqueo,      label: 'Bloqueos' },
  { id: TIPOS.heredado,     label: 'Por otra sala' },
  { id: TIPOS.reserva,      label: 'Reservas' },
]

/* Color por tipo para el resumen del día plegado. El color de sala se
   sigue usando dentro de la tabla; aquí el día mezcla varias salas, así
   que lo que tiene que leerse es el tipo. */
const COLOR_TIPO = {
  [TIPOS.bloqueo]:   { color: '#922B21', bg: '#FDF2F2' },
  [TIPOS.reserva]:   { color: '#166534', bg: '#F0FDF4' },
  [TIPOS.solicitud]: { color: '#92400E', bg: '#FEF3C7' },
  [TIPOS.heredado]:  { color: '#4F46E5', bg: '#EEEDFE' },
}

/* La forma del punto dice el tipo; el color dice la sala. Así se leen
   las dos cosas de un vistazo sin necesitar el tooltip. */
const TIPO_PUNTO = {
  [TIPOS.bloqueo]:   'calDotBloqueo',
  [TIPOS.reserva]:   'calDotReserva',
  [TIPOS.solicitud]: 'calDotSolicitud',
  [TIPOS.heredado]:  'calDotHeredado',
}

/** yyyy-mm-dd en hora local. No vale toISOString(): devuelve UTC y en
 *  España, de madrugada, adelanta o atrasa un día entero. */
function claveFecha(anio, mes, dia) {
  return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Las celdas del mes, con huecos delante y detrás para que la rejilla
 *  quede rectangular. Semana que empieza en lunes. */
function celdasDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1)
  const total = new Date(anio, mes + 1, 0).getDate()
  // getDay() da 0 para domingo; se rota para que el lunes sea 0.
  const desplazamiento = (primero.getDay() + 6) % 7

  const celdas = []
  for (let i = 0; i < desplazamiento; i++) celdas.push(null)
  for (let d = 1; d <= total; d++) celdas.push(d)
  while (celdas.length % 7 !== 0) celdas.push(null)
  return celdas
}

const hoyClave = () => {
  const d = new Date()
  return claveFecha(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function AdminDisponibilidad() {
  const {
    salas, ocupacion, cargando, error, guardando, borrando,
    recargar, bloquear, desbloquear, desbloquearVarios,
  } = useDisponibilidad()

  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth())
  const [salaSel, setSalaSel] = useState(null)
  // { 'yyyy-mm-dd': 'completo' } — cada día seleccionado lleva SU jornada.
  const [seleccion, setSeleccion] = useState({})
  const [jornadaPorDefecto, setJornadaPorDefecto] = useState('completo')
  const [motivo, setMotivo] = useState('')
  const [formAbierto, setFormAbierto] = useState(false)
  const [aQuitar, setAQuitar] = useState(null)
  const [desbloqueoAbierto, setDesbloqueoAbierto] = useState(false)
  // Salas que NO se van a desbloquear (por defecto se desbloquean todas).
  const [salasExcluidas, setSalasExcluidas] = useState({})
  const [exportando, setExportando] = useState(null)

  const tabsRef = useRef(null)
  const indRef = useRef(null)

  const salaActiva = salaSel ?? salas[0]?.id ?? null
  const sala = salas.find(s => s.id === salaActiva) || null

  /* ── Indicador deslizante de las píldoras de sala ─────────────────── */

  const colocarIndicador = useCallback(() => {
    const cont = tabsRef.current
    const ind = indRef.current
    if (!cont || !ind) return
    const botones = cont.querySelectorAll('[data-sala]')
    const idx = salas.findIndex(s => s.id === salaActiva)
    const el = botones[idx]
    if (!el) return
    const cajaCont = cont.getBoundingClientRect()
    const cajaEl = el.getBoundingClientRect()
    ind.style.left = `${cajaEl.left - cajaCont.left + cont.scrollLeft}px`
    ind.style.width = `${cajaEl.width}px`
    ind.style.opacity = '1'
  }, [salaActiva, salas])

  // Depende de formAbierto porque las píldoras viven DENTRO del modal:
  // hasta que no se abre, tabsRef.current es null y no hay nada que
  // medir. Sin esta dependencia el indicador no aparecería nunca.
  useLayoutEffect(() => { colocarIndicador() }, [colocarIndicador, formAbierto])

  useEffect(() => {
    window.addEventListener('resize', colocarIndicador)
    document.fonts?.ready.then(colocarIndicador)
    return () => window.removeEventListener('resize', colocarIndicador)
  }, [colocarIndicador])

  /* Ocupación del mes: filtro por tipo y qué días están desplegados.
     El mapa solo guarda las excepciones; por defecto se abre el día de
     hoy y el resto van cerrados. */
  const [tipoFiltro, setTipoFiltro] = useState('todo')
  const [abiertos, setAbiertos] = useState({})

  /* ── Datos ────────────────────────────────────────────────────────── */

  const todasLasFilas = useMemo(
    () => aplanarOcupacion(ocupacion, salas),
    [ocupacion, salas]
  )

  const prefijoMes = `${anio}-${String(mes + 1).padStart(2, '0')}`

  const filasDelMes = useMemo(
    () => todasLasFilas.filter(f => f.fecha.startsWith(prefijoMes)),
    [todasLasFilas, prefijoMes]
  )

  /* Por día: todo lo que ocupa ese día, en todas las salas. Es lo que
     pintan los puntos de cada celda y la tarjeta del hover. */
  const porDia = useMemo(() => {
    const mapa = {}
    filasDelMes.forEach(f => {
      if (!mapa[f.fecha]) mapa[f.fecha] = []
      mapa[f.fecha].push(f)
    })
    return mapa
  }, [filasDelMes])

  const conteoTipos = useMemo(() => {
    const c = { todo: filasDelMes.length }
    filasDelMes.forEach(f => { c[f.tipo] = (c[f.tipo] || 0) + 1 })
    return c
  }, [filasDelMes])

  /* Las filas del mes agrupadas por día. filasDelMes ya viene ordenada
     por fecha, sala y tipo, así que basta con repartirlas. */
  const diasOcupados = useMemo(() => {
    const visibles = tipoFiltro === 'todo'
      ? filasDelMes
      : filasDelMes.filter(f => f.tipo === tipoFiltro)

    const mapa = new Map()
    visibles.forEach(f => {
      if (!mapa.has(f.fecha)) mapa.set(f.fecha, [])
      mapa.get(f.fecha).push(f)
    })

    return [...mapa.entries()].map(([fecha, filas]) => {
      const porTipo = {}
      filas.forEach(f => { porTipo[f.tipo] = (porTipo[f.tipo] || 0) + 1 })
      const salasDelDia = [...new Set(filas.map(f => f.nombreSala))]
      return { fecha, filas, porTipo, salasDelDia }
    })
  }, [filasDelMes, tipoFiltro])

  const celdas = useMemo(() => celdasDelMes(anio, mes), [anio, mes])
  const clavesSeleccionadas = Object.keys(seleccion).sort()
  const hoyStr = hoyClave()

  const salasBloqueadasEsteMes = new Set(
    filasDelMes.filter(f => f.tipo !== TIPOS.reserva).map(f => f.slug)
  ).size

  /* ── Bloqueos dentro de la selección ──────────────────────────────
     Solo los bloqueos PROPIOS (los heredados se van solos al quitar el
     original). Se miran en todos los meses, no solo en el visible: la
     selección puede abarcar varios. Agrupados por sala para el modal
     de desbloqueo. */
  const bloqueosSeleccion = useMemo(() => {
    const elegidos = new Set(Object.keys(seleccion))
    const grupos = new Map()
    todasLasFilas.forEach(f => {
      if (f.tipo !== TIPOS.bloqueo || !elegidos.has(f.fecha)) return
      if (!grupos.has(f.slug)) grupos.set(f.slug, { slug: f.slug, nombre: f.nombreSala, filas: [] })
      grupos.get(f.slug).filas.push(f)
    })
    return [...grupos.values()]
  }, [todasLasFilas, seleccion])

  const diasConBloqueo = new Set(bloqueosSeleccion.flatMap(g => g.filas.map(f => f.fecha)))
  const hayBloqueosEnSeleccion = bloqueosSeleccion.length > 0
  const todosBloqueados =
    clavesSeleccionadas.length > 0 && clavesSeleccionadas.every(c => diasConBloqueo.has(c))

  const idsADesbloquear = bloqueosSeleccion
    .filter(g => !salasExcluidas[g.slug])
    .flatMap(g => g.filas.map(f => f.id))

  /* Para el botón de plegar/desplegar todo. Sin días no hay nada que
     plegar, así que cuenta como cerrado. */
  const todosAbiertos =
    diasOcupados.length > 0 &&
    diasOcupados.every(d => abiertos[d.fecha] ?? d.fecha === hoyStr)

  /* Qué arrastra el bloqueo, y si pisa alguna reserva confirmada. */
  const efecto = useMemo(() => {
    if (!sala || clavesSeleccionadas.length === 0) return null

    const arrastra = (esCompuesta(sala.slug)
      ? partesDe(sala.slug)
      : salas.filter(s => esCompuesta(s.slug) && partesDe(s.slug).includes(sala.slug)).map(s => s.slug)
    )
      .map(slug => salas.find(s => s.slug === slug))
      .filter(Boolean)

    const conReserva = []
    clavesSeleccionadas.forEach(fecha => {
      const j = seleccion[fecha]
      const items = ocupacion[sala.slug]?.[fecha] || []
      items.forEach(i => {
        if (i.tipo !== TIPOS.reserva) return
        if (i.jornada !== j && i.jornada !== 'completo' && j !== 'completo') return
        if (i.referencia) conReserva.push(i.referencia)
      })
    })

    return { arrastra, conReserva: [...new Set(conReserva)] }
  }, [sala, salas, seleccion, clavesSeleccionadas, ocupacion])

  /* ── Acciones ─────────────────────────────────────────────────────── */

  function irMes(delta) {
    const d = new Date(anio, mes + delta, 1)
    setAnio(d.getFullYear())
    setMes(d.getMonth())
  }

  function irHoy() {
    setAnio(hoy.getFullYear())
    setMes(hoy.getMonth())
  }

  function alternarDia(clave) {
    setSeleccion(prev => {
      const siguiente = { ...prev }
      if (siguiente[clave]) delete siguiente[clave]
      else siguiente[clave] = jornadaPorDefecto
      return siguiente
    })
  }

  function ponerJornada(clave, jornada) {
    setSeleccion(prev => ({ ...prev, [clave]: jornada }))
  }

  /** Cambia la jornada por defecto y, de paso, la de todo lo ya elegido.
   *  Es lo que se espera: si cambias arriba, cambia todo; si luego
   *  ajustas un día suelto, solo cambia ese. */
  function cambiarJornadaPorDefecto(j) {
    setJornadaPorDefecto(j)
    setSeleccion(prev => {
      const siguiente = {}
      Object.keys(prev).forEach(k => { siguiente[k] = j })
      return siguiente
    })
  }

  async function hacerBloqueo() {
    const entradas = clavesSeleccionadas.map(fecha => ({ fecha, jornada: seleccion[fecha] }))
    const ok = await bloquear([sala.id], entradas, motivo)
    if (ok) {
      setSeleccion({})
      setMotivo('')
      setFormAbierto(false)
    }
  }

  function abrirDesbloqueo() {
    setSalasExcluidas({})
    setDesbloqueoAbierto(true)
  }

  async function hacerDesbloqueo() {
    const ok = await desbloquearVarios(idsADesbloquear)
    if (ok) {
      setSeleccion({})
      setDesbloqueoAbierto(false)
    }
  }

  async function confirmarQuitar() {
    const item = aQuitar
    setAQuitar(null)
    await desbloquear(item.id)
  }

  async function exportar(formato) {
    setExportando(formato)
    try {
      // Carga bajo demanda. exceljs y jspdf suman más de un mega y solo
      // hacen falta cuando alguien pulsa el botón.
      const { exportarExcel, exportarPDF } = await import('./disponibilidadExport')
      const datos = {
        filas: filasDelMes,
        periodo: `${MESES[mes]} ${anio}`,
        salas,
      }
      if (formato === 'excel') await exportarExcel(datos)
      else exportarPDF(datos)
    } catch (err) {
      console.error('Error exportando:', err)
    } finally {
      setExportando(null)
    }
  }

  if (cargando) {
    return (
      <div className={styles.cargando}>
        <div className={styles.puntos} aria-hidden="true"><span /><span /><span /></div>
        <p>Cargando disponibilidad…</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Disponibilidad</h1>
          <p className={styles.subtitle}>
            Pulsa los días que quieras bloquear o desbloquear. Solo los bloqueos cierran fechas
            en la web; las reservas confirmadas se muestran como agenda y no bloquean nada.
          </p>
        </div>

        <div className={styles.accionesHeader}>
          <button
            type="button"
            className={styles.btnSecundario}
            onClick={() => exportar('excel')}
            disabled={exportando !== null}
          >
            <IconFileSpreadsheet size={18} stroke={1.75} />
            {exportando === 'excel' ? 'Generando…' : 'Excel'}
          </button>
          <button
            type="button"
            className={styles.btnSecundario}
            onClick={() => exportar('pdf')}
            disabled={exportando !== null}
          >
            <IconFileTypePdf size={18} stroke={1.75} />
            {exportando === 'pdf' ? 'Generando…' : 'PDF'}
          </button>
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

      {/* ── Calendario ──────────────────────────────────────────────── */}
      <div className={styles.calendarioWrap}>
        <div className={styles.calendarioHeader}>
          <div className={styles.calTituloWrap}>
            <h2 className={styles.calTitulo}>
              {MESES[mes]} <span className={styles.calAnio}>{anio}</span>
            </h2>
            <span className={styles.calResumen}>
              {salasBloqueadasEsteMes === 0
                ? 'Ninguna sala bloqueada este mes'
                : `${salasBloqueadasEsteMes} ${salasBloqueadasEsteMes === 1 ? 'sala con bloqueos' : 'salas con bloqueos'} este mes`}
            </span>
          </div>

          <div className={styles.calNav}>
            <button type="button" className={styles.calNavBtn} onClick={() => irMes(-1)} title="Mes anterior" aria-label="Mes anterior">
              <IconChevronLeft size={17} stroke={2} />
            </button>
            <button type="button" className={styles.calHoyBtn} onClick={irHoy}>Hoy</button>
            <button type="button" className={styles.calNavBtn} onClick={() => irMes(1)} title="Mes siguiente" aria-label="Mes siguiente">
              <IconChevronRight size={17} stroke={2} />
            </button>
          </div>
        </div>

        <div className={styles.calGrid}>
          {DIAS_SEMANA.map(d => (
            <div key={d} className={styles.calDayHeader}>{d}</div>
          ))}

          {celdas.map((dia, i) => {
            if (dia === null) return <div key={`hueco-${i}`} className={styles.calDayEmpty} />

            const clave = claveFecha(anio, mes, dia)
            const items = porDia[clave] || []
            const col = i % 7
            const esHoy = clave === hoyStr
            const esFinde = col >= 5
            const esPasado = clave < hoyStr
            const seleccionado = Boolean(seleccion[clave])

            /* Las referencias del día, una sola vez cada una. Hace falta
               deduplicar: una reserva de Viena aparece además como
               heredada en Viena + Capellanes, y sin esto se pintaría la
               misma referencia dos veces en la misma celda. Se ignoran
               los heredados justo por eso: la reserva original ya está
               en la lista del día. */
            const referencias = []
            const refsVistas = new Set()
            items.forEach(f => {
              if (f.tipo !== TIPOS.reserva && f.tipo !== TIPOS.solicitud) return
              if (!f.referencia || refsVistas.has(f.referencia)) return
              refsVistas.add(f.referencia)
              referencias.push({ ref: f.referencia, tipo: f.tipo })
            })

            const clases = [
              styles.calDay,
              esFinde ? styles.calDayFinde : '',
              esHoy ? styles.calDayHoy : '',
              esPasado ? styles.calDayPasado : '',
              items.length > 0 ? styles.calDayOcupado : '',
              seleccionado ? styles.calDaySel : '',
            ].filter(Boolean).join(' ')

            return (
              <button
                key={clave}
                type="button"
                className={clases}
                onClick={() => !esPasado && alternarDia(clave)}
                disabled={esPasado}
                aria-pressed={seleccionado}
                aria-label={`${dia} de ${MESES[mes]}${items.length ? `, ${items.length} ocupaciones` : ', libre'}`}
              >
                <span className={styles.calDayNum}>{dia}</span>

                {seleccionado && (
                  <span className={styles.calDayJornada}>
                    {JORNADAS.find(j => j.id === seleccion[clave])?.corto}
                  </span>
                )}

                {items.length > 0 && (
                  <>
                    <span className={styles.calDots}>
                      {items.slice(0, 6).map((f, k) => {
                        const c = colorSala(f.slug)
                        const hueco = f.tipo === TIPOS.heredado || f.tipo === TIPOS.solicitud
                        return (
                          <span
                            key={k}
                            className={`${styles.calDot} ${styles[TIPO_PUNTO[f.tipo]]}`}
                            style={hueco ? { borderColor: c.color } : { background: c.color }}
                          />
                        )
                      })}
                      {items.length > 6 && (
                        <span className={styles.calDotMas}>+{items.length - 6}</span>
                      )}
                    </span>

                    {referencias.length > 0 && (
                      <span className={styles.calRefs}>
                        {/* Dos como mucho: en 96px de alto no cabe una
                            tercera sin empujar la celda. El resto se lee
                            en el tooltip y en la lista de abajo. */}
                        {referencias.slice(0, 2).map(r => (
                          <span
                            key={r.ref}
                            className={`${styles.calRef} ${
                              r.tipo === TIPOS.reserva ? styles.calRefFirme : styles.calRefPendiente
                            }`}
                          >
                            {r.ref}
                          </span>
                        ))}
                        {referencias.length > 2 && (
                          <span className={styles.calRefMas}>+{referencias.length - 2}</span>
                        )}
                      </span>
                    )}

                    {/* Tarjeta al pasar el ratón. En las tres últimas
                        columnas se ancla a la derecha para no salirse. */}
                    <span className={`${styles.calTooltip} ${col >= 4 ? styles.calTooltipDer : ''}`}>
                      <span className={styles.tipFecha}>{dia} de {MESES[mes]}</span>
                      {items.map((f, k) => {
                        const c = colorSala(f.slug)
                        const IconoTipo = TIPO_ICON[f.tipo]
                        return (
                          <span key={k} className={styles.tipFila}>
                            <span className={styles.tipDot} style={{ background: c.color }} />
                            <span className={styles.tipSala}>{f.nombreSala}</span>
                            <span className={styles.tipJornada}>{JORNADA_LABEL[f.jornada]}</span>
                            <span className={styles.tipTipo} style={{ color: c.color, background: c.bg }}>
                              <IconoTipo size={10} stroke={2} />
                              {TIPO_LABEL[f.tipo]}
                            </span>
                          </span>
                        )
                      })}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Barra flotante sobre el calendario. Es pequeña a propósito:
            tapa media fila y deja seguir eligiendo días. El formulario
            entero va en un modal, que se abre desde aquí. */}
        {clavesSeleccionadas.length > 0 && (
          <div className={styles.flotante}>
            <span className={styles.flotanteCuenta}>
              {clavesSeleccionadas.length} día{clavesSeleccionadas.length > 1 ? 's' : ''}
            </span>
            {/* Si todos los días elegidos ya tienen algún bloqueo, lo
                principal es desbloquear; bloquear sigue disponible por si
                se quiere cerrar otra sala esos mismos días. */}
            {hayBloqueosEnSeleccion && (
              <button
                type="button"
                className={todosBloqueados ? styles.flotantePrimario : styles.flotanteSecundario}
                onClick={abrirDesbloqueo}
              >
                <IconLockOpen size={15} stroke={2} />
                Desbloquear
              </button>
            )}
            <button
              type="button"
              className={todosBloqueados ? styles.flotanteSecundario : styles.flotantePrimario}
              onClick={() => setFormAbierto(true)}
            >
              <IconLock size={15} stroke={2} />
              {todosBloqueados ? 'Bloquear otra sala' : 'Bloquear'}
            </button>
            <button
              type="button"
              className={styles.flotanteCerrar}
              onClick={() => setSeleccion({})}
              aria-label="Quitar la selección"
            >
              <IconX size={15} stroke={2} />
            </button>
          </div>
        )}

        <div className={styles.calLeyenda}>
          {salas.map(s => {
            const c = colorSala(s.slug)
            return (
              <span key={s.id} className={styles.leyendaItem}>
                <span className={styles.leyendaDot} style={{ background: c.color }} />
                {s.name}
                {esCompuesta(s.slug) && (
                  <em className={styles.leyendaNota}>= las {partesDe(s.slug).length} juntas</em>
                )}
              </span>
            )
          })}
          <span className={styles.leyendaSep} aria-hidden="true" />
          <span className={styles.leyendaItem}>
            <span className={`${styles.leyendaDot} ${styles.calDotBloqueo}`} style={LEYENDA_NEUTRA} />
            Bloqueo
          </span>
          <span className={styles.leyendaItem}>
            <span className={`${styles.leyendaDot} ${styles.calDotHeredado}`} style={LEYENDA_NEUTRA} />
            Bloqueada por otra sala
          </span>
          <span className={styles.leyendaItem}>
            <span className={`${styles.leyendaDot} ${styles.calDotReserva}`} style={LEYENDA_NEUTRA} />
            Reserva confirmada (no bloquea)
          </span>
        </div>
      </div>

      {/* ── Formulario de bloqueo, en modal ─────────────────────────
          Antes vivía debajo del calendario y obligaba a bajar la vista
          justo cuando querías seguir mirando los días. Ahora se abre
          encima, con la selección ya hecha. */}
      <Modal
        abierto={formAbierto}
        onCerrar={() => setFormAbierto(false)}
        ancho={620}
        titulo={
          <>
            <IconLock size={20} stroke={1.75} />
            Bloquear {clavesSeleccionadas.length} día{clavesSeleccionadas.length > 1 ? 's' : ''}
          </>
        }
        pie={
          <>
            {/* type="button" explícito: dentro de un contenedor de
                formulario, un button sin type es submit. */}
            <button type="button" className={styles.btnSecundario} onClick={() => setFormAbierto(false)}>
              Volver
            </button>
            <button
              type="button"
              className={styles.btnPrimario}
              onClick={hacerBloqueo}
              disabled={guardando}
            >
              <IconPlus size={16} stroke={2} />
              {guardando ? 'Guardando…' : `Bloquear en ${sala?.name || 'la sala'}`}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.campo}>
            <span className={styles.campoLabel}>Sala</span>
            <div className={styles.salaTabs} ref={tabsRef}>
              <div ref={indRef} className={styles.salaIndicator} aria-hidden="true" />
              {salas.map(s => (
                <button
                  key={s.id}
                  type="button"
                  data-sala
                  className={`${styles.salaTab} ${salaActiva === s.id ? styles.salaActive : ''}`}
                  onClick={() => setSalaSel(s.id)}
                  aria-pressed={salaActiva === s.id}
                >
                  {esCompuesta(s.slug) && <IconArrowsJoin size={14} stroke={1.75} />}
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.campo}>
            <span className={styles.campoLabel}>Jornada para todos</span>
            <div className={styles.jornadas}>
              {JORNADAS.map(j => {
                const Icono = j.icon
                return (
                  <button
                    key={j.id}
                    type="button"
                    className={`${styles.jornada} ${jornadaPorDefecto === j.id ? styles.jornadaActive : ''}`}
                    onClick={() => cambiarJornadaPorDefecto(j.id)}
                    aria-pressed={jornadaPorDefecto === j.id}
                  >
                    <Icono size={16} stroke={1.75} />
                    <span className={styles.jornadaLabel}>{j.label}</span>
                    <span className={styles.jornadaSub}>{j.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={styles.campo}>
            <span className={styles.campoLabel}>
              Días elegidos
              <em className={styles.campoNota}>Puedes cambiarle la jornada a cualquiera</em>
            </span>

            <ul className={styles.diasSel}>
              {clavesSeleccionadas.map(clave => {
                const [, m, d] = clave.split('-')
                const fecha = new Date(clave + 'T00:00:00')
                const nombreDia = DIAS_SEMANA[(fecha.getDay() + 6) % 7]

                return (
                  <li key={clave} className={styles.diaSel}>
                    <span className={styles.diaSelFecha}>
                      {nombreDia} {Number(d)} {MESES[Number(m) - 1].slice(0, 3).toLowerCase()}
                    </span>

                    <span className={styles.diaSelJornadas}>
                      {JORNADAS.map(j => {
                        const Icono = j.icon
                        return (
                          <button
                            key={j.id}
                            type="button"
                            className={`${styles.mini} ${seleccion[clave] === j.id ? styles.miniActive : ''}`}
                            onClick={() => ponerJornada(clave, j.id)}
                            aria-pressed={seleccion[clave] === j.id}
                            title={j.label}
                          >
                            <Icono size={13} stroke={1.75} />
                            {j.corto}
                          </button>
                        )
                      })}
                    </span>

                    <button
                      type="button"
                      className={styles.diaSelQuitar}
                      onClick={() => alternarDia(clave)}
                      aria-label={`Quitar el día ${Number(d)}`}
                    >
                      <IconX size={13} stroke={2} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className={styles.campo}>
            <label className={styles.campoLabel} htmlFor="motivo">Motivo</label>
            <input
              id="motivo"
              type="text"
              className={styles.input}
              placeholder="Opcional: festivo, mantenimiento, obra…"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          {efecto && (efecto.arrastra.length > 0 || efecto.conReserva.length > 0) && (
            <div className={styles.efecto}>
              {efecto.arrastra.length > 0 && (
                <p>
                  <IconLink size={14} stroke={1.75} />
                  <span>
                    También quedará bloqueada <b>{efecto.arrastra.map(s => s.name).join(' y ')}</b>,
                    porque comparten el mismo espacio.
                  </span>
                </p>
              )}
              {efecto.conReserva.length > 0 && (
                <p className={styles.efectoAviso}>
                  <IconAlertTriangle size={14} stroke={1.75} />
                  <span>
                    Alguno de esos huecos tiene una reserva confirmada
                    ({efecto.conReserva.join(', ')}). El bloqueo solo cierra la web: la
                    reserva sigue igual.
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Desbloqueo de la selección ──────────────────────────────── */}
      <Modal
        abierto={desbloqueoAbierto}
        onCerrar={() => setDesbloqueoAbierto(false)}
        ancho={560}
        titulo={
          <>
            <IconLockOpen size={20} stroke={1.75} />
            Desbloquear {clavesSeleccionadas.length} día{clavesSeleccionadas.length > 1 ? 's' : ''}
          </>
        }
        pie={
          <>
            <button type="button" className={styles.btnSecundario} onClick={() => setDesbloqueoAbierto(false)}>
              Volver
            </button>
            <button
              type="button"
              className={styles.btnPrimario}
              onClick={hacerDesbloqueo}
              disabled={guardando || idsADesbloquear.length === 0}
            >
              <IconLockOpen size={16} stroke={2} />
              {guardando
                ? 'Quitando…'
                : `Quitar ${idsADesbloquear.length} bloqueo${idsADesbloquear.length === 1 ? '' : 's'}`}
            </button>
          </>
        }
      >
        <div className={styles.form}>
          <div className={styles.campo}>
            <span className={styles.campoLabel}>
              Salas bloqueadas en esos días
              <em className={styles.campoNota}>Desmarca las que quieras dejar como están</em>
            </span>

            <ul className={styles.desbloqLista}>
              {bloqueosSeleccion.map(g => {
                const c = colorSala(g.slug)
                const marcada = !salasExcluidas[g.slug]
                return (
                  <li key={g.slug}>
                    <label className={`${styles.desbloqItem} ${marcada ? styles.desbloqItemActivo : ''}`}>
                      <input
                        type="checkbox"
                        className={styles.desbloqCheck}
                        checked={marcada}
                        onChange={() =>
                          setSalasExcluidas(prev => ({ ...prev, [g.slug]: marcada }))
                        }
                      />
                      <span className={styles.celdaDot} style={{ background: c.color }} />
                      <span className={styles.desbloqNombre}>{g.nombre}</span>
                      <span className={styles.desbloqDias}>
                        {g.filas.map(f => {
                          const [, m, d] = f.fecha.split('-')
                          return `${Number(d)} ${MESES[Number(m) - 1].slice(0, 3).toLowerCase()} (${JORNADA_LABEL[f.jornada].toLowerCase()})`
                        }).join(' · ')}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>

          {clavesSeleccionadas.some(c => !diasConBloqueo.has(c)) && (
            <div className={styles.efecto}>
              <p>
                <IconAlertTriangle size={14} stroke={1.75} />
                <span>Algunos de los días elegidos no tienen ningún bloqueo propio; esos no cambian.</span>
              </p>
            </div>
          )}

          <div className={styles.efecto}>
            <p>
              <IconLink size={14} stroke={1.75} />
              <span>
                Las salas que comparten espacio con estas también quedarán libres, salvo que
                tengan un bloqueo propio. Las fechas volverán a aparecer disponibles en la web.
              </span>
            </p>
          </div>
        </div>
      </Modal>

      {/* ── Ocupación del mes ─────────────────────────────────────────
          Agrupada por día y plegable: un mes cargado son muchas filas y
          en una lista plana no se encuentra nada. */}
      <section className={styles.lista}>
        <div className={styles.listaHeader}>
          <h2 className={styles.listaTitulo}>
            Ocupación de {MESES[mes].toLowerCase()}
            <span className={styles.listaCuenta}>
              {filasDelMes.length} hueco{filasDelMes.length === 1 ? '' : 's'} ·{' '}
              {diasOcupados.length} día{diasOcupados.length === 1 ? '' : 's'}
            </span>
          </h2>

          {filasDelMes.length > 0 && (
            <div className={styles.listaHerramientas}>
              <div className={styles.tipoFiltros}>
                {FILTROS_TIPO.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    className={`${styles.tipoFiltro} ${tipoFiltro === f.id ? styles.tipoFiltroActivo : ''}`}
                    onClick={() => setTipoFiltro(f.id)}
                    aria-pressed={tipoFiltro === f.id}
                  >
                    {f.label}
                    <span className={styles.tipoFiltroNum}>{conteoTipos[f.id] || 0}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                className={styles.plegarTodo}
                onClick={() => {
                  const abrir = !todosAbiertos
                  setAbiertos(Object.fromEntries(diasOcupados.map(d => [d.fecha, abrir])))
                }}
              >
                <IconChevronDown
                  size={15}
                  stroke={2}
                  className={`${styles.diaChevron} ${todosAbiertos ? styles.diaChevronAbierto : ''}`}
                />
                {todosAbiertos ? 'Plegar todo' : 'Desplegar todo'}
              </button>
            </div>
          )}
        </div>

        {diasOcupados.length === 0 ? (
          <div className={styles.vacio}>
            <IconCalendarOff size={36} stroke={1.25} />
            <p>
              {filasDelMes.length === 0
                ? 'Nada este mes. Ni bloqueos ni reservas confirmadas.'
                : 'Ningún hueco de ese tipo este mes.'}
            </p>
          </div>
        ) : (
          <div className={styles.dias}>
            {diasOcupados.map(d => {
              const fecha = new Date(d.fecha + 'T00:00:00')
              const esHoy = d.fecha === hoyStr
              const abierto = abiertos[d.fecha] ?? esHoy

              return (
                <div
                  key={d.fecha}
                  className={[
                    styles.diaGrupo,
                    abierto ? styles.diaGrupoAbierto : '',
                    esHoy ? styles.diaGrupoHoy : '',
                  ].filter(Boolean).join(' ')}
                >
                  <button
                    type="button"
                    className={styles.diaCabecera}
                    onClick={() => setAbiertos(prev => ({ ...prev, [d.fecha]: !abierto }))}
                    aria-expanded={abierto}
                  >
                    <span className={styles.diaFecha}>
                      <span className={styles.diaNum}>{fecha.getDate()}</span>
                      <span className={styles.diaDow}>
                        {DIAS_SEMANA[(fecha.getDay() + 6) % 7]}
                      </span>
                    </span>

                    <span className={styles.diaResumen}>
                      {esHoy && <span className={styles.diaHoyPill}>Hoy</span>}

                      {Object.entries(d.porTipo).map(([tipo, n]) => {
                        const IconoTipo = TIPO_ICON[tipo]
                        const col = COLOR_TIPO[tipo]
                        return (
                          <span
                            key={tipo}
                            className={styles.resumenPill}
                            style={{ color: col.color, background: col.bg }}
                          >
                            <IconoTipo size={11} stroke={2} />
                            {n} {TIPO_LABEL[tipo].toLowerCase()}{n > 1 ? 's' : ''}
                          </span>
                        )
                      })}

                      <span className={styles.resumenSalas}>
                        {d.salasDelDia.join(' · ')}
                      </span>
                    </span>

                    <IconChevronDown
                      size={17}
                      stroke={2}
                      className={`${styles.diaChevron} ${abierto ? styles.diaChevronAbierto : ''}`}
                    />
                  </button>

                  {abierto && (
                    <div className={styles.diaCuerpo}>
                      <div className={styles.tablaHead} aria-hidden="true">
                        <span>Sala</span>
                        <span>Jornada</span>
                        <span>Tipo</span>
                        <span>Detalle</span>
                        <span />
                      </div>

                      {d.filas.map((f, i) => {
                        const c = colorSala(f.slug)
                        const IconoTipo = TIPO_ICON[f.tipo]
                        const IconoJornada = JORNADA_ICON[f.jornada] || IconClock
                        const detalle =
                          f.tipo === TIPOS.bloqueo   ? (f.motivo || 'Sin motivo') :
                          f.tipo === TIPOS.heredado  ? `Viene de ${f.nombreOrigen}` :
                          `${f.referencia || ''}${f.cliente ? ` · ${f.cliente}` : ''}`.trim() || '—'

                        return (
                          <div
                            key={`${f.slug}-${f.jornada}-${f.tipo}-${i}`}
                            className={styles.tablaFila}
                          >
                            <span className={styles.celdaSala} style={{ color: c.color }}>
                              <span className={styles.celdaDot} style={{ background: c.color }} />
                              <span>{f.nombreSala}</span>
                            </span>

                            <span className={styles.celdaJornada}>
                              <IconoJornada size={14} stroke={1.75} />
                              {JORNADA_LABEL[f.jornada]}
                            </span>

                            <span
                              className={styles.celdaTipo}
                              style={{ color: c.color, background: c.bg }}
                            >
                              <IconoTipo size={11} stroke={2} />
                              {TIPO_LABEL[f.tipo]}
                            </span>

                            <span className={`${styles.celdaDetalle} ${detalle === '—' ? styles.celdaDetalleVacio : ''}`}>
                              {detalle}
                            </span>

                            {/* Solo los bloqueos manuales se quitan desde aquí. Una
                                reserva se gestiona en Reservas; lo heredado se va
                                solo al quitar el bloqueo de la sala de origen. */}
                            {f.tipo === TIPOS.bloqueo ? (
                              <button
                                type="button"
                                className={styles.btnIcono}
                                onClick={() => setAQuitar(f)}
                                disabled={borrando === f.id}
                                aria-label="Quitar el bloqueo"
                                title="Quitar el bloqueo"
                              >
                                <IconTrash size={14} stroke={1.75} />
                              </button>
                            ) : (
                              <span className={styles.celdaHueco} aria-hidden="true" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Confirmación ────────────────────────────────────────────── */}
      <Modal
        abierto={!!aQuitar}
        onCerrar={() => setAQuitar(null)}
        variante="centrado"
        ancho={420}
        pie={
          <>
            <button type="button" className={styles.btnSecundario} onClick={() => setAQuitar(null)}>
              Volver
            </button>
            <button type="button" className={styles.btnPeligro} onClick={confirmarQuitar}>
              Quitar el bloqueo
            </button>
          </>
        }
      >
        {aQuitar && (
          <>
            <div className={styles.modalIcono}>
              <IconTrash size={24} stroke={1.75} />
            </div>
            <h2 className={styles.modalTitulo}>Quitar el bloqueo</h2>
            <p className={styles.modalFecha}>
              {new Date(aQuitar.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
            <p className={styles.modalTexto}>
              {aQuitar.nombreSala} · {JORNADA_LABEL[aQuitar.jornada]}
              {aQuitar.motivo && ` · ${aQuitar.motivo}`}
            </p>
            <p className={styles.modalTexto}>
              La sala volverá a aparecer disponible en la web.
            </p>
          </>
        )}
      </Modal>
    </div>
  )
}