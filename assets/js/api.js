import { CONFIG } from './config.js';
import { normalizeProduct, uid, nowIso } from './helpers.js';

const LS_KEY = 'sdc_pos_pro_v2_demo_data';

function apiEnabled(){
  return CONFIG.API_URL && !CONFIG.API_URL.includes('PEGA_AQUI') && CONFIG.API_URL.startsWith('https://');
}

function demoSeed(){
  return {
    productos: [
      { id:'p1', codigo:'WM-012', nombre:'Woofer Magnetic 12"', categoria:'Tecnología', marca:'Excellent', descripcion:'Parlante magnético de alta potencia.', costo:1450, precio:2160, stock:12, activo:true, imagen:'assets/img/product-placeholder.svg', promos_json:'[{"qty":3,"price":2060},{"qty":5,"price":1960}]', orden:1 },
      { id:'p2', codigo:'SP-001', nombre:'Parlantes Kisonli 3"', categoria:'Audio', marca:'Kisonli', descripcion:'Parlantes compactos para PC y escritorio.', costo:260, precio:450, stock:24, activo:true, imagen:'assets/img/product-placeholder.svg', promos_json:'[{"qty":3,"price":420},{"qty":5,"price":390}]', orden:2 },
      { id:'p3', codigo:'CR-33W', nombre:'Cargador Rápido 33W', categoria:'Cargadores', marca:'Samsung', descripcion:'Cargador rápido tipo C.', costo:105, precio:190, stock:36, activo:true, imagen:'assets/img/product-placeholder.svg', promos_json:'[{"qty":3,"price":180},{"qty":5,"price":170}]', orden:3 },
      { id:'p4', codigo:'TWS-001', nombre:'Audífonos Inalámbricos TWS', categoria:'Audio', marca:'TWS', descripcion:'Audífonos bluetooth con estuche.', costo:220, precio:350, stock:18, activo:true, imagen:'assets/img/product-placeholder.svg', promos_json:'[{"qty":3,"price":330},{"qty":5,"price":310}]', orden:4 },
      { id:'p5', codigo:'TRG-001', nombre:'Triggers Gamer (Par)', categoria:'Gamer', marca:'Genérico', descripcion:'Gatillos para juegos móviles.', costo:80, precio:190, stock:15, activo:true, imagen:'assets/img/product-placeholder.svg', promos_json:'[{"qty":3,"price":180},{"qty":5,"price":160}]', orden:5 }
    ],
    cotizaciones: [],
    ventas: []
  };
}

function loadDemo(){
  const saved = localStorage.getItem(LS_KEY);
  if(saved){
    try { return JSON.parse(saved); } catch {}
  }
  const data = demoSeed();
  localStorage.setItem(LS_KEY, JSON.stringify(data));
  return data;
}

function saveDemo(data){
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

export async function getInit(){
  if(!apiEnabled()){
    const data = loadDemo();
    return { ...data, productos: data.productos.map(normalizeProduct), demo: true };
  }
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set('action','init');
  if(CONFIG.ADMIN_KEY) url.searchParams.set('key', CONFIG.ADMIN_KEY);
  const res = await fetch(url.toString(), { method:'GET' });
  if(!res.ok) throw new Error('No se pudo leer Apps Script');
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Respuesta inválida');
  return { ...json.data, productos: (json.data.productos || []).map(normalizeProduct), demo:false };
}

async function post(action, payload = {}){
  if(!apiEnabled()) return demoPost(action, payload);
  const res = await fetch(CONFIG.API_URL, {
    method:'POST',
    headers:{ 'Content-Type':'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, key: CONFIG.ADMIN_KEY, payload })
  });
  if(!res.ok) throw new Error('No se pudo guardar en Apps Script');
  const json = await res.json();
  if(!json.ok) throw new Error(json.error || 'Error en Apps Script');
  return json.data;
}

function demoPost(action, payload){
  const data = loadDemo();
  if(action === 'saveQuote'){
    const quote = { ...payload.quote, updated_at: nowIso() };
    const idx = data.cotizaciones.findIndex(q => q.id === quote.id);
    if(idx >= 0) data.cotizaciones[idx] = quote;
    else data.cotizaciones.unshift(quote);
    saveDemo(data);
    return Promise.resolve({ quote });
  }
  if(action === 'convertQuoteToSale'){
    const quote = payload.quote;
    for(const item of quote.items){
      const p = data.productos.find(prod => prod.id === item.productId);
      if(!p || Number(p.stock) < Number(item.qty)) throw new Error(`Stock insuficiente: ${item.nombre}`);
    }
    for(const item of quote.items){
      const p = data.productos.find(prod => prod.id === item.productId);
      p.stock = Number(p.stock) - Number(item.qty);
    }
    const sale = { ...quote, id: uid('VEN'), cotizacion_id: quote.id, estado:'activa', fecha_venta: nowIso() };
    data.ventas.unshift(sale);
    const qidx = data.cotizaciones.findIndex(q => q.id === quote.id);
    if(qidx >= 0) data.cotizaciones[qidx] = { ...quote, estado:'convertida' };
    else data.cotizaciones.unshift({ ...quote, estado:'convertida' });
    saveDemo(data);
    return Promise.resolve({ sale, productos:data.productos, cotizaciones:data.cotizaciones, ventas:data.ventas });
  }
  if(action === 'cancelSale'){
    const sale = data.ventas.find(v => v.id === payload.saleId);
    if(!sale) throw new Error('Venta no encontrada');
    if(sale.estado === 'cancelada') return Promise.resolve({ sale });
    for(const item of sale.items || []){
      const p = data.productos.find(prod => prod.id === item.productId);
      if(p) p.stock = Number(p.stock) + Number(item.qty);
    }
    sale.estado = 'cancelada';
    sale.cancelled_at = nowIso();
    saveDemo(data);
    return Promise.resolve({ sale, productos:data.productos, ventas:data.ventas });
  }
  return Promise.resolve({});
}

export const api = {
  saveQuote: quote => post('saveQuote', { quote }),
  convertQuoteToSale: quote => post('convertQuoteToSale', { quote }),
  cancelSale: saleId => post('cancelSale', { saleId })
};
