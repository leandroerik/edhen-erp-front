/**
 * ====================================================================
 * EDHEN ERP — BACKEND GOOGLE APPS SCRIPT (Google Sheets Database)
 * ====================================================================
 * 
 * Este script convierte tu Google Spreadsheet en una API REST (JSON)
 * para conectar el frontend de React.
 */

// Configuración de nombres de pestañas en la hoja de cálculo
const SHEETS = {
  ARTICULOS: 'Articulos',
  CORTES: 'Cortes',
  ENCIMADAS: 'Encimadas',
  COMPRAS: 'Compras',
  TALLERES: 'Talleres',
  PAGOS: 'Pagos_Talleres',
  PROVEEDORES: 'Proveedores',
}

// Entidades que llegan desde el front (guardarVarios) -> pestaña de la hoja.
const ENTIDADES_A_HOJA = {
  articulo: SHEETS.ARTICULOS,
  encimada: SHEETS.ENCIMADAS,
  corte: SHEETS.CORTES,
  compra: SHEETS.COMPRAS,
  pago: SHEETS.PAGOS,
  taller: SHEETS.TALLERES,
  proveedor: SHEETS.PROVEEDORES,
}

/**
 * 1. INICIALIZADOR: Creación automática de pestañas con sus encabezados
 * Puedes ejecutar esta función manualmente en el editor de Apps Script (botón "Ejecutar")
 * para que prepare todas las hojas vacías listas para usar.
 */
function inicializarHojas() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()

  const esquemas = [
    {
      nombre: SHEETS.ARTICULOS,
      columnas: [
        'id', 'codigoArticulo', 'nombre', 'descripcion', 'cantidadPrendas',
        'costoTelaTotalUsado', 'costoTelaPorPrenda', 'manoObra',
        'aviosTotales', 'aviosPorPrenda', 'costoUnitario', 'costoTotalProduccion',
        'margenGanancia', 'precioSugerido', 'precioVenta', 'gananciaUnitaria',
        'gananciaTotal', 'margenReal', 'telas_json', 'avios_json', 'corteId', 'tallerId', 'tallerNombre',
        'encimadaId', 'encimadaItemId'
      ]
    },
    {
      nombre: SHEETS.CORTES,
      columnas: [
        'id', 'codigo', 'fecha', 'modeloId', 'modeloNombre', 'tallerId', 'tallerNombre',
        'cantidadPrendas', 'precioPorPrenda', 'costoTela', 'costoManoObra', 'costoTotal',
        'costoPorPrenda', 'estado', 'telasUsadas_json', 'curva_json', 'notas'
      ]
    },
    {
      nombre: SHEETS.ENCIMADAS,
      columnas: [
        'id', 'codigo', 'fecha', 'estado', 'largoCapa', 'notas',
        'cargas_json', 'items_json', 'telasUsadas_json'
      ]
    },
    {
      nombre: SHEETS.COMPRAS,
      columnas: [
        'id', 'codigo', 'fecha', 'proveedorId', 'proveedorNombre',
        'telaId', 'telaNombre', 'unidadCompra', 'precioUnitario',
        'flete', 'notaRemito', 'total', 'usada', 'lotes_json'
      ]
    },
    {
      nombre: SHEETS.TALLERES,
      columnas: ['id', 'nombre', 'especialidad', 'telefono', 'direccion', 'activo']
    },
    {
      nombre: SHEETS.PAGOS,
      columnas: ['id', 'fecha', 'tallerId', 'tallerNombre', 'corteId', 'corteCodigo', 'monto', 'tipo', 'concepto']
    },
    {
      nombre: SHEETS.PROVEEDORES,
      columnas: ['id', 'nombre']
    }
  ]

  esquemas.forEach(function (e) {
    let sheet = ss.getSheetByName(e.nombre)
    if (!sheet) {
      sheet = ss.insertSheet(e.nombre)
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(e.columnas)
      sheet.getRange(1, 1, 1, e.columnas.length).setFontWeight('bold').setBackground('#f3f4f6')
      sheet.setFrozenRows(1)
      return
    }

    // Las hojas ya existentes no se tocan: solo se agregan al final las
    // columnas del esquema que falten (por ejemplo encimadaId/encimadaItemId).
    const lastCol = sheet.getLastColumn()
    const headers = lastCol > 0
      ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h).trim() })
      : []
    const faltantes = e.columnas.filter(function (col) {
      return headers.indexOf(col) === -1
    })

    if (faltantes.length > 0) {
      sheet.getRange(1, lastCol + 1, 1, faltantes.length)
        .setValues([faltantes])
        .setFontWeight('bold')
        .setBackground('#f3f4f6')
      Logger.log('Se agregaron columnas a ' + e.nombre + ': ' + faltantes.join(', '))
    }

    if (e.nombre === SHEETS.ARTICULOS) {
      limpiarCorteIdEncimadas(sheet)
    }
  })

  Logger.log('Hojas inicializadas con éxito.')
}

/**
 * La relación Artículo -> Encimada se guarda en encimadaId/encimadaItemId.
 * Si en la columna corteId quedaron valores tipo "enc-xx", se limpian.
 */
function limpiarCorteIdEncimadas(sheet) {
  const lastRow = sheet.getLastRow()
  if (lastRow <= 1) return

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const corteIdIdx = headers.indexOf('corteId')
  if (corteIdIdx === -1) return

  const range = sheet.getRange(2, corteIdIdx + 1, lastRow - 1, 1)
  const values = range.getValues()
  let limpiados = 0
  const nuevas = values.map(function (fila) {
    const valor = String(fila[0] || '').trim()
    if (/^enc[-_]/i.test(valor)) {
      limpiados++
      return ['']
    }
    return fila
  })

  if (limpiados > 0) {
    range.setValues(nuevas)
    Logger.log('Se limpiaron ' + limpiados + ' valores de encimada en corteId de Articulos.')
  }
}

/**
 * 2. MANEJADOR HTTP GET: Lectura de datos
 * Parámetros recibidos en URL:
 * ?action=bootstrap  -> Devuelve todo el estado del sistema en un solo llamado
 * ?action=articulos  -> Devuelve solo los artículos
 * ?action=cortes     -> Devuelve solo los cortes
 * ?action=compras    -> Devuelve solo las compras
 * ?action=pagos      -> Devuelve solo los pagos
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'bootstrap'
    let data = {}

    if (action === 'bootstrap' || action === 'all') {
      data = {
        articulos: leerTabla(SHEETS.ARTICULOS),
        cortes: leerTabla(SHEETS.CORTES),
        encimadas: leerTabla(SHEETS.ENCIMADAS),
        compras: leerTabla(SHEETS.COMPRAS),
        talleres: leerTabla(SHEETS.TALLERES),
        pagos: leerTabla(SHEETS.PAGOS),
        proveedores: leerTabla(SHEETS.PROVEEDORES)
      }
    } else if (action === 'articulos') {
      data = leerTabla(SHEETS.ARTICULOS)
    } else if (action === 'cortes') {
      data = leerTabla(SHEETS.CORTES)
    } else if (action === 'compras') {
      data = leerTabla(SHEETS.COMPRAS)
    } else if (action === 'pagos') {
      data = leerTabla(SHEETS.PAGOS)
    } else if (action === 'talleres') {
      data = leerTabla(SHEETS.TALLERES)
    } else {
      return jsonResponse({ error: 'Acción no reconocida: ' + action }, 400)
    }

    return jsonResponse({ success: true, data: data })
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500)
  }
}

/**
 * 3. MANEJADOR HTTP POST: Guardado y actualización
 * Recibe JSON en el body con: { action: "...", payload: { ... } }
 */
function doPost(e) {
  try {
    let body = {}
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents)
    } else {
      return jsonResponse({ success: false, error: 'Cuerpo de solicitud vacío' }, 400)
    }

    const action = body.action
    const payload = body.payload

    if (!action || !payload) {
      return jsonResponse({ success: false, error: 'Faltan parámetros action o payload' }, 400)
    }

    let resultado = null

    switch (action) {
      case 'guardarArticulo':
        resultado = upsertFila(SHEETS.ARTICULOS, payload)
        break
      case 'eliminarArticulo':
        resultado = eliminarFila(SHEETS.ARTICULOS, payload.id)
        break
      case 'guardarCorte':
        resultado = upsertFila(SHEETS.CORTES, payload)
        break
      case 'guardarEncimada':
        resultado = upsertFila(SHEETS.ENCIMADAS, payload)
        break
      case 'eliminarEncimada':
        resultado = eliminarFila(SHEETS.ENCIMADAS, payload.id)
        break
      case 'guardarCompra':
        resultado = upsertFila(SHEETS.COMPRAS, payload)
        break
      case 'guardarPago':
        resultado = upsertFila(SHEETS.PAGOS, payload)
        break
      case 'guardarTaller':
        resultado = upsertFila(SHEETS.TALLERES, payload)
        break
      case 'eliminarTaller':
        resultado = eliminarFila(SHEETS.TALLERES, payload.id)
        break
      case 'guardarProveedor':
        resultado = upsertFila(SHEETS.PROVEEDORES, payload)
        break
      case 'actualizarEstadoCorte':
        resultado = actualizarCampo(SHEETS.CORTES, payload.id, 'estado', payload.nuevoEstado)
        break
      case 'guardarVarios':
        resultado = guardarVarios(payload)
        break
      case 'migrarTodo':
        inicializarHojas()
        if (Array.isArray(payload.talleres)) {
          payload.talleres.forEach(function (t) { upsertFila(SHEETS.TALLERES, t) })
        }
        if (Array.isArray(payload.proveedores)) {
          payload.proveedores.forEach(function (p) { upsertFila(SHEETS.PROVEEDORES, p) })
        }
        if (Array.isArray(payload.compras)) {
          payload.compras.forEach(function (c) { upsertFila(SHEETS.COMPRAS, c) })
        }
        if (Array.isArray(payload.articulos)) {
          payload.articulos.forEach(function (a) { upsertFila(SHEETS.ARTICULOS, a) })
        }
        if (Array.isArray(payload.cortes)) {
          payload.cortes.forEach(function (co) { upsertFila(SHEETS.CORTES, co) })
        }
        resultado = { completado: true }
        break
      default:
        return jsonResponse({ success: false, error: 'Acción POST desconocida: ' + action }, 400)
    }

    return jsonResponse({ success: true, data: resultado })
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500)
  }
}

/**
 * 4. FUNCIONES AUXILIARES DE LECTURA Y ESCRITURA
 */

function leerTabla(nombreHoja) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(nombreHoja)
  if (!sheet) return []

  const lastRow = sheet.getLastRow()
  const lastCol = sheet.getLastColumn()
  if (lastRow <= 1 || lastCol === 0) return []

  const headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (h) { return String(h || '').trim() })
  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()

  return values
    .filter(function (row) {
      // Ignoramos filas totalmente vacías (formato sobrante en la hoja).
      return row.some(function (val) {
        return val !== '' && val !== null && val !== undefined
      })
    })
    .map(function (row) {
      let obj = {}
      headers.forEach(function (header, colIdx) {
        let val = row[colIdx]
        // Normalizamos los IDs a texto: Sheets puede guardarlos como número
        // y luego las comparaciones estrictas (===) del frontend fallan.
        const esId = header === 'id' || /Id$/.test(header)
        if (esId && val !== '' && val !== null && val !== undefined) {
          val = String(val).trim()
        }
        // Si la columna termina en _json, parseamos el JSON guardado
        if (typeof val === 'string' && header.endsWith('_json')) {
          const campoLimpio = header.replace('_json', '')
          try {
            obj[campoLimpio] = val ? JSON.parse(val) : []
          } catch (e) {
            obj[campoLimpio] = val
          }
        } else {
          obj[header] = val
        }
      })
      return obj
    })
}

function upsertFila(nombreHoja, registro) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(nombreHoja)
  if (!sheet) {
    sheet = ss.insertSheet(nombreHoja)
  }

  const lastRow = sheet.getLastRow()
  let headers = []

  if (lastRow === 0) {
    headers = Object.keys(registro).map(function (k) {
      return typeof registro[k] === 'object' ? k + '_json' : k
    })
    sheet.appendRow(headers)
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
  } else {
    headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0]
      .map(function (h) { return String(h || '').trim() })

    // Si el registro trae campos que la hoja todavía no tiene (por ejemplo
    // encimadaId/encimadaItemId), agregamos las columnas al final en vez de
    // descartar esos datos silenciosamente.
    const faltantes = Object.keys(registro)
      .map(function (k) {
        return registro[k] !== null && typeof registro[k] === 'object'
          ? k + '_json'
          : k
      })
      .filter(function (h) { return headers.indexOf(h) === -1 })

    if (faltantes.length > 0) {
      sheet
        .getRange(1, headers.length + 1, 1, faltantes.length)
        .setValues([faltantes])
        .setFontWeight('bold')
      headers = headers.concat(faltantes)
    }
  }

  // Preparamos los valores para la fila alineados con los encabezados
  const rowData = headers.map(function (header) {
    if (header.endsWith('_json')) {
      const prop = header.replace('_json', '')
      const v = registro[prop] !== undefined ? registro[prop] : registro[header]
      return v ? JSON.stringify(v) : '[]'
    }
    const val = registro[header]
    if (val === undefined || val === null) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return val
  })

  // Buscamos si ya existe por 'id'
  const idColIdx = headers.indexOf('id')
  let filaExistente = -1

  if (idColIdx !== -1 && lastRow > 1 && registro.id) {
    const ids = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues()
    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === String(registro.id)) {
        filaExistente = i + 2 // 1 de header + 1 de 0-indexed
        break
      }
    }
  }

  if (filaExistente > 0) {
    sheet.getRange(filaExistente, 1, 1, rowData.length).setValues([rowData])
  } else {
    sheet.appendRow(rowData)
  }

  return registro
}

/**
 * Guarda varios registros de una misma entidad en una sola llamada.
 * Se usa para renumerar códigos sin disparar un request por fila.
 */
function guardarVarios(payload) {
  const entidad = payload && payload.entidad
  const registros = (payload && payload.registros) || []
  const nombreHoja = ENTIDADES_A_HOJA[entidad]

  if (!nombreHoja) {
    throw new Error('Entidad desconocida: ' + entidad)
  }
  if (!Array.isArray(registros)) {
    throw new Error('registros debe ser un array')
  }

  registros.forEach(function (registro) {
    upsertFila(nombreHoja, registro)
  })

  return { entidad: entidad, guardados: registros.length }
}

function eliminarFila(nombreHoja, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(nombreHoja)
  if (!sheet) throw new Error('Hoja no encontrada: ' + nombreHoja)

  const lastRow = sheet.getLastRow()
  if (lastRow <= 1) return { id: id, eliminado: false }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const idColIdx = headers.indexOf('id')
  if (idColIdx === -1) throw new Error('Columna id no encontrada en ' + nombreHoja)

  const ids = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues()
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.deleteRow(i + 2)
      return { id: id, eliminado: true }
    }
  }

  return { id: id, eliminado: false }
}

function actualizarCampo(nombreHoja, id, campo, valor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = ss.getSheetByName(nombreHoja)
  if (!sheet) throw new Error('Hoja no encontrada: ' + nombreHoja)

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const idColIdx = headers.indexOf('id')
  const campoColIdx = headers.indexOf(campo)

  if (idColIdx === -1 || campoColIdx === -1) {
    throw new Error('Columnas no encontradas en ' + nombreHoja)
  }

  const lastRow = sheet.getLastRow()
  const ids = sheet.getRange(2, idColIdx + 1, lastRow - 1, 1).getValues()
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) {
      sheet.getRange(i + 2, campoColIdx + 1).setValue(valor)
      return { id: id, campo: campo, valor: valor }
    }
  }

  throw new Error('Registro con id ' + id + ' no encontrado.')
}

function jsonResponse(obj, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(obj))
  output.setMimeType(ContentService.MimeType.JSON)
  return output
}

