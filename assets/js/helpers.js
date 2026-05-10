import { CONFIG } from './config.js';

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export function money(value = 0){
  const amount = Math.round(Number(value || 0));
  return `Lps. ${amount.toLocaleString('es-HN')}`;
}

export function todayHN(){
  return new Date().toLocaleDateString('es-HN', { day:'2-digit', month:'2-digit', year:'numeric' });
}

export function nowIso(){
  return new Date().toISOString();
}

export function safeText(value){
  return String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

export function toNumber(value){
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function uid(prefix = 'COT'){
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  const rnd = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${rnd}`;
}

export function parsePromos(raw){
  if(!raw) return [];
  if(Array.isArray(raw)) return raw.map(p => ({ qty: toNumber(p.qty || p.cantidad), price: toNumber(p.price || p.precio) })).filter(p => p.qty && p.price);
  try{
    const parsed = JSON.parse(raw);
    if(Array.isArray(parsed)) return parsePromos(parsed);
  }catch{}
  return String(raw).split('|').map(part => {
    const [qty, price] = part.split(':').map(v => v.trim());
    return { qty: toNumber(qty), price: toNumber(price) };
  }).filter(p => p.qty && p.price);
}

export function priceForQty(product, qty){
  const promos = parsePromos(product.promos_json || product.promos || product.promociones);
  const sorted = promos.sort((a,b) => a.qty - b.qty);
  let unit = toNumber(product.precio || product.price);
  for(const promo of sorted){
    if(qty >= promo.qty) unit = promo.price;
  }
  return unit;
}

export function productImage(product){
  return product.imagen || product.img || product.image || CONFIG.PLACEHOLDER_IMAGE;
}

export function normalizeProduct(product = {}){
  return {
    id: String(product.id || product.codigo || uid('PROD')),
    codigo: String(product.codigo || product.code || product.id || ''),
    nombre: String(product.nombre || product.name || 'Producto sin nombre'),
    categoria: String(product.categoria || product.category || 'General'),
    marca: String(product.marca || product.brand || ''),
    descripcion: String(product.descripcion || product.description || ''),
    costo: toNumber(product.costo || product.cost),
    precio: toNumber(product.precio || product.price),
    stock: toNumber(product.stock),
    activo: product.activo === false ? false : String(product.activo ?? 'TRUE').toLowerCase() !== 'false',
    imagen: productImage(product),
    promos_json: product.promos_json || product.promos || '',
    orden: toNumber(product.orden || product.order)
  };
}

export function showToast(message){
  const toast = $('#toast');
  if(!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

export function downloadBlob(blob, filename){
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

export function imageFallback(event){
  event.currentTarget.src = CONFIG.PLACEHOLDER_IMAGE;
}

export function buildWhatsAppUrl(text, phone = CONFIG.WHATSAPP_NUMBER){
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
