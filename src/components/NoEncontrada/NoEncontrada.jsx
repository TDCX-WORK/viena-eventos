import { Link } from 'react-router-dom'

/* 404 dentro de React.
   Solo se ve si se navega a una ruta inexistente sin recargar: las
   entradas directas ya las corta Cloudflare con public/404.html (con
   estado 404 de verdad). Lleva noindex por si acaso. */
export default function NoEncontrada() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#3D3530',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <meta name="robots" content="noindex" />
      <div>
        <p style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
          Página no encontrada
        </p>
        <p style={{ fontSize: '0.9rem', color: '#78716c', margin: '0 0 1.2rem' }}>
          La dirección no existe o ha cambiado.
        </p>
        <Link to="/" style={{ color: '#A07848' }}>Ver las salas de reuniones</Link>
      </div>
    </main>
  )
}