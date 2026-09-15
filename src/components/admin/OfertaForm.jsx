import { useMemo, useState } from 'react'
import {
  IconPercentage,
  IconCoin,
  IconTag,
  IconCalendarMinus,
  IconChevronDown,
  IconAlertTriangle,
  IconInfoCircle,
} from '@tabler/icons-react'
import {
  TIPOS_DESCUENTO,
  DIAS_SEMANA,
  mejorOferta,
  aISO,
} from '../../lib/ofertas'
import { JORNADAS, HOY, alternar } from '../../lib/ofertaForm'
import ToggleSwitch from './ToggleSwitch'
import styles from './AdminOfertas.module.css'

/* Un icono por tipo de descuento. Tiene que cubrir TODOS los tipos de
   TIPOS_DESCUENTO: si falta uno, el botón se renderiza con un tipo
   `undefined` y React tumba la pantalla entera con un "Element type is
   invalid". Por eso abajo hay además un valor por defecto. */
const TIPO_ICON = {
  percent:   IconPercentage,
  fixed:     IconCoin,
  day_off:   IconCalendarMinus,
  day_price: IconTag,
}

export default function OfertaForm({ datos, setDatos, errores, salas, extras }) {
  const [avanzadas, setAvanzadas] = useState(false)

  const set = (campo, valor) => setDatos(prev => ({ ...prev, [campo]: valor }))

  /* Vista previa. Se simula una reserva concreta contra el motor real,
     el mismo que usará la web: así lo que se ve aquí es exactamente lo
     que va a pagar el cliente, no una aproximación escrita aparte.

     El precio del día sale de las TARIFAS REALES de la sala. Antes
     estaba clavado a 350 €, y con eso el ejemplo mentía en cuanto la
     sala costaba otra cosa: una oferta de "precio final 30 €/día" sobre
     una sala de 550 € se veía como −320 € cuando en la web iban a ser
     −520 €. También se tiene en cuenta el suplemento de fin de semana
     si el día simulado cae en sábado o domingo, igual que hace
     useBooking. */
  const previa = useMemo(() => {
    const sala = salas.find(s => !datos.room_slugs.length || datos.room_slugs.includes(s.slug)) || salas[0]
    if (!sala) return null

    const jornada = datos.jornadas[0] || 'completo'
    const tarifa = jornada === 'completo' ? (sala.fullDay || 0) : (sala.halfDay || 0)
    const supl = sala.weekendSupplement || 0
    const precioDeFecha = (f) => {
      const d = f.getDay()
      return tarifa + ((d === 0 || d === 6) ? supl : 0)
    }

    const dias = []
    const cuantos = Math.max(1, Number(datos.min_days) || 1)

    // Se buscan días que cumplan los filtros, empezando por la fecha de
    // inicio de la oferta o por dentro de un mes si no la tiene.
    const arranque = datos.starts_on
      ? new Date(datos.starts_on + 'T00:00:00')
      : new Date(HOY.getTime() + 30 * 86400000)

    const cursor = new Date(arranque)
    let intentos = 0
    while (dias.length < cuantos && intentos < 400) {
      const iso = aISO(cursor)
      const dow = ((cursor.getDay() + 6) % 7) + 1
      const okFecha = (!datos.ends_on || iso <= datos.ends_on)
      const okDia = !datos.weekdays.length || datos.weekdays.includes(dow)
      if (okFecha && okDia) {
        dias.push({
          fecha: new Date(cursor),
          jornada,
          precio: precioDeFecha(cursor),
        })
      }
      cursor.setDate(cursor.getDate() + 1)
      intentos++
    }

    if (dias.length === 0) return null

    const baseTotal = dias.reduce((t, d) => t + d.precio, 0)

    /* Extras del ejemplo.
       Antes se simulaba siempre sin extras, así que una oferta que
       regalaba un coffee break enseñaba el mismo número que una que no
       regalaba nada. Se simulan los que la oferta regala, que son los
       únicos que cambian la cifra. */
    const pax = Number(datos.min_attendees) || 20
    const idsSimulados = [...(datos.free_extra_ids || [])]

    const extrasTotal = idsSimulados.reduce((t, id) => {
      const e = extras.find(x => x.id === id)
      if (!e) return t
      return t + (e.pricePerPerson || 0) * Math.max(pax, e.minPersons || 1)
    }, 0)

    const oferta = {
      ...datos,
      id: 'previa',
      discount_value: Number(datos.discount_value) || 0,
      min_days: Number(datos.min_days) || 1,
      min_attendees: datos.min_attendees ? Number(datos.min_attendees) : null,
      min_amount: datos.min_amount ? Number(datos.min_amount) : null,
      min_lead_days: datos.min_lead_days ? Number(datos.min_lead_days) : null,
      max_lead_days: datos.max_lead_days ? Number(datos.max_lead_days) : null,
      max_uses: null,
      uses: 0,
      code: datos.code || null,
    }

    const r = mejorOferta([oferta], {
      roomSlug: sala.slug,
      dias,
      extrasIds: idsSimulados,
      hotelExtras: extras,
      asistentes: pax,
      baseTotal,
      extrasTotal,
      // Se pasa el propio código para que las ofertas con código se
      // puedan previsualizar igual; si no, siempre dirían "necesita su
      // código" y no se vería nada.
      codigo: datos.code || null,
      hoy: HOY,
    })

    const fallo = r.candidatas?.[0]

    /* Aviso de "esto regala la sala". Un descuento del 90 % casi nunca
       es lo que se quería: lo normal es haber elegido "Precio final por
       día" pensando que era una rebaja. Se avisa, no se bloquea: puede
       ser una promoción real. */
    const subtotal = baseTotal + extrasTotal
    const porcentaje = baseTotal > 0 ? (r.descuento / baseTotal) * 100 : 0

    return {
      sala,
      dias,
      jornada,
      baseTotal,
      extrasTotal,
      subtotal,
      descuento: r.descuento,
      porcentaje,
      exagerado: !!r.oferta && porcentaje >= 60,
      motivo: r.oferta ? null : (fallo?.motivo || 'No se puede aplicar con estas condiciones'),
    }
  }, [datos, salas, extras])

  return (
    <div className={styles.form}>

      {/* ── Lo básico ─────────────────────────────────────────────── */}
      <div className={styles.campo}>
        <label className={styles.campoLabel} htmlFor="of-nombre">
          Nombre <span className={styles.req}>*</span>
        </label>
        <input
          id="of-nombre"
          type="text"
          className={`${styles.input} ${errores.name ? styles.inputMal : ''}`}
          placeholder="Descuento de agosto"
          value={datos.name}
          onChange={e => set('name', e.target.value)}
        />
        {errores.name && <span className={styles.errorCampo}>{errores.name}</span>}
      </div>

      <div className={styles.campo}>
        <label className={styles.campoLabel} htmlFor="of-desc">
          Descripción
          <em className={styles.campoNota}>La verá el cliente en la web</em>
        </label>
        <input
          id="of-desc"
          type="text"
          className={styles.input}
          placeholder="20 % de descuento en todas las salas durante agosto"
          value={datos.description}
          onChange={e => set('description', e.target.value)}
        />
      </div>

      {/* ── Descuento ─────────────────────────────────────────────── */}
      <div className={styles.campo}>
        <span className={styles.campoLabel}>Tipo de descuento</span>
        <div className={styles.tipos}>
          {Object.values(TIPOS_DESCUENTO).map(t => {
            const Icono = TIPO_ICON[t.id] || IconTag
            return (
              <button
                key={t.id}
                type="button"
                className={`${styles.tipo} ${datos.discount_type === t.id ? styles.tipoActivo : ''}`}
                onClick={() => set('discount_type', t.id)}
                aria-pressed={datos.discount_type === t.id}
              >
                <Icono size={17} stroke={1.75} />
                {t.label}
              </button>
            )
          })}
        </div>
        <p className={styles.ayuda}>
          <IconInfoCircle size={13} stroke={1.75} />
          {TIPOS_DESCUENTO[datos.discount_type]?.ayuda}
        </p>
      </div>

      <div className={styles.campo}>
        <label className={styles.campoLabel} htmlFor="of-valor">
          Cantidad <span className={styles.req}>*</span>
        </label>
        <div className={styles.conSufijo}>
          <input
            id="of-valor"
            type="number"
            min="0"
            step="any"
            className={`${styles.input} ${errores.discount_value ? styles.inputMal : ''}`}
            value={datos.discount_value}
            onChange={e => set('discount_value', e.target.value)}
          />
          <span className={styles.sufijo}>{TIPOS_DESCUENTO[datos.discount_type]?.sufijo}</span>
        </div>
        {errores.discount_value && <span className={styles.errorCampo}>{errores.discount_value}</span>}
      </div>


      {/* ── Vigencia ──────────────────────────────────────────────── */}
      <div className={styles.rejilla2}>
        <div className={styles.campo}>
          <label className={styles.campoLabel} htmlFor="of-desde">
            Desde
            <em className={styles.campoNota}>Vacío = sin límite</em>
          </label>
          <input
            id="of-desde"
            type="date"
            className={styles.input}
            value={datos.starts_on}
            onChange={e => set('starts_on', e.target.value)}
          />
        </div>
        <div className={styles.campo}>
          <label className={styles.campoLabel} htmlFor="of-hasta">Hasta</label>
          <input
            id="of-hasta"
            type="date"
            className={`${styles.input} ${errores.ends_on ? styles.inputMal : ''}`}
            value={datos.ends_on}
            onChange={e => set('ends_on', e.target.value)}
          />
          {errores.ends_on && <span className={styles.errorCampo}>{errores.ends_on}</span>}
        </div>
      </div>

      {/* ── Alcance ───────────────────────────────────────────────── */}
      <div className={styles.campo}>
        <span className={styles.campoLabel}>
          Salas
          <em className={styles.campoNota}>Ninguna marcada = todas</em>
        </span>
        <div className={styles.chips}>
          {salas.map(s => (
            <button
              key={s.id}
              type="button"
              className={`${styles.chipBtn} ${datos.room_slugs.includes(s.slug) ? styles.chipActivo : ''}`}
              onClick={() => set('room_slugs', alternar(datos.room_slugs, s.slug))}
              aria-pressed={datos.room_slugs.includes(s.slug)}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.campo}>
        <span className={styles.campoLabel}>
          Jornadas
          <em className={styles.campoNota}>Ninguna marcada = todas</em>
        </span>
        <div className={styles.chips}>
          {JORNADAS.map(j => (
            <button
              key={j.id}
              type="button"
              className={`${styles.chipBtn} ${datos.jornadas.includes(j.id) ? styles.chipActivo : ''}`}
              onClick={() => set('jornadas', alternar(datos.jornadas, j.id))}
              aria-pressed={datos.jornadas.includes(j.id)}
            >
              {j.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.campo}>
        <span className={styles.campoLabel}>
          Días de la semana
          <em className={styles.campoNota}>Ninguno marcado = todos</em>
        </span>
        <div className={styles.semana}>
          {DIAS_SEMANA.map(d => (
            <button
              key={d.id}
              type="button"
              className={`${styles.dia} ${datos.weekdays.includes(d.id) ? styles.diaActivo : ''}`}
              onClick={() => set('weekdays', alternar(datos.weekdays, d.id))}
              aria-pressed={datos.weekdays.includes(d.id)}
              aria-label={d.label}
              title={d.label}
            >
              {d.corto}
            </button>
          ))}
        </div>
      </div>

      {/* ── Código ────────────────────────────────────────────────── */}
      <div className={styles.campo}>
        <label className={styles.campoLabel} htmlFor="of-codigo">
          Código promocional
          <em className={styles.campoNota}>Vacío = se aplica sola, sin que el cliente haga nada</em>
        </label>
        <input
          id="of-codigo"
          type="text"
          className={`${styles.input} ${styles.inputCodigo}`}
          placeholder="VIENA25"
          value={datos.code}
          onChange={e => set('code', e.target.value.toUpperCase())}
        />
      </div>

      {/* ── Condiciones avanzadas ─────────────────────────────────── */}
      <button
        type="button"
        className={styles.plegable}
        onClick={() => setAvanzadas(v => !v)}
        aria-expanded={avanzadas}
      >
        Condiciones avanzadas
        <IconChevronDown
          size={16}
          stroke={2}
          className={`${styles.plegableChevron} ${avanzadas ? styles.plegableAbierto : ''}`}
        />
      </button>

      {avanzadas && (
        <div className={styles.avanzadas}>
          <div className={styles.rejilla2}>
            <div className={styles.campo}>
              <label className={styles.campoLabel} htmlFor="of-mindias">Mínimo de días</label>
              <input id="of-mindias" type="number" min="1" className={styles.input}
                value={datos.min_days} onChange={e => set('min_days', e.target.value)} />
            </div>
            <div className={styles.campo}>
              <label className={styles.campoLabel} htmlFor="of-minpax">Mínimo de asistentes</label>
              <input id="of-minpax" type="number" min="0" className={styles.input} placeholder="Sin mínimo"
                value={datos.min_attendees} onChange={e => set('min_attendees', e.target.value)} />
            </div>
          </div>

          <div className={styles.rejilla2}>
            <div className={styles.campo}>
              <label className={styles.campoLabel} htmlFor="of-minimp">Mínimo de sala (€)</label>
              <input id="of-minimp" type="number" min="0" className={styles.input} placeholder="Sin mínimo"
                value={datos.min_amount} onChange={e => set('min_amount', e.target.value)} />
              <p className={styles.campoNota}>
                Se mide sobre el alquiler de sala de toda la reserva. El catering
                no cuenta: lo factura otra empresa.
              </p>
            </div>
            <div className={styles.campo}>
              <label className={styles.campoLabel} htmlFor="of-usos">Máximo de usos</label>
              <input id="of-usos" type="number" min="1" className={styles.input} placeholder="Sin límite"
                value={datos.max_uses} onChange={e => set('max_uses', e.target.value)} />
            </div>
          </div>

          <div className={styles.rejilla2}>
            <div className={styles.campo}>
              <label className={styles.campoLabel} htmlFor="of-anticip">
                Antelación mínima
                <em className={styles.campoNota}>Reserva anticipada</em>
              </label>
              <input id="of-anticip" type="number" min="0" className={styles.input} placeholder="Días"
                value={datos.min_lead_days} onChange={e => set('min_lead_days', e.target.value)} />
            </div>
            <div className={styles.campo}>
              <label className={styles.campoLabel} htmlFor="of-ultima">
                Antelación máxima
                <em className={styles.campoNota}>Última hora</em>
              </label>
              <input id="of-ultima" type="number" min="0"
                className={`${styles.input} ${errores.max_lead_days ? styles.inputMal : ''}`}
                placeholder="Días"
                value={datos.max_lead_days} onChange={e => set('max_lead_days', e.target.value)} />
              {errores.max_lead_days && <span className={styles.errorCampo}>{errores.max_lead_days}</span>}
            </div>
          </div>

          {extras.length > 0 && (
            <div className={styles.campo}>
              <span className={styles.campoLabel}>
                Extras incluidos
                <em className={styles.campoNota}>Se regalan si el cliente los elige</em>
              </span>
              <div className={styles.chips}>
                {extras.map(e => (
                  <button
                    key={e.id}
                    type="button"
                    className={`${styles.chipBtn} ${datos.free_extra_ids.includes(e.id) ? styles.chipActivo : ''}`}
                    onClick={() => set('free_extra_ids', alternar(datos.free_extra_ids, e.id))}
                    aria-pressed={datos.free_extra_ids.includes(e.id)}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.campo}>
            <label className={styles.campoLabel} htmlFor="of-prio">
              Prioridad
              <em className={styles.campoNota}>Solo desempata cuando dos ofertas rebajan lo mismo</em>
            </label>
            <input id="of-prio" type="number" className={styles.input}
              value={datos.priority} onChange={e => set('priority', e.target.value)} />
          </div>
        </div>
      )}

      {/* ── Activa ────────────────────────────────────────────────── */}
      <div className={styles.filaToggle}>
        <div>
          <span className={styles.campoLabel}>Oferta activa</span>
          <p className={styles.campoNota}>Si la apagas, deja de aplicarse en la web al momento</p>
        </div>
        <ToggleSwitch
          activo={datos.is_active}
          onCambio={v => set('is_active', v)}
          etiqueta="Oferta activa"
        />
      </div>

      {/* ── Vista previa ──────────────────────────────────────────── */}
      <div className={styles.previa}>
        <span className={styles.previaTitulo}>Ejemplo</span>
        {!previa ? (
          <p className={styles.previaMotivo}>
            <IconAlertTriangle size={14} stroke={1.75} />
            No hay ninguna fecha que cumpla estas condiciones.
          </p>
        ) : previa.motivo ? (
          <p className={styles.previaMotivo}>
            <IconAlertTriangle size={14} stroke={1.75} />
            {previa.motivo}
          </p>
        ) : (
          <>
            <p className={styles.previaTexto}>
              {previa.sala.name} · {previa.dias.length} día{previa.dias.length > 1 ? 's' : ''} a{' '}
              {(previa.baseTotal / previa.dias.length).toLocaleString('es-ES')} €
              {previa.dias.length > 1 ? '/día' : ''}
            </p>
            {previa.extrasTotal > 0 && (
              <p className={styles.previaTexto}>
                + {previa.extrasTotal.toLocaleString('es-ES')} € de extras
              </p>
            )}
            <p className={styles.previaCifras}>
              <s>{previa.subtotal.toLocaleString('es-ES')} €</s>
              <strong>{(previa.subtotal - previa.descuento).toLocaleString('es-ES')} €</strong>
              <span className={styles.previaAhorro}>
                −{previa.descuento.toLocaleString('es-ES')} €
              </span>
            </p>
            {previa.exagerado && (
              <p className={styles.previaMotivo}>
                <IconAlertTriangle size={14} stroke={1.75} />
                Esto rebaja un {Math.round(previa.porcentaje)} % de la sala. Si lo que
                querías era restar {datos.discount_value} € a cada día, el tipo es
                «{TIPOS_DESCUENTO.day_off.label}», no «{TIPOS_DESCUENTO.day_price.label}».
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
