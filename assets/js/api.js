import { CONFIG } from './config.js';
import { normalizeProduct, uid, nowIso, toNumber, linePriceForQty } from './helpers.js';

const STORAGE_KEY = 'sdc_pos_demo_v4';
const KEY_STORAGE = 'sdc_admin_key';

const demoProducts = [
  { id:'prod-sdc-001', codigo:'SDC-001', nombre:'Dedales o Fundas para Dedos', categoria:'Dedales', marca:'', descripcion:'Dedales gamer para celular. Ideales para mejor deslizamiento y precisión.', costo:8, precio:25, stock:227, activo:true, imagen:'', promos:'1=25 | 2=50 | 3=69 | 4=92 | 5=110 | 6=132 | 7=154 | 8=168 | 9=189 | 10=200', orden:1 },
  { id:'prod-sdc-002', codigo:'SDC-002', nombre:'Gatillos Gamer Pro / Triggers Pro para celular', categoria:'Gamer Móvil', marca:'', descripcion:'Trigger gamer para celular, ideal para Free Fire, PUBG Mobile y Call of Duty Mobile.', costo:190, precio:400, stock:12, activo:true, imagen:'', promos:'', orden:2 },
  { id:'prod-sdc-003', codigo:'SDC-003', nombre:'Enfriador X112', categoria:'Enfriador Gamer para Celular', marca:'', descripcion:'Cooler para celular. Ayuda a bajar la temperatura durante partidas largas.', costo:250, precio:400, stock:2, activo:true, imagen:'', promos:'', orden:3 },
  { id:'prod-sdc-010', codigo:'SDC-010', nombre:'Adaptador MicroSD – USB 2.0', categoria:'Tecnología / Accesorios', marca:'', descripcion:'Adaptador compacto para memorias MicroSD.', costo:0, precio:60, stock:1, activo:true, imagen:'', promos:'', orden:10 },
  { id:'prod-sdc-029', codigo:'SDC-029', nombre:'Afilador de Cuchillos – 3 Niveles', categoria:'Cocina / Hogar', marca:'', descripcion:'Afilador práctico con tres niveles.', costo:0, precio:100, stock:1, activo:true, imagen:'', promos:'', orden:29 }
];

function isRemote(){ return CONFIG.API_URL && !CONFIG.API_URL.includes('PEGA_AQUI'); }
function loadDemo(){
  const saved = localStorage.getItem(STORAGE_KEY);
  if(saved){ try { return JSON.parse(saved); } catch{} }
  const data = { productos: demoProducts, cotizaciones: [], ventas: [] };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}
function saveDemo(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function getAdminKey(){
  if(CONFIG.ADMIN_KEY) return CONFIG.ADMIN_KEY;
  let key = localStorage.getItem(KEY_STORAGE) || '';
  if(!key){
    key = window.prompt('Ingrese su clave admin para guardar cambios. Se guardará solo en este navegador:') || '';
    if(key) localStorage.setItem(KEY_STORAGE, key);
  }
  return key;
}

export function clearAdminKey(){ localStorage.removeItem(KEY_STORAGE); }

export async function getInit(){
  if(!isRemote()){
    const data = loadDemo();
    return { productos:data.productos.map(normalizeProduct), cotizaciones:data.cotizaciones || [], ventas:data.ventas || [], demo:true };
  }
  const res = await fetch(`${CONFIG.API_URL}?action=init&v=${Date.now()}`);
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Error cargando datos.');
  const data = json.data || {};
  return {
    productos:(data.productos || []).map(normalizeProduct),
    cotizaciones:data.cotizaciones || [],
    ventas:data.ventas || [],
    ajustes:data.ajustes || [],
    demo:false
  };
}

async function post(action, payload){
  if(!isRemote()) return demoPost(action, payload);
  const key = getAdminKey();
  const res = await fetch(CONFIG.API_URL, { method:'POST', body:JSON.stringify({ action, payload, key }) });
  const json = await res.json();
  if(!json.ok){
    if(String(json.error || '').toLowerCase().includes('clave')) localStorage.removeItem(KEY_STORAGE);
    throw new Error(json.error || 'Error guardando datos.');
  }
  return json.data || {};
}

function quoteTotalsForDemo(quote, products){
  const subtotal = (quote.items || []).reduce((sum,item)=>{
    const p = products.find(prod=>String(prod.id) === String(item.productId)) || item;
    return sum + linePriceForQty(p, item.qty);
  },0);
  const envio = toNumber(quote.envio?.costo || 0);
  const comision = toNumber(quote.envio?.comision || 0);
  return { subtotal, envio, comision, total:subtotal + envio + comision };
}

function demoPost(action, payload){
  const data = loadDemo();
  if(action === 'saveQuote'){
    const quote = payload.quote;
    const idx = data.cotizaciones.findIndex(q => q.id === quote.id);
    if(idx >= 0) data.cotizaciones[idx] = quote; else data.cotizaciones.unshift(quote);
    saveDemo(data); return Promise.resolve({ quote, cotizaciones:data.cotizaciones });
  }
  if(action === 'convertQuoteToSale'){
    const quote = payload.quote;
    for(const item of quote.items || []){
      const p = data.productos.find(prod => prod.id === item.productId);
      if(!p) throw new Error(`Producto no encontrado: ${item.nombre}`);
      if(Number(p.stock) < Number(item.qty)) throw new Error(`Stock insuficiente: ${item.nombre}`);
    }
    for(const item of quote.items || []){
      const p = data.productos.find(prod => prod.id === item.productId);
      p.stock = Number(p.stock) - Number(item.qty);
    }
    const sale = { ...quote, id: uid('VEN'), cotizacion_id: quote.id, estado:'activa', fecha_venta: nowIso() };
    data.ventas.unshift(sale);
    const qidx = data.cotizaciones.findIndex(q => q.id === quote.id);
    if(qidx >= 0) data.cotizaciones[qidx] = { ...quote, estado:'convertida' }; else data.cotizaciones.unshift({ ...quote, estado:'convertida' });
    saveDemo(data); return Promise.resolve({ sale, productos:data.productos, cotizaciones:data.cotizaciones, ventas:data.ventas });
  }
  if(action === 'cancelSale'){
    const sale = data.ventas.find(v => v.id === payload.saleId);
    if(!sale) throw new Error('Venta no encontrada');
    if(sale.estado !== 'cancelada'){
      for(const item of sale.items || []){ const p = data.productos.find(prod=>prod.id===item.productId); if(p) p.stock = Number(p.stock) + Number(item.qty); }
      sale.estado = 'cancelada'; sale.cancelled_at = nowIso();
    }
    saveDemo(data); return Promise.resolve({ sale, productos:data.productos, ventas:data.ventas });
  }
  if(action === 'upsertProduct'){
    const product = normalizeProduct(payload.product);
    if(!product.id || product.id.startsWith('PROD-')) product.id = uid('PROD');
    const idx = data.productos.findIndex(p => String(p.id) === String(product.id));
    if(idx >= 0) data.productos[idx] = { ...data.productos[idx], ...product, updatedAt:nowIso() }; else data.productos.unshift({ ...product, updatedAt:nowIso() });
    saveDemo(data); return Promise.resolve({ product, productos:data.productos });
  }
  if(action === 'setProductActive'){
    const p = data.productos.find(prod => String(prod.id) === String(payload.id));
    if(!p) throw new Error('Producto no encontrado');
    p.activo = !!payload.activo; saveDemo(data); return Promise.resolve({ product:p, productos:data.productos });
  }
  if(action === 'uploadImage'){
    return Promise.resolve({ url: payload.image?.base64 || '' });
  }
  return Promise.resolve({});
}

export const api = {
  saveQuote: quote => post('saveQuote', { quote }),
  convertQuoteToSale: quote => post('convertQuoteToSale', { quote }),
  cancelSale: saleId => post('cancelSale', { saleId }),
  upsertProduct: product => post('upsertProduct', { product }),
  setProductActive: (id, activo) => post('setProductActive', { id, activo }),
  uploadImage: image => post('uploadImage', { image })
};
