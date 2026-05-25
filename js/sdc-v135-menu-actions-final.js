/* SDC V135: acciones finales del menu hamburguesa y botones inferiores. */
(function(){
  'use strict';
  if(window.SDCV135MenuActionsFinal) return;
  window.SDCV135MenuActionsFinal = true;

  function loadCss(path){
    if(document.querySelector('link[href*="'+path+'"]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href=path+'?v=135-menu-final';
    document.head.appendChild(link);
  }
  function ensureCss(){
    loadCss('css/sdc-v130-receipts-clean.css');
    loadCss('css/sdc-v131-s24-ui-final.css');
    loadCss('css/sdc-v132-actions-bottom-final.css');
    loadCss('css/sdc-v133-desktop-final.css');
    loadCss('css/sdc-v134-large-mobile-final.css');
  }
  function toast(msg){
    var el=document.getElementById('toast');
    if(!el) return;
    el.textContent=msg;
    el.classList.add('show');
    clearTimeout(el._v135);
    el._v135=setTimeout(function(){el.classList.remove('show');},2200);
  }
  function closeMenu(){document.body.classList.remove('sdc-menu-open-v116');}
  function go(page){
    closeMenu();
    document.querySelectorAll('.sdc-menu-modal-v116').forEach(function(x){x.remove();});
    if(window.SDCSetPageV97) window.SDCSetPageV97(page,{smooth:false});
    else { localStorage.setItem('sdc_v97_page',page); location.reload(); }
  }
  function action(name){return document.querySelector('[data-action="'+name+'"]');}
  function run(name,page,message){
    go(page||'inicio');
    setTimeout(function(){
      var btn=action(name);
      if(btn){ btn.click(); return; }
      toast(message || 'Accion no disponible.');
    },180);
  }
  function openPanel(title,body){
    closeMenu();
    document.querySelectorAll('.sdc-menu-modal-v116').forEach(function(x){x.remove();});
    var div=document.createElement('div');
    div.className='sdc-menu-modal-v116';
    div.innerHTML='<section class="sdc-menu-modal-card-v116" role="dialog"><header class="sdc-menu-modal-head-v116"><h3>'+title+'</h3><button type="button" data-v135-close>×</button></header><div class="sdc-menu-modal-body-v116">'+body+'</div></section>';
    div.addEventListener('click',function(e){ if(e.target===div || e.target.closest('[data-v135-close]')) div.remove(); });
    document.body.appendChild(div);
  }
  function read(){try{return window.SDCStore&&window.SDCStore.load?window.SDCStore.load():JSON.parse(localStorage.getItem('sdc_control_ventas_v90')||'{}');}catch(e){return {};}}
  function num(v){return Number(v)||0;}
  function money(v){return 'Lps. '+num(v).toLocaleString('es-HN',{maximumFractionDigits:0});}
  function stock(p){return Array.isArray(p.colors)?p.colors.reduce(function(a,r){return a+num(r.qty);},0):num(p.stock);}
  function total(s){return num(s.total)||num(s.grandTotal)||0;}
  function today(d){var a=new Date(d||Date.now()),b=new Date();return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
  function gains(){
    var s=read(),p=s.products||[],sales=s.sales||[];
    var inv=0,est=0;
    p.forEach(function(x){inv+=num(x.cost)*stock(x);est+=(num(x.price)-num(x.cost))*stock(x);});
    var day=sales.filter(function(x){return today(x.date);}).reduce(function(a,x){return a+total(x);},0);
    openPanel('Ganancias','<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Ganancia estimada</span><b>'+money(est)+'</b></div><div class="sdc-mini-stat-v116"><span>Invertido</span><b>'+money(inv)+'</b></div><div class="sdc-mini-stat-v116"><span>Venta hoy</span><b>'+money(day)+'</b></div><div class="sdc-mini-stat-v116"><span>Productos</span><b>'+p.length+'</b></div></div>');
  }
  function receipts(){
    var s=read(),sales=s.sales||[],day=sales.filter(function(x){return today(x.date);});
    openPanel('Recibos / Caja','<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Recibos total</span><b>'+sales.length+'</b></div><div class="sdc-mini-stat-v116"><span>Recibos hoy</span><b>'+day.length+'</b></div><div class="sdc-mini-stat-v116"><span>Ventas hoy</span><b>'+money(day.reduce(function(a,x){return a+total(x);},0))+'</b></div></div>');
  }
  function alerts(){
    var p=(read().products||[]),count=0;
    p.forEach(function(x){if(stock(x)<=3)count++; if(!String(x.image||x.gallery||'').trim())count++;});
    openPanel('Alertas','<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Total alertas</span><b>'+count+'</b></div><div class="sdc-mini-stat-v116"><span>Productos</span><b>'+p.length+'</b></div></div>');
  }
  function quotes(){
    var q=(read().quotes||[]);
    openPanel('Cotizaciones','<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Cotizaciones guardadas</span><b>'+q.length+'</b></div></div>');
  }
  var busy=false;
  function handle(a){
    if(a==='open') return;
    if(a==='close') return closeMenu();
    if(busy) return;
    busy=true; setTimeout(function(){busy=false;},700);
    if(a==='inicio') return go('inicio');
    if(a==='productos') return go('productos');
    if(a==='vender') return run('sell','inicio','No encontre Vender ahora.');
    if(a==='cotizar') return run('quote','inicio','No encontre Cotizar.');
    if(a==='nuevo') return run('newProduct','productos','No encontre Nuevo producto.');
    if(a==='ganancias') return gains();
    if(a==='recibos') return action('receipts')?run('receipts','inicio'):receipts();
    if(a==='alertas') return action('notifications')?run('notifications','inicio'):alerts();
    if(a==='cotizaciones') return action('quotes')?run('quotes','inicio'):quotes();
  }
  function boot(){
    ensureCss();
    document.addEventListener('click',function(e){
      var n=e.target.closest('[data-sdc127]');
      if(!n) return;
      var a=n.getAttribute('data-sdc127');
      if(a==='open') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      handle(a);
    },true);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
