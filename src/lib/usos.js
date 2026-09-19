/* ─────────────────────────────────────────────────────────────────────
   PÁGINAS POR USO

   Una página por tipo de evento. Cada una tiene que aportar algo que no
   diga la portada: qué montaje conviene, qué sala encaja según el
   número de personas, qué horario y qué catering. Si solo cambiara el
   titular, Google las trataría como páginas "puerta" (doorway pages) y
   las ignoraría o penalizaría.

   Las cifras (capacidades, precios) NO se escriben aquí: las calcula
   PaginaUso con los datos de Supabase. Aquí solo va el texto.

   OJO con lo que se promete. Todo lo que se diga tiene que ser verdad
   en el hotel: si algo cambia (horarios, equipamiento), revisar aquí.

   `montajes`: tipos de room_layouts recomendados, en orden de
   preferencia. Tienen que coincidir con los del panel
   (teatro, escuela, u, imperial).

   `orden`: cómo ordenar las salas en la tabla.
     'capacidad' → de mayor a menor aforo
     'tamano'    → de menor a mayor superficie
   ───────────────────────────────────────────────────────────────────── */

export const USOS = [
  {
    slug: 'formaciones',
    ruta: '/sala-formacion-madrid',
    etiqueta: 'Formaciones y cursos',
    h1: 'Sala para formaciones y cursos en Madrid centro',
    seoTitulo: 'Sala para formaciones y cursos en Madrid centro | Suites Viena',
    seoDescripcion: ({ capacidad, desde }) =>
      'Alquiler de sala para formaciones, cursos y talleres junto a Plaza de España. ' +
      `Montaje escuela${capacidad ? ` hasta ${capacidad} alumnos` : ''}, proyector, ` +
      `flipchart y coffee break.${desde ? ` Desde ${desde} € media jornada.` : ''}`,
    intro: [
      'Una formación funciona cuando nadie está pendiente de la sala: los alumnos ven la pantalla desde cualquier sitio, tienen mesa para tomar notas y la conexión no se cae a mitad de la demo.',
      'Nuestras salas están en el centro de Madrid, a cinco minutos de Plaza de España, y se alquilan por media jornada o jornada completa con el equipamiento incluido.',
    ],
    montajes: ['escuela', 'u'],
    montajeTexto:
      'Para cursos con ordenador o mucha toma de notas, el montaje escuela (filas de mesas mirando a la pantalla) es el que más aprovecha el espacio. Para talleres participativos o grupos pequeños, el montaje en U deja al formador en el centro y facilita que todos se vean.',
    orden: 'capacidad',
    horario:
      'Para cursos de un día, la jornada completa (9:00–20:00) permite empezar a primera hora y cerrar con calma. Si la formación es de cuatro o cinco horas, la media jornada de mañana (9:00–14:00) suele ser suficiente y sale más económica. Para cursos de varios días, se reserva cada fecha en el mismo proceso.',
    catering:
      'En formaciones largas, un coffee break a media mañana marca la diferencia en la atención de la segunda parte. Si la sesión es de día completo, se puede añadir menú para los asistentes y evitar que el grupo se disperse a la hora de comer.',
    incluido: ['wifi', 'proyector', 'pantalla', 'flipchart', 'material', 'agua'],
    preguntas: [
      {
        p: '¿Puedo reservar la misma sala varios días seguidos?',
        r: 'Sí. En el proceso de reserva se pueden añadir varias fechas, cada una con su jornada y su montaje.',
      },
      {
        p: '¿Qué montaje elijo para un curso con portátiles?',
        r: 'El de escuela: cada alumno tiene mesa propia orientada hacia la pantalla. Si el grupo es pequeño y quieres más interacción, el montaje en U también deja sitio para trabajar con el portátil.',
      },
      {
        p: '¿Está incluido el flipchart?',
        r: 'Sí. Todas las salas incluyen flipchart, proyector, pantalla, WiFi, agua y material de oficina.',
      },
    ],
  },

  {
    slug: 'presentaciones',
    ruta: '/sala-presentaciones-madrid',
    etiqueta: 'Presentaciones de producto',
    h1: 'Sala para presentaciones de producto en Madrid centro',
    seoTitulo: 'Sala para presentaciones de producto en Madrid | Suites Viena',
    seoDescripcion: ({ capacidad, desde }) =>
      'Alquiler de sala para presentaciones de producto, lanzamientos y eventos de empresa junto a Plaza de España. ' +
      `Montaje teatro${capacidad ? ` hasta ${capacidad} personas` : ''}, proyector y catering.` +
      `${desde ? ` Desde ${desde} €.` : ''}`,
    intro: [
      'En una presentación, el sitio también comunica. Una sala luminosa en pleno centro de Madrid, fácil de encontrar para los invitados y con todo preparado al llegar, deja el protagonismo al producto.',
      'Las salas de Suites Viena están junto a Plaza de España, con buenas conexiones de metro, y se alquilan con proyector y pantalla incluidos.',
    ],
    montajes: ['teatro', 'imperial'],
    montajeTexto:
      'Para presentar ante un público, el montaje teatro (filas de sillas mirando al ponente) es el que admite más asistentes. Si la presentación es para un grupo reducido de clientes o prensa, el montaje imperial (una mesa grande compartida) crea un ambiente más cercano y favorece la conversación posterior.',
    orden: 'capacidad',
    horario:
      'Una presentación suele caber en media jornada. La de mañana (9:00–14:00) deja margen para montar, presentar y atender a los asistentes; la de tarde (15:00–20:00) encaja bien si quieres terminar con un cóctel o un networking.',
    catering:
      'Un coffee break al final de la presentación da tiempo a que los asistentes prueben el producto y hablen con tu equipo. El catering es propio del hotel y se añade al hacer la reserva.',
    incluido: ['proyector', 'pantalla', 'wifi', 'agua'],
    preguntas: [
      {
        p: '¿Cuántas personas caben en la sala más grande?',
        r: 'Depende del montaje. En la tabla de esta página tienes el aforo máximo de cada sala en teatro, que es el formato con más capacidad.',
      },
      {
        p: '¿Puedo conectar mi portátil al proyector?',
        r: 'Todas las salas tienen proyector y pantalla. Si tu equipo necesita un adaptador concreto, conviene traerlo o consultarlo con el hotel antes del evento.',
      },
      {
        p: '¿Se puede hacer la presentación por la tarde?',
        r: 'Sí. La media jornada de tarde va de 15:00 a 20:00 y tiene el mismo precio que la de mañana.',
      },
    ],
  },

  {
    slug: 'entrevistas',
    ruta: '/sala-entrevistas-madrid',
    etiqueta: 'Entrevistas y selección',
    h1: 'Sala para entrevistas de trabajo en Madrid centro',
    seoTitulo: 'Sala para entrevistas de trabajo y selección en Madrid | Suites Viena',
    seoDescripcion: ({ desde }) =>
      'Alquiler de sala para entrevistas de trabajo, procesos de selección y dinámicas de grupo en Madrid centro, junto a Plaza de España.' +
      `${desde ? ` Desde ${desde} € media jornada.` : ''} Reserva online.`,
    intro: [
      'Entrevistar en una cafetería o en una oficina compartida no da buena imagen ni garantiza discreción. Una sala privada en el centro de Madrid, fácil de encontrar para los candidatos, resuelve las dos cosas.',
      'Se alquila por media jornada, así que puedes encadenar varias entrevistas en la misma mañana o la misma tarde sin pagar por horas sueltas.',
    ],
    montajes: ['imperial', 'u'],
    montajeTexto:
      'Para entrevistas individuales o con un pequeño tribunal, el montaje imperial (una mesa compartida) es el más natural. Para dinámicas de grupo, el montaje en U permite observar a todos los candidatos a la vez.',
    orden: 'tamano',
    horario:
      'Con la media jornada de mañana (9:00–14:00) o de tarde (15:00–20:00) caben cómodamente cuatro o cinco entrevistas de una hora con descansos entre ellas. Si el proceso es largo o incluye dinámicas, la jornada completa (9:00–20:00) da margen para todo.',
    catering:
      'El agua está incluida. Si las entrevistas se alargan o hay dinámica de grupo, un coffee break ayuda a que los candidatos lleguen relajados a la siguiente fase.',
    incluido: ['wifi', 'agua', 'material', 'pantalla'],
    preguntas: [
      {
        p: '¿Qué sala es mejor para entrevistas individuales?',
        r: 'La más pequeña suele ser la más adecuada: es más acogedora y más económica. En la tabla de esta página están ordenadas de menor a mayor.',
      },
      {
        p: '¿Dónde esperan los candidatos?',
        r: 'La sala está en el propio hotel. Para organizar la espera entre entrevistas, lo mejor es comentarlo con el hotel al hacer la reserva.',
      },
      {
        p: '¿Se puede reservar solo una hora?',
        r: 'La reserva mínima es de media jornada (cinco horas). Por eso resulta práctica para concentrar varias entrevistas el mismo día.',
      },
    ],
  },

  {
    slug: 'juntas',
    ruta: '/sala-juntas-madrid',
    etiqueta: 'Juntas y consejos',
    h1: 'Sala para juntas en Madrid centro: accionistas, consejos y propietarios',
    seoTitulo: 'Sala para juntas de accionistas y propietarios en Madrid | Suites Viena',
    seoDescripcion: ({ capacidad, desde }) =>
      'Sala para juntas de accionistas, consejos de administración y juntas de comunidad de propietarios en Madrid centro. ' +
      `${capacidad ? `Hasta ${capacidad} asistentes. ` : ''}${desde ? `Desde ${desde} €. ` : ''}Junto a Plaza de España.`,
    intro: [
      'Una junta necesita un espacio neutral, tranquilo y fácil de encontrar para todos los convocados. Una sala de hotel en el centro de Madrid cumple las tres cosas y evita tener que improvisar en un despacho o en el portal.',
      'Alquilamos salas para juntas de accionistas, consejos de administración y juntas de comunidades de propietarios, con el equipamiento incluido y a un paso de Plaza de España.',
    ],
    montajes: ['imperial', 'teatro'],
    montajeTexto:
      'Para un consejo o una junta con pocos asistentes, el montaje imperial reúne a todos en torno a una misma mesa. Para juntas más numerosas, como las de una comunidad de propietarios, el montaje teatro da asiento a más personas mirando a la mesa de presidencia.',
    orden: 'capacidad',
    horario:
      'La mayoría de las juntas caben en media jornada. Las de comunidades de propietarios suelen celebrarse por la tarde, y la media jornada de tarde (15:00–20:00) cubre también la segunda convocatoria.',
    catering:
      'El agua para los asistentes está incluida. Para consejos o juntas largas se puede añadir un coffee break.',
    incluido: ['wifi', 'proyector', 'pantalla', 'agua', 'material'],
    preguntas: [
      {
        p: '¿Qué dirección pongo en la convocatoria?',
        r: 'Suites Viena Plaza de España, C/ Juan Álvarez Mendizábal, 17, 28008 Madrid. Metro Ventura Rodríguez, Plaza de España o Argüelles.',
      },
      {
        p: '¿Cabe la primera y la segunda convocatoria en la misma reserva?',
        r: 'Sí, si las dos caen dentro de la misma jornada. La media jornada de tarde va de 15:00 a 20:00.',
      },
      {
        p: '¿Cuántos propietarios caben?',
        r: 'Depende de la sala y del montaje. En la tabla de esta página tienes el aforo de cada una; para juntas numerosas, el montaje teatro es el de mayor capacidad.',
      },
    ],
  },
]

export const usoPorRuta = (ruta) => USOS.find(u => u.ruta === ruta) || null

/** Salas ordenadas para un uso, con su aforo en los montajes
 *  recomendados, y los dos datos que usan título y descripción. */
export function resumenUso(hotel, uso) {
  const filas = (hotel?.rooms || []).map(sala => {
    const montajes = uso.montajes
      .map(tipo => (sala.layouts || []).find(l => l.type === tipo))
      .filter(Boolean)
    const aforo = Math.max(0, ...montajes.map(l => l.max || 0))
    return { sala, montajes, aforo }
  })

  filas.sort((a, b) =>
    uso.orden === 'tamano'
      ? (a.sala.size || 0) - (b.sala.size || 0)
      : b.aforo - a.aforo
  )

  const conMontaje = filas.filter(f => f.montajes.length > 0)
  const precios = conMontaje.map(f => f.sala.pricing?.halfDay).filter(Boolean)

  return {
    filas,
    capacidad: Math.max(0, ...conMontaje.map(f => f.aforo)) || null,
    desde: precios.length ? Math.min(...precios) : null,
  }
}