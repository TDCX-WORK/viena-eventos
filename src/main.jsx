import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
// Las tipografías van PRIMERO: declaran los @font-face que usan tanto
// la web pública como el panel. Se sirven desde /fonts, no desde
// Google (ver scripts/fuentes.js).
import './styles/fuentes.css'
import './index.css'
// Después de index.css a propósito: comparten :root y el panel necesita
// que sus tokens ganen. Se declara aquí y no dentro del admin porque el
// Modal se monta por portal en document.body, fuera del árbol del panel.
import './styles/admin.css'
import App from './App.jsx'
import { DatosInicialesContext, leerDatosIniciales } from './lib/datosIniciales'

const contenedor = document.getElementById('root')
const datos = leerDatosIniciales()

const app = (
  <StrictMode>
    <DatosInicialesContext.Provider value={datos}>
      <App />
    </DatosInicialesContext.Provider>
  </StrictMode>
)

/* Portada prerenderizada: el HTML ya está pintado y React solo le
   engancha los eventos (hidratar). Sin datos incrustados (npm run dev,
   /admin) no hay nada que aprovechar y se monta desde cero. */
if (datos && contenedor.hasChildNodes()) {
  hydrateRoot(contenedor, app)
} else {
  createRoot(contenedor).render(app)
}