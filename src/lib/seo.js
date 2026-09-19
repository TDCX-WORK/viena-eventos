/* ─────────────────────────────────────────────────────────────────────
   Datos estructurados del negocio (schema.org), generados en el build.

   Antes estaban escritos a mano en index.html y había que acordarse de
   cambiarlos cada vez que se tocaba una tarifa. Ahora las salas, los
   precios, los metros y las capacidades salen de Supabase en cada
   despliegue.

   Lo fijo (dirección, coordenadas, horario) va aquí abajo. Las FAQ NO
   van aquí: las genera el componente Faq junto al acordeón.
   ───────────────────────────────────────────────────────────────────── */

export const DOMINIO = 'https://suitesvienaeventos.com'

/* ── URLs ──────────────────────────────────────────────────────────── */

/** Ruta de la ficha de una sala. Sin barra final: Cloudflare sirve
 *  dist/salas/viena.html en /salas/viena. */
export const rutaSala = (slug) => `/salas/${slug}`

/* ── Cabeceras (title, description, canonical) ─────────────────────────
   Una sola fuente para el build (scripts/prerender.js las escribe en el
   HTML) y para el navegador (useCabecera las actualiza al navegar sin
   recargar). */

export function cabeceraPortada(hotel) {
  const salas = hotel?.rooms || []
  const tam = salas.map(r => r.size).filter(Boolean)
  const precios = salas.map(r => r.pricing?.halfDay).filter(Boolean)

  const espacios = tam.length
    ? `${salas.length} espacios de ${Math.min(...tam)} a ${Math.max(...tam)} m²`
    : 'Espacios'
  const desde = precios.length ? ` Desde ${Math.min(...precios)} €/media jornada.` : ''

  return {
    titulo: 'Salas de Reuniones en Madrid Centro | Suites Viena Plaza de España',
    descripcion:
      'Alquiler de salas de reuniones en Madrid centro, junto a Plaza de España. ' +
      `${espacios} con luz natural, WiFi, proyector y catering.${desde} Reserva online.`,
    ruta: '/',
  }
}

export const capacidadSala = (sala) =>
  Math.max(0, ...(sala.layouts || []).map(l => l.max || 0))

export function cabeceraSala(sala) {
  const luz = sala.naturalLight ? ' con luz natural' : ''
  const pax = capacidadSala(sala)
  return {
    titulo: `${sala.name}: sala de reuniones de ${sala.size} m² en Madrid | Suites Viena`,
    descripcion:
      `${sala.name}, sala de reuniones de ${sala.size} m²${luz} junto a Plaza de España, Madrid. ` +
      (pax ? `Hasta ${pax} personas. ` : '') +
      `Desde ${sala.pricing.halfDay} € media jornada, IVA incluido. Reserva online.`,
    ruta: rutaSala(sala.slug),
  }
}

const NEGOCIO = {
  nombre: 'Suites Viena Plaza de España',
  telefono: '+34917583605',
  email: 'reservas@suitesviena.es',
  webHotel: 'https://www.suitesviena.com',
  direccion: {
    '@type': 'PostalAddress',
    streetAddress: 'C/ Juan Álvarez Mendizábal, 17',
    addressLocality: 'Madrid',
    addressRegion: 'Comunidad de Madrid',
    postalCode: '28008',
    addressCountry: 'ES',
  },
  lat: 40.425055,
  lng: -3.714941,
}

const rasgo = (name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })

const precio = (name, price, unitText, currency) => ({
  '@type': 'UnitPriceSpecification',
  name,
  price,
  priceCurrency: currency,
  valueAddedTaxIncluded: true,
  unitText,
})

/** schema.org usa ISO 4217; el panel guarda el símbolo. */
const moneda = (c) => (!c || c === '€' ? 'EUR' : c)

export function jsonLdNegocio(hotel) {
  const salas = hotel.rooms || []
  const capacidad = capacidadSala

  const medias = salas.map(r => r.pricing.halfDay).filter(Boolean)
  const completas = salas.map(r => r.pricing.fullDay).filter(Boolean)
  const cur = moneda(salas[0]?.pricing?.currency)

  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EventVenue'],
    '@id': `${DOMINIO}/#negocio`,
    name: NEGOCIO.nombre,
    alternateName: `Salas de reuniones ${NEGOCIO.nombre}`,
    description:
      'Alquiler de salas de reuniones en Madrid centro, junto a Plaza de España. ' +
      'Espacios equipados con WiFi, proyector, pantalla y servicio de catering.',
    url: DOMINIO,
    telephone: NEGOCIO.telefono,
    email: NEGOCIO.email,
    image: [`${DOMINIO}/og-image.jpg`, `${DOMINIO}/hero-2000.webp`],
    logo: `${DOMINIO}/favicon.svg`,
    sameAs: [NEGOCIO.webHotel],
    address: NEGOCIO.direccion,
    geo: { '@type': 'GeoCoordinates', latitude: NEGOCIO.lat, longitude: NEGOCIO.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${NEGOCIO.lat},${NEGOCIO.lng}`,
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    }],
    ...(medias.length && completas.length
      ? { priceRange: `${Math.min(...medias)} € – ${Math.max(...completas)} €` }
      : {}),
    currenciesAccepted: 'EUR',
    paymentAccepted: 'Transferencia, Tarjeta',
    areaServed: { '@type': 'City', name: 'Madrid' },
    amenityFeature: [
      rasgo('WiFi de alta velocidad'),
      rasgo('Proyector y pantalla'),
      rasgo('Catering propio'),
      ...(salas.some(r => r.naturalLight) ? [rasgo('Luz natural')] : []),
    ],
    maximumAttendeeCapacity: Math.max(0, ...salas.map(capacidad)),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Salas de reuniones',
      itemListElement: salas.map(r => ({
        '@type': 'Offer',
        price: r.pricing.halfDay,
        priceCurrency: moneda(r.pricing.currency),
        availability: 'https://schema.org/InStock',
        url: `${DOMINIO}${rutaSala(r.slug)}`,
        itemOffered: {
          '@type': 'MeetingRoom',
          name: r.name,
          ...(r.description ? { description: r.description } : {}),
          maximumAttendeeCapacity: capacidad(r),
          floorSize: { '@type': 'QuantitativeValue', value: r.size, unitCode: 'MTK' },
          amenityFeature: [
            rasgo('WiFi'),
            rasgo('Proyector'),
            rasgo('Pantalla'),
            ...(r.naturalLight ? [rasgo('Luz natural')] : []),
          ],
        },
        priceSpecification: [
          precio('Media jornada', r.pricing.halfDay, 'media jornada', cur),
          precio('Jornada completa', r.pricing.fullDay, 'jornada completa', cur),
        ],
      })),
    },
  }
}

export function cabeceraUso(uso, resumen) {
  return {
    titulo: uso.seoTitulo,
    descripcion: uso.seoDescripcion(resumen),
    ruta: uso.ruta,
  }
}

/** Migas de pan de dos niveles: portada › página. */
export function jsonLdMigas(nombre, ruta) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Salas de reuniones', item: `${DOMINIO}/` },
      { '@type': 'ListItem', position: 2, name: nombre, item: `${DOMINIO}${ruta}` },
    ],
  }
}

/* ── Ficha de sala: migas de pan + la sala ─────────────────────────── */

export function jsonLdSala(hotel, sala) {
  const url = `${DOMINIO}${rutaSala(sala.slug)}`
  return [
    jsonLdMigas(sala.name, rutaSala(sala.slug)),
    {
      '@context': 'https://schema.org',
      '@type': 'MeetingRoom',
      '@id': `${url}#sala`,
      name: sala.name,
      url,
      ...(sala.description ? { description: sala.description } : {}),
      ...(sala.images?.length ? { image: sala.images } : {}),
      floorSize: { '@type': 'QuantitativeValue', value: sala.size, unitCode: 'MTK' },
      maximumAttendeeCapacity: capacidadSala(sala),
      address: NEGOCIO.direccion,
      amenityFeature: [
        rasgo('WiFi'),
        rasgo('Proyector'),
        rasgo('Pantalla'),
        ...(sala.naturalLight ? [rasgo('Luz natural')] : []),
      ],
      containedInPlace: {
        '@type': ['LocalBusiness', 'EventVenue'],
        '@id': `${DOMINIO}/#negocio`,
        name: NEGOCIO.nombre,
        url: DOMINIO,
        telephone: NEGOCIO.telefono,
        address: NEGOCIO.direccion,
      },
    },
  ]
}