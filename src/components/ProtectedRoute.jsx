import { useAuth } from '../contexts/AuthContext'
import { useHotelData } from '../hooks/useHotelData'
import RoomSelector from './RoomSelector/RoomSelector'
import AdminLogin from './admin/AdminLogin'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const { hotel, loading: hotelLoading } = useHotelData()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#3D3530',
        background: '#f1f0f0',
      }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Verificando acceso...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {/* Fondo: la web pública con las cards de salas */}
        <main style={{ minHeight: '100vh', pointerEvents: 'none', userSelect: 'none' }}>
          {!hotelLoading && hotel ? (
            <RoomSelector hotel={hotel} onSelectRoom={() => {}} />
          ) : (
            <div style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Playfair Display', Georgia, serif",
              color: '#3D3530',
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700 }}>Suites Viena</p>
            </div>
          )}
        </main>
        {/* Modal de login por encima */}
        <AdminLogin />
      </>
    )
  }

  return children
}
