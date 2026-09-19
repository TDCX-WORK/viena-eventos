import { Compass, MapPin, Navigation, Phone, Mail, MessageCircle, Landmark, ArrowUpRight } from 'lucide-react'
import mapaUrl from '../../assets/mapa/entorno.svg?url'
import puntos from '../../assets/mapa/puntos.json'
import { HOTEL_ESTATICO } from '../../lib/hotelEstatico'
import styles from './Contacto.module.css'

/* ─────────────────────────────────────────────────────────────────────
   CONTACTO Y CÓMO LLEGAR

   El mapa es un SVG de calles reales (OpenStreetMap), en grises y sin
   fondo, generado con `npm run mapa`. Encima van las etiquetas, en
   HTML, colocadas con las coordenadas de puntos.json.

   CÓMO SE ALINEAN. El dibujo y las etiquetas viven dentro de un mismo
   "escenario" con la proporción del SVG (3:2) y centrado en el hotel.
   El panel es más apaisado, así que el escenario se recorta arriba y
   abajo, pero como las etiquetas se colocan en % del escenario, nunca
   se desalinean. El hotel queda siempre en el centro.

   Sin Google Maps incrustado a propósito: pesa, no se puede estilizar
   así y pone cookies de terceros. El botón abre Google Maps aparte.

   Todo es estático: el mismo HTML en el prerender y en el navegador.
   ───────────────────────────────────────────────────────────────────── */

const { ancho: VB_W, alto: VB_H } = puntos.viewBox
const PX_POR_M = VB_W / puntos.cobertura.anchoMetros

/* Líneas de metro. OSM no las trae en estos nodos. Si se abre una
   estación nueva o cambia algo, se toca aquí. */
const LINEAS = {
  'Ventura Rodríguez': ['3'],
  'Plaza de España': ['3', '10'],
  'Príncipe Pío': ['6', '10', 'R'],
  'Noviciado': ['2'],
  'Argüelles': ['3', '4', '6'],
}

/* Qué se rotula en el mapa y hacia qué lado va el texto para no
   pisarse. El resto de estaciones cercanas sale solo en la lista.
   `ancho: true` la enseña solo en pantallas anchas (en el móvil caería
   fuera del recorte). Príncipe Pío, Argüelles y Noviciado no se
   rotulan: quedan en el borde, medio borrados por el degradado. Salen
   en la lista. */
const EN_MAPA = {
  'Ventura Rodríguez': { lado: 'izq' },
  'Plaza de España':   { lado: 'izq' },
}

// La lista de "a pie": las que tienen sentido andando.
const MAX_MIN_LISTA = 11

const metros = puntos.metros
const debod = puntos.referencias.find(r => r.id === 'debod')

const etiquetasMapa = [
  ...metros
    .filter(m => EN_MAPA[m.nombre] && m.dentro)
    .map(m => ({ ...m, ...EN_MAPA[m.nombre], lineas: LINEAS[m.nombre] || [] })),
  ...(debod?.dentro ? [{ ...debod, lado: 'abajo' }] : []),
]

const listaAPie = metros
  .filter(m => m.minutos <= MAX_MIN_LISTA)
  .map(m => ({ ...m, lineas: LINEAS[m.nombre] || [] }))

const pct = (v, total) => `${(v / total) * 100}%`

const { lat, lon } = puntos.hotel
const coordenadas = `${lat.toFixed(4)}° N · ${Math.abs(lon).toFixed(4)}° O`

const DESTINO = 'Suites Viena Plaza de España, C/ Juan Álvarez Mendizábal 17, 28008 Madrid'
const URL_RUTA = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(DESTINO)}`

// Barra de escala: 100 m en unidades del SVG, como fracción del ancho.
const ESCALA_FRACCION = (100 * PX_POR_M) / VB_W

const soloDigitos = (t) => String(t || '').replace(/\D/g, '')

function Lineas({ lineas }) {
  if (!lineas.length) return null
  return (
    <span className={styles.lineas}>
      {lineas.map(l => (
        <span key={l} className={styles.linea}>{l === 'R' ? 'R' : `L${l}`}</span>
      ))}
    </span>
  )
}

export default function Contacto({ hotel }) {
  const tel = hotel?.phone || HOTEL_ESTATICO.phone
  const email = hotel?.email || HOTEL_ESTATICO.email
  const whatsapp = hotel?.whatsapp || HOTEL_ESTATICO.whatsapp

  return (
    <section className={styles.seccion} id="contacto" aria-labelledby="contacto-titulo">
      <div className={styles.panel} style={{ '--escala': ESCALA_FRACCION }}>

        {/* ── Mapa ─────────────────────────────────────────────── */}
        <div className={styles.mapa} aria-hidden="true">
          <div
            className={styles.escenario}
            style={{
              '--hx': pct(puntos.hotel.x, VB_W),
              '--hy': pct(puntos.hotel.y, VB_H),
            }}
          >
            <img
              className={styles.calles}
              src={mapaUrl}
              alt=""
              width={VB_W}
              height={VB_H}
              loading="lazy"
              decoding="async"
            />

            {etiquetasMapa.map(e => (
              <span
                key={e.nombre}
                className={[
                  styles.marca,
                  e.lado === 'izq' ? styles.marcaIzq : '',
                  e.lado === 'abajo' ? styles.marcaAbajo : '',
                  e.ancho ? styles.soloAncho : '',
                ].filter(Boolean).join(' ')}
                style={{ left: pct(e.x, VB_W), top: pct(e.y, VB_H) }}
              >
                <span className={e.tipo === 'metro' ? styles.puntoMetro : styles.puntoRef}>
                  {e.tipo === 'metro' ? 'M' : <Landmark size={9} strokeWidth={2.4} />}
                </span>
                <span className={styles.marcaTexto}>
                  <span className={styles.marcaNombre}>{e.nombre}</span>
                  <span className={styles.marcaDato}>
                    {e.lineas?.length ? `${e.lineas.map(l => (l === 'R' ? 'R' : `L${l}`)).join(' · ')} · ` : ''}
                    {e.minutos} min
                  </span>
                </span>
              </span>
            ))}

            {/* Lupa sobre el hotel */}
            <span
              className={styles.lupa}
              style={{ left: pct(puntos.hotel.x, VB_W), top: pct(puntos.hotel.y, VB_H) }}
            >
              <span className={styles.lupaPulso} />
              <span className={styles.lupaCentro}>
                <MapPin size={16} strokeWidth={2.2} />
              </span>
              <span className={styles.lupaNombre}>Suites Viena</span>
            </span>
          </div>

          {/* Instrumentos, fijos al panel */}
          <div className={styles.ubicacion}>
            <MapPin size={14} strokeWidth={2.2} />
            <span className={styles.ubicacionEtiqueta}>Ubicación</span>
            <span className={styles.ubicacionValor}>C/ Juan Álvarez Mendizábal, 17 · Madrid</span>
          </div>

          <div className={styles.brujula}>
            <span className={styles.brujulaN}>N</span>
            <Compass size={22} strokeWidth={1.5} />
            <span className={styles.escala}>
              <span className={styles.escalaBarra} />
              <span>100 m</span>
            </span>
          </div>

          <span className={styles.coordenadas}>{coordenadas}</span>
        </div>

        {/* ── Información ──────────────────────────────────────────
             Dos bloques dentro de .info: el de "Cómo llegar", que en
             escritorio queda centrado a media altura del panel, y el de
             contacto (pastilla + enlaces), anclado abajo del todo. */}
        <div className={styles.info}>
          <div className={styles.infoPrincipal}>
            <h2 className={styles.titulo} id="contacto-titulo">Cómo llegar</h2>
            <p className={styles.direccion}>
              {puntos.hotel.nombre}
              <br />
              {puntos.hotel.direccion}
            </p>

            <p className={styles.subtitulo}>A pie desde el metro</p>
            <ul className={styles.lista}>
              {listaAPie.map(m => (
                <li key={m.nombre}>
                  <span className={styles.listaM} aria-hidden="true">M</span>
                  <span className={styles.listaNombre}>{m.nombre}</span>
                  <Lineas lineas={m.lineas} />
                  <span className={styles.listaMin}>{m.minutos} min</span>
                </li>
              ))}
              {debod && (
                <li>
                  <span className={styles.listaRef} aria-hidden="true">
                    <Landmark size={11} strokeWidth={2.2} />
                  </span>
                  <span className={styles.listaNombre}>Templo de Debod</span>
                  <span className={styles.listaMin}>{debod.minutos} min</span>
                </li>
              )}
            </ul>
          </div>

          <div className={styles.infoContacto}>
            <span className={styles.pastilla}>
              <span className={styles.pastillaPunto} aria-hidden="true" />
              Contacto
            </span>

            <div className={styles.contactos}>
              {tel && (
                <a href={`tel:${tel.replace(/\s/g, '')}`}>
                  <Phone size={15} strokeWidth={2} /> {tel}
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`}>
                  <Mail size={15} strokeWidth={2} /> {email}
                </a>
              )}
              {whatsapp && (
                <a href={`https://wa.me/${soloDigitos(whatsapp)}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle size={15} strokeWidth={2} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Acción y atribución ──────────────────────────────── */}
        <div className={styles.accion}>
          <a className={styles.boton} href={URL_RUTA} target="_blank" rel="noopener noreferrer">
            <Navigation size={16} strokeWidth={2.2} />
            Abrir ruta en Google Maps
            <ArrowUpRight size={15} strokeWidth={2.2} />
          </a>
          <a
            className={styles.atribucion}
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
          >
            {puntos.atribucion}
          </a>
        </div>
      </div>
    </section>
  )
}