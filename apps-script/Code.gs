/*
  SD COMAYAGUA · Apps Script compatible con V60 Mobile POS
  Acciones soportadas:
  GET  ?action=products&sheetId=...&productSheet=productos_pos
  POST action=upsertProduct | setActive | updateStock | batchUpdateStock | saveDocument
*/

const SDC_DEFAULT_PRODUCT_SHEET = 'productos_pos';
const SDC_SALES_SHEET = 'ventas_pos';
const SDC_QUOTES_SHEET = 'cotizaciones_pos';

const PRODUCT_HEADERS = [
  'codigo','nombre','categoria','marca','precio','costo','stock','imagen','galeria','descripcion','promos','activo','fecha_actualizacion'
];

const DOCUMENT_HEADERS = [
  'id','fecha','tipo','cliente','telefono','departamento','municipio','entrega','pago','subtotal_productos','envio','comision','descuento','total','estado','items_json','documento_json'
];

function doGet(e){
  const params = e && e.parameter ? e.parameter : {};
  try{
    const action = String(params.action || 'products');
    if(action === 'products'){
      const ss = openBook_(params.sheetId);
      const sheet = getOrCreateSheet_(ss, params.productSheet || SDC_DEFAULT_PRODUCT_SHEET, PRODUCT_HEADERS);
      const rows = readObjects_(sheet);
      return output_({ok:true, products: rows}, params.callback);
    }
    return output_({ok:false, error:'Acción GET no soportada: '+action}, params.callback);
  }catch(err){
    return output_({ok:false, error:String(err && err.message || err)}, params.callback);
  }
}

function doPost(e){
  try{
    const body = JSON.parse(e && e.postData && e.postData.contents ? e.postData.contents : '{}');
    const action = String(body.action || '');
    const ss = openBook_(body.sheetId);
    const productSheetName = body.productSheet || SDC_DEFAULT_PRODUCT_SHEET;

    if(action === 'upsertProduct'){
      const sheet = getOrCreateSheet_(ss, productSheetName, PRODUCT_HEADERS);
      const product = body.product || {};
      upsertProduct_(sheet, product, body.previousCodigo || body.codigo || product.codigo || product.id);
      return output_({ok:true, action});
    }

    if(action === 'setActive'){
      const sheet = getOrCreateSheet_(ss, productSheetName, PRODUCT_HEADERS);
      setProductField_(sheet, body.codigo, 'activo', body.active === false ? false : true);
      return output_({ok:true, action});
    }

    if(action === 'updateStock'){
      const sheet = getOrCreateSheet_(ss, productSheetName, PRODUCT_HEADERS);
      setProductField_(sheet, body.codigo, 'stock', Number(body.stock || 0));
      return output_({ok:true, action});
    }

    if(action === 'batchUpdateStock'){
      const sheet = getOrCreateSheet_(ss, productSheetName, PRODUCT_HEADERS);
      (body.updates || []).forEach(function(u){ setProductField_(sheet, u.codigo, 'stock', Number(u.stock || 0)); });
      return output_({ok:true, action, count:(body.updates || []).length});
    }

    if(action === 'saveDocument'){
      const kind = String(body.kind || (body.document && body.document.kind) || 'quote');
      const sheetName = kind === 'sale' || kind === 'receipt' ? SDC_SALES_SHEET : SDC_QUOTES_SHEET;
      const sheet = getOrCreateSheet_(ss, sheetName, DOCUMENT_HEADERS);
      appendDocument_(sheet, body.document || {}, kind);
      return output_({ok:true, action, kind});
    }

    return output_({ok:false, error:'Acción POST no soportada: '+action});
  }catch(err){
    return output_({ok:false, error:String(err && err.message || err)});
  }
}

function openBook_(sheetId){
  const id = String(sheetId || '').trim();
  if(id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(ss, name, headers){
  const cleanName = String(name || '').trim() || SDC_DEFAULT_PRODUCT_SHEET;
  let sheet = ss.getSheetByName(cleanName);
  if(!sheet) sheet = ss.insertSheet(cleanName);
  ensureHeaders_(sheet, headers);
  return sheet;
}

function ensureHeaders_(sheet, headers){
  if(sheet.getLastRow() === 0){
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  const current = sheet.getRange(1,1,1,Math.max(sheet.getLastColumn(), headers.length)).getValues()[0].map(String);
  const lower = current.map(function(h){return normalizeHeader_(h);});
  const missing = headers.filter(function(h){return lower.indexOf(normalizeHeader_(h)) === -1;});
  if(missing.length){
    sheet.getRange(1,current.length+1,1,missing.length).setValues([missing]);
  }
  sheet.setFrozenRows(1);
}

function readObjects_(sheet){
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if(lastRow < 2 || lastCol < 1) return [];
  const values = sheet.getRange(1,1,lastRow,lastCol).getValues();
  const headers = values.shift().map(function(h){return normalizeHeader_(h);});
  return values.map(function(row){
    const obj = {};
    headers.forEach(function(h,i){ obj[h] = row[i]; });
    return obj;
  }).filter(function(row){
    const active = String(row.activo === undefined ? '1' : row.activo).trim().toLowerCase();
    return active !== '0' && active !== 'false' && active !== 'no';
  });
}

function upsertProduct_(sheet, product, previousCodigo){
  const headers = normalizedHeaders_(sheet);
  const codigo = String(product.codigo || product.id || previousCodigo || '').trim();
  if(!codigo) throw new Error('Producto sin código.');
  const rowIndex = findProductRow_(sheet, previousCodigo || codigo);
  const row = buildProductRow_(headers, product, codigo);
  if(rowIndex > 0){
    sheet.getRange(rowIndex,1,1,row.length).setValues([row]);
  }else{
    sheet.appendRow(row);
  }
}

function buildProductRow_(headers, product, codigo){
  const data = {
    codigo: codigo,
    id: codigo,
    nombre: product.nombre || product.name || '',
    name: product.nombre || product.name || '',
    categoria: product.categoria || product.categories || product.category || '',
    categorias: product.categoria || product.categories || product.category || '',
    marca: product.marca || product.brand || '',
    brand: product.marca || product.brand || '',
    precio: Number(product.precio || product.price || 0),
    price: Number(product.precio || product.price || 0),
    costo: Number(product.costo || product.cost || 0),
    cost: Number(product.costo || product.cost || 0),
    stock: Number(product.stock || 0),
    imagen: product.imagen || product.image || '',
    image: product.imagen || product.image || '',
    galeria: Array.isArray(product.gallery) ? product.gallery.join('\n') : (product.galeria || product.gallery || ''),
    gallery: Array.isArray(product.gallery) ? product.gallery.join('\n') : (product.galeria || product.gallery || ''),
    descripcion: product.descripcion || product.description || '',
    description: product.descripcion || product.description || '',
    promos: product.promos || product.promociones || '',
    promociones: product.promos || product.promociones || '',
    activo: product.active === false || product.activo === false ? false : true,
    active: product.active === false || product.activo === false ? false : true,
    fechaactualizacion: new Date(),
    fecha_actualizacion: new Date(),
    updatedat: new Date()
  };
  return headers.map(function(h){ return data[h] !== undefined ? data[h] : ''; });
}

function setProductField_(sheet, codigo, field, value){
  const rowIndex = findProductRow_(sheet, codigo);
  if(rowIndex < 1) throw new Error('No se encontró el producto: '+codigo);
  const headers = normalizedHeaders_(sheet);
  const col = headers.indexOf(normalizeHeader_(field)) + 1;
  if(col < 1) throw new Error('No existe la columna: '+field);
  sheet.getRange(rowIndex,col).setValue(value);
  const updatedCol = headers.indexOf('fechaactualizacion') + 1 || headers.indexOf('fecha_actualizacion') + 1 || headers.indexOf('updatedat') + 1;
  if(updatedCol > 0) sheet.getRange(rowIndex, updatedCol).setValue(new Date());
}

function findProductRow_(sheet, codigo){
  const clean = String(codigo || '').trim();
  if(!clean) return -1;
  const headers = normalizedHeaders_(sheet);
  const codeCol = Math.max(headers.indexOf('codigo'), headers.indexOf('id'), headers.indexOf('code'), headers.indexOf('sku')) + 1;
  if(codeCol < 1) return -1;
  const lastRow = sheet.getLastRow();
  if(lastRow < 2) return -1;
  const values = sheet.getRange(2,codeCol,lastRow-1,1).getValues().map(function(r){return String(r[0] || '').trim();});
  const ix = values.indexOf(clean);
  return ix >= 0 ? ix + 2 : -1;
}

function appendDocument_(sheet, doc, kind){
  const c = calcDocument_(doc);
  const row = [
    doc.id || '',
    doc.date || new Date(),
    kind,
    doc.client || doc.customer || '',
    doc.phone || '',
    doc.department || '',
    doc.municipality || '',
    doc.company || doc.shippingType || '',
    doc.payment || doc.paymentType || '',
    c.products,
    c.shipping,
    c.commission,
    c.discount,
    c.total,
    doc.status || '',
    JSON.stringify(doc.items || []),
    JSON.stringify(doc)
  ];
  sheet.appendRow(row);
}

function calcDocument_(doc){
  const items = doc.items || [];
  const products = items.reduce(function(sum,it){
    const qty = Math.max(1, Number(it.qty || 1));
    const price = Number(it.price || it.unitPrice || 0);
    const total = Number(it.total || 0);
    return sum + (total > 0 ? total : qty * price);
  },0);
  const shipping = Number(doc.shipping || 0);
  const commission = Number(doc.commission || 0);
  const discount = Number(doc.discount || 0);
  return {products:products, shipping:shipping, commission:commission, discount:discount, total:products + shipping + commission - discount};
}

function normalizedHeaders_(sheet){
  if(sheet.getLastColumn() < 1) return [];
  return sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0].map(normalizeHeader_);
}

function normalizeHeader_(h){
  return String(h || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_]+/g,'').replace(/_/g,'');
}

function output_(payload, callback){
  const json = JSON.stringify(payload);
  if(callback){
    return ContentService.createTextOutput(String(callback)+'('+json+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}
