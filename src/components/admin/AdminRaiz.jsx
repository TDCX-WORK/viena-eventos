import { AuthProvider } from '../../contexts/AuthContext'
import ProtectedRoute from '../ProtectedRoute'
import AdminLayout from './AdminLayout'

/* ─────────────────────────────────────────────────────────────────────
   Todo lo que necesita /admin, en un solo fichero que se carga bajo
   demanda (lazy en App.jsx).

   Antes, AuthProvider envolvía la web ENTERA. Eso metía en el
   JavaScript de la portada el cliente de Supabase con su módulo de
   autenticación (~100 kB) y, además, cada visitante comprobaba al
   entrar si tenía sesión de administrador guardada, aunque solo la
   directora tiene una. Nada de eso le sirve a quien viene a mirar salas.

   Ahora la sesión solo existe dentro del panel. La web pública no usa
   useAuth en ningún sitio.

   El Footer precarga este fichero al pasar el ratón por la tuerca, así
   que al hacer clic suele estar ya descargado.
   ───────────────────────────────────────────────────────────────────── */
export default function AdminRaiz() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    </AuthProvider>
  )
}