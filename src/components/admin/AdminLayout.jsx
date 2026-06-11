import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  LayoutDashboard, Euro, CalendarOff, BookOpen,
  ImageIcon, Settings, LogOut, Menu, X, Tag
} from 'lucide-react'
import { useState } from 'react'
import styles from './AdminLayout.module.css'

const NAV_ITEMS = [
  { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',       end: true },
  { to: '/admin/precios',      icon: Euro,            label: 'Precios' },
  { to: '/admin/ofertas',      icon: Tag,             label: 'Ofertas' },
  { to: '/admin/disponibilidad', icon: CalendarOff,   label: 'Disponibilidad' },
  { to: '/admin/reservas',     icon: BookOpen,        label: 'Reservas' },
  { to: '/admin/fotos',        icon: ImageIcon,       label: 'Fotos' },
  { to: '/admin/config',       icon: Settings,        label: 'Configuración' },
]

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <div>
            <h2 className={styles.brand}>Suites Viena</h2>
            <p className={styles.brandSub}>Panel de dirección</p>
          </div>
          <button className={styles.closeMobile} onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.email?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className={styles.userMeta}>
              <span className={styles.userEmail}>{user?.email}</span>
              <span className={styles.userRole}>Administrador</span>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className={styles.main}>
        <header className={styles.topBar}>
          <button className={styles.menuBtn} onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <a href="/" className={styles.viewSite} target="_blank" rel="noopener noreferrer">
            Ver web pública ↗
          </a>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
