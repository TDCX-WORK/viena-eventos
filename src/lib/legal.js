/* ─────────────────────────────────────────────────────────────────────
   TEXTOS LEGALES — BORRADOR PENDIENTE DE REVISIÓN JURÍDICA

   ⚠️ NADA DE ESTE FICHERO LO HA ESCRITO UN ABOGADO. Es un borrador
   técnico: describe con exactitud lo que la web hace con los datos
   (qué se pide, dónde se guarda, quién lo ve, cuánto dura) para que el
   asesor jurídico tenga algo concreto encima de la mesa en vez de una
   plantilla genérica.

   MIENTRAS `BORRADOR` SEA true, las cuatro páginas salen con un cartel
   rojo arriba y con `noindex`: ni Google las ve ni un cliente las
   confunde con el documento bueno. Cuando el abogado devuelva el texto
   definitivo, se corrigen los párrafos, se ponen a false las dos
   banderas y se despliega.

   LOS HUECOS van entre dobles llaves: {{así}}. PaginaLegal los pinta
   resaltados en amarillo. Son las decisiones que no me corresponden a
   mí: plazos, si se firma el contrato de encargado con tal proveedor,
   si hay o no transferencia internacional. Si al desplegar queda
   alguno sin rellenar se ve a la legua, que es justo la idea.

   LOS DATOS DE LA SOCIEDAD (denominación, CIF, domicilio, registro)
   están copiados del aviso legal y de la política de privacidad de
   www.suitesviena.com, que es la misma sociedad. Si allí cambian,
   aquí también.
   ───────────────────────────────────────────────────────────────────── */

/** Cartel de borrador + noindex. Las dos a false para publicar de verdad. */
export const BORRADOR = true

/** Fecha que se enseña como "última actualización". */
export const ACTUALIZADO = '{{fecha de aprobación}}'

/* ── Datos del responsable ────────────────────────────────────────────
   Una sola copia: la usan los cuatro documentos y el bloque informativo
   del formulario de reserva. */
export const TITULAR = {
  denominacion: 'Suites Viena, S.L.',
  nombreComercial: 'Suites Viena Plaza de España',
  cif: 'B85096618',
  domicilio: 'C/ Juan Álvarez Mendizábal, 17 — 28008 Madrid (España)',
  registro:
    'Registro Mercantil de Madrid, tomo 24379, folio 41, sección 8, ' +
    'hoja M-438481, inscripción 1ª',
  email: 'reservas@suitesviena.es',
  emailProteccionDatos: 'responsable.p.d@suitesviena.es',
  telefono: '+34 917 583 605',
  webHotel: 'https://www.suitesviena.com',
  dominio: 'suitesvienaeventos.com',
}

/* ── Bloque informativo del formulario (capa 1 del RGPD) ──────────────
   Lo pinta StepContacto junto a la casilla. El RGPD pide que la
   información básica esté a la vista en el momento de recoger los
   datos, no solo a un clic de distancia. */
export const CAPA_1 = [
  ['Responsable', `${TITULAR.denominacion} (${TITULAR.cif})`],
  ['Finalidad', 'Gestionar tu solicitud de reserva de sala y responderte.'],
  ['Legitimación', 'Tu consentimiento al marcar la casilla.'],
  ['Destinatarios', 'Proveedores tecnológicos que alojan la web, la base de datos y el envío de correo.'],
  ['Derechos', 'Acceder, rectificar y suprimir los datos, entre otros, escribiendo a ' + TITULAR.emailProteccionDatos + '.'],
]

/* ── Documentos ───────────────────────────────────────────────────────
   Cada sección: { h, bloques: [...] }.
   Tipos de bloque: 'p' (párrafo), 'lista', 'tabla' ([clave, valor]),
   'sub' (subapartado con su propio título y bloques). */

const AVISO_LEGAL = {
  slug: 'aviso-legal',
  ruta: '/aviso-legal',
  titulo: 'Aviso legal',
  seoTitulo: 'Aviso legal | Suites Viena Plaza de España',
  seoDescripcion:
    'Aviso legal y condiciones de uso de suitesvienaeventos.com, web de alquiler de salas de reuniones de Suites Viena Plaza de España.',
  entradilla:
    'Información exigida por el artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE).',
  secciones: [
    {
      h: 'Titular de la web',
      bloques: [
        {
          tipo: 'p',
          texto:
            `El titular de ${TITULAR.dominio} es ${TITULAR.denominacion}, la misma sociedad que explota el hotel ` +
            `${TITULAR.nombreComercial}. Esta web se dedica en exclusiva al alquiler de sus salas de reuniones; la web del hotel, ` +
            `donde se reservan las habitaciones, es otra distinta.`,
        },
        {
          tipo: 'tabla',
          filas: [
            ['Denominación social', TITULAR.denominacion],
            ['CIF', TITULAR.cif],
            ['Domicilio social', TITULAR.domicilio],
            ['Datos registrales', TITULAR.registro],
            ['Correo electrónico', TITULAR.email],
            ['Teléfono', TITULAR.telefono],
            ['Actividad', 'Servicios de hostelería y alquiler de espacios para eventos'],
          ],
        },
      ],
    },
    {
      h: 'Objeto y condiciones de uso',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Navegar por esta web otorga la condición de usuario e implica aceptar este aviso legal en su totalidad. ' +
            'Si no estás de acuerdo con alguna de sus cláusulas, te pedimos que no utilices la web.',
        },
        {
          tipo: 'p',
          texto:
            'El usuario se compromete a utilizar la web conforme a la ley y a este aviso legal, y a no emplearla con fines ' +
            'ilícitos, ni de forma que pueda dañar, sobrecargar o impedir su funcionamiento normal.',
        },
        {
          tipo: 'p',
          texto:
            'Este aviso legal puede modificarse sin previo aviso. La versión aplicable es la publicada en el momento de acceder a la web.',
        },
      ],
    },
    {
      h: 'Precios y disponibilidad',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Los precios, capacidades, medidas y disponibilidad que aparecen en la web son informativos y pueden cambiar. ' +
            'Enviar el formulario de reserva no supone la confirmación de ninguna reserva: es una solicitud que el hotel ' +
            'revisa y confirma expresamente. Las condiciones aplicables son las que el hotel comunique al confirmar.',
        },
        {
          tipo: 'p',
          texto:
            'Salvo que se indique lo contrario, los precios publicados incluyen IVA. {{Confirmar si es así en todos los ' +
            'casos y si procede alguna mención sobre el IVA para empresas o facturación.}}',
        },
      ],
    },
    {
      h: 'Propiedad intelectual e industrial',
      bloques: [
        {
          tipo: 'p',
          texto:
            `Los textos, fotografías, planos, iconos, código fuente, diseño y demás contenidos de esta web son titularidad de ` +
            `${TITULAR.denominacion} o de terceros que han autorizado su uso. Queda prohibida su reproducción, distribución o ` +
            `transformación sin autorización escrita.`,
        },
        {
          tipo: 'p',
          texto:
            'El mapa de la sección "Cómo llegar" se ha elaborado a partir de datos de OpenStreetMap, disponibles bajo la ' +
            'licencia ODbL de la OpenStreetMap Foundation.',
        },
        {
          tipo: 'p',
          texto:
            'Las tipografías Inter y Playfair Display se utilizan bajo licencia SIL Open Font License 1.1 y se sirven desde ' +
            'este mismo dominio.',
        },
      ],
    },
    {
      h: 'Responsabilidad',
      bloques: [
        {
          tipo: 'p',
          texto:
            'El titular hace lo posible por mantener la web disponible y actualizada, pero no garantiza la ausencia de ' +
            'interrupciones ni de errores, ni se responsabiliza de los daños que pudieran derivarse de ellos.',
        },
        {
          tipo: 'p',
          texto:
            'La web contiene enlaces a sitios de terceros (Google Maps, WhatsApp y la web del hotel, entre otros). ' +
            'El titular no controla esos sitios ni responde de sus contenidos ni de sus políticas de privacidad.',
        },
      ],
    },
    {
      h: 'Legislación aplicable',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Este aviso legal se rige por la ley española. {{Indicar si se somete a unos juzgados concretos y si se ' +
            'distingue entre usuarios consumidores y empresas, ya que el alquiler de salas es casi siempre B2B.}}',
        },
      ],
    },
  ],
}

const PRIVACIDAD = {
  slug: 'politica-privacidad',
  ruta: '/politica-privacidad',
  titulo: 'Política de privacidad',
  seoTitulo: 'Política de privacidad | Suites Viena Plaza de España',
  seoDescripcion:
    'Cómo trata Suites Viena, S.L. los datos personales que se recogen en suitesvienaeventos.com: finalidad, base jurídica, destinatarios, plazos y derechos.',
  entradilla:
    'Esta política explica qué hacemos con los datos personales que nos facilitas en esta web, que es la de alquiler de salas de reuniones. La web del hotel tiene su propia política.',
  secciones: [
    {
      h: '1. Responsable del tratamiento',
      bloques: [
        {
          tipo: 'tabla',
          filas: [
            ['Responsable', `${TITULAR.denominacion} (${TITULAR.cif})`],
            ['Domicilio', TITULAR.domicilio],
            ['Correo electrónico', TITULAR.email],
            ['Teléfono', TITULAR.telefono],
            ['Contacto en protección de datos', TITULAR.emailProteccionDatos],
            ['Delegado de protección de datos', '{{Indicar si hay DPD designado y sus datos, o suprimir esta fila.}}'],
          ],
        },
        {
          tipo: 'p',
          texto:
            'El responsable es la misma sociedad que la de www.suitesviena.com. Esta política se refiere únicamente a los ' +
            'tratamientos que se realizan a través de esta web de salas, que usa una tecnología y unos proveedores distintos ' +
            'a los de la web del hotel.',
        },
      ],
    },
    {
      h: '2. Solicitud de reserva de sala',
      bloques: [
        {
          tipo: 'sub',
          h: 'Qué datos tratamos',
          bloques: [
            {
              tipo: 'lista',
              elementos: [
                'Nombre y apellidos.',
                'Correo electrónico.',
                'Teléfono.',
                'Los comentarios que escribas en el campo libre del formulario. Te pedimos que no incluyas ahí datos de salud, ideología, religión ni ninguna otra categoría especial de datos, ni datos de terceros que no te hayan autorizado.',
                'Los datos de la propia solicitud: sala, fechas, jornada, montaje, número de asistentes y extras.',
              ],
            },
          ],
        },
        {
          tipo: 'sub',
          h: 'Para qué los tratamos',
          bloques: [
            {
              tipo: 'p',
              texto:
                'Para gestionar tu solicitud de reserva: comprobar la disponibilidad, prepararte un presupuesto, contestarte ' +
                'y, si aceptas, confirmar la reserva y prestar el servicio.',
            },
            {
              tipo: 'p',
              texto:
                'No usamos tus datos para elaborar perfiles ni tomamos decisiones automatizadas sobre ti. Enviar el ' +
                'formulario no supone darte de alta en ninguna lista de correo: no mandamos comunicaciones comerciales ' +
                'a partir de estos datos.',
            },
          ],
        },
        {
          tipo: 'sub',
          h: 'Con qué legitimación',
          bloques: [
            {
              tipo: 'p',
              texto:
                'Tu consentimiento, que manifiestas al marcar la casilla de aceptación antes de enviar el formulario. ' +
                'Puedes retirarlo en cualquier momento escribiéndonos, sin que ello afecte a la licitud del tratamiento ' +
                'anterior a la retirada.',
            },
            {
              tipo: 'p',
              texto:
                'Si la solicitud acaba en una reserva confirmada, el tratamiento posterior se basa en la ejecución del ' +
                'contrato y en el cumplimiento de nuestras obligaciones legales, sobre todo las fiscales y contables.',
            },
          ],
        },
        {
          tipo: 'sub',
          h: 'Durante cuánto tiempo',
          bloques: [
            {
              tipo: 'lista',
              elementos: [
                'Si la solicitud no acaba en reserva: {{un año}} desde el último contacto entre las partes, pasado el cual se suprime.',
                'Si la solicitud acaba en reserva: {{cinco años}} desde la finalización del servicio, plazo durante el que pueden derivarse responsabilidades entre las partes.',
                'La documentación contable y las facturas se conservan el plazo que exige la normativa mercantil y fiscal, con independencia de lo anterior.',
              ],
            },
          ],
        },
        {
          tipo: 'sub',
          h: 'Es obligatorio facilitarlos',
          bloques: [
            {
              tipo: 'p',
              texto:
                'El nombre, el correo y el teléfono son necesarios para poder contestarte: sin ellos no podemos tramitar la ' +
                'solicitud. El resto de campos son voluntarios. Los datos proceden siempre de ti.',
            },
          ],
        },
      ],
    },
    {
      h: '3. Quién más ve tus datos',
      bloques: [
        {
          tipo: 'p',
          texto:
            'No vendemos ni cedemos tus datos a terceros. Sí recurrimos a proveedores tecnológicos que los tratan por ' +
            'nuestra cuenta y siguiendo nuestras instrucciones, como encargados del tratamiento, con los contratos que exige ' +
            'el artículo 28 del RGPD:',
        },
        {
          tipo: 'tabla',
          filas: [
            [
              'Supabase',
              'Base de datos donde se guarda la solicitud. El proyecto está alojado en la región de Irlanda, dentro de la ' +
              'Unión Europea, donde se almacenan y se tratan principalmente los datos. La sociedad que presta el servicio ' +
              'es Supabase Pte. Ltd., con domicilio en Singapur, y las transferencias se amparan en las cláusulas ' +
              'contractuales tipo aprobadas por la Comisión Europea, incorporadas a su contrato de encargado ' +
              '(versión 1, de 1 de agosto de 2026).',
            ],
            [
              'EmailJS',
              'Servicio que envía el correo con tu solicitud al hotel y el de confirmación a tu dirección. La sociedad es ' +
              'EmailJS Pte Ltd y los datos se transfieren a Estados Unidos. {{Proveedor pendiente de sustitución: ver el ' +
              'apartado correspondiente del documento de decisiones. Si se sustituye por un proveedor europeo, esta fila ' +
              'y el apartado 4 se rehacen.}}',
            ],
            [
              'Cloudflare',
              'Alojamiento y distribución de la web. Cloudflare, Inc. está adherida al Marco de Privacidad de Datos ' +
              'UE-EE. UU. (Data Privacy Framework), que cuenta con decisión de adecuación de la Comisión Europea, ' +
              'conforme a su contrato de encargado (versión 6.4, de 3 de abril de 2026).',
            ],
            [
              'Servicio de correo del hotel',
              'El correo con tu solicitud llega a los buzones del personal que gestiona las salas. ' +
              '{{Indicar el proveedor de correo del hotel.}}',
            ],
          ],
        },
        {
          tipo: 'p',
          texto:
            'Además, podríamos comunicar tus datos a la Administración, a los cuerpos y fuerzas de seguridad o a los ' +
            'tribunales cuando una norma nos obligue, y a nuestra asesoría en lo que resulte necesario para la facturación.',
        },
      ],
    },
    {
      h: '4. Transferencias internacionales',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Los datos de tu solicitud se almacenan y se tratan principalmente en Irlanda, dentro de la Unión Europea. ' +
            'Cuando alguna operación implica una transferencia fuera del Espacio Económico Europeo, se ampara en alguna ' +
            'de las garantías que exige el Reglamento: el Marco de Privacidad de Datos UE-EE. UU., que cuenta con ' +
            'decisión de adecuación de la Comisión Europea, en el caso del proveedor de alojamiento, y las cláusulas ' +
            'contractuales tipo en el del proveedor de la base de datos.',
        },
        {
          tipo: 'p',
          texto:
            '{{El envío de los correos de aviso y de confirmación se realiza hoy a través de un proveedor con servidores ' +
            'en Estados Unidos cuyo contrato de encargado no incorpora las cláusulas contractuales tipo. Está previsto ' +
            'sustituirlo por un proveedor europeo; hasta entonces, este párrafo tiene que describir esa transferencia, ' +
            'y después habrá que suprimirlo.}}',
        },
      ],
    },
    {
      h: '5. Seguridad',
      bloques: [
        {
          tipo: 'p',
          texto:
            'La web se sirve siempre cifrada (HTTPS). El acceso a las solicitudes está restringido al personal autorizado ' +
            'del hotel mediante usuario y contraseña, y la base de datos aplica reglas que impiden que los datos de las ' +
            'reservas sean legibles desde el navegador de un visitante.',
        },
      ],
    },
    {
      h: '6. Tus derechos',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Puedes ejercer los derechos de acceso, rectificación, supresión, limitación del tratamiento, portabilidad y ' +
            'oposición, así como retirar el consentimiento que nos hayas dado, escribiendo a ' +
            `${TITULAR.emailProteccionDatos} o por correo postal a ${TITULAR.domicilio}, adjuntando copia de tu DNI o de otro ` +
            'documento que te identifique.',
        },
        {
          tipo: 'p',
          texto:
            'Si consideras que no hemos atendido correctamente tu solicitud, puedes reclamar ante la Agencia Española de ' +
            'Protección de Datos (www.aepd.es), que es la autoridad de control en España.',
        },
      ],
    },
    {
      h: '7. Cambios en esta política',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Podemos actualizar esta política cuando cambie la normativa o la forma en que tratamos los datos. La fecha de ' +
            'la última actualización aparece al principio del documento.',
        },
      ],
    },
  ],
}

const COOKIES = {
  slug: 'politica-cookies',
  ruta: '/politica-cookies',
  titulo: 'Política de cookies',
  seoTitulo: 'Política de cookies | Suites Viena Plaza de España',
  seoDescripcion:
    'Esta web no utiliza cookies de analítica ni de publicidad. Información sobre el almacenamiento técnico que emplea suitesvienaeventos.com.',
  entradilla:
    'Resumen: esta web no te rastrea. No usa cookies de analítica, de publicidad ni de redes sociales, y por eso no verás ningún aviso pidiéndote permiso.',
  secciones: [
    {
      h: 'Qué es una cookie',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Una cookie es un pequeño fichero que una web guarda en tu navegador. Sirve para recordar información entre ' +
            'visitas: desde una preferencia tuya hasta, en otros casos, un identificador con el que seguirte por distintos ' +
            'sitios. La normativa española solo exige pedirte permiso para las que no son estrictamente necesarias.',
        },
      ],
    },
    {
      h: 'Qué usa esta web',
      bloques: [
        {
          tipo: 'p',
          texto: 'En la parte pública de la web, la que ves como visitante, no se instala ninguna cookie:',
        },
        {
          tipo: 'lista',
          elementos: [
            'No hay Google Analytics ni ninguna otra herramienta de medición.',
            'No hay píxeles de Facebook, LinkedIn ni de ninguna plataforma publicitaria.',
            'No hay vídeos ni mapas incrustados de terceros. El mapa de "Cómo llegar" es un dibujo propio, no un mapa de Google.',
            'Las tipografías se sirven desde este mismo dominio, no desde Google Fonts.',
          ],
        },
        {
          tipo: 'p',
          texto:
            'La única excepción está en el panel de administración, en /admin, al que solo accede el personal del hotel. ' +
            'Al iniciar sesión, el navegador guarda un identificador de sesión mediante almacenamiento local del navegador. ' +
            'Es estrictamente necesario para mantener la sesión abierta, no sirve para rastrear a nadie y desaparece al ' +
            'cerrar sesión.',
        },
        {
          tipo: 'tabla',
          filas: [
            ['Nombre', 'sb-<proyecto>-auth-token'],
            ['Tipo', 'Almacenamiento local, técnico y necesario'],
            ['Finalidad', 'Mantener abierta la sesión del personal autorizado en el panel'],
            ['Titularidad', 'Propia (a través de Supabase)'],
            ['Duración', 'Hasta el cierre de sesión'],
          ],
        },
      ],
    },
    {
      h: 'Si esto cambia',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Si en el futuro se añade cualquier herramienta de medición o publicidad, se implantará antes un banner de ' +
            'consentimiento que permita aceptar, rechazar y configurar las cookies con la misma facilidad, y se actualizará ' +
            'esta página. Mientras tanto, no hay nada que configurar.',
        },
        {
          tipo: 'p',
          texto:
            'Puedes borrar o bloquear el almacenamiento de cualquier web desde la configuración de tu navegador, en el ' +
            'apartado de privacidad o de datos de navegación.',
        },
      ],
    },
  ],
}

const CONDICIONES = {
  slug: 'condiciones-reserva',
  ruta: '/condiciones-reserva',
  titulo: 'Condiciones de reserva',
  seoTitulo: 'Condiciones de reserva de salas | Suites Viena Plaza de España',
  seoDescripcion:
    'Condiciones aplicables al alquiler de las salas de reuniones de Suites Viena Plaza de España: solicitud, confirmación, pago, cancelaciones y uso de los espacios.',
  entradilla:
    'Condiciones aplicables al alquiler de las salas. Todo este documento está pendiente de que el hotel confirme sus condiciones comerciales reales.',
  secciones: [
    {
      h: '1. La solicitud no es una reserva',
      bloques: [
        {
          tipo: 'p',
          texto:
            'El formulario de esta web sirve para solicitar una sala. Al enviarlo recibirás un correo de acuse de recibo ' +
            'con un número de referencia, que confirma que la solicitud ha llegado, no que la sala esté reservada.',
        },
        {
          tipo: 'p',
          texto:
            'La reserva existe cuando el hotel la confirma expresamente, {{indicar plazo de respuesta habitual}}, y con las ' +
            'condiciones que figuren en esa confirmación.',
        },
      ],
    },
    {
      h: '2. Precios',
      bloques: [
        {
          tipo: 'p',
          texto:
            'Los precios publicados corresponden a media jornada o jornada completa según se indique, e incluyen el ' +
            'equipamiento descrito en la ficha de cada sala. {{Confirmar qué incluye exactamente el precio: horario de la ' +
            'media jornada y de la jornada completa, si el montaje va incluido, qué pasa si se excede el horario.}}',
        },
        {
          tipo: 'p',
          texto:
            'Los extras y el catering se facturan aparte, según las cantidades finalmente consumidas o contratadas. ' +
            '{{Confirmar con cuánta antelación hay que cerrar el catering y el número definitivo de asistentes.}}',
        },
        {
          tipo: 'p',
          texto: 'Todos los precios se muestran con IVA incluido. {{Confirmar.}}',
        },
      ],
    },
    {
      h: '3. Pago',
      bloques: [
        {
          tipo: 'p',
          texto:
            '{{Describir la forma de pago: si hay señal o prepago, qué porcentaje, cuándo se abona el resto, qué medios se ' +
            'aceptan y cómo se factura a empresas.}}',
        },
      ],
    },
    {
      h: '4. Cancelaciones y cambios',
      bloques: [
        {
          tipo: 'p',
          texto:
            '{{Describir la política de cancelación: hasta cuándo se cancela sin coste, qué penalización se aplica después, ' +
            'y si se permiten cambios de fecha y en qué condiciones.}}',
        },
        {
          tipo: 'p',
          texto:
            'El hotel podrá cancelar o reubicar la reserva por causas de fuerza mayor o por incidencias técnicas en la sala, ' +
            'ofreciendo un espacio equivalente o la devolución de lo abonado.',
        },
      ],
    },
    {
      h: '5. Uso de las salas',
      bloques: [
        {
          tipo: 'lista',
          elementos: [
            'El aforo máximo de cada montaje es el publicado en la ficha de la sala y no puede superarse.',
            'El cliente responde de los daños que él o sus asistentes causen en el mobiliario, el equipamiento o las instalaciones.',
            'Está prohibido fumar en todo el establecimiento.',
            '{{Indicar si se permite introducir comida o bebida ajena al hotel, colgar material en las paredes o acceder fuera del horario contratado.}}',
          ],
        },
      ],
    },
    {
      h: '6. Protección de datos y normativa aplicable',
      bloques: [
        {
          tipo: 'p',
          texto:
            'El tratamiento de los datos facilitados al reservar se rige por la política de privacidad de esta web. ' +
            'Estas condiciones se rigen por la ley española.',
        },
      ],
    },
  ],
}

export const LEGALES = [AVISO_LEGAL, PRIVACIDAD, COOKIES, CONDICIONES]

/** Enlaces del pie. El orden es el habitual en España. */
export const ENLACES_LEGALES = LEGALES.map(d => ({ ruta: d.ruta, titulo: d.titulo }))

export const documentoPorRuta = (ruta) =>
  LEGALES.find(d => d.ruta === ruta) || null

/** Cabecera SEO. Mientras sea borrador, ninguna de estas páginas se indexa. */
export const cabeceraLegal = (doc) => ({
  titulo: doc.seoTitulo,
  descripcion: doc.seoDescripcion,
  ruta: doc.ruta,
  noindex: BORRADOR,
})