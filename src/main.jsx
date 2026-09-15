import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// Después de index.css a propósito: comparten :root y el panel necesita
// que sus tokens ganen. Se declara aquí y no dentro del admin porque el
// Modal se monta por portal en document.body, fuera del árbol del panel.
import './styles/admin.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
