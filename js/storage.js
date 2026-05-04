const STORAGE_KEY = 'sdc-caja-modular-v91';
const LEGACY_KEYS = ['sdc-caja-modular-v90','sdc-products-v1','sdc-inventory'];

function toNumber(value, fallback = 0){
  if(value === null || value === undefined || value === '') return fallback;
  const n = Number(String(value).replace(/,/g,'').replace(/[^0-9.-]/g,''));
  return Number.isFinite(n) ? n : fallback;
}

function cleanText(value, fallback = ''){
  if(value === null || value === undefined) return fallback;
  if(typeof value === 'object'){
    return value.nombre || value.name || value.titulo || value.title || value.categoria || value.category || value.text || value.value || fallback;
  }
  const t = String(value).trim();
  return t && t !== '[object Object]' ? t : fallback;
}

function unique(list){
  const seen = new Set();
  return list.map(v => cleanText(v)).filter(Boolean).filter(v => {
    const k = v.toLowerCase();
    if(seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseCategories(value){
  const flat = [];
  const push = v => {
    if(v === null || v === undefined || v === '') return;
    if(Array.isArray(v)){ v.forEach(push); return; }
    if(typeof v === 'object'){
      const label = cleanText(v.nombre || v.name || v.titulo || v.title || v.categoria || v.category || v.label || v.text || v.value, '');
      if(label) push(label);
      return;
    }
    String(v).split(/[;,|/]+|\n+/).forEach(part => {
      const t = cleanText(part, '');
      if(t && !/^\[object object\]$/i.test(t)) flat.push(t);
    });
  };
  push(value);
  return unique(flat);
}

function parseGallery(product){
  const raw = product.gallery ?? product.galeria ?? product.imagenes ?? '';
  let list = [];
  if(Array.isArray(raw)) list = raw.map(cleanText);
  else if(raw && typeof raw === 'object') list = [cleanText(raw.url || raw.src || raw.link || raw.image || raw.imagen || '')];
  else list = String(raw || '').split(/\n+|\s*,\s*(?=https?:\/\/|data:image|assets\/)/i).map(s => s.trim());
  const extra = [];
  for(let i=1;i<=10;i++){
    extra.push(product[`galeria_${i}`], product[`imagen_${i}`], product[`foto_${i}`]);
  }
  const main = cleanText(product.image || product.imagen || product.foto || product.img || '');
  return unique([main, ...list, ...extra].filter(Boolean));
}

function parsePromos(value){
  const promos = [];
  const push = v => {
    if(!v) return;
    if(Array.isArray(v)){ v.forEach(push); return; }
    if(typeof v === 'object'){
      const qty = toNumber(v.qty ?? v.cantidad ?? v.cant ?? v.min ?? v.pares, 0);
      const price = toNumber(v.price ?? v.precio ?? v.total ?? v.valor, 0);
      if(qty > 0 && price > 0) promos.push({qty, price});
      return;
    }
    String(v).split(/\n+|;/).forEach(line => {
      const t = cleanText(line, '');
      if(!t || /^\[object object\]$/i.test(t)) return;
      let m = t.match(/(\d+)\s*(?:pares?|uds?|unidades?)?\s*(?:=|:|-|→|a|por)\s*(?:lps\.?\s*)?(\d+(?:\.\d+)?)/i);
      if(!m) m = t.match(/(\d+).*?(\d+(?:\.\d+)?)/);
      if(m){
        const qty = toNumber(m[1],0);
        const price = toNumber(m[2],0);
        if(qty > 0 && price > 0) promos.push({qty, price});
      }
    });
  };
  push(value);
  const map = new Map();
  promos.forEach(p => map.set(String(p.qty), p));
  return Array.from(map.values()).sort((a,b)=>a.qty-b.qty);
}

function promosToText(promos){
  return parsePromos(promos).map(p => `${p.qty} = ${p.price}`).join('\n');
}

function generateId(i){ return `SDC-${String(i + 1).padStart(3,'0')}`; }

function normalizeProduct(product = {}, index = 0){
  const categories = parseCategories(product.categories ?? product.categorias ?? product.category ?? product.categoria ?? product.etiquetas ?? product.tags);
  const gallery = parseGallery(product);
  let id = cleanText(product.id || product.codigo || product.code || '', '');
  if(!id || id.length > 14 || /\[object object\]/i.test(id)) id = generateId(index);
  const name = cleanText(product.name || product.nombre || product.title || product.titulo, `Producto ${index + 1}`);
  return {
    id,
    name,
    categories: categories.length ? categories : ['General'],
    price: toNumber(product.price ?? product.precio ?? product.precio_venta, 0),
    cost: toNumber(product.cost ?? product.costo ?? product.precio_costo, 0),
    stock: Math.max(0, Math.round(toNumber(product.stock ?? product.existencia ?? product.cantidad, 0))),
    image: gallery[0] || '',
    gallery,
    description: cleanText(product.description || product.descripcion || product.detalle || product.beneficios, ''),
    promos: parsePromos(product.promos || product.promociones || product.preciosCantidad || product.precios_cantidad)
  };
}

function normalizeState(raw){
  const base = raw && typeof raw === 'object' ? raw : {};
  const products = Array.isArray(base.products) ? base.products : (Array.isArray(base.productos) ? base.productos : []);
  const sales = Array.isArray(base.sales) ? base.sales : (Array.isArray(base.ventas) ? base.ventas : []);
  return {
    products: products.map(normalizeProduct),
    sales,
    settings: {
      logo: cleanText(base.settings?.logo || window.SDC_DEFAULT_DATA?.settings?.logo || 'assets/logo_sdc_comayagua_clean_512.png'),
      whatsapp: cleanText(base.settings?.whatsapp || window.SDC_DEFAULT_DATA?.settings?.whatsapp || '+50431517755'),
      accessKey: cleanText(base.settings?.accessKey || window.SDC_DEFAULT_DATA?.settings?.accessKey || '199311'),
      storeName: cleanText(base.settings?.storeName || 'SD COMAYAGUA')
    }
  };
}

function loadState(){
  const keys = [STORAGE_KEY, ...LEGACY_KEYS];
  for(const key of keys){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) continue;
      const parsed = JSON.parse(raw);
      const normalized = normalizeState(parsed);
      if(normalized.products.length){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        return normalized;
      }
    }catch(e){ console.warn('No se pudo leer backup', key, e); }
  }
  return normalizeState(window.SDC_DEFAULT_DATA || {});
}

function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeState(state)));
}

function exportState(state){
  const blob = new Blob([JSON.stringify(normalizeState(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-sdc-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importState(file, cb){
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = JSON.parse(reader.result);
    const normalized = normalizeState(parsed);
    saveState(normalized);
    cb(normalized);
  };
  reader.readAsText(file);
}

window.SDCStorage = { loadState, saveState, exportState, importState, normalizeState, normalizeProduct, parseCategories, parsePromos, promosToText, toNumber, cleanText };
