import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import NoEncontrada from './components/NoEncontrada/NoEncontrada'

// Público
import Hero from './components/Hero/Hero'
import RoomSelector, { SalasCargando } from './components/RoomSelector/RoomSelector'
// Fichas de sala. Sin lazy: se prerenderizan y el HTML tiene que
// coincidir con el primer render del navegador.
import PaginaSala from './components/PaginaSala/PaginaSala'
import PaginaUso from './components/PaginaUso/PaginaUso'
// Aviso legal, privacidad, cookies y condiciones. Un solo componente
// para los cuatro: el texto vive en lib/legal.js.
import PaginaLegal from './components/PaginaLegal/PaginaLegal'
import { USOS } from './lib/usos'
import { LEGALES } from './lib/legal'
import { useHotelData } from './hooks/useHotelData'
import { useCabecera } from './hooks/useCabecera'
import { cabeceraPortada } from './lib/seo'
import { useOfertasPublicas } from './hooks/useOfertasPublicas'

/* El wizard de reserva también va aparte. Se lleva el calendario,
   date-fns y el cliente de EmailJS: unos 38 kB comprimidos que no hacen
   falta hasta que alguien elige una sala. La portada, que es la que
   mide Google, ya no los carga.

   Para que la separación no se note al hacer clic, se precarga en
   cuanto la página está lista: ver el efecto de más abajo. */
const BookingWizard = lazy(() => import('./components/BookingWizard/BookingWizard'))

/* ── Admin, bajo demanda ──────────────────────────────────────────────

   Estos imports son lazy a propósito, y es el cambio que más pesa de
   todo el proyecto.

   Antes estaban arriba con el resto. Como Vite mete en un solo fichero
   todo lo que se importa estáticamente, cualquiera que entrara a mirar
   precios se descargaba las ocho pantallas del panel, la librería de
   iconos que solo usa el admin y el calendario de disponibilidad, sin
   llegar a ver nada de eso nunca. Casi un mega de JavaScript para una
   página cuyo negocio entero es salir en Google y cargar rápido.

   Con lazy(), el bundle del panel se convierte en un fichero aparte que
   solo se descarga cuando alguien navega a /admin. Los visitantes
   normales, que son el 99 %, no lo tocan.

   El <Suspense> de más abajo es obligatorio: mientras el fichero baja,
   el componente no existe todavía y React necesita algo que pintar.
   ──────────────────────────────────────────────────────────────────── */
const AdminLayout         = lazy(() => import('./components/admin/AdminLayout'))
const AdminDashboard      = lazy(() => import('./components/admin/AdminDashboard'))
const AdminPrecios        = lazy(() => import('./components/admin/AdminPrecios'))
const AdminDisponibilidad = lazy(() => import('./components/admin/AdminDisponibilidad'))
const AdminReservas       = lazy(() => import('./components/admin/AdminReservas'))
const AdminFotos          = lazy(() => import('./components/admin/AdminFotos'))
const AdminConfig         = lazy(() => import('./components/admin/AdminConfig'))
const AdminOfertas        = lazy(() => import('./components/admin/AdminOfertas'))
const AdminFaq            = lazy(() => import('./components/admin/AdminFaq'))

/* Pantalla de espera mientras baja un trozo separado del bundle.
   Sobria a propósito: dura lo que tarde un fichero en llegar, y algo
   más vistoso solo conseguiría parpadear. */
function PantallaCarga({ texto, fondo = 'transparent' }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#78716c',
      fontSize: '0.9rem',
      background: fondo,
    }}>
      {texto}
    </div>
  )
}

function PublicApp() {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const { hotel, loading, error } = useHotelData()

  /* Las ofertas se piden UNA vez, aquí, y se reparten.

     Antes las pedía RoomSelector por su cuenta y BookingWizard por la
     suya. Como se muestra uno u otro, nunca coincidían, pero cada ida y
     vuelta entre salas y reserva disparaba una consulta nueva. Y peor:
     el código promocional que el cliente hubiera aplicado se perdía al
     volver atrás a cambiar de sala, porque el estado vivía dentro del
     wizard y se desmontaba con él.

     El hook va antes de los `return` de carga y error a propósito: las
     reglas de los hooks no permiten llamarlos después de una salida
     condicional. Mientras no haya hotel no consulta nada. */
  const ofertasApi = useOfertasPublicas(hotel?._dbId)

  // Título y metas de la portada al volver aquí desde una ficha de sala.
  useCabecera(cabeceraPortada(hotel))

  /* Precarga del wizard.
  
     Sin esto, separarlo tiene un coste visible: al pulsar una sala hay
     un parpadeo mientras baja el fichero. Aquí se pide en cuanto hay
     datos y la pestaña está ociosa, así que para cuando el cliente
     termina de leer las tarjetas ya está en caché y el clic es
     instantáneo.

     requestIdleCallback no existe en Safari, de ahí el respaldo con
     setTimeout. Si la precarga falla da igual: cuando haga falta de
     verdad, lazy() lo volverá a pedir. */
  useEffect(() => {
    if (loading || error) return

    const precargar = () => { import('./components/BookingWizard/BookingWizard') }

    const id = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback(precargar, { timeout: 3000 })
      : setTimeout(precargar, 1500)

    return () => {
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(id)
      else clearTimeout(id)
    }
  }, [loading, error])

  return (
    <main style={{ minHeight: '100vh' }}>
      {/* El hero NO espera a Supabase: se pinta con datos estáticos y se
          actualiza al llegar los reales. Va fuera del condicional de
          carga para que sea el mismo elemento antes y después (si se
          desmontara, la foto se volvería a pintar). */}
      {!selectedRoom && <Hero hotel={hotel} ofertas={ofertasApi.automaticas} />}

      {selectedRoom ? (
        <Suspense fallback={<PantallaCarga texto="Preparando tu reserva..." />}>
          <BookingWizard
            hotel={hotel}
            room={selectedRoom}
            onBack={() => setSelectedRoom(null)}
            ofertasApi={ofertasApi}
          />
        </Suspense>
      ) : loading ? (
        <SalasCargando />
      ) : error ? (
        <SalasCargando error />
      ) : (
        <RoomSelector
          hotel={hotel}
          onSelectRoom={setSelectedRoom}
          ofertas={ofertasApi.automaticas}
        />
      )}
    </main>
  )
}


/* Rutas sin router. El router lo pone quien monta la app:
   BrowserRouter en el navegador (main.jsx) y StaticRouter en el build
   (entry-server.jsx), que no tiene barra de direcciones. */
export function AppRutas() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<PublicApp />} />
        <Route path="/salas/:slug" element={<PaginaSala />} />
        {USOS.map(u => (
          <Route key={u.slug} path={u.ruta} element={<PaginaUso />} />
        ))}
        {LEGALES.map(d => (
          <Route key={d.slug} path={d.ruta} element={<PaginaLegal />} />
        ))}

        {/* Rutas admin protegidas — login aparece como modal.

            El Suspense envuelve al layout, no a cada pantalla: como es
            antepasado de todas, también cubre las de dentro cuando se
            navega entre secciones del panel. Una sola pantalla de
            carga en lugar de nueve. */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PantallaCarga texto="Cargando panel..." fondo="#f1f0f0" />}>
                <AdminLayout />
              </Suspense>
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="precios" element={<AdminPrecios />} />
          <Route path="ofertas" element={<AdminOfertas />} />
          <Route path="faq" element={<AdminFaq />} />
          <Route path="disponibilidad" element={<AdminDisponibilidad />} />
          <Route path="reservas" element={<AdminReservas />} />
          <Route path="fotos" element={<AdminFotos />} />
          <Route path="config" element={<AdminConfig />} />
        </Route>

        {/* Cualquier otra ruta */}
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </AuthProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRutas />
    </BrowserRouter>
  )
}