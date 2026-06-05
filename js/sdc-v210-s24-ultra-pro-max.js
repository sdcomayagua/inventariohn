
/* SD Comayagua · v210 App Premium Final */
(function(){
  'use strict';

  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const KEY='sdc_control_ventas_v90';
  const steps=[
    ['products','Productos','📦'],
    ['list','Lista','🧾'],
    ['client','Cliente','👤'],
    ['preview','Vista','👁'],
    ['send','Enviar','↗']
  ];

  function safeState(){
    try{
      if(window.SDCStore && typeof window.SDCStore.load==='function') return window.SDCStore.load();
      return JSON.parse(localStorage.getItem(KEY)||'{}')||{};
    }catch(e){ return {}; }
  }

  function money(n){
    const v=Math.round(Number(n)||0);
    return `Lps. ${v.toLocaleString('es-HN')}`;
  }

  function productStock(p){
    if(!p) return 0;
    if(Array.isArray(p.colors)){
      return p.colors.reduce((a,c)=>a+(Number(c.qty)||0),0);
    }
    if(Array.isArray(p.colorRows)){
      return p.colorRows.reduce((a,c)=>a+(Number(c.qty)||0),0);
    }
    return Number(p.stock ?? p.qty ?? p.quantity ?? p.cantidad ?? 0) || 0;
  }

  function productPrice(p){
    return Number(p?.price ?? p?.precio ?? p?.salePrice ?? 0) || 0;
  }

  function productCost(p){
    return Number(p?.cost ?? p?.costo ?? 0) || 0;
  }

  function productImage(p){
    return String(p?.image || p?.foto || p?.img || p?.photo || '').trim();
  }

  function isHidden(p){
    return p?.hidden || p?.oculto || p?.visible===false || p?.status==='hidden';
  }

  function realProducts(){
    const st=safeState();
    return (st.products||[]).filter(p=>p && !isHidden(p));
  }

  function todaySales(){
    const st=safeState();
    const today=new Date().toLocaleDateString('es-HN');
    return (st.sales||[]).filter(s=>{
      try{return new Date(s.date||s.createdAt||0).toLocaleDateString('es-HN')===today}catch(e){return false}
    });
  }

  function calcMetrics(){
    const products=realProducts();
    const units=products.reduce((a,p)=>a+productStock(p),0);
    const saleValue=products.reduce((a,p)=>a+productStock(p)*productPrice(p),0);
    const invested=products.reduce((a,p)=>a+productStock(p)*productCost(p),0);
    const today=todaySales();
    const soldToday=today.reduce((a,s)=>a+Number(s.total||s.amount||0),0);
    const low=products.filter(p=>productStock(p)>0 && productStock(p)<=2).length;
    const out=products.filter(p=>productStock(p)<=0).length;
    const noImg=products.filter(p=>!productImage(p)).length;
    const zeroProfit=products.filter(p=>productPrice(p)>0 && productPrice(p)-productCost(p)<=0).length;
    return {products,units,saleValue,invested,profit:saleValue-invested,today,soldToday,low,out,noImg,zeroProfit};
  }

  function toast(msg){
    if(window.SDCApp && typeof window.SDCApp.toast==='function') return window.SDCApp.toast(msg);
    const el=document.getElementById('toast');
    if(el){ el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2400); }
  }

  function clickAction(action){
    const el=$$(`[data-action="${CSS.escape(action)}"]`).find(x=>x.offsetParent!==null) || $(`[data-action="${CSS.escape(action)}"]`);
    if(el){ el.click(); return true; }
    return false;
  }

  function runAction(action){
    const api=window.SDCApp||{};
    if(action==='quote' && typeof api.openQuote==='function') return api.openQuote();
    if(action==='sell' && typeof api.openSale==='function') return api.openSale();
    if(action==='products'){
      if(typeof api.setPage==='function') return api.setPage('productos');
      return clickAction('tabProductos');
    }
    if(action==='inicio'){
      if(typeof api.setPage==='function') return api.setPage('inicio');
      return clickAction('tabInicio');
    }
    if(action==='receipts' && typeof api.openReceipts==='function') return api.openReceipts();
    if(action==='categories' && typeof api.openCategoriesSheet==='function') return api.openCategoriesSheet();
    if(action==='alerts') return openSmartAlerts();
    if(action==='client') return toggleClientMode();
  }

  function ensureS24Panel(){
    const app=document.getElementById('app');
    if(!app || document.querySelector('#modalRoot .modal')) return;

    let panel=document.querySelector('.sdc210-s24-panel');
    const m=calcMetrics();

    const html=`<div class="sdc210-panel-head">
      <div><span>Accesos rápidos</span><b>Panel de ventas</b></div>
      <button type="button" class="sdc210-mode-pill" data-sdc210="client">${document.body.classList.contains('sdc210-client-mode')?'Cliente activo':'Modo cliente'}</button>
    </div>
    <div class="sdc210-action-grid">
      <button class="primary" type="button" data-sdc210="sell"><i>⚡</i><b>Nueva venta</b><small>factura real</small></button>
      <button type="button" data-sdc210="quote"><i>🧾</i><b>Cotizar</b><small>previa para cliente</small></button>
      <button type="button" data-sdc210="products"><i>▦</i><b>Catálogo</b><small>productos</small></button>
      <button type="button" data-sdc210="alerts"><i>🔔</i><b>Alertas</b><small>${m.low+m.out+m.noImg} pendientes</small></button>
    </div>
    <div class="sdc210-mini-metrics">
      <article><b>${m.products.length}</b><span>productos</span></article>
      <article><b>${m.units}</b><span>unidades</span></article>
      <article><b>${money(m.soldToday)}</b><span>ventas hoy</span></article>
    </div>`;

    if(panel){
      panel.innerHTML=html;
      return;
    }

    panel=document.createElement('section');
    panel.className='sdc210-s24-panel no-print';
    panel.innerHTML=html;

    // Insertar después de la cabecera principal si existe; si no, al inicio.
    const anchor=app.querySelector('.sdc-hero-v178,.home-hero,.hero-card,.sdc-header,.brand-hero') || app.firstElementChild;
    if(anchor && anchor.parentNode===app) anchor.insertAdjacentElement('afterend',panel);
    else app.insertBefore(panel,app.firstChild);

    panel.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-sdc210]');
      if(!btn) return;
      ev.preventDefault();
      runAction(btn.dataset.sdc210);
    });
  }

  function toggleClientMode(){
    document.body.classList.toggle('sdc210-client-mode');
    const on=document.body.classList.contains('sdc210-client-mode');
    try{ localStorage.setItem('sdc210_client_mode', on?'1':'0'); }catch(e){}
    toast(on?'Modo cliente activado: se oculta información interna.':'Modo cliente desactivado.');
    ensureS24Panel();
  }

  function restoreClientMode(){
    try{
      if(localStorage.getItem('sdc210_client_mode')==='1') document.body.classList.add('sdc210-client-mode');
    }catch(e){}
  }

  function openSmartAlerts(){
    const api=window.SDCApp||{};
    const products=realProducts();
    const groups=[
      ['Bajo stock','Quedan 1 o 2 unidades',products.filter(p=>productStock(p)>0 && productStock(p)<=2),'⚠️'],
      ['Agotados','Stock en cero',products.filter(p=>productStock(p)<=0),'⛔'],
      ['Sin imagen','Necesitan foto o imagen automática',products.filter(p=>!productImage(p)),'🖼️'],
      ['Ganancia en cero','Revisar costo/precio',products.filter(p=>productPrice(p)>0 && productPrice(p)-productCost(p)<=0),'💵']
    ];

    const body=groups.map(([title,desc,list,icon])=>{
      const rows=list.slice(0,6).map(p=>`<div class="sdc210-alert-row">
        <div><b>${escapeHtml(p.name||'Producto')}</b><span>Stock ${productStock(p)} · Precio ${money(productPrice(p))}</span></div>
        <button type="button" data-sdc210-edit="${escapeHtml(p.id||'')}">Editar</button>
      </div>`).join('') || `<div class="sdc210-alert-row"><div><b>Todo bien</b><span>No hay pendientes en esta sección.</span></div></div>`;
      return `<article class="sdc210-alert-card">
        <header><div><h4>${icon} ${title}</h4><small>${desc}</small></div><span class="count">${list.length}</span></header>
        <div class="sdc210-alert-list">${rows}${list.length>6?`<div class="sdc210-alert-row"><div><b>+${list.length-6} más</b><span>Usa el panel de inventario para revisar el resto.</span></div></div>`:''}</div>
      </article>`;
    }).join('');

    if(typeof window.SDCOpenModalV210==='function') return window.SDCOpenModalV210(body);

    const modalRoot=document.getElementById('modalRoot');
    if(!modalRoot){ if(typeof api.openNotifications==='function') return api.openNotifications(); return; }
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal wide">
      <div class="modal-head"><h3>Alertas inteligentes</h3><button class="close">×</button></div>
      <div class="modal-body"><div class="sdc210-alert-grid">${body}</div></div>
    </div></div>`;
    modalRoot.querySelector('.close')?.addEventListener('click',()=>{modalRoot.innerHTML='';});
    modalRoot.querySelector('.modal-backdrop')?.addEventListener('click',ev=>{ if(ev.target.classList.contains('modal-backdrop')) modalRoot.innerHTML=''; });
    modalRoot.querySelectorAll('[data-sdc210-edit]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const id=btn.getAttribute('data-sdc210-edit');
        modalRoot.innerHTML='';
        if(id && api.openProductEditor) api.openProductEditor(id);
      });
    });
  }

  function escapeHtml(v){
    return String(v??'').replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  function getQuoteModal(){
    const modal=$('#modalRoot .modal');
    if(!modal) return null;
    if(!modal.querySelector('.quote-body-v176,#currentDocBox,#pickerCardBox')) return null;
    return modal;
  }

  function readTotals(modal){
    const productsText=modal.querySelector('#productsMini')?.textContent?.trim() || 'Lps. 0';
    const countText=modal.querySelector('#selectedCountPill')?.textContent?.trim() || '0 artículos';
    return {productsText,countText};
  }

  function ensureWizard(){
    const modal=getQuoteModal();
    if(!modal) return;

    const body=modal.querySelector('.quote-body-v176');
    if(!body) return;

    body.classList.add('sdc210-wizard-mode');
    if(!body.dataset.step) body.dataset.step='products';

    if(!body.querySelector('.sdc210-wizard-tabs')){
      const tabs=document.createElement('div');
      tabs.className='sdc210-wizard-tabs no-print';
      tabs.innerHTML=steps.map(([key,label,icon])=>`<button type="button" data-sdc210-step="${key}"><i>${icon}</i><span>${label}</span></button>`).join('');
      const old=body.querySelector('.quote-jumpbar');
      if(old) old.insertAdjacentElement('afterend',tabs);
      else body.insertBefore(tabs,body.firstChild);

      tabs.addEventListener('click',ev=>{
        const btn=ev.target.closest('[data-sdc210-step]');
        if(!btn) return;
        setStep(body,btn.dataset.sdc210Step);
      });
    }

    const grid=body.querySelector('.quote-grid-v176,.modal-grid');
    if(grid && !body.querySelector('.sdc210-step-controls')){
      const controls=document.createElement('div');
      controls.className='sdc210-step-controls no-print';
      controls.innerHTML='<button type="button" data-sdc210-prev>← Anterior</button><button type="button" class="next" data-sdc210-next>Siguiente →</button>';
      grid.insertAdjacentElement('afterend',controls);
      controls.addEventListener('click',ev=>{
        if(ev.target.closest('[data-sdc210-prev]')) moveStep(body,-1);
        if(ev.target.closest('[data-sdc210-next]')) moveStep(body,1);
      });
    }

    if(!body.querySelector('.sdc210-smart-cart')){
      const cart=document.createElement('div');
      cart.className='sdc210-smart-cart hidden no-print';
      cart.innerHTML='<div><b>Carrito</b><span>0 artículos · Lps. 0</span></div><button type="button">Ver lista</button>';
      body.appendChild(cart);
      cart.addEventListener('click',()=>setStep(body,'list'));
    }

    refreshWizard(body);
  }

  function setStep(body,step){
    if(!steps.some(x=>x[0]===step)) step='products';
    body.dataset.step=step;
    refreshWizard(body);
    const scrollers=[body.closest('.modal-backdrop'), body, body.closest('.modal-body'), body.closest('.modal')].filter(Boolean);
    scrollers.forEach(el=>{
      try{ el.scrollTo({top:0,behavior:'smooth'}); }
      catch(err){ el.scrollTop=0; }
    });
  }

  function moveStep(body,dir){
    const current=body.dataset.step || 'products';
    const idx=Math.max(0,steps.findIndex(x=>x[0]===current));
    const next=steps[Math.min(steps.length-1,Math.max(0,idx+dir))][0];
    setStep(body,next);
  }

  function refreshWizard(body){
    const step=body.dataset.step || 'products';
    body.querySelectorAll('[data-sdc210-step]').forEach(btn=>btn.classList.toggle('active',btn.dataset.sdc210Step===step));

    const prev=body.querySelector('[data-sdc210-prev]');
    const next=body.querySelector('[data-sdc210-next]');
    const idx=steps.findIndex(x=>x[0]===step);
    if(prev) prev.disabled=idx<=0;
    if(next) next.textContent=idx>=steps.length-1?'Listo':'Siguiente →';

    const modal=body.closest('.modal');
    const cart=body.querySelector('.sdc210-smart-cart');
    if(cart && modal){
      const {productsText,countText}=readTotals(modal);
      const has=!/^0\s/.test(countText) && !/^0 artículo/i.test(countText);
      cart.classList.toggle('hidden',!has);
      cart.querySelector('span').textContent=`${countText} · ${productsText}`;
    }
  }

  function polishBottomNav(){
    const nav=document.querySelector('.sdc209-bottom-nav');
    if(!nav) return;
    nav.querySelectorAll('[data-sdc209-nav]').forEach(btn=>{
      const action=btn.getAttribute('data-sdc209-nav');
      if(action==='tabInicio') btn.querySelector('span') && (btn.querySelector('span').textContent='Inicio');
      if(action==='tabProductos') btn.querySelector('span') && (btn.querySelector('span').textContent='Catálogo');
      if(action==='quote') btn.querySelector('span') && (btn.querySelector('span').textContent='Cotizar');
      if(action==='sell') btn.querySelector('span') && (btn.querySelector('span').textContent='Vender');
      if(action==='receipts') btn.querySelector('span') && (btn.querySelector('span').textContent='Caja');
    });
  }

  function polish(){
    document.body.classList.add('sdc-v210-s24');
    restoreClientMode();
    ensureS24Panel();
    ensureWizard();
    polishBottomNav();

    // Evita scroll horizontal por cualquier parche anterior.
    document.documentElement.style.overflowX='hidden';
    document.body.style.overflowX='hidden';
    const app=document.getElementById('app');
    if(app) app.style.overflowX='hidden';

    // Más robustez en valores largos.
    $$('.stats .stat b,.panel-stats-v150 article b,.sdc210-mini-metrics b').forEach(el=>{
      if((el.textContent||'').length>6) el.style.overflowWrap='anywhere';
    });
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;polish();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true});
  else polish();

  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,220),{passive:true});

  const obs=new MutationObserver(schedule);
  if(document.body) obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-step','data-sdc-page-v150']});
})();
