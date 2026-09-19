/* ─────────────────────────────────────────────────────────────────────
   PREGUNTAS FRECUENTES

   Fuente única. De aquí salen dos cosas a la vez:

     · El acordeón que ve el cliente.
     · El JSON-LD de tipo FAQPage que lee Google.

   Tienen que decir EXACTAMENTE lo mismo. Google marca el marcado como
   no válido si la respuesta del schema no aparece también en la página
   visible, así que no puede haber dos listas separadas que alguien
   actualice a medias.

   Las cifras no están escritas a mano: salen de `hotel`, o sea de
   Supabase. Si mañana se sube un precio desde el panel, la respuesta y
   el schema cambian solos. Lo único fijo es lo que no depende de la
   base de datos (dónde está el hotel, cómo funciona la reserva).

   A futuro, si el hotel quiere redactar sus propias preguntas desde el
   panel, esto se convierte en una tabla `faqs` y la función se queda
   como respaldo. Con seis preguntas estables, un fichero basta.
   ───────────────────────────────────────────────────────────────────── */

/* 190 → "190 €", 16.8 → "16,80 €". Sin esto, toLocaleString se come el
   cero final y el precio del menú salía como "16,8 €". */
const eur = (n) => {
  const v = Number(n)
  const decimales = Number.isInteger(v) ? 0 : 2
  return `${v.toLocaleString('es-ES', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })} €`
}

/** Lista de salas en texto: "Capellanes (27 m²), Viena (34 m²) y …" */
function enumerar(partes) {
  if (partes.length === 0) return ''
  if (partes.length === 1) return partes[0]
  return `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`
}

/**
 * @param {object} hotel El objeto que devuelve useHotelData
 * @returns {{id: string, pregunta: string, respuesta: string}[]}
 */
export function construirFaq(hotel) {
  const salas = hotel?.rooms || []
  const extras = (hotel?.extras || []).filter(e => e.isActive)

  const preguntas = []

  /* ── Precio ── */
  if (salas.length > 0) {
    const porPrecio = [...salas].sort(
      (a, b) => (a.pricing?.halfDay || 0) - (b.pricing?.halfDay || 0)
    )
    const detalle = enumerar(
      porPrecio.map(r => `${r.name} (${r.size} m²) desde ${eur(r.pricing.halfDay)}`)
    )
    const minima = porPrecio[0]?.pricing?.halfDay

    preguntas.push({
      id: 'precio',
      pregunta: '¿Cuánto cuesta alquilar una sala de reuniones en Madrid centro?',
      respuesta:
        `Las salas empiezan en ${eur(minima)} la media jornada, IVA incluido. ` +
        `El precio depende del espacio: ${detalle}. ` +
        `La jornada completa tiene su propia tarifa y la ves al elegir la sala.`,
    })
  }

  /* ── Qué incluye ── */
  preguntas.push({
    id: 'incluye',
    pregunta: '¿Qué incluye el alquiler de la sala?',
    respuesta:
      'WiFi de alta velocidad, proyector, pantalla, flipchart, agua y material de oficina, ' +
      'sin coste añadido. El montaje lo preparamos nosotros en la configuración que ' +
      'necesites: imperial, en U, escuela o teatro.',
  })

  /* ── Capacidad ── */
  if (salas.length > 0) {
    const conMax = salas.map(r => ({
      nombre: r.name,
      max: Math.max(...(r.layouts || []).map(l => l.max), 0),
    }))
    const tope = Math.max(...conMax.map(r => r.max))
    /* Entre paréntesis y no con coma: los nombres ya se separan por
       comas al enumerarlos y "Sala Viena, hasta 25, Sala Capellanes"
       era imposible de leer. */
    const detalle = enumerar(
      [...conMax].sort((a, b) => b.max - a.max).map(r => `${r.nombre} (${r.max})`)
    )

    preguntas.push({
      id: 'capacidad',
      pregunta: '¿Para cuántas personas hay sitio?',
      respuesta:
        `Hasta ${tope} personas en configuración teatro, que es la que más gente admite. ` +
        `Por sala, en teatro: ${detalle}. En montaje imperial o en U caben menos, porque cada ` +
        'asistente ocupa un puesto de mesa.',
    })
  }

  /* ── Media jornada ── */
  preguntas.push({
    id: 'jornadas',
    pregunta: '¿Puedo alquilar la sala solo unas horas?',
    respuesta:
      'Sí. Puedes reservar media jornada de mañana, de 9:00 a 14:00, o de tarde, ' +
      'de 15:00 a 20:00. La jornada completa va de 9:00 a 20:00 y sale más a cuenta ' +
      'que dos medias.',
  })

  /* ── Catering ── */
  if (extras.length > 0) {
    const coffee = extras.filter(e => e.category === 'coffee')
    const menus = extras.filter(e => e.category === 'menu')
    const minDe = (lista) => Math.min(...lista.map(e => e.pricePerPerson))

    const partes = []
    if (coffee.length > 0) partes.push(`coffee breaks desde ${eur(minDe(coffee))} por persona`)
    if (menus.length > 0) partes.push(`menús desde ${eur(minDe(menus))} por persona`)

    preguntas.push({
      id: 'catering',
      pregunta: '¿Hay servicio de catering?',
      respuesta:
        partes.length > 0
          ? `Sí, con cocina propia del hotel: ${enumerar(partes)}. Se añaden durante ` +
            'la reserva, así que ves el total antes de confirmar nada.'
          : 'Sí, con cocina propia del hotel. Los coffee breaks y los menús se añaden ' +
            'durante la reserva, así que ves el total antes de confirmar nada.',
    })
  }

  /* ── Dónde ── */
  preguntas.push({
    id: 'donde',
    pregunta: '¿Dónde están las salas exactamente?',
    respuesta:
      `${hotel?.address || 'C/ Juan Álvarez Mendizábal, 17, 28008 Madrid'}. ` +
      'Estamos a un paso de Plaza de España y del Templo de Debod, con las estaciones ' +
      'de metro de Plaza de España, Ventura Rodríguez y Argüelles andando.',
  })

  /* ── Cómo se reserva ── */
  preguntas.push({
    id: 'reserva',
    pregunta: '¿Cómo se reserva?',
    respuesta:
      'Desde esta misma página: eliges la sala, el día y la jornada, añades el catering ' +
      'si lo quieres y dejas tus datos. Te llegará un email con el resumen y, como cada ' +
      'solicitud queda pendiente de confirmación, te escribiremos para cerrar los detalles. ' +
      (hotel?.phone
        ? `Si prefieres hablarlo antes, llámanos al ${hotel.phone}.`
        : 'Si prefieres hablarlo antes, llámanos.'),
  })

  return preguntas
}

/** El mismo contenido en formato schema.org, para el JSON-LD. */
export function faqJsonLd(preguntas) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: preguntas.map(p => ({
      '@type': 'Question',
      name: p.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
    })),
  }
}