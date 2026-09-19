import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

/* ─────────────────────────────────────────────────────────────────────
   Sesión del panel.

   Estar logueado NO basta para entrar: la cuenta tiene que estar en la
   tabla `admins` de Supabase. Se comprueba con la función es_admin().

   Esto es solo la puerta visible. La protección de verdad está en las
   políticas RLS, que usan la misma función: aunque alguien se saltara
   esta comprobación desde la consola, la base de datos no le dejaría
   leer ni tocar nada.

   Si la comprobación falla por cualquier motivo (red, función que no
   existe), se trata como "no es admin". Nunca se deja pasar por error.
   ───────────────────────────────────────────────────────────────────── */

const AuthContext = createContext(null)

async function comprobarAdmin() {
  const { data, error } = await supabase.rpc('es_admin')
  if (error) {
    console.error('No se ha podido comprobar el acceso al panel:', error)
    return false
  }
  return data === true
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let vivo = true

    async function aplicarSesion(session) {
      const u = session?.user ?? null
      if (!u) {
        if (vivo) { setUser(null); setLoading(false) }
        return
      }
      const ok = await comprobarAdmin()
      if (!vivo) return
      if (!ok) {
        // Sesión de una cuenta sin permiso: se cierra.
        await supabase.auth.signOut()
        setUser(null)
      } else {
        setUser(u)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data: { session } }) => aplicarSesion(session))

    /* El callback de onAuthStateChange NO puede esperar a otra llamada
       de Supabase dentro (se bloquea el cliente). Por eso se lanza en el
       siguiente tick con setTimeout. */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return   // ya lo cubre getSession
        if (event === 'TOKEN_REFRESHED') return   // mismo usuario, ya comprobado
        setTimeout(() => aplicarSesion(session), 0)
      }
    )

    return () => {
      vivo = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error

    if (!(await comprobarAdmin())) {
      await supabase.auth.signOut()
      const err = new Error('Esta cuenta no tiene acceso al panel')
      err.code = 'SIN_PERMISO'
      throw err
    }
    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}