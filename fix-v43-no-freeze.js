/* SDCOMAYAGUA · V43 Sin Congelamiento
   Unifica la carga segura y elimina los efectos que podían dejar Chrome en "La página no responde". */
(function(){
  'use strict';

  var STARTUP_TIMEOUT = 8000;
  var ACTION_TIMEOUT = 18000;
  var loadingTimer = null;
  var previousShowLoading = typeof window.showLoading === 'function' ? window.showLoading : null;

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function html(value){
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch];
    });
  }
  function toast(message){
    try { if (typeof window.showToast === 'function') window.showToast(message); else console.log(message); }
    catch(e){ console.log(message); }
  }
  function setTextIfDifferent(el, value){
    if (el && el.textContent !== value) el.textContent = value;
  }

  function hideLoading(message){
    clearTimeout(loadingTimer);
    var overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    document.body.classList.remove('sdc-loading-active');
    if (message) toast(message);
  }

  function ensureOverlay(label){
    var overlay = document.getElementById('loading-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loading-overlay';
      overlay.className = 'loading-overlay hidden';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('v43-loading-overlay');
    overlay.innerHTML = '' +
      '<div class="loading-panel glass-panel v43-loading-panel">' +
        '<div class="v43-spinner" aria-hidden="true"></div>' +
        '<p id="loading-text">' + html(label || 'Cargando...') + '</p>' +
        '<small>Si la conexión tarda, la app se libera sola.</small>' +
        '<button type="button" class="btn-secondary v43-unlock-btn">Seguir sin esperar</button>' +
      '</div>';
    var btn = overlay.querySelector('.v43-unlock-btn');
    if (btn) btn.addEventListener('click', function(){ hideLoading('Pantalla desbloqueada. Puedes seguir trabajando.'); }, { once:true });
    return overlay;
  }

  window.showLoading = function(show, label){
    clearTimeout(loadingTimer);
    if (!show) {
      try { if (previousShowLoading) previousShowLoading(false, label || ''); } catch(e) {}
      hideLoading();
      return;
    }
    var text = label || 'Cargando inventario...';
    var overlay = ensureOverlay(text);
    var textNode = document.getElementById('loading-text');
    if (textNode) textNode.textContent = text;
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sdc-loading-active');

    var limit = /guardando|eliminando|importando|actualizando venta|subiendo|reduciendo|aumentando/i.test(text) ? ACTION_TIMEOUT : STARTUP_TIMEOUT;
    loadingTimer = setTimeout(function(){
      hideLoading('La página se desbloqueó automáticamente.');
      showStatus('La conexión tardó más de lo normal. Puedes seguir usando la copia local y tocar Actualizar después.', 'warning');
    }, limit);
  };

  function fetchJson(url, timeoutMs){
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, timeoutMs || STARTUP_TIMEOUT);
    return fetch(url, { cache:'no-store', signal:controller.signal }).then(function(response){
      clearTimeout(timer);
      if (!response.ok) throw new Error('Servidor no respondió correctamente.');
      return response.text().then(function(text){
        var cleaned = String(text || '').trim();
        if (!cleaned) return { products:[], history:[] };
        try { return JSON.parse(cleaned); }
        catch(err){
          var start = cleaned.indexOf('{');
          var end = cleaned.lastIndexOf('}');
          if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
          throw err;
        }
      });
    }).catch(function(error){ clearTimeout(timer); throw error; });
  }

  function normalizeProducts(items){
    return (Array.isArray(items) ? items : []).map(function(item){
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
    try { return typeof window.getCachedInventoryResponse === 'function' ? window.getCachedInventoryResponse() : null; }
    catch(e){ return null; }
  }

  function applyInventory(data, fromCache){
    data = data || {};
    var products = normalizeProducts(Array.isArray(data) ? data : data.products);
    try { PRODUCTS = typeof enrichProducts === 'function' ? enrichProducts(products) : products; }
    catch(e){ PRODUCTS = products; }
    FILTERED = PRODUCTS.slice();
    LAST_SYNC_AT = new Date();
    try { resolvePendingProductMeta(); } catch(e) {}
    try { loadCategories(); } catch(e) {}
    try { updateDashboard(); } catch(e) {}
    try { renderServerHistory((data && data.history) || []); } catch(e) {}
    try { applyFilters(); } catch(e) { try { renderProducts(); } catch(_) {} }
    try { updateNetworkStatus(); } catch(e) {}
    try { updateSyncMeta(); } catch(e) {}
    updateV43Stats();
    if (fromCache) showStatus('Modo seguro: se mostró la última copia guardada mientras se reconecta la base.', 'warning');
    else showStatus('Inventario listo. Sistema estable.', 'ok', true);
  }

  window.loadProducts = async function(showRefreshFeedback){
    var cached = readCache();
    var hasCache = !!(cached && Array.isArray(cached.products) && cached.products.length);
    if (hasCache && !showRefreshFeedback) {
      applyInventory(cached, true);
    } else {
      window.showLoading(true, showRefreshFeedback ? 'Actualizando inventario...' : 'Cargando inventario...');
    }
    try {
      var data = await fetchJson(API_URL + '?action=get&v43=' + Date.now(), STARTUP_TIMEOUT);
      if (!data || !Array.isArray(data.products)) data = { products:[], history:[] };
      try { cacheInventoryResponse(data); } catch(e) {}
      applyInventory(data, false);
      if (showRefreshFeedback) toast('Inventario actualizado correctamente.');
    } catch(error) {
      console.error('V43 loadProducts:', error);
      cached = readCache();
      if (cached && Array.isArray(cached.products) && cached.products.length) {
        applyInventory(cached, true);
      } else {
        PRODUCTS = [];
        FILTERED = [];
        try { updateDashboard(); } catch(e) {}
        try { renderProducts(); } catch(e) {}
        try { renderServerHistory([]); } catch(e) {}
        showStatus('No se pudo conectar con Apps Script. La página quedó activa; revisa internet, permisos o la URL de la base.', 'warning');
      }
    } finally {
      window.showLoading(false);
      updateV43Stats();
    }
  };

  function showStatus(message, type, autoHide){
    var holder = document.getElementById('v43-safe-status');
    if (!holder) return;
    holder.hidden = false;
    holder.classList.toggle('is-ok', type === 'ok');
    holder.classList.toggle('is-warning', type !== 'ok');
    var txt = holder.querySelector('.v43-safe-text');
    if (txt) txt.textContent = message;
    if (autoHide) {
      clearTimeout(showStatus.timer);
      showStatus.timer = setTimeout(function(){ holder.hidden = true; }, 3500);
    }
  }

  function installControlCenter(){
    if (!document.body.classList.contains('app-page')) return;
    if (document.getElementById('v43-control-center')) return;
    var anchor = document.querySelector('.hero-banner') || document.querySelector('.top-quickbar');
    if (!anchor || !anchor.parentNode) return;
    var section = document.createElement('section');
    section.id = 'v43-control-center';
    section.className = 'v43-control-center glass-panel';
    section.innerHTML = '' +
      '<div class="v43-control-head">' +
        '<div><p class="eyebrow">Inicio rápido</p><h3>Panel móvil privado</h3><small>Botones grandes para vender, facturar y administrar desde celular o tablet.</small></div>' +
        '<button type="button" class="v43-refresh" onclick="loadProducts(true)">Actualizar</button>' +
      '</div>' +
      '<div class="v43-control-grid">' +
        '<button type="button" class="v43-tile primary" onclick="openSaleModal()"><span>🧾</span><strong>Nueva venta</strong><small>Crear factura</small></button>' +
        '<button type="button" class="v43-tile" onclick="scrollToSection(\'productos\')"><span>▦</span><strong>Productos</strong><small id="v43-products-count">0 activos</small></button>' +
        '<button type="button" class="v43-tile" onclick="scrollToSection(\'comprobantes\')"><span>◫</span><strong>Facturas</strong><small id="v43-receipts-count">0 recientes</small></button>' +
        '<button type="button" class="v43-tile" onclick="invOpenModal(false)"><span>＋</span><strong>Admin</strong><small>Agregar producto</small></button>' +
      '</div>';
    anchor.insertAdjacentElement('afterend', section);
    var notice = document.createElement('div');
    notice.id = 'v43-safe-status';
    notice.className = 'v43-safe-status glass-panel';
    notice.hidden = true;
    notice.innerHTML = '<span>●</span><p class="v43-safe-text">Sistema estable.</p><button type="button" onclick="loadProducts(true)">Reintentar</button>';
    section.insertAdjacentElement('afterend', notice);
  }

  function installDock(){
    if (!document.body.classList.contains('app-page')) return;
    var dock = document.querySelector('.mobile-company-dock') || document.querySelector('.bottom-dock');
    if (!dock || dock.dataset.v43Ready) return;
    dock.dataset.v43Ready = '1';
    dock.classList.add('v43-dock');
    dock.innerHTML = '' +
      '<button type="button" onclick="scrollToSection(\'productos\')"><span>⌂</span><small>Inicio</small></button>' +
      '<button type="button" class="accent" onclick="openSaleModal()"><span>🧾</span><small>Vender</small></button>' +
      '<button type="button" onclick="scrollToSection(\'comprobantes\')"><span>◫</span><small>Facturas</small></button>' +
      '<button type="button" onclick="invOpenModal(false)"><span>＋</span><small>Admin</small></button>' +
      '<button type="button" onclick="toggleSummaryPanel()"><span>▥</span><small>Resumen</small></button>';
  }

  function installReceiptActions(){
    var actions = document.querySelector('.receipt-actions');
    if (!actions || actions.dataset.v43Ready) return;
    actions.dataset.v43Ready = '1';
    var clean = document.createElement('button');
    clean.type = 'button';
    clean.className = 'btn-primary v43-clean-capture';
    clean.textContent = 'Captura limpia';
    clean.onclick = function(){ if (typeof openCurrentReceiptInTab === 'function') openCurrentReceiptInTab(); };
    var copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'btn-secondary v43-copy-wa';
    copy.textContent = 'Copiar WhatsApp';
    copy.onclick = copyReceiptText;
    actions.insertBefore(clean, actions.firstChild);
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

  function copyReceiptText(){
    try {
      if (!ACTIVE_RECEIPT_ID || typeof findReceipt !== 'function') return toast('Primero abre un comprobante.');
      var text = receiptToText(findReceipt(ACTIVE_RECEIPT_ID));
      if (!text) return toast('No hay comprobante para copiar.');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function(){ toast('Resumen copiado para WhatsApp.'); });
      } else {
        var area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        toast('Resumen copiado para WhatsApp.');
      }
    } catch(e){ console.error(e); toast('No se pudo copiar el resumen.'); }
  }

  function improvePaymentOptions(){
    var select = document.getElementById('sale-payment');
    if (!select || select.dataset.v43Ready) return;
    select.dataset.v43Ready = '1';
    ['Depósito / Transferencia', 'Pagar al Recibir', 'Tigo Money'].forEach(function(label){
      var exists = Array.prototype.some.call(select.options, function(opt){ return String(opt.value).toLowerCase() === label.toLowerCase(); });
      if (!exists) {
        var option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        select.appendChild(option);
      }
    });
  }

  function updateV43Stats(){
    var total = Array.isArray(PRODUCTS) ? PRODUCTS.length : 0;
    var p = document.getElementById('v43-products-count');
    if (p) p.textContent = total + ' activos';
    var r = document.getElementById('v43-receipts-count');
    if (r) {
      var count = 0;
      try { count = (getReceipts() || []).length; } catch(e) {}
      r.textContent = count + ' recientes';
    }
  }
  window.updateV43Stats = updateV43Stats;

  function applyTexts(){
    document.body.classList.add('v43-safe-app','v42-mobile-app','v41-estable');
    setTextIfDifferent($('.hero-title'), 'Caja móvil privada');
    setTextIfDifferent($('.hero-copy'), 'Sistema rápido para vender, editar facturas y enviar comprobantes desde celular o tablet, sin quedarse pegado al cargar.');
    setTextIfDifferent($('.catalog-section .section-title'), 'Productos');
    var search = document.getElementById('inv-search');
    if (search) {
      search.placeholder = 'Buscar producto o código';
      search.setAttribute('autocomplete','off');
      search.setAttribute('inputmode','search');
    }
    var title = document.getElementById('sale-modal-title');
    if (title) setTextIfDifferent(title, 'Factura / Caja móvil');
  }

  function cleanOldCaches(){
    if ('caches' in window) {
      caches.keys().then(function(keys){
        keys.forEach(function(key){
          if (/sdcomayagua-inventario-v(3|4[0-2])/.test(key)) caches.delete(key).catch(function(){});
        });
      }).catch(function(){});
    }
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(regs){
        regs.forEach(function(reg){ if (reg && reg.update) reg.update().catch(function(){}); });
      }).catch(function(){});
    }
  }

  var booted = false;
  function boot(){
    if (booted) return;
    booted = true;
    applyTexts();
    installControlCenter();
    installDock();
    installReceiptActions();
    improvePaymentOptions();
    updateV43Stats();
    cleanOldCaches();
  }

  window.addEventListener('error', function(event){
    console.error('V43 error capturado:', event.error || event.message);
    hideLoading('Se evitó que la pantalla quedara pegada.');
    showStatus('Se detectó un error, pero la app fue desbloqueada para que puedas continuar.', 'warning');
  });
  window.addEventListener('unhandledrejection', function(event){
    console.error('V43 promesa capturada:', event.reason);
    hideLoading('La operación falló, pero la pantalla quedó activa.');
  });
  document.addEventListener('click', function(ev){
    if (ev.target && ev.target.closest('.receipt-actions')) setTimeout(updateV43Stats, 150);
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  setTimeout(boot, 600);
  setTimeout(function(){ hideLoading(); }, 11000);
})();
