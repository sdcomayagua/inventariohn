/****************************************************
 * SD COMAYAGUA - Apps Script para Google Sheets
 * Panel privado + inventario + ventas + respaldos
 ****************************************************/
const ADMIN_PIN_FALLBACK = 'CAMBIA_ESTE_PIN';
const SHEETS = {
  estado: 'estado', productos: 'productos', ventas: 'ventas', cotizaciones: 'cotizaciones',
  clientes: 'clientes', gastos: 'gastos', chats: 'chats', catalogos: 'catalogos',
  backups: 'backups', backups_data: 'backups_data', historial: 'historial', errores: 'errores', ajustes: 'ajustes'
};

function setup(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('Abrí este script desde un Google Sheet.');
  ensureSheet_(ss, SHEETS.estado, ['clave','valor','actualizado']);
  ensureSheet_(ss, SHEETS.productos, ['id','nombre','categoria','precio','costo','stock','activo','imagen','descripcion','promos','actualizado']);
  ensureSheet_(ss, SHEETS.ventas, ['codigo','fecha','cliente','telefono','producto','cantidad','subtotal','envio','comision','total','tipoEnvio','direccion']);
  ensureSheet_(ss, SHEETS.cotizaciones, ['codigo','fecha','cliente','producto','cantidad','subtotal','envio','comision','total','tipoEnvio']);
  ensureSheet_(ss, SHEETS.clientes, ['nombre','telefono','departamento','municipio','direccion','actualizado']);
  ensureSheet_(ss, SHEETS.gastos, ['fecha','descripcion','monto','categoria']);
  ensureSheet_(ss, SHEETS.chats, ['fecha','cliente','mensaje','estado']);
  ensureSheet_(ss, SHEETS.catalogos, ['fecha','tipo','detalle']);
  ensureSheet_(ss, SHEETS.backups, ['codigo','fecha','resumen']);
  ensureSheet_(ss, SHEETS.backups_data, ['codigo','json']);
  ensureSheet_(ss, SHEETS.historial, ['fecha','accion','detalle']);
  ensureSheet_(ss, SHEETS.errores, ['fecha','origen','error']);
  ensureSheet_(ss, SHEETS.ajustes, ['clave','valor']);
  seedSettings_(ss);
  log_(ss,'setup','Hojas preparadas sin borrar información existente.');
  return 'Setup completo. Ahora publicá como Aplicación web.';
}

function doGet(e){
  const action = String((e.parameter.action || 'ping')).toLowerCase();
  const callback = sanitizeCallback_(e.parameter.callback || '');
  let result;
  try{
    if(action === 'ping') { requirePin_(e); result = {ok:true, message:'Nube activa', time:new Date().toISOString()}; }
    else if(action === 'load') { requirePin_(e); result = {ok:true, state: loadState_()}; }
    else if(action === 'public') result = publicCatalog_();
    else result = {ok:false, message:'Acción no reconocida'};
  }catch(err){
    writeError_('doGet:'+action, err);
    result = {ok:false, message:String(err.message || err)};
  }
  return json_(result, callback);
}

function doPost(e){
  const action = String((e.parameter.action || 'save')).toLowerCase();
  try{
    requirePin_(e);
    const payload = e.parameter.payload || '{}';
    const state = JSON.parse(payload);
    if(action === 'save'){
      saveState_(state);
      return html_('Guardado en Google Sheets.');
    }
    if(action === 'backup'){
      saveState_(state);
      createBackup_(state);
      return html_('Respaldo completo guardado.');
    }
    return html_('Acción no reconocida.');
  }catch(err){
    writeError_('doPost:'+action, err);
    return html_('Error: ' + String(err.message || err));
  }
}

function installDailyBackupTrigger(){
  ScriptApp.newTrigger('dailyBackupSnapshot').timeBased().everyDays(1).atHour(2).create();
}

function dailyBackupSnapshot(){
  const state = loadState_();
  if(state) createBackup_(state);
}

function setAdminPin(){
  // Cambiá el texto de abajo, ejecutá una vez y luego podés borrar el PIN del código.
  PropertiesService.getScriptProperties().setProperty('ADMIN_PIN', 'CAMBIA_ESTE_PIN');
}

function getPin_(){ return PropertiesService.getScriptProperties().getProperty('ADMIN_PIN') || ADMIN_PIN_FALLBACK; }
function requirePin_(e){
  const expected = getPin_();
  const given = String(e.parameter.pin || '');
  if(!expected || expected === 'CAMBIA_ESTE_PIN') throw new Error('Configurá ADMIN_PIN en Apps Script antes de usar la nube.');
  if(given !== expected) throw new Error('PIN incorrecto.');
}
function sanitizeCallback_(cb){ return /^[a-zA-Z_$][\w$\.]*$/.test(cb) ? cb : ''; }
function json_(obj, callback){
  const text = callback ? callback + '(' + JSON.stringify(obj) + ');' : JSON.stringify(obj);
  return ContentService.createTextOutput(text).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
function html_(msg){ return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><body style="font-family:Arial;padding:20px">'+escapeHtml_(msg)+'</body>'); }
function ensureSheet_(ss, name, headers){
  let sh = ss.getSheetByName(name); if(!sh) sh = ss.insertSheet(name);
  if(sh.getLastRow() === 0) sh.appendRow(headers);
  const existing = sh.getRange(1,1,1,Math.max(headers.length, sh.getLastColumn())).getValues()[0];
  if(String(existing[0]||'') !== headers[0]) { sh.clear(); sh.appendRow(headers); }
  sh.setFrozenRows(1); sh.autoResizeColumns(1, headers.length);
  return sh;
}
function seedSettings_(ss){
  const sh=ss.getSheetByName(SHEETS.ajustes); if(sh.getLastRow()>1) return;
  sh.appendRow(['tienda','SD COMAYAGUA']); sh.appendRow(['whatsapp','50431517755']); sh.appendRow(['envioNormal','110']); sh.appendRow(['envioRecibirBase','100']); sh.appendRow(['comisionRecibir','6']);
}
function loadState_(){
  const sh=SpreadsheetApp.getActive().getSheetByName(SHEETS.estado); if(!sh || sh.getLastRow()<2) return null;
  const values=sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++){ if(values[i][0]==='state_json') return JSON.parse(values[i][1] || '{}'); }
  return null;
}
function saveState_(state){
  const ss=SpreadsheetApp.getActive(); const sh=ss.getSheetByName(SHEETS.estado);
  const json=JSON.stringify(state || {}); sh.clear(); sh.appendRow(['clave','valor','actualizado']); sh.appendRow(['state_json', json, new Date()]);
  writeProducts_(ss, state.productos || []); writeSales_(ss, state.ventas || []); writeQuotes_(ss, state.cotizaciones || []);
  log_(ss,'save','Estado guardado. Productos: '+((state.productos||[]).length)+', ventas: '+((state.ventas||[]).length));
}
function writeProducts_(ss, items){
  const sh=ss.getSheetByName(SHEETS.productos); sh.clear(); sh.appendRow(['id','nombre','categoria','precio','costo','stock','activo','imagen','descripcion','promos','actualizado']);
  if(items.length) sh.getRange(2,1,items.length,11).setValues(items.map(p=>[p.id,p.nombre,p.categoria,p.precio,p.costo,p.stock,p.activo!==false,p.imagen,p.descripcion,p.promos,new Date()]));
}
function writeSales_(ss, items){
  const sh=ss.getSheetByName(SHEETS.ventas); sh.clear(); sh.appendRow(['codigo','fecha','cliente','telefono','producto','cantidad','subtotal','envio','comision','total','tipoEnvio','direccion']);
  if(items.length) sh.getRange(2,1,items.length,12).setValues(items.map(v=>[v.codigo,v.fecha,v.cliente,v.telefono,v.producto,v.cantidad,v.subtotal,v.envio,v.comision,v.total,v.tipoEnvio,v.direccion]));
}
function writeQuotes_(ss, items){
  const sh=ss.getSheetByName(SHEETS.cotizaciones); sh.clear(); sh.appendRow(['codigo','fecha','cliente','producto','cantidad','subtotal','envio','comision','total','tipoEnvio']);
  if(items.length) sh.getRange(2,1,items.length,10).setValues(items.map(v=>[v.codigo,v.fecha,v.cliente,v.producto,v.cantidad,v.subtotal,v.envio,v.comision,v.total,v.tipoEnvio]));
}
function createBackup_(state){
  const ss=SpreadsheetApp.getActive(); const code='BACKUP-'+Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  ss.getSheetByName(SHEETS.backups).appendRow([code,new Date(),'Respaldo completo SD COMAYAGUA']);
  ss.getSheetByName(SHEETS.backups_data).appendRow([code,JSON.stringify(state || {})]);
  const meta = state.meta || {}; meta.lastBackup = new Date().toISOString(); state.meta = meta;
  log_(ss,'backup',code);
}
function publicCatalog_(){
  const state=loadState_();
  const products = state && Array.isArray(state.productos) ? state.productos.filter(p=>p.activo!==false && Number(p.stock)>0).map(p=>({id:p.id,nombre:p.nombre,categoria:p.categoria,precio:p.precio,stock:p.stock,imagen:p.imagen,descripcion:p.descripcion,promos:p.promos})) : [];
  return {ok:true, products:products, ajustes:(state&&state.ajustes)||{}};
}
function log_(ss, action, detail){ try{ ss.getSheetByName(SHEETS.historial).appendRow([new Date(),action,detail]); }catch(e){} }
function writeError_(origin, err){ try{ SpreadsheetApp.getActive().getSheetByName(SHEETS.errores).appendRow([new Date(),origin,String(err.message||err)]); }catch(e){} }
function escapeHtml_(s){ return String(s).replace(/[&<>"]/g, function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]; }); }
