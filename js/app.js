(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');
  const toastEl = $('#toast');
  const LS = 'sdc_pos_dashboard_v1';
  const LOGO = 'assets/logo-sdc-2026.png';
  const NO_IMG = 'assets/no-image.svg';

  const defaultState = () => ({
    view:'dashboard',
    mode:'gamer',
    config:{ ...window.SDC_CONFIG },
    products:(window.SDC_DEMO_PRODUCTS || []).map(normalizeProduct),
    invoices:[],
    clients:[],
    filter:{ q:'', category:'Todos', status:'Todos' },
    cart:[],
    customer:{ nombre:'', telefono:'', departamento:'Comayagua', municipio:'Comayagua', direccion:'', referencia:'' },
    shippingType:'normal',
    discount:0,
    editingInvoiceId:''
  });

  let state = load();
  applyMode();
  render();

  function load(){
    try{
      const saved = JSON.parse(localStorage.getItem(LS) || 'null');
      const base = defaultState();
      const out = saved ? { ...base, ...saved } : base;
      out.config = { ...window.SDC_CONFIG, ...(saved?.config || {}) };
      out.products = Array.isArray(out.products) && out.products.length ? out.products.map(normalizeProduct) : base.products;
      out.invoices = Array.isArray(out.invoices) ? out.invoices : [];
      out.clients = Array.isArray(out.clients) ? out.clients : [];
      out.cart = Array.isArray(out.cart) ? out.cart : [];
      out.customer = { ...base.customer, ...(saved?.customer || {}) };
      out.filter = { ...base.filter, ...(saved?.filter || {}) };
      return out;
    }catch(e){ return defaultState(); }
  }
  function save(){ localStorage.setItem(LS, JSON.stringify(state)); }
  function toast(msg){ toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastEl._t); toastEl._t = setTimeout(() => toastEl.classList.remove('show'), 2600); }
  function n(v){ const x = Number(v || 0); return Number.isFinite(x) ? x : 0; }
  function money(v){ return `${state.config.currency || 'Lps.'} ${Math.round(n(v)).toLocaleString('es-HN')}`; }
  function cleanPhone(v){ return String(v || '').replace(/\D/g,'').replace(/^5040?/,'504'); }
  function uid(prefix){ return `${prefix}-${Date.now().toString().slice(-8)}${Math.floor(Math.random()*90+10)}`; }
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
  function today(){ return new Date().toLocaleString('es-HN', { day:'2-digit', month:'short', year:'numeric', hour:'numeric', minute:'2-digit' }); }
  function iso(){ return new Date().toISOString(); }
  function applyMode(){ document.body.classList.toggle('mode-gamer', state.mode !== 'pro'); document.body.classList.toggle('mode-pro', state.mode === 'pro'); }

  function normalizeProduct(p, i = 0){
    const stock = n(p.stock ?? p.existencia);
    const price = n(p.precio ?? p.price);
    const cost = n(p.costo ?? p.cost);
    return {
      id:String(p.id || `prod-${i+1}`).trim(),
      codigo:String(p.codigo || p.code || p.id || `SDC-${String(i+1).padStart(3,'0')}`).trim(),
      nombre:String(p.nombre || p.name || 'Producto sin nombre').trim(),
      categoria:String(p.categoria || p.category || p.categories || 'General').trim(),
      marca:String(p.marca || p.brand || '').trim(),
      precio:price,
      costo:cost,
      stock:stock,
      descripcion:String(p.descripcion || p.description || '').trim(),
      imagen:String(p.imagen || p.image || '').trim(),
      activo:p.activo === false || String(p.activo).toLowerCase() === 'false' ? false : true,
      updatedAt:p.updatedAt || iso(),
      valor_venta_stock:price * stock,
      inversion_stock:cost * stock,
      ganancia_unitaria:price - cost,
      ganancia_proyectada:(price - cost) * stock,
      estado_stock:stock <= 0 ? 'Agotado' : stock <= n(window.SDC_CONFIG.lowStockLimit || 5) ? 'Bajo stock' : 'Disponible',
      promos:String(p.promos || '').trim(),
      notas:String(p.notas || '').trim()
    };
  }

  function categories(){
    return ['Todos', ...Array.from(new Set(state.products.filter(p => p.activo).map(p => p.categoria || 'General'))).sort((a,b) => a.localeCompare(b,'es'))];
  }
  function filteredProducts(){
    const q = state.filter.q.toLowerCase().trim();
    return state.products.filter(p => {
      if (!p.activo) return false;
      const hay = [p.codigo,p.nombre,p.categoria,p.marca,p.descripcion].join(' ').toLowerCase();
      const okQ = !q || hay.includes(q);
      const okC = state.filter.category === 'Todos' || p.categoria === state.filter.category;
      const okS = state.filter.status === 'Todos' || p.estado_stock === state.filter.status;
      return okQ && okC && okS;
    });
  }

  function itemPrice(product, qty){
    const promo = promoTotal(product.promos, qty);
    return promo !== null ? promo : n(product.precio) * qty;
  }
  function promoTotal(raw, qty){
    const rows = String(raw || '').split(/[|,;\n]+/).map(x => x.trim()).filter(Boolean);
    let exact = null;
    rows.forEach(row => {
      const m = row.match(/(\d+)\s*(?:=|:|por|-)?\s*(\d+(?:[.,]\d+)?)/);
      if (m && Number(m[1]) === Number(qty)) exact = Number(String(m[2]).replace(',','.'));
    });
    return exact;
  }

  function calcCart(cart = state.cart){
    const subtotal = cart.reduce((sum,it) => sum + itemPrice(it, n(it.qty) || 1), 0);
    const type = state.shippingType;
    let envio = 0;
    if (type === 'normal') envio = n(state.config.normalShipping);
    if (type === 'cod') envio = n(state.config.cashOnDeliveryShipping);
    if (type === 'local') envio = n(state.config.localShipping);
    const baseComision = subtotal + envio;
    const comision = type === 'cod' ? Math.round(baseComision * n(state.config.cashOnDeliveryCommission)) : 0;
    const descuento = Math.max(0, n(state.discount));
    const total = Math.max(0, subtotal + envio + comision - descuento);
    const cost = cart.reduce((sum,it) => sum + (n(it.costo) * (n(it.qty) || 1)), 0);
    return { subtotal, envio, comision, descuento, total, cost, profit: subtotal - cost };
  }

  function dashboardStats(){
    const active = state.products.filter(p => p.activo);
    const stock = active.reduce((a,p) => a + n(p.stock), 0);
    const value = active.reduce((a,p) => a + n(p.precio) * n(p.stock), 0);
    const invested = active.reduce((a,p) => a + n(p.costo) * n(p.stock), 0);
    const realProfit = state.invoices.filter(x => x.status === 'Factura').reduce((a,x) => a + n(x.totals?.profit), 0);
    const out = active.filter(p => n(p.stock) <= 0).length;
    const low = active.filter(p => n(p.stock) > 0 && n(p.stock) <= n(state.config.lowStockLimit)).length;
    return { total:active.length, stock, value, invested, projected:value - invested, realProfit, out, low };
  }

  function render(){
    applyMode();
    app.className = 'app';
    app.innerHTML = `${topbar()}${nav()}${sectionDashboard()}${sectionProducts()}${sectionPos()}${sectionInvoices()}${sectionClients()}${sectionConfig()}`;
    bind();
  }

  function topbar(){
    return `<header class="topbar no-print">
      <div class="brand-card">
        <img class="logo" src="${LOGO}" alt="SD COMAYAGUA">
        <div class="brand-title"><b>${esc(state.config.storeName)}</b><span>Panel privado · POS · Inventario</span></div>
      </div>
      <div class="top-actions">
        <button class="icon-btn" data-action="sync" title="Sincronizar">↻</button>
        <button class="icon-btn" data-action="toggle-mode" title="Modo">${state.mode === 'pro' ? 'PRO' : '🎮'}</button>
      </div>
    </header>`;
  }
  function nav(){
    const items = [
      ['dashboard','⌂','Dashboard'], ['products','▦','Productos'], ['pos','🛒','POS'],
      ['invoices','▤','Facturas'], ['clients','☑','Envíos'], ['config','⚙','Config.']
    ];
    return `<nav class="nav no-print">${items.map(([id,ico,label]) => `<button class="${state.view===id?'active':''}" data-view="${id}"><i>${ico}</i><span>${label}</span></button>`).join('')}</nav>`;
  }
  function activateClass(view){ return state.view === view ? 'active' : ''; }

  function sectionDashboard(){
    const s = dashboardStats();
    return `<section class="section ${activateClass('dashboard')}" id="dashboard">
      <div class="hero">
        <span class="pill"><i class="dot"></i> Dashboard financiero</span>
        <h1>Control de ventas e inventario</h1>
        <p>Resumen rápido de productos, stock, inversión, ganancia proyectada y ganancia real guardada.</p>
      </div>
      <div class="kpi-grid">
        ${kpi('Total productos', s.total, 'Activos en catálogo')}
        ${kpi('Stock total', s.stock, 'Unidades disponibles')}
        ${kpi('Valor venta', money(s.value), 'Precio de venta × stock')}
        ${kpi('Total invertido', money(s.invested), 'Costo de compra × stock')}
        ${kpi('Ganancia proyectada', money(s.projected), 'Venta - inversión', 'good')}
        ${kpi('Ganancia real', money(s.realProfit), 'Según facturas locales', 'good')}
        ${kpi('Agotados', s.out, 'Stock igual a 0', s.out ? 'danger' : '')}
        ${kpi('Bajo stock', s.low, `Límite: ${state.config.lowStockLimit}`, s.low ? 'warn' : '')}
      </div>
      <div class="panel">
        <div class="panel-head"><div><h2>Acciones rápidas</h2><p>Preparado para celular, sin botones estorbando arriba del inventario.</p></div></div>
        <div class="button-row">
          <button class="btn" data-view="pos">Nueva cotización / POS</button>
          <button class="btn secondary" data-view="products">Ver productos</button>
          <button class="btn secondary" data-view="invoices">Facturas guardadas</button>
          <button class="btn ghost" data-action="sync">Sincronizar Sheets</button>
        </div>
      </div>
    </section>`;
  }
  function kpi(label, value, sub, cls=''){ return `<div class="kpi ${cls}"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(sub)}</small></div>`; }

  function sectionProducts(){
    const list = filteredProducts();
    return `<section class="section ${activateClass('products')}" id="products">
      <div class="panel">
        <div class="panel-head"><div><h2>Productos</h2><p>Buscador, filtros y tarjetas limpias para celular.</p></div><span class="tag">${list.length} resultados</span></div>
        <div class="search-line">
          <input class="input" id="searchProduct" placeholder="Buscar por producto, código, categoría..." value="${esc(state.filter.q)}">
          <select class="select" id="filterCategory">${categories().map(c => `<option ${state.filter.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
          <select class="select" id="filterStatus">${['Todos','Disponible','Bajo stock','Agotado'].map(c => `<option ${state.filter.status===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
        </div>
        <div class="chips">${categories().map(c => `<button class="chip ${state.filter.category===c?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}</div>
        <div class="product-grid">${list.length ? list.map(productCard).join('') : '<div class="empty">No hay productos con ese filtro.</div>'}</div>
      </div>
    </section>`;
  }
  function productCard(p){
    const badge = p.estado_stock === 'Agotado' ? 'out' : p.estado_stock === 'Bajo stock' ? 'low' : '';
    return `<article class="product-card">
      <img class="product-img" src="${esc(p.imagen || NO_IMG)}" alt="${esc(p.nombre)}" onerror="this.src='${NO_IMG}'">
      <div class="product-info">
        <div class="product-top"><div><div class="product-code">${esc(p.codigo)}</div><div class="product-title">${esc(p.nombre)}</div></div><span class="stock-badge ${badge}">${esc(p.estado_stock)} · ${p.stock}</span></div>
        <div class="product-meta"><span class="tag">${esc(p.categoria)}</span>${p.marca ? `<span class="tag">${esc(p.marca)}</span>` : ''}</div>
        <div class="price">${money(p.precio)}</div>
        <div class="muted" style="font-size:.82rem">Costo: ${money(p.costo)} · Ganancia/u: ${money(p.ganancia_unitaria)}</div>
        <div class="product-actions"><button class="btn small" data-add="${esc(p.id)}" ${p.stock<=0?'disabled':''}>Agregar</button><button class="btn small secondary" data-view="pos">POS</button></div>
      </div>
    </article>`;
  }

  function sectionPos(){
    const c = calcCart();
    return `<section class="section ${activateClass('pos')}" id="pos">
      <div class="panel">
        <div class="panel-head"><div><h2>Cotización / POS</h2><p>Carrito, cliente, envío, comisión y mensaje de WhatsApp.</p></div></div>
        <div class="pos-layout">
          <div class="panel" style="margin:0">
            <div class="panel-head"><div><h2>Carrito</h2><p>Agregue productos desde la lista o seleccione aquí.</p></div></div>
            <div class="row two">
              <select class="select" id="quickProduct"><option value="">Agregar producto...</option>${state.products.filter(p=>p.activo && p.stock>0).map(p=>`<option value="${esc(p.id)}">${esc(p.codigo)} · ${esc(p.nombre)} · ${money(p.precio)}</option>`).join('')}</select>
              <button class="btn" id="addQuickProduct">Agregar al carrito</button>
            </div>
            <div class="cart-list" style="margin-top:12px">${state.cart.length ? state.cart.map(cartItem).join('') : '<div class="empty">El carrito está vacío.</div>'}</div>
          </div>
          <div class="panel" style="margin:0">
            <div class="panel-head"><div><h2>Cliente / Envío</h2><p>Datos necesarios para factura o WhatsApp.</p></div></div>
            ${customerForm()}
            <div class="summary" style="margin-top:14px">
              <div class="summary-row"><b>Total productos</b><b>${money(c.subtotal)}</b></div>
              <div class="summary-row"><b>Envío: Lps.</b><b>${money(c.envio)}</b></div>
              <div class="summary-row"><b>Comisión por Pagar al Recibir: Lps.</b><b>${money(c.comision)}</b></div>
              <div class="summary-row"><b>Descuento</b><b>${money(c.descuento)}</b></div>
              <div class="summary-total"><b>Total final</b><b>${money(c.total)}</b></div>
            </div>
            <div class="button-row" style="margin-top:14px">
              <button class="btn secondary" data-action="save-quote">Guardar cotización</button>
              <button class="btn" data-action="finish-invoice">Guardar factura</button>
            </div>
            <div class="button-row" style="margin-top:9px">
              <button class="btn ghost" data-action="copy-wa">Copiar WhatsApp</button>
              <button class="btn ghost" data-action="open-wa">Abrir WhatsApp</button>
            </div>
          </div>
          <div class="print-target">${receiptPreview()}</div>
        </div>
        <div class="button-row no-print" style="margin-top:12px">
          <button class="btn secondary" data-action="print-receipt">Imprimir / PDF</button>
          <button class="btn secondary" data-action="download-image">Descargar imagen</button>
          <button class="btn danger" data-action="clear-cart">Limpiar carrito</button>
        </div>
      </div>
    </section>`;
  }
  function customerForm(){
    return `<div class="row two">
      ${field('Nombre del cliente','custNombre',state.customer.nombre,'text')}
      ${field('Teléfono','custTelefono',state.customer.telefono,'tel')}
      ${field('Departamento','custDepartamento',state.customer.departamento,'text')}
      ${field('Municipio','custMunicipio',state.customer.municipio,'text')}
      <label class="field"><span>Tipo de envío</span><select class="select" id="shippingType">
        <option value="normal" ${state.shippingType==='normal'?'selected':''}>Envío Normal · ${money(state.config.normalShipping)}</option>
        <option value="cod" ${state.shippingType==='cod'?'selected':''}>Pagar al Recibir · envío ${money(state.config.cashOnDeliveryShipping)} + comisión</option>
        <option value="local" ${state.shippingType==='local'?'selected':''}>Entrega local · ${money(state.config.localShipping)}</option>
      </select></label>
      <label class="field"><span>Descuento Lps.</span><input class="input" id="discount" type="number" inputmode="numeric" value="${esc(state.discount)}"></label>
      <label class="field" style="grid-column:1/-1"><span>Dirección</span><textarea class="textarea" id="custDireccion">${esc(state.customer.direccion)}</textarea></label>
      <label class="field" style="grid-column:1/-1"><span>Referencia / notas</span><textarea class="textarea" id="custReferencia">${esc(state.customer.referencia)}</textarea></label>
    </div>`;
  }
  function field(label,id,value,type='text'){ return `<label class="field"><span>${esc(label)}</span><input class="input" id="${id}" type="${type}" value="${esc(value)}"></label>`; }
  function cartItem(it, i){
    return `<div class="cart-item">
      <div><b>${esc(it.nombre)}</b><span>${esc(it.codigo)} · ${money(it.precio)} c/u · Total ${money(itemPrice(it, it.qty))}</span></div>
      <div class="qty"><button data-dec="${i}">−</button><input data-qty="${i}" value="${it.qty}" inputmode="numeric"><button data-inc="${i}">+</button><button data-remove="${i}" title="Quitar">×</button></div>
    </div>`;
  }

  function receiptPreview(){
    const c = calcCart();
    return `<div class="invoice-preview" id="receiptCard">
      <div class="receipt-head"><img src="${LOGO}" alt="SD"><div><h3>${state.editingInvoiceId ? 'FACTURA EDITABLE' : 'COTIZACIÓN'}</h3><p>${esc(state.config.storeFullName)} · ${today()}</p></div></div>
      <p><b>Cliente:</b> ${esc(state.customer.nombre || 'Cliente')}<br><b>Teléfono:</b> ${esc(state.customer.telefono || 'Pendiente')}<br><b>Destino:</b> ${esc([state.customer.municipio,state.customer.departamento].filter(Boolean).join(', ') || 'Pendiente')}</p>
      <table class="receipt-table"><thead><tr><th>Producto</th><th>Cant.</th><th>Total</th></tr></thead><tbody>
        ${state.cart.length ? state.cart.map(it => `<tr><td>${esc(it.nombre)}<br><small>${esc(it.codigo)}</small></td><td>${it.qty}</td><td>${money(itemPrice(it,it.qty))}</td></tr>`).join('') : '<tr><td colspan="3">Sin productos agregados.</td></tr>'}
      </tbody></table>
      <div class="receipt-total">
        <div><span>Total productos</span><b>${money(c.subtotal)}</b></div>
        <div><span>Envío</span><b>${money(c.envio)}</b></div>
        <div><span>Comisión por Pagar al Recibir</span><b>${money(c.comision)}</b></div>
        ${c.descuento ? `<div><span>Descuento</span><b>− ${money(c.descuento)}</b></div>` : ''}
        <div class="grand"><span>TOTAL FINAL</span><b>${money(c.total)}</b></div>
      </div>
      <div class="receipt-note">WhatsApp +504 3151-7755 · Envíos por C807, Forza y Cargo Expreso. Precios sujetos a disponibilidad.</div>
    </div>`;
  }

  function sectionInvoices(){
    const list = [...state.invoices].sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return `<section class="section ${activateClass('invoices')}" id="invoices">
      <div class="panel"><div class="panel-head"><div><h2>Facturas / Cotizaciones</h2><p>Guardado básico en localStorage y sincronización opcional con Sheets.</p></div><span class="tag">${list.length}</span></div>
      <div class="list">${list.length ? list.map(invoiceCard).join('') : '<div class="empty">Todavía no hay facturas o cotizaciones guardadas.</div>'}</div></div>
    </section>`;
  }
  function invoiceCard(x){
    return `<div class="list-card"><div class="list-main"><div><b>${esc(x.code)} · ${esc(x.customer?.nombre || 'Cliente')}</b><span>${esc(x.status)} · ${new Date(x.createdAt).toLocaleString('es-HN')}</span><br><small>${(x.items||[]).map(i=>`${i.nombre} x${i.qty}`).join(' · ')}</small></div><div class="right"><b>${money(x.totals?.total)}</b><small>${esc(x.customer?.telefono || '')}</small></div></div><div class="button-row" style="margin-top:10px"><button class="btn small secondary" data-edit-invoice="${esc(x.id)}">Editar</button><button class="btn small ghost" data-wa-invoice="${esc(x.id)}">WhatsApp</button><button class="btn small danger" data-delete-invoice="${esc(x.id)}">Borrar</button></div></div>`;
  }

  function sectionClients(){
    const clients = buildClients();
    return `<section class="section ${activateClass('clients')}" id="clients">
      <div class="panel"><div class="panel-head"><div><h2>Clientes / Envíos</h2><p>Agenda básica generada desde cotizaciones y facturas.</p></div><span class="tag">${clients.length}</span></div>
      <div class="list">${clients.length ? clients.map(clientCard).join('') : '<div class="empty">Cuando guarde cotizaciones o facturas, aquí aparecerán los clientes.</div>'}</div></div>
    </section>`;
  }
  function buildClients(){
    const map = new Map();
    [...state.clients, ...state.invoices.map(x => ({ ...(x.customer||{}), ultimo_total:x.totals?.total, updatedAt:x.updatedAt || x.createdAt }))].forEach(c => {
      const key = cleanPhone(c.telefono) || String(c.nombre || '').toLowerCase();
      if (!key) return;
      map.set(key, { ...(map.get(key)||{}), ...c });
    });
    return [...map.values()].sort((a,b) => String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }
  function clientCard(c){
    return `<div class="list-card"><div class="list-main"><div><b>${esc(c.nombre || 'Cliente')}</b><span>${esc(c.telefono || 'Sin teléfono')}</span><br><small>${esc([c.municipio,c.departamento].filter(Boolean).join(', '))} · ${esc(c.direccion || '')}</small></div><div class="right"><b>${money(c.ultimo_total || 0)}</b><small>Último total</small></div></div></div>`;
  }

  function sectionConfig(){
    return `<section class="section ${activateClass('config')}" id="config">
      <div class="panel"><div class="panel-head"><div><h2>Configuración</h2><p>Conexión con Apps Script y reglas de envío.</p></div></div>
        <div class="row two">
          ${field('URL Apps Script /exec','cfgUrl',state.config.appsScriptUrl)}
          ${field('API Key','cfgKey',state.config.apiKey)}
          ${field('WhatsApp sin +','cfgWhatsapp',state.config.whatsappNumber)}
          ${field('Límite bajo stock','cfgLow',state.config.lowStockLimit,'number')}
          ${field('Envío Normal Lps.','cfgNormal',state.config.normalShipping,'number')}
          ${field('Pagar al Recibir envío base Lps.','cfgCodShip',state.config.cashOnDeliveryShipping,'number')}
          ${field('Comisión Pagar al Recibir decimal','cfgCodCom',state.config.cashOnDeliveryCommission,'number')}
          ${field('Entrega local Lps.','cfgLocal',state.config.localShipping,'number')}
        </div>
        <div class="button-row" style="margin-top:14px">
          <button class="btn" data-action="save-config">Guardar configuración</button>
          <button class="btn secondary" data-action="sync">Probar y sincronizar</button>
          <button class="btn ghost" data-action="export-json">Exportar respaldo JSON</button>
          <button class="btn danger" data-action="reset-demo">Reiniciar datos locales</button>
        </div>
        <div class="panel" style="margin-bottom:0"><b>Hojas que usa esta versión</b><p class="muted">productos_pos, facturas_pos, ajustes_pos, clientes_envios, logs_pos y Dashboard_POS.</p></div>
      </div>
    </section>`;
  }

  function bind(){
    $$('[data-view]').forEach(b => b.onclick = () => { state.view = b.dataset.view; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); });
    $$('[data-action="toggle-mode"]').forEach(b => b.onclick = () => { state.mode = state.mode === 'pro' ? 'gamer' : 'pro'; save(); render(); toast(state.mode === 'pro' ? 'Modo Pro activado.' : 'Modo Gamer activado.'); });
    $$('[data-action="sync"]').forEach(b => b.onclick = syncFromSheets);
    const search = $('#searchProduct'); if(search) search.oninput = e => { state.filter.q = e.target.value; save(); render(); $('#searchProduct')?.focus(); };
    const cat = $('#filterCategory'); if(cat) cat.onchange = e => { state.filter.category = e.target.value; save(); render(); };
    const st = $('#filterStatus'); if(st) st.onchange = e => { state.filter.status = e.target.value; save(); render(); };
    $$('[data-cat]').forEach(b => b.onclick = () => { state.filter.category = b.dataset.cat; save(); render(); });
    $$('[data-add]').forEach(b => b.onclick = () => { addToCart(b.dataset.add); state.view = 'pos'; save(); render(); toast('Producto agregado al POS.'); });
    const quick = $('#addQuickProduct'); if(quick) quick.onclick = () => { const id = $('#quickProduct').value; if(!id) return toast('Seleccione un producto.'); addToCart(id); save(); render(); };
    $$('[data-inc]').forEach(b => b.onclick = () => { state.cart[+b.dataset.inc].qty++; save(); render(); });
    $$('[data-dec]').forEach(b => b.onclick = () => { const it = state.cart[+b.dataset.dec]; it.qty = Math.max(1, n(it.qty)-1); save(); render(); });
    $$('[data-remove]').forEach(b => b.onclick = () => { state.cart.splice(+b.dataset.remove,1); save(); render(); });
    $$('[data-qty]').forEach(inp => inp.oninput = () => { state.cart[+inp.dataset.qty].qty = Math.max(1, n(inp.value)); save(); render(); });
    bindCustomerInputs();
    bindActions();
  }

  function bindCustomerInputs(){
    const map = { custNombre:'nombre', custTelefono:'telefono', custDepartamento:'departamento', custMunicipio:'municipio', custDireccion:'direccion', custReferencia:'referencia' };
    Object.entries(map).forEach(([id,key]) => { const el = $('#'+id); if(el) el.oninput = e => { state.customer[key] = e.target.value; save(); softRefreshReceipt(); }; });
    const ship = $('#shippingType'); if(ship) ship.onchange = e => { state.shippingType = e.target.value; save(); render(); };
    const discount = $('#discount'); if(discount) discount.oninput = e => { state.discount = n(e.target.value); save(); render(); };
  }
  function softRefreshReceipt(){ const target = $('#receiptCard'); if(target) target.outerHTML = receiptPreview().match(/<div class="invoice-preview"[\s\S]*<\/div>$/)?.[0] || receiptPreview(); }
  function bindActions(){
    const action = (name, fn) => $$(`[data-action="${name}"]`).forEach(b => b.onclick = fn);
    action('save-config', saveConfig);
    action('save-quote', () => saveDocument('Cotización'));
    action('finish-invoice', () => saveDocument('Factura'));
    action('copy-wa', async () => { await navigator.clipboard?.writeText(whatsappText()); toast('Mensaje copiado para WhatsApp.'); });
    action('open-wa', () => openWhatsApp(whatsappText()));
    action('print-receipt', () => window.print());
    action('download-image', downloadReceiptImage);
    action('clear-cart', () => { state.cart=[]; state.discount=0; state.editingInvoiceId=''; save(); render(); toast('Carrito limpio.'); });
    action('export-json', exportJSON);
    action('reset-demo', () => { if(confirm('¿Reiniciar datos locales de esta app?')){ localStorage.removeItem(LS); state=defaultState(); save(); render(); toast('Datos locales reiniciados.'); }});
    $$('[data-edit-invoice]').forEach(b => b.onclick = () => editInvoice(b.dataset.editInvoice));
    $$('[data-delete-invoice]').forEach(b => b.onclick = () => deleteInvoice(b.dataset.deleteInvoice));
    $$('[data-wa-invoice]').forEach(b => b.onclick = () => { const inv = state.invoices.find(x => x.id === b.dataset.waInvoice); if(inv) openWhatsApp(whatsappText(inv)); });
  }

  function addToCart(id){
    const p = state.products.find(x => x.id === id);
    if (!p || p.stock <= 0) return toast('Producto no disponible.');
    const existing = state.cart.find(x => x.id === p.id);
    if (existing) existing.qty += 1;
    else state.cart.push({ ...p, qty:1 });
  }
  function snapshot(status){
    const totals = calcCart();
    const id = state.editingInvoiceId || uid(status === 'Factura' ? 'FAC' : 'COT');
    return {
      id,
      code:id,
      status,
      createdAt: state.invoices.find(x => x.id === id)?.createdAt || iso(),
      updatedAt: iso(),
      customer:{ ...state.customer },
      shippingType:state.shippingType,
      items: state.cart.map(x => ({ id:x.id, codigo:x.codigo, nombre:x.nombre, precio:n(x.precio), costo:n(x.costo), qty:n(x.qty)||1 })),
      totals
    };
  }
  async function saveDocument(status){
    if (!state.cart.length) return toast('Agregue productos primero.');
    const doc = snapshot(status);
    const ix = state.invoices.findIndex(x => x.id === doc.id);
    if (ix >= 0) state.invoices[ix] = doc; else state.invoices.unshift(doc);
    saveClient(doc);
    if (status === 'Factura' && !state.editingInvoiceId) {
      doc.items.forEach(it => { const p = state.products.find(x => x.id === it.id); if(p) p.stock = Math.max(0, n(p.stock)-n(it.qty)); });
      state.products = state.products.map(normalizeProduct);
    }
    state.editingInvoiceId = doc.id;
    save(); render(); toast(`${status} guardada.`);
    if (SDCApi.ready()) {
      try { await SDCApi.post('saveInvoice', { invoice: toSheetInvoice(doc) }); } catch(e){ toast('Guardado local listo. Sheets no respondió.'); }
    }
  }
  function saveClient(doc){
    const key = cleanPhone(doc.customer.telefono) || doc.customer.nombre.toLowerCase();
    if (!key) return;
    const client = { id:key, createdAt:iso(), updatedAt:iso(), ...doc.customer, ultimo_total:doc.totals.total };
    const ix = state.clients.findIndex(x => x.id === key);
    if (ix >= 0) state.clients[ix] = { ...state.clients[ix], ...client }; else state.clients.unshift(client);
  }
  function toSheetInvoice(doc){
    return {
      id:doc.id, code:doc.code, createdAt:doc.createdAt, updatedAt:doc.updatedAt, status:doc.status,
      cliente:doc.customer.nombre, telefono:doc.customer.telefono, departamento:doc.customer.departamento, municipio:doc.customer.municipio, direccion:doc.customer.direccion,
      tipo_envio:doc.shippingType, items_json:JSON.stringify(doc.items), totals_json:JSON.stringify(doc.totals), subtotal:doc.totals.subtotal,
      envio:doc.totals.envio, comision:doc.totals.comision, descuento:doc.totals.descuento, total:doc.totals.total
    };
  }
  function editInvoice(id){
    const x = state.invoices.find(v => v.id === id); if(!x) return;
    state.cart = (x.items || []).map(it => normalizeProduct({ ...it, stock:999, precio:it.precio, costo:it.costo, nombre:it.nombre, codigo:it.codigo })).map(it => ({...it, qty:(x.items.find(k=>k.id===it.id)?.qty || 1)}));
    state.customer = { ...state.customer, ...(x.customer || {}) };
    state.shippingType = x.shippingType || 'normal';
    state.discount = x.totals?.descuento || 0;
    state.editingInvoiceId = x.id;
    state.view = 'pos';
    save(); render(); toast('Factura cargada para editar.');
  }
  function deleteInvoice(id){
    if(!confirm('¿Borrar este registro local?')) return;
    state.invoices = state.invoices.filter(x => x.id !== id);
    save(); render(); toast('Registro borrado localmente.');
  }

  function whatsappText(doc = snapshot('Cotización')){
    const c = doc.totals || calcCart(doc.items || []);
    const typeLabel = doc.shippingType === 'cod' ? 'Pagar al Recibir' : doc.shippingType === 'local' ? 'Entrega local' : 'Envío Normal';
    const lines = [
      `Hola 😊 Le compartimos su ${doc.status === 'Factura' ? 'factura' : 'cotización'} de SD COMAYAGUA.`,
      '',
      `Código: ${doc.code}`,
      `Cliente: ${doc.customer?.nombre || 'Pendiente'}`,
      `Teléfono: ${doc.customer?.telefono || 'Pendiente'}`,
      `Destino: ${[doc.customer?.municipio, doc.customer?.departamento].filter(Boolean).join(', ') || 'Pendiente'}`,
      '',
      'Productos:'
    ];
    (doc.items || state.cart).forEach(it => lines.push(`• ${it.nombre} x${it.qty}: ${money(itemPrice(it, it.qty))}`));
    lines.push('', `Total productos: ${money(c.subtotal)}`, `Envío (${typeLabel}): ${money(c.envio)}`);
    if (c.comision) lines.push(`Comisión por Pagar al Recibir: ${money(c.comision)}`);
    if (c.descuento) lines.push(`Descuento: -${money(c.descuento)}`);
    lines.push(`TOTAL FINAL: ${money(c.total)}`, '', 'Quedamos atentos para confirmar disponibilidad y datos de envío.');
    return lines.join('\n');
  }
  function openWhatsApp(text){
    const phone = cleanPhone(state.customer.telefono) || cleanPhone(state.config.whatsappNumber);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  }
  async function downloadReceiptImage(){
    const el = $('#receiptCard');
    if (!el) return;
    if (!window.html2canvas) { window.print(); return toast('html2canvas no cargó. Use Imprimir/PDF.'); }
    const canvas = await html2canvas(el, { scale:2.4, backgroundColor:'#ffffff', useCORS:true });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `sdc-${state.editingInvoiceId || 'cotizacion'}-${Date.now()}.png`;
    a.click();
    toast('Imagen descargada.');
  }

  function saveConfig(){
    state.config.appsScriptUrl = $('#cfgUrl').value.trim();
    state.config.apiKey = $('#cfgKey').value.trim();
    state.config.whatsappNumber = cleanPhone($('#cfgWhatsapp').value);
    state.config.lowStockLimit = n($('#cfgLow').value) || 5;
    state.config.normalShipping = n($('#cfgNormal').value);
    state.config.cashOnDeliveryShipping = n($('#cfgCodShip').value);
    state.config.cashOnDeliveryCommission = n($('#cfgCodCom').value);
    state.config.localShipping = n($('#cfgLocal').value);
    state.products = state.products.map(normalizeProduct);
    window.SDC_CONFIG = { ...window.SDC_CONFIG, ...state.config };
    save(); render(); toast('Configuración guardada.');
  }
  async function syncFromSheets(){
    saveConfigIfVisible();
    if (!SDCApi.ready()) return toast('Pegue primero la URL /exec de Apps Script en Configuración.');
    try{
      toast('Sincronizando con Google Sheets...');
      const data = await SDCApi.get('all');
      if (Array.isArray(data.products) && data.products.length) state.products = data.products.map(normalizeProduct);
      if (data.settings) state.config = { ...state.config, ...data.settings, appsScriptUrl:state.config.appsScriptUrl, apiKey:state.config.apiKey };
      if (Array.isArray(data.invoices)) state.invoices = mergeInvoices(state.invoices, data.invoices.map(fromSheetInvoice));
      if (Array.isArray(data.clients)) state.clients = mergeClients(state.clients, data.clients);
      state.products = state.products.map(normalizeProduct);
      save(); render(); toast('Sincronización completa.');
    }catch(e){ console.error(e); toast('No se pudo sincronizar. Revise URL, permisos y despliegue.'); }
  }
  function saveConfigIfVisible(){ if($('#cfgUrl')) saveConfig(); }
  function mergeInvoices(local, remote){ const map = new Map(); [...remote, ...local].forEach(x => x?.id && map.set(x.id, x)); return [...map.values()]; }
  function mergeClients(local, remote){ const map = new Map(); [...remote, ...local].forEach(x => { const key=x.id || cleanPhone(x.telefono) || x.nombre; if(key) map.set(key,x); }); return [...map.values()]; }
  function fromSheetInvoice(x){
    let items=[], totals={}; try{ items=JSON.parse(x.items_json||'[]'); }catch(e){} try{ totals=JSON.parse(x.totals_json||'{}'); }catch(e){}
    return { id:x.id, code:x.code||x.id, createdAt:x.createdAt, updatedAt:x.updatedAt, status:x.status||'Cotización', customer:{ nombre:x.cliente, telefono:x.telefono, departamento:x.departamento, municipio:x.municipio, direccion:x.direccion }, shippingType:x.tipo_envio, items, totals:{ subtotal:n(x.subtotal), envio:n(x.envio), comision:n(x.comision), descuento:n(x.descuento), total:n(x.total), ...totals } };
  }
  function exportJSON(){
    const blob = new Blob([JSON.stringify(state,null,2)], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `respaldo-sdc-pos-${Date.now()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
})();
