/* SDC V87 Mobile POS Pro: home premium + Google Sheets verificado. */
(function(){
  try{ if('scrollRestoration' in history) history.scrollRestoration='manual'; }catch(e){}
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  let state = SDCStore.load();
  state.products = dedupeProducts((state.products||[]).filter(isRealProduct));
  const app = $('#app'), modalRoot = $('#modalRoot'), toastEl = $('#toast');
  let currentView = 'catalog';
  let filter = {q:'',cat:'Todos',special:''};
  let quote;
  let saleDraft = null;
  const LOGO_SRC = 'assets/logo-sdc-2026.png';
  const RECEIPT_LOGO_SRC = 'assets/logo-sdc-receipt.png';
  const EMBEDDED_RECEIPT_LOGO = '';
  function exportLogoSrc(){return EMBEDDED_RECEIPT_LOGO || RECEIPT_LOGO_SRC || LOGO_SRC;}

  function stripMergeArtifacts(){
    const bad=/codex\/review-and-improve-webpage|^={7,}|^<{7,}|^>{7,}|\bmain\b/i;
    Array.from(document.body.childNodes||[]).forEach(node=>{
      if(node.nodeType!==Node.TEXT_NODE) return;
      const txt=String(node.textContent||'').trim();
      if(!txt) return;
      if(bad.test(txt)) node.remove();
    });
  }

  const SHIPPING = {
    normal: { type:'Normal', label:'Depósito', fee:110, cod:false, note:'Producto + Lps. 110 de envío. Pago por depósito o Tigo Money.' },
    cod: { type:'COD', label:'Pagar al recibir', fee:110, cod:true, note:'Producto + Lps. 110 de envío + comisión 10%. Si sale con centavos, se redondea hacia arriba y se suma Lps. 1.' },
    local: { type:'Local', label:'Envío Local', fee:0, cod:false, note:'Entrega local con costo definido manualmente según la zona o acuerdo con el cliente.' }
  };
  const LOCAL_PLACEHOLDER = 'Por definir';
  const COD_PERCENT = 10;
  const QUOTE_UPLIFT_PERCENT = 0;
  function moneyRoundUpPlus(value){
    const v=Number(value||0);
    if(!Number.isFinite(v) || v<=0) return 0;
    const nearest=Math.round(v);
    return Math.abs(v-nearest)<0.000001 ? nearest : Math.ceil(v)+1;
  }
  function upliftQuoteUnit(value){
    return Math.round(Number(value||0));
  }
  function codGrandTotal(base){return moneyRoundUpPlus(Number(base||0)*(1+(COD_PERCENT/100)));}
  const SDC_VERSION_LABEL = 'SDC V49 MOBILE CLIENTE';
  quote = emptyQuote();

  function hydrateState(){
    state.clients = Array.isArray(state.clients)?state.clients:[];
    state.closings = Array.isArray(state.closings)?state.closings:[];
    state.expenses = Array.isArray(state.expenses)?state.expenses:[];
    state.sales = Array.isArray(state.sales)?state.sales:[];
    state.quotes = Array.isArray(state.quotes)?state.quotes:[];
    state.settings = state.settings || {};
    if(state.settings.lowStockLimit===undefined) state.settings.lowStockLimit=3;
    state.settings.codPercent=COD_PERCENT;
    if(state.settings.moneyLocked===undefined) state.settings.moneyLocked=false;
    if(state.settings.captureClean===undefined) state.settings.captureClean=false;
    state.settings.cloudProvider='Firebase';
    state.settings.firebaseMode=true;
    state.settings.autoFirebaseSync=(window.SDC_CONFIG&&window.SDC_CONFIG.autoFirebaseSync)!==false;
    state.settings.autoSheetSync=false;
    state.settings.webAppUrl='';
    state.settings.productSheet='';
    delete state.settings.sheetId;
  }
  hydrateState();
  stripMergeArtifacts();

  function money(n){return `${state.settings.currency||'Lps.'} ${Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}`}
  function moneyPrivate(n){return state.settings.moneyLocked?'Oculto':money(n)}
  function num(n){return Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}
  function nowHN(){return new Date().toLocaleString('es-HN',{timeZone:'America/Tegucigalpa',day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'})}
  function nowHNPanel(){return new Date().toLocaleString('es-HN',{timeZone:'America/Tegucigalpa',weekday:'short',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit',second:'2-digit'}).replace(',', ' ·')}
  function cleanPhone(p){return String(p||'').replace(/\D/g,'').replace(/^5040?/,'504')}
  function isMobileDevice(){return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'')}
  function pad2(n){return String(n).padStart(2,'0')}
  function fileStamp(){const d=new Date(); return `${d.getFullYear()}${pad2(d.getMonth()+1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`}
  function slugFile(s,fallback='sd-comayagua'){return String(s||fallback).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,48)||fallback}
  function clientLabel(doc){const phone=cleanPhone(doc?.phone||'').slice(-8); const client=String(doc?.client||'').trim(); return slugFile(phone||client||doc?.id||'cliente')}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2600)}
  function save(){hydrateState(); SDCStore.save(state);}

  function shippingKey(doc){
    const raw=String(doc?.shippingType||'').toLowerCase();
    if(raw.includes('local')) return 'local';
    if(raw.includes('cod') || raw.includes('recibir') || doc?.cod===true) return 'cod';
    return 'normal';
  }
  function shippingLabel(doc){return SHIPPING[shippingKey(doc)].label}
  function shippingNote(doc){return SHIPPING[shippingKey(doc)].note}
  function isCodDoc(doc){return shippingKey(doc)==='cod'}
  function isLocalDoc(doc){return shippingKey(doc)==='local'}
  function applyShippingPreset(doc,type,force=true){
    const key=type==='Local'?'local':type==='COD'?'cod':'normal';
    doc.shippingType=SHIPPING[key].type;
    doc.cod=SHIPPING[key].cod;
    if(key==='normal') doc.shipping=SHIPPING.normal.fee;
    if(key==='cod') doc.shipping=SHIPPING.cod.fee;
    if(key==='local'){
      const current=Number(doc.shipping||0);
      if(force && (!current || current===SHIPPING.normal.fee || current===SHIPPING.cod.fee)) doc.shipping=0;
      if(!doc.company || ['Forza','C807','Cargo Expreso','Domicilio'].includes(String(doc.company))) doc.company='Entrega local';
    }
    if(key!=='local' && String(doc.company||'').toLowerCase().includes('local')) doc.company='Forza';
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

  function rowValue(row, keys){
    if(!row || typeof row!=='object') return '';
    const lower={}; Object.keys(row).forEach(k=>lower[String(k).toLowerCase().trim()]=k);
    for(const key of keys){
      const real=Object.prototype.hasOwnProperty.call(row,key)?key:lower[String(key).toLowerCase().trim()];
      if(real && row[real]!==undefined && row[real]!==null) return String(row[real]).trim();
    }
    return '';
  }
  function rowMoney(v){
    const n=Number(String(v||'').replace(/[^0-9.-]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function sheetRowHasProduct(row){
    if(!row || typeof row!=='object') return false;
    const active=rowValue(row,['activo','active','visible','estado','status']).toLowerCase();
    if(['no','false','0','inactivo','oculto','borrado','eliminado'].includes(active)) return false;
    const name=rowValue(row,['nombre','name','producto','product','titulo','title']);
    const id=rowValue(row,['id','codigo','código','sku','code']);
    const price=rowMoney(rowValue(row,['precio','price','venta','precio_venta']));
    const stock=rowMoney(rowValue(row,['stock','existencia','cantidad']));
    const img=rowValue(row,['imagen','image','img','foto','url_imagen','galeria_1']);
    const desc=rowValue(row,['descripcion','descripción','description','detalle','details']);
    const cat=rowValue(row,['categoria','categoría','category','rubro']);
    const bad=['producto','producto sin nombre','general','sin nombre','-','.'];
    if(name && !bad.includes(name.toLowerCase())) return true;
    return !!id && (price>0 || stock>0 || !!img || !!desc || !!cat);
  }
  function isRealProduct(p){
    if(!p || typeof p!=='object') return false;
    const name=String(p.name||p.nombre||'').trim();
    const bad=['producto','producto sin nombre','general','sin nombre','-','.'];
    if(!name || bad.includes(name.toLowerCase())) return false;
    return Number(p.price||p.precio||0)>0 || Number(p.stock||0)>0 || !!(p.image||p.img) || !!(p.description||p.descripcion) || parseTags(p?.categories||p?.category||p?.categoria||'').filter(x=>String(x).toLowerCase()!=='general').length>0;
  }
  function parseTags(str){
    if(Array.isArray(str)) return str.flatMap(parseTags);
    if(str && typeof str==='object') return parseTags(str.categories || str.category || str.categoria || str.etiquetas || str.tags || '');
    return String(str||'').split(/[;,|/]+/).map(x=>x.trim()).filter(x=>x && x.toLowerCase()!=='[object object]');
  }
  function inferTagsFromProduct(p){
    const hay=[p?.name,p?.nombre,p?.id,p?.codigo,p?.description,p?.descripcion].join(' ').toLowerCase();
    const tags=[];
    const add=(t)=>{if(!tags.some(x=>x.toLowerCase()===t.toLowerCase())) tags.push(t)};
    if(/dedal/.test(hay)) add('Dedales');
    if(/gatillo|trigger/.test(hay)) add('Gatillos');
    if(/enfriador|cooler|radiador/.test(hay)) add('Enfriadores');
    if(/guante/.test(hay)) add('Guantes');
    if(/aud[ií]fono|qkz|auricular|audio/.test(hay)) add('Audio');
    if(/tipo\s*c|usb\s*c/.test(hay)) add('Tipo C');
    if(/micro\s*sd|microsd|memoria/.test(hay)) add('MicroSD');
    if(/secador|zapato/.test(hay)) add('Hogar');
    if(/termo|stanley/.test(hay)) add('Termos');
    if(/gamer|juego|celular|m[óo]vil|memo/.test(hay)) add('Gamer Móvil');
    return tags;
  }
  function productTags(p){
    const direct=parseTags(p?.categories || p?.category || p?.categoria || p?.etiquetas || p?.tags).filter(x=>!['sin categoria','sin categoría','general'].includes(String(x).toLowerCase()));
    const tags=direct.length?direct:inferTagsFromProduct(p);
    return tags.length?tags:[];
  }
  function categoryText(p){return productTags(p).join(', ')}
  function firstTag(p){return productTags(p)[0]||'Producto'}
  function autoProductDescription(p={}){
    const name=String(p.name||p.nombre||'Producto').trim()||'Producto';
    const hay=[name,categoryText(p),p.id||'',p.brand||''].join(' ').toLowerCase();
    const price=Number(p.price??p.precio??0)||0;
    let base='Producto disponible en SD COMAYAGUA. Ideal para clientes que buscan buena calidad, precio claro y atención por WhatsApp.';
    if(/dedal|funda|dedos/.test(hay)) base='Dedales gamer para celular, ideales para jugar con mejor deslizamiento, comodidad y precisión. Ayudan a reducir el sudor en pantalla y son prácticos para juegos móviles como Free Fire, PUBG Mobile y Call of Duty Mobile.';
    else if(/gatillo|trigger/.test(hay)) base='Gatillos gamer para celular, prácticos para mejorar el control al apuntar, disparar y moverse en juegos móviles. Diseño cómodo para sesiones de juego más precisas.';
    else if(/enfriador|cooler|radiador|ventilador/.test(hay)) base='Enfriador gamer para celular, útil para ayudar a controlar la temperatura del equipo durante juegos o uso intenso. Ideal para mantener un rendimiento más estable.';
    else if(/aud[ií]fono|audio|bluetooth|auricular|qkz/.test(hay)) base='Accesorio de audio disponible para uso diario, llamadas, música y contenido multimedia. Consulte compatibilidad antes de confirmar su compra.';
    else if(/cable|cargador|adaptador|tipo c|micro sd|microsd|usb/.test(hay)) base='Accesorio tecnológico para uso diario. Antes de pagar, confirme compatibilidad con su dispositivo y disponibilidad actual.';
    else if(/hogar|cocina|limpieza|organizador|secador|termo/.test(hay)) base='Producto práctico para el hogar, pensado para facilitar tareas diarias con una presentación útil y funcional.';
    const cat=firstTag(p);
    const priceText=price>0?` Precio de referencia: ${money(price)}.`:'';
    return `${base}${priceText} Categoría: ${cat}. Disponible para cotización, venta y envío según zona.`;
  }
  function productDescription(p={}){return String(p.description||p.descripcion||'').trim() || autoProductDescription(p)}
  function autoProductSpecs(p={}){
    return {estado:'Nuevo',categoria:firstTag(p)||'General',pais:'Honduras',envios:'Normal Lps.110 · Pagar al Recibir Lps.110 + 10% · Local por definir'};
  }
  function isActiveProduct(p){
    return p && p.active!==false && p.activo!==false && !['no','false','0','inactivo','oculto','borrado','eliminado'].includes(String(p.status||p.estado||'').toLowerCase().trim());
  }
  function activeProducts(){return (state.products||[]).filter(isActiveProduct)}
  function allCategories(){
    const cats=Array.from(new Set(activeProducts().flatMap(p=>productTags(p)).filter(Boolean)));
    return ['Todos',...cats.sort((a,b)=>a.localeCompare(b,'es'))];
  }
  function catSlug(str){return String(str||'categoria').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'categoria'}
  const CATEGORY_ASSET_SLUGS = new Set(['accesorio','accesorios','adaptador','adaptador-de-microsd','adaptador-micro-sd','adaptador-microsd','adaptadores','agotados','audifono','audifonos','audifonos-c','audifonos-qkz','audifonos-tipo-c','audio','auriculares','belleza','cable','cables','cargador','cargadores','categoria','celulares','cocina','cooler','coolers','dedales','dedales-memo','dedales-v1','dedales-v2','enfriador','enfriador-memo','enfriador-x112','enfriadores','gamer','gamer-movil','gaming','gatillo','gatillos','general','guante','guantes','guantes-memo','herramienta','herramientas','hogar','juegos','limpieza','mas-vendidos','memoria','memorias','micro-sd','microsd','nuevo','ofertas','otro','otros','promociones','secador-de-zapatos','secador-zapatos','stock-bajo','tecnologia','termo','termo-stanley','termos','tipo-c','tipo-c-audio','todas','trigger','zapato','zapatos']);
  function categoryImage(cat){const raw=String(cat||'General'); const c=raw.toLowerCase(); if(c==='todos')return 'assets/categorias/todas.svg'; const slug=catSlug(raw); if(CATEGORY_ASSET_SLUGS.has(slug)) return `assets/categorias/${slug}.svg`; return categoryFallbackSVG({category:raw,name:raw,id:'Categoría'})}
  function categoryCount(cat){const base=activeProducts(); if(cat==='Todos')return base.length; const t=String(cat).toLowerCase(); return base.filter(p=>productTags(p).some(x=>x.toLowerCase()===t)).length}

  function missingImageValue(src){
    const v=String(src||'').trim();
    if(!v) return true;
    const l=v.toLowerCase();
    return ['sin imagen','sin foto','no image','no-image','none','null','undefined','n/a','na','-','.','0'].includes(l) || /^(sin\s+imagen|sin\s+foto)$/i.test(v);
  }
  function categoryIconFor(p){
    const hay=[firstTag(p),categoryText(p),p?.name,p?.id,p?.description].join(' ').toLowerCase();
    if(/aud[ií]fono|auricular|audio|qkz|bluetooth|tipo c|manos libres|earbuds|headset/.test(hay)) return '🎧';
    if(/dedal|gatillo|trigger|gamer|gaming|free fire|pubg|call of duty|joystick|control/.test(hay)) return '🎮';
    if(/enfriador|cooler|ventilador|radiador|disipador/.test(hay)) return '❄️';
    if(/cable|cargador|adaptador|usb|micro sd|microsd|memoria|tipo c|lector/.test(hay)) return '🔌';
    if(/termo|cocina|hogar|limpieza|zapato|secador|organizador|vaso|botella/.test(hay)) return '🏠';
    if(/belleza|cosm[eé]tico|cosmetiquera|maquillaje|labial|brocha|espejo|pesta[nñ]a|cuidado/.test(hay)) return '💄';
    if(/bolso|cartera|mochila|estuche/.test(hay)) return '👜';
    if(/reloj|smartwatch|watch/.test(hay)) return '⌚';
    if(/aro de luz|tripode|tr[ií]pode|soporte|selfie/.test(hay)) return '📷';
    return '📦';
  }
  function categoryFallbackSVG(p){
    const cat=firstTag(p)||'Producto';
    const label=String(cat).replace(/\s+/g,' ').trim().slice(0,18)||'Producto';
    const icon=categoryIconFor(p);
    const slug=catSlug(label);
    const hue=[...slug].reduce((a,ch)=>a+ch.charCodeAt(0),0)%42;
    const c1=`hsl(${205+hue} 96% 50%)`;
    const c2=`hsl(${188+(hue%24)} 91% 58%)`;
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
        <radialGradient id="r" cx="76%" cy="16%" r="68%"><stop offset="0" stop-color="#ffffff" stop-opacity=".72"/><stop offset=".52" stop-color="#ffffff" stop-opacity=".16"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
        <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#03224a" flood-opacity=".18"/></filter>
      </defs>
      <rect width="900" height="900" rx="118" fill="url(#g)"/>
      <rect width="900" height="900" rx="118" fill="url(#r)"/>
      <circle cx="742" cy="148" r="180" fill="#fff" opacity=".14"/>
      <circle cx="154" cy="760" r="220" fill="#002c66" opacity=".10"/>
      <g filter="url(#s)">
        <rect x="150" y="150" width="600" height="600" rx="78" fill="#ffffff" opacity=".95"/>
        <circle cx="450" cy="450" r="150" fill="#eaf4ff"/>
        <text x="450" y="500" text-anchor="middle" font-size="160" font-family="Apple Color Emoji, Segoe UI Emoji, Arial, sans-serif">${icon}</text>
      </g>
      <rect x="288" y="700" width="324" height="64" rx="32" fill="#ffffff" opacity=".92"/>
      <text x="450" y="742" text-anchor="middle" font-size="28" font-weight="900" fill="#0a4ea3" font-family="Barlow, Arial, sans-serif">${escapeHtml(label)}</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }
  function placeholderFor(p){return categoryFallbackSVG(p||{})}
  function captureFallbackImage(){return categoryFallbackSVG({name:'SD Comayagua',category:'Gamer'}) || LOGO_SRC}
  function galleryOf(p){
    const g=String(p?.gallery||'').split(/[\n,]+/).map(x=>x.trim()).filter(x=>!missingImageValue(x));
    const list=[p?.image,p?.img,p?.foto,p?.imagen,...g].map(x=>String(x||'').trim()).filter(x=>!missingImageValue(x));
    return Array.from(new Set(list));
  }
  function productImage(p){return galleryOf(p)[0] || categoryFallbackSVG(p||{})}
  function onImgError(img,p){img.onerror=null; img.src=categoryFallbackSVG(p||{});}
  function productById(id){return state.products.find(p=>p.id===id)}
  function nextCode(){let max=0; state.products.forEach(p=>{const m=String(p.id).match(/(\d+)$/); if(m) max=Math.max(max,Number(m[1]))}); return `SDC-${String(max+1).padStart(3,'0')}`}
  function colorKey(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
  function parseColorRows(value){
    const clean=(name,qty)=>{
      const label=String(name||'').trim();
      const amount=Math.max(0,Math.floor(Number(String(qty??'').replace(/[^0-9.-]/g,''))||0));
      return label?{name:label,qty:amount}:null;
    };
    if(Array.isArray(value)) return value.map(v=>{
      if(typeof v==='string'){
        const m=v.match(/^(.+?)(?:[:=]|\s+x\s+|\s+-\s+)\s*([0-9]+(?:[.,][0-9]+)?)$/i);
        return m?clean(m[1],m[2]):clean(v,0);
      }
      return clean(v?.name||v?.color||v?.colour||v?.nombre||v?.label, v?.qty??v?.cantidad??v?.stock??v?.existencia);
    }).filter(Boolean);
    if(value && typeof value==='object') return Object.entries(value).map(([name,qty])=>clean(name,qty)).filter(Boolean);
    const raw=String(value||'').trim();
    if(!raw) return [];
    try{const parsed=JSON.parse(raw); if(parsed && parsed!==raw) return parseColorRows(parsed);}catch(e){}
    return raw.split(/\s*(?:\r?\n|\||;|,)\s*/).map(part=>{
      const txt=String(part||'').trim();
      if(!txt) return null;
      let m=txt.match(/^(.+?)(?:[:=]|\s+x\s+|\s+-\s+)\s*([0-9]+(?:[.,][0-9]+)?)$/i);
      if(!m) m=txt.match(/^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/);
      if(!m) return clean(txt,0);
      return /^\d/.test(m[1])?clean(m[2],m[1]):clean(m[1],m[2]);
    }).filter(Boolean);
  }
  function mergeColorRows(rows){
    const map=new Map();
    parseColorRows(rows).forEach(r=>{
      const key=colorKey(r.name);
      if(!key) return;
      if(!map.has(key)) map.set(key,{name:r.name,qty:0});
      map.get(key).qty+=Math.max(0,Math.floor(Number(r.qty)||0));
    });
    return Array.from(map.values());
  }
  function colorRowsTotal(rows){return parseColorRows(rows).reduce((a,r)=>a+(Number(r.qty)||0),0)}
  function productColorRows(p){return mergeColorRows(p?.colors || p?.colores || p?.colorStock || p?.stockColores || p?.variantesColor || p?.variantes_color || [])}
  function hasColorStock(p){return productColorRows(p).length>0}
  function productStock(p){const rows=productColorRows(p); return rows.length?colorRowsTotal(rows):Math.max(0,Math.floor(Number(p?.stock||0)||0))}
  function normalizeProductColorStock(p){
    if(!p) return p;
    const rows=productColorRows(p).filter(r=>String(r.name||'').trim());
    p.colors=rows;
    if(rows.length) p.stock=colorRowsTotal(rows);
    else p.stock=Math.max(0,Math.floor(Number(p.stock||0)||0));
    return p;
  }
  function colorRowsText(rows){return parseColorRows(rows).filter(r=>r.name).map(r=>`${r.name}:${Math.max(0,Math.floor(Number(r.qty)||0))}`).join(' | ')}
  function colorStockSummary(p,limit=4){
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0);
    if(!rows.length) return '';
    const visible=rows.slice(0,limit).map(r=>`${r.name} ${num(r.qty)}`);
    const extra=rows.length>limit?` +${rows.length-limit}`:'';
    return visible.join(' · ')+extra;
  }
  function colorStockHTML(p){
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0);
    if(!rows.length) return '';
    return `<div class="color-stock-chips-v86">${rows.map(r=>`<span><b>${escapeHtml(r.name)}</b><em>${num(r.qty)}</em></span>`).join('')}</div>`;
  }
  function defaultColorForProduct(p){const rows=productColorRows(p).filter(r=>Number(r.qty)>0); return rows[0]?.name || ''}
  function selectedColorLabel(it){return String(it?.color||it?.colour||it?.colorName||'').trim()}
  function itemVariantKey(it){return `${String(it?.id||'')}::${colorKey(selectedColorLabel(it))}`}
  function itemColorLine(it){const c=selectedColorLabel(it); return c?` · Color: ${escapeHtml(c)}`:''}
  function itemColorText(it){const c=selectedColorLabel(it); return c?`Color: ${c}`:''}
  function colorQtyAvailable(p,color){
    const key=colorKey(color);
    if(!key) return productStock(p);
    const row=productColorRows(p).find(r=>colorKey(r.name)===key);
    return Math.max(0,Number(row?.qty||0));
  }
  function adjustProductColorStock(p,color,diff){
    if(!p) return;
    const rows=productColorRows(p);
    if(rows.length && color){
      const key=colorKey(color);
      let row=rows.find(r=>colorKey(r.name)===key);
      if(!row){row={name:color,qty:0}; rows.push(row);}
      row.qty=Math.max(0,Math.floor(Number(row.qty||0)-diff));
      p.colors=rows;
      p.stock=colorRowsTotal(rows);
    }else{
      p.stock=Math.max(0,Math.floor(Number(p.stock||0)-diff));
    }
  }
  function emptyQuote(){return {id:'COT-'+Date.now(),items:[],gifts:[],client:'',phone:'',department:'Comayagua',municipality:'Comayagua',reference:'',shippingType:'Normal',company:'Forza',shipping:SHIPPING.normal.fee,cod:false,discount:0,date:new Date().toISOString(),saved:false,qtyMap:{}}}
  function emptySale(){return {...emptyQuote(), id:'SDC-'+Date.now().toString().slice(-10), kind:'receipt'}}
  function itemProductRef(it){return productById(it?.id)||it||{}}
  function itemBaseUnit(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    const p=itemProductRef(it);
    const promoTotal=(p && (p.promos || p.price!==undefined))?promoTotalForQty(p,qty):null;
    if(promoTotal!==null) return promoTotal/qty;
    return Number(it?.price||p?.price||0);
  }
  function itemQuotedUnit(it){
    const baseUnit=itemBaseUnit(it);
    return upliftQuoteUnit(baseUnit);
  }
  function quotedUnitPrice(value){
    return upliftQuoteUnit(Number(value||0));
  }
  function productQuotedUnit(p){
    return Math.round(Number(p?.price||0));
  }
  function productQuotedItemsTotal(p,qty=1){
    return productItemsTotal(p,qty);
  }
  function itemTotal(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    return qty*itemBaseUnit(it);
  }
  function itemEffectiveUnit(it){return itemBaseUnit(it)}
  function itemPromoApplied(it){
    const qty=Math.max(1,Number(it?.qty)||1);
    const p=itemProductRef(it);
    return promoTotalForQty(p,qty)!==null;
  }
  function calc(doc){
    const products=(doc.items||[]).reduce((a,it)=>a+itemTotal(it),0);
    const shipping=Number(doc.shipping||0);
    const discount=Number(doc.discount||0);
    const base=Math.max(0,products+shipping);
    let commission=0;
    let gross=base;
    if(isCodDoc(doc)){
      gross=codGrandTotal(base);
      commission=Math.max(0,gross-base);
    }
    const delivery=shipping+commission;
    const total=Math.max(0,gross-discount);
    return {products,shipping,commission,delivery,discount,total};
  }
  function promoTiers(p){
    return parsePromoRows(p?.promos).map(r=>({qty:Number(r.qty)||0,price:Number(r.price)||0})).filter(r=>r.qty>0&&r.price>0).sort((a,b)=>a.qty-b.qty);
  }
  function promoTotalForQty(p,qty){
    qty=Math.max(1,Number(qty)||1);
    const rows=promoTiers(p);
    if(!rows.length) return null;
    const exact=rows.find(r=>r.qty===qty);
    if(exact) return exact.price;
    const tier=[...rows].reverse().find(r=>r.qty<=qty);
    if(!tier) return null;
    const unit=tier.price/tier.qty;
    return Math.round(qty*unit);
  }
  function promoLabelForMode(p,qty,mode='hn'){
    qty=Math.max(1,Number(qty)||1);
    const rows=promoTiers(p);
    if(!rows.length) return '';
    const exact=rows.find(r=>r.qty===qty);
    const tier=exact || [...rows].reverse().find(r=>r.qty<=qty);
    if(!tier) return '';
    const unitBase=tier.price/tier.qty;
    const unit=unitBase;
    return `Oferta aplicada: ${money(unit)} c/u desde ${num(tier.qty)} unidades`;
  }
  function promoLabelForQty(p,qty){
    return promoLabelForMode(p,qty,'hn');
  }
  function productItemsTotal(p,qty=1){
    qty=Math.max(1,Number(qty)||1);
    const promo=promoTotalForQty(p,qty);
    return promo!==null?promo:qty*Number(p?.price||0);
  }
  function productNormalTotalQty(p,qty=1){return productItemsTotal(p,qty)+SHIPPING.normal.fee}
  function productCodTotalQty(p,qty=1){const base=productItemsTotal(p,qty)+SHIPPING.cod.fee; return codGrandTotal(base)}
  function productNormalTotal(p){return productNormalTotalQty(p,1)}
  function productCodTotal(p){return productCodTotalQty(p,1)}
  function promoRowsForCustomer(p){
    const basePrice=Number(p.price||0);
    const rows=parsePromoRows(p.promos).map(r=>({qty:Number(r.qty)||0,price:Number(r.price)||0})).filter(r=>r.qty>0&&r.price>0);
    const hasPromos=String(p.promos||'').trim().length>0;
    if(hasPromos && basePrice>0 && !rows.some(r=>r.qty===1)) rows.unshift({qty:1,price:basePrice});
    const unique=new Map();
    rows.sort((a,b)=>a.qty-b.qty).forEach(r=>unique.set(r.qty,r));
    return Array.from(unique.values()).slice(0,14);
  }
  function promoPublicHTML(p){
    return '';
  }
  function promoWhatsAppLines(p){
    const rows=promoRowsForCustomer(p);
    if(!String(p.promos||'').trim() || !rows.length) return '';
    return rows.map(r=>{
      const quoteProducts=Number(r.price||0);
      return `• ${num(r.qty)} ${r.qty===1?'unidad':'unidades'}: Producto ${money(quoteProducts)} | Depósito ${money(quoteProducts+SHIPPING.normal.fee)} | Pagar al Recibir ${money(codGrandTotal(quoteProducts+SHIPPING.cod.fee))}`
    }).join('\n');
  }
  function setView(v){currentView=v; render(); window.scrollTo({top:0,behavior:'smooth'});}
  function getSheetApiUrl(){return ''}
  function getSheetId(){return ''}
  function getProductSheetName(){return ''}
  function normalizeSheetRemoteProduct(row,i=0){
    const activeValue = row.activo ?? row.active ?? row.visible ?? row.estado ?? row.status ?? 'TRUE';
    const activeText = String(activeValue).trim().toLowerCase();
    const isActive = !(activeValue === false || ['false','falso','0','no','inactivo','oculto','borrado','eliminado'].includes(activeText));
    const p=SDCStore.normalizeProduct({
      id: row.codigo || row.id || row.code || row.sku || `SDC-${String(i+1).padStart(3,'0')}`,
      name: row.nombre || row.name || row.producto || 'Producto sin nombre',
      categories: row.categoria || row.categorias || row.category || row.categories || row.etiquetas || '',
      brand: row.marca || row.brand || '',
      price: row.precio ?? row.price ?? row.precio_venta ?? 0,
      cost: row.costo ?? row.cost ?? row.costo_compra ?? 0,
      stock: row.stock ?? row.existencia ?? row.inventario ?? 0,
      image: row.imagen || row.image || row.foto || row.url_imagen || '',
      gallery: row.galeria || row.gallery || row.imagenes || row.galeria_extra || '',
      description: row.descripcion || row.description || row.detalle || '',
      promos: row.promos || row.promociones || row.mayoreo || row.ofertas || row.precio_mayoreo || '',
      colors: row.colores || row.colors || row.colorStock || row.stock_colores || row.stockColores || row.variantes_color || row.variantesColor || '',
      active: isActive,
      updatedAt: row.updatedAt || row.updated_at || row.fecha_actualizacion || ''
    },i);
    if(!String(p.description||'').trim()) p.description=autoProductDescription(p);
    return isActive?p:null;
  }
  function sheetJsonp(params){
    return new Promise((resolve,reject)=>{
      const base=getSheetApiUrl();
      if(!base) return reject(new Error('No hay URL /exec de Apps Script configurada.'));
      const cb='sdcSheetCb_'+Date.now()+'_'+Math.floor(Math.random()*9999);
      const url=new URL(base);
      Object.entries({...params,callback:cb,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
      const script=document.createElement('script');
      const timer=setTimeout(()=>{cleanup(); reject(new Error('Tiempo agotado conectando con Google Sheets.'));},12000);
      function cleanup(){clearTimeout(timer); delete window[cb]; script.remove();}
      window[cb]=(data)=>{cleanup(); resolve(data)};
      script.onerror=()=>{cleanup(); reject(new Error('No se pudo cargar la respuesta de Apps Script.'))};
      script.src=url.toString(); document.head.appendChild(script);
    });
  }
  async function sheetGet(params={}){
    const base=getSheetApiUrl();
    if(!base) throw new Error('No hay URL /exec de Apps Script configurada.');
    // Apps Script suele redirigir las respuestas a googleusercontent y algunos móviles
    // se ponen dramáticos con CORS. JSONP evita ese circo para lecturas/verificación.
    try{
      return await sheetJsonp(params);
    }catch(jsonpErr){
      console.warn('JSONP Sheets falló; probando fetch directo.', jsonpErr);
      const url=new URL(base);
      Object.entries({...params,_:Date.now()}).forEach(([k,v])=>url.searchParams.set(k,v));
      const res=await fetch(url.toString(),{method:'GET',cache:'no-store',redirect:'follow'});
      const txt=await res.text();
      return JSON.parse(txt);
    }
  }
  function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
  function normalizeAction(action){return String(action || '').trim().toLowerCase().replace(/[^a-z0-9]/g,'');}
  function sheetErrorMessage(err){
    const msg=String(err && err.message || err || '');
    if(err && err.name === 'AbortError') return 'Google Sheets tardó demasiado en responder. Revisa conexión y vuelve a intentar.';
    if(/failed to fetch|networkerror|load failed|cors/i.test(msg)) return 'El navegador no confirmó la respuesta de Apps Script. Intenté un envío alterno y verificación.';
    return msg || 'No se pudo guardar en Google Sheets.';
  }
  function productCodeFromPayload(payload={}){
    const product=payload.product || payload;
    return String(product.codigo || product.id || payload.codigo || payload.id || payload.previousCodigo || payload.previousCode || '').trim();
  }
  function isVerifiableProductWrite(payload={}){
    const action=normalizeAction(payload.action || '');
    return ['upsertproduct','patchproduct','saveproduct','updateproduct','setactive','updatestock','batchupdatestock','adjuststock','addgalleryimages','setmainimage'].includes(action);
  }
  async function verifyProductSavedInSheets(codigo){
    const clean=String(codigo || '').trim();
    if(!clean) return null;
    try{
      const data=await sheetGet({action:'product',codigo:clean,sheetId:getSheetId(),productSheet:getProductSheetName(),_verify:Date.now()});
      if(data && data.ok && data.product) return data.product;
    }catch(err){
      console.warn('No se pudo verificar el producto en Sheets',err);
    }
    return null;
  }
  function sheetPostViaIframe(body){
    return new Promise(resolve=>{
      const base=getSheetApiUrl();
      const iframe=document.createElement('iframe');
      const form=document.createElement('form');
      const input=document.createElement('textarea');
      const frameName='sdcSheetPost_'+Date.now()+'_'+Math.floor(Math.random()*9999);
      iframe.name=frameName; iframe.style.display='none';
      form.method='POST'; form.action=base; form.target=frameName; form.style.display='none';
      input.name='payload'; input.value=JSON.stringify(body);
      form.appendChild(input);
      document.body.appendChild(iframe); document.body.appendChild(form);
      const cleanup=()=>{form.remove(); iframe.remove(); resolve(true);};
      iframe.onload=()=>setTimeout(cleanup,300);
      setTimeout(cleanup,3600);
      try{form.submit();}catch(err){console.warn('Fallback iframe Sheets falló',err); cleanup();}
    });
  }
  async function sheetPostOpaque(body){
    const base=getSheetApiUrl();
    try{
      await fetch(base,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow'});
      return true;
    }catch(err){
      console.warn('Fallback no-cors Sheets falló; usando iframe.',err);
      return sheetPostViaIframe(body);
    }
  }
  async function sheetPost(payload={}, opts={}){
    const base=getSheetApiUrl();
    if(!base) throw new Error('No hay URL /exec de Apps Script configurada.');
    const body={sheetId:getSheetId(),productSheet:getProductSheetName(),adminKey:state.settings.accessKey||'',...payload};
    const verifyCode=String(opts.verifyProductCode || productCodeFromPayload(payload) || '').trim();
    const mustVerify=!!(opts.verifyProductCode && isVerifiableProductWrite(payload) && verifyCode);
    const controller=window.AbortController ? new AbortController() : null;
    const timer=controller ? setTimeout(()=>controller.abort(), opts.timeout || 22000) : null;
    try{
      const res=await fetch(base,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body),redirect:'follow',signal:controller?controller.signal:undefined});
      const txt=await res.text();
      let data; try{data=JSON.parse(txt)}catch(e){throw new Error('Apps Script no devolvió JSON válido.')}
      if(!data.ok) throw new Error(data.error||'No se pudo guardar en Google Sheets.');
      if(mustVerify){
        await sleep(900);
        const verified=await verifyProductSavedInSheets(verifyCode);
        if(verified) return {...data, verified:true, product:verified};
        throw new Error('Apps Script respondió OK, pero el producto no apareció en la pestaña '+getProductSheetName()+'. Actualiza el Apps Script incluido en este paquete.');
      }
      return data;
    }catch(err){
      if(isVerifiableProductWrite(payload) && verifyCode){
        await sheetPostOpaque(body);
        await sleep(2400);
        let verified=await verifyProductSavedInSheets(verifyCode);
        if(!verified){
          await sheetPostViaIframe(body);
          await sleep(2400);
          verified=await verifyProductSavedInSheets(verifyCode);
        }
        if(verified) return {ok:true, verified:true, fallback:true, product:verified};
      }
      throw new Error(sheetErrorMessage(err));
    }finally{
      if(timer) clearTimeout(timer);
    }
  }
  function firebaseReadyNow(){
    return !!(window.SDC_FIREBASE && (window.cargarDesdeFirebase || window.guardarProductoFirebase));
  }
  function waitForFirebase(timeout=20000){
    if(firebaseReadyNow()) return Promise.resolve(window.SDC_FIREBASE);
    return new Promise((resolve,reject)=>{
      const started=Date.now();
      const done=()=>{cleanup(); resolve(window.SDC_FIREBASE||{});};
      const cleanup=()=>{clearInterval(timer); window.removeEventListener('sdc-firebase-ready',done);};
      window.addEventListener('sdc-firebase-ready',done,{once:true});
      const timer=setInterval(()=>{
        if(firebaseReadyNow()) return done();
        if(Date.now()-started>timeout){cleanup(); reject(new Error('Firebase no terminó de cargar. Revisa internet o el archivo js/sdc-firebase.js.'));}
      },160);
    });
  }
  function normalizeFirebaseRemoteProduct(row,i=0){
    const variants=row?.variantes || row?.colors || row?.colores || [];
    const colors=parseColorRows(variants.length?variants:(row?.colores||''));
    const stock=colors.length?colorRowsTotal(colors):Number(row?.stock||row?.stock_inicial||0)||0;
    const p=SDCStore.normalizeProduct({
      id: row?.id || row?.codigo || `SDC-${String(i+1).padStart(3,'0')}`,
      name: row?.nombre || row?.name,
      categories: row?.categorias || row?.categoria || row?.category || 'General',
      cost: row?.costo ?? row?.cost,
      price: row?.precio ?? row?.price,
      stock,
      colors,
      image: row?.img || row?.image || row?.imagen || '',
      gallery: row?.galeria || row?.gallery || '',
      description: row?.descripcion || row?.description || '',
      promos: row?.promos || row?.promociones || '',
      active: row?.activo !== false && row?.active !== false,
      updatedAt: row?.updatedAt || row?.actualizadoEn || ''
    },i);
    return normalizeProductColorStock(p);
  }

  function normalizedKeyPart(v){
    return String(v||'').normalize('NFD').replace(/[̀-ͯ]/g,'').trim().toLowerCase().replace(/\s+/g,' ');
  }
  function productIdentityNameKey(p){
    const name=normalizedKeyPart(p?.name);
    const cat=normalizedKeyPart(firstTag(p)||p?.categories||'general');
    const price=Number(p?.price||0);
    return `${name}|${cat}|${price}`;
  }
  function looksLikeOfficialCode(id){
    return /^sdc-\d+/i.test(String(id||'').trim());
  }
  function productScore(p){
    let score=0;
    const id=String(p?.id||'').trim();
    if(looksLikeOfficialCode(id)) score+=6;
    else if(id) score+=2;
    if(String(p?.image||'').trim()) score+=5;
    if(String(p?.gallery||'').trim()) score+=2;
    if(productColorRows(p).length) score+=2;
    if(Number(p?.stock||0)>0) score+=2;
    if(String(p?.description||'').trim()) score+=1;
    if(String(p?.updatedAt||'').trim()) score+=1;
    return score;
  }
  function mergeDuplicateProducts(base, extra){
    const keep=SDCStore.clone(base||{});
    const alt=SDCStore.clone(extra||{});
    if(!keep.id || (!looksLikeOfficialCode(keep.id) && looksLikeOfficialCode(alt.id))) keep.id=alt.id;
    if(!String(keep.name||'').trim()) keep.name=alt.name;
    if(!String(keep.categories||'').trim()) keep.categories=alt.categories;
    if(!String(keep.image||'').trim()) keep.image=alt.image;
    if(!String(keep.gallery||'').trim()) keep.gallery=alt.gallery;
    if(!String(keep.description||'').trim()) keep.description=alt.description;
    if(!String(keep.promos||'').trim()) keep.promos=alt.promos;
    if(!(Number(keep.price||0)>0) && Number(alt.price||0)>0) keep.price=alt.price;
    if(!(Number(keep.cost||0)>0) && Number(alt.cost||0)>0) keep.cost=alt.cost;
    if(!(Number(keep.stock||0)>0) && Number(alt.stock||0)>0) keep.stock=alt.stock;
    const keepColors=productColorRows(keep);
    const altColors=productColorRows(alt);
    if(!keepColors.length && altColors.length){
      keep.colors=altColors;
      keep.stock=colorRowsTotal(altColors);
    }
    const keepDate=Date.parse(keep.updatedAt||'')||0;
    const altDate=Date.parse(alt.updatedAt||'')||0;
    if(altDate>keepDate) keep.updatedAt=alt.updatedAt;
    return normalizeProductColorStock(keep);
  }
  function sameProductIdentity(a,b){
    const aId=normalizedKeyPart(a?.id), bId=normalizedKeyPart(b?.id);
    if(aId && bId && aId===bId) return true;
    return productIdentityNameKey(a)===productIdentityNameKey(b);
  }
  function dedupeProducts(list=[]){
    const clean=[];
    (Array.isArray(list)?list:[]).forEach(raw=>{
      const p=normalizeProductColorStock(SDCStore.normalizeProduct(raw||{}));
      if(!isRealProduct(p)) return;
      const ix=clean.findIndex(x=>sameProductIdentity(x,p));
      if(ix<0){ clean.push(p); return; }
      const current=clean[ix];
      const keepCurrent=productScore(current)>=productScore(p);
      clean[ix]=keepCurrent ? mergeDuplicateProducts(current,p) : mergeDuplicateProducts(p,current);
    });
    return clean;
  }
  function productToFirebasePayload(product){
    const p=normalizeProductColorStock(SDCStore.normalizeProduct(product||{}));
    const rows=productColorRows(p);
    return {
      id:p.id,
      codigo:p.id,
      nombre:p.name,
      categoria:firstTag(p)||'General',
      categorias:categoryText(p)||'General',
      costo:Number(p.cost||0),
      precio:Number(p.price||0),
      img:p.image||'',
      image:p.image||'',
      imagen:p.image||'',
      galeria:p.gallery||'',
      gallery:p.gallery||'',
      descripcion:productDescription(p),
      variantes:rows.length?rows.map(r=>({nombre:r.name,stock:Math.max(0,Math.floor(Number(r.qty)||0)),img:''})):[{nombre:'General',stock:productStock(p),img:''}],
      colores:colorRowsText(rows.length?rows:[{name:'General',qty:productStock(p)}]),
      stock:productStock(p),
      stock_inicial:productStock(p),
      promos:p.promos||'',
      activo:p.active!==false,
      active:p.active!==false,
      updatedAt:new Date().toISOString()
    };
  }
  async function syncProductsFromFirebase(opts={}){
    const silent=!!opts.silent;
    try{
      if(!silent) toast('Conectando con Firebase...');
      await waitForFirebase();
      if(typeof window.cargarDesdeFirebase!=='function') throw new Error('No existe cargarDesdeFirebase().');
      const raw=await window.cargarDesdeFirebase();
      const localAssets=new Map((state.products||[]).map(p=>[String(p.id||'').trim().toLowerCase(), {
        image:String(p.image||'').trim(),
        gallery:String(p.gallery||'').trim(),
        colors:productColorRows(p)
      }]));
      const repairImages=[];
      let products=dedupeProducts((Array.isArray(raw)?raw:[]).map(normalizeFirebaseRemoteProduct).filter(isRealProduct).map(p=>{
        const key=String(p.id||'').trim().toLowerCase();
        const local=localAssets.get(key);
        if(local){
          const hadRemoteImage=!!String(p.image||'').trim();
          if(!hadRemoteImage && local.image){
            p.image=local.image;
            repairImages.push(p);
          }
          if(!String(p.gallery||'').trim() && local.gallery) p.gallery=local.gallery;
          if(!productColorRows(p).length && local.colors?.length){
            p.colors=local.colors;
            p.stock=colorRowsTotal(p.colors);
          }
        }
        return normalizeProductColorStock(p);
      }));
      const localProducts=Array.isArray(state.products)?state.products:[];
      const localById=new Map(localProducts.map(p=>[String(p.id||'').trim().toLowerCase(),p]));
      const pendingIds=new Set(pendingFirebaseList().map(x=>String(x?.id||x?.product?.id||'').trim().toLowerCase()).filter(Boolean));
      products=products.map(remote=>{
        const key=String(remote.id||'').trim().toLowerCase();
        const local=localById.get(key);
        if(!local) return remote;
        const localTime=Date.parse(local.updatedAt||'')||0;
        const remoteTime=Date.parse(remote.updatedAt||'')||0;
        if(pendingIds.has(key) || localTime>remoteTime) return normalizeProductColorStock({...local});
        return remote;
      });
      localProducts.forEach(local=>{
        const key=String(local.id||'').trim().toLowerCase();
        if(!key) return;
        if(pendingIds.has(key) && !products.some(p=>String(p.id||'').trim().toLowerCase()===key)){
          products.push(normalizeProductColorStock({...local}));
        }
      });
      if(products.length){
        state.products=products;
        state.settings.lastFirebaseSync=new Date().toISOString();
        save();
        if(repairImages.length){
          setTimeout(()=>repairImages.slice(0,20).forEach(prod=>saveProductToFirebase(prod,prod.id).catch(err=>console.warn('No se pudo reparar foto en Firebase:',err))),300);
        }
        if(!silent){render(); toast(`${products.length} productos sincronizados desde Firebase.`)}
        return true;
      }
      if(!silent) toast('Firebase está conectado, pero no encontré productos activos.');
      return false;
    }catch(err){
      if(!silent) toast('No se pudo sincronizar Firebase: '+(err.message||err));
      return false;
    }
  }
  async function syncProductsFromSheets(opts={}){return syncProductsFromFirebase(opts)}
  async function syncLocal(){
    hydrateState();
    const ok=await syncProductsFromFirebase({silent:false});
    if(ok) return;
    state=SDCStore.load(); hydrateState(); state.unlocked=true; save(); applyAppearance(); render(); toast('Sincronizado con los datos guardados en este dispositivo.');
  }
  async function saveProductToFirebase(product, previousId=''){
    await waitForFirebase();
    const payload=productToFirebasePayload(product);
    if(typeof window.guardarProductoFirebase==='function') return await window.guardarProductoFirebase(payload, previousId||payload.id);
    if(previousId && typeof window.actualizarFirebase==='function'){
      await window.actualizarFirebase(previousId, payload);
      return previousId;
    }
    if(typeof window.guardarNuevoFirebase==='function'){
      return await window.guardarNuevoFirebase(payload.nombre,payload.categoria,payload.costo,payload.precio,payload.img,payload.variantes,payload.promos);
    }
    throw new Error('No encontré funciones de guardado Firebase.');
  }
  function firebaseErrorMessage(err){
    const raw=String(err && err.message ? err.message : err || '').trim();
    const low=raw.toLowerCase();
    if(low.includes('permission') || low.includes('insufficient')) return 'Firebase rechazó el guardado por permisos/reglas.';
    if(low.includes('network') || low.includes('failed to fetch') || low.includes('offline')) return 'Sin conexión estable con Firebase.';
    if(low.includes('terminó de cargar') || low.includes('no terminó')) return 'Firebase no terminó de cargar. Revisa internet o bloqueadores.';
    return raw || 'Firebase no respondió.';
  }
  function pendingFirebaseList(){
    hydrateState();
    state.settings.pendingFirebaseProducts=Array.isArray(state.settings.pendingFirebaseProducts)?state.settings.pendingFirebaseProducts:[];
    return state.settings.pendingFirebaseProducts;
  }
  function queueFirebaseProduct(product, previousId=''){
    const list=pendingFirebaseList();
    const id=String(product?.id || previousId || '').trim();
    const clean=SDCStore.clone(product||{});
    const next=list.filter(x=>String(x?.id||'')!==id);
    next.push({id, previousId:previousId||id, product:clean, queuedAt:new Date().toISOString()});
    state.settings.pendingFirebaseProducts=next.slice(-250);
    save();
    return state.settings.pendingFirebaseProducts.length;
  }
  async function flushPendingFirebaseProducts(silent=false){
    const list=[...pendingFirebaseList()];
    if(!list.length) return true;
    const remaining=[];
    let ok=0;
    if(!silent) toast(`Enviando ${list.length} pendiente${list.length===1?'':'s'} a Firebase...`);
    for(const item of list){
      try{
        await saveProductToFirebase(item.product,item.previousId||item.id);
        ok++;
      }catch(err){
        remaining.push({...item,error:firebaseErrorMessage(err),lastTry:new Date().toISOString()});
      }
    }
    state.settings.pendingFirebaseProducts=remaining;
    if(ok) state.settings.lastFirebaseSync=new Date().toISOString();
    save();
    if(!silent){
      if(remaining.length) toast(`Firebase pendiente: ${remaining.length}. Guardado local sigue seguro.`);
      else toast(`✅ Pendientes enviados a Firebase (${ok}).`);
    }
    return !remaining.length;
  }
  async function archiveProductInFirebase(productId){
    if(!productId) return false;
    await waitForFirebase();
    if(typeof window.ocultarProductoFirebase==='function') return await window.ocultarProductoFirebase(productId);
    if(typeof window.actualizarFirebase==='function'){
      await window.actualizarFirebase(productId,{activo:false,active:false,actualizadoEn:new Date().toISOString()});
      return true;
    }
    return false;
  }
  async function syncStockAfterSale(ids){
    await waitForFirebase().catch(()=>null);
    if(typeof window.actualizarStockFirebase!=='function') return false;
    const list=Array.from(ids||[]).map(id=>productById(id)).filter(Boolean);
    for(const p of list){
      await window.actualizarStockFirebase(p.id, productToFirebasePayload(p));
    }
    state.settings.lastFirebaseSync=new Date().toISOString();
    save();
    return !!list.length;
  }
  async function uploadLocalProductsToFirebase(){
    hydrateState();
    await flushPendingFirebaseProducts(true).catch(()=>false);
    const products=(state.products||[]).filter(isRealProduct).filter(isActiveProduct);
    if(!products.length) return toast('No hay productos locales activos para subir.');
    const ok=[];
    const fail=[];
    toast(`Subiendo ${products.length} productos a Firebase...`);
    for(let i=0;i<products.length;i++){
      const p=products[i];
      try{
        await saveProductToFirebase(p,p.id);
        ok.push(p.id);
        if(i===0 || (i+1)%5===0 || i===products.length-1) toast(`Firebase: ${i+1}/${products.length} productos procesados...`);
      }catch(err){
        console.warn('No se pudo subir producto a Firebase',p,err);
        fail.push({id:p.id,name:p.name,error:err&&err.message||String(err)});
      }
    }
    if(ok.length){
      state.settings.lastFirebaseSync=new Date().toISOString();
      save();
    }
    if(fail.length){
      const detail=fail.slice(0,5).map(x=>`${x.id||''} ${x.name||''}: ${x.error}`).join('\n');
      alert(`Se subieron ${ok.length}/${products.length} productos. Fallaron ${fail.length}.\n\nPrimeros errores:\n${detail}`);
      toast(`Firebase: ${ok.length}/${products.length} subidos; ${fail.length} con error.`);
    }else{
      render();
      toast(`✅ Inventario completo subido a Firebase (${ok.length}).`);
    }
  }
  async function uploadLocalProductsToSheets(){return uploadLocalProductsToFirebase()}
  async function saveDocumentToFirebase(doc, kind){
    await waitForFirebase().catch(()=>null);
    const isSale=kind==='sale' || doc?.kind==='receipt';
    const record=documentToSheetRecord(doc,isSale?'sale':'quote');
    if(isSale && typeof window.registrarVentaFirebase==='function'){
      await window.registrarVentaFirebase({ ...record, documento:SDCStore.clone(doc||{}), tipo:'venta', fecha:doc?.date||new Date().toISOString() });
      return true;
    }
    if(!isSale && typeof window.respaldarDatosFirebase==='function'){
      await window.respaldarDatosFirebase({ ultimaCotizacion:record, documento:SDCStore.clone(doc||{}) });
      return true;
    }
    return false;
  }
  function bootFirebaseSync(){
    if(!state.unlocked || state.settings.autoFirebaseSync===false) return;
    const key='sdc_firebase_sync_boot';
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key,'1');
    setTimeout(()=>syncProductsFromFirebase({silent:true}),650);
  }
  function bootSheetSync(){return bootFirebaseSync()}
  function doctorRowsHTML(rows){
    return rows.map(r=>`<div class="cart-row sheets-doctor-row-v85 ${r.ok?'ok':'bad'}"><div><b>${r.ok?'✅':'⚠️'} ${escapeHtml(r.title)}</b><br><span>${escapeHtml(r.copy||'')}</span></div></div>`).join('');
  }
  async function openSheetsDoctor(){
    const rows=[];
    const draw=(extra='')=>{
      const body=$('#sheetsDoctorBody',modalRoot);
      if(body) body.innerHTML=`${doctorRowsHTML(rows)}${extra}`;
    };
    openModal(`<div class="modal-head"><h3>Diagnóstico Firebase</h3><button class="close">×</button></div><div class="modal-body sheets-doctor-v87"><div class="card-box"><b>Revisión de conexión</b><span>Comprueba si la app puede leer productos desde Firebase y guardar cambios en la nube.</span></div><div id="sheetsDoctorBody" class="cart-list"><div class="empty-state">Probando Firebase...</div></div><div class="modal-actions sheets-doctor-actions-v87" style="position:static"><button class="btn secondary" id="doctorSyncNow">Bajar desde Firebase</button><button class="btn" id="doctorUploadNow">Subir inventario local</button></div></div>`,true);
    const add=(ok,title,copy)=>{rows.push({ok,title,copy}); draw('<div class="empty-state">Sigo probando...</div>');};
    try{
      await waitForFirebase();
      add(true,'Firebase cargó correctamente',window.SDC_FIREBASE?.projectId?`Proyecto: ${window.SDC_FIREBASE.projectId}`:'Módulo listo.');
      const raw=typeof window.cargarDesdeFirebase==='function'?await window.cargarDesdeFirebase():[];
      add(Array.isArray(raw),'Lectura de productos',Array.isArray(raw)?`${raw.length} productos leídos desde Firebase.`:'No devolvió una lista válida.');
      draw('');
    }catch(err){
      add(false,'Firebase no respondió',String(err&&err.message||err));
      draw('<div class="empty-state">Revisa internet, reglas de Firestore o el archivo js/sdc-firebase.js.</div>');
    }
    const sync=$('#doctorSyncNow',modalRoot);
    if(sync) sync.onclick=()=>syncProductsFromFirebase({silent:false});
    const upload=$('#doctorUploadNow',modalRoot);
    if(upload) upload.onclick=()=>uploadLocalProductsToFirebase();
  }

  function sheetBool(value){return !(value===false || ['false','falso','0','no','inactivo','oculto','borrado','eliminado'].includes(String(value).trim().toLowerCase()))}
  function productToSheetRecord(product, previousId=''){
    const code=String(product?.id || product?.codigo || previousId || nextCode()).trim();
    const normalized=normalizeProductColorStock(SDCStore.normalizeProduct({...product,id:code,codigo:code}));
    const rows=productColorRows(normalized);
    const record={
      codigo: code,
      nombre: normalized.name || product?.nombre || 'Producto sin nombre',
      categoria: normalized.categories || product?.categoria || 'General',
      marca: normalized.brand || product?.marca || '',
      precio: Number(normalized.price||0),
      costo: Number(normalized.cost||0),
      stock: productStock(normalized),
      colores: colorRowsText(rows),
      imagen: normalized.image || '',
      galeria: normalized.gallery || '',
      descripcion: normalized.description || '',
      promos: normalized.promos || '',
      activo: sheetBool(normalized.active),
      updatedAt: new Date().toISOString(),
      json: {...normalized, codigo:code, colores:colorRowsText(rows), colors:rows, fuente:'sdc-pos-v94'}
    };
    return record;
  }
  async function saveProductToSheets(product, previousId=''){
    if(!getSheetApiUrl()) return false;
    const originalCode=String(previousId || product?.id || product?.codigo || '').trim();
    const record=productToSheetRecord(product, originalCode);
    const attempts=[
      {action:'upsertProduct',codigo:record.codigo,previousCodigo:originalCode,product:record},
      {action:'saveProduct',codigo:record.codigo,previousCodigo:originalCode,product:record},
      {action:'updateProduct',codigo:record.codigo,previousCodigo:originalCode,product:record}
    ];
    let lastErr=null;
    for(const payload of attempts){
      try{
        const result=await sheetPost(payload,{verifyProductCode:record.codigo,timeout:26000});
        return result || true;
      }catch(err){
        lastErr=err;
        console.warn('Intento de guardado en Sheets falló:', payload.action, err);
      }
    }
    throw lastErr || new Error('No se pudo guardar en Google Sheets.');
  }
  async function archiveProductInSheets(productId){
    if(!getSheetApiUrl()) return false;
    await sheetPost({action:'setActive',codigo:productId,activo:false});
    return true;
  }
  async function updateProductStockInSheets(productId, stock){
    if(!getSheetApiUrl()) return false;
    const p=productById(productId);
    const rows=p?productColorRows(p):[];
    await sheetPost({action:'updateStock',codigo:productId,stock:Math.max(0,Number(stock)||0),colores:colorRowsText(rows)});
    return true;
  }
  async function syncStockAfterSale(ids){
    if(!getSheetApiUrl()) return false;
    const items=Array.from(ids||[]).map(id=>{
      const p=productById(id);
      return p?{codigo:p.id,stock:productStock(p),colores:colorRowsText(productColorRows(p))}:null;
    }).filter(Boolean);
    if(!items.length) return false;
    await sheetPost({action:'batchUpdateStock',items});
    return true;
  }
  function docItemsForSheet(doc){
    return (doc.items||[]).map(it=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      return {
        codigo: it.id || '',
        nombre: it.name || '',
        cantidad: qty,
        color: selectedColorLabel(it),
        precio_unitario: Math.round(total/qty),
        total: total
      };
    });
  }
  function documentToSheetRecord(doc, kind){
    const isSale=kind==='sale' || doc.kind==='receipt';
    const c=calc(doc);
    const items=docItemsForSheet(doc);
    const common={
      fecha: doc.date || new Date().toISOString(),
      cliente: doc.client || '',
      telefono: doc.phone || '',
      estado: doc.status || (isSale?'Confirmada':'Cotizado'),
      observaciones: [doc.reference||'', shippingNote(doc)||''].filter(Boolean).join(' | '),
      productos_json: JSON.stringify(items),
      subtotal: c.products,
      descuento: c.discount,
      envio: c.shipping,
      comision: c.commission,
      total: c.total,
      json: {...SDCStore.clone(doc||{}), productos:items, calculo:c, fuente:'sdc-pos-v94'}
    };
    if(isSale){
      return {
        venta_id: doc.id || `VENTA-${Date.now()}`,
        departamento: doc.department || '',
        municipio: doc.municipality || '',
        direccion: doc.reference || '',
        tipo_entrega: shippingKey(doc),
        metodo_pago: shippingLabel(doc),
        ...common
      };
    }
    return {
      cotizacion_id: doc.id || `COT-${Date.now()}`,
      ...common
    };
  }
  async function saveDocumentToSheets(doc, kind){
    if(!getSheetApiUrl()) return false;
    const isSale=kind==='sale' || doc.kind==='receipt';
    const record=documentToSheetRecord(doc, isSale?'sale':'quote');
    if(isSale){
      await sheetPost({action:'saveSale',documentType:'sale',type:'sale',sale:record,document:record});
    }else{
      await sheetPost({action:'saveQuote',documentType:'cotizacion',type:'cotizacion',quote:record,document:record});
    }
    return true;
  }
  function currentAppearance(){
    return 'normal';
  }
  function applyAppearance(){
    state.settings.appearance='normal';
    document.body.classList.remove('pro-mode','pro-white-mode','gamer-mode');
    document.body.classList.toggle('turbo-mode',false);
    document.body.classList.toggle('capture-clean',!!state.settings.captureClean);
    document.body.classList.toggle('money-locked',!!state.settings.moneyLocked);
  }
  function setAppearance(){
    state.settings.appearance='normal';
    save();
    applyAppearance();
    render();
  }
  function setShellMode(mode){
    const isLogin = mode === 'login';
    document.body.classList.toggle('sdc-login-mode', isLogin);
    document.body.classList.toggle('sdc-panel-mode', !isLogin);
    const goTop = $('#goTop');
    if(goTop) goTop.style.display = 'none';
  }


  function currentPageV150(){
    const allowed=new Set(['inicio','panel','productos']);
    const p=state.settings.pageV150||localStorage.getItem('sdc_v150_page')||'inicio';
    return allowed.has(p)?p:'inicio';
  }
  function setPageV150(page){
    const allowed=new Set(['inicio','panel','productos']);
    const clean=allowed.has(page)?page:'inicio';
    state.settings.pageV150=clean;
    try{
      localStorage.setItem('sdc_v150_page',clean);
      localStorage.setItem('sdc_v97_page',clean==='panel'?'inicio':clean);
    }catch(e){}
    save();
    render();
    requestAnimationFrame(()=>{
      document.querySelector('.sdc-tabs-v150')?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }
  window.SDCSetPageV150=setPageV150;
  function pageTabsV150(){
    const p=currentPageV150();
    return `<nav class="sdc-tabs-v150 sdc-tabs-v178 no-print" aria-label="Secciones principales">
      <button type="button" class="${p==='inicio'?'active':''}" data-action="tabInicio"><i aria-hidden="true">⌂</i><b>Inicio</b></button>
      <button type="button" class="${p==='panel'?'active':''}" data-action="tabPanel"><i aria-hidden="true">▦</i><b>Panel</b></button>
      <button type="button" class="${p==='productos'?'active':''}" data-action="tabProductos"><i aria-hidden="true">▣</i><b>Productos</b></button>
    </nav>`;
  }
    function panelHTML(){
    const st=stats();
    const current=state.settings.panelCatV150||'Todos';
    const cats=allCategories();
    const rows=activeProducts().filter(p=>{
      if(current==='Todos') return true;
      return productTags(p).some(t=>String(t).toLowerCase()===String(current).toLowerCase());
    }).map(p=>{
      const stock=productStock(p);
      const cost=Number(p.cost||0);
      const price=Number(p.price||0);
      const gain=price-cost;
      const total=gain*stock;
      return {p,stock,cost,price,gain,total};
    }).sort((a,b)=>b.total-a.total);
    const panelStats=[
      ['Productos',num(rows.length)],
      ['Unidades',num(rows.reduce((a,r)=>a+r.stock,0))],
      ['Venta inventario',money(rows.reduce((a,r)=>a+r.price*r.stock,0))],
      ['Invertido',moneyPrivate(rows.reduce((a,r)=>a+r.cost*r.stock,0))],
      ['Ganancia estimada',moneyPrivate(rows.reduce((a,r)=>a+r.total,0))]
    ];
    const tableRows=rows.map(r=>`<tr>
      <td><b>${escapeHtml(r.p.name)}</b><small>${escapeHtml(firstTag(r.p)||'General')} · ${escapeHtml(r.p.id||'')}</small></td>
      <td>${moneyPrivate(r.cost)}</td>
      <td>${money(r.price)}</td>
      <td class="${r.gain>0?'ok':'bad'}">${moneyPrivate(r.gain)}</td>
      <td>${num(r.stock)}</td>
      <td class="${r.total>0?'ok':'bad'}">${moneyPrivate(r.total)}</td>
    </tr>`).join('') || `<tr><td colspan="6">Sin productos en esta categoría.</td></tr>`;
    return `<section class="panel-v150">
      <div class="panel-head-v150 panel-head-clean-v184">
        <label><span>Categoría</span><select id="panelCategorySelectV150">${cats.map(c=>`<option value="${escapeHtml(c)}" ${c===current?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select></label>
      </div>
      <div class="panel-stats-v150">${panelStats.map(([a,b])=>`<article><b>${b}</b><span>${a}</span></article>`).join('')}</div>
      <div class="panel-table-wrap-v150">
        <table class="panel-table-v150"><thead><tr><th>Producto</th><th>Costo unidad</th><th>Precio venta</th><th>Ganancia unidad</th><th>Stock</th><th>Ganancia total</th></tr></thead><tbody>${tableRows}</tbody></table>
      </div>
    </section>`;
  }

  function bindPanelCategoryV150(){
    const select=$('#panelCategorySelectV150');
    if(!select || select.dataset.bound==='1') return;
    select.dataset.bound='1';
    select.addEventListener('change',e=>{
      state.settings.panelCatV150=e.target.value || 'Todos';
      save();
      render();
    });
  }

  function render(){
    applyAppearance();
    if(!state.unlocked){setShellMode('login');renderLogin();return}
    setShellMode('panel');
    const page=currentPageV150();
    document.body.dataset.sdcPageV150=page;
    app.className='app';
    app.innerHTML = `${topbar()}${pageTabsV150()}${hero()}${panelHTML()}${inventoryHTML()}${pageFooter()}`;
    bindMain();
    // V25: conectar controles de cantidad en la vista Cliente desde la primera carga del catálogo.
    bindProductCards();
  }
  function renderLogin(){
    setShellMode('login');
    app.className='login-wrap';
    app.innerHTML=`<section class="login-card">
      <img class="login-logo" src="${LOGO_SRC}" alt="Logo SD Comayagua">
      <h1 class="login-title">SDC VENTAS</h1>
      <div class="pill login-pill"><span class="dot"></span> Acceso administrativo</div>
      <div class="form-box">
        <label class="label" for="keyInput">Clave de acceso</label>
        <input id="keyInput" class="input" type="password" inputmode="numeric" placeholder="Ingresa tu clave" autocomplete="current-password">
        <button id="loginBtn" class="btn full" style="margin-top:14px">Entrar al panel</button>
      </div>
    </section>`;
    $('#loginBtn').onclick=unlock; $('#keyInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
  }
  function unlock(){ if($('#keyInput').value.trim()===(state.settings.accessKey||'199311')){state.unlocked=true;save();render();bootFirebaseSync();toast('Acceso autorizado.')} else toast('Clave incorrecta.'); }
  function topbar(){
    const lastSync=lastSyncLabel();
    return `<header class="sdc-top-v178 no-print" role="banner">
      <section class="sdc-hero-v178 sdc-hero-v235" aria-label="SD Comayagua">
        <div class="sdc-brand-v178 sdc-brand-v235">
          <div class="sdc-logo-v178 sdc-logo-v235"><img src="${LOGO_SRC}" alt="SD Comayagua"></div>
          <div class="sdc-brand-text-v178 sdc-brand-text-v235">
            <small>Panel privado</small>
            <h1>SD COMAYAGUA</h1>
            <p>Catálogo · Ventas · Cotizaciones · Inventario</p>
          </div>
        </div>
        <div class="sdc-hero-tools-v178 sdc-hero-tools-v235">
          <button class="sdc-mini-menu-v178" type="button" data-sdc127="open" aria-label="Abrir menú"><span class="sdc-lines-v178" aria-hidden="true"></span><b>Menú</b></button>
          <button class="sdc-mini-sync-v178" type="button" data-action="sync" title="Sincronizar desde Firebase (${escapeHtml(lastSync)})" aria-label="Actualizar Firebase"><span aria-hidden="true">↻</span><b>Firebase</b></button>
        </div>
        <div class="sdc-status-v178 sdc-status-v235"><span>Activo</span><b>${nowHNPanel()}</b></div>
      </section>
    </header>`
  }
    function hero(){
    const st=stats();
    const m=alertMetrics();
    const salesToday=(state.sales||[]).filter(x=>isTodayISO(x.date));
    const todayTotal=salesToday.reduce((a,x)=>a+calc(x).total,0);
    const lastSales=(state.sales||[]).slice(0,3);
    const lowLimit=Number(state.settings.lowStockLimit||3);
    const lowItems=activeProducts().filter(p=>productStock(p)>0 && productStock(p)<=lowLimit).slice(0,3);
    const recentHTML=lastSales.length?lastSales.map(x=>`<article><b>${escapeHtml(x.client||'Cliente')}</b><span>${money(calc(x).total)} · ${new Date(x.date||Date.now()).toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})}</span></article>`).join(''):'<article class="empty"><b>Sin recibos aún</b><span>Cuando vendas, aparecerán aquí.</span></article>';
    const lowHTML=lowItems.length?lowItems.map(p=>`<article><b>${escapeHtml(p.name)}</b><span>${num(productStock(p))} unidades · ${escapeHtml(firstTag(p)||'Producto')}</span></article>`).join(''):'<article class="empty"><b>Stock estable</b><span>No hay urgencias principales.</span></article>';
    const valueLabel=moneyPrivate(st.value);
    const profitLabel=moneyPrivate(st.profit);
    return `<section class="hero v51-hero hero-v56-clean home-hero-v87 home-hero-v94 sdc209-home" id="inicio">
      <div class="sdc209-dashboard">
        <section class="sdc209-welcome">
          <div>
            <small>Panel privado</small>
            <h2>Ventas y control</h2>
            <p>Cotiza, vende y revisa stock rápido desde tu celular o computadora.</p>
          </div>
          <button type="button" data-action="sync"><span>↻</span><b>${escapeHtml(lastSyncLabel())}</b></button>
        </section>

        <section class="sdc209-main-actions no-print" aria-label="Acciones principales">
          <button type="button" class="primary" data-action="sell"><i>⚡</i><b>Nueva venta</b><span>Factura real</span></button>
          <button type="button" data-action="quote"><i>🧾</i><b>Cotizar</b><span>Enviar cliente</span></button>
          <button type="button" data-action="tabProductos"><i>▦</i><b>Catálogo</b><span>Ver productos</span></button>
          <button type="button" data-action="categoriesSheet"><i>🧩</i><b>Categorías</b><span>Imagen cliente</span></button>
        </section>

        <section class="sdc209-kpis" aria-label="Resumen general">
          <article><span>Ventas hoy</span><b>${money(todayTotal)}</b><small>${num(salesToday.length)} recibos</small></article>
          <article><span>Productos</span><b>${num(st.count)}</b><small>${num(st.stock)} unidades</small></article>
          <article><span>Venta total</span><b>${valueLabel}</b><small>Inventario</small></article>
          <article><span>Ganancia</span><b>${profitLabel}</b><small>Estimado</small></article>
        </section>

        <section class="sdc209-alert-strip no-print">
          <button type="button" data-action="lowStock"><b>${num(m.low)}</b><span>Bajo stock</span></button>
          <button type="button" data-action="outStock"><b>${num(m.out)}</b><span>Agotados</span></button>
          <button type="button" data-action="noImage"><b>${num(m.noImage)}</b><span>Sin imagen</span></button>
          <button type="button" data-action="profit"><b>↗</b><span>Ganancias</span></button>
        </section>

        <section class="sdc209-mini-panels">
          <div class="sdc209-mini-card"><header><b>Últimos recibos</b><button data-action="receipts">Ver caja</button></header>${recentHTML}</div>
          <div class="sdc209-mini-card"><header><b>Reponer pronto</b><button data-action="lowStock">Ver</button></header>${lowHTML}</div>
        </section>
      </div>
    </section>`
  }

  function stats(){const base=activeProducts(); let count=base.length,stock=0,value=0,invested=0; base.forEach(p=>{const st=productStock(p); stock+=st; value+=st*(+p.price||0); invested+=st*(+p.cost||0)}); return {count,stock,value,invested,profit:value-invested}}
  function lastSyncLabel(){
    const d=state.settings.lastFirebaseSync?new Date(state.settings.lastFirebaseSync):null;
    if(!d || Number.isNaN(d.getTime())) return 'Firebase listo';
    return 'Firebase '+d.toLocaleTimeString('es-HN',{hour:'2-digit',minute:'2-digit'});
  }
  function inventoryLayout(){return state.settings.inventoryLayout==='one'?'one':'two'}
  function setInventoryLayout(layout){state.settings.inventoryLayout=layout==='one'?'one':'two'; save(); renderInventoryOnly(); toast(layout==='one'?'Vista de productos a 1 columna.':'Vista de productos a 2 columnas.');}
  function gridClass(){return inventoryLayout()==='one'?'grid one-col':'grid two-col'}
  function inventoryControls(){const layout=inventoryLayout(); return `<div class="section-tools no-print"><div class="layout-toggle" aria-label="Vista de productos"><button class="${layout==='one'?'active':''}" data-action="layoutOne" type="button">Grande</button><button class="${layout==='two'?'active':''}" data-action="layoutTwo" type="button">Compacta</button></div></div>`}
  function sheetsButtonHTML(){
    return `<span class="btn small ghost sheets-head-btn firebase-head-btn" title="Firebase conectado" aria-label="Firebase conectado"><span class="firebase-dot" aria-hidden="true"></span><span>Firebase</span></span>`;
  }
  function inventoryCategoryOptionsHTML(){
    const current=filter.cat||'Todos';
    return allCategories().map(c=>`<option value="${escapeHtml(c)}" ${current===c?'selected':''}>${escapeHtml(c==='Todos'?'Categorías':c)}</option>`).join('');
  }

  function categoryQuickRailHTML(){
    const cats=allCategories();
    const current=filter.cat||'Todos';
    const label=current==='Todos'?'Todas las categorías':current;
    const activeCount=categoryCount(current);
    const totalCats=Math.max(0,cats.length-1);
    return `<section class="category-selector-v195 category-selector-v235 no-print" aria-label="Categorías del catálogo">
      <div class="category-primary-v235">
        <button type="button" class="category-open-v195 category-open-v235" data-action="categoriesSheet"><i aria-hidden="true">▦</i><span>Categorías</span></button>
        <div class="category-current-v195 category-current-v235"><b>${escapeHtml(label)}</b><small>${num(activeCount)} productos · ${num(totalCats)} categorías</small></div>
      </div>
      <div class="category-mini-actions-v198 category-mini-actions-v235">
        <button type="button" class="category-mini-btn-v198" data-action="categoryGoList">Ver productos</button>
        <button type="button" class="category-mini-btn-v198" data-action="categoryPrint">Imprimir</button>
        <button type="button" class="category-mini-btn-v198 secondary" data-action="categoryCapture">Vista cliente</button>
      </div>
    </section>`;
  }
  function inventoryHeadHTML(count,list=null){
    const visibleList=Array.isArray(list)?list:filteredProducts();
    const catLabel=filter.cat&&filter.cat!=='Todos'?filter.cat:'catálogo';
    const st=stats();
    const visibleUnits=visibleList.reduce((a,p)=>a+productStock(p),0);
    const visibleOut=visibleList.filter(p=>productStock(p)<=0).length;
    const visibleLow=visibleList.filter(p=>productStock(p)>0 && productStock(p)<=Number(state.settings.lowStockLimit||3)).length;
    const visibleOk=Math.max(0,visibleList.length-visibleOut);
    const mode=cardView();
    const sync=lastSyncLabel();
    return `<div class="products-screen-v178 products-screen-v189 products-screen-v190">
      <section class="catalog-cover-v178 catalog-cover-v189" aria-label="Catálogo digital">
        <div class="catalog-cover-title-v178 catalog-cover-title-v189">
          <span class="catalog-chip-v178 catalog-chip-v189">Catálogo digital</span>
          <h2>Productos</h2>
          <p>Busca rápido, revisa stock y abre cada producto con un toque.</p>
        </div>
        <div class="catalog-mini-summary-v195" aria-label="Resumen de catálogo">
          <article class="mini-stat-v195 mini-results-v195"><span>Resultados</span><b class="count-pill">${count}</b><small>visibles</small></article>
          <article class="mini-stat-v195 metric-units-v189"><span>Unidades</span><b>${num(visibleUnits)}</b><small>actuales</small></article>
          <button type="button" class="mini-cloud-v195 cloud-pill-v189" data-action="sync" title="${escapeHtml(sync)}"><i aria-hidden="true"></i><span>Nube</span><b>Firebase</b><small>${escapeHtml(sync)}</small></button>
        </div>
        <button type="button" class="mobile-category-cta-v238 mobile-category-cta-v240 no-print" data-action="categoriesSheet" aria-label="Buscar por categoría">
          <span class="mobile-category-icon-v240" aria-hidden="true">▦</span>
          <span class="mobile-category-label-v240">CATEGORÍAS</span>
          <span class="mobile-category-arrow-v240" aria-hidden="true">›</span>
        </button>
        ${categoryQuickRailHTML()}
      </section>
      <section class="catalog-control-v178 catalog-control-v189 no-print" aria-label="Herramientas de productos">
        <label class="catalog-search-v178 catalog-search-v189" for="inventorySearchInput"><i aria-hidden="true">⌕</i><input id="inventorySearchInput" data-product-search="1" placeholder="Buscar producto, código o categoría..." value="${escapeHtml(filter.q)}" autocomplete="off" inputmode="search"></label>
        <div class="catalog-filter-row-v178 catalog-filter-row-v189 catalog-filter-row-v235">
          <button class="catalog-categories-v235" data-action="categoriesSheet" type="button"><span>▦</span><b>Categorías</b></button>
          <label class="catalog-category-v178 catalog-category-v189" for="inventoryCategorySelect"><span aria-hidden="true">▦</span><select id="inventoryCategorySelect" aria-label="Filtrar por categoría">${inventoryCategoryOptionsHTML()}</select><b aria-hidden="true">⌄</b></label>
          <button class="catalog-add-v178 catalog-add-v189" data-action="newProduct" type="button"><span>+</span><b>Producto</b></button>
        </div>
        <div class="catalog-insights-v190" aria-label="Estado rápido del catálogo">
          <button type="button" data-action="categoryGoList"><span>Disponibles</span><b>${num(visibleOk)}</b></button>
          <button type="button" data-action="lowStock"><span>Bajo stock</span><b>${num(visibleLow)}</b></button>
          <button type="button" data-action="outStock"><span>Agotados</span><b>${num(visibleOut)}</b></button>
        </div>
        <div class="catalog-view-row-v189" aria-label="Modo de vista">
          <button type="button" class="${mode==='admin'?'active':''}" data-action="cardAdmin"><span>Admin</span><small>Costos</small></button>
          <button type="button" class="${mode==='client'?'active':''}" data-action="cardClient"><span>Cliente</span><small>Venta</small></button>
          <button type="button" class="${state.settings.captureClean?'active':''}" data-action="captureClean"><span>Captura</span><small>Limpia</small></button>
        </div>
        <div class="catalog-utility-row-v178 catalog-utility-row-v189">
          <button class="catalog-tool-v178 catalog-tool-v189" data-action="categoryCapture" type="button" title="Crear imagen limpia para cliente"><span aria-hidden="true">▣</span><b>Captura ${escapeHtml(catLabel)}</b></button>
          <button class="catalog-tool-v178 catalog-tool-v189" data-action="categoryPrint" type="button" title="Vista imprimible por categoría"><span aria-hidden="true">▤</span><b>Imprimir</b></button>
        </div>
      </section>
    </div>`
  }

    function inventoryGridHTML(list){
    if(!list.length) return `<div class="empty-state">Sin productos para mostrar.</div>`;
    const out=list.filter(p=>productStock(p)<=0);
    const available=list.filter(p=>productStock(p)>0);
    const availableHTML=`<div class="${gridClass()}">${available.map(productCard).join('')}</div>`;
    if(!out.length) return availableHTML;
    return `${availableHTML}<section class="stockout-zone-v180"><div class="stockout-head-v180"><div><span>Inventario agotado</span><h3>Menos visible para no confundir</h3></div><b>${num(out.length)}</b></div><div class="${gridClass()} stockout-grid-v180">${out.map(productCard).join('')}</div></section>`;
  }
  function cardView(){return state.settings.cardView==='client'?'client':'admin'}
  function setCardView(view){state.settings.cardView=view==='client'?'client':'admin'; save(); render(); toast(state.settings.cardView==='client'?'Vista cliente activada: se ocultan costos y ganancias.':'Vista admin activada: inversión y ganancias visibles.');}
  function clientQty(id){const map=state.settings.clientQtyMap||{}; return Math.max(1,Number(map[id])||1)}
  function productDeliveryMode(id){
    state.settings.productDeliveryModeMap=state.settings.productDeliveryModeMap||{};
    const v=state.settings.productDeliveryModeMap[id];
    return v==='hn'?'hn':'local';
  }
  function setProductDeliveryMode(id,mode){
    state.settings.productDeliveryModeMap=state.settings.productDeliveryModeMap||{};
    state.settings.productDeliveryModeMap[id]=mode==='local'?'local':'hn';
    save();
    updateClientCardTotals(id);
  }
  function productLocalTotalQty(p,qty=1){return productItemsTotal(p,qty)}
  function setClientQty(id,qty){
    state.settings.clientQtyMap=state.settings.clientQtyMap||{};
    const clean=Math.max(1,Math.min(999,Number(qty)||1));
    if(id) state.settings.clientQtyMap[id]=clean;
    save();
    updateClientCardTotals(id);
  }
  function updateClientCardTotals(id){
    const p=productById(id); if(!p)return;
    const qty=clientQty(id);
    const mode=productDeliveryMode(id);
    const card=Array.from(document.querySelectorAll('article.product-card')).find(x=>x.dataset.id===id);
    if(!card)return;
    const inp=card.querySelector(`[data-cqty-input]`);
    if(inp && document.activeElement!==inp) inp.value=qty;
    const localTotal=productLocalTotalQty(p,qty), normalTotal=productNormalTotalQty(p,qty), codTotal=productCodTotalQty(p,qty);
    const set=(key,value)=>{const el=card.querySelector(`[data-client-total="${key}"]`); if(el) el.textContent=value;};
    set('qty', `${num(qty)} ${qty===1?'unidad':'unidades'}`);
    set('local', money(localTotal));
    set('normal', money(normalTotal));
    set('cod', money(codTotal));
    set('main', mode==='local'?money(localTotal):money(normalTotal));
    set('main-label', mode==='local'?'Comayagua · precio local':'Honduras · envío normal');
    card.dataset.deliveryMode=mode;
    card.querySelectorAll('[data-route-mode]').forEach(b=>b.classList.toggle('active',b.dataset.routeMode===mode));
    const panel=card.querySelector('[data-delivery-panel]');
    if(panel) panel.setAttribute('data-mode',mode);
    const offer=card.querySelector('[data-client-total="offer"]');
    if(offer){ const label=promoLabelForMode(p,qty,mode); offer.textContent=label?`🎁 ${label}`:''; offer.style.display=label?'block':'none'; }
  }
  function alertMetrics(){
    const products=activeProducts();
    const lowLimit=Number(state.settings.lowStockLimit||3);
    const lowStockProducts=products.filter(p=>productStock(p)>0 && productStock(p)<=lowLimit);
    const noCostProducts=products.filter(p=>Number(p.cost)<=0);
    const lowProfitProducts=products.filter(p=>{
      const price=Number(p.price||0), cost=Number(p.cost||0), gain=price-cost;
      return price>0 && cost>0 && gain>0 && gain<10;
    });
    const outStockProducts=products.filter(p=>productStock(p)<=0);
    const noImageProducts=products.filter(p=>!String(p.image||'').trim() && !String(p.gallery||'').trim());
    return {
      lowStockProducts,
      noCostProducts,
      lowProfitProducts,
      outStockProducts,
      noImageProducts,
      low:lowStockProducts.length,
      nocost:noCostProducts.length,
      lowMargin:lowProfitProducts.length,
      out:outStockProducts.length,
      noImage:noImageProducts.length,
      total:lowStockProducts.length+noCostProducts.length+lowProfitProducts.length+outStockProducts.length+noImageProducts.length
    };
  }

  function notificationBadgeHTML(){
    const n=alertMetrics().total;
    return n?`<em class="nav-alert-badge-v84" aria-label="${n} alertas">${n>99?'99+':n}</em>`:'';
  }

  function openNotifications(){
    const m=alertMetrics();
    const lowLimit=Number(state.settings.lowStockLimit||3);
    const products=activeProducts();
    const groups=[
      ['Bajo stock','Productos que conviene reponer pronto.',products.filter(p=>productStock(p)>0 && productStock(p)<=lowLimit),'lowStock'],
      ['Agotados','Productos que no deberían ofrecerse al cliente.',products.filter(p=>productStock(p)<=0),'outStock'],
      ['Sin imagen','Productos que necesitan foto o imagen automática.',products.filter(p=>!String(p.image||p.foto||p.img||'').trim()),'noImage'],
      ['Sin costo','Productos sin costo para calcular ganancia.',products.filter(p=>Number(p.cost)<=0),'noCost']
    ];
    const body=groups.map(([title,copy,list,act])=>{
      const rows=list.slice(0,6).map(p=>`<article class="sdc209-alert-row"><div><b>${escapeHtml(p.name)}</b><span>${num(productStock(p))} unidades · ${money(p.price)} · ${escapeHtml(firstTag(p)||'Producto')}</span></div><button type="button" data-action="${act}">Ver</button></article>`).join('') || `<article class="sdc209-alert-row empty"><div><b>Todo bien</b><span>No hay pendientes en esta sección.</span></div></article>`;
      return `<section class="sdc209-alert-box"><header><div><h4>${title}</h4><p>${copy}</p></div><strong>${num(list.length)}</strong></header>${rows}</section>`;
    }).join('');
    openModal(`<div class="modal-head sdc209-modal-head"><div><small>Centro de control</small><h3>Alertas inteligentes</h3></div><button class="close">×</button></div><div class="modal-body sdc209-alert-modal"><section class="sdc209-alert-total"><b>${num(m.total)}</b><span>alertas por revisar</span></section>${body}</div>`,true);
  }

  function quickPanel(){
    const m=alertMetrics();
    const st=stats();
    const activeTab=state.settings.homeToolsTab==='alerts'?'alerts':'options';
    const options=[
      ['cardClient','Vista','Cliente','👁️'],
      ['captureClean','Modo','Captura','📸'],
      ['catalog','Inicio','Catálogo','🏠'],
      ['categoriesSheet','Elegir','Categoría','🧩'],
      ['notifications','Centro','Alertas','🔔'],
      ['quickSale','Venta','Rápida','⚡'],
      ['quotes','Cotización','Guardadas','🧾'],
      ['clients','Agenda','Clientes','👥'],
      ['receipts','Ventas','Caja','💵'],
      ['profit','Utilidad','Ganancia','📈'],
      ['backup','Copia','Respaldo','💾'],
      ['lowStock','Alerta','Bajo stock','📦'],
      ['noCost','Revisar','Sin costo','🧮'],
      ['sync','Bajar','Nube','🔄'],
      ['uploadSheets','Subir','A Firebase','⬆️'],
      ['sheetsDoctor','Probar','Firebase','🧪']
    ];
    const optionButtons=options.map(([action,small,big,icon])=>`<button class="quick-btn quick-btn-v83" data-action="${action}"><i aria-hidden="true">${icon}</i><small>${small}</small><b>${big}</b></button>`).join('');
    const alerts=[
      ['📦',`${m.low} bajo stock`,'Productos que conviene reponer.','lowStock','Ver'],
      ['⛔',`${m.out} agotados`,'Activa reposición o archívalos.','outStock','Ver'],
      ['🧾',`${m.nocost} sin costo`,'Agrega costo para ganancia real.','noCost','Revisar'],
      ['📉',`${m.lowMargin} ganancia baja`,'Menos de Lps. 10 por unidad.','lowProfit','Detalle'],
      ['🖼️',`${m.noImage} sin imagen`,'Faltan fotos para vender mejor.','noImage','Ver'],
      ['💰',moneyPrivate(st.profit),'Ganancia estimada.','profit','Ver'],
      ['🔒',state.settings.moneyLocked?'Ganancias ocultas':'Ganancias visibles','Protege costos y utilidad.','moneyLock',state.settings.moneyLocked?'Mostrar':'Ocultar']
    ];
    const alertCards=alerts.map(([icon,title,copy,action,label])=>`<div class="alert-card alert-card-v72 alert-card-v83"><i>${icon}</i><div><b>${title}</b><span>${copy}</span></div><button class="btn small secondary" data-action="${action}">${label}</button></div>`).join('');
    return `<section class="quick no-print quick-v22 quick-private quick-panel quick-panel-v72 home-tools-v83">
      <div class="home-tools-head-v83">
        <div class="home-tools-title-v83 home-tools-title-v84"><div><b>Panel rápido</b><small>Desliza hacia la derecha para ver más sin llenar media pantalla.</small></div><span class="alert-total-v84 ${m.total?'has-alerts':''}">${m.total?`${m.total} alertas`:'Todo limpio'}</span></div>
        <div class="view-mode-buttons home-tools-tabs-v83" role="tablist" aria-label="Panel rápido">
          <button class="${activeTab==='options'?'active':''}" data-action="homeToolsOptions" type="button">Opciones</button>
          <button class="${activeTab==='alerts'?'active':''}" data-action="homeToolsAlerts" type="button">Notificaciones</button>
        </div>
      </div>
      <div class="home-tools-page-v83 ${activeTab==='options'?'active':''}" data-tools-page="options">
        <div class="quick-scroll-v83" aria-label="Opciones rápidas">${optionButtons}</div>
      </div>
      <div class="home-tools-page-v83 ${activeTab==='alerts'?'active':''}" data-tools-page="alerts">
        <div class="alert-scroll-v83" aria-label="Notificaciones del negocio">${alertCards}</div>
      </div>
    </section>`
  }


  function bestSellersFooter(){
    const map=new Map();
    (state.sales||[]).forEach(s=>{
      (s.items||[]).forEach(it=>{
        const id=it.id||it.name;
        const row=map.get(id)||{name:it.name||id,qty:0,total:0};
        const qty=Math.max(1,Number(it.qty)||1);
        row.qty+=qty; row.total+=itemTotal(it);
        map.set(id,row);
      });
    });
    const rows=Array.from(map.values()).sort((a,b)=>b.qty-a.qty||b.total-a.total).slice(0,3);
    if(!rows.length) return '<span class="footer-empty">Aún no hay ventas registradas.</span>';
    return rows.map((r,i)=>`<span><b>#${i+1}</b> ${escapeHtml(r.name)} <em>${num(r.qty)} vend.</em></span>`).join('');
  }

  function pageFooter(){
    return `<footer class="sdc-page-footer no-print footer-v54"><div class="footer-copy-v153"><span>© SD Comayagua · Todos los derechos reservados</span><b>Desarrollado por Gabriel Guerrero</b></div></footer>`
  }

  function cardModePanel(){
    const mode=cardView();
    const captureActive=!!state.settings.captureClean;
    if(captureActive){
      return `<section class="view-mode-panel no-print capture-helper-v72"><div class="view-mode-copy"><b>Captura activa</b><span>Vista limpia para mostrar productos.</span></div><div class="view-mode-buttons capture-active-buttons"><button data-action="categoryGoList">VER TODO</button><button class="active capture-live" data-action="captureClean">SALIR</button></div></section>`;
    }
    return `<section class="view-mode-panel no-print"><div class="view-mode-copy"><b>Vista</b></div><div class="view-mode-buttons"><button class="${mode==='admin'?'active':''}" data-action="cardAdmin">ADMIN</button><button class="${mode==='client'?'active':''}" data-action="cardClient">CLIENTE</button><button data-action="captureClean">CAPTURA</button></div></section>`
  }

  function searchPanel(){
    return `<section class="search-panel v10-search clean-search no-print" id="searchPanel"><div class="search-title"><b>Buscar producto</b><span>Nombre, código o categoría</span></div><div class="searchbar"><span class="icon">⌕</span><input id="searchInput" placeholder="Buscar producto..." value="${escapeHtml(filter.q)}" autocomplete="off" inputmode="search"></div></section>`}

  function categoryGallery(){
    const cats=allCategories();
    const current=filter.cat||'Todos';
    return `<section class="category-gallery no-print category-gallery-v66" id="categoriesBlock"><div class="category-head"><div><h2>Categorías</h2></div><span>${cats.length-1} categorías</span></div><div class="category-select-panel" aria-label="Selector de categorías"><label for="categorySelect"><span>Ver categoría</span><select id="categorySelect">${cats.map(c=>`<option value="${escapeHtml(c)}" ${current===c?'selected':''}>${escapeHtml(c)} · ${categoryCount(c)} productos</option>`).join('')}</select></label><button type="button" class="category-list-btn" data-action="categoryGoList">Ver lista</button></div><div class="category-current" aria-live="polite"><b id="categoryCurrentTitle">${escapeHtml(current==='Todos'?'Todas las categorías':current)}</b><span id="categoryCurrentCount">${categoryCount(current)} productos</span></div><div class="category-grid">${cats.map(c=>`<button type="button" class="category-card ${filter.cat===c?'active':''}" data-catcard="${escapeHtml(c)}"><img src="${escapeHtml(categoryImage(c))}" alt="${escapeHtml(c)}" onerror="this.onerror=null;this.src='assets/categorias/categoria.svg'"><b>${escapeHtml(c)}</b><small>${categoryCount(c)} productos</small></button>`).join('')}</div></section>`
  }

  function refreshCategoryUI(){
    $$('.chip[data-cat]').forEach(x=>x.classList.toggle('active',x.dataset.cat===filter.cat));
    $$('.cat-mini[data-minicat]').forEach(x=>x.classList.toggle('active',x.dataset.minicat===filter.cat));
    $$('.category-card').forEach(x=>x.classList.toggle('active',x.dataset.catcard===filter.cat));
    const current=filter.cat||'Todos';
    $$('#categorySelect, #inventoryCategorySelect').forEach(select=>{ if(select) select.value=current; });
    const title=$('#categoryCurrentTitle');
    if(title) title.textContent=current==='Todos'?'Todas las categorías':current;
    const count=$('#categoryCurrentCount');
    if(count) count.textContent=`${categoryCount(current)} productos`;
  }
  function scrollToInventoryList(){
    const inv=$('#inventario');
    if(!inv) return;
    const top=Math.max(0,inv.getBoundingClientRect().top+window.scrollY-94);
    window.scrollTo({top,left:0,behavior:'smooth'});
  }
  function bindInventoryToolbar(){
    const bindSearch=(search)=>{
      if(!search || search.dataset.searchBound==='1') return;
      search.dataset.searchBound='1';
      let raf=0;
      const run=()=>{
        raf=0;
        const y=window.scrollY;
        renderInventoryOnly();
        requestAnimationFrame(()=>{
          const next=$('#inventorySearchInput') || $('#searchInput');
          if(next){
            next.focus({preventScroll:true});
            try{ next.setSelectionRange(next.value.length,next.value.length); }catch(err){}
          }
          window.scrollTo({top:y,left:0,behavior:'auto'});
        });
      };
      search.addEventListener('focus',()=>document.body.classList.add('search-active'));
      search.addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('search-active'),160));
      search.addEventListener('input',e=>{filter.q=e.target.value; filter.special=''; if(!raf) raf=requestAnimationFrame(run);});
    };
    bindSearch($('#inventorySearchInput'));
    const cat=$('#inventoryCategorySelect');
    if(cat && cat.dataset.bound!=='1'){cat.dataset.bound='1';cat.addEventListener('change',e=>applyCategory(e.target.value));}
  }
  function bindProductCards(){
    document.querySelectorAll('#inventario [data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});
    document.querySelectorAll('#inventario article.product-card[data-id]').forEach(card=>{
      if(card.dataset.cardBound==='1') return;
      card.dataset.cardBound='1';
      card.addEventListener('click',e=>{
        if(e.target.closest('[data-action],button,a,input,select,textarea,label')) return;
        const id=card.dataset.id || card.dataset.productId;
        if(id) openProductDetails(id);
      });
      card.addEventListener('keydown',e=>{
        if(e.key!=='Enter' && e.key!==' ') return;
        if(e.target.closest('[data-action],button,a,input,select,textarea')) return;
        e.preventDefault();
        const id=card.dataset.id || card.dataset.productId;
        if(id) openProductDetails(id);
      });
      if(!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
      if(!card.hasAttribute('role')) card.setAttribute('role','button');
      if(!card.getAttribute('aria-label')){
        const title=(card.querySelector('h3')?.textContent || '').trim();
        card.setAttribute('aria-label', title?`Ver producto ${title}`:'Ver producto');
      }
    });
    document.querySelectorAll('#inventario [data-route-mode]').forEach(btn=>{
      if(btn.dataset.bound)return;
      btn.dataset.bound=1;
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        setProductDeliveryMode(btn.dataset.routeId,btn.dataset.routeMode);
      });
    });
    document.querySelectorAll('#inventario [data-cqty-minus]').forEach(btn=>{if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',e=>{e.preventDefault();setClientQty(btn.dataset.cqtyMinus,clientQty(btn.dataset.cqtyMinus)-1)})});
    document.querySelectorAll('#inventario [data-cqty-plus]').forEach(btn=>{if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',e=>{e.preventDefault();setClientQty(btn.dataset.cqtyPlus,clientQty(btn.dataset.cqtyPlus)+1)})});
    document.querySelectorAll('#inventario [data-cqty-input]').forEach(inp=>{if(inp.dataset.bound)return; inp.dataset.bound=1; const update=()=>setClientQty(inp.dataset.cqtyInput,inp.value); inp.addEventListener('input',update); inp.addEventListener('change',update); inp.addEventListener('keydown',e=>{if(e.key==='Enter')inp.blur()})});
    document.querySelectorAll('#inventario [data-product-cat]').forEach(btn=>{
      if(btn.dataset.bound==='1') return;
      btn.dataset.bound='1';
      btn.addEventListener('click',e=>{
        e.preventDefault();
        e.stopPropagation();
        const cat=btn.getAttribute('data-product-cat')||'Todos';
        applyCategory(cat);
      });
    });
  }
  function renderInventoryOnly(){
    const inv=$('#inventario'); if(!inv){render();return}
    const list=filteredProducts();
    const count=inv.querySelector('.count-pill');
    const units=inv.querySelector('.metric-units-v189 > b');
    const cloud=inv.querySelector('.cloud-pill-v189 small');
    const insights=inv.querySelector('.catalog-insights-v190');
    const content=inv.querySelector('.inventory-content');
    if(count) count.textContent=String(list.length);
    if(units) units.textContent=num(list.reduce((a,p)=>a+productStock(p),0));
    if(insights){
      const out=list.filter(p=>productStock(p)<=0).length;
      const low=list.filter(p=>productStock(p)>0 && productStock(p)<=Number(state.settings.lowStockLimit||3)).length;
      const ok=Math.max(0,list.length-out);
      const vals=insights.querySelectorAll('b');
      if(vals[0]) vals[0].textContent=num(ok);
      if(vals[1]) vals[1].textContent=num(low);
      if(vals[2]) vals[2].textContent=num(out);
    }
    if(cloud) cloud.textContent=lastSyncLabel();
    if(content){
      content.innerHTML=inventoryGridHTML(list);
      const inlineSearch=inv.querySelector('#inventorySearchInput');
      if(inlineSearch && document.activeElement!==inlineSearch) inlineSearch.value=filter.q;
      const inlineCat=inv.querySelector('#inventoryCategorySelect');
      if(inlineCat) inlineCat.value=filter.cat||'Todos';
    }else{
      inv.innerHTML=`${inventoryHeadHTML(list.length,list)}<div class="inventory-content">${inventoryGridHTML(list)}</div>`;
    }
    bindProductCards();
    bindPanelCategoryV150();
    bindInventoryToolbar();
    refreshCategoryUI();
  }
  function applyCategory(cat,opts={}){const y=window.scrollY; filter.cat=cat||'Todos'; filter.special=''; renderInventoryOnly(); requestAnimationFrame(()=>{if(opts.scrollToList===false) window.scrollTo({top:y,left:0,behavior:'auto'}); else scrollToInventoryList();});}

  function filteredProducts(){
    const q=filter.q.trim().toLowerCase();
    return activeProducts().filter(p=>{
      const tags=productTags(p);
      const inCat=filter.cat==='Todos'||tags.some(t=>t.toLowerCase()===filter.cat.toLowerCase());
      const hay=[p.name,p.id,categoryText(p),p.description,p.category,p.categoria,p.etiquetas].join(' ').toLowerCase();
      let ok = inCat && (!q || hay.includes(q));
      if(filter.special==='lowStock') ok = ok && productStock(p)>0 && productStock(p)<=Number(state.settings.lowStockLimit||3);
      if(filter.special==='outStock') ok = ok && productStock(p)<=0;
      if(filter.special==='noCost') ok = ok && !(Number(p.cost||0)>0);
      if(filter.special==='lowProfit') ok = ok && Number(p.price||0)>0 && Number(p.cost||0)>0 && (Number(p.price||0)-Number(p.cost||0))>0 && (Number(p.price||0)-Number(p.cost||0))<10;
      if(filter.special==='noImage') ok = ok && !String(p.image||'').trim() && !String(p.gallery||'').trim();
      return ok;
    }).sort((a,b)=>{
      const sa=productStock(a), sb=productStock(b);
      const rankA=sa<=0?2:(sa<=Number(state.settings.lowStockLimit||3)?1:0);
      const rankB=sb<=0?2:(sb<=Number(state.settings.lowStockLimit||3)?1:0);
      if(rankA!==rankB) return rankA-rankB;
      if(sa!==sb && rankA!==2) return sb-sa;
      return String(a.name||'').localeCompare(String(b.name||''),'es',{sensitivity:'base'});
    });
  }
  function inventoryHTML(){const list=filteredProducts(); return `<section id="inventario">${inventoryHeadHTML(list.length,list)}<div class="inventory-content">${inventoryGridHTML(list)}</div></section>`}
  function status(p){
    const stock=productStock(p);
    const low=Number(state.settings.lowStockLimit||3);
    if(stock<=0) return {text:'Agotado',cls:'out'};
    if(stock<=low) return {text:'Bajo stock',cls:'low'};
    return {text:'Disponible',cls:'ok'};
  }
  function priceForQty(p,qty=1){
    const q=Math.max(1,Number(qty)||1);
    return productQuotedItemsTotal(p,q)/q;
  }

  function promoCompactText(p){
    const rows=promoTiers(p);
    if(!rows.length) return '';
    const best=rows[0];
    return `${num(best.qty)}+ por ${money(best.price)}`;
  }
  function colorCompactText(p,limit=3){
    const txt=colorStockSummary(p,limit);
    return txt || '';
  }
  function productClientFactsHTML(p,limit=3){
    const stockQty=productStock(p);
    const colors=colorCompactText(p,limit);
    const offer=promoCompactText(p);
    return `<div class="v163-product-facts"><span>Stock <b>${num(stockQty)}</b></span>${colors?`<span>Colores <b>${escapeHtml(colors)}</b></span>`:''}${offer?`<span>Oferta <b>${escapeHtml(offer)}</b></span>`:''}</div>`;
  }
  function productCard(p){
    const st=status(p);
    const stockQty=productStock(p);
    const rawColors=colorCompactText(p,3);
    const colors=rawColors && !/^general\b/i.test(String(rawColors).trim()) ? rawColors : '';
    const offer=promoCompactText(p);
    const isOut=st.cls==='out' || stockQty<=0;
    const img=productImage(p);
    const idRaw=String(p.id||'');
    const id=escapeHtml(idRaw);
    const cat=firstTag(p);
    const qty=clientQty(idRaw);
    const deliveryMode=productDeliveryMode(idRaw);
    const localTotal=productLocalTotalQty(p,qty);
    const normalTotal=productNormalTotalQty(p,qty);
    const codTotal=productCodTotalQty(p,qty);
    const mainTotal=deliveryMode==='local'?localTotal:normalTotal;
    const adminButton=cardView()==='admin'?`<button type="button" class="product-admin-v178 product-action-admin-v190" data-action="adminProduct" data-id="${id}">Admin</button>`:'';
    const quoteButton=!isOut?`<button type="button" class="product-action-quote-v190" data-action="quoteProduct" data-id="${id}">Cotizar</button>`:'';
    const sellButton=!isOut?`<button type="button" class="product-action-sell-v190" data-action="sellProduct" data-id="${id}">Vender</button>`:'';
    const waButton=(!isOut && cardView()==='client')?`<button type="button" class="product-action-wa-v190" data-action="waProduct" data-id="${id}">WhatsApp</button>`:'';
    const detailButton=`<button type="button" class="product-action-detail-v190 ${isOut?'out-view':''}" data-action="viewProduct" data-id="${id}">${isOut?'Ver':'Detalle'}</button>`;
    const outNote=isOut?'<div class="product-out-note-v180">Sin existencias por ahora</div>':'';
    const outRibbon=isOut?'<span class="stockout-ribbon-v181" aria-hidden="true">AGOTADO</span>':'';
    const metaPills=[
      cat?`<span class="meta-cat-v235">${escapeHtml(cat)}</span>`:'',
      id?`<span class="meta-code-v235">${id}</span>`:'',
      colors?`<span class="meta-colors-v235">${escapeHtml(colors)}</span>`:'',
      offer?`<span class="offer meta-offer-v235">${escapeHtml(offer)}</span>`:''
    ].filter(Boolean).join('');
    const stockLabel=`${num(stockQty)} ${stockQty===1?'unidad':'unidades'}`;
    return `<article class="product-card product-card-v178 product-card-v190 product-card-v235 ${isOut?'is-out is-agotado':''}" data-id="${id}" data-product-id="${id}" data-stock-status="${st.cls}" data-product-name="${escapeHtml(p.name||'')}" data-product-price="${escapeHtml(String(productQuotedUnit(p)||0))}" data-product-stock="${escapeHtml(String(stockQty))}">
      ${outRibbon}
      <button type="button" class="product-photo-v178 product-photo-v246" data-action="viewProduct" data-id="${id}" aria-label="Ver detalle de ${escapeHtml(p.name)}">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'">
        <span class="product-availability-v178 ${st.cls}"><i></i>${st.text}</span>
      </button>
      <div class="product-copy-v178 product-copy-v235 product-copy-v246">
        <div class="product-code-row-v178 product-code-row-v246">${cat?`<button type="button" class="product-cat-chip-v237" data-product-cat="${escapeHtml(cat)}">${escapeHtml(cat)}</button>`:''}${id?`<span>${id}</span>`:''}</div>
        <h3 data-action="viewProduct" data-id="${id}">${escapeHtml(p.name)}</h3>
        <div class="product-mobile-meta-v277"><span class="product-summary-status-v268"><i></i>${escapeHtml(st.text)}</span><span class="product-stock-pill-v277 ${st.cls}">${escapeHtml(stockLabel)}</span></div>
        <div class="product-price-v178 product-main-price-v245 product-main-price-v246"><strong class="${isOut?'is-out':''}" data-client-total="main">${money(mainTotal)}</strong><em class="${st.cls}" data-client-total="main-label">${deliveryMode==='local'?'Comayagua · precio local':'Honduras · envío normal'}</em></div>
        <div class="delivery-panel-v245 delivery-panel-v246" data-delivery-panel data-mode="${deliveryMode}">
          <div class="delivery-tabs-v245" role="group" aria-label="Tipo de entrega">
            <button type="button" class="${deliveryMode==='local'?'active':''}" data-route-id="${id}" data-route-mode="local">Comayagua</button>
            <button type="button" class="${deliveryMode==='hn'?'active':''}" data-route-id="${id}" data-route-mode="hn">Honduras</button>
          </div>
          <div class="delivery-qty-v245">
            <span>Cantidad</span>
            <div class="delivery-qty-box-v245">
              <button type="button" data-cqty-minus="${id}">−</button>
              <input type="number" min="1" inputmode="numeric" value="${num(qty)}" data-cqty-input="${id}" aria-label="Cantidad">
              <button type="button" data-cqty-plus="${id}">+</button>
            </div>
          </div>
          <div class="delivery-prices-v245 delivery-local-v245">
            <article><span>Comayagua</span><b data-client-total="local">${money(localTotal)}</b><small>Producto sin envío · entrega local según zona</small></article>
          </div>
          <div class="delivery-prices-v245 delivery-hn-v245">
            <article><span>Envío normal</span><b data-client-total="normal">${money(normalTotal)}</b><small>Depósito / Tigo Money</small></article>
            <article><span>Pagar al recibir</span><b data-client-total="cod">${money(codTotal)}</b><small>Envío + comisión</small></article>
          </div>
          <small class="delivery-offer-v245" data-client-total="offer" style="${promoLabelForMode(p,qty,deliveryMode)?'':'display:none'}">${promoLabelForMode(p,qty,deliveryMode)?`🎁 ${escapeHtml(promoLabelForMode(p,qty,deliveryMode))}`:''}</small>
        </div>
        ${outNote}
        <div class="product-pills-v178 product-pills-v235">${metaPills}</div>
      </div>
      <div class="product-actions-v178 product-actions-v190 product-actions-v235">
        ${cardView()==='client'?`${quoteButton}${sellButton}${waButton}`:`${adminButton}${quoteButton}${sellButton}`}
        ${detailButton}
      </div>
    </article>`;
  }

    function openProductAdminPanel(id){
    const p=productById(id);
    if(!p) return toast('Producto no encontrado.');
    const stockQty=productStock(p);
    const cost=+p.cost||0;
    const price=+p.price||0;
    const gain=price-cost;
    const invested=cost*stockQty;
    const gainTotal=gain*stockQty;
    const sellAll=price*stockQty;
    const colors=productColorRows(p);
    const colorsHTML=colors.length?colors.map(r=>`<span><b>${escapeHtml(r.color||r.name||'General')}</b><em>${num(r.qty)}</em></span>`).join(''):`<span><b>General</b><em>${num(stockQty)}</em></span>`;
    openModal(`<div class="modal-head"><h3>ADMIN</h3><button class="close">×</button></div>
      <div class="modal-body admin-private-modal-v148">
        <section class="admin-private-head-v148">
          <div><small>${escapeHtml(p.id||'SDC')}</small><h4>${escapeHtml(p.name)}</h4></div>
          <strong>${moneyPrivate(gainTotal)}</strong>
        </section>
        <section class="admin-private-grid-v148">
          <article><span>Costo compra</span><b>${moneyPrivate(cost)}</b></article>
          <article><span>Precio venta</span><b>${moneyPrivate(price)}</b></article>
          <article><span>Ganancia c/u</span><b>${moneyPrivate(gain)}</b></article>
          <article><span>Stock total</span><b>${num(stockQty)}</b></article>
          <article><span>Invertido</span><b>${moneyPrivate(invested)}</b></article>
          <article><span>Si vende todo</span><b>${moneyPrivate(sellAll)}</b></article>
          <article class="wide"><span>Ganancia estimada</span><b>${moneyPrivate(gainTotal)}</b></article>
        </section>
        <section class="admin-private-colors-v148"><span>Stock por color</span><div class="color-stock-chips-v86">${colorsHTML}</div></section>
        <div class="modal-actions" style="position:static"><button class="btn secondary full" id="adminEditProductV148">Editar producto</button></div>
      </div>`,true);
    const edit=document.getElementById('adminEditProductV148');
    if(edit) edit.onclick=()=>openProductEditor(id);
  }

  function bottomNav(){return `<nav class="bottom-nav no-print v49-bottom-nav bottom-nav-v84"><button class="nav-btn ${currentView==='catalog'?'active':''}" data-action="catalog"><i>⌂</i><span>Inicio</span></button><button class="nav-btn" data-action="focusSearch"><i>⌕</i><span>Buscar</span></button><button class="nav-btn nav-alerts-v84" data-action="notifications"><i>🔔</i><span>Alertas</span>${notificationBadgeHTML()}</button><button class="nav-btn ${currentView==='quote'?'active':''}" data-action="quote"><i>▧</i><span>Cotizar</span></button><button class="nav-btn" data-action="sell"><i>⚡</i><span>Vender</span></button><button class="nav-btn" data-action="receipts"><i>▤</i><span>Caja</span></button></nav>`}

  function bindMain(){
    if(document.body.dataset.sdcCriticalDelegates!=='1'){
      document.body.dataset.sdcCriticalDelegates='1';
      document.addEventListener('click',ev=>{
        const btn=ev.target.closest('[data-action]');
        if(!btn) return;
        const a=btn.dataset.action;
        if(a==='detail' || a==='viewProduct'){
          ev.preventDefault();
          ev.stopPropagation();
          if(btn.dataset.id) openProductDetails(btn.dataset.id);
          return;
        }
      },true);
    }
    $('[data-action="lock"]')?.addEventListener('click',()=>{state.unlocked=false;save();render()});
    const search=$('#searchInput');
    if(search && search.dataset.searchBound!=='1'){
      search.dataset.searchBound='1';
      let raf=0;
      const run=()=>{raf=0; const y=window.scrollY; renderInventoryOnly(); requestAnimationFrame(()=>{ if(document.activeElement===search){ search.focus({preventScroll:true}); window.scrollTo({top:y,left:0,behavior:'auto'}); } });};
      search.addEventListener('focus',()=>document.body.classList.add('search-active'));
      search.addEventListener('blur',()=>setTimeout(()=>document.body.classList.remove('search-active'),160));
      search.addEventListener('input',e=>{filter.q=e.target.value; filter.special=''; if(!raf) raf=requestAnimationFrame(run);});
    }
    bindInventoryToolbar();
    bindPanelCategoryV150();
    $$('#categorySelect').forEach(categorySelect=>{
      if(categorySelect && !categorySelect.dataset.bound){categorySelect.dataset.bound='1';categorySelect.addEventListener('change',e=>applyCategory(e.target.value));}
    });
    $$('.chip[data-cat]').forEach(b=>b.onclick=()=>applyCategory(b.dataset.cat));
    $$('.cat-mini[data-minicat]').forEach(b=>b.onclick=()=>applyCategory(b.dataset.minicat));
    $$('.category-card').forEach(b=>b.onclick=(ev)=>{ev.preventDefault();applyCategory(b.dataset.catcard);});
    document.querySelectorAll('[data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});

    if(!document.documentElement.dataset.sdcMobileCardOpenV268){
      document.documentElement.dataset.sdcMobileCardOpenV268='1';
      document.addEventListener('click',ev=>{
        if(window.innerWidth>700) return;
        const card=ev.target?.closest?.('.product-card-v235');
        if(!card) return;
        const blocked=ev.target?.closest?.('[data-action], [data-route-id], [data-cqty-minus], [data-cqty-plus], [data-cqty-input], button, input, select, textarea, a, label');
        if(blocked) return;
        const id=card.dataset?.id || card.dataset?.productId || '';
        if(!id) return;
        ev.preventDefault();
        ev.stopPropagation();
        openProductDetails(id);
      },true);
    }

    if(!document.documentElement.dataset.sdcViewFixV43){
      document.documentElement.dataset.sdcViewFixV43='1';
      document.addEventListener('click',ev=>{
        const btn=ev.target?.closest?.('[data-action="viewProduct"], .btn-view-product, button');
        if(!btn) return;
        const text=String(btn.textContent||'').trim().toUpperCase();
        const isView=btn.dataset?.action==='viewProduct' || text==='VER';
        if(!isView) return;
        const id=btn.dataset?.id || btn.closest?.('.product-card')?.dataset?.id || btn.closest?.('[data-product-id]')?.dataset?.productId || '';
        if(!id) return;
        ev.preventDefault();
        ev.stopImmediatePropagation();
        openProductDetails(id);
      },true);
    }
  }
  function openCategoriesSheet(){
    const current=filter.cat||'Todos';
    const cats=allCategories();
    const cards=cats.map(c=>{
      const isActive=String(current).toLowerCase()===String(c).toLowerCase();
      const label=c==='Todos'?'Todas las categorías':c;
      const count=categoryCount(c);
      return `<article class="category-sheet-card-v199 ${isActive?'active':''}">
        <button type="button" class="category-sheet-main-v199" data-catpick-v191="${escapeHtml(c)}">
          <span>${escapeHtml(label)}</span><b>${num(count)}</b><small>${c==='Todos'?'Ver todo el catálogo':'Filtrar esta categoría'}</small>
        </button>
        <div class="category-sheet-actions-v199">
          <button type="button" data-catprint-v199="${escapeHtml(c)}">Imprimir</button>
          <button type="button" data-catcapture-v199="${escapeHtml(c)}">PNG</button>
        </div>
      </article>`;
    }).join('');
    openModal(`<div class="modal-head category-sheet-head-v191"><div><small>Filtro rápido</small><h3>Categorías</h3></div><button class="close">×</button></div><div class="modal-body category-sheet-v191 category-sheet-v199"><p class="category-sheet-copy-v191">Elige una categoría o genera una vista para que el cliente vea productos disponibles y precios.</p><div class="category-sheet-grid-v191 category-sheet-grid-v199">${cards}</div></div>`,true);
    $$('[data-catpick-v191]',modalRoot).forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.getAttribute('data-catpick-v191')||'Todos';
        closeModal();
        applyCategory(cat);
        toast(cat==='Todos'?'Mostrando todas las categorías.':`Categoría: ${cat}`);
      };
    });
    $$('[data-catprint-v199]',modalRoot).forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.getAttribute('data-catprint-v199')||'Todos';
        closeModal();
        applyCategory(cat,{scrollToList:false});
        setTimeout(()=>openCategoryPrintPreview(),140);
      };
    });
    $$('[data-catcapture-v199]',modalRoot).forEach(btn=>{
      btn.onclick=()=>{
        const cat=btn.getAttribute('data-catcapture-v199')||'Todos';
        closeModal();
        applyCategory(cat,{scrollToList:false});
        setTimeout(()=>exportCategorySnapshot('download'),180);
      };
    });
  }

  function mainAction(e){
    const source=(e&&e.currentTarget&&e.currentTarget.dataset&&e.currentTarget.dataset.action)
      ? e.currentTarget
      : (e&&e.target&&e.target.closest ? e.target.closest('[data-action]') : null);
    if(!source) return;
    const a=source.dataset.action, id=source.dataset.id || source.closest?.('.product-card')?.dataset?.id || '';
    if(a==='tabInicio') return setPageV150('inicio');
    if(a==='tabPanel') return setPageV150('panel');
    if(a==='tabProductos') return setPageV150('productos');
    if(a==='categoryQuick') return applyCategory(source.dataset.cat||'Todos');
    if(a==='categoriesSheet') return openCategoriesSheet();
    if(a==='catalog') return setView('catalog');
    if(a==='homeToolsOptions'){state.settings.homeToolsTab='options'; save(); render(); return;}
    if(a==='homeToolsAlerts'){state.settings.homeToolsTab='alerts'; save(); render(); return;}
    if(a==='notifications') return openNotifications();
    if(a==='focusSearch'){ const search=$('#inventorySearchInput') || $('#searchInput'); search?.scrollIntoView({behavior:'smooth',block:'center'}); setTimeout(()=>search?.focus({preventScroll:true}),250); return; }
    if(a==='categoryGoList'){ scrollToInventoryList(); return; }
    if(a==='sell') return openSale();
    if(a==='quote') return openQuote();
    if(a==='newProduct') return openProductEditor();
    if(a==='editProduct') return openProductEditor(id);
    if(a==='downloadProductPhotoDirect') return downloadProductPhotoDirect(id, source);
    if(a==='viewProduct') return openProductDetails(id);
    if(a==='adminProduct') return openProductAdminPanel(id);
    if(a==='sellProduct') return openSale(id);
    if(a==='quoteProduct') return openQuote(id);
    if(a==='backup') return openBackup();
    if(a==='sync') return syncLocal();
    if(a==='uploadSheets') return uploadLocalProductsToSheets();
    if(a==='sheetsDoctor') return openSheetsDoctor();
    if(a==='layoutOne') return setInventoryLayout('one');
    if(a==='layoutTwo') return setInventoryLayout('two');
    if(a==='cardAdmin') return setCardView('admin');
    if(a==='cardClient') return setCardView('client');
    if(a==='waProduct'){const p=productById(id); if(p)return sendProductWhatsApp(p,clientQty(id));}
    if(a==='profit') return openProfit();
    if(a==='receipts') return openReceipts();
    if(a==='quotes') return openSavedQuotes();
    if(a==='clients') return openClients();
    if(a==='dailyClose') return openDailyClose();
    if(a==='marketingProduct') return openMarketingText(id);
    if(a==='quickSale') return openQuickSale();
    if(a==='expenses') return openExpenses();
    if(a==='moneyLock') return toggleMoneyLock();
    if(a==='captureClean') return toggleCaptureClean();
    if(a==='categoryCapture') return exportCategorySnapshot('share');
    if(a==='categoryPrint') return openCategoryPrintPreview();
    if(a==='exportAll') return exportAllCSV();

    if(a==='lowStock'){filter.cat='Todos'; filter.q=''; filter.special='lowStock'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); const n=filteredProducts().length; toast(n?`${n} productos con bajo stock filtrados.`:'No hay productos en bajo stock.');},50); return;}
    if(a==='outStock'){filter.cat='Todos'; filter.q=''; filter.special='outStock'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); const n=filteredProducts().length; toast(n?`${n} productos agotados filtrados.`:'No hay productos agotados.');},50); return;}
    if(a==='noCost'){filter.cat='Todos'; filter.q=''; filter.special='noCost'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`${filteredProducts().length} productos sin costo filtrados.`);},50); openNoCost(); return;}
    if(a==='lowProfit'){filter.cat='Todos'; filter.q=''; filter.special='lowProfit'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`${filteredProducts().length} productos con ganancia baja filtrados.`);},50); openLowProfit(); return;}
    if(a==='noImage'){filter.cat='Todos'; filter.q=''; filter.special='noImage'; render(); setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); const n=filteredProducts().length; toast(n?`${n} productos sin imagen filtrados.`:'Todos los productos tienen imagen.');},50); return;}
  }

  function openModal(html,wide=false){
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open-root');
    document.documentElement.scrollLeft=0; document.body.scrollLeft=0;
    modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}">${html}</section></div>`;
    const m=$('.modal',modalRoot); if(m){ if(String(html||'').includes('quote-body-v176')) m.classList.add('quote-modal-v176'); if(String(html||'').includes('v49-product-detail')) m.classList.add('product-detail-modal-v221'); m.scrollLeft=0; m.scrollTop=0;}
    const mb=$('.modal-body',modalRoot); if(mb){mb.scrollLeft=0; mb.scrollTop=0;}
    $('.close',modalRoot)?.addEventListener('click',closeModal);
    modalRoot.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  }
  function closeModal(){document.body.classList.remove('modal-open'); document.documentElement.classList.remove('modal-open-root'); modalRoot.innerHTML=''}

  function splitGallery(prod){
    const p=SDCStore.normalizeProduct(prod||{},state.products.length);
    const urls=[p.image,...String(p.gallery||'').split(/\n+/)].map(x=>String(x||'').trim()).filter(Boolean);
    return urls.length?urls:[''];
  }
  function parsePromoRows(text){
    const rows=String(text||'').split(/[\n|;]+/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const clean=line.replace(/lps\.?|hnl|lempiras?|total|paquete|pares?|unidades?|uds?\.?/ig,'').replace(/,/g,'.').trim();
      const m=clean.match(/^(\d+)\s*(?:[=:]|-|→|a)\s*(\d+(?:\.\d+)?)$/i);
      return m?{qty:m[1],price:m[2]}:{qty:'',price:''};
    }).filter(r=>r.qty||r.price);
    return rows.length?rows:[{qty:'',price:''}];
  }

  function imageDataURLFromImage(img, maxChars=42000, maxSize=900, quality=0.72){
    const attempts=[
      {size:maxSize,q:quality},
      {size:760,q:0.66},
      {size:640,q:0.60},
      {size:520,q:0.56},
      {size:420,q:0.52},
      {size:340,q:0.48},
      {size:280,q:0.45},
      {size:220,q:0.42},
      {size:180,q:0.40}
    ];
    let best='';
    for(const attempt of attempts){
      const scale=Math.min(1,attempt.size/Math.max(img.width,img.height));
      const w=Math.max(1,Math.round(img.width*scale));
      const h=Math.max(1,Math.round(img.height*scale));
      const canvas=document.createElement('canvas');
      canvas.width=w; canvas.height=h;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,w,h);
      ctx.drawImage(img,0,0,w,h);
      best=canvas.toDataURL('image/jpeg',attempt.q);
      if(best.length <= maxChars) return best;
    }
    return best;
  }
  function imageFileToDataURL(file, maxSize=900, quality=0.72, maxChars=42000){
    return new Promise((resolve,reject)=>{
      if(!file || !file.type || !file.type.startsWith('image/')) return reject(new Error('Seleccione una imagen válida.'));
      const reader=new FileReader();
      reader.onerror=()=>reject(new Error('No se pudo leer la imagen.'));
      reader.onload=()=>{
        const img=new Image();
        img.onload=()=>resolve(imageDataURLFromImage(img,maxChars,maxSize,quality));
        img.onerror=()=>reject(new Error('No se pudo procesar la imagen.'));
        img.src=reader.result;
      };
      reader.readAsDataURL(file);
    });
  }
  function compactDataImage(value, maxChars=42000, maxSize=900, quality=0.72){
    const raw=String(value || '').trim();
    if(!/^data:image\//i.test(raw) || raw.length <= maxChars) return Promise.resolve(raw);
    return new Promise(resolve=>{
      const img=new Image();
      img.onload=()=>resolve(imageDataURLFromImage(img,maxChars,maxSize,quality));
      img.onerror=()=>resolve(raw);
      img.src=raw;
    });
  }
  async function compactProductImages(images){
    const incoming=(images || []).map(x=>String(x || '').trim()).filter(Boolean);
    const out=[];
    const galleryCount=Math.max(1,incoming.length-1);
    const galleryMax=Math.max(5200,Math.floor(42000/galleryCount)-300);
    for(let i=0;i<incoming.length;i++){
      const isMain=i===0;
      out.push(await compactDataImage(incoming[i], isMain?42000:galleryMax, isMain?900:420, isMain?0.72:0.52));
    }
    return out;
  }

  function productForm(p={}){
    const prod=SDCStore.normalizeProduct(p,state.products.length);
    if(!p.id) prod.id=nextCode();
    const isEdit=!!p.id;
    const actionButtons=`<button class="btn" id="saveProduct" data-sdc-native-save="1" type="button">Guardar y sincronizar</button><button class="btn danger stockout-product-btn-v169" id="markProductOut" type="button">AGOTADO</button>${isEdit?`<button class="btn secondary" id="duplicateProduct" type="button">Duplicar</button><button class="btn danger" id="deleteProduct" type="button">Eliminar</button>`:''}`;
    return `<div class="modal-head"><h3>${isEdit?'Editar':'Nuevo'} producto</h3><button class="close">×</button></div>
    <div class="modal-body product-editor product-editor-v83">
      <div class="card-box product-sync-note-v83">
        <b>Guardado automático</b>
        <span>Al tocar “Guardar y sincronizar”, se guarda en este dispositivo y se envía a Firebase con la misma base de datos de la página.</span>
      </div>
      <div class="card-box"><h4>Información básica</h4>
        <div class="modal-grid">
          <label><span class="label">Nombre del producto</span><input id="pName" class="input" value="${escapeHtml(isEdit?prod.name:'')}" placeholder="Producto sin nombre"></label>
          <label><span class="label">Código</span><input id="pId" class="input" value="${escapeHtml(prod.id)}"></label>
          <label class="span2"><span class="label">Categorías / etiquetas</span><input id="pCats" class="input" value="${escapeHtml(prod.categories)}" placeholder="Ejemplo: Dedales, Gamer Móvil"></label>
          <label><span class="label">Costo compra</span><input id="pCost" class="input" type="number" min="0" step="0.01" value="${isEdit?prod.cost:''}" placeholder="Costo compra"></label>
          <label><span class="label">Precio venta</span><input id="pPrice" class="input" type="number" min="0" step="0.01" value="${isEdit?prod.price:''}" placeholder="Precio venta"></label>
          <label><span class="label">Stock general</span><input id="pStock" class="input" type="number" min="0" step="1" inputmode="numeric" placeholder="Stock general" value="${isEdit?prod.stock:''}"></label>
          <div class="span2 color-editor-box-v86"><span class="label">Colores y cantidades</span><div class="color-help-v86"><b>Stock por color:</b> agregue gris 7, amarillo 3, anaranjado 10. Si usa colores, el stock general se calcula solo. Tecnología, haciendo por fin algo útil.</div><div id="colorRows" class="color-rows-v86"></div><button class="btn secondary full add-line" id="addColorRow" type="button">+ Agregar color</button><small class="hint" id="colorStockHint">Sin colores: se usa el stock general.</small></div>
          <div class="span2 image-upload-box-v83"><span class="label">Imágenes del producto</span><div id="imageRows" class="image-rows image-rows-v83"></div><button class="btn secondary full add-line" id="addImageRow" type="button">+ Añadir otra imagen</button><small class="hint">La imagen 1 será la principal. Usa “Subir” para escoger foto desde el celular o pega un enlace si ya la tienes en internet.</small></div>
          <div class="span2 promo-editor-box"><span class="label">Ofertas por cantidad</span><div class="promo-help"><b>Regla clara:</b> Cantidad mínima + precio total del paquete. Ejemplo: 20 pares a Lps.20 c/u = Cantidad 20 y Total 400.</div><div id="promoRows" class="promo-rows"></div><button class="btn secondary full add-line" id="addPromoRow" type="button">+ Agregar oferta</button><small class="hint">El sistema aplica la mejor oferta automáticamente en cotización, WhatsApp, factura y caja.</small></div>
          <textarea id="pDesc" class="textarea" hidden>${escapeHtml(prod.description||'')}</textarea>
        </div>
        <div class="chips">${['Gamer Móvil','Dedales','Gatillos','Tecnología','Celulares','Audio','Cables','Hogar','Cocina'].map(c=>`<button class="chip" data-addcat="${c}">${c}</button>`).join('')}</div>
      </div>
      <div class="modal-actions product-form-actions product-form-actions-v83">${actionButtons}</div>
      <div id="productSaveStatus" class="product-save-status" aria-live="polite"></div>
    </div>`
  }

  function openProductEditor(id){
    const p=id?productById(id):{}; const prod=SDCStore.normalizeProduct(p||{},state.products.length);
    let imageRows=splitGallery(prod); let promoRows=parsePromoRows(prod.promos); let colorRows=productColorRows(prod); if(!colorRows.length) colorRows=[{name:'',qty:''}];
    openModal(productForm(p),true);
    function drawImages(){
      const html=imageRows.map((url,i)=>{
        const clean=String(url||'').trim();
        const has=!!clean;
        const isData=/^data:image\//i.test(clean);
        const inputValue=isData?'Imagen subida desde el celular':clean;
        const preview=has?`<img src="${escapeHtml(clean)}" alt="Imagen ${i+1}" onerror="this.closest('.image-preview-v83').classList.add('is-broken')">`:`<span>Sin imagen</span>`;
        return `<div class="mini-row image-row image-row-upload image-row-v83">
          <div class="image-preview-v83 ${has?'has-image':'is-empty'}">${preview}</div>
          <div class="image-row-main-v83">
            <div class="image-row-title-v83"><strong>Imagen ${i+1}${i===0?' · Principal':''}</strong><small>${has?(isData?'Foto subida y comprimida':'Enlace de imagen listo'):'Agrega una foto o enlace'}</small></div>
            <input class="input pImageUrl" value="${escapeHtml(inputValue)}" ${isData?'readonly':''} placeholder="Pegar enlace de imagen (opcional)">
            <div class="image-row-actions-v83">
              <label class="btn small secondary upload-image-btn">Subir<input data-upload-image="${i}" type="file" accept="image/*" hidden></label>
              <button class="btn small ghost" data-delimage="${i}" type="button">Quitar</button>
            </div>
          </div>
        </div>`;
      }).join('');
      $('#imageRows',modalRoot).innerHTML=html;
      $$('.pImageUrl',modalRoot).forEach((inp,i)=>inp.oninput=()=>{if(!inp.readOnly) imageRows[i]=inp.value});
      $$('[data-upload-image]',modalRoot).forEach(inp=>inp.onchange=async()=>{const i=+inp.dataset.uploadImage; const file=inp.files&&inp.files[0]; if(!file)return; try{toast('Preparando imagen...'); imageRows[i]=await imageFileToDataURL(file, i===0?900:460, i===0?0.72:0.54, i===0?42000:9000); drawImages(); toast(`Imagen ${i+1} lista para guardar.`);}catch(err){console.error(err); toast(err.message||'No se pudo cargar la imagen.');}});
      $$('[data-delimage]',modalRoot).forEach(b=>b.onclick=()=>{if(imageRows.length>1)imageRows.splice(+b.dataset.delimage,1);else imageRows[0]='';drawImages()});
    }


    function drawColors(){
      const wrap=$('#colorRows',modalRoot);
      if(!wrap) return;
      wrap.innerHTML=colorRows.map((r,i)=>`<div class="mini-row color-row-v86">
        <label><small>Color</small><input class="input pColorName" value="${escapeHtml(r.name||'')}" placeholder="Ej. gris"></label>
        <label><small>Cantidad</small><input class="input pColorQty" type="number" min="0" step="1" inputmode="numeric" value="${escapeHtml(r.qty??'')}" placeholder="0"></label>
        <button class="btn small ghost color-delete-btn" data-delcolor="${i}" type="button" aria-label="Eliminar color ${i+1}">×</button>
      </div>`).join('');
      const updateHint=()=>{
        const clean=mergeColorRows(colorRows).filter(x=>String(x.name||'').trim());
        const total=colorRowsTotal(clean);
        const hint=$('#colorStockHint',modalRoot);
        if(hint) hint.innerHTML=clean.length?`Stock por colores: <b>${num(total)}</b> unidades. Se usará este total al guardar.`:'Sin colores: se usa el stock general.';
        const stockInput=$('#pStock',modalRoot);
        if(stockInput && clean.length) stockInput.value=String(total);
      };
      $$('.color-row-v86',modalRoot).forEach((row,i)=>{
        $('.pColorName',row).oninput=e=>{colorRows[i].name=e.target.value; updateHint();};
        $('.pColorQty',row).oninput=e=>{
          const raw=String(e.target.value||'').trim();
          if(raw===''){ colorRows[i].qty=''; updateHint(); return; }
          colorRows[i].qty=Math.max(0,Math.floor(Number(raw)||0));
          e.target.value=String(colorRows[i].qty);
          updateHint();
        };
      });
      $$('[data-delcolor]',modalRoot).forEach(b=>b.onclick=()=>{if(colorRows.length>1)colorRows.splice(+b.dataset.delcolor,1);else colorRows[0]={name:'',qty:''};drawColors();});
      updateHint();
    }

    function drawPromos(){
      $('#promoRows',modalRoot).innerHTML=promoRows.map((r,i)=>{const q=Number(r.qty)||0, pr=Number(r.price)||0, unit=q&&pr?money(pr/q):'—'; return `<div class="mini-row promo-row promo-row-v26 promo-row-v49"><div class="promo-row-title"><strong>Oferta ${i+1}</strong><small>Precio por cantidad</small></div><label class="promo-field promo-qty-field"><small>Cantidad mínima</small><input class="input pPromoQty" inputmode="numeric" type="number" value="${escapeHtml(r.qty)}" placeholder="Ej. 20"></label><label class="promo-field promo-total-field"><small>Total paquete</small><input class="input pPromoPrice" inputmode="numeric" type="number" value="${escapeHtml(r.price)}" placeholder="Ej. 400"></label><div class="promo-unit-preview"><span>Precio c/u</span><b>${unit}</b></div><button class="btn small ghost promo-delete-btn" data-delpromo="${i}" type="button" aria-label="Eliminar oferta ${i+1}">×</button></div>`}).join('');
      $$('.promo-row',modalRoot).forEach((row,i)=>{ $('.pPromoQty',row).oninput=e=>promoRows[i].qty=e.target.value; $('.pPromoPrice',row).oninput=e=>promoRows[i].price=e.target.value; });
      $$('[data-delpromo]',modalRoot).forEach(b=>b.onclick=()=>{if(promoRows.length>1)promoRows.splice(+b.dataset.delpromo,1);else promoRows[0]={qty:'',price:''};drawPromos()});
    }
    drawImages(); drawPromos(); drawColors();
    $('#addImageRow').onclick=()=>{imageRows.push('');drawImages(); setTimeout(()=>$$('.pImageUrl',modalRoot).at(-1)?.focus(),30)};
    $('#addPromoRow').onclick=()=>{promoRows.push({qty:'',price:''});drawPromos(); setTimeout(()=>$$('.pPromoQty',modalRoot).at(-1)?.focus(),30)};
    $('#addColorRow').onclick=()=>{colorRows.push({name:'',qty:''});drawColors(); setTimeout(()=>$$('.pColorName',modalRoot).at(-1)?.focus(),30)};
    $$('[data-addcat]',modalRoot).forEach(b=>b.onclick=()=>{const inp=$('#pCats'); const tags=parseTags(inp.value); if(!tags.some(t=>t.toLowerCase()===b.dataset.addcat.toLowerCase())) tags.push(b.dataset.addcat); inp.value=tags.join(', ')});
    const readMoneyField=(selector)=>{const raw=String($(selector)?.value ?? '').trim().replace(',','.'); if(raw==='') return 0; const n=Number(raw); return Number.isFinite(n)?Math.max(0,n):0;};
    const readStockField=()=>Math.max(0,Math.floor(readMoneyField('#pStock')));
    const setAllColorRowsToZero=()=>{
      if(!colorRows.length) colorRows=[{name:'',qty:''}];
      colorRows=colorRows.map(r=>String(r.name||'').trim()?{...r,qty:0}:r);
      drawColors();
    };
    ['#pCost','#pPrice','#pStock'].forEach(sel=>{$(sel)?.addEventListener('input',e=>{
      const raw=String(e.target.value||'');
      if(raw!=='' && Number(raw)<0) e.target.value='0';
      if(sel==='#pStock' && raw!=='' && Math.floor(Number(raw)||0)===0) setAllColorRowsToZero();
      if(sel==='#pStock' && raw!=='' && Math.floor(Number(raw)||0)>0){
        const clean=mergeColorRows(colorRows).filter(r=>String(r.name||'').trim());
        if(clean.length && colorRowsTotal(clean)<=0){
          colorRows=[{name:'',qty:''}];
          drawColors();
        }
      }
    });});
    $('#autoDescBtn')&&($('#autoDescBtn').onclick=()=>{const temp={name:$('#pName')?.value||prod.name,id:$('#pId')?.value||prod.id,categories:$('#pCats')?.value||prod.categories,price:readMoneyField('#pPrice')}; $('#pDesc').value=autoProductDescription(temp); toast('Descripción automática generada.');});
    $('#markProductOut',modalRoot)?.addEventListener('click',()=>{
      const stockInput=$('#pStock',modalRoot);
      if(stockInput) stockInput.value='0';
      setAllColorRowsToZero();
      setProductSaveStatus('Producto marcado como AGOTADO. Toca “Guardar y sincronizar” para confirmarlo en Firebase.', 'info');
      toast('Stock en 0. Guarda para confirmar AGOTADO.');
    });
    let productSaving=false;
    function setProductSaveStatus(message,type='info'){
      const el=$('#productSaveStatus',modalRoot);
      if(!el) return;
      el.textContent=message || '';
      el.className='product-save-status '+(message?'active ':'')+(type||'info');
    }
    function setSaveButtonBusy(btn,busy,label){
      if(!btn) return;
      if(busy){
        btn.dataset.originalText=btn.dataset.originalText || btn.textContent || 'Guardar y sincronizar';
        btn.disabled=true;
        btn.classList.add('is-saving');
        btn.textContent=label || 'Guardando...';
      }else{
        btn.disabled=false;
        btn.classList.remove('is-saving');
        btn.textContent=btn.dataset.originalText || 'Guardar y sincronizar';
      }
    }
    $('#saveProduct').onclick=async()=>{
      const btn=$('#saveProduct',modalRoot);
      if(productSaving) return;
      productSaving=true;
      setSaveButtonBusy(btn,true,'Guardando...');
      setProductSaveStatus('Guardando producto en este dispositivo...', 'info');
      $$('.pImageUrl',modalRoot).forEach((inp,i)=>{if(!inp.readOnly) imageRows[i]=inp.value.trim();});
      const rawImages=imageRows.map(x=>String(x||'').trim()).filter(Boolean);
      setProductSaveStatus('Preparando imágenes...', 'info');
      const images=await compactProductImages(rawImages);
      const promos=$$('.promo-row',modalRoot).map(row=>{const q=$('.pPromoQty',row).value.trim(); const pr=$('.pPromoPrice',row).value.trim(); return q&&pr?`${q}=${pr}`:''}).filter(Boolean).join('\n');
      let colors=mergeColorRows(colorRows).filter(r=>String(r.name||'').trim());
      const manualStock=readStockField();
      if(manualStock>0 && colors.length && colorRowsTotal(colors)<=0) colors=[];
      const stockValue=colors.length?colorRowsTotal(colors):manualStock;
      const np=normalizeProductColorStock({id:$('#pId').value.trim()||nextCode(),name:$('#pName').value.trim()||'Producto sin nombre',categories:$('#pCats').value.trim(),cost:readMoneyField('#pCost'),price:readMoneyField('#pPrice'),stock:stockValue,colors,colores:colorRowsText(colors),image:images[0]||'',gallery:images.slice(1).join('\n'),promos,description:$('#pDesc').value.trim(),active:true,updatedAt:new Date().toISOString()});
      if(!np.description) np.description=autoProductDescription(np);
      try{
        const ix=state.products.findIndex(x=>x.id===id); if(ix>=0)state.products[ix]=np; else state.products.push(np); state.products=dedupeProducts(state.products); save(); SDCStore.saveBackup(state,'Producto guardado');
        setProductSaveStatus('Producto guardado en este dispositivo.', 'ok');
        closeModal(); render(); toast('✅ Producto guardado. Sincronizando Firebase en segundo plano...');
        saveProductToFirebase(np,id||np.id).then(()=>{
          state.settings.lastFirebaseSync=new Date().toISOString();
          state.settings.lastFirebaseSyncError='';
          const list=pendingFirebaseList().filter(x=>String(x?.id||'')!==String(np.id||''));
          state.settings.pendingFirebaseProducts=list;
          save();
          toast('✅ Producto confirmado en Firebase.');
        }).catch(err=>{
          console.warn('Firebase save pending',err);
          state.settings.lastFirebaseSyncError=firebaseErrorMessage(err);
          const pending=queueFirebaseProduct(np,id||np.id);
          toast(`Producto guardado localmente. Firebase pendiente (${pending}). Toca “Subir a Firebase” cuando tengas internet.`);
        });
      }catch(err){
        console.warn('Product local save failed',err);
        setProductSaveStatus('No se pudo guardar el producto: '+(err.message||err), 'error');
        toast('No se pudo guardar el producto. Revisa los datos.');
      }finally{
        productSaving=false;
        setSaveButtonBusy(btn,false);
      }
    };
    $('#duplicateProduct')&&( $('#duplicateProduct').onclick=async()=>{const cp={...prod,id:nextCode(),name:(prod.name||'Producto')+' copia',active:true}; state.products.push(cp); save(); let remoteOk=false; try{remoteOk=await saveProductToFirebase(cp)}catch(err){console.warn('Firebase duplicate failed',err)} closeModal(); render(); toast(remoteOk?'Producto duplicado en Firebase.':'Producto duplicado localmente.');});
    $('#deleteProduct')&&( $('#deleteProduct').onclick=async()=>{if(confirm('¿Eliminar este producto?')){state.products=state.products.filter(x=>x.id!==id);save(); let remoteOk=false; try{remoteOk=await archiveProductInFirebase(id)}catch(err){console.warn('Firebase archive failed',err)} closeModal();render();toast(remoteOk?'Producto ocultado en Firebase.':'Producto eliminado localmente.')}})
  }

  function productDetailHTML(p){
    const q=clientQty(p.id);
    const routeMode=productDeliveryMode(p.id);
    const productTotal=productItemsTotal(p,q);
    const normal=productNormalTotalQty(p,q);
    const cod=productCodTotalQty(p,q);
    const local=productLocalTotalQty(p,q);
    const st=status(p);
    const stockQty=productStock(p);
    const cost=Math.max(0,Number(p.cost||p.purchase||0));
    const invested=cost*stockQty;
    const gainUnit=Math.max(0,Number(p.price||0)-cost);
    const gainTotal=gainUnit*stockQty;
    const sellAll=Math.max(0,Number(p.price||0))*stockQty;
    const colorsHTML=colorStockHTML(p);
    const promo=promoLabelForMode(p,q,routeMode);
    const colorsShort=colorCompactText(p,5);
    return `<div class="modal-head v49-detail-head v141-detail-head v163-detail-head">
      <div class="v141-head-copy"><span class="sdc-safe-pill detail-pill hn-time-pill" id="hnLiveTime">${nowHNPanel()}</span><h3>${escapeHtml(p.name)}</h3><small>${escapeHtml(firstTag(p))} · ${escapeHtml(p.id||'')}</small></div>
      <button class="close">×</button>
    </div>
      <div class="modal-body v49-product-detail v141-product-detail v163-product-detail ${st.cls==='out'?'is-out':''}">
        <div class="v141-detail-shell v163-detail-shell">
          <section class="v49-detail-hero v141-detail-hero v163-detail-hero ${st.cls==='out'?'is-out':''}">
            <div class="v49-detail-image v141-detail-image v163-detail-image"><img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${st.cls}"><i></i>${st.text}</span></div>
            <div class="v141-detail-mainwrap v163-detail-mainwrap">
              <div class="v49-detail-main v141-detail-main v163-detail-main">
                <small>${escapeHtml(firstTag(p))} · ${escapeHtml(p.id||'')}</small>
                <h4>${escapeHtml(p.name)}</h4>
                ${productClientFactsHTML(p,4)}
              </div>
              <div class="v141-price-box v163-price-box">
                <span>Precio</span>
                <b>${money(p.price)}</b>
                <small>${num(stockQty)} en stock${colorsShort?` · ${escapeHtml(colorsShort)}`:''}</small>
              </div>
            </div>
          </section>

          <div class="v141-meta-grid v163-meta-grid">
            <article><span>Stock total</span><b>${num(stockQty)}</b></article>
            <article><span>Categoría</span><b>${escapeHtml(firstTag(p)||'General')}</b></article>
            <article><span>Código</span><b>${escapeHtml(p.id||'SDC')}</b></article>
            <article><span>Estado</span><b class="v141-state ${st.cls}">${escapeHtml(st.text)}</b></article>
          </div>

          <div class="v49-tabbar v141-tabbar v163-tabbar" role="tablist">
            <button class="active" type="button" data-tab="cliente">CLIENTE</button>
            <button type="button" data-tab="admin">VENTAS</button>
            <button type="button" data-tab="captura">IMAGEN</button>
          </div>

          <section class="v49-tab active" data-panel="cliente">
            <div class="v250-detail-route-switch" role="tablist" aria-label="Ruta del cliente">
              <button type="button" class="${routeMode==='local'?'active':''}" data-v49-route="local" onclick="return window.sdcDetailSetRoute&&window.sdcDetailSetRoute(event,'local')">Comayagua</button>
              <button type="button" class="${routeMode==='hn'?'active':''}" data-v49-route="hn" onclick="return window.sdcDetailSetRoute&&window.sdcDetailSetRoute(event,'hn')">Honduras</button>
            </div>
            <div class="v250-detail-route-note" data-v49-route-note>${routeMode==='local'?'Precio local sin envío. La entrega en Comayagua se cobra según zona.':'En Honduras se muestra envío normal y pagar al recibir.'}</div>
            <div class="v49-qty-line v141-qty-line v163-qty-line v250-qty-line"><div class="v49-qty-wrap"><span>Cantidad</span><div class="v49-qty-stepper" role="group" aria-label="Cantidad del producto"><button type="button" id="v49QtyMinus" aria-label="Restar cantidad" onclick="return window.sdcDetailQty&&window.sdcDetailQty(event,-1)">−</button><b id="v49DetailQty" data-v49-qty-value="${q}">${num(q)}</b><button type="button" id="v49QtyPlus" aria-label="Sumar cantidad" onclick="return window.sdcDetailQty&&window.sdcDetailQty(event,1)">+</button></div></div>${promo?`<em data-v49-offer>🎁 ${escapeHtml(promo)}</em>`:`<em data-v49-offer style="display:none"></em>`}</div>
            <div class="v49-price-cards v141-price-cards v163-price-cards v164-sale-buttons v250-price-cards" data-v49-route-wrap="${routeMode}">
              <button type="button" class="v164-price-option ${routeMode==='local'?'is-main is-current':''}" data-v49-card="local" ${routeMode==='local'?'':'hidden aria-hidden="true"'}><span>Comayagua</span><b data-v49-total="local">${money(local)}</b><small>Precio local según su zona</small></button>
              <button type="button" class="v164-price-option ${routeMode==='hn'?'is-main is-current':''}" data-v49-card="normal" ${routeMode==='hn'?'':'hidden aria-hidden="true"'}><span>Envío normal</span><b data-v49-total="normal">${money(normal)}</b><small>Depósito / Tigo Money</small></button>
              <button type="button" class="v164-price-option" data-v49-card="cod" ${routeMode==='hn'?'':'hidden aria-hidden="true"'}><span>Envío pagar al recibir</span><b data-v49-total="cod">${money(cod)}</b><small>Envío + comisión 10%</small></button>
            </div>
            ${colorsHTML?`<div class="v86-color-client v141-color-card v163-color-card v164-color-card"><div class="v141-card-head"><b>Colores</b></div>${colorsHTML}</div>`:''}
          </section>

          <section class="v49-tab" data-panel="admin">
            <div class="v141-admin-top">
              ${colorsHTML?`<div class="v141-stock-hero"><div class="v141-stock-icon">🎨</div><div><span>Stock por color</span><b>${escapeHtml(defaultColorForProduct(p)||'General')}</b><small>${colorStockSummary(p,6) || `${num(stockQty)} disponible`}</small></div><strong>${num(stockQty)}</strong></div>`:''}
            </div>
            <div class="v49-admin-grid v141-admin-grid">
              <div><span>Stock total</span><b>${num(stockQty)}</b></div>
              <div><span>Invertido</span><b>${moneyPrivate(invested)}</b></div>
              <div><span>Ganancia c/u</span><b>${moneyPrivate(gainUnit)}</b></div>
              <div><span>Ganancia total</span><b>${moneyPrivate(gainTotal)}</b></div>
              <div class="full"><span>Si vende todo el stock</span><b>${money(sellAll)}</b></div>${colorsHTML?`<div class="full v141-admin-colors"><span>Stock por color</span>${colorsHTML}</div>`:''}
            </div>
          </section>

          <section class="v49-tab" data-panel="captura">
            <div class="v49-capture-note v141-capture-note v163-capture-note"><b>Imagen limpia para cliente</b><span>Diseño reducido: producto, precio, cantidad, stock, colores y oferta.</span></div>
            <div id="productShareCard">${productClientPhotoHTML(p,q)}</div>
            <div class="v49-capture-buttons v141-capture-buttons"><button class="btn full" type="button" id="v49DownloadProductPhoto">Generar PNG limpio</button><button class="btn secondary full" type="button" id="v49ShareProductPhotoTab">Compartir foto</button></div>
          </section>
        </div>
        <div class="modal-actions v49-detail-actions v141-detail-actions v163-detail-actions" style="position:static">
          <button class="btn v53-modal-quote" type="button" id="v49QuoteProduct">Añadir cotización</button>
          <button class="btn v53-modal-sell" type="button" id="v49SellProduct" ${st.cls==='out'?'disabled title="Producto agotado"':''}>${st.cls==='out'?'Agotado':'Añadir venta'}</button>
          <button class="btn v53-modal-whatsapp" type="button" id="v53WhatsAppProduct">WhatsApp</button>
          <button class="btn danger stockout-product-btn-v169" type="button" id="v169MarkOutProduct" ${productStock(p)<=0?'disabled title="Ya está agotado"':''}>Agotado</button>
          <button class="btn v53-modal-edit" type="button" id="v49EditProduct">Editar</button>
        </div>
      </div>`;
  }
  async function markExistingProductOut(id){
    const p=productById(id);
    if(!p) return toast('Producto no encontrado.');
    const rows=productColorRows(p);
    if(rows.length){
      p.colors=rows.map(r=>({...r,qty:0}));
      p.colores=colorRowsText(p.colors);
    }
    p.stock=0;
    p.active=true;
    save();
    closeModal();
    render();
    toast('Producto marcado como AGOTADO. Sincronizando Firebase...');
    try{
      await saveProductToFirebase(p,id);
      state.settings.lastFirebaseSync=new Date().toISOString();
      state.settings.lastFirebaseSyncError='';
      save();
      toast('✅ AGOTADO confirmado en Firebase.');
    }catch(err){
      console.warn('Firebase stockout pending',err);
      state.settings.lastFirebaseSyncError=firebaseErrorMessage(err);
      const pending=queueFirebaseProduct(p,id);
      save();
      toast(`Agotado guardado localmente. Firebase pendiente (${pending}).`);
    }
  }

  function bindProductDetails(p){
    let routeMode=productDeliveryMode(p.id);
    let lastActionKey='';
    let lastActionTime=0;
    const swallow=(ev)=>{ if(ev){ ev.preventDefault?.(); ev.stopPropagation?.(); ev.stopImmediatePropagation?.(); } };
    const runOnce=(ev,key,fn)=>{
      const now=Date.now();
      if(lastActionKey===key && now-lastActionTime<280){ swallow(ev); return false; }
      lastActionKey=key; lastActionTime=now;
      swallow(ev);
      fn();
      return false;
    };
    const qtyValue=()=>Math.max(1,Number($('#v49DetailQty',modalRoot)?.dataset.v49QtyValue)||clientQty(p.id)||1);
    const setQtyValue=(next)=>{
      const clean=Math.max(1,Math.min(999,Number(next)||1));
      const el=$('#v49DetailQty',modalRoot);
      if(el){el.dataset.v49QtyValue=String(clean); el.textContent=num(clean);}
      redrawTotals(clean);
    };
    const syncRouteUI=()=>{
      modalRoot.querySelectorAll('[data-v49-route]').forEach(btn=>{
        const active=btn.dataset.v49Route===routeMode;
        btn.classList.toggle('active',active);
        btn.setAttribute('aria-selected',active?'true':'false');
      });
      const currentCard = routeMode==='local' ? 'local' : 'normal';
      modalRoot.querySelectorAll('[data-v49-card]').forEach(card=>{
        const key=card.dataset.v49Card;
        const show = routeMode==='local' ? key==='local' : (key==='normal' || key==='cod');
        card.classList.toggle('is-current', key===currentCard);
        card.classList.toggle('is-visible', show);
        card.classList.toggle('is-hidden', !show);
        card.hidden=!show;
        card.style.setProperty('display', show ? 'grid' : 'none', 'important');
        if(show) card.removeAttribute('aria-hidden');
        else card.setAttribute('aria-hidden','true');
      });
      const wrap=modalRoot.querySelector('[data-v49-route-wrap]'); if(wrap) wrap.dataset.v49RouteWrap=routeMode;
      const note=modalRoot.querySelector('[data-v49-route-note]');
      if(note) note.textContent=routeMode==='local' ? 'Precio local sin envío. La entrega en Comayagua se cobra según zona.' : 'En Honduras se muestra envío normal y pagar al recibir.';
    };
    const redrawTotals=(forcedQty=null)=>{
      const q=Math.max(1,Number(forcedQty)||qtyValue());
      const el=$('#v49DetailQty',modalRoot);
      if(el){ el.dataset.v49QtyValue=String(q); el.textContent=num(q); }
      setClientQty(p.id,q);
      const local=productLocalTotalQty(p,q);
      const normal=productNormalTotalQty(p,q);
      const cod=productCodTotalQty(p,q);
      const offer=promoLabelForMode(p,q,routeMode);
      const set=(key,val)=>{const out=modalRoot.querySelector(`[data-v49-total="${key}"]`); if(out) out.textContent=val;};
      set('local',money(local)); set('normal',money(normal)); set('cod',money(cod));
      const offerEl=modalRoot.querySelector('[data-v49-offer]');
      if(offerEl){offerEl.textContent=offer?`🎁 ${offer}`:''; offerEl.style.display=offer?'inline-flex':'none';}
      syncRouteUI();
      const card=$('#productShareCard',modalRoot); if(card) card.innerHTML=productClientPhotoHTML(p,q);
    };
    const setRoute=(ev,mode)=>runOnce(ev,`route-${mode}`,()=>{
      routeMode=mode==='local'?'local':'hn';
      setProductDeliveryMode(p.id,routeMode);
      redrawTotals();
    });
    const addQty=(ev,delta)=>runOnce(ev,`qty-${delta}`,()=>setQtyValue(qtyValue()+Number(delta||0)));
    window.sdcDetailSetRoute=setRoute;
    window.sdcDetailQty=addQty;

    const detailModalEl = modalRoot.querySelector('.product-detail-modal-v221');
    const handleControls=(ev)=>{
      const routeBtn=ev.target.closest?.('[data-v49-route]');
      if(routeBtn) return setRoute(ev, routeBtn.dataset.v49Route);
      const minus=ev.target.closest?.('#v49QtyMinus');
      if(minus) return addQty(ev,-1);
      const plus=ev.target.closest?.('#v49QtyPlus');
      if(plus) return addQty(ev,1);
    };
    if(detailModalEl && !detailModalEl.dataset.v280Controls){
      detailModalEl.dataset.v280Controls='1';
      detailModalEl.addEventListener('click',handleControls,true);
      detailModalEl.addEventListener('touchend',handleControls,{capture:true,passive:false});
      detailModalEl.addEventListener('pointerup',handleControls,true);
    }

    $$('.v49-tabbar [data-tab]',modalRoot).forEach(btn=>btn.onclick=()=>{
      $$('.v49-tabbar [data-tab]',modalRoot).forEach(x=>x.classList.toggle('active',x===btn));
      $$('.v49-tab',modalRoot).forEach(panel=>panel.classList.toggle('active',panel.dataset.panel===btn.dataset.tab));
    });
    redrawTotals();
    const timeEl=$('#hnLiveTime',modalRoot);
    if(timeEl){
      const paintTime=()=>{ if(!document.body.contains(timeEl)){clearInterval(timeEl._timer); return;} timeEl.textContent=nowHNPanel(); };
      paintTime(); timeEl._timer=setInterval(paintTime,1000);
    }
    $('#v49DownloadProductPhoto',modalRoot)?.addEventListener('click',e=>downloadProductPhotoDirect(p.id,e.currentTarget));
    $('#v49ShareProductPhoto',modalRoot)?.addEventListener('click',()=>shareProductPhoto(p,qtyValue()));
    $('#v49ShareProductPhotoTab',modalRoot)?.addEventListener('click',()=>shareProductPhoto(p,qtyValue()));
    $('#v49QuoteProduct',modalRoot)?.addEventListener('click',()=>{closeModal();openQuote(p.id);});
    $('#v49SellProduct',modalRoot)?.addEventListener('click',()=>{if(productStock(p)<=0){toast('Producto agotado. Primero aumenta el stock en Editar.'); return;} closeModal();openSale(p.id);});
    $('#v53WhatsAppProduct',modalRoot)?.addEventListener('click',()=>sendProductWhatsApp(p,qtyValue()));
    $('#v169MarkOutProduct',modalRoot)?.addEventListener('click',()=>markExistingProductOut(p.id));
    $('#v49EditProduct',modalRoot)?.addEventListener('click',()=>{closeModal();openProductEditor(p.id);});
  }
  function openProductDetails(id){
    const p=productById(id);
    if(!p) return toast('Producto no encontrado.');
    openModal(productDetailHTML(p),true);
    bindProductDetails(p);
  }

  function productClientPhotoHTML(p, qty, imgOverride='', photoIndex=1, photoTotal=1){
    const q=Math.max(1,Number(qty||1));
    const total=productQuotedItemsTotal(p,q);
    const img=String(imgOverride||productImage(p)||'').trim();
    const st=status(p);
    const gift=p.gift || p.regalo || p.obsequio || '';
    const offer=promoLabelForQty(p,q);
    const stockQty=productStock(p);
    const colors=colorCompactText(p,5);
    const photoLabel=photoTotal>1?`<small class="productPhotoCount">Foto ${num(photoIndex)} de ${num(photoTotal)}</small>`:'';
    return `
      <div class="productPhotoClean productPhotoClean-v49 productPhotoClean-v498 productPhotoLandscape-v147 productPhotoClean-v163" data-export="product-photo-clean">
        <div class="productPhotoHead productPhotoHead-v147 productPhotoHead-v163"><img src="${exportLogoSrc()}" alt="SD Comayagua" loading="lazy" decoding="async"><div><strong>SD COMAYAGUA</strong><span>Producto disponible</span>${photoLabel}</div><b>${st.text}</b></div>
        <div class="productPhotoMain-v147 productPhotoMain-v163">
          <div class="productPhotoImageWrap productPhotoImageWrap-v147 productPhotoImageWrap-v163"><img src="${escapeHtml(img)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(captureFallbackImage())}'"></div>
          <div class="productPhotoBody productPhotoBody-v147 productPhotoBody-v163">
            <span class="productPhotoCat-v163">${escapeHtml(firstTag(p)||'Producto')}</span>
            <h2>${escapeHtml(p.name)}</h2>
            <strong class="productPhotoPrice-v163">${money(productQuotedUnit(p))}</strong>
            ${gift?`<div class="gift-strip big">🎁 Regalo: ${escapeHtml(gift)}</div>`:''}
            <div class="productPhotoQty productPhotoQty-v163"><span>Cantidad consultada</span><b>${num(q)} ${q===1?'unidad':'unidades'} · ${money(total)}</b></div>
            <div class="productPhotoFacts-v163"><span>Stock <b>${num(stockQty)}</b></span>${colors?`<span>Colores <b>${escapeHtml(colors)}</b></span>`:''}${offer?`<span>Oferta <b>${escapeHtml(offer.replace('Oferta aplicada: ',''))}</b></span>`:''}</div>
            <div class="productPhotoNote productPhotoNote-v163">Precio sujeto a disponibilidad. Consulta por WhatsApp.</div>
          </div>
        </div>
        <div class="productPhotoFooter productPhotoFooter-v163">SD COMAYAGUA · WhatsApp +504 3151-7755</div>
      </div>`;
  }

  function waitImages(root,timeout=4500){
    const imgs=Array.from(root.querySelectorAll('img'));
    if(!imgs.length) return Promise.resolve();
    return Promise.all(imgs.map(img=>new Promise(resolve=>{
      if(img.complete) return resolve();
      const done=()=>resolve();
      const t=setTimeout(done,timeout);
      img.addEventListener('load',()=>{clearTimeout(t);done();},{once:true});
      img.addEventListener('error',()=>{clearTimeout(t);done();},{once:true});
    })));
  }
  function downloadBlob(blob,filename){
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1200);
  }
  async function ensureHtml2Canvas(){
    if(window.html2canvas) return true;
    if(!window.__sdcHtml2CanvasPromise){
      window.__sdcHtml2CanvasPromise = new Promise((resolve)=>{
        const script=document.createElement('script');
        script.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.async=true;
        script.onload=()=>resolve(true);
        script.onerror=()=>resolve(false);
        document.head.appendChild(script);
      });
    }
    await Promise.race([window.__sdcHtml2CanvasPromise, new Promise(r=>setTimeout(()=>r(false),8500))]);
    return !!window.html2canvas;
  }
  function askClientPhone(){
    const typed=prompt('Número WhatsApp del cliente. Déjelo vacío para elegir el chat manualmente en WhatsApp:','');
    return typed===null?null:typed.trim();
  }
  function productWhatsAppText(p,qty=1){
    const q=Math.max(1,Number(qty)||1);
    const total=productQuotedItemsTotal(p,q);
    const normal=total+SHIPPING.normal.fee;
    const cod=codGrandTotal(total+SHIPPING.cod.fee);
    const offer=promoLabelForQty(p,q);
    const colors=colorCompactText(p,6);
    const stockQty=productStock(p);
    const colorLine=colors?`\n🎨 *Colores disponibles:* ${colors}`:'';
    const offerLine=offer?`\n🏷️ *Oferta disponible:* ${offer.replace('Oferta aplicada: ','')}`:'';
    return `✨ *PRODUCTO DISPONIBLE - SD COMAYAGUA*
━━━━━━━━━━━━━━━━━━━━

🛍️ *${p.name}*

💵 *Precio del producto:* ${money(productQuotedUnit(p))}
🔢 *Cantidad consultada:* ${num(q)}
🧾 *Subtotal:* *${money(total)}*
📦 *Stock disponible:* ${num(stockQty)}${colorLine}${offerLine}

🚚 *Opciones para recibir:*
1️⃣ *Depósito / Tigo Money:* ${money(normal)}
2️⃣ *Pagar al recibir:* ${money(cod)}
3️⃣ *Envío local:* ${LOCAL_PLACEHOLDER}

✅ *Importante:* precio y disponibilidad se confirman antes de cerrar el pedido.

🏪 *SD COMAYAGUA*
📲 WhatsApp: +504 3151-7755`;
  }


  function categorySnapshotTitle(){
    if(filter.special==='lowStock') return 'Productos en bajo stock';
    if(filter.special==='outStock') return 'Productos agotados';
    if(filter.special==='noImage') return 'Productos sin imagen';
    return filter.cat&&filter.cat!=='Todos'?filter.cat:'Catálogo disponible';
  }
  function categorySnapshotList(){
    const list=filteredProducts();
    if(filter.special==='outStock') return list;
    return list.filter(p=>productStock(p)>0);
  }
  function categorySnapshotSummary(list){
    const arr=list||[];
    const units=arr.reduce((a,p)=>a+productStock(p),0);
    const prices=arr.map(p=>productQuotedUnit(p)).filter(n=>n>0);
    const min=prices.length?Math.min(...prices):0;
    const max=prices.length?Math.max(...prices):0;
    return {units,min,max};
  }
  function categorySnapshotDisplayTitle(raw){
    const t=String(raw||'Catálogo disponible').trim();
    if(!t) return 'Catálogo disponible';
    if(t===t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(t)) return t.toLowerCase().replace(/(^|[\s/.-])([a-záéíóúñ])/g,(m,p1,p2)=>p1+p2.toUpperCase());
    return t;
  }
  function categorySnapshotHTML(list,title){
    const source=list||[];
    const visible=source.slice(0,6);
    const hidden=Math.max(0,source.length-visible.length);
    const sum=categorySnapshotSummary(source);
    const prettyTitle=categorySnapshotDisplayTitle(title);
    const priceRange=sum.min&&sum.max?(sum.min===sum.max?money(sum.min):`Lps. ${num(sum.min)} – ${num(sum.max)}`):'Consultar';
    const gridModeClass=visible.length===1?' is-single':(visible.length===2?' is-centered':'');
    const rows=visible.map(p=>{
      const stockQty=productStock(p);
      const colors=colorCompactText(p,3);
      const offer=promoCompactText(p);
      const st=status(p);
      const statusLabel=st.cls==='out'?'Agotado':st.cls==='low'?'Pocas unidades':'Disponible';
      return `<article class="categoryShareItem-v199 ${st.cls==='out'?'is-out':''}">
        <div class="categorySharePhoto-v199">
          <img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'">
          <span class="categoryShareStatus-v199 ${st.cls}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="categoryShareInfo-v199">
          <small>${escapeHtml(firstTag(p)||'Producto')} · ${escapeHtml(p.id||'SDC')}</small>
          <h3>${escapeHtml(p.name)}</h3>
          <div class="categorySharePriceRow-v199"><strong>${money(productQuotedUnit(p))}</strong><em>${num(stockQty)} disp.</em></div>
          <div class="categoryShareMeta-v199">${colors?`<span>🎨 ${escapeHtml(colors)}</span>`:''}${offer?`<span>🏷️ ${escapeHtml(offer)}</span>`:''}</div>
        </div>
      </article>`;
    }).join('') || `<div class="categoryShareEmpty-v199">Sin productos disponibles para mostrar.</div>`;
    return `<section class="categoryShareClean-v199" data-export="category-share-clean">
      <header class="categoryShareHead-v199">
        <div class="categoryShareBrand-v199">
          <img src="${exportLogoSrc()}" alt="SD Comayagua" loading="lazy" decoding="async">
          <div><span>SD COMAYAGUA</span><h2>${escapeHtml(prettyTitle)}</h2><p>Vista rápida para cliente · ${nowHNPanel()}</p></div>
        </div>
        <div class="categoryShareSummary-v199">
          <article><b>${num(source.length)}</b><span>Productos</span></article>
          <article><b>${num(sum.units)}</b><span>Unidades</span></article>
          <article class="wide"><b>${escapeHtml(priceRange)}</b><span>Rango de precios</span></article>
        </div>
      </header>
      <div class="categoryShareNotice-v199">Productos disponibles para cotizar. Precios sujetos a disponibilidad al momento de confirmar.</div>
      <div class="categoryShareGrid-v199${gridModeClass}">${rows}</div>
      ${hidden?`<div class="categoryShareMore-v199">+ ${num(hidden)} productos más disponibles en esta categoría</div>`:''}
      <footer class="categoryShareFooter-v199">
        <b>WhatsApp +504 3151-7755</b>
        <span>Envíos a domicilio · Depósito/Tigo Money · Pagar al recibir según zona</span>
      </footer>
    </section>`;
  }
  async function exportCategorySnapshot(mode='download'){
    const list=categorySnapshotList();
    if(!list.length) return toast('No hay productos disponibles en esta categoría para capturar.');
    const title=categorySnapshotTitle();
    const host=document.createElement('div');
    host.className='categoryShareExportHost-v199';
    document.body.appendChild(host);
    try{
      host.innerHTML=categorySnapshotHTML(list,title);
      await waitImages(host,6500);
      const node=host.querySelector('[data-export="category-share-clean"]');
      const blob=await captureNodeAsPngBlob(node,2.2);
      if(!blob) throw new Error('No se pudo crear la imagen.');
      const fileName=`categoria-${slugFile(title)}-${fileStamp()}.png`;
      const file=new File([blob],fileName,{type:'image/png'});
      if(mode==='share' && navigator.share && navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({files:[file],title:`SD Comayagua · ${title}`,text:`${title} · ${num(list.length)} productos disponibles`});
        toast('Imagen de categoría lista para compartir.');
      }else{
        downloadBlob(blob,fileName);
        toast('Catálogo de categoría descargado en PNG.');
      }
    }catch(err){
      console.error(err);
      toast('No se pudo generar la captura. Intenta otra vez cuando carguen las fotos.');
    }finally{host.remove();}
  }
  function openCategoryPrintPreview(){
    const list=categorySnapshotList();
    if(!list.length) return toast('No hay productos disponibles en esta categoría para imprimir.');
    const title=categorySnapshotTitle();
    openModal(`<div class="modal-head category-print-head-v199"><div><small>Vista para cliente</small><h3>Catálogo por categoría</h3></div><button class="close">×</button></div><div class="modal-body categoryPrintModal-v199"><div class="categorySharePrint-v199">${categorySnapshotHTML(list,title)}</div><div class="modal-actions categoryPrintActions-v199" style="position:static"><button class="btn" id="downloadCategoryV163">Descargar PNG</button><button class="btn secondary" id="shareCategoryV199">Compartir</button><button class="btn ghost" id="printCategoryV163">Imprimir</button></div></div>`,true);
    $('#printCategoryV163',modalRoot)?.addEventListener('click',()=>window.print());
    $('#downloadCategoryV163',modalRoot)?.addEventListener('click',()=>exportCategorySnapshot('download'));
    $('#shareCategoryV199',modalRoot)?.addEventListener('click',()=>exportCategorySnapshot('share'));
  }

  async function captureNodeAsPngBlob(node, scale=3){
    const ok=await ensureHtml2Canvas();
    if(!ok) throw new Error('html2canvas no está disponible todavía.');
    const safeScale=isMobileDevice()?Math.min(scale,1.6):Math.min(scale,2.2);
    const canvas = await html2canvas(node, {
      scale:safeScale,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: Math.max(document.documentElement.clientWidth, node.scrollWidth || 1200),
      windowHeight: Math.max(document.documentElement.clientHeight, node.scrollHeight || node.offsetHeight || 1600)
    });
    return await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.98));
  }

  async function downloadProductPhotoDirect(id, btn){
    const p = productById(id);
    if(!p) return toast('Producto no encontrado.');
    const original = btn?.textContent || btn?.innerHTML;
    if(btn){ btn.disabled = true; btn.textContent = 'GENERANDO...'; }
    const images = galleryOf(p).slice(0,6);
    const safeImages = images.length ? images : [productImage(p)||captureFallbackImage()];
    const host = document.createElement('div');
    host.className = 'productPhotoExportHost';
    document.body.appendChild(host);
    try{
      let count=0;
      for(const [idx,imgSrc] of safeImages.entries()){
        host.innerHTML = productClientPhotoHTML(p, clientQty(p.id), imgSrc, idx+1, safeImages.length);
        await waitImages(host);
        const node = host.querySelector('[data-export="product-photo-clean"]');
        let blob = null;
        try{
          blob = await captureNodeAsPngBlob(node, 3);
        }catch(firstErr){
          console.warn('Primer intento de captura falló. Reintentando con imagen segura.', firstErr);
          host.querySelectorAll('.productPhotoImageWrap img').forEach(img=>img.src=captureFallbackImage());
          await waitImages(host);
          blob = await captureNodeAsPngBlob(node, 3);
        }
        if(blob){
          const suffix=safeImages.length>1?`-foto-${idx+1}`:'';
          const filename = `producto-${slugFile(p.name||p.id||'producto')}${suffix}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`;
          downloadBlob(blob, filename);
          count++;
          await sleep(180);
        }
      }
      toast(count>1?`${count} fotos limpias descargadas.`:'PNG limpio descargado sin barra del navegador.');
    }catch(err){
      console.error(err);
      toast('No se pudo generar la foto del producto. Verifique que la librería html2canvas cargó.');
    }finally{
      host.remove();
      if(btn){ btn.disabled = false; btn.innerHTML = original || 'FOTO'; }
    }
  }

  async function productCardToBlob(){
    const el=$('#productShareCard',modalRoot);
    const blob=await captureNodeToBlob(el,'#07111f');
    if(!blob) toast('No se pudo generar la imagen. Revisa si la foto del producto terminó de cargar.');
    return blob;
  }

  async function downloadProductPhoto(p){const blob=await productCardToBlob(); if(!blob)return; const ref=prompt('Nombre o número del cliente para guardar esta imagen. Puedes dejarlo vacío:', state.settings.lastClientFileRef||''); if(ref===null)return; state.settings.lastClientFileRef=ref.trim(); save(); const label=slugFile(ref||p.name||p.id||'producto'); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`producto-${label}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast('Imagen del producto descargada con nombre único.');}
  async function shareProductPhoto(p,qty=1){
    const q=Math.max(1,Number(qty)||1);
    const text=productWhatsAppText(p,q);
    const ref=prompt('Número o nombre del cliente para nombrar la imagen. Déjelo vacío para compartir manual:', state.settings.lastClientFileRef||'');
    if(ref===null)return;
    state.settings.lastClientFileRef=ref.trim(); save();
    const images=galleryOf(p).slice(0,6);
    const safeImages=images.length?images:[productImage(p)||captureFallbackImage()];
    const host=document.createElement('div');
    host.className='productPhotoExportHost';
    document.body.appendChild(host);
    try{
      const files=[];
      for(const [idx,imgSrc] of safeImages.entries()){
        host.innerHTML=productClientPhotoHTML(p,q,imgSrc,idx+1,safeImages.length);
        await waitImages(host);
        const node=host.querySelector('[data-export="product-photo-clean"]');
        let blob=null;
        try{
          blob=await captureNodeAsPngBlob(node,3);
        }catch(firstErr){
          console.warn('No se pudo capturar con imagen externa. Usando respaldo.',firstErr);
          host.querySelectorAll('.productPhotoImageWrap img').forEach(img=>img.src=captureFallbackImage());
          await waitImages(host);
          blob=await captureNodeAsPngBlob(node,3);
        }
        if(blob){
          const suffix=safeImages.length>1?`-foto-${idx+1}`:'';
          const filename=`producto-${slugFile(ref||p.name||p.id||'producto')}${suffix}-${fileStamp()}-${slugFile(p.id||'sdc')}.png`;
          files.push(new File([blob],filename,{type:'image/png'}));
        }
      }
      if(files.length && navigator.canShare && navigator.canShare({files})){
        try{await navigator.share({files,text,title:'Producto SD Comayagua'}); toast(files.length>1?'Seleccione WhatsApp; se compartirán todas las fotos.':'Seleccione WhatsApp y el chat del cliente.'); return;}catch(e){if(e && e.name==='AbortError')return;}
      }
      if(files.length){
        files.forEach(file=>downloadBlob(file,file.name));
        toast(files.length>1?'Se descargaron las fotos para compartirlas por WhatsApp.':'La foto se descargó para compartirla por WhatsApp.');
      }else toast('No se pudo generar la foto del producto.');
    }catch(err){
      console.error(err);
      toast('No se pudo compartir la foto. Verifique que cargó html2canvas.');
    }finally{
      host.remove();
    }
  }
  function sendProductWhatsApp(p,qty=1){const phone=askClientPhone(); if(phone===null)return; openWhatsApp(phone,productWhatsAppText(p,qty));}

  function quoteModalHTML(isSale=false){
    const doc=isSale?saleDraft:quote;
    const editingSale=isSale && !!doc.editingId;
    const title=isSale?(editingSale?'Editar factura':'Venta / factura real'):'Cotización previa';
    const currentTitle=isSale?'Factura actual':'Cotización actual';
    const c=calc(doc);
    const itemCount=(doc.items||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const giftCount=(doc.gifts||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const countText=`${num(itemCount)} ${itemCount===1?'artículo':'artículos'}${giftCount?` · ${num(giftCount)} regalo${giftCount===1?'':'s'}`:''}`;
    const statusLabel=isSale?(editingSale?'Editando factura':'Factura'):'Cotización';
    const icons={
      receipt:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.6-2 1.1-2-1.1-2 1.1-2-1.1L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      list:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>',
      gift:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 10h16v10H4V10Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v10M3 7h18v3H3V7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 7c-3.4 0-5-1.1-5-2.5C7 3.7 7.7 3 8.6 3c1.8 0 3.4 4 3.4 4Zm0 0c3.4 0 5-1.1 5-2.5 0-.8-.7-1.5-1.6-1.5C13.6 3 12 7 12 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      user:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" stroke-width="2"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      box:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      eye:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2"/></svg>',
      save:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h12l2 2v14H5V4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 4v6h8V4M8 20v-6h8v6" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
      invoice:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10a2 2 0 0 1 2 2v16l-3-1.3-2 1.3-2-1.3-2 1.3-2-1.3L5 21V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 9h6M9 13h6M9 17h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      whatsapp:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.4 19.6 5.6 16A8 8 0 1 1 8 18.4l-3.6 1.2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 8.8c.5 3 2.2 4.7 5.2 5.2l1.1-1.4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      image:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v14H4V5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m6.5 17 4.2-4.2 3 3 1.5-1.5L19 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 9.5h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
      short:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 8h5M9.5 12h5M9.5 16h3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      history:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.35-5.65L4 8.7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4v4.7h4.7M12 7.5V12l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      clients:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 21a6.5 6.5 0 0 1 13 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M17 11a3 3 0 1 0 0-6M18 15c2.2.7 3.5 2.6 3.5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      back:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 7 5 12l5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 12h10a4 4 0 0 1 4 4v1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      chevron:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m7 10 5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      check:'<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    const step=(jump,icon,label,active=false)=>`<button type="button" class="${active?'active':''}" data-jump="${jump}"><i aria-hidden="true">${icons[icon]}</i><span>${label}</span></button>`;
    const action=(cls,id,icon,label)=>`<button class="btn ${cls}" id="${id}"><i class="sdc-action-icon-v176" aria-hidden="true">${icons[icon]}</i><span>${label}</span></button>`;
    const quoteActions=!isSale
      ? action('save-doc sdc-action-btn-v176 sdc-action-primary-v176 sdc-action-save-v176','saveQuote','save','Guardar')+
        action('main-wide to-sale sdc-action-btn-v176 sdc-action-blue-v176','toSale','invoice','Facturar')+
        action('secondary sdc-action-btn-v176 sdc-action-whatsapp-v176','waText','whatsapp','Enviar WhatsApp')+
        action('secondary sdc-action-btn-v176 sdc-action-image-v176','downloadDoc','image','Descargar imagen')+
        action('secondary sdc-action-btn-v176 sdc-action-receipt-v176','shortReceipt','short','Recibo corto')+
        action('secondary sdc-action-btn-v176 sdc-action-history-v176','openQuotes','history','Historial')+
        action('secondary sdc-action-btn-v176 sdc-action-clients-v176','openClientsFromDoc','clients','Clientes')+
        action('secondary sdc-action-btn-v176 sdc-action-back-v176','backToQuote','back','Volver')
      : action('main-wide sdc-action-btn-v176 sdc-action-blue-v176','finishSale','check',editingSale?'Guardar':'Finalizar')+
        action('secondary sdc-action-btn-v176 sdc-action-whatsapp-v176','waText','whatsapp','Enviar WhatsApp')+
        action('secondary sdc-action-btn-v176 sdc-action-image-v176','downloadDoc','image','Descargar imagen')+
        action('secondary sdc-action-btn-v176 sdc-action-receipt-v176','shortReceipt','short','Recibo corto')+
        action('secondary sdc-action-btn-v176 sdc-action-history-v176','printDoc','invoice','PDF')+
        action('secondary sdc-action-btn-v176 sdc-action-back-v176','backToQuote','back','Volver');
    return `<div class="modal-head quote-head quote-head-v176"><div class="quote-head-title-v176"><span class="quote-head-icon-v176">${icons.receipt}</span><div><h3>${title}</h3><span class="quote-status quote-status-v176"><span class="dot"></span>${statusLabel}</span></div></div><button class="close">×</button></div><div class="modal-body quote-body quote-body-v176"><div class="quote-jumpbar quote-steps-v176 no-print">${step('currentDocBox','list','Lista',true)}${step('giftCardBox','gift','Regalos')}${step('calcCardBox','user','Datos')}${step('pickerCardBox','box','Productos')}${step('docPreview','eye','Vista previa')}</div><div class="modal-grid quote-grid quote-grid-v153 quote-grid-v176"><div class="card-box current-card current-card-v176" id="currentDocBox"><div class="current-card-head current-card-head-v176"><span class="sdc-section-icon-v176">${icons.receipt}</span><div class="sdc-card-title-copy-v176"><h4 id="currentDocTitle">${currentTitle}</h4><small>${isSale?'Venta en curso':'Lista y total'}</small></div><span class="sdc-step-bubble-v176"><b>1</b><small>${isSale?'Factura':'Cotización'}</small></span></div><div class="quote-summary-strip-v176"><div class="quote-summary-cell-v176 quote-count-cell-v176"><span class="summary-cell-icon-v176">${icons.box}</span><b id="selectedCountPill" class="selected-count-pill selected-count-pill-v176">${countText}</b></div><div class="quote-summary-cell-v176 quote-products-cell-v176"><span>Productos</span><strong id="productsMini">${money(c.products)}</strong></div><button class="quote-summary-chevron-v176" type="button" data-jump="totalsMini" aria-label="Ver total">${icons.chevron}</button></div><div id="cartNotice" class="cart-notice hide"><b>✓ Artículo seleccionado</b></div><div id="cartList" class="cart-list cart-list-v176"></div><div id="totalsMini" class="totals-mini-v176"></div></div><div class="card-box span2 gift-card-box gift-card-box-v176" id="giftCardBox"><div class="gift-head gift-head-v176"><div class="gift-title-v176"><span class="sdc-section-icon-v176">${icons.gift}</span><div><h4>Regalos incluidos</h4><small>Bonos agregados</small></div></div><button class="btn secondary" type="button" id="toggleGiftPicker"><span>+ Incluir regalo</span></button></div><div id="giftPickerPanel" class="gift-picker-panel hide"><div class="searchbar"><span class="icon">⌕</span><input id="giftSearch" placeholder="Buscar producto para regalar..."></div><div id="giftPickerList" class="gift-picker-list"></div></div><div id="giftList" class="gift-list gift-list-v176"></div></div><div class="card-box calc-card calc-card-v176" id="calcCardBox"><div class="mini-section-head-v176"><span class="sdc-section-icon-v176">${icons.user}</span><h4>Datos para calcular</h4></div>${fieldsHTML(doc)}</div><div class="card-box span2 picker-card picker-card-v176" id="pickerCardBox"><div class="picker-head-compact picker-head-v176"><div class="mini-section-head-v176"><span class="sdc-section-icon-v176">${icons.box}</span><b>Seleccionar producto</b></div><span id="pickerCounter" class="found-pill">Todos los productos</span></div><div class="searchbar"><span class="icon">⌕</span><input id="pickSearch" placeholder="Buscar producto..."></div><div class="quote-picker-control-v200"><button type="button" class="quote-category-main-v200" id="togglePickCategories"><span>Elegir</span><b>Categoría</b></button><small>Los productos aparecen solo al elegir categoría o buscar.</small></div><div class="quote-category-list-v201" id="pickChips">${allCategories().map(c=>`<button type="button" class="quote-cat-card-v201" data-pickcat="${escapeHtml(c)}"><span>${escapeHtml(c==='Todos'?'Todos':c)}</span><b>${num(categoryCount(c))}</b><small>${c==='Todos'?'Todo el catálogo':'Ver categoría'}</small></button>`).join('')}</div><div id="pickerList" class="picker-list picker-list-v200"></div></div><div class="span2 preview-card preview-card-v176"><div id="docPreview">${docCard(doc,isSale)}</div></div></div><div class="modal-actions quote-actions quote-actions-v176 premium-actions compact-actions v47-actions v49-actions-clean v49-actions-readable v49-actions-textonly">${quoteActions}</div></div>`
  }
  function fieldsHTML(doc){
    const type=shippingKey(doc);
    const localHint=isLocalDoc(doc)?'<small class="field-hint">Envío local: escriba manualmente el cobro acordado con el cliente.</small>':'';
    return `<div class="modal-grid"><label><span class="label">Cliente opcional</span><input class="input bindDoc" data-k="client" value="${escapeHtml(doc.client)}"></label><label><span class="label">Teléfono cliente / WhatsApp</span><input class="input bindDoc" data-k="phone" inputmode="tel" value="${escapeHtml(doc.phone)}" placeholder="Sin +504 también funciona"></label><label><span class="label">Departamento</span><select class="select bindDoc" data-k="department">${SDC_DEPARTMENTS.map(d=>`<option ${doc.department===d?'selected':''}>${d}</option>`).join('')}</select></label><label><span class="label">Municipio</span><select class="select bindDoc" data-k="municipality"></select></label><label class="span2 quote-route-box-v250"><span class="label">Ruta rápida</span><div class="quote-route-switch-v250"><button type="button" class="${type==='local'?'active':''}" data-quote-route="local">Comayagua</button><button type="button" class="${type!=='local'?'active':''}" data-quote-route="hn">Honduras</button></div><small class="field-hint">Local deja el producto sin envío. Honduras trabaja con envío normal o pagar al recibir.</small></label><label class="span2"><span class="label">Referencia / barrio / colonia</span><input class="input bindDoc" data-k="reference" value="${escapeHtml(doc.reference)}"></label><label class="span2"><span class="label">Tipo de cobro / envío</span><select class="select bindDoc" data-k="shippingType"><option value="Normal" ${type==='normal'?'selected':''}>Depósito: Lps. 110</option><option value="COD" ${type==='cod'?'selected':''}>Envío Pagar al Recibir: Lps. 110 + comisión 10%</option><option value="Local" ${type==='local'?'selected':''}>Envío Local: Por definir</option></select>${localHint}</label><label><span class="label">Empresa / entrega</span><select class="select bindDoc" data-k="company"><option>Domicilio</option><option>Forza</option><option>C807</option><option>Cargo Expreso</option><option>Entrega local</option><option>Domicilio local</option><option>Retiro en tienda</option><option>Bus local</option></select></label><label><span class="label">Estado</span><select class="select bindDoc" data-k="status"><option>Cotizado</option><option>Esperando respuesta</option><option>Cliente interesado</option><option>Pendiente de pago</option><option>Vendido</option><option>Pagar al recibir</option><option>Entrega local</option><option>Cancelado</option></select></label><label><span class="label">Envío Lps.</span><input class="input bindDoc" data-k="shipping" type="number" value="${doc.shipping}" placeholder="${isLocalDoc(doc)?'Escriba el costo local':'Costo de envío'}">${localHint}</label><label><span class="label">Descuento Lps.</span><input class="input bindDoc" data-k="discount" type="number" value="${doc.discount}"></label></div>`
  }
  function bindDocFields(isSale){
    const doc=isSale?saleDraft:quote; if(!doc.shippingType) doc.shippingType=doc.cod?'COD':'Normal';
    const mun=$('[data-k="municipality"]',modalRoot);
    function fillMun(){const dep=$('[data-k="department"]',modalRoot).value; const list=SDC_MUNICIPALITIES[dep]||[]; mun.innerHTML=list.map(m=>`<option ${doc.municipality===m?'selected':''}>${m}</option>`).join('')+'<option>Otro municipio</option>'; if(!list.includes(doc.municipality)) mun.value=list[0]||'Otro municipio'; doc.department=dep; doc.municipality=mun.value}
    function syncShippingUI(force=false){const sel=$('[data-k="shippingType"]',modalRoot); if(!sel)return; applyShippingPreset(doc,sel.value,force); const ship=$('[data-k="shipping"]',modalRoot); if(ship) ship.value=Number(doc.shipping||0); const company=$('[data-k="company"]',modalRoot); if(company && Array.from(company.options).some(o=>o.value===doc.company)) company.value=doc.company;}
    fillMun(); const company=$('[data-k="company"]',modalRoot); if(company){company.value=doc.company||'Forza'; if(company.value!==doc.company && doc.company) company.insertAdjacentHTML('beforeend',`<option selected>${escapeHtml(doc.company)}</option>`)} if($('[data-k="status"]',modalRoot)) $('[data-k="status"]',modalRoot).value=doc.status||'Cotizado'; $('[data-k="shippingType"]',modalRoot).value=shippingKey(doc)==='cod'?'COD':shippingKey(doc)==='local'?'Local':'Normal'; syncShippingUI(false);
    const paintRouteButtons=()=>$$('[data-quote-route]',modalRoot).forEach(btn=>btn.classList.toggle('active', (btn.dataset.quoteRoute==='local')===isLocalDoc(doc)));
    paintRouteButtons();
    $$('[data-quote-route]',modalRoot).forEach(btn=>btn.onclick=()=>{
      const depSel=$('[data-k="department"]',modalRoot); const shipSel=$('[data-k="shippingType"]',modalRoot); const compSel=$('[data-k="company"]',modalRoot);
      if(btn.dataset.quoteRoute==='local'){
        doc.department='Comayagua';
        if(depSel) depSel.value='Comayagua';
        fillMun();
        doc.shippingType='Local';
        if(shipSel) shipSel.value='Local';
        syncShippingUI(true);
        doc.company='Entrega local';
        if(compSel) compSel.value='Entrega local';
      }else{
        doc.shippingType='Normal';
        if(shipSel) shipSel.value='Normal';
        syncShippingUI(true);
        if(doc.company==='Entrega local' || doc.company==='Domicilio local') doc.company='Forza';
        if(compSel) compSel.value=doc.company||'Forza';
      }
      paintRouteButtons();
      refreshQuoteUI(isSale);
      toast(btn.dataset.quoteRoute==='local'?'Modo Comayagua aplicado.':'Modo Honduras aplicado.');
    });
    $$('.bindDoc',modalRoot).forEach(el=>el.oninput=el.onchange=()=>{let v=el.value; if(el.dataset.k==='shipping'||el.dataset.k==='discount')v=+v||0; doc[el.dataset.k]=v; if(el.dataset.k==='phone') autoFillClientByPhone(doc,isSale); if(el.dataset.k==='department')fillMun(); if(el.dataset.k==='shippingType'){syncShippingUI(true); paintRouteButtons(); toast(`${shippingLabel(doc)} aplicado.`)} if(el.dataset.k==='shipping' && isLocalDoc(doc)) doc.shippingType='Local'; paintRouteButtons(); refreshQuoteUI(isSale);});
  }

  function renderPicker(isSale){
    const list=$('#pickerList',modalRoot);
    const counter=$('#pickerCounter',modalRoot);
    const chipsWrap=$('#pickChips',modalRoot);
    const toggleBtn=$('#togglePickCategories',modalRoot);
    let q='';
    let cat='';
    const localNorm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    function selectedLabel(){return cat?`Categoría: ${cat}`:'Elija categoría';}
    function showEmpty(title,text,countText=selectedLabel()){
      if(counter) counter.textContent=countText;
      if(!list) return;
      list.innerHTML=`<div class="picker-empty picker-empty-v200"><b>${escapeHtml(title)}</b><span>${escapeHtml(text)}</span></div>`;
    }
    function setActiveChip(){
      $$('[data-pickcat]',modalRoot).forEach(x=>x.classList.toggle('active',!!cat && localNorm(x.dataset.pickcat)===localNorm(cat)));
      if(toggleBtn){
        toggleBtn.classList.toggle('has-category',!!cat);
        toggleBtn.querySelector('b') && (toggleBtn.querySelector('b').textContent=cat||'Categoría');
      }
    }
    function draw(){
      setActiveChip();
      const term=localNorm(q);
      const rawTerm=(q||'').trim();
      const hasSearch=term.length>=2;
      if(!cat && !hasSearch){
        showEmpty('Seleccione una categoría','Los productos están ocultos para que el scroll sea corto. Toque “Categoría” y elija una sección, o busque por nombre/código con 2 letras.','Elija categoría');
        return;
      }
      if(rawTerm.length>0 && rawTerm.length<2 && !cat){
        showEmpty('Buscador listo','Escriba al menos 2 letras para buscar en todo el inventario, o toque una categoría.','Escriba 2 letras');
        return;
      }
      const catKey=localNorm(cat);
      const allItems=activeProducts().filter(p=>{
        const okCat=!cat || catKey==='todos' || productTags(p).map(localNorm).includes(catKey);
        const searchable=[p.name,p.id,categoryText(p),p.category,p.categoria,p.etiquetas].join(' ');
        const okSearch=!hasSearch || localNorm(searchable).includes(term);
        return okCat && okSearch;
      });
      const maxPick=isMobileDevice()?36:80;
      const items=allItems.slice(0,maxPick);
      if(counter) counter.textContent=allItems.length ? `${allItems.length} visibles` : 'Sin resultados';
      const limitNote=allItems.length>items.length?`<div class="picker-limit-note picker-limit-note-v200">Mostrando ${items.length} de ${allItems.length}. Use el buscador para encontrar más rápido.</div>`:'';
      list.innerHTML=(items.map(p=>`<div class="picker-item picker-item-v200"><img loading="lazy" decoding="async" src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(productQuotedUnit(p))} · Stock ${num(productStock(p))}${colorStockSummary(p,2)?` · ${escapeHtml(colorStockSummary(p,2))}`:''} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small add-pick-btn" type="button" data-additem="${escapeHtml(p.id)}">Añadir</button></div>`).join('')+limitNote)||'<div class="picker-empty"><b>Sin productos para mostrar</b><span>Pruebe otra categoría o revise el texto de búsqueda.</span></div>';
      $$('[data-additem]',list).forEach(b=>b.onclick=()=>addDocItem(b.dataset.additem,isSale,b));
    }
    $('#pickSearch',modalRoot).oninput=e=>{q=e.target.value;draw()};
    if(toggleBtn && chipsWrap){
      toggleBtn.onclick=()=>chipsWrap.classList.toggle('is-open');
    }
    $$('[data-pickcat]',modalRoot).forEach(b=>{
      b.classList.remove('active');
      b.onclick=()=>{
        const next=b.dataset.pickcat || 'Todos';
        if(cat && localNorm(cat)===localNorm(next)){
          cat='';
          if(chipsWrap) chipsWrap.classList.remove('is-open');
          draw();
          return;
        }
        cat=next;
        if(chipsWrap) chipsWrap.classList.remove('is-open');
        draw();
      };
    });
    draw();
  }
  function addDocItem(id,isSale,triggerBtn=null){
    const p=productById(id); if(!p)return;
    const doc=isSale?saleDraft:quote;
    const color=defaultColorForProduct(p);
    const found=doc.items.find(x=>x.id===id && colorKey(selectedColorLabel(x))===colorKey(color));
    if(found)found.qty++; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:1,color,image:productImage(p)});
    refreshQuoteUI(isSale);
    const qty=found?found.qty:1;
    const notice=$('#cartNotice',modalRoot);
    if(notice){notice.classList.remove('hide'); notice.innerHTML=`<b>✓ Artículo seleccionado</b><span>${escapeHtml(p.name)}${color?` · ${escapeHtml(color)}`:''} · cantidad ${num(qty)}</span>`; clearTimeout(window.__sdcCartNoticeTimer); window.__sdcCartNoticeTimer=setTimeout(()=>notice.classList.add('hide'),3000);}
    if(triggerBtn){
      const card=triggerBtn.closest('.picker-item');
      if(card){
        card.classList.add('is-selected');
        clearTimeout(card._pickedTimer);
        card._pickedTimer=setTimeout(()=>card.classList.remove('is-selected'),1400);
      }
      const original=triggerBtn.dataset.originalLabel || triggerBtn.textContent;
      triggerBtn.dataset.originalLabel=original;
      triggerBtn.textContent='✓ Seleccionado';
      triggerBtn.disabled=true;
      clearTimeout(triggerBtn._pickedTimer);
      triggerBtn._pickedTimer=setTimeout(()=>{triggerBtn.disabled=false; triggerBtn.textContent=original;},950);
    }
    toast(`${p.name}${color?` (${color})`:''} agregado a ${isSale?'factura':'cotización'}. Use Ver lista cuando quiera revisar.`);
  }

  function giftItemHTML(it,i){
    const qty=Math.max(1,Number(it.qty)||1);
    const p=itemProductRef(it);
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0 || colorKey(r.name)===colorKey(selectedColorLabel(it)));
    if(rows.length && !selectedColorLabel(it)) it.color=defaultColorForProduct(p);
    const current=selectedColorLabel(it);
    const colorSelect=rows.length?`<label class="cart-color-select-v86 gift-color"><span>Color</span><select data-gift-color="${i}">${rows.map(r=>`<option value="${escapeHtml(r.name)}" ${colorKey(current)===colorKey(r.name)?'selected':''}>${escapeHtml(r.name)} · ${num(r.qty)}</option>`).join('')}</select></label>`:'';
    const available=current?`<small class="color-available-v86">Disponible ${escapeHtml(current)}: ${num(colorQtyAvailable(p,current))}</small>`:'';
    return `<div class="cart-row cart-row-v24 gift-row"><div class="cart-info"><b>🎁 ${escapeHtml(it.name)}${current?` <em class="item-color-pill-v86">${escapeHtml(current)}</em>`:''}</b><span>Regalo · Stock actual ${num(productStock(p))}</span>${colorSelect}${available}</div><div class="qtybox"><button data-gift-dec="${i}">−</button><input data-gift-qty="${i}" type="number" value="${qty}"><button data-gift-inc="${i}">+</button></div><button class="btn small danger remove-item" data-gift-rem="${i}">Quitar</button></div>`;
  }
  function addGiftItem(id,isSale){
    const p=productById(id); if(!p)return;
    const doc=isSale?saleDraft:quote; doc.gifts=Array.isArray(doc.gifts)?doc.gifts:[];
    const color=defaultColorForProduct(p);
    const found=doc.gifts.find(x=>x.id===id && colorKey(selectedColorLabel(x))===colorKey(color));
    if(found) found.qty=Math.max(1,(+found.qty||1)+1);
    else doc.gifts.push({id:p.id,name:p.name,price:0,cost:+p.cost||0,qty:1,color,image:productImage(p)});
    refreshQuoteUI(isSale);
    toast(`${p.name}${color?` (${color})`:''} agregado como regalo.`);
  }
  function bindGiftPicker(isSale){
    const btn=$('#toggleGiftPicker',modalRoot); const panel=$('#giftPickerPanel',modalRoot); const input=$('#giftSearch',modalRoot); const list=$('#giftPickerList',modalRoot);
    if(!btn || !panel || !input || !list) return;
    function draw(){
      const term=String(input.value||'').toLowerCase().trim();
      const items=activeProducts().filter(p=>!term || [p.name,p.id,categoryText(p)].join(' ').toLowerCase().includes(term)).slice(0,36);
      list.innerHTML=items.map(p=>`<div class="picker-item gift-pick-item"><img loading="lazy" decoding="async" src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>Stock ${num(productStock(p))}${colorStockSummary(p,2)?` · ${escapeHtml(colorStockSummary(p,2))}`:''} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small add-pick-btn" type="button" data-giftadd="${escapeHtml(p.id)}">Regalar</button></div>`).join('') || '<div class="picker-empty"><b>Sin productos</b><span>Escriba otro nombre o código.</span></div>';
      $$('[data-giftadd]',list).forEach(b=>b.onclick=()=>addGiftItem(b.dataset.giftadd,isSale));
    }
    btn.onclick=()=>{panel.classList.toggle('hide'); if(!panel.classList.contains('hide')){draw(); setTimeout(()=>input.focus({preventScroll:true}),60);}};
    input.oninput=draw;
  }

  function cartItemHTML(it,i){
    const qty=Math.max(1,Number(it.qty)||1);
    const total=itemTotal(it);
    const unit=total/qty;
    const p=itemProductRef(it);
    const rows=productColorRows(p).filter(r=>Number(r.qty)>0 || colorKey(r.name)===colorKey(selectedColorLabel(it)));
    if(rows.length && !selectedColorLabel(it)) it.color=defaultColorForProduct(p);
    const current=selectedColorLabel(it);
    const promo=promoTotalForQty(p,qty)!==null;
    const promoTxt=promo?`<small class="promo-applied">${escapeHtml(promoLabelForQty(p,qty)||'Oferta aplicada')}</small>`:'';
    const colorSelect=rows.length?`<label class="cart-color-select-v86"><span>Color</span><select data-color="${i}">${rows.map(r=>`<option value="${escapeHtml(r.name)}" ${colorKey(current)===colorKey(r.name)?'selected':''}>${escapeHtml(r.name)} · ${num(r.qty)}</option>`).join('')}</select></label>`:'';
    const available=current?`<small class="color-available-v86">Disponible ${escapeHtml(current)}: ${num(colorQtyAvailable(p,current))}</small>`:'';
    return `<div class="cart-row cart-row-v24"><div class="cart-info"><b>${escapeHtml(it.name)}${current?` <em class="item-color-pill-v86">${escapeHtml(current)}</em>`:''}</b><span>${money(unit)} c/u · <strong class="cart-item-total-v219">Total ${money(total)}</strong></span>${colorSelect}${available}${promoTxt}</div><div class="qtybox"><button data-dec="${i}">−</button><input data-qty="${i}" type="number" value="${qty}"><button data-inc="${i}">+</button></div><button class="btn small danger remove-item" data-rem="${i}">Quitar</button></div>`;
  }
  let sdcDocPreviewTimer=0;
  function scheduleDocPreviewRefresh(doc,isSale,immediate=false){
    const preview=$('#docPreview',modalRoot);
    if(!preview) return;
    const renderNow=()=>{
      const node=$('#docPreview',modalRoot);
      if(node) node.innerHTML=docCard(doc,isSale);
    };
    clearTimeout(sdcDocPreviewTimer);
    if(immediate){ renderNow(); return; }
    sdcDocPreviewTimer=setTimeout(renderNow, isMobileDevice()?260:120);
  }

  function refreshQuoteUI(isSale){
    const doc=isSale?saleDraft:quote; doc.gifts=Array.isArray(doc.gifts)?doc.gifts:[];
    $('#cartList',modalRoot).innerHTML=doc.items.length?doc.items.map((it,i)=>cartItemHTML(it,i)).join(''):'<div class="empty-state">Agrega productos para calcular.</div>';
    const giftList=$('#giftList',modalRoot); if(giftList) giftList.innerHTML=doc.gifts.length?doc.gifts.map((it,i)=>giftItemHTML(it,i)).join(''):'<div class="empty-state gift-empty">Sin regalos incluidos.</div>';
    const c=calc(doc);
    const productsMini=$('#productsMini',modalRoot); if(productsMini) productsMini.textContent=money(c.products);
    $('#totalsMini',modalRoot).innerHTML=`<div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión</b><b>${money(c.commission)}</b></div><div class="summary-total"><b>Total</b><b>${money(c.total)}</b></div></div>`;
    scheduleDocPreviewRefresh(doc,isSale);
    const itemsCount=(doc.items||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const giftsCount=(doc.gifts||[]).reduce((acc,it)=>acc+Math.max(1,Number(it.qty)||1),0);
    const pill=$('#selectedCountPill',modalRoot); if(pill) pill.textContent=`${num(itemsCount)} ${itemsCount===1?'artículo':'artículos'}${giftsCount?` · ${num(giftsCount)} regalo${giftsCount===1?'':'s'}`:''}`;
    const title=$('#currentDocTitle',modalRoot); if(title) title.textContent=`${isSale?'Factura':'Cotización'} actual`;
    $$('[data-inc]',modalRoot).forEach(b=>b.onclick=()=>{doc.items[+b.dataset.inc].qty++;refreshQuoteUI(isSale)});
    $$('[data-dec]',modalRoot).forEach(b=>b.onclick=()=>{const it=doc.items[+b.dataset.dec]; it.qty=Math.max(1,it.qty-1);refreshQuoteUI(isSale)});
    $$('[data-rem]',modalRoot).forEach(b=>b.onclick=()=>{doc.items.splice(+b.dataset.rem,1);refreshQuoteUI(isSale)});
    $$('[data-qty]',modalRoot).forEach(inp=>inp.oninput=()=>{doc.items[+inp.dataset.qty].qty=Math.max(1,+inp.value||1);refreshQuoteUI(isSale)});
    $$('[data-color]',modalRoot).forEach(sel=>sel.onchange=()=>{const it=doc.items[+sel.dataset.color]; if(it){it.color=sel.value; refreshQuoteUI(isSale);}});
    $$('[data-gift-inc]',modalRoot).forEach(b=>b.onclick=()=>{doc.gifts[+b.dataset.giftInc].qty=Math.max(1,(+doc.gifts[+b.dataset.giftInc].qty||1)+1);refreshQuoteUI(isSale)});
    $$('[data-gift-dec]',modalRoot).forEach(b=>b.onclick=()=>{const it=doc.gifts[+b.dataset.giftDec]; it.qty=Math.max(1,(+it.qty||1)-1);refreshQuoteUI(isSale)});
    $$('[data-gift-rem]',modalRoot).forEach(b=>b.onclick=()=>{doc.gifts.splice(+b.dataset.giftRem,1);refreshQuoteUI(isSale)});
    $$('[data-gift-qty]',modalRoot).forEach(inp=>inp.oninput=()=>{doc.gifts[+inp.dataset.giftQty].qty=Math.max(1,+inp.value||1);refreshQuoteUI(isSale)});
    $$('[data-gift-color]',modalRoot).forEach(sel=>sel.onchange=()=>{const it=doc.gifts[+sel.dataset.giftColor]; if(it){it.color=sel.value; refreshQuoteUI(isSale);}});
  }
  function openQuote(id){currentView='quote'; if(!quote.items.length) quote=emptyQuote(); if(id)addDocItemTo(quote,id,clientQty(id)); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); }
  function openSale(id,fromDoc=null){saleDraft=fromDoc?SDCStore.clone(fromDoc):emptySale(); saleDraft.id='SDC-'+Date.now().toString().slice(-10); saleDraft.kind='receipt'; saleDraft.status=isCodDoc(saleDraft)?'Pagar al recibir':isLocalDoc(saleDraft)?'Entrega local':'Vendido'; delete saleDraft.saved; delete saleDraft.editingId; if(id)addDocItemTo(saleDraft,id,clientQty(id)); openModal(quoteModalHTML(true),true); bindQuoteCommon(true); }
  function addDocItemTo(doc,id,qty=1){const p=productById(id); if(!p)return; const cleanQty=Math.max(1,Number(qty)||1); const color=defaultColorForProduct(p); const found=doc.items.find(x=>x.id===id && colorKey(selectedColorLabel(x))===colorKey(color)); if(found)found.qty=Math.max(1,Number(found.qty)||1)+cleanQty; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:cleanQty,color,image:productImage(p)});}
  function bindQuoteCommon(isSale){
    renderPicker(isSale); bindDocFields(isSale); refreshQuoteUI(isSale); bindGiftPicker(isSale);
    $$('[data-jump]',modalRoot).forEach(b=>b.onclick=()=>{$('#'+b.dataset.jump,modalRoot)?.scrollIntoView({behavior:'smooth',block:'start'});});
    $('#backToQuote')&&($('#backToQuote').onclick=()=>{$('#currentDocTitle',modalRoot)?.scrollIntoView({behavior:'smooth',block:'start'}); toast('La cotización sigue abierta.');});
    $('#downloadDoc')&&($('#downloadDoc').onclick=()=>downloadDocImage(isSale?'recibo':'cotizacion'));
    $('#shortReceipt')&&($('#shortReceipt').onclick=()=>openShortReceipt(isSale));
    $('#waText')&&($('#waText').onclick=()=>sendWhatsAppText(isSale));
    $('#waPhoto')&&($('#waPhoto').onclick=()=>shareDocPhoto(isSale));
    $('#sendCompleteQuote')&&($('#sendCompleteQuote').onclick=sendCompleteQuote);
    $('#openClientsFromDoc')&&($('#openClientsFromDoc').onclick=()=>openClients(isSale?'sale':'quote'));
    $('#printDoc')&&($('#printDoc').onclick=()=>printDocumentCard(isSale));
    $('#saveQuote')&&($('#saveQuote').onclick=saveCurrentQuote);
    $('#openQuotes')&&($('#openQuotes').onclick=openSavedQuotes);
    $('#toSale')&&($('#toSale').onclick=()=>{if(!quote.items.length)return toast('Agrega productos antes de pasar a venta.'); closeModal(); openSale(null,quote)});
    $('#finishSale')&&($('#finishSale').onclick=finishSale);
  }
  function saveCurrentQuote(){
    if(!quote.items.length)return toast('Agrega productos antes de guardar.');
    quote.date=new Date().toISOString(); quote.saved=true;
    const clean=SDCStore.clone(quote); delete clean.editingId; clean.kind='quote'; clean.total=calc(clean).total;
    const key=quote.editingId||quote.id;
    const ix=state.quotes.findIndex(q=>q.id===key || q.id===clean.id);
    if(ix>=0) state.quotes[ix]=clean; else state.quotes.unshift(clean);
    quote=SDCStore.clone(clean); quote.editingId=clean.id; state.lastQuote=SDCStore.clone(clean);
    saveClientFromDoc(clean);
    save(); SDCStore.saveBackup(state,'Cotización guardada');
    saveDocumentToFirebase(clean,'quote').catch(err=>console.warn('No se guardó la cotización en Firebase',err));
    toast(ix>=0?'Cotización actualizada.':'Cotización guardada.');
  }
  function docCard(doc,isSale){
    const c=calc(doc);
    const code=doc.id||'SDC';
    const dateObj=new Date(doc.date||Date.now());
    const date=dateObj.toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    const dateOnly=dateObj.toLocaleDateString('es-HN',{day:'2-digit',month:'short',year:'numeric'});
    const timeOnly=dateObj.toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'});
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,Number(it.qty)||1),0);
    const giftCount=(doc.gifts||[]).reduce((a,it)=>a+Math.max(1,Number(it.qty)||1),0);
    const titleText=isSale?'RECIBO DE COMPRA':'COTIZACIÓN SD COMAYAGUA';
    const headerTitle=isSale?'Recibo de compra':'Cotización formal';
    const statusText=isSale?'VENTA CONFIRMADA':'COTIZACIÓN VIGENTE';
    const productTitle=isSale?'Productos vendidos':'Productos cotizados';
    const paymentTitle=shippingLabel(doc);
    const process=shippingNote(doc);
    const clientName=String(doc.client||'').trim()||'Cliente no registrado';
    const phone=String(doc.phone||'').trim()||'No registrado';
    const location=[doc.department,doc.municipality].filter(Boolean).join(' / ')||'No seleccionada';
    const delivery=String(doc.company||'').trim()||'No seleccionada';
    const rows=(doc.items||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      const unit=total/qty;
      const p=itemProductRef(it);
      const promo=promoTotalForQty(p,qty)!==null;
      const realImg=(galleryOf(p)[0]||it.image||'').trim();
      const initials=escapeHtml((it.name||'SD').slice(0,2).toUpperCase());
      const thumb=realImg?`<img class="receipt-item-thumb" src="${escapeHtml(realImg)}" alt="${escapeHtml(it.name)}" loading="lazy" decoding="async" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'receipt-item-thumb receipt-thumb-fallback',textContent:'${initials}'}))">`:`<div class="receipt-item-thumb receipt-thumb-fallback">${initials}</div>`;
      const color=itemColorText(it);
      return `<div class="receipt-item-pro has-thumb v141-receipt-item">
        <div class="receipt-item-index">${i+1}</div>
        ${thumb}
        <div class="receipt-item-info">
          <b>${escapeHtml(it.name)}</b>
          <span>${num(qty)} ${qty===1?'unidad':'unidades'} · ${money(unit)} c/u${promo?' · Oferta aplicada':''}</span>
          ${color?`<small>${escapeHtml(color)}</small>`:''}
        </div>
        <strong>${money(total)}</strong>
      </div>`;
    }).join('')||'<div class="receipt-empty-pro">Sin productos agregados</div>';
    const giftRows=(doc.gifts||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const p=itemProductRef(it);
      const realImg=(galleryOf(p)[0]||it.image||'').trim();
      const initials=escapeHtml((it.name||'RG').slice(0,2).toUpperCase());
      const thumb=realImg?`<img class="receipt-item-thumb" src="${escapeHtml(realImg)}" alt="${escapeHtml(it.name)}" loading="lazy" decoding="async" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'receipt-item-thumb receipt-thumb-fallback',textContent:'${initials}'}))">`:`<div class="receipt-item-thumb receipt-thumb-fallback">${initials}</div>`;
      return `<div class="receipt-item-pro has-thumb gift-receipt-row v141-receipt-item"><div class="receipt-item-index">🎁</div>${thumb}<div class="receipt-item-info"><b>${escapeHtml(it.name)}</b><span>${num(qty)} ${qty===1?'unidad':'unidades'} · Regalo incluido</span>${itemColorText(it)?`<small>${escapeHtml(itemColorText(it))}</small>`:''}</div><strong>Lps. 0</strong></div>`;
    }).join('');
    const commissionRow=(isCodDoc(doc)||c.commission>0)?`<div><span>Comisión pagar al recibir</span><b>${money(c.commission)}</b></div>`:'';
    const discountRow=c.discount>0?`<div><span>Descuento</span><b>- ${money(c.discount)}</b></div>`:'';
    const note=isSale?'Gracias por su compra. Conserve este recibo para cualquier consulta.':'Cotización sujeta a disponibilidad. Confirme total, entrega y pago antes de depositar.';
    return `<div class="doc-wrap compact-doc doc-v21 doc-v23 receipt-pro-v4 receipt-v32 receipt-v36 receipt-v49-tight v141-receipt ${isSale?'receipt-sale-v32':'receipt-quote-v32'}" id="printableDoc">
      <div class="receipt-band-pro"><span>${titleText}</span><b>${statusText}</b></div>
      <div class="receipt-inner-pro">
        <header class="receipt-header-pro v141-receipt-header">
          <div class="receipt-brand-pro v141-receipt-brand">
            <div class="receipt-logo-box"><span>SD</span><img class="doc-logo receipt-logo-inline" src="${RECEIPT_LOGO_SRC}" alt="Logo SD Comayagua" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=LOGO_SRC;this.parentElement.classList.add('logo-fallback-active')"></div>
            <div class="v141-receipt-heading">
              <small>Soluciones Digitales Comayagua</small>
              <h2>${headerTitle}</h2>
              <div class="v141-receipt-meta"><span>${dateOnly}</span><span>${timeOnly}</span><span>${escapeHtml(code)}</span></div>
            </div>
          </div>

        </header>

        <section class="receipt-client-pro receipt-client-v32 v141-receipt-client">
          <article class="wide"><span>Cliente</span><b>${escapeHtml(clientName)}</b></article>
          <article><span>Ubicación</span><b>${escapeHtml(location)}</b></article>
          <article><span>Teléfono</span><b>${escapeHtml(phone)}</b></article>
          <article><span>Pago</span><b>${paymentTitle}</b></article>
          <article><span>Entrega</span><b>${escapeHtml(delivery)}</b></article>
          ${doc.reference?`<article class="wide"><span>Referencia</span><b>${escapeHtml(doc.reference)}</b></article>`:''}
        </section>

        <section class="receipt-process-pro v141-receipt-process">
          <div><span>Proceso de pago</span><b>${paymentTitle}</b></div>
          <p>${process}</p>
        </section>

        <section class="receipt-products-pro v141-receipt-products">
          <div class="receipt-title-pro v141-receipt-title"><span>${productTitle}</span><b>${itemCount} ${itemCount===1?'artículo':'artículos'}${giftCount?` · ${giftCount} regalo${giftCount===1?'':'s'}`:''}</b></div>
          ${rows}${giftRows}
        </section>

        <section class="receipt-summary-pro v141-receipt-summary">
          <div><span>Subtotal productos</span><b>${money(c.products)}</b></div>
          <div><span>Envío</span><b>${money(c.shipping)}</b></div>
          ${commissionRow}
          ${discountRow}
          <div class="grand"><span>Total a pagar</span><b>${money(c.total)}</b></div>
        </section>

        <footer class="receipt-footer-pro receipt-footer-clean v141-receipt-footer">
          <div class="receipt-note-text">${note}</div>
          <div class="receipt-whatsapp-pill">WhatsApp: +504 3151-7755</div>
        </footer>
      </div>
    </div>`
  }
  function whatsappText(doc,isSale){
    const c=calc(doc);
    const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    const shippingTitle=shippingLabel(doc);
    const client=String(doc.client||'').trim()||'Cliente';
    const phone=String(doc.phone||'').trim()||'No registrado';
    const helloName=(client.split(/\s+/)[0]||'Cliente').trim()||'Cliente';
    const referenceLine=String(doc.reference||'').trim()?`\n📍 Referencia: ${doc.reference}`:'';
    const productLines=(doc.items||[]).length?(doc.items||[]).map((it,i)=>{
      const qty=Math.max(1,Number(it.qty)||1);
      const total=itemTotal(it);
      const unit=qty?total/qty:total;
      const color=itemColorText(it);
      const p=itemProductRef(it);
      const promo=promoTotalForQty(p,qty)!==null;
      return `${i+1}️⃣ *${it.name}*
   🔢 Cantidad: *${num(qty)} ${qty===1?'unidad':'unidades'}*
   💵 Precio c/u: *${money(unit)}*
   🧾 Total: *${money(total)}*${color?`\n   🎨 Color: *${color}*`:''}${promo?`\n   🎁 Oferta aplicada`:''}`;
    }).join('\n\n'):'Sin productos agregados.';
    const modality=isCodDoc(doc)?'Pagar al recibir':isLocalDoc(doc)?'Envío local':'Envío normal';
    const commissionLine=(isCodDoc(doc)||c.commission>0)?`\n   • Comisión: *${money(c.commission)}*`:'';
    const discountLine=c.discount>0?`\n   • Descuento: *- ${money(c.discount)}*`:'';
    const title=isSale?'🧾 *RECIBO / VENTA - SD COMAYAGUA*':'📋 *COTIZACIÓN - SD COMAYAGUA*';
    const intro=isSale
      ? `Hola *${helloName}*, gracias por su compra. Le compartimos el detalle de su pedido:`
      : `Hola *${helloName}*, gracias por consultar. Le compartimos su cotización lista para revisar:`;
    const footer=isSale
      ? '✅ *Pedido registrado.* Guarde este mensaje para cualquier consulta sobre su compra.'
      : '✅ *Para confirmar:* responda por este medio y le validamos disponibilidad, entrega y pago antes de cerrar el pedido.';
    return `${title}
━━━━━━━━━━━━━━━━━━━━

${intro}

👤 *CLIENTE*
• Nombre: *${client}*
• Teléfono: ${phone}
• Ubicación: ${doc.department||'No seleccionado'} / ${doc.municipality||'No seleccionado'}${referenceLine}

🛍️ *PRODUCTOS*
${productLines}

🚚 *ENTREGA / PAGO*
• Modalidad: *${modality}*
• Empresa / entrega: ${doc.company||'No seleccionada'}
• Envío: *${money(c.shipping)}*${commissionLine}
• Nota: ${shippingNote(doc)}

💰 *RESUMEN DE PAGO*
   • Productos: *${money(c.products)}*${discountLine}
   • Envío / comisión: *${money(c.delivery)}*

✅ *TOTAL A PAGAR: ${money(c.total)}*

${footer}

🏪 *SD COMAYAGUA*
📲 WhatsApp: +504 3151-7755`;
  }



  function waPhone(phone){const p=cleanPhone(phone); return p? (p.length===8?'504'+p:p) : ''}
  function waWebUrl(phone,text){const p=waPhone(phone); return p?`https://wa.me/${p}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`}
  function waAppUrl(phone,text){const p=waPhone(phone); return `whatsapp://send?${p?`phone=${p}&`:''}text=${encodeURIComponent(text)}`}
  function openWhatsApp(phone,text){
    if(isMobileDevice()){
      window.location.href=waAppUrl(phone,text);
    }else{
      window.open(waWebUrl(phone,text),'_blank');
    }
  }
  function currentDoc(isSale){return isSale?saleDraft:quote}
  function chooseWaPhone(doc){
    const storeLast=cleanPhone(state.settings.whatsappNumber||'').slice(-8);
    const current=cleanPhone(doc.phone||'').slice(-8);
    if(!current || current===storeLast){
      const typed=prompt('Número WhatsApp del cliente. Déjalo vacío para elegir el chat manualmente en WhatsApp:', current===storeLast?'':(doc.phone||''));
      if(typed===null) return null;
      doc.phone=typed.trim();
      refreshQuoteUI(doc.kind==='receipt' || doc===saleDraft);
    }
    return doc.phone||'';
  }
  function sendWhatsAppText(isSale){const doc=currentDoc(isSale); if(!doc.items.length)return toast('Agrega productos primero.'); const c=calc(doc); if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.'); const phone=chooseWaPhone(doc); if(phone===null)return; save(); openWhatsApp(phone,whatsappText(doc,isSale));}
  function receiptLandscapeHTML(doc,isSale=true){
    const c=calc(doc);
    const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'});
    const title=isSale?'RECIBO DE COMPRA':'COTIZACIÓN SD COMAYAGUA';
    const status=isSale?'VENTA CONFIRMADA':'COTIZACIÓN';
    const note=isSale?'Gracias por su compra. Conserve este recibo para cualquier consulta.':'Cotización sujeta a disponibilidad. Confirme total, entrega y pago antes de depositar.';
    const allItems=doc.items||[];
    const maxItems=6;
    const visibleItems=allItems.slice(0,maxItems);
    const moreCount=Math.max(0,allItems.length-visibleItems.length);
    const rows=visibleItems.map((it,i)=>{
      const qty=Math.max(1,+it.qty||1);
      const total=itemTotal(it);
      const unit=total/qty;
      const img=it.image||productImage(itemProductRef(it))||captureFallbackImage();
      return `<div class="rp-row"><span class="rp-num">${i+1}</span><img src="${escapeHtml(img)}" crossorigin="anonymous" onerror="this.onerror=null;this.src='${escapeHtml(captureFallbackImage())}'"><div class="rp-prod"><b>${escapeHtml(it.name)}</b><small>${num(qty)} ${qty===1?'unidad':'unidades'} · ${money(unit)} c/u${itemColorLine(it)}</small></div><strong>${money(total)}</strong></div>`;
    }).join('')||'<div class="rp-empty">Sin productos agregados.</div>';
    const moreRow=moreCount?`<div class="rp-more">+ ${num(moreCount)} producto${moreCount===1?'':'s'} adicional${moreCount===1?'':'es'} incluido${moreCount===1?'':'s'} en el total.</div>`:'';
    const commission=c.commission?`<div><span>Comisión pagar al recibir</span><b>${money(c.commission)}</b></div>`:'';
    const discount=c.discount?`<div><span>Descuento</span><b>- ${money(c.discount)}</b></div>`:'';
    return `<article class="receiptPage-v50" id="receiptLandscapeDoc">
      <header class="rp-top"><span>RECIBO SD COMAYAGUA</span><b>${status}</b></header>
      <section class="rp-hero">
        <div class="rp-brand"><img src="${RECEIPT_LOGO_SRC}" crossorigin="anonymous" onerror="this.style.display='none'"><div><small>SD COMAYAGUA</small><h1>${title}</h1><p>${date}</p><p>${escapeHtml(doc.id||'SDC')}</p></div></div>
        <div class="rp-total"><span>Total a pagar</span><b>${money(c.total)}</b></div>
      </section>
      <section class="rp-info">
        <div><span>Cliente</span><b>${escapeHtml(doc.client||'Cliente no registrado')}</b></div>
        <div><span>Teléfono</span><b>${escapeHtml(doc.phone||'No registrado')}</b></div>
        <div><span>Ubicación</span><b>${escapeHtml((doc.department||'Comayagua')+' / '+(doc.municipality||'Comayagua'))}</b></div>
        <div><span>Pago / entrega</span><b>${escapeHtml(shippingLabel(doc))}</b></div>
      </section>
      <section class="rp-payment"><div><span>Proceso de pago</span><b>${escapeHtml(shippingLabel(doc))}</b></div><p>${escapeHtml(shippingNote(doc))}</p></section>
      <section class="rp-products"><div class="rp-section-head"><span>${isSale?'Productos vendidos':'Productos cotizados'}</span><b>${(doc.items||[]).reduce((a,x)=>a+(+x.qty||1),0)} ${(doc.items||[]).length===1?'artículo':'artículos'}</b></div><div class="rp-lines">${rows}${moreRow}</div></section>
      <section class="rp-summary"><div><span>Subtotal productos</span><b>${money(c.products)}</b></div><div><span>Envío</span><b>${money(c.shipping)}</b></div>${commission}${discount}<div class="grand"><span>Total a pagar</span><b>${money(c.total)}</b></div></section>
      <footer class="rp-footer"><p>${note}</p><b>WhatsApp: +504 3151-7755</b></footer>
    </article>`;
  }
  function receiptLandscapeCSS(){return `
    .receiptPage-v50{width:1600px;height:1040px;background:#f3f4ee;color:#07131a;font-family:Barlow,Arial,sans-serif;border-radius:0;overflow:hidden;padding:0 42px 40px;border:0;box-shadow:none;position:relative}
    .receiptPage-v50 *{box-sizing:border-box}.rp-top{height:82px;margin:0 -42px 28px;background:linear-gradient(135deg,#07131a,#0b2748);color:white;display:flex;align-items:center;justify-content:space-between;padding:0 42px;border-bottom:7px solid #1d7dff}.rp-top span{font-size:26px;text-transform:uppercase;letter-spacing:.18em;font-weight:950}.rp-top>b{background:#dbeafe;color:#062047;border-radius:999px;padding:16px 30px;text-transform:uppercase;letter-spacing:.11em;font-size:22px;box-shadow:0 10px 30px rgba(0,0,0,.12)}.rp-hero{display:grid;grid-template-columns:1fr 430px;gap:28px;margin-bottom:20px}.rp-brand,.rp-total,.rp-info>div,.rp-payment,.rp-products,.rp-summary,.rp-footer{background:white;border:1px solid #d7e5f6;border-radius:28px}.rp-brand{display:flex;align-items:center;gap:26px;padding:26px 30px}.rp-brand img{width:116px;height:116px;object-fit:contain;background:white;border:1px solid #d7e5f6;border-radius:24px;padding:7px;box-shadow:0 14px 34px rgba(20,26,22,.10)}.rp-brand small,.rp-total span,.rp-info span,.rp-payment span,.rp-summary span,.rp-section-head span{display:block;text-transform:uppercase;letter-spacing:.16em;color:#64748b;font-size:18px;font-weight:950}.rp-brand small{font-size:21px;color:#5c728d}.rp-brand h1{margin:2px 0 7px;font-size:66px;line-height:.86;letter-spacing:-.055em;color:#07131a}.rp-brand p{margin:2px 0;color:#384f68;font-size:24px;font-weight:900;line-height:1.06}.rp-total{background:linear-gradient(135deg,#eef6ff,#f7fbff);border-color:#cfe1f8;padding:34px 32px;display:flex;flex-direction:column;justify-content:center}.rp-total b{display:block;font-size:86px;line-height:.92;letter-spacing:-.075em;color:#07131a;margin-top:16px;white-space:nowrap}.rp-info{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px;margin-bottom:18px}.rp-info>div{padding:18px 20px;min-height:94px}.rp-info b{display:block;color:#07131a;font-size:22px;line-height:1.08;margin-top:9px}.rp-payment{display:grid;grid-template-columns:310px 1fr;gap:18px;align-items:center;background:#eef6ff;border-color:#cfe1f8;padding:22px 24px;margin-bottom:18px}.rp-payment b{display:block;color:#07131a;font-size:28px;margin-top:8px}.rp-payment p{margin:0;color:#243c56;font-size:23px;line-height:1.25;font-weight:850}.rp-products{overflow:hidden;margin-bottom:18px}.rp-section-head{height:70px;background:linear-gradient(135deg,#07131a,#0b2748);color:white;display:flex;align-items:center;justify-content:space-between;padding:0 28px}.rp-section-head span{color:white}.rp-section-head b{color:#dbeafe;font-size:22px;text-transform:uppercase;letter-spacing:.08em}.rp-lines{background:#fff}.rp-row{display:grid;grid-template-columns:58px 76px 1fr 150px;align-items:center;gap:16px;min-height:86px;padding:10px 26px;border-top:1px solid #e1ebf7}.rp-row:first-child{border-top:0}.rp-row img{width:76px;height:76px;object-fit:cover;border-radius:16px;background:#edf5ff}.rp-num{width:50px;height:50px;border-radius:16px;background:#edf5ff;display:grid;place-items:center;font-weight:950;color:#0b63ce;font-size:20px}.rp-prod{min-width:0}.rp-row b{display:block;color:#07131a;font-size:22px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rp-row small{display:block;color:#5e7068;font-size:16px;font-weight:850;margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rp-row strong{text-align:right;color:#07131a;font-size:25px;white-space:nowrap}.rp-more{padding:12px 26px;background:#f7fbff;color:#3e5872;font-weight:900;font-size:18px;border-top:1px solid #e1ebf7}.rp-empty{padding:24px;color:#536b86;font-weight:900}.rp-summary{overflow:hidden;margin-bottom:18px}.rp-summary>div{display:flex;align-items:center;justify-content:space-between;min-height:62px;padding:0 28px;border-top:1px solid #e1ebf7}.rp-summary>div:first-child{border-top:0}.rp-summary b{font-size:28px;color:#07131a;white-space:nowrap}.rp-summary .grand{min-height:88px;background:linear-gradient(135deg,#07131a,#0b2748);color:#fff}.rp-summary .grand span{color:white}.rp-summary .grand b{font-size:60px;color:#dbeafe;letter-spacing:-.06em}.rp-footer{display:grid;grid-template-columns:1fr auto;gap:22px;align-items:center;padding:24px 30px;min-height:110px}.rp-footer p{margin:0;color:#243c56;font-size:23px;line-height:1.22;font-weight:850}.rp-footer b{border:1px solid #cfe1f8;background:#eef6ff;color:#0b63ce;border-radius:999px;padding:14px 24px;font-size:21px;white-space:nowrap}
    @media print{@page{size:letter portrait;margin:0}html,body{margin:0!important;background:white!important;width:100%!important;height:100%!important;overflow:hidden!important}.receiptPage-v50{width:100vw!important;height:100vh!important;border-radius:0!important;padding:0 26px 22px!important}.rp-top{margin:0 -26px 16px!important;height:58px!important;border-bottom-width:4px!important}.rp-top span{font-size:16px!important}.rp-top>b{font-size:14px!important;padding:8px 16px!important}.rp-hero{grid-template-columns:1fr 250px!important;gap:12px!important;margin-bottom:10px!important}.rp-brand{padding:12px 14px!important;gap:12px!important;border-radius:16px!important}.rp-brand img{width:60px!important;height:60px!important}.rp-brand small{font-size:11px!important}.rp-brand h1{font-size:31px!important}.rp-brand p{font-size:11px!important}.rp-total{padding:12px 16px!important;border-radius:16px!important}.rp-total span,.rp-info span,.rp-payment span,.rp-summary span,.rp-section-head span{font-size:10px!important}.rp-total b{font-size:44px!important;margin-top:8px!important}.rp-info{gap:8px!important;margin-bottom:8px!important}.rp-info>div{padding:8px 10px!important;min-height:48px!important;border-radius:12px!important}.rp-info b{font-size:12px!important;margin-top:4px!important}.rp-payment{grid-template-columns:170px 1fr!important;gap:8px!important;padding:9px 12px!important;margin-bottom:8px!important;border-radius:13px!important}.rp-payment b{font-size:14px!important}.rp-payment p{font-size:12px!important}.rp-products{margin-bottom:8px!important;border-radius:14px!important}.rp-section-head{height:42px!important;padding:0 14px!important}.rp-section-head b{font-size:13px!important}.rp-row{grid-template-columns:32px 42px 1fr 78px!important;gap:8px!important;min-height:50px!important;padding:6px 12px!important}.rp-row img{width:40px!important;height:40px!important;border-radius:9px!important}.rp-num{width:30px!important;height:30px!important;border-radius:9px!important;font-size:12px!important}.rp-row b{font-size:12px!important}.rp-row small{font-size:9px!important}.rp-row strong{font-size:13px!important}.rp-summary{margin-bottom:8px!important;border-radius:13px!important}.rp-summary>div{min-height:36px!important;padding:0 14px!important}.rp-summary b{font-size:15px!important}.rp-summary .grand{min-height:47px!important}.rp-summary .grand b{font-size:31px!important}.rp-footer{min-height:48px!important;padding:8px 14px!important;border-radius:13px!important}.rp-footer p{font-size:11px!important}.rp-footer b{font-size:11px!important;padding:7px 10px!important}}
  `}
  async function landscapeDocToBlob(doc,isSale=true){
    const host=document.createElement('div');
    host.className='productPhotoExportHost docReceiptExportHost';
    host.innerHTML=`<style>${receiptLandscapeCSS()}</style>${receiptLandscapeHTML(doc,isSale)}`;
    document.body.appendChild(host);
    try{
      await waitImages(host);
      const el=host.querySelector('#receiptLandscapeDoc');
      return await captureNodeAsPngBlob(el,2.35);
    }finally{host.remove();}
  }

  async function docToBlob(isSale=false){
    scheduleDocPreviewRefresh(currentDoc(isSale),isSale,true);
    const el=$('#printableDoc',modalRoot);
    const blob=await captureNodeToBlob(el,'#eaf5f9');
    if(!blob) toast('No se pudo generar la imagen vertical del documento. Verifique que las miniaturas hayan cargado o use el botón PDF.');
    return blob;
  }

  function blobToDataURL(blob){
    return new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(blob);
    });
  }
  async function printDocumentCard(isSale=false){
    const doc=currentDoc(isSale);
    if(!doc.items.length)return toast('Agrega productos primero.');
    const c=calc(doc);
    if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de imprimir.');
    const popup=window.open('','_blank');
    if(!popup){
      await downloadDocImage(isSale?'recibo':'cotizacion');
      toast('El navegador bloqueó la ventana de PDF. Se descargó la imagen limpia para imprimirla o enviarla.');
      return;
    }
    popup.document.open();
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Preparando documento SD Comayagua</title><style>html,body{margin:0;height:100%;background:#f4fbff;font-family:Arial,sans-serif;color:#061522;display:grid;place-items:center}.box{padding:24px;border:1px solid #d9ecf5;border-radius:18px;background:white;text-align:center;font-weight:800}</style></head><body><div class="box">Preparando PDF limpio de SD COMAYAGUA...</div></body></html>`);
    popup.document.close();
    try{
      const blob=await docToBlob(isSale);
      if(!blob)throw new Error('No se pudo crear la imagen del documento.');
      const dataURL=await blobToDataURL(blob);
      const title=isSale?'Recibo SD Comayagua':'Cotización SD Comayagua';
      const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
        @page{size:letter portrait;margin:0}*{box-sizing:border-box}html,body{margin:0!important;padding:0!important;width:100%!important;height:99vh!important;background:#fff;color:#061522;overflow:hidden!important}body{display:block!important}.paper{position:fixed!important;inset:0!important;width:100vw!important;height:98.8vh!important;margin:0!important;padding:0!important;background:#fff!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow:hidden!important;break-inside:avoid!important;page-break-inside:avoid!important;page-break-after:avoid!important}.paper img{display:block!important;width:auto!important;height:auto!important;max-width:99vw!important;max-height:98vh!important;object-fit:contain!important;background:#fff!important;break-inside:avoid!important;page-break-before:avoid!important;page-break-after:avoid!important;page-break-inside:avoid!important}.hint{display:none}@media screen{html,body{overflow:auto!important;background:#edf4fb!important}.paper{position:relative!important;inset:auto!important;min-height:99vh!important;box-shadow:0 18px 50px rgba(0,0,0,.18)}}@media print{html,body{overflow:hidden!important;height:99vh!important}.paper{height:98vh!important;break-inside:avoid!important;page-break-inside:avoid!important;page-break-after:avoid!important}.paper img{max-height:97.8vh!important;break-inside:avoid!important;page-break-inside:avoid!important;page-break-after:avoid!important}}
      </style></head><body><main class="paper"><img alt="${title}" src="${dataURL}"></main><script>window.onload=()=>setTimeout(()=>{window.focus();window.print();},250);<\/script></body></html>`;
      popup.document.open();
      popup.document.write(html);
      popup.document.close();
    }catch(err){
      console.error(err);
      try{popup.close();}catch(e){}
      await downloadDocImage(isSale?'recibo':'cotizacion');
      toast('No se pudo abrir el PDF limpio. Se descargó la imagen del recibo.');
    }
  }

  async function downloadDocImage(name='documento'){
    const isSale=name==='recibo';
    const doc=isSale?saleDraft:quote;
    const blob=await docToBlob(isSale);
    if(!blob)return;
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${name}${isSale?'-cliente':''}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc?.id||'sdc')}.png`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast(isSale?'Recibo limpio descargado con nombre único.':'Imagen descargada con nombre único.');
  }
  async function copyTextSafe(text){
    try{await navigator.clipboard?.writeText(text); return true;}catch(e){return false;}
  }
  async function copyImageSafe(blob){
    try{
      if(navigator.clipboard && window.ClipboardItem && blob){
        await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);
        return true;
      }
    }catch(e){}
    return false;
  }
  function sleep(ms){return new Promise(res=>setTimeout(res,ms));}
  async function waitForImages(root,timeout){
    timeout=timeout || (isMobileDevice()?4500:8000);
    const el=root||document;
    const imgs=Array.from(el.querySelectorAll('img'));
    if(!imgs.length)return;
    await Promise.all(imgs.map(img=>new Promise(resolve=>{
      if(img.complete && img.naturalWidth>0)return resolve();
      const done=()=>{clearTimeout(timer); img.removeEventListener('load',done); img.removeEventListener('error',done); resolve();};
      const timer=setTimeout(done,timeout);
      img.addEventListener('load',done,{once:true});
      img.addEventListener('error',done,{once:true});
      try{img.setAttribute('crossorigin','anonymous');}catch(e){}
    })));
    await sleep(80);
  }
  async function captureNodeToBlob(el,backgroundColor){
    if(!el)return null;
    if(!await ensureHtml2Canvas()){
      toast('La librería para descargar imágenes todavía no cargó. Revisa tu conexión y vuelve a tocar Descargar imagen.');
      return null;
    }
    await waitForImages(el);
    try{
      const exportScale=isMobileDevice()?1.45:2;
      const canvas=await html2canvas(el,{backgroundColor,scale:exportScale,useCORS:true,allowTaint:false,imageTimeout:15000,removeContainer:true,scrollX:0,scrollY:0,windowWidth:document.documentElement.clientWidth,onclone:(doc)=>{
        doc.body.classList.add('capture-exporting','capture-v7-stable');
        doc.querySelectorAll('img').forEach(img=>{
          try{
            img.setAttribute('crossorigin','anonymous');
            img.setAttribute('referrerpolicy','no-referrer');
            img.loading='eager';
            img.decoding='sync';
            img.style.background='transparent';
            const isBrandLogo=img.classList.contains('share-brand-logo') || img.classList.contains('receipt-logo-inline') || img.classList.contains('doc-logo');
            const src=(img.getAttribute('src')||'').trim();
            if(isBrandLogo){ img.setAttribute('src', RECEIPT_LOGO_SRC); }
            else if(!src || src==='undefined' || src==='null'){
              img.setAttribute('src', captureFallbackImage());
            }
          }catch(e){}
        });
      }});
      return await new Promise(res=>canvas.toBlob(res,'image/png',.98));
    }catch(err){
      console.error(err);
      return null;
    }
  }

  async function shareDocPhoto(isSale){
    const doc=currentDoc(isSale);
    if(!doc.items.length)return toast('Agrega productos primero.');
    const c=calc(doc);
    if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.');
    save();
    const blob=await docToBlob(isSale);
    const text=whatsappText(doc,isSale);
    const filename=`${isSale?'recibo-cliente':'cotizacion'}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc.id||'sdc')}.png`;
    if(blob && navigator.canShare){
      const file=new File([blob],filename,{type:'image/png'});
      if(navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file],text,title:isSale?'Recibo SD Comayagua':'Cotización SD Comayagua'});
          toast('Selecciona WhatsApp. Se compartió la imagen con el mensaje.');
          return;
        }catch(e){
          if(e && e.name==='AbortError')return;
        }
      }
    }
    const copiedImage=blob?await copyImageSafe(blob):false;
    await copyTextSafe(text);
    if(!copiedImage && blob){
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=filename;
      a.click();
      setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    }
    const phone=chooseWaPhone(doc);
    if(phone!==null) openWhatsApp(phone,text);
    toast(copiedImage?'WhatsApp se abrió con el texto. La imagen quedó copiada; pégala en el chat si no aparece automáticamente.':'Se descargó la imagen y se abrió WhatsApp con el texto. Adjunta la imagen descargada si el navegador no la envía solo.');
  }

  function finishSale(){
    if(!saleDraft.items.length)return toast('Agrega productos primero.');
    saleDraft.gifts=Array.isArray(saleDraft.gifts)?saleDraft.gifts:[];
    const editingId=saleDraft.editingId||'';
    const previous=editingId?state.sales.find(x=>x.id===editingId):null;
    const prevQty=new Map();
    function addVariantQty(map,it){
      if(!it||!it.id)return;
      const p=productById(it.id)||it;
      if(hasColorStock(p) && !selectedColorLabel(it)) it.color=defaultColorForProduct(p);
      const color=hasColorStock(p)?selectedColorLabel(it):'';
      const key=`${it.id}::${colorKey(color)}`;
      const row=map.get(key)||{id:it.id,name:it.name||p.name||'Producto',color,qty:0};
      row.qty+=Math.max(1,+it.qty||1);
      if(!row.color) row.color=color;
      map.set(key,row);
    }
    (previous?.items||[]).forEach(it=>addVariantQty(prevQty,it));
    (previous?.gifts||[]).forEach(it=>addVariantQty(prevQty,it));
    const checkQty=new Map();
    (saleDraft.items||[]).forEach(it=>addVariantQty(checkQty,it));
    (saleDraft.gifts||[]).forEach(it=>addVariantQty(checkQty,it));
    for(const [key,row] of checkQty.entries()){
      const p=productById(row.id);
      const before=prevQty.get(key)?.qty||0;
      const diff=row.qty-before;
      if(p && hasColorStock(p) && !row.color){toast(`Elegí color para ${p.name}.`); return;}
      const available=p?(hasColorStock(p)?colorQtyAvailable(p,row.color):productStock(p)):0;
      if(p && diff>available){toast(`Stock insuficiente para ${p.name}${row.color?` color ${row.color}`:''}. Disponible: ${num(available)}.`); return;}
      const sold=(saleDraft.items||[]).some(it=>itemVariantKey(it)===key);
      if(sold && p && Number(p.price||0)-Number(p.cost||0)<0){toast(`Revisá ${p.name}: el costo es mayor que el precio.`); return;}
    }
    const c=calc(saleDraft);
    saleDraft.date=new Date().toISOString();
    saleDraft.total=c.total;
    const newQty=new Map();
    (saleDraft.items||[]).forEach(it=>addVariantQty(newQty,it));
    (saleDraft.gifts||[]).forEach(it=>addVariantQty(newQty,it));
    const variantKeys=new Set([...prevQty.keys(),...newQty.keys()]);
    variantKeys.forEach(key=>{
      const row=newQty.get(key)||prevQty.get(key);
      const p=productById(row?.id); if(!p)return;
      const before=prevQty.get(key)?.qty||0;
      const after=newQty.get(key)?.qty||0;
      adjustProductColorStock(p,row.color,after-before);
    });
    const ids=new Set(Array.from(variantKeys).map(key=>(newQty.get(key)||prevQty.get(key))?.id).filter(Boolean));
    saleDraft.date=new Date().toISOString(); saleDraft.kind='receipt'; saleDraft.total=c.total; const clean=SDCStore.clone(saleDraft); delete clean.editingId;
    if(previous){
      const ix=state.sales.findIndex(x=>x.id===editingId);
      if(ix>=0) state.sales[ix]=clean;
    }else{
      state.sales.unshift(clean);
    }
    state.lastReceipt=SDCStore.clone(clean);
    saveClientFromDoc(clean);
    SDCStore.saveBackup(state,previous?'Factura editada':'Venta registrada');
    saveDocumentToFirebase(clean,'sale').catch(err=>console.warn('No se guardó la venta en Firebase',err));
    syncStockAfterSale(ids).then(ok=>{ if(ok) console.info('Stock sincronizado con Firebase.'); }).catch(err=>console.warn('No se sincronizó el stock en Firebase',err));
    save(); if($('#cartList',modalRoot)) refreshQuoteUI(true); render(); toast(previous?'Factura actualizada sin duplicarla. Stock actualizado por color.':'Venta finalizada, recibo guardado y stock actualizado por color.');
  }

  function normalizeImportHeader(h){
    return String(h||'').replace(/^\uFEFF/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
  }
  function importCleanValue(v){
    if(v===undefined||v===null) return '';
    return String(v).replace(/^\uFEFF/,'').trim();
  }
  function parseImportNumber(v){
    let s=importCleanValue(v).replace(/lps\.?|hnl|lempiras?/ig,'').replace(/\s+/g,'');
    if(!s) return 0;
    s=s.replace(/[^0-9,.-]/g,'');
    if(s.includes(',') && s.includes('.')) s=s.replace(/,/g,'');
    else if(s.includes(',') && !s.includes('.')){
      const parts=s.split(',');
      s=(parts.length===2 && parts[1].length===3)?parts.join(''):s.replace(',', '.');
    }
    const n=Number(s);
    return Number.isFinite(n)?n:0;
  }
  function csvEscape(v){
    const s=String(v??'');
    return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
  }
  function detectDelimiter(text){
    const sample=String(text||'').split(/\r?\n/).find(x=>x.trim())||'';
    const count=(ch)=>{let c=0,q=false; for(let i=0;i<sample.length;i++){const a=sample[i]; if(a==='"'){ if(q&&sample[i+1]==='"')i++; else q=!q;} else if(!q && a===ch)c++; } return c;};
    const opts=[',',';','\t'].map(ch=>({ch,n:count(ch)})).sort((a,b)=>b.n-a.n);
    return opts[0].n?opts[0].ch:',';
  }
  function parseCSVText(text){
    text=String(text||'').replace(/^\uFEFF/,'');
    const delim=detectDelimiter(text);
    const rows=[]; let row=[], cell='', q=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(ch==='"'){
        if(q && text[i+1]==='"'){cell+='"'; i++;}
        else q=!q;
      } else if(ch===delim && !q){row.push(cell); cell='';}
      else if((ch==='\n'||ch==='\r') && !q){
        if(ch==='\r' && text[i+1]==='\n') i++;
        row.push(cell); cell='';
        if(row.some(x=>String(x).trim()!=='')) rows.push(row);
        row=[];
      } else cell+=ch;
    }
    row.push(cell);
    if(row.some(x=>String(x).trim()!=='')) rows.push(row);
    if(!rows.length) return [];
    const headers=rows.shift().map(h=>importCleanValue(h));
    return rows.map(r=>{const o={}; headers.forEach((h,i)=>o[h]=r[i]??''); return o;});
  }
  function splitImportImages(v){
    const raw=importCleanValue(v);
    if(!raw) return [];
    return raw.split(/\s*(?:\r?\n|\||;)\s*/).map(x=>x.trim()).filter(Boolean);
  }
  function normalizeImportPromos(v){
    const raw=importCleanValue(v);
    if(!raw) return '';
    return raw.split(/\s*(?:\r?\n|\||;|,)\s*/).map(part=>{
      const m=part.match(/(\d+)\s*(?:=|:|x|X|-|a|por|par|pares|unidad|unidades)?\s*[^0-9]*([0-9]+(?:[.,][0-9]+)?)/i);
      if(!m) return '';
      return `${Number(m[1])}=${parseImportNumber(m[2])}`;
    }).filter(Boolean).join('\n');
  }
  function importRowToProduct(row,i){
    const n={}; Object.keys(row||{}).forEach(k=>n[normalizeImportHeader(k)]=row[k]);
    const val=(keys)=>{for(const k of keys){const nk=normalizeImportHeader(k); if(n[nk]!==undefined && importCleanValue(n[nk])!=='') return importCleanValue(n[nk]);} return '';};
    const images=splitImportImages(val(['imagenes','imagen','foto','fotos','image','images','galeria','gallery','urlimagen','linkimagen']));
    const p={
      id:val(['codigo','cod','id','sku','code']) || `SDC-${String(i+1).padStart(3,'0')}`,
      name:val(['nombre','producto','name','title','articulo','item']) || 'Producto sin nombre',
      categories:val(['categoria','categorias','category','categories','etiquetas','tags']) || '',
      price:parseImportNumber(val(['precio','precioventa','precioactual','venta','price'])),
      cost:parseImportNumber(val(['costo','cost','costocompra','preciocompra','compra'])),
      stock:parseImportNumber(val(['stock','existencia','cantidad','inventario','disponible'])),
      colors:val(['colores','colors','colorstock','stockcolores','variantescolor','variantes_color','coloresycantidades']),
      image:images[0]||'',
      gallery:images.slice(1).join('\n'),
      promos:normalizeImportPromos(val(['promos','promociones','precioscantidad','preciosporcantidad','mayoreo','ofertas','promo'])),
      description:val(['descripcion','description','beneficios','detalle','incluye','info'])
    };
    return SDCStore.normalizeProduct(p,i);
  }
  async function ensureXLSX(){
    if(window.XLSX) return true;
    if(!window.__sdcXlsxPromise){
      window.__sdcXlsxPromise = new Promise((resolve)=>{
        const script=document.createElement('script');
        script.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.async=true;
        script.onload=()=>resolve(true);
        script.onerror=()=>resolve(false);
        document.head.appendChild(script);
      });
    }
    await Promise.race([window.__sdcXlsxPromise, new Promise(r=>setTimeout(()=>r(false),8500))]);
    return !!window.XLSX;
  }

  async function readRowsFromProductFile(file){
    const name=(file.name||'').toLowerCase();
    if(name.endsWith('.csv') || file.type.includes('csv') || file.type.startsWith('text/')){
      const txt=await file.text();
      return parseCSVText(txt);
    }
    if(name.endsWith('.xlsx') || name.endsWith('.xls')){
      if(!await ensureXLSX()) throw new Error('La librería XLSX no cargó. Revisa internet o usa CSV.');
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const first=wb.SheetNames[0];
      if(!first) return [];
      return XLSX.utils.sheet_to_json(wb.Sheets[first],{defval:'',raw:false});
    }
    throw new Error('Formato no soportado. Usa .csv o .xlsx');
  }
  function importProducts(products,mode){
    if(!products.length) throw new Error('No encontré productos válidos.');
    SDCStore.saveBackup(state,'Antes de importar productos');
    if(mode==='replace'){
      state.products=products;
    }else{
      const byId=new Map(state.products.map((p,i)=>[String(p.id).trim().toLowerCase(),i]));
      products.forEach(p=>{
        const key=String(p.id||'').trim().toLowerCase();
        if(key && byId.has(key)) state.products[byId.get(key)]={...state.products[byId.get(key)],...p};
        else state.products.push(p);
      });
    }
    state.products=state.products.map(SDCStore.normalizeProduct);
    save(); SDCStore.saveBackup(state,`Importados ${products.length} productos`);
  }
  async function handleProductImportFile(file){
    try{
      $('#importProductsStatus',modalRoot).innerHTML='Leyendo archivo...';
      const rows=await readRowsFromProductFile(file);
      const products=rows.map(importRowToProduct).filter(p=>p.name && p.name!=='Producto sin nombre');
      if(!products.length) throw new Error('El archivo no tiene filas de productos.');
      const mode=$('#importProductsMode',modalRoot)?.value||'merge';
      const msg=`Encontré ${products.length} productos en ${file.name}.\n\n${mode==='replace'?'REEMPLAZARÁ todo el catálogo actual.':'Actualizará por código y agregará los nuevos.'}\n\n¿Importar ahora?`;
      if(!confirm(msg)){ $('#importProductsStatus',modalRoot).innerHTML='Importación cancelada.'; return; }
      importProducts(products,mode);
      closeModal(); render(); toast(`${products.length} productos importados correctamente.`);
    }catch(err){
      console.error(err);
      $('#importProductsStatus',modalRoot).innerHTML=`No se pudo importar: ${escapeHtml(err.message||err)}`;
      toast('No se pudo importar el archivo.');
    }
  }
  function exportProductsCSV(){
    const headers=['codigo','nombre','categoria','precio','costo','stock','colores','imagenes','promos','descripcion'];
    const rows=state.products.map(p=>{
      const imgs=[p.image,...String(p.gallery||'').split(/\n+/).filter(Boolean)].join(' | ');
      return [p.id,p.name,p.categories,p.price,p.cost,productStock(p),colorRowsText(productColorRows(p)),imgs,String(p.promos||'').replace(/\n+/g,' | '),p.description].map(csvEscape).join(',');
    });
    const blob=new Blob([[headers.join(','),...rows].join('\n')],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='productos-sd-comayagua.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function downloadProductTemplateCSV(){
    const csv='codigo,nombre,categoria,precio,costo,stock,colores,imagenes,promos,descripcion\nSDC-001,Adaptador Micro SD,Tecnología,350,110,20,"Gris:7 | Amarillo:3 | Anaranjado:10",https://link-imagen.jpg,"1:350 | 2:690",Descripción del producto';
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='plantilla-productos-sdc.csv'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function openBackup(){
    openModal(`<div class="modal-head"><h3>Respaldo único</h3><button class="close">×</button></div><div class="modal-body backup-v22"><div class="card-box backup-main"><h4>RESPALDO COMPLETO</h4><p>Una sola opción clara: guarda productos, ventas, cotizaciones, clientes, cierre de caja y configuración.</p><div class="modal-actions import-actions" style="position:static"><button class="btn full" id="exportBackup">Descargar respaldo completo</button><label class="btn secondary full">Restaurar respaldo<input id="importBackup" type="file" accept="application/json" hidden></label><button class="btn ghost full" id="manualBackup">Crear copia local automática</button><button class="btn secondary full" data-action="exportAll">Exportar ventas/clientes CSV</button></div></div><details class="card-box"><summary>Herramientas de productos CSV / Excel</summary><p style="color:#b8c8d8">Esto no es respaldo; solo sirve para importar o exportar catálogo de productos.</p><label><span class="label">Modo de importación</span><select class="select" id="importProductsMode"><option value="merge">Actualizar por código y agregar nuevos</option><option value="replace">Reemplazar todo el catálogo</option></select></label><div class="modal-actions import-actions" style="position:static"><label class="btn secondary full">Importar .CSV o .XLSX<input id="importProductsFile" type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden></label><button class="btn ghost" id="exportProductsCsv">Exportar productos CSV</button><button class="btn ghost" id="downloadTemplateCsv">Plantilla CSV</button></div><div id="importProductsStatus" class="import-status">Usa columnas: código, nombre, categoría, precio, costo, stock, colores, imágenes, promos y descripción.</div></details><div class="card-box"><h4>Copias locales</h4><div id="backupList"></div></div></div>`,true);
    function draw(){const b=SDCStore.listBackups(); $('#backupList').innerHTML=b.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.label)}</b><br><span>${new Date(x.date).toLocaleString('es-HN')}</span></div><button class="btn small secondary" data-restore="${x.id}">Restaurar</button></div>`).join('')||'<div class="empty-state">Sin copias locales.</div>'; $$('[data-restore]',modalRoot).forEach(btn=>btn.onclick=()=>{state=SDCStore.restoreBackup(btn.dataset.restore)||state; hydrateState(); closeModal(); render(); toast('Respaldo restaurado.')}); }
    draw();
    $('#exportProductsCsv').onclick=exportProductsCSV;
    $('#downloadTemplateCsv').onclick=downloadProductTemplateCSV;
    $('#importProductsFile').onchange=e=>{const f=e.target.files[0]; if(f) handleProductImportFile(f); e.target.value='';};
    $('#exportBackup').onclick=()=>{hydrateState(); const blob=new Blob([SDCStore.exportData(state)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`respaldo-sd-comayagua-${fileStamp()}.json`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
    $('#manualBackup').onclick=()=>{SDCStore.saveBackup(state,'Respaldo completo');draw();toast('Copia local guardada.')};
    $$('[data-action="exportAll"]',modalRoot).forEach(b=>b.onclick=exportAllCSV);
    $('#importBackup').onchange=e=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=SDCStore.importData(r.result);hydrateState();closeModal();render();toast('Respaldo importado.')}catch(err){toast('No se pudo importar.')}}; r.readAsText(f)};
  }

  function quoteSummaryText(q){
    const date=new Date(q.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'});
    const products=(q.items||[]).map(x=>`${x.name}${selectedColorLabel(x)?` (${selectedColorLabel(x)})`:''}`).slice(0,2).join(', ')||'Sin productos';
    const more=(q.items||[]).length>2?` +${(q.items||[]).length-2}`:'';
    return `${date} · ${products}${more}`;
  }
  function statusOptions(selected='Cotizado'){
    return ['Cotizado','Esperando respuesta','Cliente interesado','Pendiente de pago','Vendido','Cancelado'].map(x=>`<option ${selected===x?'selected':''}>${x}</option>`).join('');
  }
  function reminderText(q){
    const c=calc(q);
    const products=(q.items||[]).map((i,idx)=>`${idx+1}. ${i.name}${selectedColorLabel(i)?` (${selectedColorLabel(i)})`:''} x${num(Math.max(1,+i.qty||1))}`).join('\n')||'Productos consultados';
    return `Hola ${q.client||'Cliente'}, buen día. 😊

Le saluda *SD COMAYAGUA*. Solo queremos confirmar si desea continuar con su cotización:

📋 *Cotización:* ${q.id||'SDC'}
🛍️ *Productos:*
${products}

💰 *Total cotizado:* *${money(c.total)}*

Si desea continuar, con gusto le confirmamos disponibilidad, entrega y forma de pago por este mismo medio.

📲 WhatsApp +504 3151-7755`;
  }
  function openSavedQuotes(){
    let q='';
    openModal(`<div class="modal-head"><h3>Cotizaciones guardadas</h3><button class="close">×</button></div><div class="modal-body saved-quotes-body"><div class="card-box saved-quotes-head"><b>Buscar cotización</b><span>Busca por cliente, teléfono, código, producto o estado. Puedes recordar al cliente o pasarla a venta.</span><div class="searchbar"><span class="icon">⌕</span><input id="quoteSearch" placeholder="Nombre, teléfono, código, estado o producto..."></div></div><div id="savedQuotesList" class="saved-quotes-list"></div></div>`,true);
    function draw(){
      const term=q.toLowerCase().trim();
      const list=(state.quotes||[]).filter(x=>{
        const hay=[x.id,x.client,x.phone,x.department,x.municipality,x.company,x.status,(x.items||[]).map(i=>i.name).join(' ')].join(' ').toLowerCase();
        return !term || hay.includes(term);
      });
      $('#savedQuotesList',modalRoot).innerHTML=list.map(x=>{const c=calc(x); return `<div class="saved-quote-card"><div class="saved-quote-main"><b>${escapeHtml(x.client||'Cliente sin nombre')}</b><span>${escapeHtml(x.phone||'Sin teléfono')} · ${escapeHtml(x.id||'COT')}</span><small>${escapeHtml(quoteSummaryText(x))}</small></div><div class="saved-quote-total"><span>Total</span><b>${money(c.total)}</b></div><label class="quote-status-inline"><span>Estado</span><select data-qstatus="${escapeHtml(x.id)}">${statusOptions(x.status||'Cotizado')}</select></label><div class="saved-quote-actions"><button class="btn small secondary" data-openquote="${escapeHtml(x.id)}">Abrir</button><button class="btn small" data-salequote="${escapeHtml(x.id)}">Pasar a venta</button><button class="btn small ghost" data-remindquote="${escapeHtml(x.id)}">Recordar</button><button class="btn small ghost" data-waquote="${escapeHtml(x.id)}">WhatsApp</button><button class="btn small danger" data-delquote="${escapeHtml(x.id)}">Borrar</button></div></div>`}).join('')||'<div class="empty-state">Todavía no hay cotizaciones guardadas.</div>';
      $$('[data-qstatus]',modalRoot).forEach(sel=>sel.onchange=()=>{const x=state.quotes.find(y=>y.id===sel.dataset.qstatus); if(x){x.status=sel.value; save(); toast('Estado actualizado.')}});
      $$('[data-openquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.openquote); if(!x)return; quote=SDCStore.clone(x); quote.editingId=x.id; openModal(quoteModalHTML(false),true); bindQuoteCommon(false); toast('Cotización abierta para modificar.');});
      $$('[data-salequote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.salequote); if(!x)return; closeModal(); openSale(null,x); toast('Cotización pasada a venta.');});
      $$('[data-waquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.waquote); if(!x)return; quote=SDCStore.clone(x); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); sendWhatsAppText(false);});
      $$('[data-remindquote]',modalRoot).forEach(b=>b.onclick=()=>{const x=state.quotes.find(y=>y.id===b.dataset.remindquote); if(!x)return; openWhatsApp(x.phone||'',reminderText(x));});
      $$('[data-delquote]',modalRoot).forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar esta cotización guardada?'))return; state.quotes=state.quotes.filter(x=>x.id!==b.dataset.delquote); save(); draw(); toast('Cotización borrada.');});
    }
    $('#quoteSearch',modalRoot).oninput=e=>{q=e.target.value;draw()}; draw();
  }

  function openProfit(){
    let selected='';
    const rowsBase=state.products.map(p=>({
      p,
      stock:productStock(p),
      unitCost:+p.cost||0,
      unitPrice:+p.price||0,
      unitProfit:(+p.price||0)-(+p.cost||0),
      totalProfit:((+p.price||0)-(+p.cost||0))*productStock(p)
    }));
    const cats=['Todas',...new Set(state.products.flatMap(p=>parseTags(categoryText(p)||p.categories||'')))];
    openModal(`<div class="modal-head"><h3>Ganancias</h3><button class="close">×</button></div><div class="modal-body profit-modal-v147"><div class="card-box profit-toolbar-v147"><label><span class="label">Categoría</span><select id="profitCategory" class="select">${cats.map(cat=>`<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}</select></label><div class="profit-summary-v147" id="profitSummary"></div></div><div class="table-wrap-v147"><table class="profit-table profit-table-v147"><thead><tr><th>Producto</th><th>Precio unidad</th><th>Precio venta</th><th>Precio ganancia</th><th>Stock</th><th>Ganancia total</th></tr></thead><tbody id="profitBody"></tbody></table></div></div>`,true);
    function draw(){
      selected=$('#profitCategory',modalRoot)?.value||'Todas';
      const filtered=rowsBase.filter(r=>selected==='Todas' || parseTags(categoryText(r.p)||r.p.categories||'').some(cat=>cat.toLowerCase()===selected.toLowerCase()));
      const total=filtered.reduce((a,r)=>a+r.totalProfit,0);
      const units=filtered.reduce((a,r)=>a+r.stock,0);
      const low=filtered.filter(r=>r.unitProfit>0 && r.unitProfit<10).length;
      $('#profitSummary',modalRoot).innerHTML=`<div><span>Productos</span><b>${num(filtered.length)}</b></div><div><span>Unidades</span><b>${num(units)}</b></div><div><span>Ganancia estimada</span><b>${moneyPrivate(total)}</b></div><div><span>Margen bajo</span><b>${num(low)}</b></div>`;
      $('#profitBody',modalRoot).innerHTML=filtered.map(r=>`<tr class="${r.unitProfit>0&&r.unitProfit<10?'low-profit-row':''}"><td><strong>${escapeHtml(r.p.name)}</strong><small>${escapeHtml(firstTag(r.p)||'Sin categoría')}</small></td><td>${moneyPrivate(r.unitCost)}</td><td>${moneyPrivate(r.unitPrice)}</td><td>${moneyPrivate(r.unitProfit)}</td><td>${num(r.stock)}</td><td>${moneyPrivate(r.totalProfit)}</td></tr>`).join('') || '<tr><td colspan="6">Sin productos en esta categoría.</td></tr>';
    }
    $('#profitCategory',modalRoot).onchange=draw;
    draw();
  }
  function saleProfit(s){return (s.items||[]).reduce((a,it)=>a+(itemTotal(it)-(Number(it.cost||0)*Number(it.qty||0))),0)}
  function isTodayISO(date){const d=new Date(date||Date.now()), n=new Date(); return d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate()}
  function openReceipts(){
    const sales=state.sales||[]; const today=sales.filter(s=>isTodayISO(s.date));
    const total=today.reduce((a,s)=>a+(s.total||calc(s).total),0); const profit=today.reduce((a,s)=>a+saleProfit(s),0); const expenses=(state.expenses||[]).filter(x=>isTodayISO(x.date)).reduce((a,x)=>a+(+x.amount||0),0); const net=profit-expenses; const pending=sales.filter(s=>/pendiente|recibir/i.test(s.status||s.paymentStatus||'')).reduce((a,s)=>a+(s.total||calc(s).total),0);
    openModal(`<div class="modal-head"><h3>Caja / recibos</h3><button class="close">×</button></div><div class="modal-body receipts-v22"><div class="cash-stats"><div><span>Ventas</span><b>${money(total)}</b></div><div><span>Ganancia bruta</span><b>${moneyPrivate(profit)}</b></div><div><span>Gastos hoy</span><b>${money(expenses)}</b></div><div><span>Ganancia neta</span><b>${moneyPrivate(net)}</b></div><div><span>Facturas</span><b>${num(today.length)}</b></div><div><span>Pendiente</span><b>${money(pending)}</b></div></div><div class="modal-actions" style="position:static"><button class="btn" data-action="dailyClose">Cierre del día</button><button class="btn secondary" data-action="expenses">Registrar gasto</button></div><div class="cart-list">${sales.map(s=>`<div class="cart-row"><div><b>${escapeHtml(s.client||'Cliente')}</b><br><span>${escapeHtml(s.id)} · ${money(s.total||calc(s).total)} · ${escapeHtml(s.status||s.paymentStatus||'Venta')}</span></div><button class="btn small secondary" data-openreceipt="${s.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todavía no hay ventas registradas.</div>'}</div></div>`,true);
    $$('[data-action="dailyClose"]',modalRoot).forEach(b=>b.onclick=openDailyClose);
    $$('[data-openreceipt]',modalRoot).forEach(b=>b.onclick=()=>{const s=state.sales.find(x=>x.id===b.dataset.openreceipt); if(s){saleDraft=SDCStore.clone(s); saleDraft.editingId=s.id; openModal(quoteModalHTML(true),true); bindQuoteCommon(true); toast('Puedes editar esta factura y guardar cambios.')}});
  }
  function openDailyClose(){
    const today=(state.sales||[]).filter(s=>isTodayISO(s.date));
    const todayExpenses=(state.expenses||[]).filter(x=>isTodayISO(x.date));
    const total=today.reduce((a,s)=>a+(s.total||calc(s).total),0);
    const products=today.reduce((a,s)=>a+calc(s).products,0);
    const delivery=today.reduce((a,s)=>a+calc(s).delivery,0);
    const profit=today.reduce((a,s)=>a+saleProfit(s),0);
    const expenses=todayExpenses.reduce((a,x)=>a+(+x.amount||0),0);
    const net=profit-expenses;
    const codTotal=today.filter(s=>s.cod).reduce((a,s)=>a+(s.total||calc(s).total),0);
    const normalTotal=total-codTotal;
    const txt=`CIERRE DEL DÍA - SD COMAYAGUA\nFecha: ${nowHN()}\nVentas: ${today.length}\nProductos vendidos: ${money(products)}\nEnvío/comisión: ${money(delivery)}\nTotal vendido: ${money(total)}\nNormal/prepago: ${money(normalTotal)}\nPagar al recibir: ${money(codTotal)}\nGastos del día: ${money(expenses)}\nGanancia bruta estimada: ${money(profit)}\nGANANCIA NETA: ${money(net)}\n\nGastos:\n${todayExpenses.map(x=>`- ${x.name}: ${money(x.amount)}`).join('\n')||'- Sin gastos registrados'}`;
    openModal(`<div class="modal-head"><h3>Cierre del día</h3><button class="close">×</button></div><div class="modal-body daily-close-v26"><div class="cash-stats"><div><span>Ventas</span><b>${money(total)}</b></div><div><span>Facturas</span><b>${num(today.length)}</b></div><div><span>Ganancia bruta</span><b>${moneyPrivate(profit)}</b></div><div><span>Gastos</span><b>${money(expenses)}</b></div><div><span>Ganancia neta</span><b>${moneyPrivate(net)}</b></div><div><span>Al recibir</span><b>${money(codTotal)}</b></div></div><textarea class="textarea" id="closeText">${escapeHtml(txt)}</textarea><div class="modal-actions" style="position:static"><button class="btn" id="saveClose">Guardar cierre</button><button class="btn secondary" id="copyClose">Copiar resumen</button><button class="btn ghost" id="openExpensesFromClose">Gastos</button></div></div>`,true);
    $('#copyClose').onclick=()=>{navigator.clipboard?.writeText($('#closeText').value); toast('Resumen copiado.');};
    $('#openExpensesFromClose').onclick=openExpenses;
    $('#saveClose').onclick=()=>{state.closings.unshift({id:'CIERRE-'+Date.now(),date:new Date().toISOString(),total,profit,expenses,net,count:today.length,text:$('#closeText').value}); save(); SDCStore.saveBackup(state,'Cierre del día'); toast('Cierre guardado.');};
  }

  function clientKeyFromDoc(doc){const phone=cleanPhone(doc?.phone||'').slice(-8); return phone || slugFile(doc?.client||'cliente');}
  function saveClientFromDoc(doc){
    hydrateState();
    const has=String(doc?.client||doc?.phone||doc?.reference||'').trim(); if(!has)return;
    const key=clientKeyFromDoc(doc); const c=calc(doc); const ix=state.clients.findIndex(x=>x.key===key || (x.phone&&cleanPhone(x.phone).slice(-8)===cleanPhone(doc.phone).slice(-8)));
    const item={key,name:doc.client||'Cliente',phone:doc.phone||'',department:doc.department||'',municipality:doc.municipality||'',reference:doc.reference||'',company:doc.company||'',lastTotal:c.total,lastDate:new Date().toISOString(),notes:''};
    if(ix>=0) state.clients[ix]={...state.clients[ix],...item}; else state.clients.unshift(item);
  }
  function applyClientToDoc(client,kind){
    const doc=kind==='sale'?saleDraft:quote; if(!doc)return;
    doc.client=client.name||''; doc.phone=client.phone||''; doc.department=client.department||'Comayagua'; doc.municipality=client.municipality||'Comayagua'; doc.reference=client.reference||''; doc.company=client.company||doc.company||'Forza';
    openModal(quoteModalHTML(kind==='sale'),true); bindQuoteCommon(kind==='sale'); toast('Cliente cargado en la cotización.');
  }
  function openClients(kind=null){
    hydrateState(); let q='';
    openModal(`<div class="modal-head"><h3>Clientes guardados</h3><button class="close">×</button></div><div class="modal-body clients-v22"><div class="card-box"><b>Agenda de clientes</b><span>Se llena automáticamente al guardar cotizaciones o ventas.</span><div class="searchbar"><span class="icon">⌕</span><input id="clientSearch" placeholder="Buscar nombre, teléfono, municipio o referencia..."></div></div><div id="clientsList"></div></div>`,true);
    function draw(){const term=q.toLowerCase().trim(); const list=(state.clients||[]).filter(c=>!term || [c.name,c.phone,c.department,c.municipality,c.reference,c.company].join(' ').toLowerCase().includes(term)); $('#clientsList').innerHTML=list.map(c=>`<div class="client-card-v22"><div><b>${escapeHtml(c.name||'Cliente')}</b><span>${escapeHtml(c.phone||'Sin teléfono')} · ${escapeHtml([c.department,c.municipality].filter(Boolean).join(' / ')||'Sin ubicación')}</span><small>${escapeHtml(c.reference||'Sin referencia')} · Último total ${money(c.lastTotal||0)}</small></div><div class="client-actions-v22">${kind?`<button class="btn small" data-useclient="${escapeHtml(c.key)}">Usar</button>`:''}<button class="btn small secondary" data-remindclient="${escapeHtml(c.key)}">WhatsApp</button><button class="btn small danger" data-delclient="${escapeHtml(c.key)}">Borrar</button></div></div>`).join('')||'<div class="empty-state">Aún no hay clientes guardados.</div>'; $$('[data-useclient]').forEach(b=>b.onclick=()=>{const c=state.clients.find(x=>x.key===b.dataset.useclient); if(c)applyClientToDoc(c,kind)}); $$('[data-remindclient]').forEach(b=>b.onclick=()=>{const c=state.clients.find(x=>x.key===b.dataset.remindclient); if(c)openWhatsApp(c.phone||'',`Hola ${c.name||''}, le saluda SD COMAYAGUA. ¿Desea que le ayudemos con algún producto o cotización?`)}); $$('[data-delclient]').forEach(b=>b.onclick=()=>{if(!confirm('¿Borrar este cliente guardado?'))return; state.clients=state.clients.filter(x=>x.key!==b.dataset.delclient); save(); draw();});}
    $('#clientSearch').oninput=e=>{q=e.target.value;draw()}; draw();
  }
  function marketplaceText(p){
    const title=`${p.name} - Disponible en Comayagua`;
    return `FACEBOOK MARKETPLACE\nTítulo: ${title}\nPrecio: ${money(productQuotedUnit(p))}\nEstado: Nuevo\nCategoría sugerida: ${autoProductSpecs(p).categoria}\n\nDescripción:\n${productDescription(p)}\n\nDatos rápidos:\n• Código: ${p.id}\n• Depósito / Tigo Money: Lps.110\n• Pagar al Recibir: Lps.110 + comisión 10%\n• Envío Local: por definir según zona\n• WhatsApp: +504 3151-7755\n\nEtiquetas Facebook:\nComayagua, Honduras, tienda online, envío a domicilio, SD Comayagua, productos gamer, accesorios para celular\n\nINSTAGRAM:\n${p.name} disponible 🔥\nPrecio: ${money(productQuotedUnit(p))}\nDepósito Lps.110 · Pagar al Recibir Lps.110 + 10% · Local por definir\nConsulta por WhatsApp +504 3151-7755\n\n#Comayagua #Honduras #SDComayagua #TiendaOnline #GamerHonduras #AccesoriosCelular #EnviosHonduras`;
  }
  function catalogText(p){
    return `WHATSAPP CATÁLOGO\nNombre: ${p.name}\nPrecio: ${money(productQuotedUnit(p))}\nPrecio de oferta: ${money(productQuotedUnit(p))}\nCódigo: ${p.id}\nCategoría: ${autoProductSpecs(p).categoria}\nPaís de origen: Honduras\n\nDescripción:\n${productDescription(p)}\n\nDepósito / Tigo Money: Lps.110. Pagar al Recibir: Lps.110 + comisión del 10%. Envío Local: Por definir. WhatsApp: +504 3151-7755`;
  }
  function openMarketingText(id){
    const p=productById(id); if(!p)return;
    const text=`${marketplaceText(p)}\n\n------------------------------\n\n${catalogText(p)}`;
    openModal(`<div class="modal-head"><h3>Textos para vender</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box"><h4>${escapeHtml(p.name)}</h4><p style="color:#b8c8d8">Texto listo para Marketplace, Instagram y WhatsApp Catálogo.</p><textarea class="textarea" id="marketingText" style="min-height:360px">${escapeHtml(text)}</textarea><div class="modal-actions" style="position:static"><button class="btn" id="copyMarketing">Copiar todo</button><button class="btn secondary" id="waMarketing">Enviar WhatsApp</button></div></div></div>`,true);
    $('#copyMarketing').onclick=()=>{navigator.clipboard?.writeText($('#marketingText').value); toast('Texto copiado.');};
    $('#waMarketing').onclick=()=>openWhatsApp('', $('#marketingText').value);
  }
  async function sendCompleteQuote(){
    if(!quote.items.length)return toast('Agrega productos primero.');
    saveCurrentQuote();
    await shareDocPhoto(false);
  }

  function toggleCaptureClean(){
    state.settings.captureClean=!state.settings.captureClean;
    if(state.settings.captureClean) state.settings.cardView='client';
    save(); applyAppearance(); render(); toast(state.settings.captureClean?'Modo captura activado. Toque SALIR o CAPTURA para volver a la vista normal.':'Captura desactivada. Ya volvió a la vista normal.');
  }

  function toggleMoneyLock(){
    if(state.settings.moneyLocked){
      const pin=prompt('Ingresa la clave para mostrar ganancias:');
      if(pin!==(state.settings.accessKey||'199311')) return toast('Clave incorrecta.');
      state.settings.moneyLocked=false;
    }else{
      state.settings.moneyLocked=true;
    }
    save(); applyAppearance(); render(); toast(state.settings.moneyLocked?'Ganancias ocultas.':'Ganancias visibles.');
  }
  function autoFillClientByPhone(doc,isSale){
    const p=cleanPhone(doc.phone||'').slice(-8); if(p.length<8 || doc.__clientAutofilled===p) return;
    const c=(state.clients||[]).find(x=>cleanPhone(x.phone||'').slice(-8)===p);
    if(!c) return;
    doc.__clientAutofilled=p;
    doc.client=doc.client||c.name||''; doc.department=c.department||doc.department; doc.municipality=c.municipality||doc.municipality; doc.reference=doc.reference||c.reference||''; doc.company=c.company||doc.company;
    toast('Cliente frecuente cargado automáticamente.');
  }
  function openQuickSale(){
    const doc=emptySale(); saleDraft=doc;
    openModal(`<div class="modal-head"><h3>Venta rápida</h3><button class="close">×</button></div><div class="modal-body quick-sale-v26"><div class="card-box"><b>Venta rápida desde celular</b><span>Producto, color, cantidad y tipo de envío. Los datos del cliente son opcionales.</span><div class="searchbar"><span class="icon">⌕</span><input id="quickSearch" placeholder="Buscar producto..."></div><div id="quickList" class="picker-list"></div></div><div class="card-box"><label><span class="label">Cantidad</span><input id="quickQty" class="input" type="number" inputmode="numeric" value="1" min="1"></label><div id="quickColorBox" class="quick-color-box-v86"></div><label><span class="label">Tipo de cobro</span><select id="quickType" class="select"><option value="Normal">Depósito Lps.110</option><option value="COD">Pagar al Recibir Lps.110 + 10%</option><option value="Local">Envío Local: Por definir</option></select></label><label><span class="label">Envío Lps.</span><input id="quickShip" class="input" type="number" inputmode="numeric" value="110" min="0" placeholder="Escriba el costo"></label><label><span class="label">Teléfono cliente opcional</span><input id="quickPhone" class="input" inputmode="tel" placeholder="31517755"></label><label><span class="label">Cliente opcional</span><input id="quickClient" class="input" placeholder="Nombre"></label><div id="quickSummary" class="summary"></div><button class="btn full" id="quickFinish">Registrar venta rápida</button></div></div>`,true);
    let selected=null, q='';
    function selectedQuickColor(){const p=productById(selected); return hasColorStock(p)?($('#quickColor',modalRoot)?.value||defaultColorForProduct(p)):'';}
    function drawQuickColors(){
      const box=$('#quickColorBox',modalRoot); if(!box) return;
      const p=productById(selected); const rows=productColorRows(p).filter(r=>Number(r.qty)>0);
      if(!p || !rows.length){box.innerHTML=''; return;}
      const current=$('#quickColor',modalRoot)?.value || defaultColorForProduct(p);
      box.innerHTML=`<label><span class="label">Color disponible</span><select id="quickColor" class="select">${rows.map(r=>`<option value="${escapeHtml(r.name)}" ${colorKey(current)===colorKey(r.name)?'selected':''}>${escapeHtml(r.name)} · ${num(r.qty)} disponibles</option>`).join('')}</select></label>`;
      $('#quickColor',modalRoot).onchange=drawSummary;
    }
    function drawList(){
      const term=q.toLowerCase();
      const list=activeProducts().filter(p=>!term||[p.name,p.id,categoryText(p)].join(' ').toLowerCase().includes(term)).slice(0,30);
      $('#quickList').innerHTML=list.map(p=>`<div class="picker-item ${selected===p.id?'active':''}"><img loading="lazy" decoding="async" src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(productQuotedUnit(p))} · Stock ${num(productStock(p))}${colorStockSummary(p,2)?` · ${escapeHtml(colorStockSummary(p,2))}`:''}</span></div><button class="btn small" data-qselect="${escapeHtml(p.id)}">Elegir</button></div>`).join('');
      $$('[data-qselect]',modalRoot).forEach(b=>b.onclick=()=>{selected=b.dataset.qselect; drawList(); drawQuickColors(); drawSummary();});
    }
    function drawSummary(){
      const p=productById(selected); const qty=Math.max(1,+($('#quickQty')?.value||1));
      if(!p){$('#quickSummary').innerHTML='<div class="empty-state">Elegí un producto.</div>';return;}
      const color=selectedQuickColor();
      const products=productItemsTotal(p,qty); const type=$('#quickType').value; const cod=type==='COD'; const shipping=type==='COD'?SHIPPING.cod.fee:type==='Local'?(+$('#quickShip').value||0):SHIPPING.normal.fee; const total=cod?codGrandTotal(products+shipping):products+shipping; const offer=promoLabelForQty(p,qty); const shipName=type==='Local'?'Envío local':type==='COD'?'Pagar al recibir':'Depósito';
      const colorLine=color?`<div class="summary-row"><b>Color</b><b>${escapeHtml(color)} · ${num(colorQtyAvailable(p,color))} disp.</b></div>`:'';
      $('#quickSummary').innerHTML=`${colorLine}<div class="summary-row"><b>Producto</b><b>${money(products)}</b></div><div class="summary-row"><b>${shipName}</b><b>${money(shipping)}</b></div>${offer?`<div class="promo-applied-v26">🎁 ${escapeHtml(offer)}</div>`:''}<div class="summary-total"><b>Total</b><b>${money(total)}</b></div>`;
    }
    $('#quickSearch').oninput=e=>{q=e.target.value;drawList()}; $('#quickQty').oninput=drawSummary; $('#quickShip').oninput=drawSummary; $('#quickType').onchange=()=>{const t=$('#quickType').value; $('#quickShip').value=t==='COD'?SHIPPING.cod.fee:t==='Local'?0:SHIPPING.normal.fee; drawSummary();}; drawList(); drawQuickColors(); drawSummary();
    $('#quickFinish').onclick=()=>{const p=productById(selected); if(!p)return toast('Elegí un producto.'); const qty=Math.max(1,+$('#quickQty').value||1); const color=selectedQuickColor(); if(hasColorStock(p) && !color)return toast('Elegí el color.'); saleDraft=emptySale(); saleDraft.client=$('#quickClient').value.trim(); saleDraft.phone=$('#quickPhone').value.trim(); saleDraft.shippingType=$('#quickType').value; saleDraft.cod=saleDraft.shippingType==='COD'; saleDraft.shipping=+$('#quickShip').value||0; applyShippingPreset(saleDraft,saleDraft.shippingType,false); saleDraft.shipping=+$('#quickShip').value||0; saleDraft.status=isCodDoc(saleDraft)?'Pagar al recibir':isLocalDoc(saleDraft)?'Entrega local':'Vendido'; saleDraft.items=[{id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty,color,image:productImage(p)}]; finishSale(); closeModal(); render();};
  }
  function openExpenses(){
    hydrateState(); let today=(state.expenses||[]).filter(x=>isTodayISO(x.date)); const total=today.reduce((a,x)=>a+(+x.amount||0),0);
    openModal(`<div class="modal-head"><h3>Gastos del negocio</h3><button class="close">×</button></div><div class="modal-body expenses-v26"><div class="cash-stats"><div><span>Gastos hoy</span><b>${money(total)}</b></div><div><span>Registros</span><b>${num(today.length)}</b></div></div><div class="card-box"><label><span class="label">Concepto</span><input id="expenseName" class="input" placeholder="Empaque, transporte, publicidad..."></label><label><span class="label">Monto Lps.</span><input id="expenseAmount" class="input" type="number" inputmode="numeric" placeholder="0"></label><button class="btn full" id="saveExpense">Guardar gasto</button></div><div class="cart-list" id="expenseList"></div></div>`,true);
    function draw(){today=(state.expenses||[]).filter(x=>isTodayISO(x.date)); $('#expenseList').innerHTML=today.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.name)}</b><br><span>${new Date(x.date).toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})} · ${money(x.amount)}</span></div><button class="btn small danger" data-delexp="${x.id}">Borrar</button></div>`).join('')||'<div class="empty-state">Sin gastos hoy.</div>'; $$('[data-delexp]',modalRoot).forEach(b=>b.onclick=()=>{state.expenses=state.expenses.filter(x=>x.id!==b.dataset.delexp); save(); draw();});}
    $('#saveExpense').onclick=()=>{const name=$('#expenseName').value.trim()||'Gasto'; const amount=+$('#expenseAmount').value||0; if(amount<=0)return toast('Escribe el monto del gasto.'); state.expenses.unshift({id:'GASTO-'+Date.now(),name,amount,date:new Date().toISOString()}); save(); toast('Gasto guardado.'); openExpenses();}; draw();
  }
  function shortReceiptVariant(doc,type){
    const d=SDCStore.clone(doc||{});
    const key=type==='COD'?'COD':'Normal';
    applyShippingPreset(d,key,true);
    d.shipping=key==='COD'?SHIPPING.cod.fee:SHIPPING.normal.fee;
    d.cod=key==='COD';
    d.shippingType=key;
    d.receiptVariantLabel=key==='COD'?'Pagar al recibir':'Envío normal';
    return d;
  }
  function shortReceiptLinesHTML(doc){
    return (doc.items||[]).map((it,idx)=>{
      const qty=Math.max(1,+it.qty||1);
      const color=selectedColorLabel(it);
      const total=itemTotal(it);
      const unit=qty?total/qty:total;
      const qtyText=`${num(qty)} ${qty===1?'unidad':'unidades'}`;
      return `<article class="sdc208-line">
        <div class="sdc208-line-index">${num(idx+1)}</div>
        <div class="sdc208-line-copy">
          <b>${escapeHtml(it.name)}</b>
          <span>${qtyText} · ${money(unit)} c/u</span>
          ${color?`<em>Color: ${escapeHtml(color)}</em>`:''}
        </div>
        <strong>${money(total)}</strong>
      </article>`;
    }).join('');
  }
  function shortReceiptCardHTML(doc){
    const c=calc(doc);
    const variant=doc.receiptVariantLabel || shippingLabel(doc);
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,+it.qty||1),0);
    const client=String(doc.client||'Cliente').trim()||'Cliente';
    return `<div class="short-receipt sdc208-ticket" id="shortReceiptCard">
      <header class="sdc208-head">
        <div class="sdc208-logo"><img class="receipt-logo-inline" src="${exportLogoSrc()}" alt="SD Comayagua" loading="lazy" decoding="async"></div>
        <div class="sdc208-head-copy">
          <span>SD COMAYAGUA</span>
          <h2>Recibo corto</h2>
          <p>${escapeHtml(nowHN())}</p>
        </div>
        <div class="sdc208-mode">${escapeHtml(variant)}</div>
      </header>
      <section class="sdc208-meta">
        <div><span>Cliente</span><b>${escapeHtml(client)}</b></div>
        <div><span>Artículos</span><b>${num(itemCount)}</b></div>
      </section>
      <section class="sdc208-section"><span>Detalle del pedido</span></section>
      <section class="sdc208-lines">${shortReceiptLinesHTML(doc)||'<div class="sdc208-empty">Sin productos agregados.</div>'}</section>
      <section class="sdc208-summary">
        <div><span>Productos</span><b>${money(c.products)}</b></div>
        <div><span>${escapeHtml(shippingLabel(doc))}</span><b>${money(c.shipping)}</b></div>
        ${c.commission?`<div><span>Comisión</span><b>${money(c.commission)}</b></div>`:''}
      </section>
      <section class="sdc208-grand">
        <span>Total a pagar</span>
        <b>${money(c.total)}</b>
      </section>
      <footer class="sdc208-foot">
        <span>Confirme disponibilidad, entrega y pago antes de cerrar el pedido.</span>
        <b>WhatsApp +504 3151-7755</b>
      </footer>
    </div>`;
  }
  function shortReceiptExportCSS(){return `
    .shortReceiptExportHost{position:fixed;left:-10000px;top:0;width:600px;padding:24px;background:#eaf3fb;z-index:-1}
    .shortReceiptExportHost *{box-sizing:border-box}
    .shortReceiptExportHost .sdc208-ticket{width:540px;max-width:540px;margin:0 auto;padding:20px;border-radius:32px;background:#ffffff;color:#07192f;border:1px solid #d8e7f6;box-shadow:0 20px 52px rgba(7,26,53,.10);overflow:hidden;font-family:Barlow,Arial,sans-serif}
    .shortReceiptExportHost .sdc208-head{display:grid;grid-template-columns:68px minmax(0,1fr);grid-template-areas:"logo copy" "mode mode";gap:14px;align-items:center;padding:18px;border-radius:27px;background:linear-gradient(135deg,#071a35 0%,#0b63ce 72%,#0a7cf2 100%);color:#fff}
    .shortReceiptExportHost .sdc208-logo{grid-area:logo;width:68px;height:68px;border-radius:21px;background:#fff;display:grid;place-items:center;border:1px solid rgba(255,255,255,.7);box-shadow:0 16px 32px rgba(0,0,0,.16)}
    .shortReceiptExportHost .sdc208-logo img{width:52px;height:52px;object-fit:contain}
    .shortReceiptExportHost .sdc208-head-copy{grid-area:copy;min-width:0}
    .shortReceiptExportHost .sdc208-head-copy span{display:block;color:#bfe0ff;font-size:13px;line-height:1;font-weight:950;letter-spacing:.16em;text-transform:uppercase}
    .shortReceiptExportHost .sdc208-head-copy h2{margin:8px 0 5px;color:#fff;font-size:34px;line-height:.92;letter-spacing:-.05em}
    .shortReceiptExportHost .sdc208-head-copy p{margin:0;color:#dcecff;font-size:15px;line-height:1.15;font-weight:850}
    .shortReceiptExportHost .sdc208-mode{grid-area:mode;justify-self:start;display:inline-flex;align-items:center;min-height:42px;padding:0 18px;border-radius:999px;background:#fff;color:#0b63ce;font-size:14px;font-weight:950;box-shadow:0 12px 24px rgba(0,0,0,.11)}
    .shortReceiptExportHost .sdc208-meta{display:grid;grid-template-columns:minmax(0,1fr) 112px;gap:10px;margin:14px 0}
    .shortReceiptExportHost .sdc208-meta div{padding:15px;border-radius:22px;background:#f7fbff;border:1px solid #dbe8f6}
    .shortReceiptExportHost .sdc208-meta span,.shortReceiptExportHost .sdc208-summary span,.shortReceiptExportHost .sdc208-grand span{display:block;color:#637d96;font-size:11px;line-height:1;font-weight:950;letter-spacing:.11em;text-transform:uppercase;margin-bottom:7px}
    .shortReceiptExportHost .sdc208-meta b{display:block;color:#07192f;font-size:22px;line-height:1.08;word-break:break-word}
    .shortReceiptExportHost .sdc208-section{margin:9px 0 11px;display:flex;align-items:center;gap:10px}
    .shortReceiptExportHost .sdc208-section::after{content:"";flex:1;height:1px;background:#dbe8f6}
    .shortReceiptExportHost .sdc208-section span{color:#07192f;font-size:14px;font-weight:950;letter-spacing:.12em;text-transform:uppercase}
    .shortReceiptExportHost .sdc208-lines{display:grid;gap:10px;margin-bottom:16px}
    .shortReceiptExportHost .sdc208-line{display:grid;grid-template-columns:38px minmax(0,1fr);gap:11px;align-items:start;padding:14px;border-radius:22px;background:#fff;border:1px solid #dbe8f6;box-shadow:0 8px 20px rgba(7,26,53,.035)}
    .shortReceiptExportHost .sdc208-line-index{width:38px;height:38px;display:grid;place-items:center;border-radius:14px;background:#eef6ff;color:#0b63ce;font-size:14px;font-weight:950}
    .shortReceiptExportHost .sdc208-line-copy{display:grid;gap:4px;min-width:0}
    .shortReceiptExportHost .sdc208-line-copy b{display:block;color:#07192f;font-size:18px;line-height:1.12;word-break:break-word}
    .shortReceiptExportHost .sdc208-line-copy span,.shortReceiptExportHost .sdc208-line-copy em{display:block;color:#657c95;font-size:13px;line-height:1.2;font-weight:850;font-style:normal}
    .shortReceiptExportHost .sdc208-line strong{grid-column:2;justify-self:end;display:block;color:#d61c3b;font-size:23px;line-height:1;font-weight:950;white-space:nowrap;padding-left:8px;margin-top:4px}
    .shortReceiptExportHost .sdc208-empty{padding:18px;border-radius:18px;background:#f7fbff;border:1px solid #dbe8f6;color:#667f98;text-align:center;font-weight:850}
    .shortReceiptExportHost .sdc208-summary{display:grid;gap:8px;margin:0 0 14px;padding:10px;border-radius:24px;background:#f3f8ff;border:1px solid #dbe8f6}
    .shortReceiptExportHost .sdc208-summary div{min-height:54px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 14px;border-radius:17px;background:#fff;border:1px solid #e2edf8}
    .shortReceiptExportHost .sdc208-summary b{color:#07192f;font-size:19px;line-height:1;white-space:nowrap}
    .shortReceiptExportHost .sdc208-grand{min-height:88px;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 20px;border-radius:26px;background:linear-gradient(135deg,#071a35,#0b63ce);color:#fff;box-shadow:0 16px 36px rgba(11,99,206,.20)}
    .shortReceiptExportHost .sdc208-grand span{margin:0;color:#dbeafe}
    .shortReceiptExportHost .sdc208-grand b{color:#fff;font-size:39px;line-height:.92;letter-spacing:-.05em;white-space:nowrap}
    .shortReceiptExportHost .sdc208-foot{margin-top:14px;display:grid;gap:10px}
    .shortReceiptExportHost .sdc208-foot span{display:block;padding:14px;border-radius:20px;background:#fbfdff;border:1px dashed #cfe3fb;color:#667f98;text-align:center;font-size:13px;line-height:1.3;font-weight:850}
    .shortReceiptExportHost .sdc208-foot b{display:block;padding:15px;border-radius:20px;background:#071a35;color:#fff;text-align:center;font-size:17px;line-height:1;font-weight:950}
  `}
  function shortReceiptText(doc){
    const c=calc(doc);
    const isCod=isCodDoc(doc);
    const mode=isCod?'🚚 *ENVÍO PAGAR AL RECIBIR*':'🚚 *ENVÍO NORMAL*';
    const client=String(doc.client||'Cliente').trim()||'Cliente';
    const itemCount=(doc.items||[]).reduce((a,it)=>a+Math.max(1,+it.qty||1),0);
    return [
      '🧾 *FACTURA CORTA COMERCIAL*',
      '━━━━━━━━━━━━━━━━━━━━',
      mode,
      '',
      '🏪 *SD COMAYAGUA*',
      `👤 Cliente: *${client}*`,
      `📦 Artículos: *${num(itemCount)}*`,
      '',
      '🛍️ *PRODUCTOS*',
      ...(doc.items||[]).map((it,idx)=>{
        const qty=Math.max(1,+it.qty||1);
        const total=itemTotal(it);
        const unit=qty?total/qty:total;
        return `${idx+1}️⃣ *${it.name}*
   • Cantidad: *${num(qty)} ${qty===1?'unidad':'unidades'}*
   • Precio c/u: *${money(unit)}*${selectedColorLabel(it)?`\n   • Color: *${selectedColorLabel(it)}*`:''}
   • Total: *${money(total)}*`;
      }),
      '',
      '💰 *RESUMEN*',
      `• Productos: *${money(c.products)}*`,
      `• ${shippingLabel(doc)}: *${money(c.shipping)}*`,
      ...(c.commission?[`• Comisión: *${money(c.commission)}*`]:[]),
      '',
      `✅ *TOTAL A PAGAR: ${money(c.total)}*`,
      '',
      isCod?'📌 El cliente paga el total al recibir el paquete.':'📌 Envío normal por depósito / Tigo Money.',
      '📲 WhatsApp +504 3151-7755'
    ].filter(Boolean).join('\n');
  }
  async function downloadShortReceiptImage(doc,label='actual'){
    if(!doc || !(doc.items||[]).length) return toast('Agrega productos primero.');
    const host=document.createElement('div');
    host.className='shortReceiptExportHost';
    host.innerHTML=`<style>${shortReceiptExportCSS()}</style>${shortReceiptCardHTML(doc)}`;
    document.body.appendChild(host);
    try{
      await waitForImages(host);
      const node=host.querySelector('.short-receipt');
      const blob=await captureNodeAsPngBlob(node,isMobileDevice()?1.55:2.2);
      if(!blob) throw new Error('No se pudo generar el recibo.');
      downloadBlob(blob,`recibo-corto-${label}-${clientLabel(doc)}-${fileStamp()}-${slugFile(doc.id||'sdc')}.png`);
      toast(label.includes('pagar')?'Recibo corto al recibir descargado.':'Recibo corto normal descargado.');
    }catch(err){
      console.error(err);
      toast('No se pudo descargar el recibo corto. Revisa si cargó html2canvas.');
    }finally{
      host.remove();
    }
  }
  function openShortReceipt(isSale){
    const doc=currentDoc(isSale);
    const normalDoc=shortReceiptVariant(doc,'Normal');
    const codDoc=shortReceiptVariant(doc,'COD');
    openModal(`<div class="modal-head short-receipt-head"><h3>Factura corta comercial</h3><button class="close">×</button></div><div class="modal-body short-receipt-screen short-receipt-screen-v72 short-receipt-screen-v147"><div class="short-receipt-tip-v156">Elige la opción ideal para compartir por WhatsApp. El cliente verá claramente cuánto pagará según el tipo de entrega.</div><div class="short-receipt-grid-v147"><section class="short-receipt-variant-v147 short-receipt-variant-v157 short-receipt-variant-v158"><div class="short-receipt-preview-wrap">${shortReceiptCardHTML(normalDoc)}</div><button class="btn secondary full" id="downloadShortNormal">Descargar para WhatsApp · Envío normal</button></section><section class="short-receipt-variant-v147 short-receipt-variant-v157 short-receipt-variant-v158"><div class="short-receipt-preview-wrap">${shortReceiptCardHTML(codDoc)}</div><button class="btn full" id="downloadShortCOD">Descargar para WhatsApp · Pagar al recibir</button></section></div><div class="modal-actions short-receipt-actions" style="position:static"><button class="btn secondary" id="backFromShortReceipt">← Atrás</button><button class="btn secondary" id="copyShortReceipt">Copiar texto</button></div></div>`,true);
    $('#backFromShortReceipt')&&($('#backFromShortReceipt').onclick=()=>{openModal(quoteModalHTML(isSale),true); bindQuoteCommon(isSale); toast('Volviste a la cotización sin borrar los datos.');});
    $('#downloadShortNormal')&&($('#downloadShortNormal').onclick=()=>downloadShortReceiptImage(normalDoc,'recibo-1-envio-normal'));
    $('#downloadShortCOD')&&($('#downloadShortCOD').onclick=()=>downloadShortReceiptImage(codDoc,'recibo-2-pagar-al-recibir'));
    $('#copyShortReceipt').onclick=()=>{
      navigator.clipboard?.writeText(shortReceiptText(normalDoc)+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n'+shortReceiptText(codDoc)); toast('Recibos cortos copiados.');
    };
  }
  function csvBlobDownload(filename,content){const blob=new Blob([content],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  function exportAllCSV(){
    const lines=['tipo,id,fecha,cliente,telefono,estado,total,productos'];
    (state.sales||[]).forEach(s=>lines.push(['venta',s.id,s.date,s.client,s.phone,s.status||'',calc(s).total,(s.items||[]).map(i=>`${i.name}${selectedColorLabel(i)?` (${selectedColorLabel(i)})`:''} x${i.qty}`).join(' | ')].map(csvEscape).join(',')));
    (state.quotes||[]).forEach(q=>lines.push(['cotizacion',q.id,q.date,q.client,q.phone,q.status||'',calc(q).total,(q.items||[]).map(i=>`${i.name}${selectedColorLabel(i)?` (${selectedColorLabel(i)})`:''} x${i.qty}`).join(' | ')].map(csvEscape).join(',')));
    (state.clients||[]).forEach(c=>lines.push(['cliente',c.key,c.lastDate,c.name,c.phone,c.municipality,c.lastTotal,c.reference].map(csvEscape).join(',')));
    csvBlobDownload(`ventas-clientes-sdc-${fileStamp()}.csv`,lines.join('\n'));
  }

  function openAlertsV196(){
    const m=alertMetrics();
    const groups=[
      {key:'lowStock',title:'Bajo stock',count:m.low,copy:'Productos que conviene reponer pronto.',items:m.lowStockProducts,accent:'warn',label:p=>`Solo ${num(productStock(p))} unidades`},
      {key:'outStock',title:'Agotados',count:m.out,copy:'Productos con stock en cero.',items:m.outStockProducts,accent:'bad',label:p=>'Stock en cero'},
      {key:'noCost',title:'Sin costo',count:m.nocost,copy:'Falta costo para calcular ganancia real.',items:m.noCostProducts,accent:'info',label:p=>'Revisar costo'},
      {key:'lowProfit',title:'Ganancia baja',count:m.lowMargin,copy:'Utilidad menor a Lps. 10 por unidad.',items:m.lowProfitProducts,accent:'warn',label:p=>`Gana ${moneyPrivate((Number(p.price||0)-Number(p.cost||0)))}`},
      {key:'noImage',title:'Sin imagen',count:m.noImage,copy:'Productos sin foto subida.',items:m.noImageProducts,accent:'info',label:p=>'Agregar imagen'}
    ];
    const cards=groups.map(g=>`<button type="button" class="alerts-summary-card-v196 ${g.accent}" data-alert-filter-v196="${g.key}"><span>${escapeHtml(g.title)}</span><b>${num(g.count)}</b><small>${escapeHtml(g.copy)}</small></button>`).join('');
    const rows=groups.flatMap(g=>g.items.slice(0,24).map(p=>({group:g,p}))).slice(0,90).map(({group:g,p})=>`<div class="alert-row-v196 ${g.accent}"><div><b>${escapeHtml(p.name)}</b><span>${escapeHtml(g.title)} · ${escapeHtml(g.label(p))}</span></div><button class="btn small secondary" type="button" data-edit-alert-product-v196="${escapeHtml(p.id)}">Editar</button></div>`).join('') || '<div class="empty-state">No hay alertas pendientes.</div>';
    openModal(`<div class="modal-head alerts-head-v196"><div><small>Centro de revisión</small><h3>Alertas</h3></div><button class="close">×</button></div><div class="modal-body alerts-modal-v196"><div class="alerts-total-v196"><span>Total alertas</span><b>${num(m.total)}</b><small>${num(activeProducts().length)} productos revisados</small></div><div class="alerts-summary-grid-v196">${cards}</div><div class="alerts-list-v196">${rows}</div></div>`,true);
    $$('[data-alert-filter-v196]',modalRoot).forEach(btn=>btn.onclick=()=>{
      const special=btn.getAttribute('data-alert-filter-v196')||'';
      closeModal();
      filter.cat='Todos'; filter.q=''; filter.special=special;
      render();
      setTimeout(()=>{document.getElementById('inventario')?.scrollIntoView({behavior:'smooth',block:'start'}); toast(`Filtro aplicado: ${btn.querySelector('span')?.textContent||'Alertas'}.`);},80);
    });
    $$('[data-edit-alert-product-v196]',modalRoot).forEach(btn=>btn.onclick=()=>{const id=btn.getAttribute('data-edit-alert-product-v196'); closeModal(); openProductEditor(id);});
  }

  function openLowProfit(){
    const rows=alertMetrics().lowProfitProducts
      .sort((a,b)=>(Number(a.price||0)-Number(a.cost||0))-(Number(b.price||0)-Number(b.cost||0)))
      .map(p=>{
        const gain=Math.max(0,Number(p.price||0)-Number(p.cost||0));
        return `<div class="cart-row low-profit-row-v84"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)} · Precio ${money(p.price)} · Costo ${money(p.cost)} · Gana ${money(gain)}</span></div><button class="btn small secondary" data-editprofit="${escapeHtml(p.id)}">Editar</button></div>`;
      }).join('') || '<div class="empty-state">No hay productos con ganancia baja. El capitalismo respira tranquilo por ahora.</div>';
    openModal(`<div class="modal-head"><h3>Ganancia baja</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box low-profit-note-v84"><b>Revisa estos precios</b><span>Son productos con costo y precio registrados, pero con menos de Lps. 10 de utilidad por unidad.</span></div><div class="cart-list">${rows}</div></div>`,true);
    $$('[data-editprofit]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();openProductEditor(b.dataset.editprofit)});
  }

  function openNoCost(){openModal(`<div class="modal-head"><h3>Productos sin costo</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${state.products.filter(p=>+p.cost<=0).map(p=>`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)}</span></div><button class="btn small secondary" data-editcost="${p.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todo tiene costo registrado.</div>'}</div></div>`,true); $$('[data-editcost]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();openProductEditor(b.dataset.editcost)})}

  // Compatibilidad final: cualquier parche antiguo que llame "Sheets" ahora usa Firebase.
  async function saveProductToSheets(product, previousId=''){return saveProductToFirebase(product, previousId)}
  async function archiveProductInSheets(productId){return archiveProductInFirebase(productId)}
  async function updateProductStockInSheets(productId, stock){
    const p=productById(productId);
    if(!p) return false;
    return syncStockAfterSale([productId]);
  }
  async function saveDocumentToSheets(doc, kind){return saveDocumentToFirebase(doc, kind)}
  async function syncStockAfterSale(ids){
    await waitForFirebase().catch(()=>null);
    if(typeof window.actualizarStockFirebase!=='function') return false;
    const list=Array.from(ids||[]).map(id=>productById(id)).filter(Boolean);
    for(const p of list){
      await window.actualizarStockFirebase(p.id, productToFirebasePayload(p));
    }
    if(list.length){
      state.settings.lastFirebaseSync=new Date().toISOString();
      save();
    }
    return !!list.length;
  }


  // SDC V196: API segura para que el menú premium abra funciones reales del panel.
  window.SDCAppV196 = {
    setPage:setPageV150,
    render,
    openSale,
    openQuote,
    openProfit,
    openReceipts,
    openNotifications,
    openAlertsV196,
    openProductEditor,
    openSavedQuotes,
    openCategoriesSheet,
    applyCategory,
    toast
  };
  window.SDCApp = window.SDCAppV196;

  // SDC v287: controles delegados robustos para móvil/PC.
  // Evita que botones Comayagua/Honduras, + y - fallen si el render cambia o hay capas encima.
  (function(){
    if(window.__sdcV287Controls) return;
    window.__sdcV287Controls = true;

    document.addEventListener('click', function(ev){
      const route = ev.target && ev.target.closest && ev.target.closest('[data-route-id][data-route-mode]');
      if(route){
        ev.preventDefault();
        ev.stopPropagation();
        const id = route.getAttribute('data-route-id');
        const mode = route.getAttribute('data-route-mode') === 'local' ? 'local' : 'hn';
        setProductDeliveryMode(id, mode);
        return false;
      }

      const minus = ev.target && ev.target.closest && ev.target.closest('[data-cqty-minus]');
      if(minus){
        ev.preventDefault();
        ev.stopPropagation();
        const id = minus.getAttribute('data-cqty-minus');
        setClientQty(id, clientQty(id)-1);
        return false;
      }

      const plus = ev.target && ev.target.closest && ev.target.closest('[data-cqty-plus]');
      if(plus){
        ev.preventDefault();
        ev.stopPropagation();
        const id = plus.getAttribute('data-cqty-plus');
        setClientQty(id, clientQty(id)+1);
        return false;
      }

      const detailRoute = ev.target && ev.target.closest && ev.target.closest('[data-v49-route]');
      if(detailRoute){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.sdcDetailSetRoute === 'function'){
          window.sdcDetailSetRoute(ev, detailRoute.getAttribute('data-v49-route'));
        }
        return false;
      }

      const detailMinus = ev.target && ev.target.closest && ev.target.closest('#v49QtyMinus');
      if(detailMinus){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.sdcDetailQty === 'function') window.sdcDetailQty(ev,-1);
        return false;
      }

      const detailPlus = ev.target && ev.target.closest && ev.target.closest('#v49QtyPlus');
      if(detailPlus){
        ev.preventDefault();
        ev.stopPropagation();
        if(typeof window.sdcDetailQty === 'function') window.sdcDetailQty(ev,1);
        return false;
      }
    }, true);

    document.addEventListener('input', function(ev){
      const inp = ev.target && ev.target.matches && ev.target.matches('[data-cqty-input]') ? ev.target : null;
      if(!inp) return;
      setClientQty(inp.getAttribute('data-cqty-input'), inp.value);
    }, true);

    window.SDCAppV287 = Object.assign({}, window.SDCApp || {}, {
      setProductDeliveryMode,
      setClientQty,
      productDeliveryMode,
      clientQty,
      updateClientCardTotals
    });
    window.SDCApp = window.SDCAppV287;
  })();


  window.addEventListener('storage',e=>{if(e.key===SDCStore.KEY){state=SDCStore.load(); state.products=dedupeProducts((state.products||[]).filter(isRealProduct)); hydrateState(); render(); toast('Datos actualizados.')}});
  $('#goTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  window.addEventListener('scroll',()=>{
    const goTop = $('#goTop');
    if(!goTop) return;
    if(document.body.classList.contains('sdc-login-mode')){goTop.style.display='none';return;}
    goTop.style.display=scrollY>320?'block':'none';
  });
  // Exponer funciones para sincronización Firebase y compatibilidad con parches anteriores.
  window.saveProductToFirebase = saveProductToFirebase;
  window.saveProductToSheets = saveProductToFirebase;
  window.syncProductsFromFirebase = syncProductsFromFirebase;
  window.syncProductsFromSheets = syncProductsFromFirebase;
  window.uploadLocalProductsToFirebase = uploadLocalProductsToFirebase;
  window.uploadLocalProductsToSheets = uploadLocalProductsToFirebase;
  window.getSheetApiUrl = getSheetApiUrl;
  window.getSheetId = getSheetId;
  applyAppearance();
  render();
  bootFirebaseSync();
  requestAnimationFrame(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){ window.scrollTo(0,0); } });
  setTimeout(function(){ try{ window.scrollTo({top:0,left:0,behavior:'auto'}); }catch(e){} }, 250);
})();