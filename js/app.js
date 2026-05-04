(() => {
  const { loadState, saveState, exportState, importState, normalizeProduct, parseCategories, promosToText, toNumber, cleanText } = window.SDCStorage;
  const root = document.getElementById('app');
  const state = {
    data: loadState(),
    unlocked: localStorage.getItem('sdc-unlocked') === '1',
    view: 'home',
    filter: 'Todos',
    search: '',
    modal: null,
    toast: '',
    quote: newQuote()
  };

  const MONEY = new Intl.NumberFormat('es-HN', { maximumFractionDigits: 0 });
  const fmt = n => `Lps. ${MONEY.format(Math.round(toNumber(n)))}`;
  const esc = v => String(v ?? '').replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

  function newQuote(){
    return {
      id: `SDC-${Date.now()}`,
      date: new Date().toISOString(),
      items: [],
      customer: '', phone: '', department: 'Comayagua', municipality: 'Comayagua', reference: '',
      deliveryType: 'normal', manualShipping: 0, discount: 0,
      savedOnly: false
    };
  }

  function persist(){ saveState(state.data); }
  function toast(msg){ state.toast = msg; render(); setTimeout(() => { if(state.toast === msg){ state.toast=''; render(); } }, 2200); }

  function logo(){ return state.data.settings.logo || 'assets/logo_sdc_comayagua_clean_512.png'; }
  function validImage(src){ return /^https?:\/\//i.test(src || '') || /^data:image\//i.test(src || '') || /^assets\//i.test(src || ''); }
  function placeholderFor(product){
    const cats = categoriesOf(product).join(' ').toLowerCase();
    if(cats.includes('dedal')) return 'assets/placeholder-dedales.svg';
    if(cats.includes('gamer') || cats.includes('gatillo') || cats.includes('enfriador')) return 'assets/placeholder-gamer.svg';
    if(cats.includes('cel')) return 'assets/placeholder-celulares.svg';
    if(cats.includes('hogar') || cats.includes('cocina')) return 'assets/placeholder-hogar.svg';
    if(cats.includes('tec')) return 'assets/placeholder-tecnologia.svg';
    return 'assets/placeholder-default.svg';
  }
  function imageOf(product){ const img = cleanText(product?.image || product?.gallery?.[0] || ''); return validImage(img) ? img : placeholderFor(product || {}); }
  function categoriesOf(product){ return parseCategories(product?.categories ?? product?.category ?? product?.categoria).filter(Boolean); }
  function allCategories(){ return ['Todos', ...new Set(state.data.products.flatMap(categoriesOf))]; }
  function productById(id){ return state.data.products.find(p => p.id === id); }

  function stats(){
    const products = state.data.products;
    const stock = products.reduce((s,p)=>s+toNumber(p.stock),0);
    const value = products.reduce((s,p)=>s+toNumber(p.price)*toNumber(p.stock),0);
    const invested = products.reduce((s,p)=>s+toNumber(p.cost)*toNumber(p.stock),0);
    return { count: products.length, stock, value, invested, gain: value - invested, low: products.filter(p=>p.stock > 0 && p.stock <= 3).length, noCost: products.filter(p=>toNumber(p.cost) <= 0).length, soldOut: products.filter(p=>toNumber(p.stock) <= 0).length };
  }

  function filteredProducts(){
    const q = state.search.trim().toLowerCase();
    return state.data.products.filter(p => {
      const cats = categoriesOf(p);
      let passFilter = true;
      if(state.filter === 'Bajo stock') passFilter = p.stock > 0 && p.stock <= 3;
      else if(state.filter === 'Sin costo') passFilter = toNumber(p.cost) <= 0;
      else if(state.filter !== 'Todos') passFilter = cats.some(c => c.toLowerCase() === state.filter.toLowerCase());
      const text = `${p.id} ${p.name} ${cats.join(' ')}`.toLowerCase();
      return passFilter && (!q || text.includes(q));
    });
  }

  function appFrame(content){
    return `${headerHTML()}<main class="app-main">${content}</main>${bottomNav()}${state.toast ? `<div class="toast">${esc(state.toast)}</div>`:''}${state.modal ? modalHTML() : ''}<button class="scrolltop" data-action="top">↑</button>`;
  }


  function bottomNav(){
    const active = name => state.view === name ? 'active' : '';
    return `<nav class="bottom-nav"><button class="${active('catalog')}" data-action="catalog"><span>⌂</span><b>CATÁLOGO</b></button><button data-action="quote"><span>🛒</span><b>VENDER</b></button><button class="${active('receipts')}" data-action="receipts"><span>▤</span><b>CAJA</b></button><button data-action="new-product"><span>＋</span><b>PRODUCTO</b></button><button data-action="quote"><span>▧</span><b>COTIZAR</b></button></nav>`;
  }

  function headerHTML(){
    return `<header class="topbar"><img class="top-logo" src="${esc(logo())}" onerror="this.src='assets/placeholder-default.svg'"><div><strong>SD COMAYAGUA</strong><span>Modo venta móvil</span></div><button class="btn small ghost" data-action="logout">SALIR</button></header>`;
  }

  function loginHTML(){
    return `<section class="login-screen"><div class="login-card"><img class="login-logo" src="${esc(logo())}" onerror="this.src='assets/placeholder-default.svg'"><h1>CAJA SDC</h1><p class="pill ok">● PANEL PRIVADO DE VENTAS</p><div class="field"><label>CLAVE DE ACCESO</label><input id="loginKey" type="password" placeholder="Ingresa tu clave" autocomplete="current-password"></div><button class="btn primary" data-action="login">ENTRAR AL PANEL</button></div></section>`;
  }

  function homeHTML(){
    const s = stats();
    return appFrame(`<section class="hero-card"><p class="pill ok">● SD COMAYAGUA · SISTEMA PRIVADO</p><h1>CONTROL DE VENTAS</h1><p class="hero-copy">Inventario, cotizaciones, ventas, recibos editables, envíos y respaldo para trabajar rápido desde celular.</p><div class="stat-grid">${statBox(s.count,'PRODUCTOS')}${statBox(s.stock,'STOCK TOTAL')}${statBox(fmt(s.value),'VALOR VENTA')}${statBox(fmt(s.invested),'INVERTIDO')}${statBox(fmt(s.gain),'GANANCIA')}</div></section>${quickGrid()}${warningPanel(s)}`);
  }
  function statBox(num,label){ return `<div class="stat"><b>${esc(num)}</b><span>${esc(label)}</span></div>`; }
  function quickGrid(){
    const items = [
      ['catalog','Catálogo','Ver productos'],['quote','Vender','Seleccionar producto'],['new-product','Producto','Agregar nuevo'],
      ['profit','Ganancias','Por producto'],['receipts','Recibos','Caja del día'],['backup','Backup','Exportar datos']
    ];
    return `<section class="quick-grid">${items.map(([a,t,s])=>`<button data-action="${a}" class="quick"><b>${t}</b><span>${s}</span></button>`).join('')}</section>`;
  }
  function warningPanel(s){
    return `<section class="alerts"><article><div><b>${s.low} BAJO STOCK</b><span>Revisa reposición.</span></div><button data-action="low-stock" class="btn tiny ghost">VER</button></article><article><div><b>${s.noCost} SIN COSTO</b><span>Agrega costo para ganancia real.</span></div><button data-action="no-cost" class="btn tiny ghost">REVISAR</button></article><article><div><b>GANANCIA</b><span>${fmt(s.gain)} estimado.</span></div><button data-action="profit" class="btn tiny ghost">DETALLE</button></article></section>`;
  }

  function catalogHTML(){
    const items = filteredProducts();
    return appFrame(`${filterHTML()}<section class="section-title"><h2>INVENTARIO</h2><span>${items.length} resultados</span></section><section class="products-grid">${items.map(productCard).join('') || `<div class="empty">No hay productos con este filtro.</div>`}</section>`);
  }
  function filterHTML(){
    const cats = allCategories();
    return `<section class="filters"><div class="searchbox">⌕<input value="${esc(state.search)}" data-input="search" placeholder="Buscar producto o código"></div><div class="chips">${cats.map(c => `<button class="chip ${state.filter===c?'active':''}" data-filter="${esc(c)}">${esc(c)}</button>`).join('')}<button class="chip ${state.filter==='Bajo stock'?'active':''}" data-filter="Bajo stock">Bajo stock</button><button class="chip ${state.filter==='Sin costo'?'active':''}" data-filter="Sin costo">Sin costo</button></div></section>`;
  }
  function productCard(p){
    const cats = categoriesOf(p); const low = p.stock > 0 && p.stock <= 3; const out = p.stock <= 0; const more = Math.max(0, cats.length - 1);
    return `<article class="product-card"><div class="product-top"><span class="tag main">${esc(cats[0] || 'General')}</span>${more?`<span class="tag plus">+${more}</span>`:''}<span class="code-pill" title="${esc(p.id)}">${esc(p.id)}</span></div><div class="product-media"><img src="${esc(imageOf(p))}" alt="${esc(p.name)}" onerror="this.onerror=null;this.src='${placeholderFor(p)}'"><span class="stock-badge ${out?'out':low?'low':'ok'}">● ${out?'AGOTADO':low?'BAJO STOCK':'DISPONIBLE'}</span><span class="price-badge">${fmt(p.price)}</span></div><h3>${esc(p.name)}</h3><div class="mini-grid"><div><span>STOCK</span><b>${p.stock} disponibles</b></div><div><span>GANANCIA C/U</span><b>${fmt(toNumber(p.price)-toNumber(p.cost))}</b></div><div><span>COSTO</span><b>${fmt(p.cost)}</b></div><div><span>VALOR STOCK</span><b>${fmt(toNumber(p.price)*toNumber(p.stock))}</b></div></div><div class="progress"><i style="width:${Math.min(100,Math.max(6,p.stock*8))}%"></i></div><div class="card-actions"><button class="btn ghost" data-action="quote-product" data-id="${esc(p.id)}">COTIZAR</button><button class="btn primary" data-action="sell-product" data-id="${esc(p.id)}">VENDER</button><button class="btn ghost" data-action="view-product" data-id="${esc(p.id)}">VER</button></div></article>`;
  }

  function receiptsHTML(){
    const sales = [...state.data.sales].reverse();
    return appFrame(`<section class="section-title"><h2>RECIBOS</h2><span>${sales.length} guardados</span></section><section class="receipt-list">${sales.map(r => `<article class="receipt-row"><div><b>${esc(r.customer || 'Cliente')}</b><span>${esc(r.id)} · ${fmt(r.total || 0)}</span></div><button class="btn tiny ghost" data-action="open-receipt" data-id="${esc(r.id)}">VER</button></article>`).join('') || `<div class="empty">Todavía no hay recibos guardados.</div>`}</section>`);
  }

  function productModalHTML(p){
    const cats = categoriesOf(p).join(', ');
    return `<div class="product-detail"><div class="product-media detail-img"><img src="${esc(imageOf(p))}" onerror="this.onerror=null;this.src='${placeholderFor(p)}'"><span class="price-badge">${fmt(p.price)}</span></div><h2>${esc(p.name)}</h2><p>${esc(p.description || 'Sin descripción.')}</p><div class="mini-grid"><div><span>STOCK</span><b>${p.stock}</b></div><div><span>CATEGORÍAS</span><b>${esc(cats)}</b></div><div><span>COSTO</span><b>${fmt(p.cost)}</b></div><div><span>GANANCIA C/U</span><b>${fmt(p.price-p.cost)}</b></div></div><div class="modal-actions"><button class="btn primary" data-action="sell-product" data-id="${esc(p.id)}">VENDER</button><button class="btn ghost" data-action="quote-product" data-id="${esc(p.id)}">COTIZAR</button><button class="btn ghost" data-action="edit-product" data-id="${esc(p.id)}">EDITAR</button></div></div>`;
  }

  function editProductHTML(product){
    const p = product || { id:'', name:'', price:0, cost:0, stock:0, categories:['General'], image:'', gallery:[], description:'', promos:[] };
    return `<form class="edit-form"><input type="hidden" name="originalId" value="${esc(p.id)}"><div class="two"><div class="field"><label>CÓDIGO</label><input name="id" value="${esc(p.id)}" placeholder="SDC-001"></div><div class="field"><label>STOCK</label><input name="stock" inputmode="numeric" value="${esc(p.stock)}"></div></div><div class="field"><label>NOMBRE DEL PRODUCTO</label><input name="name" value="${esc(p.name)}"></div><div class="two"><div class="field"><label>PRECIO VENTA</label><input name="price" inputmode="numeric" value="${esc(p.price)}"></div><div class="field"><label>COSTO</label><input name="cost" inputmode="numeric" value="${esc(p.cost)}"></div></div><div class="field"><label>CATEGORÍAS / ETIQUETAS</label><input name="categories" value="${esc(categoriesOf(p).join(', '))}" placeholder="Dedales, Gamer Móvil"></div><div class="field"><label>IMAGEN PRINCIPAL</label><textarea name="image" rows="3">${esc(p.image || '')}</textarea></div><div class="field"><label>GALERÍA / MÁS IMÁGENES</label><textarea name="gallery" rows="4" placeholder="Un enlace por línea">${esc((p.gallery||[]).filter(x=>x!==p.image).join('\n'))}</textarea></div><div class="field"><label>PROMOCIONES POR CANTIDAD</label><textarea name="promos" rows="4" placeholder="Ejemplo: 3, 72">${esc(promosToText(p.promos))}</textarea></div><div class="field"><label>DESCRIPCIÓN / BENEFICIOS / INCLUYE</label><textarea name="description" rows="4">${esc(p.description || '')}</textarea></div><div class="modal-actions normal-flow"><button type="button" class="btn primary" data-action="save-product">GUARDAR PRODUCTO</button>${p.id?`<button type="button" class="btn ghost" data-action="duplicate-product" data-id="${esc(p.id)}">DUPLICAR</button><button type="button" class="btn danger" data-action="delete-product" data-id="${esc(p.id)}">ELIMINAR</button>`:''}</div></form>`;
  }

  function quoteModalHTML(){
    const list = filteredProductsForQuote();
    const totals = calcQuote(state.quote);
    return `<section class="quote-flow"><p class="pill ok">● PREVENTA / INFORMACIÓN</p><div class="picker"><div class="picker-head"><h3>SELECCIONAR PRODUCTO</h3><span>${list.length} encontrados</span></div><div class="searchbox"><span>⌕</span><input value="${esc(state.quoteSearch || '')}" data-input="quoteSearch" placeholder="Buscar por nombre, categoría o código..."></div><div class="chips">${allCategories().map(c => `<button class="chip ${state.quoteFilter===c||(!state.quoteFilter&&c==='Todos')?'active':''}" data-quote-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div><div class="picker-list">${list.map(p => `<article><img src="${esc(imageOf(p))}" onerror="this.onerror=null;this.src='${placeholderFor(p)}'"><div><b>${esc(p.name)}</b><span>${fmt(p.price)} · Stock ${p.stock} · ${esc(categoriesOf(p).join(', '))}</span></div><button class="btn add" data-action="add-quote" data-id="${esc(p.id)}">Agregar</button></article>`).join('')}</div></div>${quoteCartHTML(totals)}${quoteFormHTML()}${receiptCardHTML(state.quote, totals, 'preview')}<div class="modal-actions normal-flow quote-actions"><button class="btn ghost" data-action="download-quote-image">↓ IMAGEN</button><button class="btn ghost" data-action="send-quote-text">WHATSAPP TEXTO</button><button class="btn primary" data-action="share-quote-image">WHATSAPP FOTO</button><button class="btn ghost" data-action="save-quote">GUARDAR COTIZACIÓN</button><button class="btn primary wide" data-action="quote-to-sale">PASAR A VENTA / FACTURA REAL</button></div></section>`;
  }

  function filteredProductsForQuote(){
    const oldFilter = state.filter, oldSearch = state.search;
    state.filter = state.quoteFilter || 'Todos'; state.search = state.quoteSearch || '';
    const out = filteredProducts();
    state.filter = oldFilter; state.search = oldSearch;
    return out;
  }
  function quoteCartHTML(t){
    return `<section class="quote-cart"><h3>PRODUCTOS AGREGADOS</h3>${state.quote.items.map((it,idx)=>`<article><div><b>${esc(it.name)}</b><span>${fmt(it.price)} c/u</span></div><div class="qty"><button data-action="qty-minus" data-index="${idx}">−</button><b>${it.qty}</b><button data-action="qty-plus" data-index="${idx}">+</button></div><strong>${fmt(it.price*it.qty)}</strong><button class="x" data-action="remove-quote" data-index="${idx}">×</button></article>`).join('') || `<p class="empty small">Agrega productos para calcular.</p>`}<div class="quote-total"><span>Productos</span><b>${fmt(t.products)}</b></div></section>`;
  }
  function quoteFormHTML(){
    const q = state.quote;
    const manual = q.deliveryType === 'domicilio';
    return `<section class="quote-data"><div class="two"><div class="field"><label>CLIENTE OPCIONAL</label><input data-quote="customer" value="${esc(q.customer)}"></div><div class="field"><label>WHATSAPP DEL CLIENTE</label><input data-quote="phone" value="${esc(q.phone)}" inputmode="tel" placeholder="Ej. 93278489"></div></div><div class="two"><div class="field"><label>DEPARTAMENTO</label><input data-quote="department" value="${esc(q.department)}"></div><div class="field"><label>MUNICIPIO</label><input data-quote="municipality" value="${esc(q.municipality)}"></div></div><div class="field"><label>REFERENCIA / BARRIO / COLONIA</label><input data-quote="reference" value="${esc(q.reference)}"></div><div class="field"><label>TIPO DE ENVÍO</label><select data-quote="deliveryType"><option value="normal" ${q.deliveryType==='normal'?'selected':''}>Envío normal · Lps. 110</option><option value="cod" ${q.deliveryType==='cod'?'selected':''}>Pagar al recibir · Lps. 100 + 6%</option><option value="domicilio" ${q.deliveryType==='domicilio'?'selected':''}>Domicilio local · manual</option></select></div>${manual?`<div class="field"><label>ENVÍO LOCAL LPS.</label><input data-quote="manualShipping" inputmode="numeric" value="${esc(q.manualShipping)}" placeholder="Ej. 30"></div>`:''}<div class="field"><label>DESCUENTO LPS.</label><input data-quote="discount" inputmode="numeric" value="${esc(q.discount)}"></div></section>`;
  }

  function calcQuote(q){
    const products = q.items.reduce((s,it)=>s+toNumber(it.price)*toNumber(it.qty),0);
    let shipping = 110, commission = 0, label = 'Envío normal';
    if(q.deliveryType === 'domicilio'){ shipping = toNumber(q.manualShipping); label = 'Domicilio'; }
    if(q.deliveryType === 'cod'){ shipping = 100; commission = Math.round((products + shipping) * 0.06); label = 'Pagar al recibir'; }
    const discount = toNumber(q.discount);
    return { products, shipping, commission, totalShipping: shipping + commission, discount, total: Math.max(0, products + shipping + commission - discount), label };
  }

  function receiptCardHTML(q, totals = calcQuote(q), mode = 'receipt'){
    const date = new Date(q.date || Date.now()).toLocaleString('es-HN', { dateStyle:'medium', timeStyle:'short' });
    return `<article class="receipt-card print-area" id="receiptCard"><header class="doc-header"><div><span>${mode==='preview'?'COTIZACIÓN · WHATSAPP':'FACTURA GAMER · WHATSAPP'}</span><h2>SD COMAYAGUA</h2><p>${mode==='preview'?'Preventa':'Recibo'} · ${esc(date)}</p><h3>${esc(q.id)}</h3></div><img src="${esc(logo())}" onerror="this.src='assets/placeholder-default.svg'"></header><section class="doc-fields"><div><span>CLIENTE</span><b>${esc(q.customer || 'Cliente')}</b></div><div><span>TELÉFONO</span><b>${esc(q.phone || '-')}</b></div><div><span>DEPARTAMENTO</span><b>${esc(q.department || '-')}</b></div><div><span>MUNICIPIO</span><b>${esc(q.municipality || '-')}</b></div>${q.reference?`<div class="wide"><span>REFERENCIA / BARRIO / COLONIA</span><b>${esc(q.reference)}</b></div>`:''}</section><table class="doc-table"><thead><tr><th>PRODUCTO</th><th>CANT.</th><th>PRECIO</th><th>TOTAL</th></tr></thead><tbody>${q.items.map(it=>`<tr><td><b>${esc(it.name)}</b><small>${esc(it.id || '')}</small></td><td>${it.qty}</td><td>${fmt(it.price)}</td><td>${fmt(it.price*it.qty)}</td></tr>`).join('') || `<tr><td colspan="4">Sin productos agregados.</td></tr>`}</tbody></table><section class="doc-total"><div><span>Productos</span><b>${fmt(totals.products)}</b></div><div><span>Envío</span><b>${fmt(totals.shipping)}</b></div><div><span>Comisión por pagar al recibir</span><b>${fmt(totals.commission)}</b></div><div><span>Total envío</span><b>${fmt(totals.totalShipping)}</b></div><div><span>Descuento</span><b>${fmt(totals.discount)}</b></div><div class="grand"><span>Total</span><b>${fmt(totals.total)}</b></div></section><p class="delivery-note">Empresa / entrega: ${esc(totals.label)}</p><footer>SD Comayagua · WhatsApp +504 3151-7755</footer></article>`;
  }

  function quoteText(q, totals = calcQuote(q)){
    const date = new Date(q.date || Date.now()).toLocaleString('es-HN', { dateStyle:'medium', timeStyle:'short' });
    const products = q.items.map(it => `• ${it.name}\n  Cantidad: ${it.qty}\n  Precio: ${fmt(it.price)}\n  Total: ${fmt(it.price*it.qty)}`).join('\n');
    return `📌 Código: ${q.id}\n🗓️ Fecha: ${date}\n\n👤 Cliente: ${q.customer || 'Cliente'}\n📞 Teléfono: ${q.phone || '-'}\n🏷️ Departamento: ${q.department || '-'}\n📍 Municipio: ${q.municipality || '-'}\n🏠 Referencia: ${q.reference || '-'}\n\n🛒 PRODUCTOS\n${products || 'Sin productos agregados.'}\n\n🚚 ENVÍO\nEmpresa / entrega: ${totals.label}\nEnvío: ${fmt(totals.shipping)}\nComisión por pagar al recibir: ${fmt(totals.commission)}\nTotal envío: ${fmt(totals.totalShipping)}\n\n💰 RESUMEN\nProductos: ${fmt(totals.products)}\nDescuento: ${fmt(totals.discount)}\nTOTAL A PAGAR: ${fmt(totals.total)}\n\nSD COMAYAGUA.\nWhatsApp: +504 3151-7755`;
  }

  function modalHTML(){
    const m = state.modal;
    let title = '', body = '';
    if(m.type === 'product'){ title = 'PRODUCTO'; body = productModalHTML(productById(m.id)); }
    if(m.type === 'edit'){ title = m.id ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'; body = editProductHTML(m.id ? productById(m.id) : null); }
    if(m.type === 'quote'){ title = 'COTIZACIÓN PREVIA'; body = quoteModalHTML(); }
    if(m.type === 'receipt'){ title = 'RECIBO / FACTURA'; const q = state.data.sales.find(x=>x.id===m.id); body = `${receiptCardHTML(q, q.totals || calcQuote(q), 'receipt')}<div class="modal-actions normal-flow"><button class="btn ghost" data-action="print-receipt">IMPRIMIR / PDF</button><button class="btn ghost" data-action="download-receipt-image">↓ IMAGEN</button><button class="btn primary" data-action="send-receipt-text" data-id="${esc(q.id)}">WHATSAPP</button></div>`; }
    return `<div class="modal-backdrop"><div class="modal"><header class="modal-head"><h2>${title}</h2><button class="modal-close" data-action="close-modal">×</button></header><div class="modal-body">${body}</div></div></div>`;
  }

  function render(){
    if(!state.unlocked){ root.innerHTML = loginHTML(); return; }
    root.innerHTML = state.view === 'home' ? homeHTML() : state.view === 'catalog' ? catalogHTML() : receiptsHTML();
  }

  function renderKeepFocus(selector, value){
    render();
    requestAnimationFrame(() => {
      const el = document.querySelector(selector);
      if(!el) return;
      el.focus();
      const end = String(value || '').length;
      try{ el.setSelectionRange(end, end); }catch(e){}
    });
  }

  function openQuoteWithProduct(id){ state.quote = newQuote(); addProductToQuote(id, false); state.modal = { type:'quote' }; render(); }
  function addProductToQuote(id, rerender = true){
    const p = productById(id); if(!p) return;
    const ex = state.quote.items.find(x => x.id === id);
    if(ex) ex.qty += 1; else state.quote.items.push({ id:p.id, name:p.name, price:toNumber(p.price), qty:1 });
    if(rerender) render();
  }
  function updateQuoteFromInput(el){
    const key = el.dataset.quote; if(!key) return;
    state.quote[key] = ['manualShipping','discount'].includes(key) ? toNumber(el.value) : el.value;
    state.quote.date = state.quote.date || new Date().toISOString();
  }
  function saveSale(kind='sale'){
    updateAllQuoteInputs();
    const totals = calcQuote(state.quote);
    if(!state.quote.items.length){ toast('Agrega producto antes de guardar.'); return null; }
    const sale = { ...state.quote, id: state.quote.id || `SDC-${Date.now()}`, date: new Date().toISOString(), kind, totals, total: totals.total };
    if(kind === 'sale'){
      sale.items.forEach(it => { const p = productById(it.id); if(p) p.stock = Math.max(0, toNumber(p.stock) - toNumber(it.qty)); });
    }
    state.data.sales.push(sale); persist();
    return sale;
  }
  function updateAllQuoteInputs(){ document.querySelectorAll('[data-quote]').forEach(updateQuoteFromInput); }

  async function captureReceipt(filename='recibo-sdc.png'){
    const node = document.getElementById('receiptCard');
    if(!node) return null;
    if(window.html2canvas){
      const canvas = await html2canvas(node, { backgroundColor: '#eef8fb', scale: 2, useCORS: true });
      return new Promise(resolve => canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); resolve(blob);
      }, 'image/png'));
    }
    window.print(); return null;
  }
  async function shareReceiptImage(){
    const node = document.getElementById('receiptCard'); if(!node || !window.html2canvas){ toast('Tu navegador descargará la imagen.'); await captureReceipt(); return; }
    const canvas = await html2canvas(node, { backgroundColor:'#eef8fb', scale:2, useCORS:true });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    const file = new File([blob], 'cotizacion-sdc.png', { type:'image/png' });
    if(navigator.canShare && navigator.canShare({ files:[file] })) await navigator.share({ files:[file], text: quoteText(state.quote) });
    else { await captureReceipt('cotizacion-sdc.png'); openWhatsApp(quoteText(state.quote), state.quote.phone); }
  }
  function openWhatsApp(text, phone){
    const digits = String(phone || '').replace(/\D/g,'');
    const normalized = digits ? (digits.startsWith('504') ? digits : `504${digits}`) : '';
    const url = normalized ? `https://wa.me/${normalized}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  function handleAction(action, el){
    if(action === 'login'){
      const key = document.getElementById('loginKey')?.value || '';
      if(key === state.data.settings.accessKey){ state.unlocked=true; localStorage.setItem('sdc-unlocked','1'); state.view='home'; render(); }
      else toast('Clave incorrecta.');
    }
    if(action === 'logout'){ state.unlocked=false; localStorage.removeItem('sdc-unlocked'); render(); }
    if(action === 'top') window.scrollTo({top:0, behavior:'smooth'});
    if(action === 'home') { state.view='home'; render(); }
    if(action === 'catalog') { state.view='catalog'; state.filter='Todos'; render(); }
    if(action === 'quote') { state.quote = newQuote(); state.modal={type:'quote'}; render(); }
    if(action === 'receipts') { state.view='receipts'; render(); }
    if(action === 'backup') exportState(state.data);
    if(action === 'profit') { state.view='catalog'; state.filter='Todos'; render(); toast('Revisa ganancia por producto en cada tarjeta.'); }
    if(action === 'low-stock') { state.view='catalog'; state.filter='Bajo stock'; render(); }
    if(action === 'no-cost') { state.view='catalog'; state.filter='Sin costo'; render(); }
    if(action === 'new-product') { state.modal={type:'edit'}; render(); }
    if(action === 'view-product') { state.modal={type:'product', id: el.dataset.id}; render(); }
    if(action === 'edit-product') { state.modal={type:'edit', id: el.dataset.id}; render(); }
    if(action === 'sell-product' || action === 'quote-product') openQuoteWithProduct(el.dataset.id);
    if(action === 'close-modal') { state.modal=null; render(); }
    if(action === 'add-quote') addProductToQuote(el.dataset.id);
    if(action === 'qty-plus') { state.quote.items[el.dataset.index].qty += 1; render(); }
    if(action === 'qty-minus') { const it=state.quote.items[el.dataset.index]; it.qty=Math.max(1,it.qty-1); render(); }
    if(action === 'remove-quote') { state.quote.items.splice(el.dataset.index,1); render(); }
    if(action === 'save-product') saveProductFromForm();
    if(action === 'duplicate-product') duplicateProduct(el.dataset.id);
    if(action === 'delete-product') deleteProduct(el.dataset.id);
    if(action === 'download-quote-image' || action === 'download-receipt-image') captureReceipt('sdc-cotizacion.png');
    if(action === 'share-quote-image') { updateAllQuoteInputs(); shareReceiptImage(); }
    if(action === 'send-quote-text') { updateAllQuoteInputs(); openWhatsApp(quoteText(state.quote), state.quote.phone); }
    if(action === 'save-quote') { const sale = saveSale('quote'); if(sale){ toast('Cotización guardada.'); state.modal=null; state.quote=newQuote(); render(); } }
    if(action === 'quote-to-sale') { const sale = saveSale('sale'); if(sale){ state.modal={type:'receipt', id:sale.id}; state.quote=newQuote(); render(); } }
    if(action === 'open-receipt') { state.modal={type:'receipt', id:el.dataset.id}; render(); }
    if(action === 'print-receipt') window.print();
    if(action === 'send-receipt-text') { const q = state.data.sales.find(x=>x.id===el.dataset.id); if(q) openWhatsApp(quoteText(q, q.totals || calcQuote(q)), q.phone); }
  }

  function saveProductFromForm(){
    const form = document.querySelector('.edit-form'); if(!form) return;
    const fd = new FormData(form);
    const originalId = fd.get('originalId');
    const image = cleanText(fd.get('image'));
    const galleryText = cleanText(fd.get('gallery'));
    const product = normalizeProduct({
      id: fd.get('id') || `SDC-${String(state.data.products.length+1).padStart(3,'0')}`,
      name: fd.get('name'), stock: fd.get('stock'), price: fd.get('price'), cost: fd.get('cost'),
      categories: fd.get('categories'), image,
      gallery: [image, ...String(galleryText || '').split(/\n+/)],
      promos: fd.get('promos'), description: fd.get('description')
    }, state.data.products.length);
    const idx = state.data.products.findIndex(p => p.id === originalId);
    if(idx >= 0) state.data.products[idx] = product; else state.data.products.push(product);
    persist(); state.modal=null; state.view='catalog'; render(); toast('Producto guardado.');
  }
  function duplicateProduct(id){
    const p = productById(id); if(!p) return;
    const copy = normalizeProduct({ ...p, id:`SDC-${String(state.data.products.length+1).padStart(3,'0')}`, name:`${p.name} copia` }, state.data.products.length);
    state.data.products.push(copy); persist(); state.modal={type:'edit', id:copy.id}; render();
  }
  function deleteProduct(id){
    if(!confirm('¿Eliminar este producto?')) return;
    state.data.products = state.data.products.filter(p => p.id !== id); persist(); state.modal=null; render(); toast('Producto eliminado.');
  }

  document.addEventListener('click', e => {
    const actionEl = e.target.closest('[data-action]');
    if(actionEl){ e.preventDefault(); handleAction(actionEl.dataset.action, actionEl); return; }
    const filterEl = e.target.closest('[data-filter]');
    if(filterEl){ state.filter = filterEl.dataset.filter; state.view='catalog'; render(); return; }
    const qFilter = e.target.closest('[data-quote-filter]');
    if(qFilter){ updateAllQuoteInputs(); state.quoteFilter = qFilter.dataset.quoteFilter; render(); }
  });
  document.addEventListener('input', e => {
    if(e.target.matches('[data-input="search"]')){ state.search = e.target.value; renderKeepFocus('[data-input="search"]', state.search); }
    if(e.target.matches('[data-input="quoteSearch"]')){ state.quoteSearch = e.target.value; renderKeepFocus('[data-input="quoteSearch"]', state.quoteSearch); }
    if(e.target.matches('[data-quote]')) updateQuoteFromInput(e.target);
  });
  document.addEventListener('change', e => {
    if(e.target.matches('[data-quote]')){ updateQuoteFromInput(e.target); render(); }
  });

  render();
})();
