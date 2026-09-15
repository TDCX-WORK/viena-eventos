import { useAuth } from '../contexts/AuthContext'
import AdminLogin from './admin/AdminLogin'

/* ─────────────────────────────────────────────────────────────────────
   Fondo del login.

   ANTES AQUÍ SE MONTABA LA WEB PÚBLICA ENTERA. Se llamaba a
   useHotelData() —seis consultas: hotels, rooms con sus tres joins,
   extras, gallery_images, blocked_dates y occupied_slots— y se
   renderizaba RoomSelector, que a su vez pedía las preguntas frecuentes
   y pintaba el hero, las tres tarjetas con sus animaciones, el acordeón
   y el pie. Todo con pointerEvents en none, o sea de adorno.

   Siete consultas y el árbol completo de la portada para hacer de papel
   pintado detrás de un formulario de dos campos, cada vez que alguien
   entra al panel. Y /admin es una URL pública: cualquier bot que la
   rastree se llevaba las siete por delante.

   Ahora es CSS. Cero consultas, cero datos, el login aparece al
   instante.

   Los colores salen de la paleta de index.css. El degradado no es plano
   a propósito: un color sólido a pantalla completa se lee como "página
   sin terminar", mientras que dos tonos y un halo cálido descentrado
   parecen una decisión.
   ───────────────────────────────────────────────────────────────────── */

const FONDO = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: "'Inter', system-ui, sans-serif",
  color: '#3D3530',

  /* Dos capas: un halo dorado muy diluido arriba a la izquierda, y
     debajo el degradado de crema a beige. El halo va primero porque en
     background-image la primera capa es la de arriba. */
  backgroundImage: [
    'radial-gradient(ellipse 80% 60% at 25% 0%, rgba(160,120,72,0.10), transparent 60%)',
    'linear-gradient(160deg, #FAF8F5 0%, #F2EDE5 55%, #EAE3D8 100%)',
  ].join(', '),
  backgroundColor: '#F2EDE5',
}

function ContenidoProtegido({ children }) {
  const { user, loading } = useAuth()

  /* Mientras se comprueba si hay sesión guardada. Mismo fondo que la
     pantalla de login, para que al pasar de una a otra solo aparezca el
     modal en vez de cambiar la página entera. */
  if (loading) {
    return (
      <div style={FONDO}>
        <p style={{ fontSize: '0.95rem', fontWeight: 500, color: '#6b6560' }}>
          Verificando acceso...
        </p>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={FONDO}>
        {/* Marca discreta al fondo, para que quien llegue aquí por
            error sepa dónde está. El aria-hidden es porque no aporta
            nada a quien use lector de pantalla: el modal de login ya
            dice lo que es. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            opacity: 0.4,
          }}
        >
          <span style={{
            width: 28,
            height: 28,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 6,
            background: '#3D3530',
            color: '#FAF8F5',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}>SV</span>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#3D3530',
          }}>Suites Viena</span>
        </div>

        <AdminLogin />
      </div>
    )
  }

  return children
}

/* noindex en todo /admin, esté o no logueado.
   React 19 sube este <meta> al <head> solo y lo quita al salir de la
   ruta. Complementa la cabecera X-Robots-Tag de public/_headers: si una
   de las dos falla, la otra sigue funcionando. */
export default function ProtectedRoute({ children }) {
  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <ContenidoProtegido>{children}</ContenidoProtegido>
    </>
  )
}
