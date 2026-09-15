import { useMemo, useState } from 'react'
import {
  IconPlus,
  IconPencil,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconAlertTriangle,
  IconRefresh,
  IconSparkles,
  IconHelpCircle,
} from '@tabler/icons-react'
import useFaqs from '../../hooks/useFaqs'
import { construirFaq } from '../../lib/faq'
import Modal from './Modal/Modal'
import ToggleSwitch from './ToggleSwitch'
import styles from './AdminFaq.module.css'

const VACIA = { question: '', answer: '', is_active: true }

/* Google no pone un máximo, pero una respuesta que no cabe en el
   acordeón sin hacer scroll deja de responder nada. Es un aviso, no un
   límite: si la directora necesita más, escribe más. */
const LARGO_COMODO = 600

function validar(datos) {
  const errores = {}
  if (!datos.question.trim()) errores.question = 'Escribe la pregunta'
  if (!datos.answer.trim()) errores.answer = 'Escribe la respuesta'
  return errores
}

export default function AdminFaq() {
  const {
    faqs, hotel,
    cargando, error, guardando,
    recargar, guardar, importar, alternarActiva, eliminar, mover,
  } = useFaqs()

  const [editando, setEditando] = useState(null)   // null | 'nueva' | id
  const [datos, setDatos] = useState(VACIA)
  const [errores, setErrores] = useState({})
  const [aBorrar, setABorrar] = useState(null)

  /* Las preguntas que saldrían solas si esta tabla estuviera vacía. Se
     usan para la vista previa del estado vacío y para el botón de
     copiarlas. */
  const automaticas = useMemo(() => (hotel ? construirFaq(hotel) : []), [hotel])

  const ordenadas = useMemo(
    () => [...faqs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [faqs]
  )

  function abrirNueva() {
    setDatos(VACIA)
    setErrores({})
    setEditando('nueva')
  }

  function abrirEdicion(faq) {
    setDatos({ question: faq.question, answer: faq.answer, is_active: faq.is_active })
    setErrores({})
    setEditando(faq.id)
  }

  async function enviar() {
    const errs = validar(datos)
    setErrores(errs)
    if (Object.keys(errs).length > 0) return

    const ok = await guardar(datos, editando === 'nueva' ? null : editando)
    if (ok) setEditando(null)
  }

  async function confirmarBorrado() {
    const ok = await eliminar(aBorrar.id)
    if (ok) setABorrar(null)
  }

  if (cargando) {
    return (
      <div className={styles.cargando}>
        <div className={styles.puntos}><span /><span /><span /></div>
        Cargando preguntas
      </div>
    )
  }

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Dudas frecuentes</h1>
          <p className={styles.subtitle}>
            Las preguntas que aparecen en la web pública, debajo de las salas.
          </p>
        </div>
        <button type="button" className={styles.btnPrimario} onClick={abrirNueva}>
          <IconPlus size={17} stroke={2} />
          Nueva pregunta
        </button>
      </div>

      {error && (
        <div className={styles.errorMsg}>
          <IconAlertTriangle size={17} stroke={1.75} />
          {error}
          <button type="button" className={styles.reintentar} onClick={() => recargar()}>
            <IconRefresh size={15} stroke={1.75} />
            Reintentar
          </button>
        </div>
      )}

      {/* ── Estado vacío ──
          No es una pantalla en blanco: mientras no haya nada aquí, la
          web enseña las preguntas automáticas, y eso hay que decirlo o
          la directora creerá que su web no tiene FAQ. */}
      {ordenadas.length === 0 && !error && (
        <div className={styles.vacio}>
          <span className={styles.vacioIcono}><IconHelpCircle size={26} stroke={1.6} /></span>
          <h2 className={styles.vacioTitulo}>Ahora mismo salen las preguntas automáticas</h2>
          <p className={styles.vacioTexto}>
            La web está enseñando {automaticas.length} preguntas que se escriben solas
            con los precios, las salas y el catering que hay en el panel. Se actualizan
            cuando cambias cualquiera de esas cosas, así que nunca dicen un precio
            antiguo.
            <br /><br />
            Si quieres escribirlas a tu manera, crea una pregunta nueva o copia estas
            para partir de algo. En cuanto haya una pregunta guardada aquí, las
            automáticas dejan de salir y manda esta lista.
          </p>

          <div className={styles.vacioAcciones}>
            <button
              type="button"
              className={styles.btnPrimario}
              onClick={() => importar(automaticas)}
              disabled={guardando || automaticas.length === 0}
            >
              <IconSparkles size={17} stroke={2} />
              Copiar las {automaticas.length} automáticas
            </button>
            <button type="button" className={styles.btnSecundario} onClick={abrirNueva}>
              <IconPlus size={17} stroke={2} />
              Escribir la primera
            </button>
          </div>

          <ul className={styles.vacioLista}>
            {automaticas.map((p, i) => (
              <li key={p.id} className={styles.vacioItem}>
                <span className={styles.vacioNum}>{String(i + 1).padStart(2, '0')}</span>
                {p.pregunta}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Lista ── */}
      {ordenadas.length > 0 && (
        <ul className={styles.lista}>
          {ordenadas.map((faq, i) => (
            <li
              key={faq.id}
              className={`${styles.card} ${faq.is_active ? '' : styles.cardApagada}`}
            >
              <div className={styles.orden}>
                <button
                  type="button"
                  className={styles.ordenBtn}
                  onClick={() => mover(faq.id, 'arriba')}
                  disabled={i === 0}
                  aria-label="Subir"
                >
                  <IconChevronUp size={15} stroke={2} />
                </button>
                <span className={styles.ordenNum}>{String(i + 1).padStart(2, '0')}</span>
                <button
                  type="button"
                  className={styles.ordenBtn}
                  onClick={() => mover(faq.id, 'abajo')}
                  disabled={i === ordenadas.length - 1}
                  aria-label="Bajar"
                >
                  <IconChevronDown size={15} stroke={2} />
                </button>
              </div>

              <div className={styles.cardCentro}>
                <h3 className={styles.pregunta}>{faq.question}</h3>
                <p className={styles.respuesta}>{faq.answer}</p>
              </div>

              <div className={styles.cardAcciones}>
                <ToggleSwitch
                  activo={faq.is_active}
                  onCambio={() => alternarActiva(faq)}
                  etiqueta={faq.is_active ? 'Ocultar de la web' : 'Mostrar en la web'}
                />
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => abrirEdicion(faq)}
                  aria-label="Editar"
                >
                  <IconPencil size={16} stroke={1.75} />
                </button>
                <button
                  type="button"
                  className={`${styles.iconBtn} ${styles.iconBtnBorrar}`}
                  onClick={() => setABorrar(faq)}
                  aria-label="Eliminar"
                >
                  <IconTrash size={16} stroke={1.75} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {ordenadas.length > 0 && (
        <p className={styles.nota}>
          Las preguntas desactivadas no salen en la web ni cuentan para Google.
          El orden de esta lista es el orden en el que aparecen.
        </p>
      )}

      {/* ── Formulario ── */}
      <Modal
        abierto={editando !== null}
        onCerrar={() => setEditando(null)}
        titulo={editando === 'nueva' ? 'Nueva pregunta' : 'Editar pregunta'}
        ancho={620}
        bloqueado={guardando}
        onEnviar={enviar}
        pie={
          <>
            <button
              type="button"
              className={styles.btnSecundario}
              onClick={() => setEditando(null)}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.btnPrimario} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className={styles.campo}>
          <label className={styles.label} htmlFor="faq-pregunta">Pregunta</label>
          <input
            id="faq-pregunta"
            className={`${styles.input} ${errores.question ? styles.inputMal : ''}`}
            value={datos.question}
            onChange={e => setDatos({ ...datos, question: e.target.value })}
            placeholder="¿Se puede aparcar cerca?"
          />
          {errores.question
            ? <span className={styles.errorCampo}>{errores.question}</span>
            : <span className={styles.ayuda}>
                Escríbela como la escribiría un cliente en Google.
              </span>}
        </div>

        <div className={styles.campo}>
          <label className={styles.label} htmlFor="faq-respuesta">Respuesta</label>
          <textarea
            id="faq-respuesta"
            className={`${styles.textarea} ${errores.answer ? styles.inputMal : ''}`}
            rows={6}
            value={datos.answer}
            onChange={e => setDatos({ ...datos, answer: e.target.value })}
            placeholder="Sí. Hay un aparcamiento público a dos minutos andando, en…"
          />
          <span className={styles.contador}>
            {errores.answer && <span className={styles.errorCampo}>{errores.answer}</span>}
            <span className={datos.answer.length > LARGO_COMODO ? styles.contadorLargo : ''}>
              {datos.answer.length} caracteres
              {datos.answer.length > LARGO_COMODO ? ' — queda un poco larga' : ''}
            </span>
          </span>
        </div>

        <div className={styles.campoFila}>
          <div>
            <span className={styles.label}>Visible en la web</span>
            <span className={styles.ayuda}>
              Apagada se guarda pero no la ve nadie. Útil para dejarla a medias.
            </span>
          </div>
          <ToggleSwitch
            activo={datos.is_active}
            onCambio={v => setDatos({ ...datos, is_active: v })}
            etiqueta="Visible en la web"
          />
        </div>
      </Modal>

      {/* ── Confirmación de borrado ── */}
      <Modal
        abierto={aBorrar !== null}
        onCerrar={() => setABorrar(null)}
        variante="centrado"
        ancho={420}
      >
        <div className={styles.confirmar}>
          <span className={styles.confirmarIcono}>
            <IconTrash size={22} stroke={1.75} />
          </span>
          <h2 className={styles.confirmarTitulo}>¿Eliminar esta pregunta?</h2>
          <p className={styles.confirmarTexto}>{aBorrar?.question}</p>
          <p className={styles.confirmarAviso}>
            No se puede deshacer. Si solo quieres esconderla, apaga el interruptor.
          </p>
          <div className={styles.confirmarAcciones}>
            <button
              type="button"
              className={styles.btnSecundario}
              onClick={() => setABorrar(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnBorrar}
              onClick={confirmarBorrado}
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
