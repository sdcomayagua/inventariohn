/* SD COMAYAGUA V59 - fuerza dashboard tecnológico y evita cabecera vieja */
(function(){
  'use strict';
  var VERSION = 'v59-tech-dashboard';

  function $(sel, root){ return (root || document).querySelector(sel); }
  function money(v){
    try { if (typeof formatMoney === 'function') return formatMoney(Number(v||0)); } catch(e) {}
    return 'Lps. ' + Number(v||0).toLocaleString('es-HN',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function getProductsSafe(){
    try { if (typeof getProducts === 'function') return getProducts() || []; } catch(e) {}
    try { if (Array.isArray(window.PRODUCTS)) return window.PRODUCTS; } catch(e) {}
    try { return JSON.parse(localStorage.getItem('sdc_products') || '[]'); } catch(e) {}
    return [];
  }
  function number(v){ return Number(v || 0) || 0; }
  function stock(p){ return number(p.stock ?? p.qty ?? p.cantidad ?? p.existencias); }
  function price(p){ return number(p.price ?? p.precio ?? p.salePrice); }
  function cost(p){ return number(p.cost ?? p.costo ?? p.precio_costo ?? p.compra); }

  function writeMetrics(){
    var products = getProductsSafe();
    var value = 0, invested = 0, profit = 0;
    products.forEach(function(p){ var q = stock(p); value += price(p) * q; invested += cost(p) * q; profit += Math.max(0, (price(p)-cost(p))*q); });
    var map = {
      'v59-products': products.length,
      'v59-value': money(value),
      'v59-invested': money(invested),
      'v59-profit': money(profit),
      'dash-products-count': products.length,
      'dash-stock-value': money(value),
      'dash-invested-value': money(invested),
      'dash-profit-value': money(profit)
    };
    Object.keys(map).forEach(function(id){ var el = document.getElementById(id); if(el) el.textContent = map[id]; });
  }

  function renderHeader(){
    var header = $('.app-header');
    if(!header) return;
    if(header.dataset.version === VERSION && header.textContent.indexOf('Caja SDC') === -1) { writeMetrics(); return; }
    header.dataset.version = VERSION;
    header.className = 'app-header v59-cockpit';
    header.innerHTML = ''+
      '<div class="v59-topbar">'+
        '<div class="v59-chip">Sistema privado activo</div>'+
        '<div class="v59-top-actions">'+
          '<button type="button" title="Actualizar" onclick="location.reload()">↻</button>'+
          '<button type="button" title="Salir" onclick="invLogout()">⎋</button>'+
        '</div>'+
      '</div>'+
      '<div class="v59-grid">'+
        '<section class="v59-brand">'+
          '<div class="v59-brand-main">'+
            '<div class="v59-logo">SD</div>'+
            '<div><p class="v59-kicker">Tech sales dashboard</p><h1 class="v59-title">SD COMAYAGUA</h1><p class="v59-sub">Panel de ventas, inventario y recibos. Estilo gamer tecnológico real.</p></div>'+
          '</div>'+
          '<div class="v59-actions">'+
            '<button class="v59-primary" type="button" onclick="openSaleModal()">Nueva venta</button>'+
            '<button class="v59-secondary" type="button" onclick="invOpenModal(false)">+ Producto</button>'+
          '</div>'+
        '</section>'+
        '<section class="v59-metrics">'+
          '<div class="v59-metric-head"><div><p class="v59-kicker">Control live</p><h2>Inventario operativo</h2></div><span class="v59-live">LIVE</span></div>'+
          '<div class="v59-metric-grid">'+
            '<article class="v59-metric"><span>Productos</span><strong id="v59-products">0</strong></article>'+
            '<article class="v59-metric"><span>Valor venta</span><strong id="v59-value">Lps. 0.00</strong></article>'+
            '<article class="v59-metric"><span>Invertido</span><strong id="v59-invested">Lps. 0.00</strong></article>'+
            '<article class="v59-metric profit"><span>Ganancia</span><strong id="v59-profit">Lps. 0.00</strong></article>'+
          '</div>'+
        '</section>'+
      '</div>';
    writeMetrics();
  }

  function renderDock(){
    var dock = $('.bottom-dock') || $('.mobile-company-dock');
    if(!dock) return;
    dock.className = 'v59-dock';
    dock.innerHTML = ''+
      '<button type="button" onclick="scrollToSection(\'productos\')"><span>⌂</span>Catálogo</button>'+
      '<button type="button" class="accent" onclick="openSaleModal()"><span>▣</span>Vender</button>'+
      '<button type="button" onclick="invOpenModal(false)"><span>＋</span>Producto</button>';
    document.querySelectorAll('.bottom-dock,.mobile-company-dock').forEach(function(other){ if(other !== dock) other.style.display = 'none'; });
  }

  function cleanLayout(){
    document.body.classList.add('v59-forced-dashboard','theme-dark');
    document.body.classList.remove('theme-light');
    var search = document.getElementById('inv-search');
    if(search) search.placeholder = 'Buscar producto o código';
    var title = $('#productos .section-title');
    if(title && /PRODUCTOS|Productos/i.test(title.textContent)) title.textContent = 'Productos';
    renderHeader();
    renderDock();
  }

  function clearCachesOnce(){
    try{
      var key = 'sdc_v59_cache_clear_done';
      if(sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key,'1');
      if('caches' in window) caches.keys().then(function(keys){ keys.forEach(function(k){ caches.delete(k); }); });
      if('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(function(regs){ regs.forEach(function(r){ r.unregister(); }); });
    }catch(e){}
  }

  function boot(){ clearCachesOnce(); cleanLayout(); writeMetrics(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  [60,160,320,700,1200,2200,3600,5200].forEach(function(ms){ setTimeout(boot, ms); });
  try { new MutationObserver(function(){ if(($('.app-header')||{}).textContent && $('.app-header').textContent.indexOf('Caja SDC') >= 0) boot(); }).observe(document.documentElement,{childList:true,subtree:true}); } catch(e) {}
  window.addEventListener('storage', function(){ setTimeout(writeMetrics,80); });
})();
