import { useEffect, Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, Phone, AlertTriangle } from 'lucide-react'
import { useCabecera } from '../../hooks/useCabecera'
import { HOTEL_ESTATICO } from '../../lib/hotelEstatico'
import {
  documentoPorRuta, cabeceraLegal, esBorrador, ACTUALIZADO, ENLACES_LEGALES,
} from '../../lib/legal'
import NoEncontrada from '../NoEncontrada/NoEncontrada'
import Footer from '../Footer/Footer'
import base from '../PaginaSala/PaginaSala.module.css'
import styles from './PaginaLegal.module.css'

/* ─────────────────────────────────────────────────────────────────────
   PÁGINAS LEGALES — /aviso-legal, /politica-privacidad…

   Un solo componente para los cuatro documentos: el texto vive en
   lib/legal.js y aquí solo se pinta. Así, cuando el abogado devuelva el
   texto definitivo, se toca un fichero de datos y no cuatro páginas.

   NO consulta Supabase a propósito. Un aviso legal tiene que poder
   leerse aunque la base de datos esté caída, y además así el HTML
   prerenderizado es idéntico al que monta el navegador.

   Reutiliza la barra superior y el contenedor de la ficha de sala
   (PaginaSala.module.css) para que la cabecera sea la misma en todas
   las páginas interiores.
   ───────────────────────────────────────────────────────────────────── */

const telHref = (t) => `tel:${String(t).replace(/\s/g, '')}`

/* Los huecos pendientes van entre dobles llaves en lib/legal.js. Aquí se
   pintan resaltados para que canten a la vista y nadie publique un
   documento a medias sin darse cuenta. */
function Texto({ children }) {
  const partes = String(children).split(/(\{\{[^}]*\}\})/g)
  return partes.map((p, i) =>
    p.startsWith('{{') && p.endsWith('}}')
      ? <mark key={i} className={styles.hueco}>{p.slice(2, -2)}</mark>
      : <Fragment key={i}>{p}</Fragment>
  )
}

function Bloques({ bloques }) {
  return bloques.map((b, i) => {
    if (b.tipo === 'p') {
      return <p key={i} className={styles.parrafo}><Texto>{b.texto}</Texto></p>
    }

    if (b.tipo === 'lista') {
      return (
        <ul key={i} className={styles.lista}>
          {b.elementos.map((e, j) => (
            <li key={j}><Texto>{e}</Texto></li>
          ))}
        </ul>
      )
    }

    if (b.tipo === 'tabla') {
      return (
        <div key={i} className={styles.tablaScroll}>
          <table className={styles.tabla}>
            <tbody>
              {b.filas.map(([clave, valor], j) => (
                <tr key={j}>
                  <th scope="row">{clave}</th>
                  <td><Texto>{valor}</Texto></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    if (b.tipo === 'sub') {
      return (
        <section key={i} className={styles.sub}>
          <h3>{b.h}</h3>
          <Bloques bloques={b.bloques} />
        </section>
      )
    }

    return null
  })
}

export default function PaginaLegal() {
  const { pathname } = useLocation()
  const doc = documentoPorRuta(pathname.replace(/\/$/, ''))

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useCabecera(doc ? cabeceraLegal(doc) : null)

  if (!doc) return <NoEncontrada />

  const otros = ENLACES_LEGALES.filter(e => e.ruta !== doc.ruta)

  return (
    <main className={base.pagina} style={{ paddingBottom: 0 }}>

      <header className={base.barra}>
        <Link to="/" className={base.marca}>
          <span className={base.marcaSello} aria-hidden="true">SV</span>
          <span>Suites Viena</span>
        </Link>
        <a className={base.barraTel} href={telHref(HOTEL_ESTATICO.phone)}>
          <Phone size={15} strokeWidth={2.2} />
          <span>{HOTEL_ESTATICO.phone}</span>
        </a>
      </header>

      <div className={base.contenedor}>
        <nav aria-label="Ruta" className={base.migas}>
          <ol>
            <li><Link to="/">Salas de reuniones</Link></li>
            <li aria-current="page">{doc.titulo}</li>
          </ol>
        </nav>

        <article className={styles.documento}>

          {/* Mientras lib/legal.js tenga BORRADOR = true (o el documento
              su propio `borrador: true`). Al aprobarse el texto se pone
              a false y este cartel desaparece solo. */}
          {esBorrador(doc) && (
            <div className={styles.borrador} role="note">
              <AlertTriangle size={18} strokeWidth={2.2} />
              <div>
                <strong>Borrador pendiente de revisión jurídica.</strong> Este texto no es
                definitivo: se ha redactado para que el asesor legal lo revise y complete.
                Lo resaltado en amarillo son decisiones que faltan por tomar. Mientras esta
                nota esté visible, la página no aparece en Google.
              </div>
            </div>
          )}

          <h1 className={styles.titulo}>{doc.titulo}</h1>
          <p className={styles.actualizado}>
            Última actualización: <Texto>{doc.actualizado || ACTUALIZADO}</Texto>
          </p>
          {doc.entradilla && (
            <p className={styles.entradilla}><Texto>{doc.entradilla}</Texto></p>
          )}

          {doc.secciones.map((s, i) => (
            <section key={i} className={styles.seccion}>
              <h2>{s.h}</h2>
              <Bloques bloques={s.bloques} />
            </section>
          ))}

          <nav className={styles.otros} aria-label="Otros documentos legales">
            <span>Ver también:</span>
            <ul>
              {otros.map(o => (
                <li key={o.ruta}>
                  {o.externo ? (
                    <a href={o.href} target="_blank" rel="noopener noreferrer">{o.titulo}</a>
                  ) : (
                    <Link to={o.href}>{o.titulo}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <p className={base.volver}>
            <a href="/"><ArrowLeft size={15} /> Volver a la portada</a>
          </p>
        </article>
      </div>

      <Footer />
    </main>
  )
}