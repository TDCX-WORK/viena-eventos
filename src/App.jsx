import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Público
import RoomSelector from './components/RoomSelector/RoomSelector'
import BookingWizard from './components/BookingWizard/BookingWizard'
import { useHotelData } from './hooks/useHotelData'

// Admin
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './components/admin/AdminDashboard'
import AdminPrecios from './components/admin/AdminPrecios'
import AdminDisponibilidad from './components/admin/AdminDisponibilidad'
import AdminReservas from './components/admin/AdminReservas'
import AdminFotos from './components/admin/AdminFotos'
import AdminConfig from './components/admin/AdminConfig'
import AdminOfertas from './components/admin/AdminOfertas'

function PublicApp() {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const { hotel, loading, error } = useHotelData()

  if (loading) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Playfair Display', Georgia, serif",
        color: '#3D3530',
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>Suites Viena</p>
          <p style={{ fontSize: '0.9rem', color: '#78716c', fontWeight: 400 }}>Cargando espacios...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', system-ui, sans-serif",
        color: '#3D3530',
        padding: '2rem',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>No se han podido cargar los datos</p>
          <p style={{ fontSize: '0.85rem', color: '#78716c' }}>Inténtalo de nuevo en unos segundos o contacta con el hotel.</p>
        </div>
      </main>
    )
  }

  return (
    <main style={{ minHeight: '100vh' }}>
      {!selectedRoom ? (
        <RoomSelector hotel={hotel} onSelectRoom={setSelectedRoom} />
      ) : (
        <BookingWizard hotel={hotel} room={selectedRoom} onBack={() => setSelectedRoom(null)} />
      )}
    </main>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<PublicApp />} />

          {/* Rutas admin protegidas — login aparece como modal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="precios" element={<AdminPrecios />} />
            <Route path="ofertas" element={<AdminOfertas />} />
            <Route path="disponibilidad" element={<AdminDisponibilidad />} />
            <Route path="reservas" element={<AdminReservas />} />
            <Route path="fotos" element={<AdminFotos />} />
            <Route path="config" element={<AdminConfig />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
