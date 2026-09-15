import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/* ─────────────────────────────────────────────────────────────────────
   Exportar la ocupación de las salas a Excel y a PDF.

   QUÉ SE EXPORTA: una fila por hueco ocupado, o sea por combinación de
   día, sala y jornada. Es el formato que sirve para cruzar con la
   agenda del hotel y para pasárselo a alguien que no entra al panel.

   EL DOCUMENTO DECLARA SU ALCANCE. Arriba va siempre el período, cuándo
   se generó y qué salas incluye. Un listado de ocupación sin fecha de
   generación no vale para nada: mañana ya es otro.

   LO HEREDADO SE INCLUYE Y SE MARCA. Si Viena está ocupada, la
   combinada no se puede vender: eso tiene que salir en el papel, o
   quien lo lea creerá que estaba libre. Pero se marca como heredado
   para que no parezca una reserva más.
   ───────────────────────────────────────────────────────────────────── */

const JORNADA = { completo: 'Día completo', manana: 'Mañana', tarde: 'Tarde' }
const HORARIO = { completo: '9:00–20:00', manana: '9:00–14:00', tarde: '15:00–20:00' }

const TIPO_TEXTO = {
  bloqueo:   'Bloqueo manual',
  reserva:   'Reserva confirmada',
  solicitud: 'Solicitud sin contestar',
  heredado:  'Ocupada por otra sala',
}

// Los mismos colores de la interfaz, en el formato de cada librería.
const COLOR_FILA_HEX = {
  bloqueo:   'FFFDF2F2',
  reserva:   'FFF0FDF4',
  solicitud: 'FFFEF3C7',
  heredado:  'FFF4F4F4',
}

const COLOR_FILA_RGB = {
  bloqueo:   [253, 242, 242],
  reserva:   [240, 253, 244],
  solicitud: [254, 243, 199],
  heredado:  [244, 244, 244],
}

const ACENTO_HEX = 'FF922B21'
const ACENTO_RGB = [146, 43, 33]

function fechaCorta(iso) {
  return format(new Date(iso + 'T00:00:00'), 'dd/MM/yyyy', { locale: es })
}

function generadoEl() {
  return new Date().toLocaleString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function detalle(fila) {
  if (fila.tipo === 'reserva' || fila.tipo === 'solicitud') {
    return [fila.referencia, fila.cliente].filter(Boolean).join(' · ') || '—'
  }
  if (fila.tipo === 'heredado') {
    return `Viene de ${fila.nombreOrigen || fila.desde}`
  }
  return fila.motivo || '—'
}

function nombreArchivo(base, periodo, ext) {
  const limpio = String(periodo).toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${base}-${limpio}.${ext}`
}

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Excel ─────────────────────────────────────────────────────────── */

export async function exportarExcel({ filas, periodo, salas }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Suites Viena · Panel de reservas'
  wb.created = new Date()

  const ws = wb.addWorksheet('Ocupación', {
    views: [{ state: 'frozen', ySplit: 7 }],
  })

  ws.columns = [
    { key: 'fecha',    width: 14 },
    { key: 'diaSem',   width: 12 },
    { key: 'sala',     width: 26 },
    { key: 'jornada',  width: 15 },
    { key: 'horario',  width: 14 },
    { key: 'tipo',     width: 22 },
    { key: 'detalle',  width: 42 },
  ]

  ws.addRows([
    ['OCUPACIÓN DE SALAS'],
    [`Período: ${periodo}`],
    [`Salas incluidas: ${salas.map(s => s.name).join(', ')}`],
    [`Generado el ${generadoEl()}`],
    ['Incluye bloqueos manuales, reservas confirmadas y ocupación heredada entre salas.'],
    [],
  ])

  ws.getCell('A1').font = { bold: true, size: 14 }
  ws.getCell('A2').font = { size: 11, bold: true, color: { argb: ACENTO_HEX } }
  ws.getCell('A3').font = { size: 10 }
  ws.getCell('A4').font = { size: 10, color: { argb: 'FF666666' } }
  ws.getCell('A5').font = { italic: true, size: 9, color: { argb: 'FF999999' } }

  const cabecera = ws.getRow(7)
  cabecera.values = ['Fecha', 'Día', 'Sala', 'Jornada', 'Horario', 'Tipo', 'Detalle']
  cabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  cabecera.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ACENTO_HEX } }
  cabecera.height = 22

  filas.forEach(f => {
    const fila = ws.addRow({
      fecha:   fechaCorta(f.fecha),
      diaSem:  format(new Date(f.fecha + 'T00:00:00'), 'EEEE', { locale: es }),
      sala:    f.nombreSala,
      jornada: JORNADA[f.jornada] || f.jornada,
      horario: HORARIO[f.jornada] || '—',
      tipo:    TIPO_TEXTO[f.tipo] || f.tipo,
      detalle: detalle(f),
    })

    fila.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_FILA_HEX[f.tipo] || 'FFFFFFFF' },
    }
    fila.alignment = { vertical: 'middle', wrapText: true }
    fila.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' }
    if (f.tipo === 'heredado') {
      fila.font = { italic: true, color: { argb: 'FF666666' } }
    }
  })

  if (filas.length === 0) {
    const vacia = ws.addRow(['No hay nada ocupado en este período.'])
    vacia.font = { italic: true, color: { argb: 'FF999999' } }
  }

  ws.addRow([])
  const resumen = ws.addRow([
    `Total: ${filas.length} hueco(s) ocupado(s) · ` +
    `${filas.filter(f => f.tipo === 'bloqueo').length} bloqueos · ` +
    `${filas.filter(f => f.tipo === 'reserva').length} reservas · ` +
    `${filas.filter(f => f.tipo === 'solicitud').length} solicitudes · ` +
    `${filas.filter(f => f.tipo === 'heredado').length} heredados`
  ])
  resumen.font = { bold: true, size: 10, color: { argb: ACENTO_HEX } }

  const buffer = await wb.xlsx.writeBuffer()
  descargar(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    nombreArchivo('ocupacion-salas', periodo, 'xlsx')
  )
}

/* ── PDF ───────────────────────────────────────────────────────────── */

export function exportarPDF({ filas, periodo, salas }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const ancho = doc.internal.pageSize.getWidth()

  doc.setFontSize(16)
  doc.setTextColor(17)
  doc.text('OCUPACIÓN DE SALAS', 14, 18)

  doc.setFontSize(10)
  doc.setTextColor(...ACENTO_RGB)
  doc.text(`Período: ${periodo}`, 14, 26)

  doc.setTextColor(100)
  doc.setFontSize(9)
  doc.text(`Salas: ${salas.map(s => s.name).join(', ')}`, 14, 32)
  doc.text(`Generado el ${generadoEl()}`, 14, 37)

  doc.setDrawColor(...ACENTO_RGB)
  doc.setLineWidth(0.5)
  doc.line(14, 40, ancho - 14, 40)

  const body = filas.map(f => [
    fechaCorta(f.fecha),
    f.nombreSala,
    JORNADA[f.jornada] || f.jornada,
    TIPO_TEXTO[f.tipo] || f.tipo,
    detalle(f),
  ])

  autoTable(doc, {
    startY: 45,
    head: [['Fecha', 'Sala', 'Jornada', 'Tipo', 'Detalle']],
    body: body.length > 0 ? body : [[{
      content: 'No hay nada ocupado en este período.',
      colSpan: 5,
      styles: { fontStyle: 'italic', textColor: [150, 150, 150], halign: 'center' },
    }]],
    headStyles: {
      fillColor: ACENTO_RGB,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 42 },
      2: { cellWidth: 26 },
      3: { cellWidth: 36 },
    },
    didParseCell(data) {
      if (data.section !== 'body') return
      const fila = filas[data.row.index]
      if (!fila) return
      data.cell.styles.fillColor = COLOR_FILA_RGB[fila.tipo] || [255, 255, 255]
      if (fila.tipo === 'heredado') {
        data.cell.styles.fontStyle = 'italic'
        data.cell.styles.textColor = [110, 110, 110]
      }
    },
  })

  const finY = doc.lastAutoTable.finalY + 8
  doc.setFontSize(8)
  doc.setTextColor(120)
  doc.text(
    `Total: ${filas.length} hueco(s) · ` +
    `${filas.filter(f => f.tipo === 'bloqueo').length} bloqueos · ` +
    `${filas.filter(f => f.tipo === 'reserva').length} reservas · ` +
    `${filas.filter(f => f.tipo === 'solicitud').length} solicitudes · ` +
    `${filas.filter(f => f.tipo === 'heredado').length} heredados`,
    14, finY
  )
  doc.text(
    'Los huecos heredados no son reservas: la sala no se puede alquilar porque otra ' +
    'que la comparte está ocupada.',
    14, finY + 5
  )

  doc.save(nombreArchivo('ocupacion-salas', periodo, 'pdf'))
}