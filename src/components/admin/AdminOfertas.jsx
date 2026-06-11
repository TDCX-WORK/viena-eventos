import { Tag, Percent, CalendarRange, Layers, Sparkles } from 'lucide-react'
import styles from './AdminOfertas.module.css'

const PLANNED_FEATURES = [
  { icon: CalendarRange, label: 'Descuentos por rango de fechas', desc: 'Ej: -10% en reservas de junio' },
  { icon: Layers,        label: 'Descuentos multi-día',          desc: 'Ej: 3+ días = -15% automático' },
  { icon: Tag,           label: 'Descuentos por sala',           desc: 'Ej: Sala Capellanes -20% este mes' },
  { icon: Percent,       label: 'Códigos promocionales',         desc: 'Ej: código VERANO2026 = -50€' },
]

export default function AdminOfertas() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ofertas y Descuentos</h1>
        <p className={styles.subtitle}>Gestiona promociones y descuentos para tus salas.</p>
      </div>

      <div className={styles.comingSoon}>
        <div className={styles.comingSoonIcon}>
          <Sparkles size={32} />
        </div>
        <h2 className={styles.comingSoonTitle}>Próximamente</h2>
        <p className={styles.comingSoonText}>
          Estamos preparando un sistema completo de ofertas y descuentos.
          Podrás crear promociones personalizadas que se aplicarán automáticamente en el proceso de reserva.
        </p>

        <div className={styles.featuresGrid}>
          {PLANNED_FEATURES.map(feat => {
            const Icon = feat.icon
            return (
              <div key={feat.label} className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Icon size={20} />
                </div>
                <div className={styles.featureInfo}>
                  <span className={styles.featureLabel}>{feat.label}</span>
                  <span className={styles.featureDesc}>{feat.desc}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
