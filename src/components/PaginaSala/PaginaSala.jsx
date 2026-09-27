import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Check, Images, Maximize2, Phone, Sun, Users, MoveVertical,
} from 'lucide-react'
import { useHotelData } from '../../hooks/useHotelData'
import { useOfertasPublicas } from '../../hooks/useOfertasPublicas'
import { useCabecera } from '../../hooks/useCabecera'
import { cabeceraSala, capacidadSala, rutaSala } from '../../lib/seo'
import { USOS } from '../../lib/usos'
import { tienePlano } from '../../lib/planos'
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
import NoEncontrada from '../NoEncontrada/NoEncontrada'
// La galería va aparte (lleva framer-motion): solo se descarga si se
// pulsa "Ver fotos". Mismo patrón que en RoomSelector.
const cargarGaleria = () => import('../Gallery/Gallery')
const Gallery = lazy(cargarGaleria)
import PlanoSala from '../PlanoSala/PlanoSala'
import Footer from '../Footer/Footer'
import styles from './PaginaSala.module.css'

import teatroSvg   from '../../assets/layouts/teatro.svg?url'
import uSvg        from '../../assets/layouts/u.svg?url'
import imperialSvg from '../../assets/layouts/imperial.svg?url'
import escuelaSvg  from '../../assets/layouts/escuela.svg?url'

const BookingWizard = lazy(() => import('../BookingWizard/BookingWizard'))

/* ─────────────────────────────────────────────────────────────────────
   FICHA DE SALA — /salas/:slug

   Una página por sala para que Google pueda posicionar cada una por su
   cuenta ("sala de reuniones 30 m² Madrid", "sala para 40 personas
   Plaza de España"…). La portada solo puede competir por una búsqueda.

   Todo sale de Supabase: nombre, metros, capacidades, precios, fotos y
   descripción. Se prerenderiza en el build (una por sala, ver
   entry-server.jsx), así que el HTML llega completo.

   Reservar abre el mismo wizard que la portada, sin salir de la URL.
   ───────────────────────────────────────────────────────────────────── */

const LAYOUT_SVGS = { teatro: teatroSvg, u: uSvg, imperial: imperialSvg, escuela: escuelaSvg }

const INCLUIDO = {
  wifi: 'WiFi de alta velocidad',
  proyector: 'Proyector',
  pantalla: 'Pantalla',
  flipchart: 'Flipchart',
  agua: 'Agua para los asistentes',
  material: 'Material de oficina',
}

const eur = (n) => {
  const v = Number(n)
  const dec = Number.isInteger(v) ? 0 : 2
  return `${v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec })} €`
}

const telHref = (t) => `tel:${String(t).replace(/\s/g, '')}`

export default function PaginaSala() {
  const { slug } = useParams()
  const { hotel, loading, error } = useHotelData()
  const ofertasApi = useOfertasPublicas(hotel?._dbId)
  const [reservando, setReservando] = useState(false)
  const [galeria, setGaleria] = useState(false)

  const sala = hotel?.rooms?.find(r => r.slug === slug) || null
  useCabecera(sala ? cabeceraSala(sala) : null)

  // Al llegar desde otra página, o al abrir/cerrar la reserva, arriba.
  useEffect(() => { window.scrollTo(0, 0) }, [slug, reservando])

  if (loading) {
    return <main className={styles.estado} aria-busy="true">Cargando sala…</main>
  }

  if (error) {
    return (
      <main className={styles.estado} role="alert">
        No se han podido cargar los datos. Recarga la página en unos segundos.
      </main>
    )
  }

  if (!sala) return <NoEncontrada />

  if (reservando) {
    return (
      <main style={{ minHeight: '100vh' }}>
        <Suspense fallback={<div className={styles.estado}>Preparando tu reserva…</div>}>
          <BookingWizard
            hotel={hotel}
            room={sala}
            onBack={() => setReservando(false)}
            ofertasApi={ofertasApi}
          />
        </Suspense>
      </main>
    )
  }

  const fotos = sala.images?.filter(Boolean) || []
  const pax = capacidadSala(sala)
  const otras = hotel.rooms.filter(r => r.slug !== sala.slug)
  const precioCatering = (hotel.extras || [])
    .filter(e => e.isActive && e.pricePerPerson > 0)
    .map(e => e.pricePerPerson)
  const cateringDesde = precioCatering.length ? Math.min(...precioCatering) : null
  const { pricing } = sala

  const reservar = () => setReservando(true)

  return (
    <main className={styles.pagina}>

      {/* ── Barra superior ── */}
      <header className={styles.barra}>
        <Link to="/" className={styles.marca}>
          <span className={styles.marcaSello} aria-hidden="true">SV</span>
          <span>Suites Viena</span>
        </Link>
        {hotel.phone && (
          <a className={styles.barraTel} href={telHref(hotel.phone)}>
            <Phone size={15} strokeWidth={2.2} />
            <span>{hotel.phone}</span>
          </a>
        )}
      </header>

      <div className={styles.contenedor}>

        {/* ── Migas de pan ── */}
        <nav aria-label="Ruta" className={styles.migas}>
          <ol>
            <li><Link to="/#salas">Salas de reuniones</Link></li>
            <li aria-current="page">{sala.name}</li>
          </ol>
        </nav>

        {/* ── Titular ── */}
        <div className={styles.cabecera}>
          <p className={styles.antetitulo}>Madrid centro · Plaza de España</p>
          <h1 className={styles.titulo}>{sala.name}</h1>
          <p className={styles.subtitulo}>
            Sala de reuniones de {sala.size} m² en el hotel Suites Viena, a un paso de Plaza de España.
          </p>

          <ul className={styles.datos}>
            <li><Maximize2 size={15} /> {sala.size} m²</li>
            {pax > 0 && <li><Users size={15} /> Hasta {pax} personas</li>}
            {sala.naturalLight && <li><Sun size={15} /> Luz natural</li>}
            {sala.height > 0 && <li><MoveVertical size={15} /> {String(sala.height).replace('.', ',')} m de altura</li>}
          </ul>
        </div>

        {/* ── Fotos ── */}
        {fotos.length > 0 && (
          <section className={styles.fotos} aria-label={`Fotos de ${sala.name}`}>
            <img
              className={styles.fotoPrincipal}
              src={getOptimizedUrl(fotos[0], IMAGE_SIZES.lightbox)}
              alt={`${sala.name}, sala de reuniones de ${sala.size} m² en Madrid centro`}
              fetchPriority="high"
              decoding="async"
            />
            {fotos.slice(1, 3).map((src, i) => (
              <img
                key={src}
                className={styles.fotoSecundaria}
                src={getOptimizedUrl(src, IMAGE_SIZES.cardImage)}
                alt={`${sala.name}, foto ${i + 2}`}
                loading="lazy"
                decoding="async"
              />
            ))}
            {fotos.length > 1 && (
              <button
                type="button"
                className={styles.verFotos}
                onClick={() => setGaleria(true)}
                onPointerEnter={cargarGaleria}
                onFocus={cargarGaleria}
              >
                <Images size={16} /> Ver las {fotos.length} fotos
              </button>
            )}
          </section>
        )}

        <div className={styles.cuerpo}>

          {/* ── Columna de contenido ── */}
          <div className={styles.contenido}>

            {/* El plano no depende de que haya descripción: una sala sin
                texto sigue teniendo forma. `tienePlano` evita que quede
                un bloque con solo el título si no hay ni una cosa ni la
                otra. */}
            {(sala.description || tienePlano(sala.slug)) && (
              <section className={styles.bloque}>
                <h2>Cómo es la sala</h2>
                {sala.description && <p>{sala.description}</p>}
                <PlanoSala sala={sala} />
              </section>
            )}

            {sala.layouts?.length > 0 && (
              <section className={styles.bloque}>
                <h2>Configuraciones y capacidad</h2>
                <p>
                  Montamos la sala según el tipo de reunión. Capacidad máxima de {sala.name} en
                  cada formato:
                </p>
                <ul className={styles.montajes}>
                  {sala.layouts.map(l => (
                    <li key={l.type}>
                      {LAYOUT_SVGS[l.type] && (
                        <img src={LAYOUT_SVGS[l.type]} alt="" aria-hidden="true" loading="lazy" />
                      )}
                      <strong>{l.max} personas</strong>
                      <span>{l.label}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={styles.bloque}>
              <h2>Horarios y tarifas</h2>
              <table className={styles.tarifas}>
                <tbody>
                  <tr>
                    <th scope="row">Media jornada<small>Mañana 9:00–14:00 o tarde 15:00–20:00</small></th>
                    <td>{eur(pricing.halfDay)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Jornada completa<small>9:00–20:00</small></th>
                    <td>{eur(pricing.fullDay)}</td>
                  </tr>
                  {pricing.weekendSupplement > 0 && (
                    <tr>
                      <th scope="row">Suplemento fin de semana<small>Sábados y domingos</small></th>
                      <td>+{eur(pricing.weekendSupplement)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className={styles.nota}>
                {pricing.vatIncluded ? 'IVA incluido. ' : 'IVA no incluido. '}
                El precio final, con descuentos y extras, se calcula al elegir las fechas.
              </p>
            </section>

            <section className={styles.bloque}>
              <h2>Incluido en el precio</h2>
              <ul className={styles.incluido}>
                {(sala.amenities || []).filter(id => INCLUIDO[id]).map(id => (
                  <li key={id}><Check size={15} /> {INCLUIDO[id]}</li>
                ))}
              </ul>
            </section>

            <section className={styles.bloque}>
              <h2>Catering</h2>
              <p>
                Servicio propio del hotel: coffee breaks y menús para los asistentes
                {cateringDesde != null ? `, desde ${eur(cateringDesde)} por persona` : ''}.
                Se añaden durante la reserva.
              </p>
            </section>

            <section className={styles.bloque}>
              <h2>Ideal para</h2>
              <ul className={styles.usos}>
                {USOS.map(u => (
                  <li key={u.slug}><Link to={u.ruta}>{u.etiqueta}</Link></li>
                ))}
              </ul>
            </section>

            <section className={styles.bloque}>
              <h2>Cómo llegar</h2>
              <p>
                {hotel.address || 'C/ Juan Álvarez Mendizábal, 17, 28008 Madrid'}. A cinco minutos
                andando de Plaza de España y del Templo de Debod. Metro Ventura Rodríguez (línea 3),
                Plaza de España (líneas 3 y 10) y Argüelles (líneas 3, 4 y 6).
              </p>
            </section>
          </div>

          {/* ── Tarjeta de reserva ── */}
          <aside className={styles.lateral}>
            <div className={styles.reserva}>
              <p className={styles.reservaDesde}>
                Desde <strong>{eur(pricing.halfDay)}</strong>
                <span>media jornada</span>
              </p>
              <button type="button" className={styles.reservaBoton} onClick={reservar}>
                Reservar esta sala <ArrowRight size={16} />
              </button>
              <p className={styles.reservaNota}>Eliges fecha, montaje y extras, y el hotel te confirma la reserva.</p>

              <div className={styles.reservaContacto}>
                {hotel.phone && <a href={telHref(hotel.phone)}>Llamar al {hotel.phone}</a>}
                {hotel.whatsapp && (
                  <a
                    href={`https://wa.me/${hotel.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp <ArrowUpRight size={14} />
                  </a>
                )}
                {hotel.email && <a href={`mailto:${hotel.email}`}>{hotel.email}</a>}
              </div>
            </div>
          </aside>
        </div>

        {/* ── Otras salas ── */}
        {otras.length > 0 && (
          <section className={styles.otras}>
            <h2>Otras salas en Suites Viena</h2>
            <ul>
              {otras.map(r => (
                <li key={r.slug}>
                  <Link to={rutaSala(r.slug)} className={styles.otraSala}>
                    {r.images?.[0] && (
                      <img
                        src={getOptimizedUrl(r.images[0], IMAGE_SIZES.cardImage)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <span className={styles.otraNombre}>{r.name}</span>
                    <span className={styles.otraDatos}>
                      {r.size} m² · hasta {capacidadSala(r)} personas · desde {eur(r.pricing.halfDay)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Vuelta a la portada, a la sección de salas.

            Era un <a href="/#salas">, que recarga la página entera: se
            volvía a descargar el bundle y a consultar Supabase para
            enseñar algo que el visitante acababa de dejar. Con <Link>
            la vuelta es instantánea.

            El salto a la sección lo hace PublicApp al leer el hash,
            porque aquí el ancla todavía no existe en el DOM. */}
        <p className={styles.volver}>
          <Link to="/#salas"><ArrowLeft size={15} /> Ver todas las salas</Link>
        </p>
      </div>

      <Footer />

      {/* Barra fija de reserva en móvil */}
      <div className={styles.barraMovil}>
        <span>Desde <strong>{eur(pricing.halfDay)}</strong></span>
        <button type="button" onClick={reservar}>Reservar <ArrowRight size={15} /></button>
      </div>

      {galeria && (
        <Suspense fallback={null}>
          <Gallery images={fotos} onClose={() => setGaleria(false)} />
        </Suspense>
      )}
    </main>
  )
}