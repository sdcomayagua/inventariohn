import { CONFIG } from './config.js';
import { getInit, api } from './api.js';
import { $, $$, money, todayHN, uid, safeText, toNumber, parsePromos, priceForQty, productImage, normalizeProduct, showToast, imageFallback, buildWhatsAppUrl } from './helpers.js';
import { downloadInvoiceImage, downloadInvoicePdf } from './export.js';

const state = {
  products: [],
  quotes: [],
  sales: [],
  currentView: 'dashboard',
  productLayout: 'one',
  search: '',
  category: 'Todas',
  quote: createBlankQuote()
};

function createBlankQuote(){
  return {
    id: uid('COT'),
    fecha: new Date().toISOString(),
    estado: 'borrador',
    cliente: { nombre:'', telefono:'', departamento:'', municipio:'', direccion:'' },
    envio: { tipo:'local', empresa:'Entrega local', costo: CONFIG.SHIPPING.localDefault, comision:0 },
    items: [],
    notas: ''
  };
}

function quoteTotals(quote = state.quote){
  const subtotal = quote.items.reduce((sum, item) => sum + toNumber(item.qty) * toNumber(item.unitPrice), 0);
  let envio = toNumber(quote.envio.costo);
  let comision = 0;
  if(quote.envio.tipo === 'normal') envio = CONFIG.SHIPPING.normal;
  if(quote.envio.tipo === 'cod'){
    envio = CONFIG.SHIPPING.codBase;
    comision = Math.round((subtotal + envio) * CONFIG.SHIPPING.codPercent);
  }
  return { subtotal, envio, comision, total: subtotal + envio + comision };
}

function syncQuoteFromForm(){
  state.quote.cliente = {
    nombre: $('#customerName')?.value.trim() || '',
    telefono: $('#customerPhone')?.value.trim() || '',
    departamento: $('#customerDept')?.value.trim() || '',
    municipio: $('#customerCity')?.value.trim() || '',
    direccion: $('#customerAddress')?.value.trim() || ''
  };
  const shippingType = $('[name="shippingType"]:checked')?.value || 'local';
  state.quote.envio.tipo = shippingType;
  state.quote.envio.empresa = $('#shippingCompany')?.value || 'Entrega local';
  state.quote.envio.costo = toNumber($('#shippingCost')?.value);
  if(shippingType === 'normal') state.quote.envio.costo = CONFIG.SHIPPING.normal;
  if(shippingType === 'cod') state.quote.envio.costo = CONFIG.SHIPPING.codBase;
  state.quote.envio.comision = quoteTotals().comision;
}

function fillFormFromQuote(){
  $('#customerName').value = state.quote.cliente.nombre || '';
  $('#customerPhone').value = state.quote.cliente.telefono || '';
  $('#customerDept').value = state.quote.cliente.departamento || '';
  $('#customerCity').value = state.quote.cliente.municipio || '';
  $('#customerAddress').value = state.quote.cliente.direccion || '';
  $$('[name="shippingType"]').forEach(r => { r.checked = r.value === state.quote.envio.tipo; });
  $('#shippingCompany').value = state.quote.envio.empresa || 'Entrega local';
  $('#shippingCost').value = state.quote.envio.costo || CONFIG.SHIPPING.localDefault;
}

function setView(view){
  state.currentView = view;
  $$('.view').forEach(v => v.classList.remove('is-visible'));
  $(`#view-${view}`)?.classList.add('is-visible');
  $$('.nav-item,.bottom-item').forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === view));
  window.scrollTo({ top:0, behavior:'smooth' });
}

function stats(){
  const activeProducts = state.products.filter(p => p.activo);
  const invCost = activeProducts.reduce((s,p) => s + p.costo * p.stock, 0);
  const invSale = activeProducts.reduce((s,p) => s + p.precio * p.stock, 0);
  const profit = invSale - invCost;
  const monthSales = state.sales.filter(s => s.estado !== 'cancelada').reduce((sum, sale) => sum + toNumber(sale.total || quoteTotals(sale).total), 0);
  return { count: activeProducts.length, stock: activeProducts.reduce((s,p)=>s+p.stock,0), invCost, invSale, profit, monthSales, quotes: state.quotes.length, sales: state.sales.length };
}

function renderDashboard(){
  const s = stats();
  $('#kpiGrid').innerHTML = [
    ['▣','Inventario total', `${s.stock}`, `${s.count} productos activos`],
    ['💰','Invertido', money(s.invCost), 'capital en inventario'],
    ['📈','Valor de venta', money(s.invSale), 'venta proyectada'],
    ['✅','Ganancia proyectada', money(s.profit), 'si vende todo el stock'],
    ['🧾','Cotizaciones', `${s.quotes}`, 'guardadas'],
    ['🛒','Ventas', `${s.sales}`, 'registradas']
  ].map(([icon,label,value,desc]) => `
    <div class="kpi-card"><div class="kpi-icon">${icon}</div><div><small>${label}</small><strong>${value}</strong><span>${desc}</span></div></div>
  `).join('');

  const recentProducts = state.products.slice(0, 7);
  $('#recentProductsTable').innerHTML = `
    <thead><tr><th>Producto</th><th>Código</th><th>Stock</th><th>Precio</th></tr></thead>
    <tbody>${recentProducts.map(p => `<tr><td>${safeText(p.nombre)}</td><td>${safeText(p.codigo)}</td><td>${p.stock}</td><td>${money(p.precio)}</td></tr>`).join('') || `<tr><td colspan="4">Sin productos.</td></tr>`}</tbody>
  `;
  const recentQuotes = state.quotes.slice(0, 7);
  $('#recentQuotesTable').innerHTML = `
    <thead><tr><th>Código</th><th>Cliente</th><th>Estado</th><th>Total</th></tr></thead>
    <tbody>${recentQuotes.map(q => `<tr><td>${safeText(q.id)}</td><td>${safeText(q.cliente?.nombre || '-')}</td><td>${safeText(q.estado || 'borrador')}</td><td>${money(q.total || quoteTotals(q).total)}</td></tr>`).join('') || `<tr><td colspan="4">Sin cotizaciones.</td></tr>`}</tbody>
  `;
}

function renderCategoryFilter(){
  const categories = ['Todas', ...new Set(state.products.map(p => p.categoria).filter(Boolean))];
  $('#categoryFilter').innerHTML = categories.map(cat => `<option value="${safeText(cat)}" ${cat === state.category ? 'selected' : ''}>${safeText(cat)}</option>`).join('');
}

function filteredProducts(){
  const q = state.search.toLowerCase().trim();
  return state.products
    .filter(p => p.activo)
    .filter(p => state.category === 'Todas' || p.categoria === state.category)
    .filter(p => !q || [p.nombre,p.codigo,p.marca,p.categoria].join(' ').toLowerCase().includes(q))
    .sort((a,b) => (a.orden || 999) - (b.orden || 999));
}

function renderProducts(){
  const grid = $('#productsGrid');
  grid.classList.toggle('layout-one', state.productLayout === 'one');
  grid.classList.toggle('layout-two', state.productLayout === 'two');
  $('#layoutOne').classList.toggle('is-active', state.productLayout === 'one');
  $('#layoutTwo').classList.toggle('is-active', state.productLayout === 'two');
  const products = filteredProducts();
  grid.innerHTML = products.map(productCard).join('') || `<div class="empty-state">No se encontraron productos.</div>`;
  bindProductButtons(grid);
}

function productCard(p){
  const out = p.stock <= 0;
  return `
    <article class="product-card" data-product-id="${safeText(p.id)}">
      <img class="product-img" src="${safeText(productImage(p))}" alt="${safeText(p.nombre)}" loading="lazy" />
      <div class="product-info">
        <h3>${safeText(p.nombre)}</h3>
        <div class="product-meta"><span>${safeText(p.marca || 'Marca')}</span><span>|</span><span>Cód: ${safeText(p.codigo)}</span></div>
        <div class="price-row"><div class="price">${money(p.precio)}</div><div class="stock ${out ? 'out' : ''}">${out ? 'Agotado' : `Stock: ${p.stock}`}</div></div>
        <div class="product-actions">
          <button class="quote-btn" data-add-quote ${out ? 'disabled' : ''}>Cotizar</button>
          <button class="client-btn" data-view-client>Vista cliente</button>
        </div>
      </div>
    </article>
  `;
}

function bindProductButtons(scope){
  $$('img', scope).forEach(img => img.addEventListener('error', imageFallback));
  $$('[data-add-quote]', scope).forEach(btn => btn.addEventListener('click', e => {
    const id = e.target.closest('[data-product-id]').dataset.productId;
    addProductToQuote(id);
  }));
  $$('[data-view-client]', scope).forEach(btn => btn.addEventListener('click', e => {
    const id = e.target.closest('[data-product-id]').dataset.productId;
    state.search = '';
    setView('cliente');
    setTimeout(() => document.querySelector(`[data-client-product-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior:'smooth', block:'center' }), 50);
  }));
}

function addProductToQuote(productId){
  const product = state.products.find(p => p.id === productId);
  if(!product) return;
  if(product.stock <= 0) return showToast('Producto agotado. No se puede cotizar.');
  const existing = state.quote.items.find(i => i.productId === productId);
  if(existing){
    if(existing.qty + 1 > product.stock) return showToast('No hay stock suficiente.');
    existing.qty += 1;
    existing.unitPrice = priceForQty(product, existing.qty);
  }else{
    state.quote.items.push({ productId:product.id, codigo:product.codigo, nombre:product.nombre, imagen:productImage(product), qty:1, unitPrice:priceForQty(product, 1), stock:product.stock });
  }
  renderQuote();
  setView('cotizacion');
  showToast('Producto agregado a la cotización.');
}

function updateItemQty(productId, qty){
  const item = state.quote.items.find(i => i.productId === productId);
  const product = state.products.find(p => p.id === productId);
  if(!item || !product) return;
  const nextQty = Math.max(1, Math.min(toNumber(qty), product.stock));
  item.qty = nextQty;
  item.unitPrice = priceForQty(product, nextQty);
  renderQuote();
}

function removeItem(productId){
  state.quote.items = state.quote.items.filter(i => i.productId !== productId);
  renderQuote();
}

function renderQuote(){
  syncQuoteFromForm();
  const itemsBox = $('#quoteItems');
  if(!state.quote.items.length){
    itemsBox.innerHTML = `<div class="empty-state">Agregue productos desde el catálogo para comenzar la cotización.</div>`;
  }else{
    itemsBox.innerHTML = state.quote.items.map(item => `
      <div class="quote-item" data-quote-product-id="${safeText(item.productId)}">
        <img src="${safeText(item.imagen)}" alt="${safeText(item.nombre)}" />
        <div>
          <h4>${safeText(item.nombre)}</h4>
          <small>${safeText(item.codigo)} · ${money(item.unitPrice)} c/u · Stock ${item.stock}</small>
        </div>
        <div class="qty-control">
          <button data-qty-minus>-</button>
          <input data-qty-input type="number" min="1" max="${item.stock}" value="${item.qty}">
          <button data-qty-plus>+</button>
          <button class="remove-btn" data-remove-item>×</button>
        </div>
      </div>
    `).join('');
  }
  bindQuoteItemEvents();
  renderInvoice();
}

function bindQuoteItemEvents(){
  $$('#quoteItems img').forEach(img => img.addEventListener('error', imageFallback));
  $$('[data-quote-product-id]').forEach(row => {
    const id = row.dataset.quoteProductId;
    row.querySelector('[data-qty-minus]')?.addEventListener('click', () => {
      const item = state.quote.items.find(i => i.productId === id);
      updateItemQty(id, item.qty - 1);
    });
    row.querySelector('[data-qty-plus]')?.addEventListener('click', () => {
      const item = state.quote.items.find(i => i.productId === id);
      updateItemQty(id, item.qty + 1);
    });
    row.querySelector('[data-qty-input]')?.addEventListener('input', e => updateItemQty(id, e.target.value));
    row.querySelector('[data-remove-item]')?.addEventListener('click', () => removeItem(id));
  });
}

function renderInvoice(){
  const t = quoteTotals();
  state.quote.subtotal = t.subtotal;
  state.quote.total = t.total;
  state.quote.envio.comision = t.comision;
  $('#quoteCode').textContent = state.quote.id;
  $('#quoteDate').textContent = todayHN();
  $('#quoteStatusText').textContent = state.quote.estado || 'borrador';
  $('#quoteStateBadge').textContent = state.quote.estado || 'Borrador';
  $('#quoteStateBadge').className = `status-badge ${state.quote.estado === 'cancelada' ? 'cancel' : state.quote.estado === 'enviada' ? 'sent' : 'active'}`;
  const c = state.quote.cliente;
  $('#invoiceClientBox').innerHTML = c.nombre ? `
    <b>Cliente:</b> ${safeText(c.nombre)}<br>
    <b>Teléfono:</b> ${safeText(c.telefono || '-')}<br>
    <b>Destino:</b> ${safeText([c.municipio,c.departamento].filter(Boolean).join(', ') || '-')}<br>
    <b>Referencia:</b> ${safeText(c.direccion || '-')}
  ` : 'Cliente pendiente de agregar.';
  $('#invoiceProducts').innerHTML = state.quote.items.length ? state.quote.items.map(item => `
    <div class="invoice-line">
      <div><strong>${safeText(item.nombre)}</strong><small>${safeText(item.codigo)} · Cant. ${item.qty} · ${money(item.unitPrice)} c/u</small></div>
      <b>${money(item.qty * item.unitPrice)}</b>
    </div>
  `).join('') : `<div class="empty-state">Sin productos agregados.</div>`;
  const envioLabel = state.quote.envio.tipo === 'cod' ? 'Pagar al recibir' : state.quote.envio.tipo === 'normal' ? 'Envío normal' : 'Envío local';
  $('#invoiceTotals').innerHTML = `
    <div class="total-row"><span>Subtotal productos</span><b>${money(t.subtotal)}</b></div>
    <div class="total-row"><span>${envioLabel}</span><b>${money(t.envio)}</b></div>
    <div class="total-row"><span>Comisión</span><b>${money(t.comision)}</b></div>
    <div class="total-row grand"><span>TOTAL</span><b>${money(t.total)}</b></div>
  `;
}

function renderSales(){
  const box = $('#salesList');
  box.innerHTML = state.sales.map(sale => {
    const total = sale.total || quoteTotals(sale).total;
    return `
      <div class="sale-card">
        <div class="sale-top"><strong>${safeText(sale.id)}</strong><span class="status-badge ${sale.estado === 'cancelada' ? 'cancel' : 'active'}">${safeText(sale.estado || 'activa')}</span></div>
        <div class="sale-grid">
          <div><small>Cliente</small><b>${safeText(sale.cliente?.nombre || '-')}</b></div>
          <div><small>Productos</small><b>${(sale.items || []).length}</b></div>
          <div><small>Envío</small><b>${money(sale.envio?.costo || 0)}</b></div>
          <div><small>Total</small><b>${money(total)}</b></div>
        </div>
        <div>${sale.estado !== 'cancelada' ? `<button class="danger-ghost" data-cancel-sale="${safeText(sale.id)}">Cancelar venta y devolver stock</button>` : ''}</div>
      </div>
    `;
  }).join('') || `<div class="empty-state">Todavía no hay ventas registradas.</div>`;
  $$('[data-cancel-sale]', box).forEach(btn => btn.addEventListener('click', async () => cancelSale(btn.dataset.cancelSale)));
}

function renderClientView(){
  $('#clientGrid').innerHTML = state.products.filter(p => p.activo).map(p => {
    const promos = parsePromos(p.promos_json);
    const lines = promos.length ? promos.slice(0,3).map(pr => `<div class="promo-line"><span>${pr.qty}+ unidades</span><b>${money(pr.price)}</b></div>`).join('') : `<div class="promo-line"><span>1 unidad</span><b>${money(p.precio)}</b></div>`;
    return `
      <article class="client-card" data-client-product-id="${safeText(p.id)}">
        <img src="${safeText(productImage(p))}" alt="${safeText(p.nombre)}" loading="lazy" />
        <div>
          <h3>${safeText(p.nombre)}</h3>
          <div class="product-meta"><span>Disponible: ${p.stock} unidades</span></div>
          <div class="promo-list">
            <div class="promo-line"><span>1 unidad</span><b>${money(p.precio)}</b></div>
            ${lines}
          </div>
        </div>
      </article>
    `;
  }).join('');
  $$('#clientGrid img').forEach(img => img.addEventListener('error', imageFallback));
}

function renderAll(){
  renderDashboard();
  renderCategoryFilter();
  renderProducts();
  renderQuote();
  renderSales();
  renderClientView();
}

async function saveQuote(){
  syncQuoteFromForm();
  if(!state.quote.items.length) return showToast('Agregue al menos un producto.');
  state.quote.estado = state.quote.estado || 'borrador';
  const totals = quoteTotals();
  Object.assign(state.quote, totals);
  const saved = structuredClone(state.quote);
  const result = await api.saveQuote(saved);
  const idx = state.quotes.findIndex(q => q.id === saved.id);
  if(idx >= 0) state.quotes[idx] = saved;
  else state.quotes.unshift(saved);
  renderAll();
  showToast('Cotización guardada.');
  return result;
}

async function convertSale(){
  syncQuoteFromForm();
  if(!state.quote.items.length) return showToast('Agregue productos antes de vender.');
  for(const item of state.quote.items){
    const product = state.products.find(p => p.id === item.productId);
    if(!product || product.stock < item.qty) return showToast(`Stock insuficiente: ${item.nombre}`);
  }
  const totals = quoteTotals();
  const quote = { ...structuredClone(state.quote), ...totals, estado:'convertida' };
  const result = await api.convertQuoteToSale(quote);
  if(result.productos) state.products = result.productos.map(normalizeProduct);
  if(result.cotizaciones) state.quotes = result.cotizaciones;
  if(result.ventas) state.sales = result.ventas;
  state.quote = createBlankQuote();
  fillFormFromQuote();
  renderAll();
  setView('ventas');
  showToast('Venta registrada y stock descontado.');
}

async function cancelSale(saleId){
  const result = await api.cancelSale(saleId);
  if(result.productos) state.products = result.productos.map(normalizeProduct);
  if(result.ventas) state.sales = result.ventas;
  renderAll();
  showToast('Venta cancelada. Stock devuelto.');
}

function buildQuoteMessage(){
  syncQuoteFromForm();
  const t = quoteTotals();
  const c = state.quote.cliente;
  const lines = state.quote.items.map(i => `• ${i.nombre} x${i.qty}: ${money(i.qty * i.unitPrice)}`).join('\n');
  const envioLabel = state.quote.envio.tipo === 'cod' ? 'Pagar al recibir' : state.quote.envio.tipo === 'normal' ? 'Envío normal' : 'Envío local';
  return `Hola ${c.nombre || ''} 😊\n\nLe comparto su cotización de SD COMAYAGUA:\n\nCódigo: ${state.quote.id}\n\n${lines}\n\nSubtotal: ${money(t.subtotal)}\nEnvío (${envioLabel}): ${money(t.envio)}\nComisión: ${money(t.comision)}\nTOTAL: ${money(t.total)}\n\n${CONFIG.BUSINESS_COPY.quoteDisclaimer}`;
}

function bindEvents(){
  $$('.nav-item,.bottom-item[data-view],[data-view-shortcut]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view || btn.dataset.viewShortcut)));
  $('[data-action="newQuote"]')?.addEventListener('click', () => { state.quote = createBlankQuote(); fillFormFromQuote(); renderQuote(); setView('cotizacion'); });
  $('#btnNewQuote').addEventListener('click', () => { state.quote = createBlankQuote(); fillFormFromQuote(); renderQuote(); setView('cotizacion'); });
  $('#btnRefresh').addEventListener('click', init);
  $('#searchInput').addEventListener('input', e => { state.search = e.target.value; renderProducts(); });
  $('#categoryFilter').addEventListener('change', e => { state.category = e.target.value; renderProducts(); });
  $('#layoutOne').addEventListener('click', () => { state.productLayout = 'one'; renderProducts(); });
  $('#layoutTwo').addEventListener('click', () => { state.productLayout = 'two'; renderProducts(); });
  ['customerName','customerPhone','customerDept','customerCity','customerAddress','shippingCompany','shippingCost'].forEach(id => $(`#${id}`).addEventListener('input', renderQuote));
  $$('[name="shippingType"]').forEach(r => r.addEventListener('change', () => {
    if(r.checked && r.value === 'normal') $('#shippingCost').value = CONFIG.SHIPPING.normal;
    if(r.checked && r.value === 'cod') $('#shippingCost').value = CONFIG.SHIPPING.codBase;
    if(r.checked && r.value === 'local') $('#shippingCost').value = CONFIG.SHIPPING.localDefault;
    renderQuote();
  }));
  $('#btnClearQuote').addEventListener('click', () => { state.quote = createBlankQuote(); fillFormFromQuote(); renderQuote(); showToast('Cotización limpiada.'); });
  $('#btnSaveQuote').addEventListener('click', () => saveQuote().catch(err => showToast(err.message)));
  $('#btnConvertSale').addEventListener('click', () => convertSale().catch(err => showToast(err.message)));
  $('#btnDownloadImage').addEventListener('click', () => downloadInvoiceImage($('#invoiceCapture'), state.quote.id).catch(err => showToast(err.message)));
  $('#btnDownloadPdf').addEventListener('click', () => downloadInvoicePdf($('#invoiceCapture'), state.quote.id).catch(err => showToast(err.message)));
  $('#btnWhatsApp').addEventListener('click', () => {
    const phone = state.quote.cliente.telefono?.replace(/\D/g,'');
    const target = phone?.length >= 8 ? `504${phone.slice(-8)}` : CONFIG.WHATSAPP_NUMBER;
    window.open(buildWhatsAppUrl(buildQuoteMessage(), target), '_blank', 'noopener');
  });
}

async function init(){
  try{
    $('#syncStatus').textContent = 'Sincronizando...';
    const data = await getInit();
    state.products = (data.productos || []).map(normalizeProduct);
    state.quotes = data.cotizaciones || [];
    state.sales = data.ventas || [];
    $('#syncStatus').textContent = data.demo ? 'Demo local' : 'Sheets conectado';
    renderAll();
  }catch(err){
    $('#syncStatus').textContent = 'Error de conexión';
    showToast(err.message || 'No se pudo cargar la información.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  fillFormFromQuote();
  init();
});
