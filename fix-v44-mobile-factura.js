/* SDCOMAYAGUA · V44 Mobile Factura Pro
   Ajustes solicitados: ancho móvil, dock de 4 botones, producto con foto grande y envío/commission COD 6%. */
(function(){
  'use strict';

  var NORMAL_SHIPPING_PRICE = 110;
  var COD_RATE = 0.06;
  var booted = false;

  function $(selector, root){ return (root || document).querySelector(selector); }
  function $all(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value){
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch];
    });
  }
  function money(value){
    try { return typeof formatMoney === 'function' ? formatMoney(Number(value || 0)) : ('Lps. ' + Number(value || 0).toFixed(2)); }
    catch(e){ return 'Lps. ' + Number(value || 0).toFixed(2); }
  }
  function setText(id, value){ var el = document.getElementById(id); if (el) el.textContent = value; }
  function isCODText(value){ return /pagar\s*al\s*recibir|contra\s*entrega|cod/i.test(String(value || '')); }
  function roundLps(value){ return Math.round(Number(value || 0)); }
  function getCart(){ try { return Array.isArray(SALE_CART) ? SALE_CART : []; } catch(e){ return []; } }
  function getDiscount(){ return Math.max(0, Number($('#sale-discount') && $('#sale-discount').value || 0)); }
  function getPayment(){ return ($('#sale-payment') && $('#sale-payment').value) || 'Efectivo'; }

  function ensurePaymentOptions(){
    var select = $('#sale-payment');
    if (!select) return;
    [
      'Efectivo',
      'Depósito / Transferencia',
      'Tigo Money',
      'Pagar al Recibir'
    ].forEach(function(label){
      var exists = Array.prototype.some.call(select.options, function(option){
        return String(option.value).toLowerCase() === label.toLowerCase();
      });
      if (!exists) {
        var option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        select.appendChild(option);
      }
    });
  }

  window.getShippingCatalog = function(zone){
    if (zone === 'COMAYAGUA') {
      try { return Array.isArray(COMAYAGUA_SHIPPING_OPTIONS) ? COMAYAGUA_SHIPPING_OPTIONS : []; }
      catch(e){ return []; }
    }
    return [
      {
        id:'envio-normal',
        label:'Envío Normal',
        price:NORMAL_SHIPPING_PRICE,
        note:'Para clientes que depositan o pagan por Tigo Money.'
      },
      {
        id:'pagar-recibir',
        label:'Pagar al Recibir',
        price:NORMAL_SHIPPING_PRICE,
        note:'Envío Lps. 110 + comisión del 6% sobre productos + envío.'
      }
    ];
  };

  window.populateShippingOptionSelect = function(){
    var zoneSelect = $('#sale-shipping-zone');
    var optionSelect = $('#sale-shipping-option');
    var list = $('#sale-shipping-list');
    if (!zoneSelect || !optionSelect || !list) return;
    var zone = zoneSelect.value === 'COMAYAGUA' ? 'COMAYAGUA' : 'NACIONAL';
    var items = window.getShippingCatalog(zone);
    var previousValue = optionSelect.value;
    var selectedValue = items.some(function(item){ return item.id === previousValue; }) ? previousValue : '';

    var enabledBox = $('#sale-shipping-enabled');
    var shouldAutoSelectNormal = enabledBox && enabledBox.checked;
    if (!selectedValue && zone === 'NACIONAL') {
      if (isCODText(getPayment())) selectedValue = 'pagar-recibir';
      else if (/dep[oó]sito|transferencia|tigo/i.test(getPayment()) || shouldAutoSelectNormal) selectedValue = 'envio-normal';
    }

    optionSelect.innerHTML = ['<option value="">Sin envío</option>'].concat(items.map(function(item){
      return '<option value="' + esc(item.id) + '">' + esc(item.label) + ' · ' + money(item.price) + '</option>';
    })).join('');
    optionSelect.value = selectedValue;

    list.classList.add('shipping-options-grid');
    list.innerHTML = items.map(function(item){
      var active = item.id === selectedValue;
      var isCod = item.id === 'pagar-recibir';
      var title = isCod ? 'Pagar al Recibir' : item.label;
      var amount = isCod ? 'Envío ' + money(NORMAL_SHIPPING_PRICE) : money(item.price);
      var note = item.note || (isCod ? 'Se suma comisión 6% al total.' : '');
      return '<button type="button" class="shipping-option-card' + (active ? ' is-active' : '') + '" data-shipping-id="' + esc(item.id) + '" role="option" aria-selected="' + (active ? 'true' : 'false') + '">' +
        '<span>' + esc(title) + '</span>' +
        '<strong>' + esc(amount) + '</strong>' +
        (note ? '<small>' + esc(note) + '</small>' : '') +
      '</button>';
    }).join('');

    var enabled = $('#sale-shipping-enabled');
    if (enabled && selectedValue) enabled.checked = true;
    var fields = $('#sale-shipping-fields');
    if (fields) fields.hidden = false;
    try { window.updateSaleSummary(); } catch(e) {}
  };

  window.getSelectedShipping = function(){
    var enabledBox = $('#sale-shipping-enabled');
    if (enabledBox && !enabledBox.checked && !isCODText(getPayment())) return null;
    var optionId = ($('#sale-shipping-option') && $('#sale-shipping-option').value) || '';
    var zone = ($('#sale-shipping-zone') && $('#sale-shipping-zone').value) === 'COMAYAGUA' ? 'COMAYAGUA' : 'NACIONAL';
    if (!optionId) return null;
    var item = (window.getShippingCatalog(zone) || []).find(function(entry){ return entry.id === optionId; }) || null;
    if (!item) return null;
    var payment = getPayment();
    var isCOD = item.id === 'pagar-recibir' || isCODText(payment);
    var fee = zone === 'NACIONAL' ? NORMAL_SHIPPING_PRICE : Number(item.price || 0);
    if (isCOD) fee = NORMAL_SHIPPING_PRICE;
    fee = Math.max(0, Number.isFinite(fee) ? fee : 0);
    var productSubtotal = getCart().reduce(function(sum, line){ return sum + Number(line.total || 0); }, 0);
    var commission = isCOD ? roundLps((productSubtotal + fee) * COD_RATE) : 0;
    return {
      id:'shipping-' + zone.toLowerCase() + '-' + item.id,
      type:'shipping',
      zone:zone,
      name:isCOD ? 'Pagar al Recibir' : (zone === 'COMAYAGUA' ? ('Envío Comayagua · ' + item.label) : 'Envío Normal'),
      sku:zone === 'COMAYAGUA' ? 'ENV-COM' : (isCOD ? 'ENV-COD' : 'ENV-NORMAL'),
      qty:1,
      price:fee,
      cost:0,
      total:fee,
      profit:0,
      deliveryFee:fee,
      codCommission:commission,
      codRate:isCOD ? COD_RATE : 0,
      isCOD:isCOD
    };
  };

  function ensureCommissionCard(){
    var grid = $('.sales-summary-grid-modal');
    if (!grid || $('#sale-cod-commission')) return;
    var card = document.createElement('article');
    card.className = 'sales-stat glass-panel cod-commission-stat';
    card.innerHTML = '<span>Comisión Pagar al Recibir</span><strong id="sale-cod-commission">Lps. 0.00</strong>';
    var discountCard = $('#sale-discount-total') ? $('#sale-discount-total').closest('article') : null;
    if (discountCard && discountCard.parentNode === grid) grid.insertBefore(card, discountCard);
    else grid.appendChild(card);
  }

  function calcSaleSummary(){
    var cart = getCart();
    var shipping = window.getSelectedShipping();
    var productsSubtotal = cart.reduce(function(sum, line){ return sum + Number(line.total || 0); }, 0);
    var shippingFee = Number(shipping && (shipping.deliveryFee != null ? shipping.deliveryFee : shipping.total) || 0);
    var commission = Number(shipping && shipping.codCommission || 0);
    var discount = getDiscount();
    var subtotalBeforeDiscount = productsSubtotal + shippingFee + commission;
    var total = Math.max(0, subtotalBeforeDiscount - discount);
    var profit = Math.max(0, cart.reduce(function(sum, line){ return sum + Number(line.profit || 0); }, 0) - discount);
    if (shipping) {
      shipping.total = shippingFee;
      shipping.price = shippingFee;
      shipping.codCommission = commission;
    }
    return {
      productsSubtotal:productsSubtotal,
      subtotal:subtotalBeforeDiscount,
      discount:discount,
      total:total,
      profit:profit,
      shippingTotal:shippingFee,
      codCommission:commission,
      shipping:shipping
    };
  }

  function refreshSaleReview(summary){
    var customer = ($('#sale-customer') && $('#sale-customer').value.trim()) || 'Cliente general';
    var payment = getPayment();
    var note = ($('#sale-note') && $('#sale-note').value.trim()) || 'Sin nota';
    setText('sale-review-customer', customer);
    setText('sale-review-payment', payment);
    setText('sale-review-items', getCart().reduce(function(sum, item){ return sum + Number(item.qty || 0); }, 0) + ' artículo(s)');
    setText('sale-review-discount', money(summary.discount));
    setText('sale-review-note', note);
  }

  window.updateSaleSummary = function(){
    ensureCommissionCard();
    var summary = calcSaleSummary();
    setText('sale-subtotal', money(summary.productsSubtotal));
    setText('sale-shipping-total', money(summary.shippingTotal));
    setText('sale-cod-commission', money(summary.codCommission));
    setText('sale-discount-total', money(summary.discount));
    setText('sale-total', money(summary.total));
    setText('sale-profit', money(summary.profit));
    var label = $('#sale-shipping-preview');
    if (label) {
      if (!summary.shipping) {
        label.textContent = 'Sin envío agregado';
      } else if (summary.shipping.isCOD) {
        label.textContent = 'Pagar al Recibir: envío ' + money(summary.shippingTotal) + ' + comisión 6% (' + money(summary.codCommission) + ')';
      } else {
        label.textContent = summary.shipping.name + ' · ' + money(summary.shippingTotal);
      }
    }
    try { updateSaleCartBadge(); } catch(e) {}
    var nextBtn = $('#sale-next-btn');
    if (nextBtn) nextBtn.disabled = getCart().length === 0;
    refreshSaleReview(summary);
    return summary;
  };

  window.updateSaleReview = function(){
    var summary = calcSaleSummary();
    refreshSaleReview(summary);
    try { window.updateSaleSummary(); } catch(e) {}
  };

  window.findShippingOptionId = function(shipping){
    if (!shipping) return '';
    if (shipping.isCOD || isCODText(shipping.name) || isCODText(shipping.sku)) return 'pagar-recibir';
    var zone = shipping.zone || 'NACIONAL';
    var catalog = window.getShippingCatalog(zone) || [];
    var exact = String(shipping.id || '').split('-').slice(2).join('-');
    return (catalog.find(function(item){ return item.id === exact; }) ||
      catalog.find(function(item){ return String(shipping.name || '').indexOf(item.label) >= 0; }) ||
      catalog.find(function(item){ return Number(item.price || 0) === Number(shipping.price || 0); }) ||
      catalog[0] || {}).id || '';
  };

  function syncPaymentAndShipping(){
    var payment = getPayment();
    var zoneSelect = $('#sale-shipping-zone');
    var optionSelect = $('#sale-shipping-option');
    var enabled = $('#sale-shipping-enabled');
    var fields = $('#sale-shipping-fields');
    if (!zoneSelect || !optionSelect) return;
    if (isCODText(payment)) {
      zoneSelect.value = 'NACIONAL';
      if (enabled) enabled.checked = true;
      if (fields) fields.hidden = false;
      window.populateShippingOptionSelect();
      optionSelect.value = 'pagar-recibir';
    } else if (/dep[oó]sito|transferencia|tigo/i.test(payment) && zoneSelect.value !== 'COMAYAGUA') {
      if (enabled) enabled.checked = true;
      if (fields) fields.hidden = false;
      window.populateShippingOptionSelect();
      optionSelect.value = 'envio-normal';
    }
    window.populateShippingOptionSelect();
    window.updateSaleSummary();
  }

  function installDockV44(){
    var dock = $('.mobile-company-dock') || $('.bottom-dock');
    if (!dock) return;
    document.body.classList.add('v44-mobile-factura');
    $all('.bottom-dock').forEach(function(item){ if (item !== dock) item.style.display = 'none'; });
    dock.classList.add('v43-dock','v44-dock');
    dock.innerHTML = '' +
      '<button type="button" onclick="scrollToSection(\'productos\')"><span>⌂</span><small>Inicio</small></button>' +
      '<button type="button" class="accent" onclick="openSaleModal()"><span>🧾</span><small>Vender</small></button>' +
      '<button type="button" onclick="invOpenModal(false)"><span>＋</span><small>Producto</small></button>' +
      '<button type="button" onclick="toggleSummaryPanel()"><span>▥</span><small>Resumen</small></button>';
  }

  function compactEmptyPanels(){
    var movementsBtn = $('#movimientos .section-head .btn-secondary');
    if (movementsBtn) movementsBtn.textContent = 'Ver';
    var receiptsBtn = $('#comprobantes .section-head .btn-secondary');
    if (receiptsBtn) receiptsBtn.textContent = 'Ver';
    var activityBtn = $('#activity-card .section-head .btn-secondary');
    if (activityBtn) activityBtn.textContent = 'Ver';
  }

  function logoData(){
    try { if (typeof RECEIPT_LOGO_DATA_URI !== 'undefined' && RECEIPT_LOGO_DATA_URI) return RECEIPT_LOGO_DATA_URI; } catch(e) {}
    try { if (typeof getPlaceholderImage === 'function') return getPlaceholderImage('SD'); } catch(e) {}
    return '';
  }

  function receiptItems(receipt){
    return (receipt.items || []).filter(function(item){ return item && item.type !== 'shipping'; });
  }
  function receiptShipping(receipt){
    var shipping = receipt.shipping || (receipt.items || []).find(function(item){ return item && item.type === 'shipping'; }) || null;
    var payment = receipt.payment || '';
    var isCOD = Boolean(shipping && (shipping.isCOD || isCODText(shipping.name) || isCODText(payment) || shipping.codCommission));
    var fee = Number(shipping && (shipping.deliveryFee != null ? shipping.deliveryFee : shipping.total) || 0);
    if (isCOD && (!fee || fee > NORMAL_SHIPPING_PRICE)) fee = NORMAL_SHIPPING_PRICE;
    var productsSubtotal = receiptItems(receipt).reduce(function(sum, item){ return sum + Number(item.total || 0); }, 0);
    var commission = Number(shipping && shipping.codCommission || 0);
    if (isCOD && !commission) commission = roundLps((productsSubtotal + fee) * COD_RATE);
    return { shipping:shipping, isCOD:isCOD, fee:fee, commission:commission };
  }

  window.buildReceiptHtml = function(receipt){
    var items = receiptItems(receipt);
    var shippingData = receiptShipping(receipt || {});
    var shippingFee = shippingData.fee;
    var codCommission = shippingData.commission;
    var productSubtotal = items.reduce(function(sum, item){ return sum + Number(item.total || 0); }, 0);
    var discount = Number(receipt.discount || 0);
    var total = Math.max(0, productSubtotal + shippingFee + codCommission - discount);
    var totalUnits = items.reduce(function(sum, item){ return sum + (Number(item.qty) || 0); }, 0);
    var rows = items.map(function(item){
      return '<tr>' +
        '<td><strong>' + esc(item.name) + '</strong><small>' + esc(item.sku || 'Sin código') + '</small></td>' +
        '<td class="center">' + (Number(item.qty) || 0) + '</td>' +
        '<td class="num">' + money(item.price) + '</td>' +
        '<td class="num bold">' + money(item.total) + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="4" class="center">Sin productos</td></tr>';
    var commissionRow = shippingData.isCOD ? '<div class="total-row highlight-soft"><span>Comisión por Pagar al Recibir <b>6%</b></span><strong>' + money(codCommission) + '</strong></div>' : '';
    var shippingLabel = shippingData.isCOD ? 'Envío Normal' : 'Envío';
    var title = 'SD COMAYAGUA | Comprobante ' + (receipt.number || '');
    var dateLabel = '';
    try { dateLabel = typeof formatDateTime === 'function' ? formatDateTime(receipt.createdAt) : (receipt.createdAt || ''); } catch(e){ dateLabel = receipt.createdAt || ''; }
    return '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(title) + '</title><style>' +
      ':root{color-scheme:light;--ink:#071326;--muted:#66758a;--line:#dce7f5;--blue:#0b63ce;--blue2:#2f7df4;--soft:#f6faff}*{box-sizing:border-box}html,body{margin:0;padding:0}body{font-family:Inter,Arial,sans-serif;color:var(--ink);background:#eef6ff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{position:sticky;top:0;z-index:10;display:flex;gap:10px;justify-content:center;padding:10px;background:rgba(238,246,255,.9);backdrop-filter:blur(10px)}button{border:0;border-radius:999px;padding:12px 18px;font-weight:900}.primary{background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff}.secondary{background:#fff;color:var(--ink);border:1px solid var(--line)}.wrap{padding:14px}.paper{max-width:900px;margin:0 auto;background:#fff;border:1px solid var(--line);border-radius:26px;overflow:hidden;box-shadow:0 20px 58px rgba(15,42,90,.12)}.inner{padding:24px}.hero{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:16px;border:1px solid #dbeafe;border-radius:22px;background:linear-gradient(135deg,#eaf3ff,#fff)}.brand{display:flex;align-items:center;gap:14px}.logo{width:122px;max-width:32vw;display:block}.kicker{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.20em;color:var(--blue)}h1{margin:4px 0 3px;font-size:25px;line-height:1;letter-spacing:-.04em}p{margin:0;color:var(--muted);font-size:12px}.meta{text-align:right;background:#fff;border:1px solid var(--line);border-radius:18px;padding:12px 14px;min-width:190px}.meta span{display:block;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.16em;color:var(--muted)}.meta strong{display:block;font-size:26px;letter-spacing:-.04em}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:12px 0}.card{border:1px solid var(--line);border-radius:16px;padding:11px;background:#fff}.card span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.14em;font-weight:900;color:var(--muted);margin-bottom:5px}.card strong{font-size:13px}.content{display:grid;grid-template-columns:minmax(0,1fr) 255px;gap:12px}.box{border:1px solid var(--line);border-radius:20px;overflow:hidden;background:#fff}.box-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:13px 15px;border-bottom:1px solid var(--line);background:#fbfdff}h2{margin:0;font-size:16px}.pill{background:#eaf3ff;color:var(--blue);font-size:11px;font-weight:900;border-radius:999px;padding:7px 10px}table{width:100%;border-collapse:collapse}th,td{padding:11px 14px;border-bottom:1px solid #edf2fb;text-align:left;vertical-align:top}th{font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted);background:#fbfdff}td{font-size:12px}td strong{display:block;font-size:12px}td small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.center{text-align:center}.num{text-align:right;white-space:nowrap}.bold{font-weight:900}.totals{padding:15px;background:linear-gradient(180deg,#eef6ff,#fff)}.totals h3{margin:4px 0 12px;font-size:18px}.total-list{display:grid;gap:8px}.total-row{display:flex;justify-content:space-between;gap:10px;font-size:12px}.total-row span{color:var(--muted)}.total-row strong{font-size:13px}.highlight-soft{background:#f1f7ff;border:1px solid #dbeafe;border-radius:13px;padding:9px}.grand{background:linear-gradient(135deg,var(--blue),var(--blue2));color:#fff;border-radius:14px;padding:11px}.grand span{color:rgba(255,255,255,.85)}.grand strong{font-size:20px}.note{margin-top:12px;padding:13px;border:1px solid var(--line);border-radius:18px;background:#fbfdff}.note strong{display:block;color:var(--blue);font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}.footer{display:flex;justify-content:space-between;gap:10px;margin-top:12px;padding-top:10px;border-top:1px dashed #b7c6d9;font-size:10px;color:var(--muted)}.footer b{color:var(--ink)}@media(max-width:700px){.wrap{padding:0}.paper{border-radius:0;border:0}.inner{padding:15px}.hero,.brand{flex-direction:column}.meta{text-align:left;min-width:0;width:100%}.grid,.content{grid-template-columns:1fr}.logo{width:150px;max-width:60vw}}@media print{@page{size:letter portrait;margin:8mm}.toolbar{display:none!important}body{background:#fff!important;font-size:10px}.wrap{padding:0!important}.paper{max-width:none;width:100%!important;border:0!important;border-radius:0!important;box-shadow:none!important}.inner{padding:0!important}.hero{padding:10px!important;border-radius:14px!important}.logo{width:84px!important}.kicker{font-size:8px!important}h1{font-size:16px!important}.brand{gap:10px}.meta{min-width:165px!important;padding:9px 10px!important;border-radius:12px!important}.meta strong{font-size:16px!important}.grid{grid-template-columns:repeat(4,1fr)!important;gap:6px!important;margin:8px 0!important}.card{padding:8px!important;border-radius:11px!important}.card span{font-size:7px!important}.card strong{font-size:10px!important}.content{grid-template-columns:minmax(0,1fr) 210px!important;gap:8px!important}.box{border-radius:12px!important}.box-head{padding:8px 9px!important}h2{font-size:12px!important}.pill{font-size:8px!important;padding:4px 7px!important}th,td{padding:6px 8px!important}th{font-size:7px!important}td,td strong{font-size:9px!important}td small{font-size:7.5px!important}.totals{padding:9px!important}.totals h3{font-size:11px!important;margin:2px 0 7px!important}.total-list{gap:4px!important}.total-row{font-size:9px!important}.total-row strong{font-size:9px!important}.highlight-soft{padding:6px!important;border-radius:9px!important}.grand{padding:7px!important;border-radius:9px!important}.grand strong{font-size:13px!important}.note{padding:8px!important;margin-top:8px!important;border-radius:11px!important}.note p{font-size:8px!important}.footer{font-size:8px!important;margin-top:8px!important;padding-top:6px!important}}' +
      '</style></head><body><div class="toolbar"><button class="secondary" onclick="closePreview()">Cerrar</button><button class="primary" onclick="window.print()">Imprimir / Guardar PDF</button></div><div class="wrap"><main class="paper"><div class="inner"><section class="hero"><div class="brand"><img class="logo" src="' + esc(logoData()) + '" alt="SD Comayagua"><div><div class="kicker">Comprobante premium</div><h1>SD COMAYAGUA</h1><p>Detalle de venta generado desde la app</p></div></div><aside class="meta"><span>Comprobante</span><strong>#' + esc(receipt.number || '') + '</strong><p>' + esc(dateLabel) + '</p><p>Atendido por ' + esc(receipt.user || 'Admin') + '</p></aside></section><section class="grid"><div class="card"><span>Cliente</span><strong>' + esc(receipt.customer || 'Cliente general') + '</strong></div><div class="card"><span>Pago</span><strong>' + esc(receipt.payment || 'Efectivo') + '</strong></div><div class="card"><span>Unidades</span><strong>' + totalUnits + '</strong></div><div class="card"><span>Estado</span><strong style="color:#0f9f6e">Venta registrada</strong></div></section><section class="content"><section class="box"><div class="box-head"><h2>Detalle de productos</h2><span class="pill">' + items.length + ' concepto(s)</span></div><table><thead><tr><th>Concepto</th><th class="center">Cant.</th><th class="num">Precio</th><th class="num">Total</th></tr></thead><tbody>' + rows + '</tbody></table></section><aside><section class="box totals"><div class="kicker">Resumen</div><h3>Total de la venta</h3><div class="total-list"><div class="total-row"><span>Productos</span><strong>' + money(productSubtotal) + '</strong></div><div class="total-row"><span>' + esc(shippingLabel) + '</span><strong>' + money(shippingFee) + '</strong></div>' + commissionRow + '<div class="total-row"><span>Descuento</span><strong>' + money(discount) + '</strong></div><div style="height:1px;background:#dce7f5;margin:2px 0"></div><div class="total-row grand"><span>Total</span><strong>' + money(total) + '</strong></div></div></section><section class="note"><strong>Nota</strong><p>' + esc(receipt.note || 'Gracias por su compra. Este comprobante fue generado automáticamente desde Inventario SD Comayagua.') + '</p></section></aside></section><footer class="footer"><b>SD Comayagua · comprobante listo para entregar</b><span>Inventario premium · #' + esc(receipt.number || '') + '</span></footer></div></main></div><script>function closePreview(){try{if(window.parent&&window.parent!==window&&window.parent.closeReceiptModal){window.parent.closeReceiptModal();return}}catch(e){}try{window.close()}catch(e){}try{history.back()}catch(e){}}</script></body></html>';
  };

  function installEvents(){
    ensurePaymentOptions();
    ensureCommissionCard();
    var payment = $('#sale-payment');
    if (payment && !payment.dataset.v44Sync) {
      payment.dataset.v44Sync = '1';
      payment.addEventListener('change', syncPaymentAndShipping);
    }
    var list = $('#sale-shipping-list');
    if (list && !list.dataset.v44Click) {
      list.dataset.v44Click = '1';
      list.addEventListener('click', function(event){
        var btn = event.target.closest('[data-shipping-id]');
        if (!btn) return;
        var optionSelect = $('#sale-shipping-option');
        if (optionSelect) optionSelect.value = btn.dataset.shippingId || '';
        var enabled = $('#sale-shipping-enabled');
        if (enabled) enabled.checked = Boolean(optionSelect && optionSelect.value);
        window.populateShippingOptionSelect();
        if (btn.dataset.shippingId === 'pagar-recibir') {
          var pay = $('#sale-payment');
          if (pay) pay.value = 'Pagar al Recibir';
        }
        window.updateSaleSummary();
      }, true);
    }
    var enabled = $('#sale-shipping-enabled');
    if (enabled && !enabled.dataset.v44Change) {
      enabled.dataset.v44Change = '1';
      enabled.addEventListener('change', function(){
        var fields = $('#sale-shipping-fields');
        if (fields) fields.hidden = false;
        var optionSelect = $('#sale-shipping-option');
        if (!enabled.checked && optionSelect) optionSelect.value = '';
        window.populateShippingOptionSelect();
        window.updateSaleSummary();
      });
    }
  }

  function boot(){
    if (booted) return;
    booted = true;
    document.body.classList.add('v44-mobile-factura');
    installDockV44();
    compactEmptyPanels();
    installEvents();
    try { window.populateShippingOptionSelect(); } catch(e) {}
    try { window.updateSaleSummary(); } catch(e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
  setTimeout(function(){ booted = false; boot(); }, 650);
  setTimeout(function(){ try { installDockV44(); installEvents(); } catch(e) {} }, 1600);
})();
