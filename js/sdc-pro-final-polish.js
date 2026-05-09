/* SD COMAYAGUA · capa final de interacción visual */
(function(){
  'use strict';

  function $(s,root){return (root||document).querySelector(s);}
  function $$(s,root){return Array.from((root||document).querySelectorAll(s));}
  function addClass(){ if(document.body) document.body.classList.add('sdc-polished'); }
  function setVH(){ document.documentElement.style.setProperty('--sdc-real-vh', (window.innerHeight * 0.01) + 'px'); }
  function text(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function toast(msg){
    const t=$('#toast');
    if(!t) return;
    t.textContent=msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t=setTimeout(function(){t.classList.remove('show');},2600);
  }
  function markSelectedCard(card){
    if(!card) return;
    card.classList.add('sdc-just-selected');
    clearTimeout(card._sdcSelectedTimer);
    card._sdcSelectedTimer=setTimeout(function(){card.classList.remove('sdc-just-selected');},1900);
  }
  function showQuoteNotice(name){
    setTimeout(function(){
      const notice=$('#cartNotice');
      if(notice){
        notice.classList.remove('hide');
        notice.innerHTML='<b>✓ Artículo seleccionado</b><span>'+escapeHtml(name || 'Producto agregado correctamente')+'</span>';
        clearTimeout(window.__sdcFinalQuoteNotice);
        window.__sdcFinalQuoteNotice=setTimeout(function(){notice.classList.add('hide');},3200);
      }
      toast('Artículo seleccionado para cotización.');
    },180);
  }
  function escapeHtml(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
  }

  document.addEventListener('click',function(ev){
    const btn=ev.target.closest('[data-action]');
    if(!btn) return;
    const action=btn.dataset.action;
    if(action==='quoteProduct'){
      const card=btn.closest('.product-card');
      const name=text(card && card.querySelector('.product-title')) || 'Producto';
      markSelectedCard(card);
      showQuoteNotice(name);
    }
    if(action==='cardClient') setTimeout(function(){toast('Vista cliente activada para preparar fotos y precios.');},120);
    if(action==='captureClean') setTimeout(function(){
      const active=document.body.classList.contains('capture-clean');
      toast(active ? 'Modo captura activo. Toque SALIR para volver.' : 'Vista normal restaurada.');
    },160);
  },true);

  document.addEventListener('input',function(ev){
    if(ev.target && ev.target.id==='searchInput'){
      document.body.classList.add('sdc-searching');
      clearTimeout(document.body._sdcSearchingTimer);
      document.body._sdcSearchingTimer=setTimeout(function(){document.body.classList.remove('sdc-searching');},700);
    }
  },true);

  const obs=new MutationObserver(function(){addClass();});
  function start(){
    addClass();
    setVH();
    if(document.body) obs.observe(document.body,{childList:true,subtree:false});
  }
  window.addEventListener('resize',setVH,{passive:true});
  window.addEventListener('orientationchange',function(){setTimeout(setVH,250);},{passive:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
