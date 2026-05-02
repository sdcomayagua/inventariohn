/* SDCOMAYAGUA · V41 Estable Profesional
   Correcciones de estabilidad, carga segura y caja móvil. */

function getProducts() {
  return (Array.isArray(PRODUCTS) ? PRODUCTS : []).map(function(product){
    var qty = Number(product.qty ?? product.stock ?? 0);
    return Object.assign({}, product, { qty: qty, stock: qty });
  });
}
window.getProducts = getProducts;

function getSaleProfit(shipping, discount) {
  var cart = Array.isArray(SALE_CART) ? SALE_CART : [];
  var productsProfit = cart.reduce(function(sum, line){
    return sum + Number(line.profit || (Number(line.qty || 0) * (Number(line.price || 0) - Number(line.cost || 0))));
  }, 0);
  var shippingProfit = Number(shipping && shipping.profit || 0);
  return Math.max(0, productsProfit + shippingProfit - Number(discount || 0));
}
window.getSaleProfit = getSaleProfit;

(function(){
  'use strict';

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  var originalShowLoading = typeof showLoading === 'function' ? showLoading : null;
  var loadingTimer = null;
  showLoading = function stableShowLoading(show, label){
    if (originalShowLoading) originalShowLoading(Boolean(show), label || 'Cargando...');
    clearTimeout(loadingTimer);
    if (show) {
      loadingTimer = setTimeout(function(){
        try {
          if (originalShowLoading) originalShowLoading(false);
          if (typeof showToast === 'function') showToast('La carga tardó demasiado. La pantalla quedó desbloqueada para seguir trabajando.');
        } catch(e) {}
      }, 28000);
    }
  };
  window.showLoading = showLoading;

  function safeToast(message){
    try { if (typeof showToast === 'function') showToast(message); }
    catch(e) { console.log(message); }
  }

  function safeSetText(id, value){
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function fetchJsonWithTimeout(url, timeoutMs){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, timeoutMs || 22000);
    return fetch(url, { cache: 'no-store', signal: controller.signal }).then(function(response){
      clearTimeout(timer);
      if (!response.ok) throw new Error('No se pudo consultar el inventario. Código ' + response.status);
      return response.text().then(function(text){
        try { return JSON.parse(text); }
        catch (parseError) {
          var cleaned = String(text || '').trim();
          var start = cleaned.indexOf('{');
          var end = cleaned.lastIndexOf('}');
          if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
          throw parseError;
        }
      });
    }).catch(function(error){
      clearTimeout(timer);
      throw error;
    });
  }

  function normalizeProductsList(items){
    return (Array.isArray(items) ? items : []).map(function(item){
      var qty = Number(item.qty ?? item.stock ?? item.cantidad ?? item.existencias ?? 0);
      var price = Number(item.price ?? item.precio ?? 0);
      var id = item.id || item.ID || item.codigo || item.sku || ('P-' + Math.random().toString(36).slice(2, 8));
      return Object.assign({}, item, {
        id: id,
        name: item.name || item.nombre || 'Producto sin nombre',
        category: item.category || item.categoria || 'Sin categoría',
        price: Number.isFinite(price) ? price : 0,
        qty: Number.isFinite(qty) ? qty : 0,
        images: item.images || item.imagenes || item.galeria || item.image || item.imagen || '[]'
      });
    });
  }

  function finishInventoryRender(data, fromCache){
    var products = normalizeProductsList(data && data.products);
    PRODUCTS = enrichProducts(products);
    FILTERED = PRODUCTS.slice();
    LAST_SYNC_AT = new Date();
    try { resolvePendingProductMeta(); } catch(e) { console.warn(e); }
    try { loadCategories(); } catch(e) { console.warn(e); }
    try { updateDashboard(); } catch(e) { console.warn(e); }
    try { renderServerHistory((data && data.history) || []); } catch(e) { console.warn(e); }
    try { applyFilters(); } catch(e) { renderProducts(); }
    try { updateNetworkStatus(); } catch(e) {}
    try { updateSyncMeta(); } catch(e) {}
    if (fromCache) safeToast('Se cargó la última copia local. Revisa tu conexión o Apps Script.');
  }

  var originalLoadProducts = typeof loadProducts === 'function' ? loadProducts : null;
  loadProducts = async function stableLoadProducts(showRefreshFeedback){
    if (showRefreshFeedback) showLoading(true, 'Actualizando inventario...');
    else showLoading(true, 'Cargando inventario...');
    try {
      var data = await fetchJsonWithTimeout(API_URL + '?action=get&v=' + Date.now(), 22000);
      if (!data || !Array.isArray(data.products)) data = { products: [], history: [] };
      cacheInventoryResponse(data);
      finishInventoryRender(data, false);
      if (showRefreshFeedback) safeToast('Inventario actualizado.');
    } catch (error) {
      console.error(error);
      var cached = null;
      try { cached = getCachedInventoryResponse(); } catch(e) { cached = null; }
      if (cached && Array.isArray(cached.products) && cached.products.length) {
        finishInventoryRender(cached, true);
      } else {
        PRODUCTS = [];
        FILTERED = [];
        try { updateDashboard(); } catch(e) {}
        try { renderProducts(); } catch(e) {}
        try { renderServerHistory([]); } catch(e) {}
        safeToast(error && error.name === 'AbortError'
          ? 'La conexión tardó demasiado. No se bloqueó la página.'
          : 'No se pudieron cargar los productos.');
      }
    } finally {
      showLoading(false);
    }
  };
  window.loadProducts = loadProducts;

  function getOriginalSaleQty(productId){
    if (!SALE_EDITING_ID || typeof getSaleById !== 'function') return 0;
    var sale = getSaleById(SALE_EDITING_ID);
    return (sale && Array.isArray(sale.items) ? sale.items : [])
      .filter(function(item){ return item.type !== 'shipping' && String(item.id) === String(productId); })
      .reduce(function(sum, item){ return sum + Number(item.qty || 0); }, 0);
  }

  function maxQtyForLine(product, index){
    if (!product) return 0;
    var productId = product.id;
    var otherQty = (Array.isArray(SALE_CART) ? SALE_CART : []).reduce(function(sum, item, itemIndex){
      if (itemIndex === index) return sum;
      if (String(item.id) !== String(productId)) return sum;
      return sum + Number(item.qty || 0);
    }, 0);
    return Math.max(0, Number(product.qty || 0) + getOriginalSaleQty(productId) - otherQty);
  }

  changeSaleLineQty = function stableChangeSaleLineQty(index, delta){
    var line = SALE_CART[index];
    if (!line) return;
    var product = getProductById(line.id);
    var nextQty = Math.max(1, Number(line.qty || 1) + Number(delta || 0));
    var maxQty = maxQtyForLine(product, index);
    if (nextQty > maxQty) {
      safeToast('No hay más stock disponible para ese artículo.');
      return;
    }
    line.qty = nextQty;
    line.total = nextQty * Number(line.price || 0);
    line.profit = nextQty * (Number(line.price || 0) - Number(line.cost || 0));
    renderSaleCart();
    updateSaleSummary();
  };
  window.changeSaleLineQty = changeSaleLineQty;

  function setSaleLineQuantityValue(index, value){
    var line = SALE_CART[index];
    if (!line) return;
    var product = getProductById(line.id);
    var nextQty = Math.max(1, Math.floor(Number(value || 1)));
    var maxQty = maxQtyForLine(product, index);
    if (nextQty > maxQty) {
      nextQty = Math.max(1, maxQty);
      safeToast('Cantidad ajustada al stock disponible.');
    }
    line.qty = nextQty;
    line.total = nextQty * Number(line.price || 0);
    line.profit = nextQty * (Number(line.price || 0) - Number(line.cost || 0));
    renderSaleCart();
    updateSaleSummary();
  }
  window.setSaleLineQuantityValue = setSaleLineQuantityValue;

  function setSaleLinePriceValue(index, value){
    var line = SALE_CART[index];
    if (!line) return;
    var nextPrice = Number(value || 0);
    if (!Number.isFinite(nextPrice) || nextPrice < 0) nextPrice = 0;
    line.price = nextPrice;
    line.total = Number(line.qty || 0) * nextPrice;
    line.profit = Number(line.qty || 0) * (nextPrice - Number(line.cost || 0));
    renderSaleCart();
    updateSaleSummary();
  }
  window.setSaleLinePriceValue = setSaleLinePriceValue;

  addSaleLine = function stableAddSaleLine(){
    var select = document.getElementById('sale-product-select');
    var product = getProductById(select && select.value);
    var qtyInput = document.getElementById('sale-qty');
    var priceInput = document.getElementById('sale-price');
    var qty = Number(qtyInput && qtyInput.value || 0);
    var price = Number(priceInput && priceInput.value || 0);
    if (!product || qty <= 0 || price < 0) {
      alert('Selecciona un producto y una cantidad válida.');
      return;
    }
    var currentQty = SALE_CART.filter(function(item){ return String(item.id) === String(product.id); })
      .reduce(function(sum, item){ return sum + Number(item.qty || 0); }, 0);
    var available = Math.max(0, Number(product.qty || 0) + getOriginalSaleQty(product.id));
    if (qty + currentQty > available) {
      alert('No hay suficiente stock para esa cantidad.');
      return;
    }
    var existing = SALE_CART.find(function(item){
      return String(item.id) === String(product.id) && Number(item.price || 0) === Number(price || 0);
    });
    if (existing) {
      existing.qty = Number(existing.qty || 0) + qty;
      existing.total = existing.qty * Number(existing.price || 0);
      existing.profit = existing.qty * (Number(existing.price || 0) - Number(existing.cost || 0));
    } else {
      SALE_CART.push({
        id: product.id,
        name: product.name,
        sku: product.sku,
        qty: qty,
        price: price,
        cost: Number(product.cost || 0),
        total: qty * price,
        profit: qty * (price - Number(product.cost || 0))
      });
    }
    renderSaleCart();
    updateSaleSummary();
    if (qtyInput) qtyInput.value = '1';
    if (typeof syncSaleFormFromSelectedProduct === 'function') syncSaleFormFromSelectedProduct();
  };
  window.addSaleLine = addSaleLine;

  function unlockAnyClosedModal(event){
    var modal = event.target && event.target.closest ? event.target.closest('.modal') : null;
    if (!modal || event.target !== modal) return;
    try { unlockUiScroll(); } catch(e) { document.body.classList.remove('modal-open','sale-modal-open'); }
  }

  function applyV41Polish(){
    document.body.classList.add('v41-estable');
    safeSetText('sidebar-sync-note', 'Sistema estable · listo');
    var heroTitle = $('.hero-title');
    if (heroTitle) heroTitle.textContent = 'Caja privada SDC';
    var heroCopy = $('.hero-copy');
    if (heroCopy) heroCopy.textContent = 'Productos, ventas, envíos y facturas en una sola pantalla móvil, sin bloquearse cuando la conexión falla.';
    var title = $('#sale-modal-title');
    if (title && /caja/i.test(title.textContent)) title.textContent = 'Factura / Caja móvil';
    var loginBadge = $('.login-badge');
    if (loginBadge) loginBadge.textContent = 'ACCESO PRIVADO';
  }

  window.addEventListener('error', function(event){
    console.error('V41 error capturado:', event.error || event.message);
    showLoading(false);
    safeToast('Se evitó un bloqueo de pantalla. Puedes seguir trabajando.');
  });

  window.addEventListener('unhandledrejection', function(event){
    console.error('V41 promesa capturada:', event.reason);
    showLoading(false);
    safeToast('La operación falló, pero la página quedó activa.');
  });

  document.addEventListener('click', unlockAnyClosedModal, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyV41Polish, { once: true });
  } else {
    applyV41Polish();
  }
  setTimeout(applyV41Polish, 400);
  setTimeout(applyV41Polish, 1600);
})();
