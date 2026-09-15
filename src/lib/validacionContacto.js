/* ─────────────────────────────────────────────────────────────────────
   Validación del formulario de contacto.

   SIN ZOD, Y A PROPÓSITO. La primera versión de esto usaba zod, que ya
   estaba en package.json sin que lo usara nadie y parecía gratis.
   No lo era: metía unos 29 kB comprimidos en el bundle de la portada,
   para cinco reglas que caben en cuarenta líneas. Zod se gana el sitio
   cuando hay esquemas grandes, tipos inferidos y validación anidada.
   Aquí hay un nombre, un email y un teléfono.

   LAS REGLAS SON LAS MISMAS QUE LAS DE crear_reserva, también a
   propósito. Si el navegador acepta un email que Postgres va a
   rechazar, el cliente rellena todo, le da a enviar y recibe un error
   genérico sin saber qué campo arreglar.

   Por eso el patrón del email es literalmente el mismo que el de la
   función SQL, traducido a JavaScript. Si se toca uno, hay que tocar el
   otro.

   ESTO NO SUSTITUYE A LA VALIDACIÓN DEL SERVIDOR. Es comodidad para
   quien rellena el formulario de buena fe. Quien quiera saltársela solo
   tiene que abrir la consola: la de verdad es la de Postgres, que está
   fuera de su alcance.
   ───────────────────────────────────────────────────────────────────── */

/* Algo, arroba, algo, punto, algo, sin espacios. Deliberadamente
   permisiva.

   Las regex "completas" de email que circulan por ahí tienen cientos de
   caracteres, y su gracia es rechazar direcciones raras que en realidad
   son válidas según el RFC. Rechazar el email bueno de un cliente para
   presumir de rigor es un mal negocio: quien se equivoca de verdad se
   deja la arroba o escribe "gmail.con", y eso lo pilla esto. */
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/* Teléfono: se cuentan los dígitos y se ignora todo lo demás. Así valen
   "+34 917 583 605", "917583605" y "917-583-605", que son la misma
   persona escribiendo con distinto humor. */
const soloDigitos = (v) => (v || '').replace(/\D/g, '')

const t = (v) => (v ?? '').trim()

/* Una función por campo. Devuelve el mensaje si algo falla, o null si
   está bien. Que la regla y el mensaje vivan juntos evita el clásico de
   cambiar una condición y dejar el texto viejo debajo. */
const REGLAS = {
  nombre: (v) => {
    if (t(v).length < 2)   return 'Escribe tu nombre'
    if (t(v).length > 120) return 'El nombre es demasiado largo'
    return null
  },

  email: (v) => {
    if (!t(v))              return 'Necesitamos un email para contestarte'
    if (t(v).length > 200)  return 'El email es demasiado largo'
    if (!EMAIL.test(t(v)))  return 'Revisa el email: parece que falta algo'
    return null
  },

  /* Opcional: lo pidió así la dirección. Pero si se escribe algo, tiene
     que parecer un teléfono. Aceptar "no tengo" sería peor que dejarlo
     en blanco, porque acaba en la ficha de la reserva como si fuera un
     número real. */
  telefono: (v) => {
    if (!t(v)) return null
    const n = soloDigitos(v).length
    if (n < 9)  return 'El teléfono parece incompleto'
    if (n > 15) return 'El teléfono tiene demasiados dígitos'
    return null
  },

  comentarios: (v) =>
    t(v).length > 2000 ? 'Los comentarios son demasiado largos' : null,

  privacidad: (v) =>
    v === true ? null : 'Tienes que aceptar la política de privacidad',
}

/**
 * Valida el objeto de contacto entero.
 *
 * @returns {{ ok: boolean, errores: Record<string, string> }}
 *   Como mucho un mensaje por campo: enseñar dos quejas sobre el mismo
 *   hueco no ayuda a nadie.
 */
export function validarContacto(contacto) {
  const errores = {}

  for (const [campo, regla] of Object.entries(REGLAS)) {
    const mensaje = regla(contacto?.[campo])
    if (mensaje) errores[campo] = mensaje
  }

  return { ok: Object.keys(errores).length === 0, errores }
}

/** Valida un solo campo. Se usa al salir de cada input, para avisar
 *  mientras se rellena en vez de esperar al final. */
export function validarCampo(campo, contacto) {
  const regla = REGLAS[campo]
  return regla ? regla(contacto?.[campo]) : null
}

export default validarContacto