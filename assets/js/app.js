import { CONFIG } from './config.js';
import { getInit, api } from './api.js';
import { $, $$, money, todayHN, uid, safeText, toNumber, parsePromos, linePriceForQty, unitPriceForQty, productImage, normalizeProduct, showToast, imageFallback, buildWhatsAppUrl, nowIso } from './helpers.js';
import { downloadInvoiceImage, downloadInvoicePdf } from './export.js';

const state = {
  products: [],
  quotes: [],
  sales: [],
  currentView: 'dashboard',
  productLayout: localStorage.getItem('sdc_layout') || 'one',
  catalogMode: 'admin',
  search: '',
  category: 'Todas',
  quote: createBlankQuote(),
  editingProductId: '',
  selectedImageFile: null
};

function createBlankQuote(){
  return {
    id: uid('COT'),
    fecha: new Date().toISOString(),
    estado: 'borrador',
    cliente: { nombre:'', telefono:'', departamento:'', municipio:'', direccion:'' },
    envio: { tipo:'local', empresa:'Entrega local', costo:CONFIG.SHIPPING.localDefault, comision:0 },
    items: [],
    notas: ''
  };
}

function getProduct(id){ return state.products.find(p => String(p.id) === String(id)); }
function lineTotal(item){ const p = getProduct(item.productId) || item; return linePriceForQty(p, item.qty); }

function quoteTotals(quote = state.quote){
  const subtotal = (quote.items || []).reduce((sum,item) => sum + lineTotal(item), 0);
  let envio = toNumber(quote.envio?.costo);
  let comision = 0;
  if(quote.envio?.tipo === 'normal') envio = CONFIG.SHIPPING.normal;
  if(quote.envio?.tipo === 'cod'){
    envio = CONFIG.SHIPPING.codBase;
    comision = Math.round((subtotal + envio) * CONFIG.SHIPPING.codPercent);
  }
  return { subtotal, envio, comision, total: subtotal + envio + comision };
}

function closeDrawer(){
  $('.sidebar')?.classList.remove('open');
  $('#drawerBackdrop')?.classList.remove('open');
}
function toggleDrawer(){
  $('.sidebar')?.classList.toggle('open');
  $('#drawerBackdrop')?.classList.toggle('open');
}

function departmentNames(){
  return Object.keys(CONFIG.HONDURAS_MUNICIPIOS || {}).sort((a,b) => a.localeCompare(b,'es'));
}

function populateMunicipalities(department = '', selectedMunicipality = ''){
  const city = $('#customerCity');
  if(!city) return;
  const municipalities = (CONFIG.HONDURAS_MUNICIPIOS || {})[department] || [];
  city.innerHTML = `<option value="">Seleccione municipio</option>` + municipalities.map(m => `<option value="${safeText(m)}">${safeText(m)}</option>`).join('');
  city.disabled = !department;
  if(selectedMunicipality && municipalities.includes(selectedMunicipality)) city.value = selectedMunicipality;
}

function initLocationSelects(){
  const dept = $('#customerDept');
  if(!dept) return;
  dept.innerHTML = `<option value="">Seleccione departamento</option>` + departmentNames().map(d => `<option value="${safeText(d)}">${safeText(d)}</option>`).join('');
  populateMunicipalities('', '');
}

function syncQuoteFromForm(){
  const name = $('#customerName');
  if(!name) return;
  state.quote.cliente = {
    nombre: name.value.trim(),
    telefono: $('#customerPhone')?.value.trim() || '',
    departamento: $('#customerDept')?.value.trim() || '',
    municipio: $('#customerCity')?.value.trim() || '',
    direccion: $('#customerAddress')?.value.trim() || ''
  };
  const tipo = $('[name="shippingType"]:checked')?.value || 'local';
  state.quote.envio.tipo = tipo;
  state.quote.envio.empresa = $('#shippingCompany')?.value || 'Entrega local';
  state.quote.envio.costo = toNumber($('#shippingCost')?.value);
  if(tipo === 'normal') state.quote.envio.costo = CONFIG.SHIPPING.normal;
  if(tipo === 'cod') state.quote.envio.costo = CONFIG.SHIPPING.codBase;
  state.quote.envio.comision = quoteTotals().comision;
}

function fillFormFromQuote(){
  $('#customerName').value = state.quote.cliente.nombre || '';
  $('#customerPhone').value = state.quote.cliente.telefono || '';
  const deptEl = $('#customerDept');
  if(deptEl){
    deptEl.value = state.quote.cliente.departamento || '';
    populateMunicipalities(deptEl.value, state.quote.cliente.municipio || '');
  }
  $('#customerAddress').value = state.quote.cliente.direccion || '';
  $$('[name="shippingType"]').forEach(r => { r.checked = r.value === state.quote.envio.tipo; });
  $('#shippingCompany').value = state.quote.envio.empresa || 'Entrega local';
  $('#shippingCost').value = state.quote.envio.costo || CONFIG.SHIPPING.localDefault;
}

function setView(view){
  state.currentView = view;
  closeDrawer();
  $$('.view').forEach(v => v.classList.remove('is-visible'));
  $(`#view-${view}`)?.classList.add('is-visible');
  $$('.nav-item,.bottom-item').forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === view));
  if(view === 'admin' && !state.editingProductId) resetProductForm();
  if(view === 'cotizacion') renderQuote();
  renderCartBar();
  window.scrollTo({ top:0, behavior:'smooth' });
}

function stats(){
  const active = state.products.filter(p => p.activo);
  const invCost = active.reduce((s,p) => s + p.costo * p.stock, 0);
  const invSale = active.reduce((s,p) => s + p.precio * p.stock, 0);
  return {
    count: active.length,
    stock: active.reduce((s,p) => s + p.stock, 0),
    invCost,
    invSale,
    profit: invSale - invCost,
    quotes: state.quotes.length,
    sales: state.sales.length
  };
}

function renderAll(){
  renderDashboard();
  renderCategoryFilter();
  renderProducts();
  renderQuote();
  renderSales();
  renderCartBar();
}

function renderDashboard(){
  const s = stats();
  $('#kpiGrid').innerHTML = [
    ['▣','Inventario total',s.stock,`${s.count} productos activos`],
    ['💰','Invertido',money(s.invCost),'capital actual'],
    ['📈','Valor de venta',money(s.invSale),'venta proyectada'],
    ['✅','Ganancia proyectada',money(s.profit),'si vende todo'],
    ['🧾','Cotizaciones',s.quotes,'guardadas'],
    ['🛒','Ventas',s.sales,'registradas']
  ].map(([icon,label,value,desc]) => `
    <div class="kpi-card"><div class="kpi-icon">${icon}</div><div><small>${label}</small><strong>${value}</strong><span>${desc}</span></div></div>
  `).join('');

  $('#recentProductsTable').innerHTML = `<thead><tr><th>Producto</th><th>Código</th><th>Stock</th><th>Precio</th></tr></thead><tbody>${state.products.slice(0,8).map(p => `
    <tr><td>${safeText(p.nombre)}</td><td>${safeText(p.codigo)}</td><td>${p.stock}</td><td>${money(p.precio)}</td></tr>
  `).join('') || `<tr><td colspan="4">Sin productos.</td></tr>`}</tbody>`;

  $('#recentQuotesTable').innerHTML = `<thead><tr><th>Código</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead><tbody>${state.quotes.slice(0,8).map(q => `
    <tr><td>${safeText(q.id)}</td><td>${safeText(q.cliente?.nombre || '-')}</td><td>${safeText(q.estado || 'borrador')}</td><td>${money(q.total || 0)}</td></tr>
  `).join('') || `<tr><td colspan="4">Sin cotizaciones.</td></tr>`}</tbody>`;
}

function categories(){
  const cats = ['Todas', ...new Set(state.products.map(p => p.categoria).filter(Boolean))];
  return cats.sort((a,b) => a === 'Todas' ? -1 : b === 'Todas' ? 1 : a.localeCompare(b,'es'));
}

function renderCategoryFilter(){
  const cats = categories();
  if(!cats.includes(state.category)) state.category = 'Todas';
  $('#categoryFilter').innerHTML = cats.map(cat => `<option value="${safeText(cat)}" ${cat === state.category ? 'selected' : ''}>${safeText(cat)}</option>`).join('');
  $('#categoryChips').innerHTML = cats.map(cat => `<button type="button" class="cat-chip ${cat === state.category ? 'is-active' : ''}" data-cat="${safeText(cat)}">${safeText(cat)}</button>`).join('');
}

function filteredProducts(){
  const q = state.search.toLowerCase().trim();
  return state.products
    .filter(p => p.activo)
    .filter(p => state.category === 'Todas' || p.categoria === state.category)
    .filter(p => !q || [p.nombre,p.codigo,p.marca,p.categoria].join(' ').toLowerCase().includes(q))
    .sort((a,b) => (a.orden || 999) - (b.orden || 999) || a.nombre.localeCompare(b.nombre,'es'));
}

function renderProducts(){
  const grid = $('#productsGrid');
  grid.classList.toggle('layout-one', state.productLayout === 'one');
  grid.classList.toggle('layout-two', state.productLayout === 'two');
  grid.classList.toggle('client-mode', state.catalogMode === 'client');

  $('#layoutOne').classList.toggle('is-active', state.productLayout === 'one');
  $('#layoutTwo').classList.toggle('is-active', state.productLayout === 'two');
  $('#btnClientMode').classList.toggle('is-active', state.catalogMode === 'client');
  $('#btnClientMode').textContent = state.catalogMode === 'client' ? '✕ Salir cliente' : '👁 Cliente';
  $('#btnExitClientMode').classList.toggle('hidden', state.catalogMode !== 'client');
  $('#catalogTitle').textContent = state.catalogMode === 'client' ? 'Vista cliente' : 'Catálogo';
  $('#catalogSubtitle').textContent = state.catalogMode === 'client'
    ? 'Seleccione una categoría para mostrar solo esos productos al cliente.'
    : 'Filtre por categoría, revise stock y agregue productos al carrito.';

  const products = filteredProducts();
  grid.innerHTML = products.map(p => state.catalogMode === 'client' ? clientProductCard(p) : productCard(p)).join('') || `<div class="empty-state">No se encontraron productos.</div>`;
  bindProductButtons(grid);
}

function cardImage(p){
  return `<button type="button" class="product-img-wrap" data-open-details aria-label="Ver detalle de ${safeText(p.nombre)}"><img class="product-img" src="${safeText(productImage(p))}" alt="${safeText(p.nombre)}" loading="lazy"/></button>`;
}

function productCard(p){
  const out = p.stock <= 0;
  return `<article class="product-card" data-product-id="${safeText(p.id)}">
    ${cardImage(p)}
    <div class="product-info">
      <h3>${safeText(p.nombre)}</h3>
      <div class="product-meta"><span class="meta-pill">${safeText(p.categoria)}</span>${p.marca ? `<span class="meta-pill">${safeText(p.marca)}</span>` : ''}<span class="meta-pill code-pill">Cód: ${safeText(p.codigo)}</span></div>
      <div class="price-row"><div class="price">${money(p.precio)}</div><div class="stock ${out ? 'out' : ''}">${out ? 'Agotado' : `Stock: ${p.stock}`}</div></div>
      ${promoHtml(p)}
      <div class="product-actions"><button type="button" class="quote-btn" data-add-cart ${out ? 'disabled' : ''}>🛒 Añadir</button><button type="button" class="details-btn" data-open-details>Detalle</button><button type="button" class="edit-btn" data-edit-product>Editar</button></div>
    </div>
  </article>`;
}

function clientProductCard(p){
  const out = p.stock <= 0;
  return `<article class="product-card client-card" data-product-id="${safeText(p.id)}">
    ${cardImage(p)}
    <div class="product-info">
      <h3>${safeText(p.nombre)}</h3>
      <div class="product-meta"><span class="meta-pill">${safeText(p.categoria)}</span><span class="meta-pill">${out ? 'Agotado' : `${p.stock} disponibles`}</span></div>
      <div class="price-row"><div class="price">${money(p.precio)}</div></div>
      ${promoHtml(p, true)}
      <div class="product-actions"><button type="button" class="details-btn" data-open-details>Ver detalle</button></div>
    </div>
  </article>`;
}

function promoHtml(p, client = false){
  const promos = parsePromos(p.promos_json || p.promos);
  if(!promos.length) return '';
  return `<div class="promo-table">${promos.sort((a,b) => a.qty - b.qty).slice(0, client ? 8 : 4).map(pr => `
    <div class="promo-line"><span>${pr.qty} ${pr.qty === 1 ? 'unidad' : 'unidades'}</span><b>${money(pr.total)}</b></div>
  `).join('')}</div>`;
}

function bindProductButtons(scope){
  $$('img', scope).forEach(img => img.addEventListener('error', imageFallback));
  $$('[data-add-cart]', scope).forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    addProductToCart(e.currentTarget.closest('[data-product-id]').dataset.productId);
  }));
  $$('[data-edit-product]', scope).forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    openProductEditor(e.currentTarget.closest('[data-product-id]').dataset.productId);
  }));
  $$('[data-open-details]', scope).forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    openProductModal(e.currentTarget.closest('[data-product-id]').dataset.productId);
  }));
  $$('.product-card', scope).forEach(card => card.addEventListener('click', e => {
    if(e.target.closest('button,input,select,textarea')) return;
    openProductModal(card.dataset.productId);
  }));
}

function addProductToCart(productId){
  const product = getProduct(productId);
  if(!product) return;
  if(product.stock <= 0) return showToast('Producto agotado. No se puede agregar.');
  const existing = state.quote.items.find(i => String(i.productId) === String(productId));
  if(existing){
    if(existing.qty + 1 > product.stock) return showToast('No hay stock suficiente para agregar más.');
    existing.qty += 1;
  }else{
    state.quote.items.push({ productId:product.id, codigo:product.codigo, nombre:product.nombre, imagen:productImage(product), qty:1, stock:product.stock });
  }
  renderQuote();
  renderCartBar();
  showToast('Producto añadido al carrito.');
}

function updateItemQty(productId, qty){
  const item = state.quote.items.find(i => String(i.productId) === String(productId));
  const product = getProduct(productId);
  if(!item || !product) return;
  const requested = toNumber(qty);
  if(requested > product.stock) showToast('No hay stock suficiente.');
  const next = Math.max(1, Math.min(requested, product.stock));
  item.qty = next;
  renderQuote();
  renderCartBar();
}

function removeItem(productId){
  state.quote.items = state.quote.items.filter(i => String(i.productId) !== String(productId));
  renderQuote();
  renderCartBar();
}

function renderQuote(){
  syncQuoteFromForm();
  const itemsBox = $('#quoteItems');
  if(!state.quote.items.length){
    itemsBox.innerHTML = `<div class="empty-state">Agregue productos desde el catálogo para comenzar la cotización.</div>`;
  }else{
    itemsBox.innerHTML = state.quote.items.map(item => {
      const p = getProduct(item.productId) || item;
      const total = linePriceForQty(p, item.qty);
      const unit = unitPriceForQty(p, item.qty);
      const maxStock = toNumber(p.stock ?? item.stock);
      return `<div class="quote-item" data-quote-product-id="${safeText(item.productId)}">
        <img src="${safeText(item.imagen || productImage(p))}" alt="${safeText(item.nombre)}"/>
        <div class="quote-item-info"><h4>${safeText(item.nombre)}</h4><small>${safeText(item.codigo)} · ${money(unit)} prom. c/u · Total ${money(total)} · Stock ${maxStock}</small></div>
        <div class="qty-control"><button type="button" data-qty-minus ${item.qty <= 1 ? 'disabled' : ''}>−</button><input data-qty-input type="number" min="1" max="${maxStock}" value="${item.qty}"><button type="button" data-qty-plus ${item.qty >= maxStock ? 'disabled' : ''}>+</button></div>
        <button type="button" class="remove-btn" data-remove-item aria-label="Quitar producto">Quitar</button>
      </div>`;
    }).join('');
  }
  $$('[data-qty-minus]', itemsBox).forEach(btn => btn.addEventListener('click', e => {
    const id = e.currentTarget.closest('[data-quote-product-id]').dataset.quoteProductId;
    const item = state.quote.items.find(i => String(i.productId) === String(id));
    updateItemQty(id, item.qty - 1);
  }));
  $$('[data-qty-plus]', itemsBox).forEach(btn => btn.addEventListener('click', e => {
    const id = e.currentTarget.closest('[data-quote-product-id]').dataset.quoteProductId;
    const item = state.quote.items.find(i => String(i.productId) === String(id));
    updateItemQty(id, item.qty + 1);
  }));
  $$('[data-qty-input]', itemsBox).forEach(input => input.addEventListener('input', e => updateItemQty(e.currentTarget.closest('[data-quote-product-id]').dataset.quoteProductId, e.currentTarget.value)));
  $$('[data-remove-item]', itemsBox).forEach(btn => btn.addEventListener('click', e => removeItem(e.currentTarget.closest('[data-quote-product-id]').dataset.quoteProductId)));
  renderInvoice();
}

function renderInvoice(){
  const totals = quoteTotals();
  state.quote.subtotal = totals.subtotal;
  state.quote.total = totals.total;
  state.quote.envio.comision = totals.comision;
  $('#quoteCode').textContent = state.quote.id;
  $('#quoteDate').textContent = todayHN();
  $('#quoteStatusText').textContent = state.quote.estado || 'Borrador';
  $('#quoteStateBadge').textContent = state.quote.estado || 'Borrador';
  const c = state.quote.cliente;
  $('#invoiceClientBox').innerHTML = c.nombre ? `
    <div class="invoice-client-grid">
      <div><small>Cliente</small><b>${safeText(c.nombre)}</b></div>
      <div><small>Teléfono</small><b>${safeText(c.telefono || '-')}</b></div>
      <div><small>Departamento</small><b>${safeText(c.departamento || '-')}</b></div>
      <div><small>Municipio</small><b>${safeText(c.municipio || '-')}</b></div>
      ${c.direccion ? `<div class="wide"><small>Dirección</small><b>${safeText(c.direccion)}</b></div>` : ''}
    </div>` : 'Cliente pendiente de agregar.';
  $('#invoiceProducts').innerHTML = state.quote.items.length ? state.quote.items.map(item => {
    const p = getProduct(item.productId) || item;
    const total = linePriceForQty(p, item.qty);
    return `<div class="invoice-row">
      <img class="invoice-thumb" src="${safeText(item.imagen || productImage(p))}" alt="${safeText(item.nombre)}" />
      <div><b>${safeText(item.nombre)}</b><small>${item.qty} x ${money(unitPriceForQty(p,item.qty))} prom. c/u · ${safeText(item.codigo)}</small></div>
      <strong>${money(total)}</strong>
    </div>`;
  }).join('') : `<div class="empty-state">Sin productos.</div>`;
  $$('img', $('#invoiceProducts')).forEach(img => img.addEventListener('error', imageFallback));
  $('#invoiceTotals').innerHTML = `<div class="total-line"><span>Subtotal productos</span><b>${money(totals.subtotal)}</b></div><div class="total-line"><span>Envío</span><b>${money(totals.envio)}</b></div><div class="total-line"><span>Comisión pagar al recibir</span><b>${money(totals.comision)}</b></div><div class="total-line grand"><span>Total</span><b>${money(totals.total)}</b></div>`;
}

function renderCartBar(){
  const count = state.quote.items.reduce((s,i) => s + toNumber(i.qty), 0);
  const total = quoteTotals().total;
  $('#cartCountTop').textContent = count;
  $('#cartBarCount').textContent = `${count} ${count === 1 ? 'producto' : 'productos'} en carrito`;
  $('#cartBarTotal').textContent = money(total);
  $('#cartBar').classList.toggle('show', count > 0 && state.currentView !== 'cotizacion');
}

function renderSales(){
  const box = $('#salesList');
  if(!state.sales.length){ box.innerHTML = `<div class="empty-state">Aún no hay ventas registradas.</div>`; return; }
  box.innerHTML = state.sales.map(s => `<div class="sale-card"><div><strong>${safeText(s.id)}</strong><br><small>${safeText(s.cliente?.nombre || 'Cliente')} · ${safeText(s.estado || 'activa')}</small></div><b>${money(s.total || 0)}</b>${s.estado !== 'cancelada' ? `<button class="danger-ghost" data-cancel-sale="${safeText(s.id)}">Cancelar</button>` : ''}</div>`).join('');
  $$('[data-cancel-sale]', box).forEach(btn => btn.addEventListener('click', async e => {
    if(!confirm('¿Cancelar venta y regresar stock?')) return;
    try{
      const data = await api.cancelSale(e.currentTarget.dataset.cancelSale);
      if(data.productos) state.products = data.productos.map(normalizeProduct);
      if(data.ventas) state.sales = data.ventas;
      renderAll();
      showToast('Venta cancelada y stock restaurado.');
    }catch(err){ showToast(err.message); }
  }));
}

function quoteMessage(){
  syncQuoteFromForm();
  const totals = quoteTotals();
  const c = state.quote.cliente;
  const lines = [
    `*Cotización ${state.quote.id} - SD COMAYAGUA*`,
    `Cliente: ${c.nombre || 'Pendiente'}`,
    ``,
    ...state.quote.items.map(i => {
      const p = getProduct(i.productId) || i;
      return `• ${i.qty} x ${i.nombre}: ${money(linePriceForQty(p,i.qty))}`;
    }),
    ``,
    `Subtotal: ${money(totals.subtotal)}`,
    `Envío: ${money(totals.envio)}`,
    `Comisión: ${money(totals.comision)}`,
    `*Total: ${money(totals.total)}*`,
    ``,
    CONFIG.BUSINESS_COPY.quoteDisclaimer
  ];
  return lines.join('\n');
}

function resetQuote(){
  state.quote = createBlankQuote();
  fillFormFromQuote();
  renderQuote();
  renderCartBar();
}

function openProductModal(id){
  const p = getProduct(id);
  if(!p) return;
  const out = p.stock <= 0;
  $('#productModalContent').innerHTML = `
    <img class="modal-product-img" src="${safeText(productImage(p))}" alt="${safeText(p.nombre)}" />
    <div class="modal-product-body">
      <h2>${safeText(p.nombre)}</h2>
      <div class="product-meta"><span class="meta-pill">${safeText(p.categoria)}</span>${p.marca ? `<span class="meta-pill">${safeText(p.marca)}</span>` : ''}<span class="meta-pill">Cód: ${safeText(p.codigo)}</span><span class="meta-pill">${out ? 'Agotado' : `Stock: ${p.stock}`}</span></div>
      <div class="price-row"><div class="price">${money(p.precio)}</div></div>
      ${promoHtml(p, true)}
      <p>${safeText(p.descripcion || 'Sin descripción registrada.')}</p>
      <div class="modal-actions"><button type="button" class="quote-btn" id="modalAddCart" ${out ? 'disabled' : ''}>🛒 Añadir al carrito</button><button type="button" class="edit-btn" id="modalEditProduct">Editar producto</button></div>
    </div>`;
  $('#productModalContent img')?.addEventListener('error', imageFallback);
  $('#modalAddCart')?.addEventListener('click', () => addProductToCart(id));
  $('#modalEditProduct')?.addEventListener('click', () => { closeProductModal(); openProductEditor(id); });
  $('#productModal').classList.remove('hidden');
}
function closeProductModal(){ $('#productModal').classList.add('hidden'); }

function productFromForm(){
  const promos = $$('.promo-row').map(row => {
    const qty = toNumber(row.querySelector('[data-promo-qty]').value);
    const total = toNumber(row.querySelector('[data-promo-total]').value);
    return qty && total ? `${qty}=${total}` : '';
  }).filter(Boolean).join(' | ');
  return {
    id: $('#prodId').value || '',
    codigo: $('#prodCodigo').value.trim(),
    nombre: $('#prodNombre').value.trim(),
    categoria: $('#prodCategoria').value.trim() || 'General',
    marca: $('#prodMarca').value.trim(),
    precio: toNumber($('#prodPrecio').value),
    costo: toNumber($('#prodCosto').value),
    stock: toNumber($('#prodStock').value),
    orden: toNumber($('#prodOrden').value),
    imagen: $('#prodImagen').value.trim(),
    descripcion: $('#prodDescripcion').value.trim(),
    promos,
    activo: true,
    updatedAt: nowIso()
  };
}

function resetProductForm(){
  state.editingProductId = '';
  state.selectedImageFile = null;
  $('#productFormTitle').textContent = 'Agregar / editar producto';
  $('#productForm').reset();
  $('#prodId').value = '';
  $('#imagePreview').classList.add('hidden');
  $('#imagePreview').removeAttribute('src');
  $('#promoRows').innerHTML = '';
  addPromoRow();
}

function addPromoRow(qty = '', total = ''){
  const row = document.createElement('div');
  row.className = 'promo-row';
  row.innerHTML = `<label>Cantidad<input data-promo-qty type="number" min="1" step="1" value="${safeText(qty)}"></label><label>Precio total<input data-promo-total type="number" min="0" step="1" value="${safeText(total)}"></label><button type="button" class="danger-ghost" data-remove-promo>×</button>`;
  $('#promoRows').appendChild(row);
  row.querySelector('[data-remove-promo]').addEventListener('click', () => row.remove());
}

function openProductEditor(id){
  const p = getProduct(id);
  if(!p) return;
  state.editingProductId = id;
  setView('admin');
  $('#productFormTitle').textContent = `Editando: ${p.nombre}`;
  $('#prodId').value = p.id;
  $('#prodCodigo').value = p.codigo;
  $('#prodNombre').value = p.nombre;
  $('#prodCategoria').value = p.categoria;
  $('#prodMarca').value = p.marca;
  $('#prodPrecio').value = p.precio;
  $('#prodCosto').value = p.costo;
  $('#prodStock').value = p.stock;
  $('#prodOrden').value = p.orden || '';
  $('#prodImagen').value = p.imagen || '';
  $('#prodDescripcion').value = p.descripcion || '';
  if(p.imagen){ $('#imagePreview').src = p.imagen; $('#imagePreview').classList.remove('hidden'); }
  $('#promoRows').innerHTML = '';
  const promos = parsePromos(p.promos_json || p.promos);
  if(promos.length) promos.forEach(pr => addPromoRow(pr.qty, pr.total)); else addPromoRow();
}

async function saveProductForm(e){
  e.preventDefault();
  const product = productFromForm();
  if(!product.nombre) return showToast('Escriba el nombre del producto.');
  try{
    const data = await api.upsertProduct(product);
    if(data.productos) state.products = data.productos.map(normalizeProduct);
    else if(data.product) state.products = [data.product, ...state.products.filter(p => p.id !== data.product.id)].map(normalizeProduct);
    renderAll();
    openProductEditor((data.product || product).id);
    showToast('Producto guardado correctamente.');
  }catch(err){ showToast(err.message || 'No se pudo guardar.'); }
}

function fileToBase64(file){
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}

async function uploadSelectedImage(){
  if(!state.selectedImageFile) return showToast('Seleccione una imagen primero.');
  try{
    $('#btnUploadImage').disabled = true;
    $('#btnUploadImage').textContent = 'Subiendo...';
    const base64 = await fileToBase64(state.selectedImageFile);
    const filename = `${($('#prodCodigo').value || uid('IMG')).replace(/[^a-zA-Z0-9_-]/g,'_')}_${state.selectedImageFile.name}`;
    const data = await api.uploadImage({ base64, filename, mimeType: state.selectedImageFile.type });
    $('#prodImagen').value = data.url || base64;
    $('#imagePreview').src = data.url || base64;
    $('#imagePreview').classList.remove('hidden');
    showToast('Imagen subida y colocada en el producto.');
  }catch(err){ showToast(err.message || 'No se pudo subir la imagen.'); }
  finally{
    $('#btnUploadImage').disabled = false;
    $('#btnUploadImage').textContent = 'Subir imagen';
  }
}

function bindEvents(){
  $('#btnMenu')?.addEventListener('click', toggleDrawer);
  $('#drawerBackdrop')?.addEventListener('click', closeDrawer);
  $$('.nav-item,.bottom-item,[data-view-shortcut]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view || btn.dataset.viewShortcut)));
  $('#btnRefresh').addEventListener('click', loadData);
  $('#btnNewQuote').addEventListener('click', () => { resetQuote(); setView('productos'); });

  $('#searchInput').addEventListener('input', e => { state.search = e.target.value; renderProducts(); });
  $('#categoryFilter').addEventListener('change', e => { state.category = e.target.value; renderCategoryFilter(); renderProducts(); });
  $('#categoryChips').addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if(!btn) return;
    state.category = btn.dataset.cat;
    renderCategoryFilter();
    renderProducts();
  });
  $('#layoutOne').addEventListener('click', () => { state.productLayout = 'one'; localStorage.setItem('sdc_layout','one'); renderProducts(); });
  $('#layoutTwo').addEventListener('click', () => { state.productLayout = 'two'; localStorage.setItem('sdc_layout','two'); renderProducts(); });
  $('#btnClientMode').addEventListener('click', () => { state.catalogMode = state.catalogMode === 'client' ? 'admin' : 'client'; renderProducts(); });
  $('#btnExitClientMode').addEventListener('click', () => { state.catalogMode = 'admin'; renderProducts(); });

  ['customerName','customerPhone','customerAddress','shippingCost','shippingCompany'].forEach(id => $('#'+id).addEventListener('input', renderQuote));
  $('#customerDept')?.addEventListener('change', e => { populateMunicipalities(e.target.value, ''); renderQuote(); });
  $('#customerCity')?.addEventListener('change', renderQuote);
  $$('[name="shippingType"]').forEach(r => r.addEventListener('change', () => {
    const tipo = $('[name="shippingType"]:checked')?.value;
    $('#shippingCost').value = tipo === 'normal' ? CONFIG.SHIPPING.normal : tipo === 'cod' ? CONFIG.SHIPPING.codBase : CONFIG.SHIPPING.localDefault;
    renderQuote();
  }));

  $('#btnClearQuote').addEventListener('click', () => { if(confirm('¿Vaciar carrito/cotización actual?')) resetQuote(); });
  $('#btnSaveQuote').addEventListener('click', async () => {
    try{
      syncQuoteFromForm();
      const data = await api.saveQuote(state.quote);
      const idx = state.quotes.findIndex(q => q.id === state.quote.id);
      if(idx >= 0) state.quotes[idx] = state.quote; else state.quotes.unshift(state.quote);
      if(data.cotizaciones) state.quotes = data.cotizaciones;
      renderAll();
      showToast('Cotización guardada.');
    }catch(err){ showToast(err.message); }
  });
  $('#btnConvertSale').addEventListener('click', async () => {
    try{
      if(!state.quote.items.length) return showToast('Agregue productos antes de vender.');
      syncQuoteFromForm();
      const data = await api.convertQuoteToSale(state.quote);
      if(data.productos) state.products = data.productos.map(normalizeProduct);
      if(data.cotizaciones) state.quotes = data.cotizaciones;
      if(data.ventas) state.sales = data.ventas;
      resetQuote();
      renderAll();
      setView('ventas');
      showToast('Venta registrada y stock descontado.');
    }catch(err){ showToast(err.message); }
  });
  $('#btnDownloadImage').addEventListener('click', () => downloadInvoiceImage($('#invoiceCapture'), state.quote.id).catch(err => showToast(err.message)));
  $('#btnDownloadPdf').addEventListener('click', () => downloadInvoicePdf($('#invoiceCapture'), state.quote.id).catch(err => showToast(err.message)));
  $('#btnWhatsApp').addEventListener('click', () => window.open(buildWhatsAppUrl(quoteMessage()), '_blank'));

  $('#btnProductNew').addEventListener('click', resetProductForm);
  $('#btnAddPromo').addEventListener('click', () => addPromoRow());
  $('#productForm').addEventListener('submit', saveProductForm);
  $('#prodImagenFile').addEventListener('change', e => {
    const file = e.target.files?.[0];
    state.selectedImageFile = file || null;
    if(file){
      const url = URL.createObjectURL(file);
      $('#imagePreview').src = url;
      $('#imagePreview').classList.remove('hidden');
    }
  });
  $('#btnUploadImage').addEventListener('click', uploadSelectedImage);
  $('#btnDeactivateProduct').addEventListener('click', async () => {
    const id = $('#prodId').value;
    if(!id) return showToast('Seleccione un producto existente.');
    if(!confirm('¿Desactivar este producto?')) return;
    try{
      const data = await api.setProductActive(id, false);
      if(data.productos) state.products = data.productos.map(normalizeProduct);
      else state.products = state.products.map(p => p.id === id ? { ...p, activo:false } : p);
      resetProductForm();
      renderAll();
      setView('productos');
      showToast('Producto desactivado.');
    }catch(err){ showToast(err.message); }
  });

  $('#btnCloseProductModal').addEventListener('click', closeProductModal);
  $('#productModal').addEventListener('click', e => { if(e.target.id === 'productModal') closeProductModal(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape'){ closeDrawer(); closeProductModal(); } });
}

async function loadData(){
  try{
    $('#syncStatus').textContent = 'Sincronizando...';
    const data = await getInit();
    state.products = (data.productos || []).map(normalizeProduct);
    state.quotes = data.cotizaciones || [];
    state.sales = data.ventas || [];
    $('#syncStatus').textContent = data.demo ? 'Demo local' : 'En línea';
    renderAll();
  }catch(err){
    $('#syncStatus').textContent = 'Error';
    showToast(err.message || 'No se pudieron cargar los datos.');
  }
}

function init(){
  CONFIG.SHIPPING.companies.forEach(company => $('#shippingCompany').insertAdjacentHTML('beforeend', `<option>${safeText(company)}</option>`));
  initLocationSelects();
  bindEvents();
  resetProductForm();
  fillFormFromQuote();
  loadData();
}

init();
