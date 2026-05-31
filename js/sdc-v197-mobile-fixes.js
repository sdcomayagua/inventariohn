/* SDC V197 · navegación móvil corregida y aperturas directas */
(function(){
  'use strict';
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const pageMap={inicio:'tabInicio',panel:'tabPanel',productos:'tabProductos'};

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){
      el.textContent=msg;
      el.classList.add('show');
      clearTimeout(el._sdc197);
      el._sdc197=setTimeout(()=>el.classList.remove('show'),2200);
    }
  }
  function closeMenu(){ document.body.classList.remove('sdc-menu-open-v116'); }
  function closeLegacyPanels(){ $$('.sdc-menu-modal-v116').forEach(x=>x.remove()); }
  function closeAllOverlays(){ closeMenu(); closeLegacyPanels(); }
  function modalOpen(){ return !!$('#modalRoot .modal, #modalRoot .modal-backdrop'); }

  function app(){ return window.SDCAppV196 || window.SDCApp || null; }
  function appCall(name,...args){
    try{
      const api=app();
      if(api && typeof api[name]==='function'){
        api[name](...args);
        return true;
      }
    }catch(err){
      console.error('[SDC V197]',name,err);
    }
    return false;
  }
  function clickAction(action){
    const btn=document.querySelector(`[data-action="${action}"]`);
    if(btn){ btn.click(); return true; }
    return false;
  }
  function goPage(page){
    closeAllOverlays();
    try{ localStorage.setItem('sdc_v150_page',page); }catch(err){}
    if(appCall('setPage',page) || (window.SDCSetPageV150 && (window.SDCSetPageV150(page), true))){
      requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));
      return true;
    }
    const btn=document.querySelector(`[data-action="${pageMap[page]||pageMap.inicio}"]`);
    if(btn){ btn.click(); requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'})); return true; }
    return false;
  }

  function runOpen(methodName, fallbackAction, page='inicio'){
    closeAllOverlays();
    if(appCall(methodName)) return true;
    if(clickAction(fallbackAction)) return true;
    goPage(page);
    let done=false;
    const tries=[80,180,320,520];
    tries.forEach(delay=>setTimeout(()=>{
      if(done || modalOpen()) return;
      if(appCall(methodName) || clickAction(fallbackAction)) done=true;
    },delay));
    return true;
  }

  function handleAction(action){
    switch(action){
      case 'inicio': return goPage('inicio');
      case 'panel': return goPage('panel');
      case 'productos': return goPage('productos');
      case 'nuevo':
      case 'inventario':
        closeAllOverlays();
        if(appCall('openProductEditor')) return true;
        goPage('productos');
        setTimeout(()=>clickAction('newProduct')||toast('Abre Productos para agregar inventario.'),220);
        return true;
      case 'vender': return runOpen('openSale','sell','inicio');
      case 'cotizar': return runOpen('openQuote','quote','inicio');
      case 'ganancias': return runOpen('openProfit','profit','panel');
      case 'recibos': return runOpen('openReceipts','receipts','inicio');
      case 'alertas':
        closeAllOverlays();
        if(appCall('openAlertsV196')) return true;
        if(appCall('openNotifications')) return true;
        goPage('productos');
        setTimeout(()=>appCall('openAlertsV196')||appCall('openNotifications')||clickAction('notifications'),220);
        return true;
      case 'cotizaciones':
        closeAllOverlays();
        if(appCall('openSavedQuotes')) return true;
        goPage('inicio');
        setTimeout(()=>appCall('openSavedQuotes')||clickAction('quotes'),220);
        return true;
      default:
        return false;
    }
  }

  document.addEventListener('click',function(ev){
    const node=ev.target.closest && ev.target.closest('[data-sdc127]');
    if(!node) return;
    const action=(node.getAttribute('data-sdc127')||'').trim();
    if(!action || action==='open' || action==='close') return;
    const handled=handleAction(action);
    if(handled){
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    }
  },true);

  function polish(){
    document.documentElement.style.overflowX='hidden';
    document.body.style.overflowX='hidden';
    $$('.stats .stat b,.panel-stats-v150 article b').forEach(b=>{
      const txt=(b.textContent||'').trim();
      if(/^Lps\./i.test(txt)) b.classList.add('sdc197-money-fit');
    });
    if(modalOpen()) closeLegacyPanels();
  }
  const mo=new MutationObserver(polish);
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{polish(); mo.observe(document.body,{childList:true,subtree:true});});
  }else{
    polish(); mo.observe(document.body,{childList:true,subtree:true});
  }
})();
