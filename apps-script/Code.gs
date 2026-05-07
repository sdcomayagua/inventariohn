/*****
 * SD COMAYAGUA · Backend de sincronización para GitHub Pages
 * Uso recomendado: Google Sheets > Extensiones > Apps Script > pegar este archivo.
 * 1) Cambia ADMIN_PIN.
 * 2) Ejecuta setup() una vez.
 * 3) Implementar > Nueva implementación > Aplicación web.
 * 4) Ejecutar como: Tú. Acceso: Cualquier usuario con el enlace.
 * 5) Copia la URL que termina en /exec y pégala en la página, botón Nube.
 *****/
const ADMIN_PIN = '199311'; // Cambia este PIN si quieres separar la clave de la página y la clave de nube.
const CHUNK_SIZE = 45000;

function setup() {
  const ss = getBook_();
  ensureSheet_(ss, 'estado', ['updatedAt','label','chunkIndex','totalChunks','jsonChunk']);
  ensureSheet_(ss, 'backups', ['backupId','updatedAt','label','productos','ventas','cotizaciones','clientes','bytes']);
  ensureSheet_(ss, 'backups_data', ['backupId','chunkIndex','totalChunks','jsonChunk']);
  ensureSheet_(ss, 'productos', ['id','nombre','categorias','precio','costo','stock','imagen','galeria','descripcion','promos']);
  ensureSheet_(ss, 'ventas', ['id','fecha','cliente','telefono','estado','total','productos','payload_json']);
  ensureSheet_(ss, 'cotizaciones', ['id','fecha','cliente','telefono','estado','total','productos','payload_json']);
  ensureSheet_(ss, 'clientes', ['key','nombre','telefono','departamento','municipio','referencia','ultima_fecha','ultimo_total','payload_json']);
  ensureSheet_(ss, 'gastos', ['id','fecha','concepto','monto','payload_json']);
  ensureSheet_(ss, 'cierres', ['id','fecha','total','payload_json']);
  ensureSheet_(ss, 'catalogos', ['id','fecha','nombre','payload_json']);
  ensureSheet_(ss, 'chats', ['id','fecha','cliente','telefono','nota','payload_json']);
  return 'Listo. Hojas creadas para SD COMAYAGUA.';
}

function doGet(e) { return route_('GET', e); }
function doPost(e) { return route_('POST', e); }

function route_(method, e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || '').toLowerCase() || 'ping';
    const pin = String((e && e.parameter && e.parameter.pin) || getPostPin_(e) || '');
    if (!isPinOk_(pin)) return json_({ok:false, error:'PIN incorrecto'});

    if (action === 'ping') return json_({ok:true, service:'SDC Sync', updatedAt:new Date().toISOString()});
    if (action === 'load') return json_({ok:true, state:loadLatest_(), updatedAt:new Date().toISOString()});

    const body = method === 'POST' ? parseBody_(e) : {};
    const payload = body.payload || body || {};
    const label = String(payload.label || action || 'sync');
    const state = payload.state || null;
    if (!state || typeof state !== 'object') return json_({ok:false, error:'No llegó el estado de la página'});

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      const updatedAt = saveLatest_(state, label);
      if (action === 'backup') appendBackup_(state, label, updatedAt);
      mirrorSheets_(state);
      return json_({ok:true, updatedAt, action});
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    return json_({ok:false, error:String(err && err.message ? err.message : err)});
  }
}

function dailyBackup() {
  const state = loadLatest_();
  if (!state) return 'No hay estado para respaldar.';
  const updatedAt = new Date().toISOString();
  appendBackup_(state, 'respaldo diario automático', updatedAt);
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
  if (!id) throw new Error('No hay Google Sheet activo. Crea el script desde Extensiones > Apps Script dentro del Sheet.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(ss, name, headers) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  const existing = sh.getRange(1,1,1,headers.length).getValues()[0].join('|');
  if (!existing || existing.replace(/\|/g,'') === '') sh.getRange(1,1,1,headers.length).setValues([headers]);
  sh.setFrozenRows(1);
  return sh;
}

function isPinOk_(pin) { return String(pin) === String(ADMIN_PIN); }
function getPostPin_(e) {
  try { return JSON.parse(e.postData.contents || '{}').pin || ''; } catch(err) { return ''; }
}
function parseBody_(e) {
  const raw = (e && e.postData && e.postData.contents) || '{}';
  try { return JSON.parse(raw); } catch(err) { return {}; }
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function chunks_(text) {
  const out = [];
  for (let i=0; i<text.length; i+=CHUNK_SIZE) out.push(text.slice(i, i+CHUNK_SIZE));
  return out.length ? out : [''];
}

function saveLatest_(state, label) {
  const ss = getBook_();
  const sh = ensureSheet_(ss, 'estado', ['updatedAt','label','chunkIndex','totalChunks','jsonChunk']);
  const json = JSON.stringify(state);
  const parts = chunks_(json);
  const updatedAt = new Date().toISOString();
  if (sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,5).clearContent();
  sh.getRange(2,1,parts.length,5).setValues(parts.map((c,i)=>[updatedAt,label,i+1,parts.length,c]));
  return updatedAt;
}

function loadLatest_() {
  const ss = getBook_();
  const sh = ss.getSheetByName('estado');
  if (!sh || sh.getLastRow() < 2) return null;
  const rows = sh.getRange(2,1,sh.getLastRow()-1,5).getValues().filter(r => r[4] !== '');
  if (!rows.length) return null;
  rows.sort((a,b)=>Number(a[2])-Number(b[2]));
  const json = rows.map(r=>String(r[4]||'')).join('');
  return JSON.parse(json);
}

function appendBackup_(state, label, updatedAt) {
  const ss = getBook_();
  const meta = ensureSheet_(ss, 'backups', ['backupId','updatedAt','label','productos','ventas','cotizaciones','clientes','bytes']);
  const data = ensureSheet_(ss, 'backups_data', ['backupId','chunkIndex','totalChunks','jsonChunk']);
  const json = JSON.stringify(state);
  const parts = chunks_(json);
  const id = 'BK-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random()*900+100);
  meta.appendRow([id, updatedAt || new Date().toISOString(), label, count_(state.products), count_(state.sales), count_(state.quotes), count_(state.clients), json.length]);
  data.getRange(data.getLastRow()+1,1,parts.length,4).setValues(parts.map((c,i)=>[id,i+1,parts.length,c]));
}

function mirrorSheets_(state) {
  const ss = getBook_();
  writeRows_(ss, 'productos', ['id','nombre','categorias','precio','costo','stock','imagen','galeria','descripcion','promos'], (state.products||[]).map(p=>[
    p.id||'', p.name||p.nombre||'', p.categories||p.categoria||'', num_(p.price), num_(p.cost), num_(p.stock), p.image||'', p.gallery||'', p.description||'', p.promos||''
  ]));
  writeRows_(ss, 'ventas', ['id','fecha','cliente','telefono','estado','total','productos','payload_json'], (state.sales||[]).map(s=>[
    s.id||'', s.date||'', s.client||'', s.phone||'', s.status||s.paymentStatus||'', total_(s), items_(s), JSON.stringify(s)
  ]));
  writeRows_(ss, 'cotizaciones', ['id','fecha','cliente','telefono','estado','total','productos','payload_json'], (state.quotes||[]).map(q=>[
    q.id||'', q.date||'', q.client||'', q.phone||'', q.status||'', total_(q), items_(q), JSON.stringify(q)
  ]));
  writeRows_(ss, 'clientes', ['key','nombre','telefono','departamento','municipio','referencia','ultima_fecha','ultimo_total','payload_json'], (state.clients||[]).map(c=>[
    c.key||c.id||'', c.name||'', c.phone||'', c.department||'', c.municipality||'', c.reference||'', c.lastDate||'', c.lastTotal||'', JSON.stringify(c)
  ]));
  writeRows_(ss, 'gastos', ['id','fecha','concepto','monto','payload_json'], (state.expenses||[]).map(x=>[x.id||'', x.date||'', x.name||'', num_(x.amount), JSON.stringify(x)]));
  writeRows_(ss, 'cierres', ['id','fecha','total','payload_json'], (state.closings||[]).map(x=>[x.id||'', x.date||'', x.total||'', JSON.stringify(x)]));
  writeRows_(ss, 'catalogos', ['id','fecha','nombre','payload_json'], (state.catalogs||[]).map(x=>[x.id||'', x.date||'', x.name||'', JSON.stringify(x)]));
  writeRows_(ss, 'chats', ['id','fecha','cliente','telefono','nota','payload_json'], (state.chats||[]).map(x=>[x.id||'', x.date||'', x.client||'', x.phone||'', x.note||x.text||'', JSON.stringify(x)]));
}

function writeRows_(ss, name, headers, rows) {
  const sh = ensureSheet_(ss, name, headers);
  if (sh.getLastRow() > 1) sh.getRange(2,1,sh.getLastRow()-1,headers.length).clearContent();
  if (rows.length) sh.getRange(2,1,rows.length,headers.length).setValues(rows);
}
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
