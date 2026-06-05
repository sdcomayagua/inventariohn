/* SDC V196 · acciones de menú y estructura final */
(function(){
  'use strict';
  const STORE_KEY='sdc_control_ventas_v90';
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  function toast(msg){
    const el=document.getElementById('toast');
    if(el){ el.textContent=msg; el.classList.add('show'); clearTimeout(el._sdc196); el._sdc196=setTimeout(()=>el.classList.remove('show'),2200); }
  }
  function closeMenu(){ document.body.classList.remove('sdc-menu-open-v116'); }
  function closeMenuPanels(){ $$('.sdc-menu-modal-v116').forEach(x=>x.remove()); }
  function goPage(page){
    closeMenu(); closeMenuPanels();
    if(window.SDCSetPageV150){ window.SDCSetPageV150(page); return true; }
    const map={inicio:'tabInicio',panel:'tabPanel',productos:'tabProductos'};
    const btn=document.querySelector(`[data-action="${map[page]||map.inicio}"]`);
    if(btn){ btn.click(); return true; }
    try{ localStorage.setItem('sdc_v150_page',page); }catch(e){}
    return false;
  }
  function appCall(name,...args){
    const api=window.SDCAppV196||window.SDCApp;
    if(api && typeof api[name]==='function'){ api[name](...args); return true; }
    return false;
  }
  function clickAction(action){
    const btn=document.querySelector(`[data-action="${action}"]`);
    if(btn){ btn.click(); return true; }
    return false;
  }
  function menuAction(action){
    if(!action) return false;
    if(action==='open' || action==='close') return false;
    closeMenu(); closeMenuPanels();
    switch(action){
      case 'inicio': return goPage('inicio');
      case 'productos': return goPage('productos');
      case 'nuevo':
      case 'inventario':
        if(appCall('openProductEditor')) return true;
        goPage('productos'); setTimeout(()=>clickAction('newProduct')||toast('Toca + Producto para agregar inventario.'),220); return true;
      case 'vender':
        if(appCall('openSale')) return true;
        if(clickAction('sell')) return true;
        toast('No se pudo abrir Vender todavía. Recarga la página e intenta de nuevo.'); return true;
      case 'cotizar':
        if(appCall('openQuote')) return true;
        if(clickAction('quote')) return true;
        toast('No se pudo abrir Cotizar todavía. Recarga la página e intenta de nuevo.'); return true;
      case 'ganancias':
        if(appCall('openProfit')) return true;
        if(clickAction('profit')) return true;
        return false;
      case 'recibos':
        if(appCall('openReceipts')) return true;
        if(clickAction('receipts')) return true;
        return false;
      case 'alertas':
        if(appCall('openAlertsV196')) return true;
        if(appCall('openNotifications')) return true;
        if(clickAction('notifications')) return true;
        return false;
      case 'cotizaciones':
        if(appCall('openSavedQuotes')) return true;
        if(clickAction('quotes')) return true;
        return false;
      default: return false;
    }
  }
  document.addEventListener('click',function(ev){
    const node=ev.target.closest && ev.target.closest('[data-sdc127]');
    if(!node) return;
    const action=node.getAttribute('data-sdc127');
    if(action==='open' || action==='close') return;
    const handled=menuAction(action);
    if(handled){ ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation(); }
  },true);
  function polishAfterRender(){
    document.documentElement.style.overflowY='auto';
    document.body.style.overflowY='auto';
    document.body.style.overflowX='hidden';
    $$('.stats .stat b,.panel-stats-v150 article b').forEach(b=>{
      const txt=(b.textContent||'').trim();
      if(/^Lps\.\s*/i.test(txt)) b.classList.add('sdc196-money-fit');
    });
    $$('.sdc-menu-modal-v116').forEach(m=>m.setAttribute('data-sdc196','polished'));
  }
  const mo=new MutationObserver(()=>polishAfterRender());
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{polishAfterRender(); mo.observe(document.body,{childList:true,subtree:true});});
  else {polishAfterRender(); mo.observe(document.body,{childList:true,subtree:true});}
})();
