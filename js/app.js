(function(){
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>Array.from(root.querySelectorAll(s));
  let state = SDCStore.load();
  const app = $('#app'), modalRoot = $('#modalRoot'), toastEl = $('#toast');
  let currentView = 'catalog';
  let filter = {q:'',cat:'Todos'};
  let quote = emptyQuote();
  let saleDraft = null;

  function money(n){return `${state.settings.currency||'Lps.'} ${Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}`}
  function num(n){return Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0})}
  function cleanPhone(p){return String(p||'').replace(/\D/g,'').replace(/^5040?/,'504')}
  function toast(msg){toastEl.textContent=msg;toastEl.classList.add('show');clearTimeout(toastEl._t);toastEl._t=setTimeout(()=>toastEl.classList.remove('show'),2600)}
  function save(){SDCStore.save(state);}
  function escapeHtml(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
  function parseTags(str){return String(str||'General').split(/[;,|]+/).map(x=>x.trim()).filter(x=>x && x.toLowerCase()!=='[object object]')}
  function firstTag(p){return parseTags(p.categories)[0]||'General'}
  function allCategories(){return ['Todos',...Array.from(new Set(state.products.flatMap(parseTags).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'es'))]}
  function placeholderFor(p){const tags=parseTags(p.categories).join(' ').toLowerCase(); if(tags.includes('gamer')||tags.includes('dedal')||tags.includes('gatillo'))return SDC_PLACEHOLDERS.gamer; if(tags.includes('tec')||tags.includes('celular')||tags.includes('audio')||tags.includes('cable'))return SDC_PLACEHOLDERS.tecnologia; if(tags.includes('hogar')||tags.includes('cocina'))return SDC_PLACEHOLDERS.hogar; return SDC_PLACEHOLDERS.default}
  function galleryOf(p){const g=String(p.gallery||'').split(/[\n,]+/).map(x=>x.trim()).filter(Boolean); const list=[p.image,...g].filter(Boolean); return Array.from(new Set(list))}
  function productImage(p){return galleryOf(p)[0] || placeholderFor(p)}
  function onImgError(img,p){img.onerror=null; img.src=placeholderFor(p||{});}
  function productById(id){return state.products.find(p=>p.id===id)}
  function nextCode(){let max=0; state.products.forEach(p=>{const m=String(p.id).match(/(\d+)$/); if(m) max=Math.max(max,Number(m[1]))}); return `SDC-${String(max+1).padStart(3,'0')}`}
  function emptyQuote(){return {id:'COT-'+Date.now(),items:[],client:'',phone:'',department:'Comayagua',municipality:'Comayagua',reference:'',shippingType:'Normal',company:'Forza',shipping:110,cod:false,discount:0,date:new Date().toISOString(),saved:false}}
  function emptySale(){return {...emptyQuote(), id:'SDC-'+Date.now().toString().slice(-10), kind:'receipt'}}
  function itemTotal(it){return Number(it.qty||0)*Number(it.price||0)}
  function calc(doc){const products=(doc.items||[]).reduce((a,it)=>a+itemTotal(it),0); const shipping=Number(doc.shipping||0); const discount=Number(doc.discount||0); const base=Math.max(0,products+shipping); const commission=doc.cod?Math.round(base*((state.settings.codPercent||6)/100)):0; const delivery=shipping+commission; const total=Math.max(0,products+delivery-discount); return {products,shipping,commission,delivery,discount,total}}
  function productNormalTotal(p){return Number(p.price||0)+110}
  function productCodTotal(p){const base=Number(p.price||0)+100; return Math.round(base*(1+((state.settings.codPercent||6)/100)))}
  function setView(v){currentView=v; render(); window.scrollTo({top:0,behavior:'smooth'});}
  function syncLocal(){state=SDCStore.load(); state.unlocked=true; save(); render(); toast('Sincronizado con los datos guardados en este dispositivo.');}

  function render(){
    if(!state.unlocked){renderLogin();return}
    app.className='app';
    app.innerHTML = `${topbar()}${hero()}${quickPanel()}${searchPanel()}${inventoryHTML()}${bottomNav()}`;
    bindMain();
  }
  function renderLogin(){
    app.className='login-wrap';
    app.innerHTML=`<section class="login-card">
      <img class="login-logo" src="assets/logo-sdc.png" alt="Logo SD Comayagua">
      <h1 class="login-title">CAJA SDC</h1>
      <div class="pill login-pill"><span class="dot"></span> Panel privado de ventas</div>
      <div class="form-box">
        <label class="label" for="keyInput">Clave de acceso</label>
        <input id="keyInput" class="input" type="password" inputmode="numeric" placeholder="Ingresa tu clave" autocomplete="current-password">
        <button id="loginBtn" class="btn full" style="margin-top:14px">Entrar al panel</button>
      </div>
    </section>`;
    $('#loginBtn').onclick=unlock; $('#keyInput').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
  }
  function unlock(){ if($('#keyInput').value.trim()===(state.settings.accessKey||'199311')){state.unlocked=true;save();render();toast('Panel desbloqueado.')} else toast('Clave incorrecta.'); }
  function topbar(){return `<header class="topbar"><img class="top-logo" src="assets/logo-sdc.png" alt="SD"><div class="top-title"><h1>SD COMAYAGUA</h1><p>Modo venta móvil</p></div><div class="spacer"></div><button class="btn small ghost sync-btn" data-action="sync">Sync</button><button class="btn small secondary" data-action="lock">Salir</button></header>`}
  function hero(){
    const st=stats();
    return `<section class="hero" id="inicio">
      <div class="pill login-pill"><span class="dot"></span> SD Comayagua · Sistema privado</div>
      <h2>CONTROL DE VENTAS</h2><p>Inventario, cotizaciones, ventas, recibos editables, envíos y respaldo para trabajar rápido desde celular.</p>
      <div class="stats">
        <div class="stat"><b>${num(st.count)}</b><span>Productos</span></div><div class="stat"><b>${num(st.stock)}</b><span>Stock total</span></div>
        <div class="stat"><b>${money(st.value)}</b><span>Valor venta</span></div><div class="stat"><b>${money(st.invested)}</b><span>Invertido</span></div>
        <div class="stat"><b>${money(st.profit)}</b><span>Ganancia</span></div>
      </div>
    </section>`
  }
  function stats(){let count=state.products.length,stock=0,value=0,invested=0; state.products.forEach(p=>{stock+=+p.stock||0; value+=(+p.stock||0)*(+p.price||0); invested+=(+p.stock||0)*(+p.cost||0)}); return {count,stock,value,invested,profit:value-invested}}
  function quickPanel(){
    const low=state.products.filter(p=>Number(p.stock)>0 && Number(p.stock)<=Number(state.settings.lowStockLimit||3)).length;
    const nocost=state.products.filter(p=>Number(p.cost)<=0).length;
    const st=stats();
    return `<section class="quick no-print">
      <button data-action="catalog"><b>Catálogo</b><span>Ver productos</span></button>
      <button data-action="sell"><b>Vender</b><span>Seleccionar producto</span></button>
      <button data-action="newProduct"><b>Producto</b><span>Agregar nuevo</span></button>
      <button data-action="profit"><b>Ganancias</b><span>Por producto</span></button>
      <button data-action="receipts"><b>Recibos</b><span>Caja del día</span></button>
      <button data-action="backup"><b>Backup</b><span>Exportar datos</span></button>
    </section>
    <section class="alert-row no-print">
      <div class="alert-card"><div><b>${low} bajo stock</b><span>Revisa reposición.</span></div><button class="btn small secondary" data-action="lowStock">Ver</button></div>
      <div class="alert-card"><div><b>${nocost} sin costo</b><span>Agrega costo para ganancia real.</span></div><button class="btn small secondary" data-action="noCost">Revisar</button></div>
      <div class="alert-card"><div><b>Ganancia</b><span>${money(st.profit)} estimado.</span></div><button class="btn small secondary" data-action="profit">Detalle</button></div>
    </section>`
  }
  function searchPanel(){return `<section class="search-panel no-print"><div class="searchbar"><span class="icon">⌕</span><input id="searchInput" placeholder="Buscar producto o código" value="${escapeHtml(filter.q)}"></div><div class="chips">${allCategories().map(c=>`<button class="chip ${filter.cat===c?'active':''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div></section>`}
  function filteredProducts(){
    const q=filter.q.trim().toLowerCase();
    return state.products.filter(p=>{
      const tags=parseTags(p.categories);
      const inCat=filter.cat==='Todos'||tags.some(t=>t.toLowerCase()===filter.cat.toLowerCase());
      const hay=[p.name,p.id,p.categories,p.description].join(' ').toLowerCase();
      return inCat && (!q || hay.includes(q));
    })
  }
  function inventoryHTML(){const list=filteredProducts(); return `<section id="inventario"><div class="section-head"><h2>INVENTARIO</h2><span class="count-pill">${list.length} resultados</span></div>${list.length?`<div class="grid">${list.map(productCard).join('')}</div>`:`<div class="empty-state">No encontré productos con esa búsqueda o etiqueta.</div>`}</section>`}
  function productCard(p){
    const tags=parseTags(p.categories); const low=Number(p.stock)>0&&Number(p.stock)<=Number(state.settings.lowStockLimit||3); const sold=Number(p.stock)<=0;
    const percent=Math.max(5,Math.min(100,(Number(p.stock)||0)/20*100));
    return `<article class="product-card" data-id="${escapeHtml(p.id)}"><div class="product-top"><div class="tag-stack"><span class="tag-pill">${escapeHtml(tags[0]||'General')}</span>${tags.length>1?`<span class="tag-pill">+${tags.length-1}</span>`:''}</div><span class="code-pill">${escapeHtml(p.id)}</span></div>
      <div class="product-media"><img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${low?'low':''}"><span class="dot" style="background:#031018;box-shadow:none"></span>${sold?'Agotado':low?'Bajo stock':'Disponible'}</span><b class="price-badge">${money(p.price)}</b></div>
      <h3 class="product-title">${escapeHtml(p.name)}</h3><div class="metrics"><div class="metric"><span>Stock</span><b>${num(p.stock)} disponibles</b></div><div class="metric"><span>Ganancia C/U</span><b>${money((+p.price||0)-(+p.cost||0))}</b></div><div class="metric"><span>Costo</span><b>${(+p.cost||0)>0?money(p.cost):'Sin costo'}</b></div><div class="metric"><span>Valor stock</span><b>${money((+p.stock||0)*(+p.price||0))}</b></div></div><div class="stock-line"><i style="width:${percent}%"></i></div>
      <div class="card-actions"><button class="btn secondary quote" data-action="quoteProduct" data-id="${escapeHtml(p.id)}">Cotizar</button><button class="btn" data-action="sellProduct" data-id="${escapeHtml(p.id)}">Vender</button><button class="btn secondary" data-action="viewProduct" data-id="${escapeHtml(p.id)}">Ver</button><button class="btn ghost" data-action="editProduct" data-id="${escapeHtml(p.id)}">Editar</button></div></article>`
  }
  function bottomNav(){return `<nav class="bottom-nav no-print"><button class="nav-btn ${currentView==='catalog'?'active':''}" data-action="catalog"><i>⌂</i><span>Catálogo</span></button><button class="nav-btn" data-action="sell"><i>🛒</i><span>Vender</span></button><button class="nav-btn" data-action="receipts"><i>▤</i><span>Caja</span></button><button class="nav-btn" data-action="newProduct"><i>＋</i><span>Producto</span></button><button class="nav-btn ${currentView==='quote'?'active':''}" data-action="quote"><i>▧</i><span>Cotizar</span></button></nav>`}

  function bindMain(){
    $('[data-action="lock"]')?.addEventListener('click',()=>{state.unlocked=false;save();render()});
    $('#searchInput')?.addEventListener('input',e=>{filter.q=e.target.value; render()});
    $$('.chip').forEach(b=>b.onclick=()=>{filter.cat=b.dataset.cat;render()});
    document.querySelectorAll('[data-action]').forEach(btn=>{ if(btn.dataset.bound)return; btn.dataset.bound=1; btn.addEventListener('click',mainAction)});
  }
  function mainAction(e){
    const a=e.currentTarget.dataset.action, id=e.currentTarget.dataset.id;
    if(a==='catalog') return setView('catalog');
    if(a==='sell') return openSale();
    if(a==='quote') return openQuote();
    if(a==='newProduct') return openProductEditor();
    if(a==='editProduct') return openProductEditor(id);
    if(a==='viewProduct') return openProductDetails(id);
    if(a==='sellProduct') return openSale(id);
    if(a==='quoteProduct') return openQuote(id);
    if(a==='backup') return openBackup();
    if(a==='sync') return syncLocal();
    if(a==='profit') return openProfit();
    if(a==='receipts') return openReceipts();
    if(a==='lowStock'){filter.cat='Todos'; filter.q=''; render(); setTimeout(()=>{state.products.filter(p=>+p.stock>0&&+p.stock<=3).length?toast('Productos de bajo stock marcados con etiqueta amarilla.'):toast('No hay productos en bajo stock.')},50)}
    if(a==='noCost'){filter.cat='Todos'; filter.q='Sin costo'; render(); openNoCost();}
  }

  function openModal(html,wide=false){
    document.body.classList.add('modal-open');
    document.documentElement.scrollLeft=0; document.body.scrollLeft=0;
    modalRoot.innerHTML=`<div class="modal-backdrop"><section class="modal ${wide?'wide':''}">${html}</section></div>`;
    const m=$('.modal',modalRoot); if(m){m.scrollLeft=0; m.scrollTop=0;}
    $('.close',modalRoot)?.addEventListener('click',closeModal);
    modalRoot.querySelector('.modal-backdrop').addEventListener('click',e=>{if(e.target.classList.contains('modal-backdrop'))closeModal()});
  }
  function closeModal(){document.body.classList.remove('modal-open'); modalRoot.innerHTML=''}

  function splitGallery(prod){
    const p=SDCStore.normalizeProduct(prod||{},state.products.length);
    const urls=[p.image,...String(p.gallery||'').split(/\n+/)].map(x=>String(x||'').trim()).filter(Boolean);
    return urls.length?urls:[''];
  }
  function parsePromoRows(text){
    const rows=String(text||'').split(/\n+/).map(line=>line.trim()).filter(Boolean).map(line=>{
      const m=line.match(/^(\d+)\s*[=:xX-]\s*(\d+(?:\.\d+)?)$/);
      return m?{qty:m[1],price:m[2]}:{qty:'',price:''};
    }).filter(r=>r.qty||r.price);
    return rows.length?rows:[{qty:'',price:''}];
  }
  function productForm(p={}){
    const prod=SDCStore.normalizeProduct(p,state.products.length); if(!p.id) prod.id=nextCode();
    return `<div class="modal-head"><h3>${p.id?'Editar':'Nuevo'} producto</h3><button class="close">×</button></div><div class="modal-body product-editor"><div class="card-box"><h4>Información básica</h4><div class="modal-grid"><label><span class="label">Nombre del producto</span><input id="pName" class="input" value="${escapeHtml(prod.name)}"></label><label><span class="label">Código</span><input id="pId" class="input" value="${escapeHtml(prod.id)}"></label><label class="span2"><span class="label">Categorías / etiquetas</span><input id="pCats" class="input" value="${escapeHtml(prod.categories)}" placeholder="Ejemplo: Dedales, Gamer Móvil"></label><label><span class="label">Costo compra</span><input id="pCost" class="input" type="number" value="${prod.cost}"></label><label><span class="label">Precio venta</span><input id="pPrice" class="input" type="number" value="${prod.price}"></label><label><span class="label">Stock</span><input id="pStock" class="input" type="number" value="${prod.stock}"></label><div class="span2"><span class="label">Imágenes del producto</span><div id="imageRows" class="image-rows"></div><button class="btn secondary full add-line" id="addImageRow" type="button">+ Añadir imagen</button><small class="hint">La primera imagen será la principal. Puedes agregar imagen 2, imagen 3, imagen 4 y las que necesites.</small></div><div class="span2"><span class="label">Promociones por cantidad</span><div id="promoRows" class="promo-rows"></div><button class="btn secondary full add-line" id="addPromoRow" type="button">+ Añadir promoción</button><small class="hint">Ejemplo: cantidad 3 y precio 72. Cada promoción queda separada y editable.</small></div><label class="span2"><span class="label">Descripción / beneficios / incluye</span><textarea id="pDesc" class="textarea">${escapeHtml(prod.description)}</textarea></label></div><div class="chips">${['Gamer Móvil','Dedales','Gatillos','Tecnología','Celulares','Audio','Cables','Hogar','Cocina'].map(c=>`<button class="chip" data-addcat="${c}">${c}</button>`).join('')}</div></div><div class="modal-actions product-form-actions"><button class="btn" id="saveProduct">Guardar producto</button>${p.id?`<button class="btn secondary" id="duplicateProduct">Duplicar</button><button class="btn danger" id="deleteProduct">Eliminar</button>`:''}</div></div>`
  }
  function openProductEditor(id){
    const p=id?productById(id):{}; const prod=SDCStore.normalizeProduct(p||{},state.products.length);
    let imageRows=splitGallery(prod); let promoRows=parsePromoRows(prod.promos);
    openModal(productForm(p),true);
    function drawImages(){
      $('#imageRows',modalRoot).innerHTML=imageRows.map((url,i)=>`<div class="mini-row image-row"><span class="row-index">Imagen ${i+1}</span><input class="input pImageUrl" value="${escapeHtml(url)}" placeholder="https://..."><button class="btn small ghost" data-delimage="${i}" type="button">×</button></div>`).join('');
      $$('.pImageUrl',modalRoot).forEach((inp,i)=>inp.oninput=()=>{imageRows[i]=inp.value});
      $$('[data-delimage]',modalRoot).forEach(b=>b.onclick=()=>{if(imageRows.length>1)imageRows.splice(+b.dataset.delimage,1);else imageRows[0]='';drawImages()});
    }
    function drawPromos(){
      $('#promoRows',modalRoot).innerHTML=promoRows.map((r,i)=>`<div class="mini-row promo-row"><span class="row-index">Promo ${i+1}</span><input class="input pPromoQty" inputmode="numeric" type="number" value="${escapeHtml(r.qty)}" placeholder="Cantidad"><input class="input pPromoPrice" inputmode="numeric" type="number" value="${escapeHtml(r.price)}" placeholder="Precio total"><button class="btn small ghost" data-delpromo="${i}" type="button">×</button></div>`).join('');
      $$('.promo-row',modalRoot).forEach((row,i)=>{ $('.pPromoQty',row).oninput=e=>promoRows[i].qty=e.target.value; $('.pPromoPrice',row).oninput=e=>promoRows[i].price=e.target.value; });
      $$('[data-delpromo]',modalRoot).forEach(b=>b.onclick=()=>{if(promoRows.length>1)promoRows.splice(+b.dataset.delpromo,1);else promoRows[0]={qty:'',price:''};drawPromos()});
    }
    drawImages(); drawPromos();
    $('#addImageRow').onclick=()=>{imageRows.push('');drawImages(); setTimeout(()=>$$('.pImageUrl',modalRoot).at(-1)?.focus(),30)};
    $('#addPromoRow').onclick=()=>{promoRows.push({qty:'',price:''});drawPromos(); setTimeout(()=>$$('.pPromoQty',modalRoot).at(-1)?.focus(),30)};
    $$('[data-addcat]',modalRoot).forEach(b=>b.onclick=()=>{const inp=$('#pCats'); const tags=parseTags(inp.value); if(!tags.some(t=>t.toLowerCase()===b.dataset.addcat.toLowerCase())) tags.push(b.dataset.addcat); inp.value=tags.join(', ')});
    $('#saveProduct').onclick=()=>{
      const images=$$('.pImageUrl',modalRoot).map(inp=>inp.value.trim()).filter(Boolean);
      const promos=$$('.promo-row',modalRoot).map(row=>{const q=$('.pPromoQty',row).value.trim(); const pr=$('.pPromoPrice',row).value.trim(); return q&&pr?`${q}=${pr}`:''}).filter(Boolean).join('\n');
      const np={id:$('#pId').value.trim()||nextCode(),name:$('#pName').value.trim()||'Producto sin nombre',categories:$('#pCats').value.trim()||'General',cost:+$('#pCost').value||0,price:+$('#pPrice').value||0,stock:+$('#pStock').value||0,image:images[0]||'',gallery:images.slice(1).join('\n'),promos,description:$('#pDesc').value.trim()};
      const ix=state.products.findIndex(x=>x.id===id); if(ix>=0)state.products[ix]=np; else state.products.push(np); save(); SDCStore.saveBackup(state,'Producto guardado'); closeModal(); render(); toast('Producto guardado.');
    };
    $('#duplicateProduct')&&( $('#duplicateProduct').onclick=()=>{const cp={...prod,id:nextCode(),name:(prod.name||'Producto')+' copia'}; state.products.push(cp); save(); closeModal(); render(); toast('Producto duplicado.');});
    $('#deleteProduct')&&( $('#deleteProduct').onclick=()=>{if(confirm('¿Eliminar este producto?')){state.products=state.products.filter(x=>x.id!==id);save();closeModal();render();toast('Producto eliminado.')}})
  }

  function openProductDetails(id){
    const p=productById(id); if(!p)return; const imgs=galleryOf(p); const safeImgs=imgs.length?imgs:[productImage(p)];
    const promos=String(p.promos||'').trim();
    openModal(`<div class="modal-head"><h3>Producto</h3><button class="close">×</button></div><div class="modal-body"><div class="product-share-card" id="productShareCard"><div class="product-share-media"><img id="detailMainImage" src="${escapeHtml(safeImgs[0])}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><b class="price-badge">${money(p.price)}</b></div><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.description||'Sin descripción registrada.')}</p><div class="public-metrics"><div><span>Precio producto</span><b>${money(p.price)}</b></div><div><span>Envío normal</span><b>${money(productNormalTotal(p))}</b></div><div><span>Pagar al recibir +6%</span><b>${money(productCodTotal(p))}</b></div></div>${promos?`<div class="promo-public"><span>Promociones por cantidad</span><pre>${escapeHtml(promos)}</pre></div>`:''}<div class="share-footer">SD COMAYAGUA · WhatsApp +504 3151-7755</div></div><div class="thumb-row">${safeImgs.map((img,i)=>`<button class="thumb ${i===0?'active':''}" data-product-img="${escapeHtml(img)}"><img src="${escapeHtml(img)}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"></button>`).join('')}</div><div class="modal-actions product-actions product-actions-grid no-print"><button class="btn secondary prod-action" id="downloadProductPhoto"><span class="ico">▣</span><b>Imagen</b><small>Descargar</small></button><button class="btn prod-action" id="shareProductPhoto"><span class="ico">↗</span><b>Foto</b><small>Compartir</small></button><button class="btn secondary prod-action" id="waProductText"><span class="ico">✎</span><b>Texto</b><small>WhatsApp</small></button><button class="btn prod-action" data-action="sellProduct" data-id="${escapeHtml(id)}"><span class="ico">🛒</span><b>Vender</b><small>Venta real</small></button><button class="btn secondary prod-action" data-action="quoteProduct" data-id="${escapeHtml(id)}"><span class="ico">🧾</span><b>Cotizar</b><small>Precio total</small></button><button class="btn ghost prod-action" data-action="editProduct" data-id="${escapeHtml(id)}"><span class="ico">✦</span><b>Editar</b><small>Producto</small></button></div></div>`);
    $$('[data-product-img]',modalRoot).forEach(b=>b.onclick=()=>{ $('#detailMainImage',modalRoot).src=b.dataset.productImg; $$('[data-product-img]',modalRoot).forEach(x=>x.classList.toggle('active',x===b)); });
    $('#downloadProductPhoto').onclick=()=>downloadProductPhoto(p);
    $('#shareProductPhoto').onclick=()=>shareProductPhoto(p);
    $('#waProductText').onclick=()=>sendProductWhatsApp(p);
    $$('[data-action]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();mainAction({currentTarget:b})});
  }
  function productWhatsAppText(p){
    const promos=String(p.promos||'').trim();
    return `🛍️ *PRODUCTO DISPONIBLE - SD COMAYAGUA*\n\n📌 *${p.name}*\n💰 *Precio del producto:* ${money(p.price)}\n🚚 *Con Envío Normal:* ${money(productNormalTotal(p))}\n📦 *Pagar al Recibir:* ${money(productCodTotal(p))}\n\n${p.description||'Producto disponible para entrega.'}${promos?`\n\n🎁 *Promociones por cantidad:*\n${promos}`:''}\n\nNota: Pagar al Recibir incluye Lps. 100 de envío + 6% de comisión.\nWhatsApp SD COMAYAGUA: +504 3151-7755`;
  }
  function askClientPhone(initial=''){
    const typed=prompt('Número WhatsApp del cliente. Déjalo vacío para elegir el chat manualmente en WhatsApp:', initial||'');
    if(typed===null) return null;
    return typed.trim();
  }
  async function productCardToBlob(){
    const el=$('#productShareCard',modalRoot); if(!window.html2canvas){window.print();return null}
    const canvas=await html2canvas(el,{backgroundColor:'#07111f',scale:2,useCORS:true});
    return new Promise(res=>canvas.toBlob(res,'image/png',.98));
  }
  async function downloadProductPhoto(p){const blob=await productCardToBlob(); if(!blob)return; const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`producto-${String(p.name||'sd-comayagua').toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast('Imagen del producto descargada.');}
  async function shareProductPhoto(p){const blob=await productCardToBlob(); const text=productWhatsAppText(p); if(blob && navigator.canShare){const file=new File([blob],`producto-${p.id||'sdc'}.png`,{type:'image/png'}); if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text}); return}catch(e){}}} if(blob) await downloadProductPhoto(p); toast('Se descargó la imagen para compartir.');}
  function sendProductWhatsApp(p){const phone=askClientPhone(); if(phone===null)return; window.open(waUrl(phone,productWhatsAppText(p)),'_blank');}

  function quoteModalHTML(isSale=false){
    const doc=isSale?saleDraft:quote; const title=isSale?'Venta / factura real':'Cotización previa';
    return `<div class="modal-head quote-head"><h3>${title}</h3><button class="close">×</button></div><div class="modal-body quote-body"><div class="pill quote-status"><span class="dot"></span>${isSale?'Factura y registro':'Preventa / información'}</div><div class="modal-grid quote-grid" style="margin-top:14px"><div class="card-box span2 picker-card"><div class="section-head quote-section-head" style="margin:0 0 12px"><h4>Seleccionar producto</h4><span class="found-pill">${state.products.length} encontrados</span></div><div class="searchbar"><span class="icon">⌕</span><input id="pickSearch" placeholder="Buscar por nombre, categoría o código..."></div><div class="chips" id="pickChips">${allCategories().map(c=>`<button class="chip ${c==='Todos'?'active':''}" data-pickcat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}</div><div id="pickerList" class="picker-list"></div></div><div class="card-box calc-card"><h4>Datos para calcular</h4>${fieldsHTML(doc)}</div><div class="card-box current-card"><h4>${isSale?'Factura':'Cotización'} actual</h4><div id="cartList" class="cart-list"></div><div id="totalsMini"></div></div><div class="span2 preview-card"><div id="docPreview">${docCard(doc,isSale)}</div></div></div><div class="modal-actions quote-actions premium-actions"><button class="btn secondary" id="downloadDoc"><b>Imagen</b><small>Descargar</small></button><button class="btn secondary" id="waText"><b>Texto</b><small>WhatsApp</small></button><button class="btn" id="waPhoto"><b>Foto</b><small>WhatsApp</small></button>${!isSale?'<button class="btn ghost" id="saveQuote"><b>Guardar</b><small>Cotización</small></button><button class="btn" id="toSale"><b>Pasar a factura</b><small>Venta real</small></button>':'<button class="btn" id="finishSale"><b>Finalizar</b><small>Venta</small></button><button class="btn secondary" id="printDoc"><b>PDF</b><small>Imprimir</small></button>'}</div></div>`
  }
  function fieldsHTML(doc){
    const type=doc.shippingType || (doc.cod?'COD':'Normal');
    return `<div class="modal-grid"><label><span class="label">Cliente opcional</span><input class="input bindDoc" data-k="client" value="${escapeHtml(doc.client)}"></label><label><span class="label">Teléfono cliente / WhatsApp</span><input class="input bindDoc" data-k="phone" inputmode="tel" value="${escapeHtml(doc.phone)}" placeholder="Sin +504 también funciona"></label><label><span class="label">Departamento</span><select class="select bindDoc" data-k="department">${SDC_DEPARTMENTS.map(d=>`<option ${doc.department===d?'selected':''}>${d}</option>`).join('')}</select></label><label><span class="label">Municipio</span><select class="select bindDoc" data-k="municipality"></select></label><label class="span2"><span class="label">Referencia / barrio / colonia</span><input class="input bindDoc" data-k="reference" value="${escapeHtml(doc.reference)}"></label><label><span class="label">Tipo de cobro / envío</span><select class="select bindDoc" data-k="shippingType"><option value="Normal" ${type!=='COD'?'selected':''}>Envío Normal: depósito o Tigo Money</option><option value="COD" ${type==='COD'?'selected':''}>Pagar al Recibir: Lps.100 + comisión</option></select></label><label><span class="label">Empresa / entrega</span><select class="select bindDoc" data-k="company"><option>Domicilio</option><option>Forza</option><option>C807</option><option>Cargo Expreso</option><option>Bus local</option></select></label><label><span class="label">Envío Lps.</span><input class="input bindDoc" data-k="shipping" type="number" value="${doc.shipping}"></label><label><span class="label">Descuento Lps.</span><input class="input bindDoc" data-k="discount" type="number" value="${doc.discount}"></label></div>`
  }
  function bindDocFields(isSale){
    const doc=isSale?saleDraft:quote; if(!doc.shippingType) doc.shippingType=doc.cod?'COD':'Normal';
    const mun=$('[data-k="municipality"]',modalRoot);
    function fillMun(){const dep=$('[data-k="department"]',modalRoot).value; const list=SDC_MUNICIPALITIES[dep]||[]; mun.innerHTML=list.map(m=>`<option ${doc.municipality===m?'selected':''}>${m}</option>`).join('')+'<option>Otro municipio</option>'; if(!list.includes(doc.municipality)) mun.value=list[0]||'Otro municipio'; doc.department=dep; doc.municipality=mun.value}
    function applyShippingType(force=false){const sel=$('[data-k="shippingType"]',modalRoot); if(!sel)return; doc.shippingType=sel.value; if(doc.shippingType==='COD'){doc.cod=true; if(force || !doc.shipping || Number(doc.shipping)===110) doc.shipping=100;} else {doc.cod=false; if(force || !doc.shipping || Number(doc.shipping)===100) doc.shipping=110;} const ship=$('[data-k="shipping"]',modalRoot); if(ship) ship.value=doc.shipping;}
    fillMun(); $('[data-k="company"]',modalRoot).value=doc.company||'Forza'; $('[data-k="shippingType"]',modalRoot).value=doc.shippingType; applyShippingType(false);
    $$('.bindDoc',modalRoot).forEach(el=>el.oninput=el.onchange=()=>{let v=el.value; if(el.dataset.k==='shipping'||el.dataset.k==='discount')v=+v||0; doc[el.dataset.k]=v; if(el.dataset.k==='department')fillMun(); if(el.dataset.k==='shippingType')applyShippingType(true); refreshQuoteUI(isSale);});
  }

  function renderPicker(isSale){ const list=$('#pickerList',modalRoot); let q='',cat='Todos'; function draw(){const term=q.toLowerCase(); const items=state.products.filter(p=>(cat==='Todos'||parseTags(p.categories).some(t=>t.toLowerCase()===cat.toLowerCase())) && (!term||[p.name,p.id,p.categories].join(' ').toLowerCase().includes(term))); list.innerHTML=items.map(p=>`<div class="picker-item"><img src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(p.price)} · Stock ${num(p.stock)} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small" data-additem="${escapeHtml(p.id)}">Agregar</button></div>`).join('')||'<div class="empty-state">Sin productos.</div>'; $$('[data-additem]',list).forEach(b=>b.onclick=()=>addDocItem(b.dataset.additem,isSale)); }
    $('#pickSearch',modalRoot).oninput=e=>{q=e.target.value;draw()}; $$('[data-pickcat]',modalRoot).forEach(b=>b.onclick=()=>{cat=b.dataset.pickcat;$$('[data-pickcat]',modalRoot).forEach(x=>x.classList.toggle('active',x===b));draw()}); draw(); }
  function addDocItem(id,isSale){ const p=productById(id); if(!p)return; const doc=isSale?saleDraft:quote; const found=doc.items.find(x=>x.id===id); if(found)found.qty++; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:1,image:productImage(p)}); refreshQuoteUI(isSale); toast('Producto agregado.'); }
  function refreshQuoteUI(isSale){ const doc=isSale?saleDraft:quote; $('#cartList',modalRoot).innerHTML=doc.items.length?doc.items.map((it,i)=>`<div class="cart-row"><div><b>${escapeHtml(it.name)}</b><br><span>${money(it.price)} c/u</span></div><div class="qtybox"><button data-dec="${i}">−</button><input data-qty="${i}" type="number" value="${it.qty}"><button data-inc="${i}">+</button></div><button class="btn small danger" data-rem="${i}">×</button></div>`).join(''):'<div class="empty-state">Agrega productos para calcular.</div>'; const c=calc(doc); $('#totalsMini',modalRoot).innerHTML=`<div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión</b><b>${money(c.commission)}</b></div><div class="summary-total"><b>Total</b><b>${money(c.total)}</b></div></div>`; $('#docPreview',modalRoot).innerHTML=docCard(doc,isSale); $$('[data-inc]',modalRoot).forEach(b=>b.onclick=()=>{doc.items[+b.dataset.inc].qty++;refreshQuoteUI(isSale)}); $$('[data-dec]',modalRoot).forEach(b=>b.onclick=()=>{const it=doc.items[+b.dataset.dec]; it.qty=Math.max(1,it.qty-1);refreshQuoteUI(isSale)}); $$('[data-rem]',modalRoot).forEach(b=>b.onclick=()=>{doc.items.splice(+b.dataset.rem,1);refreshQuoteUI(isSale)}); $$('[data-qty]',modalRoot).forEach(inp=>inp.oninput=()=>{doc.items[+inp.dataset.qty].qty=Math.max(1,+inp.value||1);refreshQuoteUI(isSale)}); }
  function openQuote(id){currentView='quote'; if(!quote.items.length) quote=emptyQuote(); if(id)addDocItemTo(quote,id); openModal(quoteModalHTML(false),true); bindQuoteCommon(false); }
  function openSale(id,fromDoc=null){saleDraft=fromDoc?SDCStore.clone(fromDoc):emptySale(); saleDraft.id='SDC-'+Date.now().toString().slice(-10); if(id)addDocItemTo(saleDraft,id); openModal(quoteModalHTML(true),true); bindQuoteCommon(true); }
  function addDocItemTo(doc,id){const p=productById(id); if(!p)return; const found=doc.items.find(x=>x.id===id); if(found)found.qty++; else doc.items.push({id:p.id,name:p.name,price:+p.price||0,cost:+p.cost||0,qty:1,image:productImage(p)});}
  function bindQuoteCommon(isSale){renderPicker(isSale); bindDocFields(isSale); refreshQuoteUI(isSale); $('#downloadDoc').onclick=()=>downloadDocImage(isSale?'recibo':'cotizacion'); $('#waText').onclick=()=>sendWhatsAppText(isSale); $('#waPhoto').onclick=()=>shareDocPhoto(isSale); $('#printDoc')&&($('#printDoc').onclick=()=>window.print()); $('#saveQuote')&&($('#saveQuote').onclick=()=>{quote.date=new Date().toISOString();quote.saved=true;state.quotes.unshift(SDCStore.clone(quote));save();toast('Cotización guardada.');}); $('#toSale')&&($('#toSale').onclick=()=>{if(!quote.items.length)return toast('Agrega productos antes de pasar a venta.'); closeModal(); openSale(null,quote)}); $('#finishSale')&&($('#finishSale').onclick=finishSale); }
  function docCard(doc,isSale){ const c=calc(doc); const code=doc.id||'SDC'; const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}); return `<div class="doc-wrap" id="printableDoc"><div class="doc-head"><div><span class="doc-pill">${isSale?'Factura gamer · WhatsApp':'Cotización · WhatsApp'}</span><h2>SD COMAYAGUA</h2><p>${isSale?'Recibo':'Cotización'} · ${date}</p><p><b>${escapeHtml(code)}</b></p></div><img class="doc-logo" src="assets/logo-sdc.png" alt="Logo"></div><div class="doc-fields"><div class="doc-field"><span>Cliente</span><b>${escapeHtml(doc.client||'Cliente')}</b></div><div class="doc-field"><span>Teléfono</span><b>${escapeHtml(doc.phone||'No registrado')}</b></div><div class="doc-field"><span>Departamento</span><b>${escapeHtml(doc.department||'No seleccionado')}</b></div><div class="doc-field"><span>Municipio</span><b>${escapeHtml(doc.municipality||'No seleccionado')}</b></div>${doc.reference?`<div class="doc-field wide"><span>Referencia / barrio / colonia</span><b>${escapeHtml(doc.reference)}</b></div>`:''}</div><table class="doc-table"><thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Total</th></tr></thead><tbody>${doc.items.map(it=>`<tr><td><div class="doc-product"><img src="${escapeHtml(it.image||SDC_PLACEHOLDERS.default)}" onerror="this.onerror=null;this.src='${SDC_PLACEHOLDERS.default}'"><div>${escapeHtml(it.name)}<br><span style="color:#718191">${escapeHtml(it.id)}</span></div></div></td><td class="num">${num(it.qty)}</td><td class="num">${money(it.price)}</td><td class="num">${money(itemTotal(it))}</td></tr>`).join('')||'<tr><td colspan="4">Sin productos agregados</td></tr>'}</tbody></table><div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión por pagar al recibir</b><b>${money(c.commission)}</b></div><div class="summary-row"><b>Total envío</b><b>${money(c.delivery)}</b></div><div class="summary-row"><b>Descuento</b><b>${money(c.discount)}</b></div><div class="summary-total"><b>${isSale?'Total':'Total cotizado'}</b><b>${money(c.total)}</b></div></div><div class="delivery-box"><b>Tipo:</b> ${doc.cod?'Pagar al Recibir':'Envío Normal / Depósito o Tigo Money'}<br><b>Empresa / entrega:</b> ${escapeHtml(doc.company||'No seleccionada')}${doc.cod?' · Comisión aplicada':''}</div><p class="doc-note">${isSale?'Gracias por comprar en SD Comayagua.':'Cotización informativa. La venta se registra únicamente al pasarla a factura real.'}<br>SD Comayagua · WhatsApp +504 3151-7755</p></div>` }
  function whatsappText(doc,isSale){
    const c=calc(doc); const date=new Date(doc.date||Date.now()).toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});
    return `🧾 *${isSale?'RECIBO':'COTIZACIÓN'} SD COMAYAGUA*\n\n📌 *Código:* ${doc.id}\n📅 *Fecha:* ${date}\n\n👤 *Cliente:* ${doc.client||'Cliente'}\n📞 *Teléfono:* ${doc.phone||'No registrado'}\n🏷️ *Departamento:* ${doc.department||'No seleccionado'}\n📍 *Municipio:* ${doc.municipality||'No seleccionado'}${doc.reference?`\n🏠 *Referencia:* ${doc.reference}`:''}\n\n🛒 *PRODUCTOS*\n${doc.items.map(it=>`• ${it.name}\n  Cantidad: ${it.qty}\n  Precio: ${money(it.price)}\n  Total: ${money(itemTotal(it))}`).join('\n')}\n\n🚚 *ENVÍO*\nTipo: ${doc.cod?'Pagar al Recibir':'Envío Normal / Depósito o Tigo Money'}\nEmpresa / entrega: ${doc.company||'No seleccionada'}\nEnvío: ${money(c.shipping)}\nComisión por pagar al recibir: ${money(c.commission)}\nTotal envío: ${money(c.delivery)}\n\n💰 *RESUMEN*\nProductos: ${money(c.products)}\nDescuento: ${money(c.discount)}\n*TOTAL A PAGAR: ${money(c.total)}*\n\nSD COMAYAGUA.\nWhatsApp: +504 3151-7755`;
  }
  function waUrl(phone,text){const p=cleanPhone(phone); return p?`https://wa.me/${p.length===8?'504'+p:p}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`}
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
  function sendWhatsAppText(isSale){const doc=currentDoc(isSale); if(!doc.items.length)return toast('Agrega productos primero.'); const c=calc(doc); if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.'); const phone=chooseWaPhone(doc); if(phone===null)return; window.open(waUrl(phone,whatsappText(doc,isSale)),'_blank');}
  async function docToBlob(){const el=$('#printableDoc',modalRoot); if(!window.html2canvas){window.print();return null} const canvas=await html2canvas(el,{backgroundColor:'#eaf5f9',scale:2,useCORS:true}); return new Promise(res=>canvas.toBlob(res,'image/png',.98));}
  async function downloadDocImage(name='documento'){const blob=await docToBlob(); if(!blob)return; const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`${name}-sd-comayagua.png`; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); toast('Imagen descargada.');}
  async function shareDocPhoto(isSale){const doc=currentDoc(isSale); if(!doc.items.length)return toast('Agrega productos primero.'); const c=calc(doc); if(c.products<=0||c.total<=0)return toast('El total está en cero. Revisa producto, precio y envío antes de enviar.'); const phone=chooseWaPhone(doc); if(phone===null)return; const blob=await docToBlob(); const text=whatsappText(doc,isSale); if(blob && navigator.canShare){const file=new File([blob],`${isSale?'recibo':'cotizacion'}-sd-comayagua.png`,{type:'image/png'}); if(navigator.canShare({files:[file]})){try{await navigator.share({files:[file],text}); return}catch(e){}}} if(blob) await downloadDocImage(isSale?'recibo':'cotizacion'); window.open(waUrl(phone,text),'_blank'); toast('Se descargó la imagen y se abrió WhatsApp.');}
  function finishSale(){ if(!saleDraft.items.length)return toast('Agrega productos primero.'); const c=calc(saleDraft); saleDraft.date=new Date().toISOString(); saleDraft.total=c.total; state.sales.unshift(SDCStore.clone(saleDraft)); saleDraft.items.forEach(it=>{const p=productById(it.id); if(p)p.stock=Math.max(0,(+p.stock||0)-(+it.qty||0));}); state.lastReceipt=SDCStore.clone(saleDraft); SDCStore.saveBackup(state,'Venta registrada'); save(); refreshQuoteUI(true); render(); toast('Venta finalizada y recibo guardado.'); }

  function openBackup(){openModal(`<div class="modal-head"><h3>Backup de datos</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box"><h4>Exportar / importar</h4><p style="color:#b8c8d8">Guarda este archivo antes de borrar o subir una versión nueva.</p><div class="modal-actions" style="position:static"><button class="btn" id="exportBackup">Descargar backup JSON</button><label class="btn secondary">Importar backup<input id="importBackup" type="file" accept="application/json" hidden></label><button class="btn ghost" id="manualBackup">Guardar copia local</button></div></div><div class="card-box"><h4>Copias locales</h4><div id="backupList"></div></div></div>`,true); function draw(){const b=SDCStore.listBackups(); $('#backupList').innerHTML=b.map(x=>`<div class="cart-row"><div><b>${escapeHtml(x.label)}</b><br><span>${new Date(x.date).toLocaleString('es-HN')}</span></div><button class="btn small secondary" data-restore="${x.id}">Restaurar</button></div>`).join('')||'<div class="empty-state">Sin copias locales.</div>'; $$('[data-restore]',modalRoot).forEach(btn=>btn.onclick=()=>{state=SDCStore.restoreBackup(btn.dataset.restore)||state; closeModal(); render(); toast('Backup restaurado.')}); } draw(); $('#exportBackup').onclick=()=>{const blob=new Blob([SDCStore.exportData(state)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='backup-sd-comayagua.json'; a.click();}; $('#manualBackup').onclick=()=>{SDCStore.saveBackup(state,'Backup manual');draw();toast('Copia local guardada.')}; $('#importBackup').onchange=e=>{const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{try{state=SDCStore.importData(r.result);closeModal();render();toast('Backup importado.')}catch(err){toast('No se pudo importar.')}}; r.readAsText(f)}; }
  function openProfit(){const rows=state.products.map(p=>({p,profit:(+p.price||0)-(+p.cost||0),total:((+p.price||0)-(+p.cost||0))*(+p.stock||0)})); openModal(`<div class="modal-head"><h3>Ganancias</h3><button class="close">×</button></div><div class="modal-body"><table class="profit-table"><thead><tr><th>Producto</th><th>C/U</th><th>Stock</th><th>Total</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.p.name)}</td><td>${money(r.profit)}</td><td>${num(r.p.stock)}</td><td>${money(r.total)}</td></tr>`).join('')}</tbody></table></div>`,true)}
  function openReceipts(){openModal(`<div class="modal-head"><h3>Caja / recibos</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${state.sales.map(s=>`<div class="cart-row"><div><b>${escapeHtml(s.client||'Cliente')}</b><br><span>${escapeHtml(s.id)} · ${money(s.total||calc(s).total)}</span></div><button class="btn small secondary" data-openreceipt="${s.id}">Ver</button></div>`).join('')||'<div class="empty-state">Todavía no hay ventas registradas.</div>'}</div></div>`,true); $$('[data-openreceipt]',modalRoot).forEach(b=>b.onclick=()=>{const s=state.sales.find(x=>x.id===b.dataset.openreceipt); if(s){saleDraft=SDCStore.clone(s); openModal(quoteModalHTML(true),true); bindQuoteCommon(true)}}); }
  function openNoCost(){openModal(`<div class="modal-head"><h3>Productos sin costo</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${state.products.filter(p=>+p.cost<=0).map(p=>`<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)}</span></div><button class="btn small secondary" data-editcost="${p.id}">Editar</button></div>`).join('')||'<div class="empty-state">Todo tiene costo registrado.</div>'}</div></div>`,true); $$('[data-editcost]',modalRoot).forEach(b=>b.onclick=()=>{closeModal();openProductEditor(b.dataset.editcost)})}

  window.addEventListener('storage',e=>{if(e.key===SDCStore.KEY){state=SDCStore.load(); render(); toast('Datos actualizados.')}});
  $('#goTop').onclick=()=>window.scrollTo({top:0,behavior:'smooth'});
  window.addEventListener('scroll',()=>$('#goTop').style.display=scrollY>320?'block':'none');
  render();
})();
