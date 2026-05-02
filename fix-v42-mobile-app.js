/* ===== V42 Mobile App Seguro: evita pantalla pegada + mejoras celular/tablet ===== */
(function(){
  'use strict';

  var STARTUP_TIMEOUT = 7500;
  var ACTION_TIMEOUT = 28000;
  var loadingTimer = null;
  var previousShowLoading = typeof showLoading === 'function' ? showLoading : null;

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function safeToast(message){
    try { if (typeof showToast === 'function') showToast(message); }
    catch(e) { console.log(message); }
  }

  function hideLoadingNow(message){
    clearTimeout(loadingTimer);
    var overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('v42-loading-active');
    if (message) safeToast(message);
  }

  function ensureLoadingOverlay(label){
    var overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay hidden';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('v42-loading-overlay');
    overlay.innerHTML = '' +
      '<div class="loading-panel glass-panel v42-loading-panel">' +
        '<div class="v42-loader-ring" aria-hidden="true"></div>' +
        '<p id="loading-text">' + escapeForHtml(label || 'Cargando...') + '</p>' +
        '<small class="v42-loading-help">Si la conexión tarda, la app se desbloquea sola.</small>' +
        '<button type="button" class="v42-loading-skip">Seguir sin esperar</button>' +
      '</div>';
    var skip = overlay.querySelector('.v42-loading-skip');
    if (skip) skip.addEventListener('click', function(){
      hideLoadingNow('Pantalla desbloqueada. Puedes seguir trabajando.');
    });
    return overlay;
  }

  function escapeForHtml(value){
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch];
    });
  }

  showLoading = function v42ShowLoading(show, label){
    clearTimeout(loadingTimer);
    var textLabel = label || 'Cargando...';
    if (!show) {
      if (previousShowLoading) {
        try { previousShowLoading(false); } catch(e) {}
      }
      hideLoadingNow();
      return;
    }

    var overlay = ensureLoadingOverlay(textLabel);
    var text = document.getElementById('loading-text');
    if (text) text.textContent = textLabel;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('v42-loading-active');

    var limit = /guardando|eliminando|importando|actualizando venta|subiendo|reduciendo|aumentando/i.test(textLabel)
      ? ACTION_TIMEOUT
      : STARTUP_TIMEOUT;

    loadingTimer = setTimeout(function(){
      hideLoadingNow('La carga tardó demasiado. La pantalla quedó libre para seguir usando la app.');
      showSafeNotice('La conexión con la base tardó más de lo normal. Puedes trabajar con la copia local y tocar Actualizar cuando quieras.');
    }, limit);
  };
  window.showLoading = showLoading;

  function fetchJsonWithTimeout(url, timeoutMs){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, timeoutMs || 9000);
    return fetch(url, { cache: 'no-store', signal: controller.signal }).then(function(response){
      clearTimeout(timer);
      if (!response.ok) throw new Error('La base de datos no respondió correctamente.');
      return response.text().then(function(text){
        var cleaned = String(text || '').trim();
        if (!cleaned) return { products: [], history: [] };
        try { return JSON.parse(cleaned); }
        catch(parseError){
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
    if (!Array.isArray(items)) return [];
    return items.map(function(item){
      item = item || {};
      var qty = Number(item.qty != null ? item.qty : (item.stock != null ? item.stock : (item.cantidad != null ? item.cantidad : 0)));
      var price = Number(item.price != null ? item.price : (item.precio != null ? item.precio : 0));
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

  function readCache(){
    try { return typeof getCachedInventoryResponse === 'function' ? getCachedInventoryResponse() : null; }
    catch(e) { return null; }
  }

  function applyInventoryPayload(data, fromCache){
    data = data || {};
    var products = Array.isArray(data) ? data : normalizeProductsList(data.products);
    try { PRODUCTS = enrichProducts(products); }
    catch(e) { PRODUCTS = products; }
    FILTERED = PRODUCTS.slice();
    LAST_SYNC_AT = new Date();
    try { resolvePendingProductMeta(); } catch(e) {}
    try { loadCategories(); } catch(e) {}
    try { updateDashboard(); } catch(e) {}
    try { renderServerHistory((data && data.history) || []); } catch(e) {}
    try { applyFilters(); } catch(e) { try { renderProducts(); } catch(_) {} }
    try { updateNetworkStatus(); } catch(e) {}
    try { updateSyncMeta(); } catch(e) {}
    updateV42Stats();
    if (fromCache) showSafeNotice('Modo seguro activo: se mostró la última copia guardada mientras se reconecta la base.');
    else hideSafeNotice();
  }

  loadProducts = async function v42LoadProducts(showRefreshFeedback){
    var cached = readCache();
    var hasCache = !!(cached && Array.isArray(cached.products) && cached.products.length);

    if (hasCache && !showRefreshFeedback) {
      applyInventoryPayload(cached, true);
    } else {
      showLoading(true, showRefreshFeedback ? 'Actualizando inventario...' : 'Cargando inventario...');
    }

    try {
      var data = await fetchJsonWithTimeout(API_URL + '?action=get&v42=' + Date.now(), 9000);
      if (!data || !Array.isArray(data.products)) data = { products: [], history: [] };

      if (hasCache && !data.products.length && data.offline) {
        throw new Error('Respuesta sin conexión');
      }

      try { cacheInventoryResponse(data); } catch(e) {}
      applyInventoryPayload(data, false);
      if (showRefreshFeedback) safeToast('Inventario actualizado correctamente.');
    } catch(error) {
      console.error('V42 loadProducts:', error);
      cached = readCache();
      if (cached && Array.isArray(cached.products) && cached.products.length) {
        applyInventoryPayload(cached, true);
      } else {
        PRODUCTS = [];
        FILTERED = [];
        try { updateDashboard(); } catch(e) {}
        try { renderProducts(); } catch(e) {}
        try { renderServerHistory([]); } catch(e) {}
        showSafeNotice('No se pudo conectar con Apps Script. La página quedó activa; revisa internet, permisos o la URL de la base.');
      }
    } finally {
      showLoading(false);
      updateV42Stats();
    }
  };
  window.loadProducts = loadProducts;

  function showSafeNotice(message){
    var holder = document.getElementById('v42-safe-status');
    if (!holder) return;
    holder.hidden = false;
    var text = holder.querySelector('.v42-safe-text');
    if (text) text.textContent = message;
  }

  function hideSafeNotice(){
    var holder = document.getElementById('v42-safe-status');
    if (holder) holder.hidden = true;
  }

  function installControlCenter(){
    if (!document.body.classList.contains('app-page')) return;
    if (document.getElementById('v42-control-center')) return;
    var hero = document.querySelector('.hero-banner');
    if (!hero || !hero.parentNode) return;

    var section = document.createElement('section');
    section.id = 'v42-control-center';
    section.className = 'v42-control-center glass-panel';
    section.innerHTML = '' +
      '<div class="v42-control-head">' +
        '<div><p class="eyebrow">Inicio rápido</p><h3>Panel de control móvil</h3><small>Todo lo importante en botones grandes para celular y tablet.</small></div>' +
        '<button type="button" class="v42-refresh-mini" onclick="loadProducts(true)">Actualizar</button>' +
      '</div>' +
      '<div class="v42-control-grid">' +
        '<button type="button" class="v42-tile v42-tile-primary" onclick="openSaleModal()"><span>🧾</span><strong>Nueva venta</strong><small>Crear factura</small></button>' +
        '<button type="button" class="v42-tile" onclick="scrollToSection(\'productos\')"><span>▦</span><strong>Productos</strong><small id="v42-products-count">0 activos</small></button>' +
        '<button type="button" class="v42-tile" onclick="scrollToSection(\'comprobantes\')"><span>◫</span><strong>Facturas</strong><small id="v42-receipts-count">0 recientes</small></button>' +
        '<button type="button" class="v42-tile" onclick="invOpenModal(false)"><span>＋</span><strong>Admin</strong><small>Agregar producto</small></button>' +
        '<button type="button" class="v42-tile" onclick="toggleFiltersPanel()"><span>⌕</span><strong>Filtros</strong><small>Buscar rápido</small></button>' +
        '<button type="button" class="v42-tile" onclick="toggleSummaryPanel()"><span>▥</span><strong>Resumen</strong><small>Ver datos</small></button>' +
      '</div>';

    hero.insertAdjacentElement('afterend', section);

    var notice = document.createElement('div');
    notice.id = 'v42-safe-status';
    notice.className = 'v42-safe-status glass-panel';
    notice.hidden = true;
    notice.innerHTML = '<span>⚠</span><p class="v42-safe-text">Modo seguro activo.</p><button type="button" onclick="loadProducts(true)">Reintentar</button>';
    section.insertAdjacentElement('afterend', notice);
  }

  function installBottomDock(){
    if (!document.body.classList.contains('app-page')) return;
    var dock = document.querySelector('.bottom-dock');
    if (!dock) return;
    dock.innerHTML = '' +
      '<button type="button" onclick="scrollToSection(\'productos\')"><span>⌂</span><small>Inicio</small></button>' +
      '<button type="button" class="dock-primary" onclick="openSaleModal()"><span>🧾</span><small>Vender</small></button>' +
      '<button type="button" onclick="scrollToSection(\'comprobantes\')"><span>◫</span><small>Facturas</small></button>' +
      '<button type="button" onclick="invOpenModal(false)"><span>＋</span><small>Admin</small></button>' +
      '<button type="button" onclick="toggleSummaryPanel()"><span>▥</span><small>Resumen</small></button>';
  }

  function installReceiptActions(){
    var actions = document.querySelector('.receipt-actions');
    if (!actions || actions.dataset.v42Ready) return;
    actions.dataset.v42Ready = '1';
    var capture = document.createElement('button');
    capture.className = 'btn-primary v42-capture-btn';
    capture.type = 'button';
    capture.textContent = 'Captura limpia';
    capture.onclick = function(){
      if (typeof openCurrentReceiptInTab === 'function') openCurrentReceiptInTab();
      safeToast('Se abrió una vista limpia para captura o impresión.');
    };
    var copy = document.createElement('button');
    copy.className = 'btn-secondary v42-copy-btn';
    copy.type = 'button';
    copy.textContent = 'Copiar WhatsApp';
    copy.onclick = copyCurrentReceiptWhatsApp;
    actions.insertBefore(capture, actions.firstChild);
    actions.insertBefore(copy, actions.children[1] || null);
  }

  function receiptToText(receipt){
    if (!receipt) return '';
    var lines = [];
    lines.push('🧾 *SD COMAYAGUA*');
    lines.push('Comprobante #' + (receipt.number || ''));
    lines.push('Cliente: ' + (receipt.customer || 'Cliente general'));
    lines.push('Pago: ' + (receipt.payment || 'Efectivo'));
    lines.push('');
    lines.push('*Productos:*');
    (receipt.items || []).forEach(function(item){
      if (item.type === 'shipping') return;
      lines.push('• ' + item.name + ' x' + item.qty + ' — ' + formatMoney(Number(item.total || 0)));
    });
    var shipping = Number(receipt.shipping && receipt.shipping.total || 0);
    if (shipping > 0) lines.push('Envío: ' + formatMoney(shipping));
    var discount = Number(receipt.discount || 0);
    if (discount > 0) lines.push('Descuento: ' + formatMoney(discount));
    lines.push('');
    lines.push('*Total a pagar: ' + formatMoney(Number(receipt.total || 0)) + '*');
    if (receipt.note) lines.push('Nota: ' + receipt.note);
    return lines.join('\n');
  }

  function copyCurrentReceiptWhatsApp(){
    try {
      if (!ACTIVE_RECEIPT_ID || typeof findReceipt !== 'function') return safeToast('Primero abre un comprobante.');
      var text = receiptToText(findReceipt(ACTIVE_RECEIPT_ID));
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function(){ safeToast('Resumen copiado para WhatsApp.'); });
      } else {
        var area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        safeToast('Resumen copiado para WhatsApp.');
      }
    } catch(error) {
      console.error(error);
      safeToast('No se pudo copiar el resumen.');
    }
  }
  window.copyCurrentReceiptWhatsApp = copyCurrentReceiptWhatsApp;

  function improvePaymentOptions(){
    var select = document.getElementById('sale-payment');
    if (!select || select.dataset.v42Ready) return;
    select.dataset.v42Ready = '1';
    var existing = Array.prototype.map.call(select.options, function(opt){ return opt.value.toLowerCase(); });
    [
      ['Depósito / Transferencia', 'Depósito / Transferencia'],
      ['Pagar al Recibir', 'Pagar al Recibir'],
      ['Tigo Money', 'Tigo Money']
    ].forEach(function(pair){
      if (existing.indexOf(pair[0].toLowerCase()) === -1) {
        var opt = document.createElement('option');
        opt.value = pair[0];
        opt.textContent = pair[1];
        select.appendChild(opt);
      }
    });
  }

  function installFloatingSaleButton(){
    if (!document.body.classList.contains('app-page')) return;
    if (document.getElementById('v42-sale-fab')) return;
    var btn = document.createElement('button');
    btn.id = 'v42-sale-fab';
    btn.className = 'v42-sale-fab';
    btn.type = 'button';
    btn.innerHTML = '<span>＋</span> Venta';
    btn.onclick = function(){ if (typeof openSaleModal === 'function') openSaleModal(); };
    document.body.appendChild(btn);
  }

  function updateV42Stats(){
    var p = document.getElementById('v42-products-count');
    if (p) p.textContent = (Array.isArray(PRODUCTS) ? PRODUCTS.length : 0) + ' activos';
    var r = document.getElementById('v42-receipts-count');
    if (r) {
      var count = 0;
      try { count = (getReceipts() || []).length; } catch(e) {}
      r.textContent = count + ' recientes';
    }
  }

  function applyV42Ui(){
    document.body.classList.add('v42-mobile-app');
    installControlCenter();
    installBottomDock();
    installReceiptActions();
    improvePaymentOptions();
    installFloatingSaleButton();
    updateV42Stats();

    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.textContent = 'Caja móvil privada';
    var heroCopy = document.querySelector('.hero-copy');
    if (heroCopy) heroCopy.textContent = 'Sistema rápido para facturar, editar ventas, revisar productos y mandar comprobantes desde el celular.';
  }

  window.addEventListener('error', function(event){
    console.error('V42 error capturado:', event.error || event.message);
    hideLoadingNow('Se evitó que la pantalla quedara pegada.');
    showSafeNotice('Se detectó un error, pero la app fue desbloqueada para que puedas continuar.');
  });

  window.addEventListener('unhandledrejection', function(event){
    console.error('V42 promesa capturada:', event.reason);
    hideLoadingNow('La operación falló, pero la pantalla quedó activa.');
  });

  document.addEventListener('click', function(event){
    if (event.target && event.target.closest('.receipt-actions')) setTimeout(updateV42Stats, 200);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyV42Ui, { once: true });
  } else {
    applyV42Ui();
  }
  setTimeout(applyV42Ui, 350);
  setTimeout(applyV42Ui, 1400);
  setTimeout(function(){ hideLoadingNow(); }, 12000);
})();
