/* ==========================================================
   SD COMAYAGUA V56 - Ajustes visuales Gamer Ops + recibo nuevo
   ========================================================== */
(function(){
  'use strict';

  function $(sel){ return document.querySelector(sel); }
  function setText(sel, text){ var el=$(sel); if(el) el.textContent=text; }
  function esc(value){
    return String(value ?? '').replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch];
    });
  }
  function num(value){ return Number(value || 0) || 0; }
  function money(value){ return 'Lps. ' + Math.round(num(value)).toLocaleString('es-HN'); }
  function clean(value, fallback){
    var text = String(value ?? '').trim();
    return text || fallback || '';
  }

  function getItems(receipt){ return Array.isArray(receipt && receipt.items) ? receipt.items : []; }
  function getSummary(receipt){
    var r = receipt || {};
    var items = getItems(r);
    var subtotal = num(r.subtotal || (r.summary && r.summary.subtotal));
    if(!subtotal){
      subtotal = items.reduce(function(sum,it){
        var q = num(it.qty || it.quantity || 1) || 1;
        var p = num(it.price || it.unitPrice);
        return sum + num(it.total || (q*p));
      },0);
    }
    var shipping = num(r.shipping || (r.summary && r.summary.shipping));
    var codFee = num(r.codFee || r.commission || r.comision || (r.summary && (r.summary.codFee || r.summary.commission)));
    var discount = num(r.discount || (r.summary && r.summary.discount));
    var total = num(r.total || (r.summary && r.summary.total));
    if(!total) total = Math.max(0, subtotal + shipping + codFee - discount);
    return { subtotal:subtotal, shipping:shipping, codFee:codFee, discount:discount, total:total };
  }
  function receiptNumber(receipt){
    var raw = String((receipt && (receipt.number || receipt.id || receipt.receiptNumber)) || '0001');
    var digits = raw.replace(/\D/g,'').slice(-4);
    return '#' + (digits ? digits.padStart(4,'0') : '0001');
  }
  function customerName(r){
    return clean(r && (r.customer && r.customer.name || r.customerName || r.client || r.cliente || r.customer), 'Cliente');
  }
  function customerPhone(r){ return clean(r && (r.customer && r.customer.phone || r.phone || r.telefono), ''); }
  function paymentText(r){ return clean(r && (r.paymentLabel || r.payment || r.paymentMethod || r.metodoPago), 'Venta'); }
  function dateText(r){
    var d = r && r.createdAt ? new Date(r.createdAt) : new Date();
    return d.toLocaleString('es-HN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  var receiptCss = `
    @page{size:Letter portrait;margin:8mm;}
    *{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    html,body{margin:0;padding:0;background:#03060a;color:#edfaff;font-family:Rajdhani,Inter,"Segoe UI",Arial,sans-serif;}
    body{min-height:100vh;display:flex;justify-content:center;padding:12px;background:
      radial-gradient(circle at 18% -4%,rgba(0,229,255,.22),transparent 32%),
      radial-gradient(circle at 100% 0%,rgba(69,255,154,.13),transparent 28%),
      linear-gradient(145deg,#03060a,#07111b 58%,#04070c);}
    .ticket{width:min(100%,560px);position:relative;overflow:hidden;border-radius:26px;background:linear-gradient(180deg,#101b29,#07101a);border:1px solid rgba(0,229,255,.28);box-shadow:0 22px 70px rgba(0,0,0,.58),0 0 34px rgba(0,229,255,.13);}
    .ticket:before{content:"";position:absolute;inset:0 0 auto;height:3px;background:linear-gradient(90deg,transparent,#00e5ff,#45ff9a,transparent);}
    .ticket:after{content:"SDC OPS";position:absolute;right:-8px;top:14px;font-family:Orbitron,Arial,sans-serif;font-size:58px;font-weight:900;letter-spacing:-5px;color:rgba(0,229,255,.055);pointer-events:none;}
    .inner{position:relative;z-index:1;padding:22px;}
    .top{display:grid;grid-template-columns:72px 1fr;gap:14px;align-items:center;margin-bottom:14px;}
    .logo{width:72px;height:72px;border-radius:20px;display:grid;place-items:center;background:linear-gradient(135deg,#06101c,#0a2336);border:1px solid rgba(0,229,255,.46);box-shadow:0 0 0 1px rgba(69,255,154,.14),0 0 26px rgba(0,229,255,.16);font-family:Orbitron,Arial,sans-serif;font-size:27px;font-weight:900;color:#00e5ff;letter-spacing:-2px;}
    .brand .kicker,.box span,.total-row span,.item-meta,.footer{font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:900;color:#8da5ba;}
    .brand .kicker{color:#45ff9a;margin-bottom:5px;}
    .brand h1{margin:0;font-family:Orbitron,Rajdhani,Arial,sans-serif;font-size:24px;line-height:1;letter-spacing:.02em;color:#f3fbff;text-shadow:0 0 18px rgba(0,229,255,.16);}
    .brand p{margin:7px 0 0;color:#a6b7c9;font-size:13px;font-weight:700;line-height:1.3;}
    .receipt-no{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;border:1px solid rgba(0,229,255,.18);background:rgba(0,229,255,.06);border-radius:18px;padding:12px;margin:12px 0 14px;}
    .receipt-no span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.2em;color:#9cb2c5;font-weight:900;}
    .receipt-no strong{font-family:Orbitron,Rajdhani,Arial,sans-serif;font-size:24px;color:#45ff9a;letter-spacing:0;}
    .date{font-size:12px;color:#a6b7c9;font-weight:800;text-align:right;}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:14px;}
    .box{border:1px solid rgba(0,229,255,.14);background:rgba(7,16,26,.78);border-radius:16px;padding:12px;min-height:70px;}
    .box strong{display:block;margin-top:5px;color:#edfaff;font-size:16px;line-height:1.12;font-weight:900;}
    .box small{display:block;color:#8da5ba;font-size:12px;font-weight:700;margin-top:6px;}
    .section-title{font-family:Orbitron,Rajdhani,Arial,sans-serif;font-size:15px;text-transform:uppercase;letter-spacing:.08em;margin:16px 0 9px;color:#edfaff;}
    .items{border:1px solid rgba(0,229,255,.15);border-radius:18px;overflow:hidden;background:rgba(3,8,14,.62);}
    .item{display:grid;grid-template-columns:1fr auto;gap:10px;padding:13px;border-bottom:1px solid rgba(0,229,255,.10);}
    .item:last-child{border-bottom:0;}
    .item-name{font-size:15px;line-height:1.18;font-weight:900;color:#f5fbff;margin-bottom:5px;}
    .item-meta{font-size:10px;letter-spacing:.08em;line-height:1.4;color:#8ea8be;}
    .item-total{font-family:Orbitron,Rajdhani,Arial,sans-serif;text-align:right;font-size:15px;font-weight:900;color:#45ff9a;white-space:nowrap;}
    .promo{display:inline-block;margin-top:6px;border:1px solid rgba(69,255,154,.28);background:rgba(69,255,154,.09);color:#d9ffe9;border-radius:999px;padding:4px 7px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.1em;}
    .summary{margin-top:14px;border:1px solid rgba(0,229,255,.18);border-radius:20px;padding:12px;background:linear-gradient(180deg,rgba(0,229,255,.055),rgba(255,255,255,.012));}
    .total-row{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px dashed rgba(141,165,186,.22);font-weight:900;color:#d8ecfb;}
    .total-row:last-child{border-bottom:0;}
    .total-row strong{font-family:Orbitron,Rajdhani,Arial,sans-serif;}
    .grand{margin-top:8px;border:0!important;border-radius:17px;background:linear-gradient(135deg,#00d7ff,#00a3ff 48%,#36ff8f);color:#041018;padding:15px!important;align-items:center;}
    .grand span{color:#041018;font-size:12px;}
    .grand strong{font-size:20px;}
    .note{margin-top:14px;border:1px solid rgba(69,255,154,.18);background:rgba(69,255,154,.055);border-radius:16px;padding:12px;color:#a6b7c9;font-size:12px;font-weight:700;line-height:1.45;}
    .note b{color:#eafff2;}
    .footer{display:flex;justify-content:space-between;gap:10px;margin-top:14px;padding-top:10px;border-top:1px solid rgba(0,229,255,.14);font-size:10px;color:#7890a6;}
    @media(max-width:470px){body{padding:8px}.inner{padding:17px}.top{grid-template-columns:60px 1fr}.logo{width:60px;height:60px;border-radius:17px;font-size:22px}.brand h1{font-size:20px}.receipt-no{grid-template-columns:1fr}.date{text-align:left}.info{grid-template-columns:1fr}.item{grid-template-columns:1fr}.item-total{text-align:left}.grand strong{font-size:18px}}
    @media print{body{background:#fff;padding:0}.ticket{width:100%;max-width:none;box-shadow:none;border-radius:18px}.inner{padding:18px}.no-print{display:none!important}}
  `;

  function buildReceiptGamer(receipt){
    var r = receipt || {};
    var items = getItems(r);
    var s = getSummary(r);
    var units = items.reduce(function(sum,it){ return sum + (num(it.qty || it.quantity || 1) || 1); },0);
    var rows = items.length ? items.map(function(it){
      var q = num(it.qty || it.quantity || 1) || 1;
      var price = num(it.price || it.unitPrice);
      var total = num(it.total || (q * price));
      var regular = num(it.regularTotal);
      var discount = num(it.discount);
      var promo = it.promoApplied || discount > 0;
      return '<div class="item"><div><div class="item-name">'+esc(clean(it.name,'Producto'))+'</div><div class="item-meta">Cant. '+q+' · Precio '+money(price)+(it.sku ? ' · Ref. '+esc(it.sku) : '')+'</div>'+(promo ? '<span class="promo">Promo aplicada'+(regular ? ' · antes '+money(regular) : '')+'</span>' : '')+'</div><div class="item-total">'+money(total)+'</div></div>';
    }).join('') : '<div class="item"><div><div class="item-name">Venta sin detalle</div><div class="item-meta">Resumen general</div></div><div class="item-total">'+money(s.subtotal)+'</div></div>';
    var phone = customerPhone(r);
    var cod = s.codFee > 0 ? '<div class="total-row"><span>Comisión Pagar al Recibir</span><strong>'+money(s.codFee)+'</strong></div>' : '';
    var discount = s.discount > 0 ? '<div class="total-row"><span>Descuento / promo</span><strong>'+money(s.discount)+'</strong></div>' : '';
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet"><style>'+receiptCss+'</style></head><body><main class="ticket"><div class="inner"><section class="top"><div class="logo">SD</div><div class="brand"><div class="kicker">Gamer sales receipt</div><h1>SD COMAYAGUA</h1><p>Comprobante digital generado desde el panel privado.</p></div></section><section class="receipt-no"><div><span>Comprobante</span><strong>'+esc(receiptNumber(r))+'</strong></div><div class="date">'+esc(dateText(r))+'</div></section><section class="info"><div class="box"><span>Cliente</span><strong>'+esc(customerName(r))+'</strong>'+(phone ? '<small>'+esc(phone)+'</small>' : '')+'</div><div class="box"><span>Pago</span><strong>'+esc(paymentText(r))+'</strong></div><div class="box"><span>Unidades</span><strong>'+esc(units || items.length)+'</strong></div><div class="box"><span>Estado</span><strong style="color:#45ff9a">Venta registrada</strong></div></section><div class="section-title">Productos</div><section class="items">'+rows+'</section><section class="summary"><div class="total-row"><span>Productos</span><strong>'+money(s.subtotal)+'</strong></div><div class="total-row"><span>Envío</span><strong>'+money(s.shipping)+'</strong></div>'+cod+discount+'<div class="total-row grand"><span>Total a pagar</span><strong>'+money(s.total)+'</strong></div></section><section class="note"><b>Gracias por comprar en SD Comayagua.</b><br>Este resumen confirma los productos seleccionados, envío y total final. WhatsApp: +504 3151-7755.</section><footer class="footer"><span>SD COMAYAGUA</span><span>'+esc(receiptNumber(r))+'</span></footer></div></main></body></html>';
  }

  function applyVisualText(){
    document.body.classList.add('v56-gamer-ops');
    setText('.app-title','SDC OPS');
    setText('.hero-banner .eyebrow','Modo gamer privado');
    setText('.hero-title','Control de ventas tipo comando.');
    setText('.hero-copy','Inventario, venta rápida y comprobantes con estilo futurista para trabajar desde celular.');
    var saleBtn = document.getElementById('btn-hero-sale'); if(saleBtn) saleBtn.textContent='Nueva venta';
    var productBtn = document.getElementById('btn-hero-product'); if(productBtn) productBtn.textContent='+ Producto';
    setText('.login-badge','Acceso gamer ops');
    setText('.brand-copy h1','SDC GAMER OPS');
    setText('.support-copy','Panel privado de ventas, inventario y comprobantes con diseño futurista para celular.');
    var loginBtn = document.querySelector('.premium-login-btn'); if(loginBtn) loginBtn.textContent='Entrar al sistema';
  }

  function install(){
    window.buildReceiptHtml = buildReceiptGamer;
    try{ buildReceiptHtml = buildReceiptGamer; }catch(e){}
    applyVisualText();
  }

  document.addEventListener('DOMContentLoaded', install);
  window.addEventListener('load', install);
  setTimeout(install, 700);
})();
