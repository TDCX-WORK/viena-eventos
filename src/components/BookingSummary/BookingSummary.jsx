import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, CalendarDays, Users, LayoutGrid, Coffee, Tag, CalendarPlus } from 'lucide-react'
import { explicarDescuento } from '../../lib/ofertas'
import styles from './BookingSummary.module.css'

const JORNADA_LABELS = {
  manana:   'Mañana (9–14h)',
  tarde:    'Tarde (15–20h)',
  completo: 'Día completo (9–20h)',
}
const LAYOUT_LABELS = {
  teatro: 'Teatro', u: 'En U', escuela: 'Escuela', imperial: 'Imperial',
}

function formatPrice(n) {
  if (Number.isInteger(n)) return n.toLocaleString('es-ES')
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function BookingSummary({ booking, room, desglose, hotel }) {
  /* `desglose` viene de useBooking y siempre tiene la misma forma, haya
     oferta o no. El fallback es por si algún sitio monta el resumen sin
     pasarlo: mejor un total a cero que una pantalla en blanco. */
  const { base = 0, extras = 0, descuento = 0, oferta = null, total = 0 } = desglose || {}
  const sinDescuento = base + extras

  /* Sobre qué se ha calculado el descuento. El porcentaje se aplica al
     precio de sala, no al total con extras, y sin decirlo el cliente
     divide, le sale otro número y piensa que hay un error. Cuántos días
     entran en la oferta lo sabe el motor: viene en `desglose.dias`. */
  const explicacion = oferta
    ? explicarDescuento(oferta, { dias: (desglose?.dias || []).length })
    : ''
  const selectedExtras = (booking.extras || [])
    .map(id => hotel.extras.find(e => e.id === id))
    .filter(Boolean)

  const fechas = booking.fechas || []
  const hasFechas = fechas.length > 0

  /* Suplemento de fin de semana. Va desglosado porque si no, el cliente
     ve un total más alto del que esperaba y no sabe de dónde sale. Si el
     hotel no cobra suplemento, esto no aparece. */
  const suplemento = room.pricing?.weekendSupplement || 0
  const diasFinde = fechas.filter(f => {
    const d = f.date.getDay()
    return d === 0 || d === 6
  }).length
  const totalSuplemento = suplemento * diasFinde

  return (
    <aside className={styles.wrapper}>

      {/* Room header con imagen */}
      <div className={styles.roomCard}>
        <img src={room.images?.[0]} alt={room.name} className={styles.roomImage} />
        <div className={styles.roomOverlay} />
        <div className={styles.roomInfo}>
          <p className={styles.roomName}>{room.name}</p>
          <p className={styles.roomMeta}>
            {room.size} m² · hasta {Math.max(...room.layouts.map(l => l.max))} personas
          </p>
        </div>
      </div>

      {/* Filas de detalle */}
      <div className={styles.rows}>

        {/* Fechas */}
        <div className={styles.row}>
          <span className={styles.rowLabel}>
            <CalendarDays size={12} />
            {fechas.length > 1 ? `Fechas (${fechas.length})` : 'Fecha'}
          </span>
          {hasFechas ? (
            fechas.length === 1 ? (
              <span className={styles.rowValue}>
                {format(fechas[0].date, 'd MMM yyyy', { locale: es })}
              </span>
            ) : (
              <div className={styles.fechasSummary}>
                {fechas.slice(0, 3).map((f, i) => (
                  <span key={i} className={styles.fechaTag}>
                    {format(f.date, 'd MMM', { locale: es })}
                  </span>
                ))}
                {fechas.length > 3 && (
                  <span className={styles.fechaTagMore}>+{fechas.length - 3}</span>
                )}
              </div>
            )
          ) : (
            <span className={styles.empty}>Sin seleccionar</span>
          )}
        </div>

        {/* Detalle por fecha */}
        {hasFechas && fechas.map((f, i) => (
          <div key={i} className={styles.fechaDetail}>
            <span className={styles.fechaDetailDate}>
              {format(f.date, 'd MMM', { locale: es })}
            </span>
            <div className={styles.fechaDetailItems}>
              <span className={styles.fechaDetailItem}>
                <Clock size={10} />
                {JORNADA_LABELS[f.jornada] || '—'}
              </span>
              {f.layout && (
                <span className={styles.fechaDetailItem}>
                  <LayoutGrid size={10} />
                  {LAYOUT_LABELS[f.layout]}
                </span>
              )}
              {f.asistentes && (
                <span className={styles.fechaDetailItem}>
                  <Users size={10} />
                  {f.asistentes} pax
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Extras */}
        {selectedExtras.length > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}><Coffee size={12} /> Extras</span>
            <div className={styles.extrasList}>
              {selectedExtras.map(extra => (
                <span key={extra.id} className={styles.extraItem}>
                  <span className={styles.extraDot} />
                  {extra.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Total */}
      {sinDescuento > 0 && (
        <div className={styles.totalBlock}>
          {totalSuplemento > 0 && (
            <div className={styles.suplementoRow}>
              <span className={styles.suplementoLabel}>
                <CalendarPlus size={11} />
                Suplemento fin de semana
                {diasFinde > 1 && ` · ${diasFinde} días`}
              </span>
              <span className={styles.suplementoAmount}>
                +{formatPrice(totalSuplemento)}€
              </span>
            </div>
          )}

          {/* La oferta se enseña antes del precio: primero por qué baja,
              luego cuánto. Al revés parece un error de cálculo. */}
          {oferta && descuento > 0 && (
            <div className={styles.ofertaRow}>
              <div className={styles.ofertaCol}>
                <span className={styles.ofertaName}>
                  <Tag size={11} />
                  {oferta.name}
                </span>
                {explicacion && (
                  <span className={styles.ofertaBase}>{explicacion}</span>
                )}
              </div>
              <span className={styles.ofertaAmount}>−{formatPrice(descuento)}€</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>Total estimado</span>
            <div className={styles.totalPriceWrap}>
              {descuento > 0 && (
                <s className={styles.totalAntes}>{formatPrice(sinDescuento)}€</s>
              )}
              <div className={styles.totalPrice}>{formatPrice(total)}€</div>
            </div>
          </div>
          <div className={styles.totalSub}>
            {fechas.length > 1
              ? `${fechas.length} días · IVA incluido · sujeto a confirmación`
              : 'IVA incluido · sujeto a confirmación'}
          </div>
        </div>
      )}

      <div className={styles.nota}>
        Recibirás un email de confirmación con tu número de referencia.
      </div>
    </aside>
  )
}
