import { CONFIG } from './config.js';
export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
export function money(value = 0){const amount = Math.round(Number(value || 0));return `Lps. ${amount.toLocaleString('es-HN')}`;}
export function todayHN(){return new Date().toLocaleDateString('es-HN',{day:'2-digit',month:'2-digit',year:'numeric'});}
export function nowIso(){return new Date().toISOString();}
export function safeText(value){return String(value ?? '').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
export function toNumber(value){const n=Number(value);return Number.isFinite(n)?n:0;}
export function uid(prefix='COT'){const d=new Date();const stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;return `${prefix}-${stamp}-${Math.floor(1000+Math.random()*9000)}`;}
export function parsePromos(raw){
  if(!raw) return [];
  if(Array.isArray(raw)) return raw.map(p=>({qty:toNumber(p.qty||p.cantidad),total:toNumber(p.total||p.price||p.precio)})).filter(p=>p.qty&&p.total);
  try{const parsed=JSON.parse(raw);if(Array.isArray(parsed)) return parsePromos(parsed);}catch{}
  return String(raw).split('|').map(part=>{const cleaned=part.trim();if(!cleaned)return null;const sep=cleaned.includes('=')?'=':':';const [qty,total]=cleaned.split(sep).map(v=>v.trim());return {qty:toNumber(qty),total:toNumber(total)};}).filter(Boolean).filter(p=>p.qty&&p.total);
}
export function promosToText(promos){return parsePromos(promos).sort((a,b)=>a.qty-b.qty).map(p=>`${p.qty}=${Math.round(p.total)}`).join(' | ');}
export function linePriceForQty(product, qty){
  qty = Math.max(1,toNumber(qty));
  const base = toNumber(product.precio || product.price);
  const promos = parsePromos(product.promos_json || product.promos || product.promociones).sort((a,b)=>b.qty-a.qty);
  if(!promos.length) return base * qty;
  let remaining = qty, total = 0;
  for(const promo of promos){
    if(promo.qty <= 0 || promo.total <= 0) continue;
    const count = Math.floor(remaining / promo.qty);
    if(count > 0){ total += count * promo.total; remaining -= count * promo.qty; }
  }
  total += remaining * base;
  return total;
}
export function unitPriceForQty(product, qty){return Math.round(linePriceForQty(product, qty) / Math.max(1,toNumber(qty)));}
export function productImage(product){return product.imagen || product.img || product.image || CONFIG.PLACEHOLDER_IMAGE;}
export function normalizeProduct(product={}){
  return {
    id:String(product.id || product.codigo || uid('PROD')),
    codigo:String(product.codigo || product.code || product.id || ''),
    nombre:String(product.nombre || product.name || 'Producto sin nombre'),
    categoria:String(product.categoria || product.category || 'General'),
    marca:String(product.marca || product.brand || ''),
    descripcion:String(product.descripcion || product.description || ''),
    costo:toNumber(product.costo || product.cost),
    precio:toNumber(product.precio || product.price || product.precio_venta),
    stock:toNumber(product.stock),
    activo:product.activo===false ? false : String(product.activo ?? 'TRUE').toLowerCase() !== 'false',
    imagen:productImage(product),
    promos_json:product.promos_json || product.promos || product.promociones || '',
    promos:product.promos || product.promos_json || product.promociones || '',
    notas:product.notas || '',
    orden:toNumber(product.orden || product.order)
  };
}
export function showToast(message){const toast=$('#toast');if(!toast)return;toast.textContent=message;toast.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove('show'),2400);}
export function downloadBlob(blob, filename){const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=filename;document.body.appendChild(link);link.click();URL.revokeObjectURL(link.href);link.remove();}
export function imageFallback(event){event.currentTarget.src=CONFIG.PLACEHOLDER_IMAGE;}
export function buildWhatsAppUrl(text, phone=CONFIG.WHATSAPP_NUMBER){return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;}
