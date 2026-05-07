(function(){
  const VERSION = 'Control Pro';
  const STORE_KEY = (window.SDCStore && window.SDCStore.KEY) || 'sdc_control_ventas_v90';
  const $ = (s,r=document)=>r.querySelector(s);
  const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
  let menuOpen = false;

  function safeJSON(raw,fallback){ try{return JSON.parse(raw)}catch(e){return fallback} }
  function state(){ return safeJSON(localStorage.getItem(STORE_KEY), {}) || {}; }
  function money(n){ return 'Lps. ' + Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0}); }
  function num(n){ return Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0}); }
  function todayISO(x){
    if(!x) return false;
    const d = new Date(x), t = new Date();
    return d.getFullYear()===t.getFullYear() && d.getMonth()===t.getMonth() && d.getDate()===t.getDate();
  }
  function clean(v){ return String(v||'').trim(); }
  function productImage(p){ return clean(p.image || p.imagen || '').length>5 || clean(p.gallery || p.galeria || '').length>5; }
  function calcQuality(s){
    const products = Array.isArray(s.products)?s.products:[];
    const total = products.length || 1;
    const withImage = products.filter(productImage).length;
    const withDesc = products.filter(p=>clean(p.description||p.descripcion).length>=24).length;
    const withCost = products.filter(p=>Number(p.cost||p.costo)>0).length;
    const withStock = products.filter(p=>Number(p.stock)>0).length;
    const low = products.filter(p=>Number(p.stock)>0 && Number(p.stock)<=Number((s.settings&&s.settings.lowStockLimit)||3)).length;
    const out = products.filter(p=>Number(p.stock)<=0).length;
    const score = Math.round(((withImage/total)*.26 + (withDesc/total)*.24 + (withCost/total)*.24 + (withStock/total)*.26) * 100);
    return {products,total,withImage,withDesc,withCost,withStock,low,out,score};
  }
  function salesTodayTotal(s){
    const list = Array.isArray(s.sales)?s.sales:[];
    return list.filter(x=>todayISO(x.date)).reduce((a,x)=>a+Number(x.total || x.grandTotal || 0),0);
  }
  function pendingQuotes(s){ return (Array.isArray(s.quotes)?s.quotes:[]).filter(q=>!/(vendido|cancelado)/i.test(q.status||'')).length; }
  function clickAction(action){
    const btn = document.querySelector(`[data-action="${action}"]`);
    if(btn){ btn.click(); return true; }
    notice('Abrí el módulo desde el menú principal.');
    return false;
  }
  function notice(msg){
    let n = $('.v39-toast-note');
    if(!n){ n=document.createElement('div'); n.className='v39-toast-note no-print'; document.body.appendChild(n); }
    n.textContent = msg;
    n.classList.add('show');
    clearTimeout(n._t);
    n._t=setTimeout(()=>n.classList.remove('show'),2800);
  }
  function nextRecommended(q,s){
    if(q.low>0) return {title:'Reponer bajo stock', text:`${num(q.low)} producto(s) están cerca de agotarse. Revisalos antes de seguir vendiendo.`, action:'lowStock', label:'Ver bajo stock'};
    if(q.out>0) return {title:'Ocultar o reponer agotados', text:`${num(q.out)} producto(s) aparecen sin stock. Evita cotizar artículos no disponibles.`, action:'catalog', label:'Abrir catálogo'};
    if(q.withCost<q.total) return {title:'Completar costos', text:`${num(q.total-q.withCost)} producto(s) no tienen costo. Eso afecta las ganancias reales.`, action:'noCost', label:'Completar costos'};
    if(pendingQuotes(s)>0) return {title:'Dar seguimiento', text:`Tenés ${num(pendingQuotes(s))} cotización(es) activas. Podés convertirlas en venta o enviar recordatorio.`, action:'quotes', label:'Ver cotizaciones'};
    return {title:'Listo para vender', text:'La página se ve estable. Podés usar venta rápida o cotizar desde el celular.', action:'quickSale', label:'Venta rápida'};
  }
  function auditClass(ok,warn){ return ok ? 'good' : (warn ? 'warn' : 'danger'); }
  function panelKey(){
    const s = state();
    const q = calcQuality(s);
    return [q.score,q.withImage,q.withDesc,q.withCost,q.low,q.out,pendingQuotes(s),salesTodayTotal(s),clean(s.settings && s.settings.syncPin)?'pin':clean(s.settings && s.settings.syncUrl)?'url':'local'].join('-');
  }
  function commandCenterHTML(){
    const s = state();
    const q = calcQuality(s);
    const key = panelKey();
    const rec = nextRecommended(q,s);
    const today = salesTodayTotal(s);
    const cloud = clean(s.settings && s.settings.syncPin) ? 'Activa' : (clean(s.settings && s.settings.syncUrl) ? 'PIN pendiente' : 'Local');
    return `<section class="v39-command-center no-print" data-v39-panel data-v39-key="${key}">
      <div class="v39-command-head">
        <div class="v39-command-title"><small>SDC CONTROL PRO</small><b>Auditoría de calidad</b></div>
        <div class="v39-score"><strong>${num(q.score)}%</strong><span>Calidad</span></div>
      </div>
      <div class="v39-command-grid">
        <div class="v39-action-card">
          <small>Acción recomendada</small>
          <b>${rec.title}</b>
          <p>${rec.text}</p>
          <button data-v39-action="${rec.action}">${rec.label}</button>
        </div>
        <div class="v39-audit-card">
          <small>Revisión rápida</small>
          <div class="v39-audit-list">
            <div class="v39-audit-row ${auditClass(q.withImage===q.total,q.withImage>=q.total*.7)}"><span>Productos con imagen</span><b>${num(q.withImage)}/${num(q.total)}</b></div>
            <div class="v39-audit-row ${auditClass(q.withDesc===q.total,q.withDesc>=q.total*.7)}"><span>Descripción completa</span><b>${num(q.withDesc)}/${num(q.total)}</b></div>
            <div class="v39-audit-row ${auditClass(q.withCost===q.total,q.withCost>=q.total*.7)}"><span>Costos registrados</span><b>${num(q.withCost)}/${num(q.total)}</b></div>
            <div class="v39-audit-row ${q.low||q.out?'warn':'good'}"><span>Stock bajo / agotado</span><b>${num(q.low)} / ${num(q.out)}</b></div>
          </div>
        </div>
      </div>
      <div class="v39-shortcuts">
        <button data-v39-action="quickSale"><i>⚡</i>Venta<span>${money(today)} hoy</span></button>
        <button data-v39-action="quote"><i>🧾</i>Cotizar<span>${num(pendingQuotes(s))} activas</span></button>
        <button data-v39-action="cloudSetup"><i>☁</i>Nube<span>${cloud}</span></button>
        <button data-v39-action="backup"><i>🛡</i>Backup<span>Todo</span></button>
      </div>
    </section>`;
  }
  function insertCommandCenter(){
    const app = $('#app');
    if(!app || $('.login-card')) return;
    const existing = $('[data-v39-panel]');
    const anchor = $('.pulse-v38') || $('.route-v38') || $('.hero-v35');
    if(!anchor) return;
    const key = panelKey();
    if(existing && existing.getAttribute('data-v39-key') === key) return;
    const html = commandCenterHTML();
    if(existing){ existing.outerHTML = html; return; }
    anchor.insertAdjacentHTML('afterend', html);
  }
  function versionPolish(){
    document.body.classList.add('sdc-ready-v39');
    $$('.top-title p').forEach(p=>{ p.innerHTML = p.innerHTML.replace(/\s·\sV3\d/g, '').replace(/V3\d/g, VERSION); });
    const old = $('.elite-v38-badge');
    if(old) old.textContent = 'SDC ' + VERSION;
  }
  function enhanceShareAndDocs(){
    $$('#productShareCard:not([data-v39])').forEach(card=>{
      card.dataset.v39='1'; card.classList.add('share-v39-ready');
      if(!$('.v39-client-seal',card)){
        card.insertAdjacentHTML('beforeend','<div class="v39-client-seal"><b>Compra clara:</b> el precio puede variar según cantidad, envío y disponibilidad. Para confirmar pedido se solicita nombre completo, departamento, municipio, número de celular, dirección exacta con referencia y empresa de envío cuando aplique.</div>');
      }
    });
    $$('#printableDoc:not([data-v39])').forEach(doc=>{
      doc.dataset.v39='1'; doc.classList.add('doc-v39-ready');
      if(!$('.v39-doc-seal',doc)){
        doc.insertAdjacentHTML('beforeend','<div class="v39-doc-seal"><b>Nota de control:</b> este documento fue preparado por SD COMAYAGUA. El pedido se confirma por WhatsApp antes del despacho. Conservar el código de cotización o factura para seguimiento.</div>');
      }
    });
  }
  function addFloatingMenu(){
    if($('.v39-fab')) return;
    const fab = document.createElement('button');
    fab.className = 'v39-fab no-print';
    fab.type = 'button';
    fab.textContent = 'SD';
    fab.setAttribute('aria-label','Asistente rápido SDC');
    const menu = document.createElement('div');
    menu.className = 'v39-menu no-print';
    menu.innerHTML = `<div class="v39-menu-head"><img src="assets/logo-sdc.png" alt="SD"><div><b>Acceso rápido</b><span>Herramientas privadas de operación</span></div></div><div class="v39-menu-grid"><button data-v39-action="quickSale">⚡ Venta<small>rápida</small></button><button data-v39-action="quote">🧾 Cotizar<small>cliente</small></button><button data-v39-action="cardClient">👁 Cliente<small>vista limpia</small></button><button data-v39-action="density">▣ Espacio<small>compacto</small></button><button data-v39-action="cloudSetup">☁ Nube<small>estado</small></button><button data-v39-action="backup">🛡 Backup<small>todo</small></button></div>`;
    document.body.appendChild(fab); document.body.appendChild(menu);
    fab.addEventListener('click',()=>{ menuOpen=!menuOpen; menu.classList.toggle('open',menuOpen); });
    document.addEventListener('click',e=>{
      if(!menuOpen) return;
      if(e.target===fab || menu.contains(e.target)) return;
      menuOpen=false; menu.classList.remove('open');
    },{passive:true});
  }
  function bindActions(){
    document.addEventListener('click',e=>{
      const b = e.target.closest('[data-v39-action]');
      if(!b) return;
      e.preventDefault();
      const action = b.getAttribute('data-v39-action');
      if(menuOpen){ const menu=$('.v39-menu'); menuOpen=false; if(menu) menu.classList.remove('open'); }
      clickAction(action);
      notice('Acción abierta: ' + (b.textContent||action).trim().replace(/\s+/g,' '));
    });
  }
  function run(){
    versionPolish();
    insertCommandCenter();
    enhanceShareAndDocs();
    addFloatingMenu();
  }
  function ready(){
    run(); bindActions();
    const app = $('#app') || document.body;
    new MutationObserver(()=>{ window.requestAnimationFrame(run); }).observe(app,{childList:true,subtree:true});
    window.addEventListener('storage',()=>setTimeout(run,60));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready); else ready();
})();
