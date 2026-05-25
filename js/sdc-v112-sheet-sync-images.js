/* SDC V114: sincronización fuerte + fotos + botones foto + tarjetas de resumen corregidas. */
(function(){
  'use strict';

  const SHEET_ID = '1A3unHNlFBrbi2GNmD7NOEk_JlWciEE2PE5Wxx4-X0ZY';
  const PRODUCT_SHEET = 'productos_pos';
  const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxp46Vad-z_S1SD6AIxO4_HS2ZcEDFKBmCJsamQvGf4g-o2a_83w1OJcyg5rtB0rFCM/exec';
  const SYNC_STAMP_KEY = 'sdc_v112_last_sheet_sync';

  window.SDC_CONFIG = Object.assign({}, window.SDC_CONFIG || {}, {
    sheetId: SHEET_ID,
    productSheet: PRODUCT_SHEET,
    webAppUrl: WEB_APP_URL,
    autoSheetSync: true
  });

  function text(v){
    if(v === null || v === undefined) return '';
    if(Array.isArray(v)) return v.map(text).filter(Boolean).join('\n');
    if(typeof v === 'object') return Object.values(v).map(text).filter(Boolean).join('\n');
    return String(v).trim();
  }

  function number(v){
    const n = Number(String(v ?? '').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  }

  function isEmptyImageValue(v){
    const s = text(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
    return !s || ['sin imagen','sin foto','sin galeria','sin galería','no imagen','no foto','no aplica','n/a','na','null','undefined','sin enlace','sin url','sin galeria'].includes(s);
  }

  function firstValue(obj, keys, fallback=''){
    for(const key of keys){
      if(obj && obj[key] !== undefined && obj[key] !== null && !isEmptyImageValue(obj[key])) return obj[key];
    }
    return fallback;
  }

  function parseJSONField(row){
    const raw = row && (row.json || row.JSON || row.data || row.datos);
    if(!raw || typeof raw !== 'string') return {};
    try{
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    }catch(e){ return {}; }
  }

  function driveId(value){
    const v = text(value);
    if(!v) return '';
    let m = v.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
    if(m) return m[1];
    m = v.match(/[?&]id=([^&]+)/i);
    if(m && /drive\.google\.com/i.test(v)) return m[1];
    m = v.match(/uc\?[^\s]*id=([^&]+)/i);
    if(m) return m[1];
    return '';
  }

  function normalizeImageUrl(value){
    let v = text(value).replace(/&amp;/g,'&');
    if(isEmptyImageValue(v)) return '';
    const formula = v.match(/=\s*IMAGE\s*\(\s*["']([^"']+)["']/i);
    if(formula) v = formula[1];
    const parts = v.split(/\s*(?:\r?\n|\||;|,\s*(?=https?:\/\/))\s*/).filter(Boolean);
    if(parts.length > 1) v = parts.find(x=>/^(https?:|data:image|blob:|assets\/|img\/|images\/)/i.test(x)) || parts[0];
    const id = driveId(v);
    if(id) return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(id)}`;
    if(/dropbox\.com/i.test(v)) return v.replace(/[?&]dl=0/i,'?raw=1');
    return v;
  }

  function normalizeGallery(value){
    const raw = text(value);
    if(isEmptyImageValue(raw)) return '';
    return raw.split(/\s*(?:\r?\n|\||;)\s*/).map(normalizeImageUrl).filter(Boolean).join('\n');
  }

  function colorRowsTotal(raw){
    const s = text(raw);
    if(!s) return 0;
    let total = 0;
    s.split(/\s*(?:\r?\n|\||;|,)\s*/).forEach(part=>{
      const m = part.match(/(?:=|:|x|-)\s*([0-9]+(?:[.,][0-9]+)?)/i) || part.match(/^([0-9]+(?:[.,][0-9]+)?)/);
      if(m) total += number(m[1]);
    });
    return total;
  }

  function normalizeProduct(row, index){
    const json = parseJSONField(row);
    const src = Object.assign({}, json, row || {});
    const colors = text(firstValue(src,['colors','colores','colorStock','stockColores','variantesColor','variantes_color'],''));
    const colorStock = colorRowsTotal(colors);
    const image = normalizeImageUrl(firstValue(src,[
      'image','imagen','foto','photo','picture','thumbnail','thumb','imageUrl','imagenUrl','fotoUrl','urlImagen','img','src'
    ],''));
    const gallery = normalizeGallery(firstValue(src,['gallery','galeria','imagenes','fotos','images','galeriaUrl','galleryUrl'],''));
    return {
      id: text(firstValue(src,['id','codigo','code','sku'],`SDC-${String(index+1).padStart(3,'0')}`)),
      name: text(firstValue(src,['name','nombre','producto','title','titulo'],'Producto sin nombre')),
      categories: text(firstValue(src,['categories','category','categoria','categorias','etiquetas'],'General')),
      brand: text(firstValue(src,['brand','marca'],'')),
      price: number(firstValue(src,['price','precio','precio_venta','venta'],0)),
      cost: number(firstValue(src,['cost','costo','costo_compra','compra'],0)),
      stock: colorStock || number(firstValue(src,['stock','cantidad','existencia','inventario'],0)),
      colors: colors,
      image: image,
      gallery: gallery,
      description: text(firstValue(src,['description','descripcion','detalle','descripcion_larga'],'')),
      promos: text(firstValue(src,['promos','promociones','preciosCantidad','precios_cantidad','mayoreo','ofertas'],'')),
      active: !(src.active === false || src.activo === false || String(src.active ?? src.activo ?? '1').trim() === '0'),
      updatedAt: text(firstValue(src,['updatedAt','updated_at','fecha_actualizacion','updated'],''))
    };
  }

  function productArrayFromPayload(payload){
    if(Array.isArray(payload)) return payload;
    if(!payload || typeof payload !== 'object') return [];
    const candidates = [payload.products, payload.productos, payload.items, payload.data, payload.rows, payload.result, payload.catalogo];
    for(const c of candidates){
      if(Array.isArray(c)) return c;
      if(c && typeof c === 'object'){
        const nested = productArrayFromPayload(c);
        if(nested.length) return nested;
      }
    }
    return [];
  }

  function sheetJsonp(params){
    return new Promise((resolve,reject)=>{
      const cb = 'sdcV114Cb_' + Date.now() + '_' + Math.floor(Math.random()*99999);
      const script = document.createElement('script');
      const url = new URL(WEB_APP_URL);
      Object.entries(Object.assign({}, params, {callback:cb, _:Date.now()})).forEach(([k,v])=>url.searchParams.set(k, v));
      const timer = setTimeout(()=>cleanup(()=>reject(new Error('Tiempo agotado leyendo Google Sheets.'))), 14000);
      function cleanup(done){
        clearTimeout(timer);
        try{ delete window[cb]; }catch(e){ window[cb] = undefined; }
        script.remove();
        if(done) done();
      }
      window[cb] = data => cleanup(()=>resolve(data));
      script.onerror = () => cleanup(()=>reject(new Error('Apps Script no respondió por JSONP.')));
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  async function readJSON(res){
    const txt = await res.text();
    try{ return JSON.parse(txt); }catch(e){
      const m = txt.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if(m) return JSON.parse(m[0]);
      throw new Error('Respuesta no es JSON válido');
    }
  }

  async function requestProducts(){
    const actions = ['products','getProducts','listProducts','syncInventory'];
    let lastError = null;
    for(const action of actions){
      try{
        const data = await sheetJsonp({action, only:'productos', sheet:PRODUCT_SHEET, productSheet:PRODUCT_SHEET, sheetId:SHEET_ID});
        if(data && data.ok === false) throw new Error(data.error || 'Apps Script respondió con error.');
        const rows = productArrayFromPayload(data);
        if(rows.length) return rows;
      }catch(err){ lastError = err; }
    }
    for(const action of actions){
      try{
        const url = `${WEB_APP_URL}?action=${encodeURIComponent(action)}&only=productos&sheet=${encodeURIComponent(PRODUCT_SHEET)}&productSheet=${encodeURIComponent(PRODUCT_SHEET)}&sheetId=${encodeURIComponent(SHEET_ID)}&t=${Date.now()}`;
        const res = await fetch(url, {method:'GET', cache:'no-store', redirect:'follow'});
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await readJSON(res);
        const rows = productArrayFromPayload(data);
        if(rows.length) return rows;
      }catch(err){ lastError = err; }
    }
    for(const action of actions){
      try{
        const res = await fetch(WEB_APP_URL, {
          method:'POST', cache:'no-store', redirect:'follow', headers:{'Content-Type':'text/plain;charset=utf-8'},
          body:JSON.stringify({action, only:'productos', sheet:PRODUCT_SHEET, productSheet:PRODUCT_SHEET, sheetId:SHEET_ID})
        });
        if(!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await readJSON(res);
        const rows = productArrayFromPayload(data);
        if(rows.length) return rows;
      }catch(err){ lastError = err; }
    }
    throw lastError || new Error('No se pudo leer productos_pos');
  }

  function toast(message, type='info'){
    const el = document.getElementById('toast');
    if(!el){ console.log('[SDC V114]', message); return; }
    el.textContent = message;
    el.classList.add('show');
    if(type === 'ok') el.style.background = '#0f7d42';
    if(type === 'error') el.style.background = '#8f1717';
    clearTimeout(el._sdc112Toast);
    el._sdc112Toast = setTimeout(()=>{ el.classList.remove('show'); el.style.background=''; }, 3200);
  }

  function saveProducts(products){
    if(!window.SDCStore) throw new Error('SDCStore no está listo');
    const state = window.SDCStore.load();
    state.products = products.map(normalizeProduct).filter(p=>p.name && p.name !== 'Producto sin nombre');
    state.settings = Object.assign({}, state.settings || {}, window.SDC_CONFIG, {
      sheetId:SHEET_ID, productSheet:PRODUCT_SHEET, webAppUrl:WEB_APP_URL, autoSheetSync:true, lastSheetSync:new Date().toISOString()
    });
    window.SDCStore.save(state);
    localStorage.setItem(SYNC_STAMP_KEY, String(Date.now()));
    return state.products.length;
  }

  function normalizeSavedProducts(){
    if(!window.SDCStore) return;
    try{
      const state = window.SDCStore.load();
      let changed = false;
      state.products = (state.products || []).map((p)=>{
        const before = JSON.stringify({image:p.image,gallery:p.gallery});
        const out = Object.assign({}, p, {
          image: normalizeImageUrl(p.image || p.imagen || p.foto || ''),
          gallery: normalizeGallery(p.gallery || p.galeria || p.imagenes || p.fotos || '')
        });
        if(JSON.stringify({image:out.image,gallery:out.gallery}) !== before) changed = true;
        return out;
      });
      state.settings = Object.assign({}, state.settings || {}, window.SDC_CONFIG);
      if(changed) window.SDCStore.save(state);
    }catch(err){ console.warn('[SDC V114] No se pudo normalizar productos guardados', err); }
  }

  async function syncNow(opts={}){
    const buttons = document.querySelectorAll('[data-action="sync"],[data-sdc-utility-sync]');
    buttons.forEach(b=>{ b.classList.add('is-updating'); b.disabled = true; });
    try{
      toast('Sincronizando productos y fotos desde Google Sheets...');
      const rows = await requestProducts();
      const count = saveProducts(rows);
      toast(`✅ Sincronizado: ${count} productos desde Google Sheets.`, 'ok');
      if(opts.reload !== false){
        setTimeout(()=>{
          const u = new URL(location.href);
          u.searchParams.set('v','114');
          u.searchParams.set('sync',Date.now());
          location.replace(u.toString());
        }, 650);
      }
      return count;
    }catch(err){
      console.error('[SDC V114] Sync failed', err);
      toast('No se pudo sincronizar. Revisa permisos del Apps Script y que productos_pos exista.', 'error');
      return 0;
    }finally{
      buttons.forEach(b=>{ b.classList.remove('is-updating'); b.disabled = false; });
    }
  }

  function patchBrokenImages(){
    document.querySelectorAll('img').forEach(img=>{
      const src = img.getAttribute('src') || '';
      const fixed = normalizeImageUrl(src);
      if(fixed && fixed !== src) img.setAttribute('src', fixed);
      const live = img.getAttribute('src') || '';
      if(/^https?:\/\//i.test(live) && img.getAttribute('crossorigin')){
        img.removeAttribute('crossorigin');
        try{ img.crossOrigin = null; }catch(e){}
        img.setAttribute('referrerpolicy','no-referrer');
        if(!img.dataset.sdcV113Reloaded){ img.dataset.sdcV113Reloaded = '1'; img.src = live; }
      }
      if(!img.dataset.sdcV112Error){
        img.dataset.sdcV112Error = '1';
        img.addEventListener('error', function(){
          if(this.classList.contains('sdc-img-fallback')) return;
          const original = this.getAttribute('src') || '';
          const retry = normalizeImageUrl(original);
          if(retry && retry !== original){ this.src = retry; return; }
          this.src = 'assets/logo-sdc.png';
          this.classList.add('sdc-img-fallback');
        });
      }
    });
  }

  function injectPhotoStyles(){
    if(document.getElementById('sdc-v114-ui-style')) return;
    const style = document.createElement('style');
    style.id = 'sdc-v114-ui-style';
    style.textContent = `
      .sdc-photo-actions-v113{display:grid!important;grid-template-columns:1fr 1fr auto!important;gap:8px!important;align-items:center!important;width:100%!important}
      .sdc-photo-choice-v113{min-height:42px!important;border-radius:14px!important;font-weight:950!important;letter-spacing:.03em!important;display:flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;white-space:nowrap!important}
      .sdc-photo-choice-v113.sdc-camera-v113{background:linear-gradient(135deg,#0b63ce,#10b981)!important;color:#fff!important;border:0!important;box-shadow:0 10px 22px rgba(11,99,206,.16)!important}
      .sdc-photo-choice-v113.sdc-gallery-v113{background:#f3f8fd!important;color:#0f172a!important;border:1px solid #dbe7f3!important}
      .sdc-v113-hidden-upload{display:none!important}
      body.sdc-v95-light-default .home-stats-v94,body.sdc-v95-light-default .stats.home-stats-v94{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;overflow:visible!important}
      body.sdc-v95-light-default .home-stats-v94 .stat{min-width:0!important;width:100%!important;min-height:92px!important;padding:15px!important;border-radius:20px!important;overflow:hidden!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;background:#fff!important;color:#0f172a!important}
      body.sdc-v95-light-default .home-stats-v94 .stat b,body.sdc-v95-light-default .home-stats-v94 .stat strong{display:block!important;max-width:100%!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;font-size:clamp(22px,6vw,30px)!important;line-height:1.05!important;letter-spacing:-.02em!important;color:#0f172a!important}
      body.sdc-v95-light-default .home-stats-v94 .stat span{display:block!important;max-width:100%!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;font-size:11px!important;line-height:1.15!important;letter-spacing:.065em!important;color:#64748b!important;font-weight:950!important;margin-top:8px!important}
      body.sdc-v95-light-default .home-stats-v94 .stat.featured{grid-column:1/-1!important;min-height:94px!important;background:linear-gradient(135deg,#04233d,#0b63ce)!important;color:#fff!important}
      body.sdc-v95-light-default .home-stats-v94 .stat.featured b,body.sdc-v95-light-default .home-stats-v94 .stat.featured strong,body.sdc-v95-light-default .home-stats-v94 .stat.featured span{color:#fff!important}
      @media(max-width:430px){.sdc-photo-actions-v113{grid-template-columns:1fr 1fr!important}.sdc-photo-actions-v113 .btn.ghost{grid-column:1/-1!important}.sdc-photo-choice-v113{font-size:12px!important;padding:0 8px!important}body.sdc-v95-light-default .home-stats-v94 .stat{min-height:88px!important;padding:13px!important}body.sdc-v95-light-default .home-stats-v94 .stat b{font-size:clamp(21px,7vw,28px)!important}body.sdc-v95-light-default .home-stats-v94 .stat span{font-size:10.5px!important}}
    `;
    document.head.appendChild(style);
  }

  function patchPhotoUploadButtons(){
    injectPhotoStyles();
    document.querySelectorAll('.image-row-actions-v83').forEach(actions=>{
      if(actions.dataset.sdcV113PhotoPatched === '1') return;
      const originalLabel = actions.querySelector('.upload-image-btn');
      const input = originalLabel && originalLabel.querySelector('input[type="file"][data-upload-image]');
      if(!originalLabel || !input) return;
      actions.dataset.sdcV113PhotoPatched = '1';
      actions.classList.add('sdc-photo-actions-v113');
      originalLabel.classList.add('sdc-v113-hidden-upload');
      const camera = document.createElement('button');
      camera.type = 'button'; camera.className = 'btn small sdc-photo-choice-v113 sdc-camera-v113'; camera.innerHTML = '<span aria-hidden="true">📷</span><span>TOMAR FOTO</span>';
      camera.addEventListener('click', ev=>{ ev.preventDefault(); input.setAttribute('accept','image/*'); input.setAttribute('capture','environment'); input.click(); });
      const gallery = document.createElement('button');
      gallery.type = 'button'; gallery.className = 'btn small secondary sdc-photo-choice-v113 sdc-gallery-v113'; gallery.innerHTML = '<span aria-hidden="true">🖼️</span><span>GALERIA</span>';
      gallery.addEventListener('click', ev=>{ ev.preventDefault(); input.setAttribute('accept','image/*'); input.removeAttribute('capture'); input.click(); });
      actions.insertBefore(camera, originalLabel);
      actions.insertBefore(gallery, originalLabel);
    });
  }

  function bindSyncButtons(){
    document.addEventListener('click', ev=>{
      const btn = ev.target.closest('[data-action="sync"],[data-sdc-utility-sync]');
      if(!btn) return;
      ev.preventDefault(); ev.stopImmediatePropagation(); syncNow({reload:true});
    }, true);
  }

  function autoSyncOnce(){
    const last = Number(localStorage.getItem(SYNC_STAMP_KEY) || 0);
    const age = Date.now() - last;
    if(last && age < 1000 * 60 * 10) return;
    setTimeout(()=>syncNow({reload:false}), 1300);
  }

  function boot(){
    normalizeSavedProducts(); bindSyncButtons(); patchBrokenImages(); injectPhotoStyles(); patchPhotoUploadButtons(); autoSyncOnce();
    new MutationObserver(()=>{ patchBrokenImages(); injectPhotoStyles(); patchPhotoUploadButtons(); }).observe(document.documentElement,{childList:true,subtree:true});
  }

  window.SDCSheetsV112 = { syncNow, normalizeImageUrl, normalizeProduct, requestProducts, patchPhotoUploadButtons };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
