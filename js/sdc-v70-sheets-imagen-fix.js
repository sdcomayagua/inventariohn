/* =========================================================
   SDC V70 · Sheets + Fix imagen galería
   Parche no invasivo:
   1) agrega botón "Sheets" en edición/tarjetas de producto ADMIN;
   2) al guardar producto intenta sincronizar Google Sheets;
   3) preserva la foto si el guardado borra la imagen subida;
   4) corrige imágenes estiradas manteniendo proporción real.
   ========================================================= */
(function(){
  'use strict';

  const VERSION = 'V70';
  const BTN_CLASS = 'sdc-v70-sheets-btn';
  const BTN_FLAG = 'data-sdc-v70-sheets';
  const CARD_SLOT_CLASS = 'sdc-v70-sheets-card-slot';
  const MODAL_ROW_CLASS = 'sdc-v70-modal-sheet-row';
  const LS_BACKUP_KEY = 'sdc_v70_product_image_backup';

  const IMAGE_FIELDS = [
    'imagen','image','img','foto','photo','picture','thumb','thumbnail',
    'imageUrl','imagenUrl','imgUrl','fotoUrl','photoUrl','pictureUrl',
    'imageData','imagenData','dataUrl','src','urlImagen','productImage',
    'galleryImage','galeriaImagen','galleryUrl','galeriaUrl'
  ];

  const ID_FIELDS = [
    'id','_id','uid','uuid','sku','codigo','code','slug','nombre','name',
    'titulo','title','producto','productName','nombreProducto'
  ];

  const PRODUCT_HINT_FIELDS = [
    'precio','price','costo','cost','stock','cantidad','categoria','category',
    'descripcion','description','nombre','name','titulo','title','producto'
  ];

  let beforeSaveSnapshot = null;
  let lastImageBackup = loadBackup();
  let observerTimer = 0;
  let syncing = false;

  function cleanText(value){
    return String(value || '').replace(/\s+/g,' ').trim();
  }

  function norm(value){
    return cleanText(value).toLowerCase();
  }

  function isVisible(el){
    if(!el || !el.isConnected) return false;
    const st = getComputedStyle(el);
    if(st.display === 'none' || st.visibility === 'hidden' || Number(st.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  function showToast(message, type){
    const toast = document.getElementById('toast');
    if(toast){
      toast.textContent = message;
      toast.classList.add('show');
      toast.style.background = type === 'error' ? '#8f1717' : (type === 'ok' ? '#0f7d42' : '');
      window.clearTimeout(showToast._t);
      showToast._t = window.setTimeout(()=>{
        toast.classList.remove('show');
        toast.style.background = '';
      }, 3300);
      return;
    }
    // Fallback suave si no existe el toast del app.
    console[type === 'error' ? 'warn' : 'log']('[SDC '+VERSION+'] '+message);
  }

  function setBtnState(btn, state, label){
    if(!btn) return;
    btn.classList.remove('is-loading','is-ok','is-error');
    if(state) btn.classList.add(state);
    if(label) btn.innerHTML = label;
  }

  function makeSheetsButton(context){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = BTN_CLASS;
    btn.setAttribute(BTN_FLAG,'1');
    btn.innerHTML = '📄 Sheets';
    btn.title = 'Actualizar Google Sheets';
    btn.addEventListener('click', async function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      await handleSheetsClick(btn, context || btn);
    });
    return btn;
  }

  async function handleSheetsClick(btn, context){
    const product = extractProductFromContext(context);
    setBtnState(btn,'is-loading','⏳ Sheets');
    const restored = restoreLostImages(beforeSaveSnapshot || snapshotStorage());
    const ok = await syncSheets(product, {manual:true});
    if(ok){
      setBtnState(btn,'is-ok','✅ Actualizado');
      showToast(restored ? 'Imagen restaurada y Sheets actualizado.' : 'Sheets actualizado.', 'ok');
    }else{
      setBtnState(btn,'is-error','⚠️ Revisar Sheets');
      showToast('No encontré una función/endpoint de Sheets activo. Revisa la configuración de Google Sheets.', 'error');
    }
    window.setTimeout(()=>setBtnState(btn,null,'📄 Sheets'), 2300);
  }

  function isProductEditContext(el){
    const ctx = closestContext(el);
    if(!ctx) return false;
    const text = norm(ctx.innerText || ctx.textContent || '');
    const hasProductWords = /producto|product|categor[ií]a|precio|price|stock|imagen|foto|galer[ií]a|sku|c[oó]digo/.test(text);
    const hasInputs = !!ctx.querySelector('input,textarea,select,[contenteditable="true"]');
    const isBadContext = /gasto|caja|arqueo|cliente|pedido|orden|usuario|login|contrase[ñn]a/.test(text) && !/producto/.test(text);
    return hasProductWords && hasInputs && !isBadContext;
  }

  function closestContext(el){
    if(!el) return null;
    return el.closest('.modal,[role="dialog"],dialog,form,.drawer,.sheet,.panel,.admin-panel,.card') || document.body;
  }

  function isSaveButton(el){
    if(!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if(tag !== 'button' && tag !== 'a' && tag !== 'input') return false;
    const text = norm(el.value || el.innerText || el.textContent || el.getAttribute('aria-label') || el.title || '');
    return /^(guardar|save)\b|guardar cambios|guardar producto|actualizar producto|salvar/.test(text);
  }

  function addButtons(){
    // V83: el botón separado “Sheets” se retiró del editor porque confundía el flujo.
    // El botón principal “Guardar y sincronizar” ya hace el guardado local + Google Sheets.
    fixStretchedImages();
  }

  function scheduleAddButtons(){
    window.clearTimeout(observerTimer);
    observerTimer = window.setTimeout(addButtons, 180);
  }

  function addButtonInOpenProductEditors(){
    return;
    const contexts = Array.from(document.querySelectorAll('.modal,[role="dialog"],dialog,form,.drawer,.sheet,.panel'));
    contexts.forEach(ctx=>{
      if(!isVisible(ctx) || !isProductEditContext(ctx)) return;
      if(ctx.querySelector('.'+MODAL_ROW_CLASS)) return;

      const saveBtn = Array.from(ctx.querySelectorAll('button,a,input[type="button"],input[type="submit"]')).find(isSaveButton);
      if(!saveBtn) return;

      const row = document.createElement('div');
      row.className = MODAL_ROW_CLASS;
      row.innerHTML = '<span class="sdc-v70-mini-note">Actualiza Google Sheets sin salir del producto.</span>';
      row.appendChild(makeSheetsButton(ctx));

      const footer = saveBtn.closest('.modal-footer,.actions,.form-actions,.btn-row,.footer') || saveBtn.parentElement || ctx;
      if(footer && footer !== ctx){
        footer.appendChild(row);
      }else{
        ctx.appendChild(row);
      }
    });
  }

  function addButtonsInProductCards(){
    return;
    const editButtons = Array.from(document.querySelectorAll('button,a')).filter(el=>{
      if(el.hasAttribute(BTN_FLAG)) return false;
      const text = norm(el.innerText || el.textContent || el.getAttribute('aria-label') || el.title || '');
      return /editar|edit|modificar/.test(text);
    });

    editButtons.forEach(editBtn=>{
      const card = editBtn.closest('.product-card,.producto-card,.admin-product-card,.item-card,.inventory-card,.catalog-card,.card,[data-product-id],[data-id],[data-sku]');
      if(!card || !isVisible(card) || card.querySelector('.'+CARD_SLOT_CLASS)) return;

      const cardText = norm(card.innerText || card.textContent || '');
      const likelyProduct = /lps|precio|stock|producto|categor[ií]a|disponible|sku|editar/.test(cardText);
      const bad = /cliente|pedido|caja|gasto|usuario|login/.test(cardText) && !/producto|stock|precio/.test(cardText);
      if(!likelyProduct || bad) return;

      const slot = document.createElement('div');
      slot.className = CARD_SLOT_CLASS;
      slot.appendChild(makeSheetsButton(card));

      const actions = editBtn.closest('.actions,.card-actions,.product-actions,.btn-row') || editBtn.parentElement || card;
      actions.appendChild(slot);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Hook: al tocar Guardar producto, preserva imagen y sincroniza Sheets.
  // ═══════════════════════════════════════════════════════════
  document.addEventListener('pointerdown', function(ev){
    const btn = ev.target && ev.target.closest ? ev.target.closest('button,a,input') : null;
    if(btn && isSaveButton(btn) && isProductEditContext(btn)){
      beforeSaveSnapshot = snapshotStorage();
      rememberImagesFromDom(btn);
    }
  }, true);

  document.addEventListener('click', function(ev){
    const btn = ev.target && ev.target.closest ? ev.target.closest('button,a,input') : null;
    if(!btn || btn.hasAttribute(BTN_FLAG)) return;
    if(btn.id === 'saveProduct' || btn.getAttribute('data-sdc-native-save') === '1') return;
    if(!isSaveButton(btn) || !isProductEditContext(btn)) return;

    const context = closestContext(btn);
    beforeSaveSnapshot = beforeSaveSnapshot || snapshotStorage();
    rememberImagesFromDom(context);

    window.setTimeout(async ()=>{
      const restored = restoreLostImages(beforeSaveSnapshot);
      beforeSaveSnapshot = null;
      const ok = await syncSheets(extractProductFromContext(context), {manual:false});
      if(restored && ok){
        showToast('Se guardó el producto, se conservó la imagen y se actualizó Sheets.', 'ok');
      }else if(ok){
        showToast('Producto guardado y sincronizado con Sheets.', 'ok');
      }else{
        showToast('Producto guardado localmente. Sheets no confirmó la actualización.', 'error');
      }
      scheduleAddButtons();
    }, 850);
  }, true);

  // ═══════════════════════════════════════════════════════════
  // Guardado preventivo de imagen cuando viene de galería.
  // ═══════════════════════════════════════════════════════════
  document.addEventListener('change', function(ev){
    const input = ev.target;
    if(!input || input.type !== 'file' || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if(!/^image\//i.test(file.type)) return;
    const context = closestContext(input);
    const reader = new FileReader();
    reader.onload = function(){
      const key = productKeyFromContext(context) || ('pending_'+Date.now());
      lastImageBackup[key] = {
        value: String(reader.result || ''),
        at: new Date().toISOString(),
        fileName: file.name || ''
      };
      saveBackup();
      // Se deja marcado en el form por si el guardado original borra el campo.
      if(context) context.setAttribute('data-sdc-v70-last-image-key', key);
      fixStretchedImages();
    };
    reader.readAsDataURL(file);
  }, true);

  function rememberImagesFromDom(scope){
    const ctx = scope && scope.querySelectorAll ? scope : document;
    const key = productKeyFromContext(ctx);
    if(!key) return;
    const imgs = Array.from(ctx.querySelectorAll('img'));
    const img = imgs.find(x=>isUsefulImageValue(x.currentSrc || x.src));
    if(img){
      lastImageBackup[key] = { value: img.currentSrc || img.src, at: new Date().toISOString(), source:'dom' };
      saveBackup();
    }
  }

  function loadBackup(){
    try{
      return JSON.parse(localStorage.getItem(LS_BACKUP_KEY) || '{}') || {};
    }catch(e){
      return {};
    }
  }

  function saveBackup(){
    try{
      const entries = Object.entries(lastImageBackup || {}).slice(-80);
      localStorage.setItem(LS_BACKUP_KEY, JSON.stringify(Object.fromEntries(entries)));
    }catch(e){
      // Puede fallar si localStorage está lleno por imágenes base64 muy grandes.
      console.warn('[SDC '+VERSION+'] No se pudo guardar backup de imagen:', e);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LocalStorage: snapshot/restore para evitar que se borre la foto.
  // ═══════════════════════════════════════════════════════════
  function snapshotStorage(){
    const snap = [];
    try{
      for(let i=0;i<localStorage.length;i++){
        const key = localStorage.key(i);
        if(!key || key === LS_BACKUP_KEY) continue;
        const raw = localStorage.getItem(key);
        if(!raw || raw.length < 2 || !/^[\[{]/.test(raw.trim())) continue;
        let data;
        try{ data = JSON.parse(raw); }catch(e){ continue; }
        const products = [];
        collectProductImages(data, [], products);
        if(products.length){
          snap.push({storageKey:key, raw, data, products});
        }
      }
    }catch(e){
      console.warn('[SDC '+VERSION+'] Snapshot falló:', e);
    }
    return snap;
  }

  function collectProductImages(node, path, out){
    if(!node || typeof node !== 'object') return;
    if(Array.isArray(node)){
      node.forEach((item, index)=>collectProductImages(item, path.concat(index), out));
      return;
    }

    const keys = Object.keys(node);
    const likelyProduct = keys.some(k=>PRODUCT_HINT_FIELDS.includes(k)) || keys.some(k=>/precio|price|stock|categoria|category|producto|product/i.test(k));
    if(likelyProduct){
      const id = productKeyFromObject(node) || path.join('.');
      IMAGE_FIELDS.forEach(field=>{
        if(Object.prototype.hasOwnProperty.call(node, field) && isUsefulImageValue(node[field])){
          out.push({path:path.slice(), field, id, value:node[field]});
        }
      });
    }

    keys.forEach(k=>{
      const child = node[k];
      if(child && typeof child === 'object') collectProductImages(child, path.concat(k), out);
    });
  }

  function restoreLostImages(snapshot){
    if(!snapshot || !snapshot.length) return false;
    let changedAny = false;

    snapshot.forEach(item=>{
      const rawNow = localStorage.getItem(item.storageKey);
      if(!rawNow || !/^[\[{]/.test(rawNow.trim())) return;
      let dataNow;
      try{ dataNow = JSON.parse(rawNow); }catch(e){ return; }

      item.products.forEach(prev=>{
        const target = getByPath(dataNow, prev.path);
        if(!target || typeof target !== 'object') return;
        const current = target[prev.field];
        const lost = !current || current === '' || current === null || current === undefined || current === 'undefined' || current === 'null';
        if(lost && isUsefulImageValue(prev.value)){
          target[prev.field] = prev.value;
          changedAny = true;
        }
      });

      if(changedAny){
        try{ localStorage.setItem(item.storageKey, JSON.stringify(dataNow)); }catch(e){ console.warn('[SDC '+VERSION+'] No se pudo restaurar imagen:', e); }
      }
    });

    if(changedAny){
      tryCallRender();
      window.setTimeout(fixStretchedImages, 250);
    }
    return changedAny;
  }

  function getByPath(root, path){
    return path.reduce((acc, key)=>acc && acc[key], root);
  }

  function isUsefulImageValue(value){
    if(typeof value !== 'string') return false;
    const v = value.trim();
    if(!v || v === 'null' || v === 'undefined') return false;
    return /^(data:image\/|blob:|https?:\/\/|\.\/|\/|assets\/|uploads\/|img\/|images\/)/i.test(v) || /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(v);
  }

  function productKeyFromObject(obj){
    if(!obj || typeof obj !== 'object') return '';
    for(const f of ID_FIELDS){
      if(obj[f] !== undefined && obj[f] !== null && cleanText(obj[f])) return f+':'+cleanText(obj[f]);
    }
    return '';
  }

  function productKeyFromContext(ctx){
    const product = extractProductFromContext(ctx);
    if(product && product.__key) return product.__key;
    if(product && product.id) return 'id:'+product.id;
    if(product && product.name) return 'name:'+product.name;
    return '';
  }

  function extractProductFromContext(ctx){
    const context = ctx && ctx.closest ? closestContext(ctx) : (ctx || document);
    const product = {};

    if(context && context.getAttribute){
      ['data-product-id','data-id','data-sku','data-code','data-codigo'].forEach(attr=>{
        const val = context.getAttribute(attr);
        if(val && !product.id) product.id = val;
      });
    }

    const fields = context && context.querySelectorAll ? Array.from(context.querySelectorAll('input,textarea,select,[contenteditable="true"]')) : [];
    fields.forEach(el=>{
      const label = fieldLabel(el);
      const value = el.isContentEditable ? cleanText(el.innerText) : cleanText(el.value);
      if(!value) return;
      if(/nombre|producto|title|name/i.test(label) && !product.name) product.name = value;
      else if(/sku|c[oó]digo|code/i.test(label) && !product.sku) product.sku = value;
      else if(/precio|price/i.test(label) && !product.price) product.price = value;
      else if(/stock|cantidad/i.test(label) && !product.stock) product.stock = value;
      else if(/categor/i.test(label) && !product.category) product.category = value;
      else if(/descrip/i.test(label) && !product.description) product.description = value;
    });

    const img = context && context.querySelector ? Array.from(context.querySelectorAll('img')).find(x=>isUsefulImageValue(x.currentSrc || x.src)) : null;
    if(img) product.image = img.currentSrc || img.src;

    if(!product.name){
      const title = context && context.querySelector ? context.querySelector('.card-title,.product-title,.producto-title,h1,h2,h3,strong,b') : null;
      if(title) product.name = cleanText(title.innerText || title.textContent);
    }

    if(product.id) product.__key = 'id:'+product.id;
    else if(product.sku) product.__key = 'sku:'+product.sku;
    else if(product.name) product.__key = 'name:'+product.name;

    product._source = 'sdc-v70-ui';
    product._syncedAt = new Date().toISOString();
    return product;
  }

  function fieldLabel(el){
    const bits = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), el.getAttribute('data-field')];
    if(el.id){
      const lab = document.querySelector('label[for="'+cssEscape(el.id)+'"]');
      if(lab) bits.push(lab.innerText || lab.textContent);
    }
    const parentLabel = el.closest('label');
    if(parentLabel) bits.push(parentLabel.innerText || parentLabel.textContent);
    const wrap = el.closest('.field,.form-field,.input-group,.form-group,.row,.col');
    if(wrap){
      const lab = wrap.querySelector('label,.lbl,.label');
      if(lab) bits.push(lab.innerText || lab.textContent);
    }
    return bits.filter(Boolean).join(' ');
  }

  function cssEscape(value){
    if(window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/["\\]/g,'\\$&');
  }

  // ═══════════════════════════════════════════════════════════
  // Google Sheets: intenta usar configuración/funciones existentes.
  // ═══════════════════════════════════════════════════════════
  async function syncSheets(product, opts){
    if(syncing) return true;
    syncing = true;
    try{
      const viaFunction = await tryKnownSyncFunctions(product);
      if(viaFunction) return true;

      const viaButton = await clickExistingSheetsButton();
      if(viaButton) return true;

      const viaEndpoint = await postToDiscoveredEndpoint(product);
      if(viaEndpoint) return true;

      if(opts && opts.manual){
        console.warn('[SDC '+VERSION+'] No se encontró función, botón o endpoint de Sheets. Producto:', product);
      }
      return false;
    }finally{
      syncing = false;
    }
  }

  async function tryKnownSyncFunctions(product){
    const names = [
      'saveProductToSheets',   // Expuesto por app.js v80
      'updateSheets','actualizarSheets','syncSheets','syncToSheets','syncProductsToSheets',
      'syncProductToSheets','updateProductInSheets','googleSheetsSync',
      'sendProductsToSheets','exportProductsToSheets','sdcUpdateSheets','sdcSyncSheets',
      'SDC_updateSheets','SDC_syncSheets'
    ];
    for(const name of names){
      const fn = window[name];
      if(typeof fn !== 'function') continue;
      try{
        const result = fn.length > 0 ? fn(product || {}) : fn();
        if(result && typeof result.then === 'function') await result;
        return true;
      }catch(e){
        console.warn('[SDC '+VERSION+'] Falló '+name+':', e);
      }
    }
    return false;
  }

  async function clickExistingSheetsButton(){
    const candidates = Array.from(document.querySelectorAll('button,a,input[type="button"],input[type="submit"]')).filter(el=>{
      if(el.hasAttribute(BTN_FLAG) || !isVisible(el)) return false;
      const text = norm(el.value || el.innerText || el.textContent || el.getAttribute('aria-label') || el.title || '');
      return /sheet|google sheets|actualizar sheet|sincronizar|sync/.test(text);
    });
    const btn = candidates[0];
    if(!btn) return false;
    btn.click();
    await wait(600);
    return true;
  }

  async function postToDiscoveredEndpoint(product){
    const endpoint = discoverSheetsEndpoint();
    if(!endpoint) return false;
    try{
      const res = await fetch(endpoint, {
        method:'POST',
        mode:'no-cors',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({ action:'updateProduct', source:'sdc-v70', product:product || {}, at:new Date().toISOString() })
      });
      // no-cors devuelve opaque; si no lanza error, se toma como enviado.
      return !!res;
    }catch(e){
      console.warn('[SDC '+VERSION+'] Endpoint de Sheets falló:', e);
      return false;
    }
  }

  function discoverSheetsEndpoint(){
    const buckets = [];
    const configs = [
      window.SDC_CONFIG, window.SDCConfig, window.CONFIG, window.APP_CONFIG,
      window.GOOGLE_SHEETS_CONFIG, window.SHEETS_CONFIG, window.sheetsConfig
    ].filter(Boolean);
    configs.forEach(obj=>{
      try{ Object.keys(obj).forEach(k=>buckets.push(String(obj[k]))); }catch(e){}
    });

    try{
      for(let i=0;i<localStorage.length;i++){
        const key = localStorage.key(i) || '';
        const val = localStorage.getItem(key) || '';
        if(/sheet|google|script|webapp|apps/i.test(key+val)) buckets.push(val);
      }
    }catch(e){}

    const found = buckets.find(v=>/^https:\/\/script\.google\.com\/macros\/s\//i.test(v) || /script\.google\.com\/macros\/s\//i.test(v));
    return found || '';
  }

  function wait(ms){ return new Promise(resolve=>window.setTimeout(resolve, ms)); }

  function tryCallRender(){
    ['render','sdcRender','renderApp','refreshApp','loadProducts','renderProducts'].some(name=>{
      const fn = window[name];
      if(typeof fn === 'function'){
        try{ fn(); return true; }catch(e){ return false; }
      }
      return false;
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Fix visual: mantiene proporción real de fotos.
  // ═══════════════════════════════════════════════════════════
  function fixStretchedImages(){
    const imgs = Array.from(document.querySelectorAll('img'));
    imgs.forEach(img=>{
      if(!shouldFixImage(img)) return;
      img.style.objectFit = 'contain';
      img.style.objectPosition = 'center center';
      img.style.aspectRatio = 'auto';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      // Si tenía height forzado y se nota deformada, permitir altura natural.
      if(img.naturalWidth && img.naturalHeight && img.clientWidth && img.clientHeight){
        const naturalRatio = img.naturalWidth / img.naturalHeight;
        const visibleRatio = img.clientWidth / img.clientHeight;
        if(Math.abs(naturalRatio - visibleRatio) > 0.28){
          img.style.height = 'auto';
        }
      }
    });

    // Background-images dentro de cards/previews de producto.
    const bgEls = Array.from(document.querySelectorAll('.product-card,.producto-card,.admin-product-card,.product-image,.product-img,.gallery-preview,.image-preview,.preview-image,[data-product-image],[data-sdc-product-image]'));
    bgEls.forEach(el=>{
      const bg = getComputedStyle(el).backgroundImage;
      if(bg && bg !== 'none' && /url\(/.test(bg)) el.classList.add('sdc-v70-bg-contain');
    });
  }

  function shouldFixImage(img){
    if(!img || !img.isConnected) return false;
    const src = img.currentSrc || img.src || '';
    const alt = norm(img.alt || '');
    if(/logo|icon|avatar/.test(alt) && !isUsefulImageValue(src)) return false;
    if(!isUsefulImageValue(src) && !/^data:image|blob:/i.test(src)) return false;
    const ctx = img.closest('.product-card,.producto-card,.admin-product-card,.modal,[role="dialog"],.quote-card,.cotizacion,.quotation,.gallery-preview,.image-preview,.preview-image,.product-image,.product-img,[data-product-image],[data-sdc-product-image]');
    return !!ctx;
  }

  // Observer para render dinámico.
  const mo = new MutationObserver(scheduleAddButtons);
  function boot(){
    addButtons();
    fixStretchedImages();
    mo.observe(document.documentElement, {childList:true, subtree:true, attributes:false});
    window.addEventListener('load', ()=>{ addButtons(); fixStretchedImages(); }, {once:true});
    window.addEventListener('resize', ()=>window.setTimeout(fixStretchedImages, 120));
    console.log('[SDC '+VERSION+'] Sheets + imagen fix activo');
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', boot, {once:true});
  }else{
    boot();
  }

  // API pequeña para pruebas/manual.
  window.SDCV70 = {
    syncSheets,
    snapshotStorage,
    restoreLostImages,
    fixStretchedImages,
    addButtons
  };
})();
