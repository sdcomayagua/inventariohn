/*****
 * SD COMAYAGUA · Backend privado para GitHub Pages + Google Sheets
 *
 * Instrucciones rápidas:
 * 1) Cambia ADMIN_PIN o crea una propiedad de script llamada ADMIN_PIN.
 * 2) Ejecuta setup() una vez.
 * 3) Implementar > Nueva implementación > Aplicación web.
 * 4) Ejecutar como: Tú. Acceso: Cualquier usuario con el enlace.
 * 5) Copia la URL /exec y guárdala en el panel Nube de la página.
 *****/
const ADMIN_PIN = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN') || 'CAMBIA_ESTE_PIN';
const CHUNK_SIZE = 45000;
const SHEETS = {
  estado: ['updatedAt','label','chunkIndex','totalChunks','jsonChunk'],
  backups: ['backupId','updatedAt','label','productos','ventas','cotizaciones','clientes','bytes'],
  backups_data: ['backupId','chunkIndex','totalChunks','jsonChunk'],
  productos: ['id','nombre','categorias','precio','costo','stock','imagen','galeria','descripcion','promos','updatedAt'],
  ventas: ['id','fecha','cliente','telefono','estado','total','productos','payload_json'],
  cotizaciones: ['id','fecha','cliente','telefono','estado','total','productos','payload_json'],
  clientes: ['key','nombre','telefono','departamento','municipio','referencia','ultima_fecha','ultimo_total','payload_json'],
  gastos: ['id','fecha','concepto','monto','payload_json'],
  cierres: ['id','fecha','total','payload_json'],
  catalogos: ['id','fecha','nombre','payload_json'],
  chats: ['id','fecha','cliente','telefono','nota','payload_json'],
  ajustes: ['clave','valor','descripcion'],
  envios: ['tipo','departamento','municipio','empresa','precio','nota','activo'],
  cupones: ['codigo','tipo','valor','activo','usos','nota'],
  historial: ['fecha','accion','label','productos','ventas','cotizaciones','clientes'],
  errores: ['fecha','accion','mensaje','detalle']
};

function setup() {
  const ss = getBook_();
  Object.keys(SHEETS).forEach(name => ensureSheet_(ss, name, SHEETS[name]));
  seedSettings_(ss);
  return 'Listo. Estructura creada para SD COMAYAGUA.';
}

function doGet(e) { return route_('GET', e); }
function doPost(e) { return route_('POST', e); }

function route_(method, e) {
  const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase() || 'ping';
  try {
    const pin = String((e && e.parameter && e.parameter.pin) || getPostPin_(e) || '');
    if (!isPinOk_(pin)) return json_({ok:false, error:'PIN incorrecto'});

    if (action === 'ping') return json_({ok:true, service:'SDC Sync', updatedAt:new Date().toISOString()});
    if (action === 'load') return json_({ok:true, state:loadLatest_(), updatedAt:new Date().toISOString()});
    if (action === 'listbackups') return json_({ok:true, backups:listBackups_()});
    if (action === 'restore') {
      const backupId = String((e && e.parameter && e.parameter.backupId) || '');
      if (!backupId) return json_({ok:false, error:'Falta backupId'});
      return json_({ok:true, state:loadBackup_(backupId), backupId});
    }

    const body = method === 'POST' ? parseBody_(e) : {};
    const payload = body.payload || body || {};
    const label = String(payload.label || action || 'sync');
    const state = payload.state || null;
    if (!state || typeof state !== 'object') return json_({ok:false, error:'No llegó el estado de la página'});

    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const updatedAt = saveLatest_(state, label);
      if (action === 'backup') appendBackup_(state, label, updatedAt);
      mirrorSheets_(state);
      logHistory_(action, label, state);
      return json_({ok:true, updatedAt, action});
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    logError_(action, err);
    return json_({ok:false, error:String(err && err.message ? err.message : err)});
  }
}

function dailyBackup() {
  const state = loadLatest_();
  if (!state) return 'No hay estado para respaldar.';
  const updatedAt = new Date().toISOString();
  appendBackup_(state, 'respaldo diario automático', updatedAt);
  logHistory_('backup_auto', 'respaldo diario automático', state);
  return 'Respaldo diario creado: ' + updatedAt;
}

function installDailyBackupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'dailyBackup') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyBackup').timeBased().everyDays(1).atHour(3).create();
  return 'Trigger diario instalado a las 3:00 a. m.';
}

function getBook_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('No hay Google Sheet activo. Crea el script desde Extensiones > Apps Script dentro del Sheet o define SHEET_ID.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  const current = sh.getRange(1,1,1,Math.max(headers.length, sh.getLastColumn())).getValues()[0].map(String);
  headers.forEach((h, i) => { if (current[i] !== h) sh.getRange(1, i+1).setValue(h); });
  sh.setFrozenRows(1);
  try { sh.autoResizeColumns(1, headers.length); } catch(err) {}
  return sh;
}

function seedSettings_(ss) {
  const sh = ensureSheet_(ss, 'ajustes', SHEETS.ajustes);
  if (sh.getLastRow() > 1) return;
  sh.getRange(2,1,7,3).setValues([
    ['nombre_tienda','SD COMAYAGUA','Nombre comercial'],
    ['whatsapp','+504 3151-7755','WhatsApp principal'],
    ['envio_normal','110','Envío normal fijo'],
    ['pagar_al_recibir_base','100','Base de envío para pagar al recibir'],
    ['comision_pagar_al_recibir','6','Porcentaje de comisión'],
    ['moneda','Lps.','Etiqueta de moneda'],
    ['ubicacion','Colonia Piedras Bonitas, Comayagua','Referencia general']
  ]);
}

function isPinOk_(pin) { return String(pin) === String(ADMIN_PIN); }
function getPostPin_(e) { try { return JSON.parse(e.postData.contents || '{}').pin || ''; } catch(err) { return ''; } }
function parseBody_(e) { const raw = (e && e.postData && e.postData.contents) || '{}'; try { return JSON.parse(raw); } catch(err) { return {}; } }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function chunks_(text) { const out=[]; for (let i=0;i<text.length;i+=CHUNK_SIZE) out.push(text.slice(i,i+CHUNK_SIZE)); return out.length ? out : ['']; }

function saveLatest_(state, label) {
  const ss = getBook_();
  const sh = ensureSheet_(ss, 'estado', SHEETS.estado);
  const json = JSON.stringify(state);
  const parts = chunks_(json);
  const updatedAt = new Date().toISOString();
  if (sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,SHEETS.estado.length).clearContent();
  sh.getRange(2,1,parts.length,SHEETS.estado.length).setValues(parts.map((c,i)=>[updatedAt,label,i+1,parts.length,c]));
  return updatedAt;
}

function loadLatest_() {
  const ss = getBook_();
  const sh = ss.getSheetByName('estado');
  if (!sh || sh.getLastRow() < 2) return null;
  const rows = sh.getRange(2,1,sh.getLastRow()-1,SHEETS.estado.length).getValues().filter(r => r[4] !== '');
  if (!rows.length) return null;
  rows.sort((a,b)=>Number(a[2])-Number(b[2]));
  return JSON.parse(rows.map(r=>String(r[4]||'')).join(''));
}

function appendBackup_(state, label, updatedAt) {
  const ss = getBook_();
  const meta = ensureSheet_(ss, 'backups', SHEETS.backups);
  const data = ensureSheet_(ss, 'backups_data', SHEETS.backups_data);
  const json = JSON.stringify(state);
  const parts = chunks_(json);
  const id = 'BK-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random()*900+100);
  meta.appendRow([id, updatedAt || new Date().toISOString(), label, count_(state.products), count_(state.sales), count_(state.quotes), count_(state.clients), json.length]);
  data.getRange(data.getLastRow()+1,1,parts.length,SHEETS.backups_data.length).setValues(parts.map((c,i)=>[id,i+1,parts.length,c]));
  return id;
}

function listBackups_() {
  const sh = getBook_().getSheetByName('backups');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2,1,sh.getLastRow()-1,SHEETS.backups.length).getValues().map(r => ({backupId:r[0], updatedAt:r[1], label:r[2], productos:r[3], ventas:r[4], cotizaciones:r[5], clientes:r[6], bytes:r[7]})).reverse();
}

function loadBackup_(backupId) {
  const sh = getBook_().getSheetByName('backups_data');
  if (!sh || sh.getLastRow() < 2) throw new Error('No hay respaldos guardados.');
  const rows = sh.getRange(2,1,sh.getLastRow()-1,SHEETS.backups_data.length).getValues().filter(r => String(r[0]) === String(backupId));
  if (!rows.length) throw new Error('No se encontró el respaldo solicitado.');
  rows.sort((a,b)=>Number(a[1])-Number(b[1]));
  return JSON.parse(rows.map(r=>String(r[3]||'')).join(''));
}

function mirrorSheets_(state) {
  const ss = getBook_();
  writeRows_(ss, 'productos', SHEETS.productos, (state.products||[]).map(p=>[
    p.id||'', p.name||p.nombre||'', p.categories||p.categoria||'', num_(p.price), num_(p.cost), num_(p.stock), p.image||'', p.gallery||'', p.description||'', p.promos||'', p.updatedAt||''
  ]));
  writeRows_(ss, 'ventas', SHEETS.ventas, (state.sales||[]).map(s=>[s.id||'', s.date||'', s.client||'', s.phone||'', s.status||s.paymentStatus||'', total_(s), items_(s), JSON.stringify(s)]));
  writeRows_(ss, 'cotizaciones', SHEETS.cotizaciones, (state.quotes||[]).map(q=>[q.id||'', q.date||'', q.client||'', q.phone||'', q.status||'', total_(q), items_(q), JSON.stringify(q)]));
  writeRows_(ss, 'clientes', SHEETS.clientes, (state.clients||[]).map(c=>[c.key||c.id||'', c.name||'', c.phone||'', c.department||'', c.municipality||'', c.reference||'', c.lastDate||'', c.lastTotal||'', JSON.stringify(c)]));
  writeRows_(ss, 'gastos', SHEETS.gastos, (state.expenses||[]).map(x=>[x.id||'', x.date||'', x.name||'', num_(x.amount), JSON.stringify(x)]));
  writeRows_(ss, 'cierres', SHEETS.cierres, (state.closings||[]).map(x=>[x.id||'', x.date||'', x.total||'', JSON.stringify(x)]));
  writeRows_(ss, 'catalogos', SHEETS.catalogos, (state.catalogs||[]).map(x=>[x.id||'', x.date||'', x.name||'', JSON.stringify(x)]));
  writeRows_(ss, 'chats', SHEETS.chats, (state.chats||[]).map(x=>[x.id||'', x.date||'', x.client||'', x.phone||'', x.note||x.text||'', JSON.stringify(x)]));
}

function writeRows_(ss, name, headers, rows) {
  const sh = ensureSheet_(ss, name, headers);
  if (sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,headers.length).clearContent();
  if (rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}
function logHistory_(action, label, state) { try { ensureSheet_(getBook_(), 'historial', SHEETS.historial).appendRow([new Date().toISOString(), action, label, count_(state.products), count_(state.sales), count_(state.quotes), count_(state.clients)]); } catch(err) {} }
function logError_(action, err) { try { ensureSheet_(getBook_(), 'errores', SHEETS.errores).appendRow([new Date().toISOString(), action, String(err && err.message ? err.message : err), JSON.stringify(err || {})]); } catch(e) {} }
function count_(arr) { return Array.isArray(arr) ? arr.length : 0; }
function num_(v) { return Number(v || 0) || 0; }
function items_(doc) { return (doc.items||[]).map(i => `${i.name||''} x${i.qty||1}`).join(' | '); }
function total_(doc) {
  if (doc.total) return Number(doc.total)||0;
  const products = (doc.items||[]).reduce((a,i)=>a + (Number(i.qty||1) * Number(i.price||0)), 0);
  const shipping = Number(doc.shipping||0);
  const discount = Number(doc.discount||0);
  const commission = doc.cod ? Math.round((products + shipping) * 0.06) : Number(doc.commission||0);
  return Math.max(0, products + shipping + commission - discount);
}
