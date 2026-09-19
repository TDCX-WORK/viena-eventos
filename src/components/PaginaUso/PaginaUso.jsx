import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Phone } from 'lucide-react'
import { useHotelData } from '../../hooks/useHotelData'
import { useCabecera } from '../../hooks/useCabecera'
import { cabeceraUso, rutaSala } from '../../lib/seo'
import { USOS, usoPorRuta, resumenUso } from '../../lib/usos'
import { getOptimizedUrl, IMAGE_SIZES } from '../../lib/imageUtils'
import NoEncontrada from '../NoEncontrada/NoEncontrada'
import Footer from '../Footer/Footer'
import base from '../PaginaSala/PaginaSala.module.css'
import styles from './PaginaUso.module.css'

/* ─────────────────────────────────────────────────────────────────────
   PÁGINA POR USO — /sala-formacion-madrid, /sala-juntas-madrid…

   El texto vive en lib/usos.js; las cifras salen de Supabase. Comparte
   los estilos generales con la ficha de sala (PaginaSala.module.css) y
   añade solo lo suyo.

   Para reservar se manda a la ficha de la sala elegida: ahí están las
   fotos y el botón de reserva. Así hay un solo sitio donde se reserva
   cada sala.
   ───────────────────────────────────────────────────────────────────── */

const INCLUIDO = {
  wifi: 'WiFi de alta velocidad',
  proyector: 'Proyector',
  pantalla: 'Pantalla',
  flipchart: 'Flipchart',
  agua: 'Agua para los asistentes',
  material: 'Material de oficina',
}

const telHref = (t) => `tel:${String(t).replace(/\s/g, '')}`

export default function PaginaUso() {
  const { pathname } = useLocation()
  const uso = usoPorRuta(pathname.replace(/\/$/, ''))
  const { hotel, loading, error } = useHotelData()

  const resumen = resumenUso(hotel, uso || USOS[0])

  // Al llegar desde otra página, arriba.
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  useCabecera(uso && hotel ? cabeceraUso(uso, resumen) : null)

  if (!uso) return <NoEncontrada />
  if (loading) return <main className={base.estado} aria-busy="true">Cargando…</main>
  if (error) {
    return (
      <main className={base.estado} role="alert">
        No se han podido cargar los datos. Recarga la página en unos segundos.
      </main>
    )
  }

  const { filas, capacidad } = resumen
  const nombresMontaje = uso.montajes
    .map(t => hotel.rooms.flatMap(r => r.layouts || []).find(l => l.type === t)?.label)
    .filter(Boolean)
  const foto = filas.find(f => f.sala.images?.[0])?.sala.images[0]
  const otrosUsos = USOS.filter(u => u.slug !== uso.slug)

  return (
    <main className={base.pagina} style={{ paddingBottom: 0 }}>

      <header className={base.barra}>
        <Link to="/" className={base.marca}>
          <span className={base.marcaSello} aria-hidden="true">SV</span>
          <span>Suites Viena</span>
        </Link>
        {hotel.phone && (
          <a className={base.barraTel} href={telHref(hotel.phone)}>
            <Phone size={15} strokeWidth={2.2} />
            <span>{hotel.phone}</span>
          </a>
        )}
      </header>

      <div className={base.contenedor}>
        <nav aria-label="Ruta" className={base.migas}>
          <ol>
            <li><Link to="/">Salas de reuniones</Link></li>
            <li aria-current="page">{uso.etiqueta}</li>
          </ol>
        </nav>

        {/* ── Titular con foto ── */}
        <div className={styles.portada}>
          <div className={base.cabecera}>
            <p className={base.antetitulo}>Madrid centro · Plaza de España</p>
            <h1 className={base.titulo}>{uso.h1}</h1>
            {uso.intro.map((p, i) => (
              <p key={i} className={base.subtitulo}>{p}</p>
            ))}
            <a href="#salas-recomendadas" className={styles.botonPrincipal}>
              Ver qué sala encaja <ArrowRight size={16} />
            </a>
          </div>
          {foto && (
            <img
              className={styles.foto}
              src={getOptimizedUrl(foto, IMAGE_SIZES.lightbox)}
              alt={`Sala de Suites Viena preparada para ${uso.etiqueta.toLowerCase()}`}
              fetchPriority="high"
              decoding="async"
            />
          )}
        </div>

        {/* ── Qué sala elegir ── */}
        <section className={base.bloque} id="salas-recomendadas">
          <h2>Qué sala elegir</h2>
          <p>
            {nombresMontaje.length > 0 && (
              <>Aforo máximo de cada sala en {nombresMontaje.join(' y ').toLowerCase()}. </>
            )}
            {capacidad && <>Para grupos de hasta {capacidad} personas.</>}
          </p>

          <div className={styles.tablaScroll}>
            <table className={styles.tabla}>
              <thead>
                <tr>
                  <th scope="col">Sala</th>
                  {uso.montajes.map(tipo => (
                    <th scope="col" key={tipo}>
                      {hotel.rooms.flatMap(r => r.layouts || []).find(l => l.type === tipo)?.label || tipo}
                    </th>
                  ))}
                  <th scope="col">Desde</th>
                  <th scope="col"><span className={styles.oculto}>Ficha</span></th>
                </tr>
              </thead>
              <tbody>
                {filas.map(({ sala }) => (
                  <tr key={sala.slug}>
                    <th scope="row">
                      {sala.name}
                      <small>{sala.size} m²{sala.naturalLight ? ' · luz natural' : ''}</small>
                    </th>
                    {uso.montajes.map(tipo => {
                      const l = (sala.layouts || []).find(x => x.type === tipo)
                      return <td key={tipo}>{l ? `${l.max} pers.` : '—'}</td>
                    })}
                    <td>{sala.pricing.halfDay} €</td>
                    <td>
                      <Link to={rutaSala(sala.slug)} className={styles.enlaceSala}>
                        Ver y reservar <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={base.nota}>Precio por media jornada, IVA incluido.</p>
        </section>

        <div className={styles.dosColumnas}>
          <section className={base.bloque}>
            <h2>Cómo montamos la sala</h2>
            <p>{uso.montajeTexto}</p>
          </section>

          <section className={base.bloque}>
            <h2>Qué horario reservar</h2>
            <p>{uso.horario}</p>
          </section>

          <section className={base.bloque}>
            <h2>Catering</h2>
            <p>{uso.catering}</p>
          </section>

          <section className={base.bloque}>
            <h2>Incluido en todas las salas</h2>
            <ul className={base.incluido}>
              {uso.incluido.map(id => (
                <li key={id}><Check size={15} /> {INCLUIDO[id]}</li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── Preguntas ── */}
        <section className={base.bloque}>
          <h2>Preguntas habituales</h2>
          <dl className={styles.preguntas}>
            {uso.preguntas.map(({ p, r }) => (
              <div key={p}>
                <dt>{p}</dt>
                <dd>{r}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={base.bloque}>
          <h2>Cómo llegar</h2>
          <p>
            {hotel.address || 'C/ Juan Álvarez Mendizábal, 17, 28008 Madrid'}. A cinco minutos
            andando de Plaza de España. Metro Ventura Rodríguez (línea 3), Plaza de España
            (líneas 3 y 10) y Argüelles (líneas 3, 4 y 6).
          </p>
        </section>

        {/* ── Otros usos ── */}
        <section className={base.otras}>
          <h2>También para</h2>
          <ul className={styles.otrosUsos}>
            {otrosUsos.map(u => (
              <li key={u.slug}>
                <Link to={u.ruta}>{u.etiqueta} <ArrowRight size={14} /></Link>
              </li>
            ))}
          </ul>
        </section>

        <p className={base.volver}>
          <a href="/#salas"><ArrowLeft size={15} /> Ver todas las salas</a>
        </p>
      </div>

      <Footer />
    </main>
  )
}