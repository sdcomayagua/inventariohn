/* SDCOMAYAGUA · V40 Caja Móvil
   Mejoras de interacción sin modificar la API ni la lógica base. */
(function(){
  'use strict';
  var running = false;

  function $(sel, root){ return (root || document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function setText(el, value){ if(el) el.textContent = value; }
  function show(msg){ try{ if(typeof showToast === 'function') showToast(msg); else console.log(msg); }catch(e){ console.log(msg); } }
  function safeName(value){ return String(value || 'producto').replace(/[^a-z0-9ñáéíóúü\-\s]/gi,'').trim().replace(/\s+/g,'-').toLowerCase() || 'producto'; }

  function injectCaptureFloating(){
    if($('.capture-floating')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'capture-floating';
    btn.textContent = 'Salir del modo captura';
    btn.addEventListener('click', function(){ window.toggleCaptureMode(false); });
    document.body.appendChild(btn);
  }

  function ensureHeaderCaptureButton(){
    var tools = $('.header-tools');
    if(!tools || $('.capture-toggle', tools)) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'icon-btn capture-toggle';
    btn.title = 'Modo captura para cliente';
    btn.setAttribute('aria-label','Modo captura para cliente');
    btn.textContent = '▣';
    btn.addEventListener('click', function(){ window.toggleCaptureMode(); });
    tools.insertBefore(btn, tools.firstChild);
  }

  function rebuildDock(){
    var dock = $('.bottom-dock');
    if(!dock || dock.dataset.v40 === 'ok') return;
    dock.dataset.v40 = 'ok';
    dock.innerHTML = '' +
      '<button type="button" class="dock-selected" data-v40-dock="productos"><span>▦</span><small>Productos</small></button>' +
      '<button type="button" class="dock-primary" data-v40-dock="venta"><span>＋</span><small>Venta</small></button>' +
      '<button type="button" data-v40-dock="factura"><span>▤</span><small>Factura</small></button>' +
      '<button type="button" data-v40-dock="ajustes"><span>⚙</span><small>Ajustes</small></button>';
    dock.addEventListener('click', function(ev){
      var btn = ev.target.closest('button[data-v40-dock]');
      if(!btn) return;
      $all('button', dock).forEach(function(b){ b.classList.remove('dock-selected'); });
      btn.classList.add('dock-selected');
      var action = btn.dataset.v40Dock;
      if(action === 'productos' && typeof scrollToSection === 'function') scrollToSection('productos');
      if(action === 'venta' && typeof openSaleModal === 'function') openSaleModal();
      if(action === 'factura') {
        if(typeof scrollToSection === 'function') scrollToSection('comprobantes');
        var firstReceipt = $('#receipts-list .list-card button, #receipts-list button');
        if(firstReceipt && !firstReceipt.disabled) firstReceipt.focus({preventScroll:true});
      }
      if(action === 'ajustes' && typeof toggleFiltersPanel === 'function') toggleFiltersPanel();
    });
  }

  function enhanceDetailActions(){
    var actions = $('.detail-actions');
    if(!actions) return;
    var saleBtn = $('#detail-sale-btn');
    if(saleBtn) saleBtn.textContent = 'Agregar a venta';
    var editBtn = $('#detail-edit-btn');
    if(editBtn) editBtn.textContent = 'Editar';
    var deleteBtn = $('#detail-delete-btn');
    if(deleteBtn) deleteBtn.textContent = 'Eliminar';
    if(!$('#detail-download-btn')){
      var down = document.createElement('button');
      down.type = 'button';
      down.id = 'detail-download-btn';
      down.className = 'btn-secondary';
      down.textContent = 'Descargar foto';
      down.addEventListener('click', window.downloadCurrentDetailImage);
      actions.appendChild(down);
    }
    if(!$('#detail-copy-btn')){
      var copy = document.createElement('button');
      copy.type = 'button';
      copy.id = 'detail-copy-btn';
      copy.className = 'btn-secondary';
      copy.textContent = 'Copiar texto';
      copy.addEventListener('click', window.copyCurrentProductText);
      actions.appendChild(copy);
    }
  }

  function tuneStaticTexts(){
    setText($('#inv-welcome'), 'Caja privada · productos primero');
    setText($('.catalog-section .section-title'), 'Productos');
    var count = $('#results-count');
    if(count) count.textContent = (count.textContent || '0 productos').replace(/resultado(s)?/i,'producto$1');
    setText($('#ventas .section-title'), 'Ventas');
    setText($('#comprobantes .section-title'), 'Facturas');
    setText($('#sale-modal-title'), 'Caja móvil');
    setText($('#sale-step-indicator'), 'Agrega, edita y genera factura');
    var search = $('#inv-search');
    if(search){
      search.placeholder = 'Buscar producto, categoría o código';
      search.setAttribute('autocomplete','off');
      search.setAttribute('inputmode','search');
    }
    var quickProduct = $('#btn-quick-product'); if(quickProduct) quickProduct.textContent = '+ Producto';
    var quickSale = $('#btn-quick-sale'); if(quickSale) quickSale.textContent = '+ Venta';
    var complete = $('#complete-sale-btn'); if(complete) complete.textContent = 'Generar factura';
    $all('.receipt-actions button').forEach(function(btn){
      if(/editar venta/i.test(btn.textContent || '')) btn.textContent = 'Editar factura';
      if(/imprimir/i.test(btn.textContent || '')) btn.textContent = 'Imprimir / PDF';
    });
    $all('.product-action-btn.primary').forEach(function(btn){ btn.textContent = 'Agregar'; });
    $all('.product-action-btn:not(.primary)').forEach(function(btn){ if(/editar/i.test(btn.textContent||'')) btn.textContent = 'Editar'; });
  }

  function improveProductCards(){
    $all('.product-card').forEach(function(card){
      card.classList.add('v40-product-card');
      var img = $('.product-main-img', card);
      if(img){ img.onerror = function(){ this.src = typeof getPlaceholderImage === 'function' ? getPlaceholderImage('Sin imagen') : ''; }; }
    });
  }

  window.toggleCaptureMode = function(force){
    var shouldEnable = typeof force === 'boolean' ? force : !document.body.classList.contains('v40-capture');
    document.body.classList.toggle('v40-capture', shouldEnable);
    $all('.capture-toggle').forEach(function(btn){ btn.textContent = shouldEnable ? '✕' : '▣'; });
    if(shouldEnable) show('Modo captura activo. Solo se muestra lo necesario para enviar al cliente.');
  };

  window.downloadCurrentDetailImage = async function(){
    var img = $('#detail-main-img');
    if(!img || !img.src){ show('No hay foto para descargar.'); return; }
    var title = ($('#detail-name') && $('#detail-name').textContent) || 'producto';
    var filename = safeName(title) + '.jpg';
    try{
      var a = document.createElement('a');
      a.href = img.src;
      a.download = filename;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      show('Foto lista para guardar.');
    }catch(e){
      window.open(img.src, '_blank', 'noopener');
      show('Se abrió la foto en otra pestaña para guardarla.');
    }
  };

  window.copyCurrentProductText = async function(){
    var title = ($('#detail-name') && $('#detail-name').textContent.trim()) || 'Producto';
    var price = ($('#detail-price') && $('#detail-price').textContent.trim()) || '';
    var stock = ($('#detail-stock') && $('#detail-stock').textContent.trim()) || '';
    var category = ($('#detail-category') && $('#detail-category').textContent.trim()) || '';
    var text = title + '\n' + price + (stock ? '\n' + stock : '') + (category ? '\nCategoría: ' + category : '') + '\n\nDisponible en SDCOMAYAGUA. Escríbeme para confirmar existencia y entrega.';
    try{
      await navigator.clipboard.writeText(text);
      show('Texto del producto copiado.');
    }catch(e){
      var area = document.createElement('textarea');
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      show('Texto del producto copiado.');
    }
  };

  function enhance(){
    if(running) return;
    running = true;
    document.body.classList.add('v40-caja-movil','v39-mobile-ultra','v38-mobile-pro','v37-shop');
    injectCaptureFloating();
    ensureHeaderCaptureButton();
    rebuildDock();
    tuneStaticTexts();
    enhanceDetailActions();
    improveProductCards();
    running = false;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhance, {once:true}); else enhance();
  window.addEventListener('load', enhance, {once:true});
  [80,250,650,1200,2200].forEach(function(ms){ setTimeout(enhance, ms); });
  setTimeout(function(){
    var root = $('.main-content') || document.body;
    try{ new MutationObserver(enhance).observe(root,{childList:true,subtree:true,characterData:true}); }catch(e){}
  },300);
})();
