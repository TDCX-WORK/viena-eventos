/* ─────────────────────────────────────────────────────────────────────
   Cloudflare Pages Function — POST /api/reserva

   Manda los dos correos de una reserva: el aviso a dirección y la copia
   al cliente. Antes esto lo hacía el navegador con EmailJS, lo que
   obligaba a llevar la clave dentro del bundle y mandaba la IP de cada
   visitante a un tercero. Ahora la clave vive en un secret de Cloudflare
   (BREVO_API_KEY) y Brevo solo ve una petición de este servidor.

   LO QUE ESTA FUNCIÓN NO HACE: guardar la reserva. Eso sigue pasando
   antes, en el navegador, contra `crear_reserva` de Supabase, y solo si
   ha ido bien se llama aquí. El orden de useEmailSend.js no cambia:
   primero se guarda, después se avisa.

   Un fallo de correo NO es un fallo de reserva. Si Brevo responde mal,
   esto devuelve 200 con `ok: false` y el detalle de qué correo no ha
   salido; la reserva ya está en la base de datos y visible en el panel.
   Solo se devuelve un 4xx cuando la petición en sí viene mal formada.

   EL DISEÑO ES EL DE LAS PLANTILLAS DE EMAILJS, portado tal cual. Lo que
   allí eran {{variables}} y bloques {{#condicionales}} aquí son
   interpolaciones y ternarios. Los cambios respecto al original van
   comentados con la etiqueta OUTLOOK.

   Variables que necesita, en Settings → Variables and Secrets:
     BREVO_API_KEY   (Secret)  clave xkeysib-… de Brevo
   ───────────────────────────────────────────────────────────────────── */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

/* El remitente tiene que ser una dirección del dominio autenticado en
   Brevo. No es un buzón real: las respuestas se redirigen con replyTo. */
const REMITENTE = {
  name:  'Suites Viena Plaza de España',
  email: 'reservas@suitesvienaeventos.com',
}

/* Buzón de la dirección del hotel. Aquí llegan los avisos. */
const DIRECCION = {
  name:  'Dirección Suites Viena',
  email: 'direccion@suitesviena.es',
}

/* El listado del panel lee ?ref= y precarga el buscador, así que este
   enlace deja la reserva ya filtrada en pantalla. Ver el cambio de tres
   líneas en AdminReservas.jsx. */
const URL_PANEL = 'https://suitesvienaeventos.com/admin/reservas'

/* Los precios de Supabase llevan el IVA dentro. Esta línea sale debajo
   del total en los dos correos. En las plantillas de EmailJS esto era
   {{iva_texto}}, una variable que el hook nunca mandaba: el hueco salía
   vacío en todos los correos enviados hasta hoy. Si algún día cambia la
   política de precios, se cambia AQUÍ y en ningún otro sitio. */
const TEXTO_IVA = 'IVA incluido'

const TELEFONO_HOTEL = { texto: '917 583 605', tel: '+34917583605' }

/* Este endpoint manda correos a una dirección que viene en el cuerpo de
   la petición, así que se comprueba de dónde llega. No es una barrera
   seria (la cabecera Origin se pone a mano fuera de un navegador), pero
   filtra el rastreo automático. */
const ORIGENES = [
  'https://suitesvienaeventos.com',
  'https://www.suitesvienaeventos.com',
  'http://localhost:5173',
]

/* Paleta de las plantillas originales. */
const C = {
  acento:      '#922B21',
  fondo:       '#F9F9F9',
  bloque:      '#F4F4F4',
  linea:       '#E5E5E5',
  tinta:       '#111111',
  suave:       '#6B6B6B',
  tenue:       '#ABABAB',
  blanco:      '#FFFFFF',
  refFondo:    '#FDF2F2',
  refBorde:    '#F5C6C6',
  avisoFondo:  '#FEF3C7',
  avisoBorde:  '#FCD34D',
  avisoTitu:   '#92400E',
  avisoTexto:  '#78350F',
  ofertaFondo: '#F0FDF4',
  ofertaBorde: '#BBF7D0',
  ofertaTexto: '#166534',
}

const json = (datos, status = 200) =>
  new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

/* Todo lo que viene del formulario se pinta dentro de HTML. Sin esto, un
   nombre con un `<` rompe el correo y el campo de comentarios es una vía
   para colar etiquetas en el mensaje que abre la directora. En EmailJS lo
   hacía el motor con {{variable}}; aquí hay que hacerlo a mano. Ojo al
   detalle del original: {{{fechas_html}}} iba con tres llaves, que es
   justamente "esto no lo escapes". */
const escapar = (valor) => String(valor ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

/* Recorta antes de escapar: un campo de 40.000 caracteres no rompe nada
   pero engorda el correo sin motivo. */
const texto = (valor, max = 500) => escapar(String(valor ?? '').slice(0, max))

/* OUTLOOK: las plantillas usaban white-space:pre-wrap para los saltos de
   línea de los comentarios. El Outlook de escritorio pinta con el motor
   de Word y esa propiedad la ignora, así que un comentario de cinco
   líneas le llegaba a la directora como un párrafo corrido. Se convierten
   los saltos en <br> después de escapar. */
const multilinea = (valor, max = 2000) =>
  texto(valor, max).replace(/\r?\n/g, '<br />')

/* Mismo formato que el panel: 1.240 € */
const importe = (n) => `${Number(n || 0).toLocaleString('es-ES')} €`

const esEmail = (valor) =>
  typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor)

/* ── Piezas comunes ────────────────────────────────────────────────── */

const ESTILOS_MOVIL = `
    @media only screen and (max-width: 620px) {
      .px         { padding-left: 20px !important; padding-right: 20px !important; }
      .wrapPad    { padding: 16px 8px !important; }
      .tCell      { padding-left: 8px !important; padding-right: 8px !important; font-size: 12px !important; }
      .tHead      { padding-left: 8px !important; padding-right: 8px !important; font-size: 9px !important; letter-spacing: 0.5px !important; }
      .labelCell  { width: 90px !important; font-size: 11px !important; }
      .bigPrice   { font-size: 24px !important; }
      .refNum     { font-size: 19px !important; }
      .greet      { font-size: 18px !important; }
    }`

const rotulo = (txt) =>
  `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;` +
  `letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">${txt}</p>`

/* OUTLOOK: la barra de 4px llevaba font-size:0;line-height:0. El motor de
   Word impone una altura mínima de línea y la barra salía de unos 15px.
   mso-line-height-rule:exactly es lo que le obliga a respetarla. */
const BARRA = `<tr>
      <td style="background-color:${C.acento};font-size:0;line-height:4px;mso-line-height-rule:exactly;height:4px;">&nbsp;</td>
    </tr>`

const cabecera = (subtitulo) => `<tr>
      <td class="px" style="background-color:${C.blanco};border-bottom:1px solid ${C.linea};padding:32px 40px;text-align:center;">
        <h1 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${C.tinta};letter-spacing:-0.5px;">Suites Viena</h1>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.acento};">${subtitulo}</p>
      </td>
    </tr>`

const cabeceraTabla = () => ['Fecha', 'Jornada', 'Montaje', 'Pax'].map((h, i) =>
  `<td class="tHead" style="padding:10px 12px;font-family:Arial,Helvetica,sans-serif;font-size:10px;` +
  `font-weight:700;color:${C.acento};letter-spacing:1px;text-transform:uppercase;` +
  `border-bottom:2px solid ${C.linea};${i === 3 ? 'text-align:center;' : ''}">${h}</td>`
).join('')

/* Las filas que antes generaba formatFechasHtml dentro del hook. Se han
   igualado los colores a los de la plantilla: el original traía los de la
   paleta vieja (#3D3530, #e8e4df) y desentonaban dentro de la tabla. */
const filasFechas = (fechas) => {
  if (!fechas.length) {
    return `<tr><td colspan="4" class="tCell" style="padding:14px 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};">Sin fechas indicadas</td></tr>`
  }

  const celda = (contenido, extra = '') =>
    `<td class="tCell" style="padding:12px;border-bottom:1px solid ${C.linea};` +
    `font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};${extra}">${contenido}</td>`

  return fechas.map(f => `<tr>
      ${celda(texto(f.fecha, 80), `color:${C.tinta};text-transform:capitalize;`)}
      ${celda(texto(f.jornada, 40))}
      ${celda(texto(f.layout, 40))}
      ${celda(texto(f.asistentes, 10), 'text-align:center;')}
    </tr>`).join('')
}

const tablaFechas = (fechas, margen = '') => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
      style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;${margen}">
      <tr>${cabeceraTabla()}</tr>
      ${filasFechas(fechas)}
    </table>`

/* OUTLOOK: un <a> con padding dentro de un <td> de color se pinta, pero
   el área pinchable se queda solo en el texto y el relleno se descuadra.
   La forma fiable es VML: Outlook dibuja el rectángulo y el resto de
   clientes se quedan con el <a> de siempre. */
const boton = (url, etiqueta) => `<!--[if mso]>
    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
      href="${url}" style="height:44px;v-text-anchor:middle;width:210px;" arcsize="18%" stroke="f" fillcolor="${C.acento}">
      <w:anchorlock/>
      <center style="color:${C.blanco};font-family:Arial,sans-serif;font-size:14px;font-weight:bold;">${etiqueta}</center>
    </v:roundrect>
    <![endif]-->
    <!--[if !mso]><!-->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
      <tr>
        <td style="background-color:${C.acento};border-radius:8px;">
          <a href="${url}" style="display:inline-block;padding:12px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${C.blanco};text-decoration:none;">${etiqueta}</a>
        </td>
      </tr>
    </table>
    <!--<![endif]-->`

/* El bloque verde de oferta. En el correo del hotel lleva el código; en
   el del cliente, el ahorro en euros. Equivale a los {{#oferta_nombre}}
   de las dos plantillas. */
const avisoOferta = (oferta, ahorro = null) => {
  if (!oferta?.nombre) return ''

  const paraCliente = ahorro !== null

  const linea = paraCliente
    ? `<p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ofertaTexto};">Ahorras ${importe(ahorro)}${oferta.detalle ? ` · ${texto(oferta.detalle, 200)}` : ''}</p>`
    : (oferta.detalle
        ? `<p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.ofertaTexto};">${texto(oferta.detalle, 200)}</p>`
        : '')

  const codigo = (!paraCliente && oferta.codigo)
    ? ` &nbsp;·&nbsp; código ${texto(oferta.codigo, 40)}`
    : ''

  return `<tr>
      <td class="px" style="padding:${paraCliente ? '22px' : '16px'} 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.ofertaFondo};border:1px solid ${C.ofertaBorde};border-radius:8px;">
          <tr>
            <td style="padding:${paraCliente ? '14px 18px' : '12px 16px'};${paraCliente ? 'text-align:center;' : ''}">
              <p style="margin:0 0 ${paraCliente ? '3px' : '2px'};font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.ofertaTexto};">Oferta aplicada</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:${C.ofertaTexto};">${texto(oferta.nombre, 80)}${codigo}</p>
              ${linea}
            </td>
          </tr>
        </table>
      </td>
    </tr>`
}

const filasDesglose = (p, oferta, [arriba, medio]) => {
  const descuento = (oferta?.nombre && p.descuento) ? `<tr>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${C.ofertaTexto};">${texto(oferta.nombre, 60)}</td>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${C.ofertaTexto};text-align:right;white-space:nowrap;">−${importe(p.descuento)}</td>
    </tr>` : ''

  return `<tr>
      <td style="padding:${arriba};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};">Sala</td>
      <td style="padding:${arriba};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};text-align:right;white-space:nowrap;">${importe(p.base)}</td>
    </tr>
    <tr>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};">Extras</td>
      <td style="padding:${medio};font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};text-align:right;white-space:nowrap;">${importe(p.extras)}</td>
    </tr>
    ${descuento}`
}

const armazon = (titulo, filas) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <!--[if gte mso 9]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:AllowPNG/>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <title>${escapar(titulo)}</title>
  <style type="text/css">${ESTILOS_MOVIL}</style>
</head>
<body style="margin:0;padding:0;background-color:${C.fondo};font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${C.fondo};">
  <tr>
    <td align="center" class="wrapPad" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"
        style="max-width:600px;width:100%;background-color:${C.blanco};border-radius:12px;overflow:hidden;border:1px solid ${C.linea};">
        ${filas}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

/* ── Correo 1 · el aviso a dirección ───────────────────────────────── */

const correoHotel = (d) => {
  const enlace = `${URL_PANEL}?ref=${encodeURIComponent(d.referencia)}`

  return armazon('Nueva solicitud de reserva', `
    ${BARRA}
    ${cabecera('Nueva solicitud de reserva')}

    <!-- Referencia. El número es ahora un enlace al panel con la reserva
         ya filtrada. El bloque entero no se puede hacer pinchable en el
         Outlook de escritorio (el motor de Word no respeta un <a> que
         envuelve una tabla), así que el enlace es el número y abajo queda
         el botón, que sí funciona en todas partes. -->
    <tr>
      <td class="px" style="padding:28px 40px 0;text-align:center;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td style="background-color:${C.refFondo};border:1px solid ${C.refBorde};border-radius:8px;padding:10px 24px;">
              <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Referencia</p>
              <p class="refNum" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;letter-spacing:1px;">
                <a href="${enlace}" style="color:${C.acento};text-decoration:none;">${texto(d.referencia, 40)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Estado -->
    <tr>
      <td class="px" style="padding:20px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.avisoFondo};border:1px solid ${C.avisoBorde};border-radius:8px;">
          <tr>
            <td style="padding:12px 16px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 2px;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.avisoTitu};">Pendiente de confirmación</p>
              <p style="margin:0;font-size:14px;line-height:20px;color:${C.avisoTexto};">
                Contacta con el cliente y, cuando esté cerrada, confírmala o cancélala en el panel. Las solicitudes no bloquean la fecha.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${avisoOferta(d.oferta)}

    <!-- Datos de contacto -->
    <tr>
      <td class="px" style="padding:28px 40px 0;">
        ${rotulo('Datos de contacto')}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          <tr>
            <td class="labelCell" style="padding:14px 16px;border-bottom:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;width:110px;">Nombre</td>
            <td style="padding:14px 16px;border-bottom:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:600;color:${C.tinta};">${texto(d.contacto.nombre, 120)}</td>
          </tr>
          <tr>
            <td class="labelCell" style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;">Email</td>
            <td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.tinta};word-break:break-all;"><a href="mailto:${texto(d.contacto.email, 120)}" style="color:${C.tinta};text-decoration:underline;">${texto(d.contacto.email, 120)}</a></td>
          </tr>
          ${d.contacto.telefono ? `<tr>
            <td class="labelCell" style="padding:14px 16px;border-top:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;">Teléfono</td>
            <td style="padding:14px 16px;border-top:1px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.tinta};"><a href="tel:${texto(d.contacto.telefono, 40)}" style="color:${C.tinta};text-decoration:underline;">${texto(d.contacto.telefono, 40)}</a></td>
          </tr>` : ''}
        </table>
      </td>
    </tr>

    <!-- Sala -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        ${rotulo('Sala solicitada')}
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:${C.tinta};">${texto(d.sala.nombre, 80)}</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};">${texto(d.sala.metros, 20)} m² &nbsp;·&nbsp; Hasta ${texto(d.sala.capacidad, 10)} personas</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Fechas -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        ${rotulo('Detalle de fechas')}
        ${tablaFechas(d.fechas)}
      </td>
    </tr>

    <!-- Extras -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Extras</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};line-height:22px;">${d.extras.length ? d.extras.map(e => texto(e, 60)).join(', ') : 'Ninguno'}</p>
      </td>
    </tr>

    <!-- Desglose -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Desglose</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          ${filasDesglose(d.precios, d.oferta, ['12px 16px', '0 16px 12px'])}
          <tr>
            <td style="padding:14px 16px;border-top:2px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;vertical-align:middle;">Total estimado</td>
            <td style="padding:14px 16px;border-top:2px solid ${C.linea};text-align:right;vertical-align:middle;">
              <p class="bigPrice" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:${C.tinta};white-space:nowrap;">${importe(d.precios.total)}</p>
              <p style="margin:4px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${C.tenue};">${TEXTO_IVA}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Comentarios -->
    <tr>
      <td class="px" style="padding:24px 40px 0;">
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Comentarios</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.suave};line-height:22px;">${d.contacto.comentarios ? multilinea(d.contacto.comentarios) : '—'}</p>
      </td>
    </tr>

    <!-- Botón al panel -->
    <tr>
      <td class="px" style="padding:28px 40px 0;" align="center">
        ${boton(enlace, 'Abrir en el panel')}
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="px" style="padding:32px 40px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-top:1px solid ${C.linea};padding-top:20px;text-align:center;">
              <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">Si respondes a este email, la respuesta le llega directamente al cliente.</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">Suites Viena · Plaza de España, Madrid</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`)
}

/* ── Correo 2 · la copia al cliente ────────────────────────────────── */

const correoCliente = (d) => armazon('Solicitud recibida - Suites Viena', `
    ${BARRA}
    ${cabecera('Solicitud recibida')}

    <!-- Saludo -->
    <tr>
      <td class="px" style="padding:32px 40px 0;">
        <p class="greet" style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:${C.tinta};">Hola, ${texto(d.contacto.nombre, 80)}</p>
        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:${C.suave};line-height:24px;">Gracias por tu interés. Hemos recibido tu solicitud y la estamos revisando. Te escribiremos en las próximas horas para confirmar la disponibilidad y cerrar los detalles contigo.</p>
      </td>
    </tr>

    <!-- Estado -->
    <tr>
      <td class="px" style="padding:22px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.avisoFondo};border:1px solid ${C.avisoBorde};border-radius:10px;">
          <tr>
            <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.avisoTitu};">Pendiente de confirmación</p>
              <p style="margin:0;font-size:14px;line-height:21px;color:${C.avisoTexto};">Tu solicitud está pendiente de confirmación. Te escribiremos para cerrar los detalles; hasta entonces la sala no queda reservada.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Referencia -->
    <tr>
      <td class="px" style="padding:24px 40px 0;" align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"
          style="background-color:${C.refFondo};border:1px solid ${C.refBorde};border-radius:10px;width:100%;max-width:340px;">
          <tr>
            <td style="padding:22px 28px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${C.acento};">Tu número de referencia</p>
              <p class="refNum" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:700;color:${C.acento};letter-spacing:1.5px;">${texto(d.referencia, 40)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    ${avisoOferta(d.oferta, d.precios.descuento)}

    <!-- Resumen -->
    <tr>
      <td class="px" style="padding:28px 40px 0;">
        <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:${C.acento};">Resumen de tu solicitud</p>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;margin-bottom:16px;">
          <tr>
            <td style="padding:16px 18px;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;color:${C.tinta};">${texto(d.sala.nombre, 80)}</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};">${texto(d.sala.metros, 20)} m² &nbsp;·&nbsp; Hasta ${texto(d.sala.capacidad, 10)} personas</p>
            </td>
          </tr>
        </table>

        ${tablaFechas(d.fechas, 'margin-bottom:16px;')}

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;margin-bottom:16px;">
          <tr>
            <td class="labelCell" style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;width:110px;">Extras</td>
            <td style="padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${C.tinta};">${d.extras.length ? d.extras.map(e => texto(e, 60)).join(', ') : 'Ninguno'}</td>
          </tr>
        </table>

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          ${filasDesglose(d.precios, d.oferta, ['14px 20px 10px', '0 20px 10px'])}
          <tr>
            <td style="padding:14px 20px;border-top:2px solid ${C.linea};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:${C.suave};text-transform:uppercase;letter-spacing:0.5px;vertical-align:middle;">Precio estimado</td>
            <td style="padding:14px 20px;border-top:2px solid ${C.linea};text-align:right;vertical-align:middle;">
              <p class="bigPrice" style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:${C.tinta};white-space:nowrap;">${importe(d.precios.total)}</p>
              <p style="margin:2px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${C.tenue};">${TEXTO_IVA} · pendiente de confirmación</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Contacto -->
    <tr>
      <td class="px" style="padding:28px 40px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
          style="background-color:${C.bloque};border:1px solid ${C.linea};border-radius:8px;">
          <tr>
            <td style="padding:20px 22px;text-align:center;">
              <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;color:${C.tinta};">¿Quieres cambiar algo o tienes alguna pregunta?</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${C.suave};line-height:20px;">
                Responde a este email o llámanos al
                <a href="tel:${TELEFONO_HOTEL.tel}" style="color:${C.acento};text-decoration:underline;white-space:nowrap;">${TELEFONO_HOTEL.texto}</a>
                indicando tu referencia.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="px" style="padding:32px 40px 28px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-top:1px solid ${C.linea};padding-top:20px;text-align:center;">
              <p style="margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:${C.tinta};">Suites Viena Plaza de España</p>
              <p style="margin:0 0 2px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">C/ Juan Álvarez Mendizábal, 17 · 28008 Madrid</p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.tenue};">
                <a href="https://suitesvienaeventos.com" style="color:${C.acento};text-decoration:underline;">suitesvienaeventos.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`)

/* ── Envío ─────────────────────────────────────────────────────────── */

async function enviar(apiKey, mensaje) {
  const respuesta = await fetch(BREVO_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key':      apiKey,
      'Content-Type': 'application/json',
      'Accept':       'application/json',
    },
    body: JSON.stringify(mensaje),
  })

  if (!respuesta.ok) {
    const detalle = await respuesta.text()
    throw new Error(`Brevo ${respuesta.status}: ${detalle.slice(0, 300)}`)
  }

  return respuesta.json()
}

/* Normaliza lo que llega del navegador. Nunca se confía en la forma del
   cuerpo: viene de un cliente y puede traer cualquier cosa. */
function leerDatos(cuerpo) {
  const contacto = cuerpo?.contacto || {}
  const precios  = cuerpo?.precios  || {}

  if (!cuerpo?.referencia) throw new Error('falta la referencia')
  if (!esEmail(contacto.email)) throw new Error('email de contacto no válido')
  if (!contacto.nombre) throw new Error('falta el nombre de contacto')

  return {
    referencia: String(cuerpo.referencia),
    contacto: {
      nombre:      contacto.nombre,
      email:       contacto.email,
      telefono:    contacto.telefono || '',
      comentarios: contacto.comentarios || '',
    },
    sala: {
      nombre:    cuerpo?.sala?.nombre    || '—',
      metros:    cuerpo?.sala?.metros    || '—',
      capacidad: cuerpo?.sala?.capacidad || '—',
    },
    fechas: Array.isArray(cuerpo.fechas) ? cuerpo.fechas.slice(0, 30) : [],
    extras: Array.isArray(cuerpo.extras) ? cuerpo.extras.slice(0, 20) : [],
    precios: {
      base:      Number(precios.base)      || 0,
      extras:    Number(precios.extras)    || 0,
      descuento: Number(precios.descuento) || 0,
      total:     Number(precios.total)     || 0,
    },
    oferta: cuerpo.oferta || null,
  }
}

export async function onRequestPost({ request, env }) {
  const origen = request.headers.get('Origin')
  if (origen && !ORIGENES.includes(origen)) {
    return json({ ok: false, error: 'origen no permitido' }, 403)
  }

  if (!env.BREVO_API_KEY) {
    console.error('BREVO_API_KEY no está configurada en este entorno')
    return json({ ok: false, error: 'configuración incompleta' }, 500)
  }

  let datos
  try {
    datos = leerDatos(await request.json())
  } catch (err) {
    return json({ ok: false, error: err.message }, 400)
  }

  const resultados = await Promise.allSettled([
    enviar(env.BREVO_API_KEY, {
      sender:  REMITENTE,
      to:      [DIRECCION],
      replyTo: { email: datos.contacto.email, name: datos.contacto.nombre },
      subject: `Nueva solicitud ${datos.referencia} — ${datos.sala.nombre}`,
      htmlContent: correoHotel(datos),
      tags:    ['reserva', 'aviso-hotel'],
    }),
    enviar(env.BREVO_API_KEY, {
      sender:  REMITENTE,
      to:      [{ email: datos.contacto.email, name: datos.contacto.nombre }],
      replyTo: DIRECCION,
      subject: `Solicitud recibida — Suites Viena (${datos.referencia})`,
      htmlContent: correoCliente(datos),
      tags:    ['reserva', 'copia-cliente'],
    }),
  ])

  const [hotel, cliente] = resultados

  /* El aviso al hotel es el que no se puede perder: si ese falla, alguien
     tiene que enterarse. Queda en los logs de la Function. */
  resultados.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(
        `Reserva ${datos.referencia}: no ha salido el correo ${i === 0 ? 'al hotel' : 'al cliente'}.`,
        r.reason?.message || r.reason
      )
    }
  })

  return json({
    ok:      hotel.status === 'fulfilled' && cliente.status === 'fulfilled',
    hotel:   hotel.status === 'fulfilled',
    cliente: cliente.status === 'fulfilled',
  })
}

/* No se exporta onRequest a propósito: al existir solo onRequestPost,
   Pages responde 405 él solo a cualquier otro método. Exportar los dos
   haría que se pisaran. */