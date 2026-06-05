/* SD Comayagua · v231 Quality helpers */
(function(){
  'use strict';

  function setViewportUnit(){
    try{ document.documentElement.style.setProperty('--sdc231-vh', (window.innerHeight * 0.01) + 'px'); }catch(err){}
  }

  function cleanDuplicatedHomeText(){
    document.querySelectorAll('.sdc209-welcome').forEach(box=>{
      const seen=new Set();
      box.querySelectorAll('small').forEach(el=>{
        const text=(el.textContent||'').trim().toLowerCase();
        if(!text) return;
        if(seen.has(text)) el.remove();
        else seen.add(text);
      });
    });
  }

  function improveClickableCards(){
    document.querySelectorAll('article.product-card[data-id]').forEach(card=>{
      if(!card.hasAttribute('tabindex')) card.setAttribute('tabindex','0');
      if(!card.hasAttribute('role')) card.setAttribute('role','button');
      const name=(card.dataset.productName || card.querySelector('h3')?.textContent || '').trim();
      if(name && !card.getAttribute('aria-label')) card.setAttribute('aria-label','Abrir detalle de '+name);
    });
  }

  function routeFromHash(){
    const hash=(location.hash||'').replace('#','').trim().toLowerCase();
    const map={inicio:'inicio',home:'inicio',panel:'panel',productos:'productos',producto:'productos',catalogo:'productos','catálogo':'productos'};
    if(map[hash] && typeof window.SDCSetPageV150==='function'){
      try{ window.SDCSetPageV150(map[hash]); }catch(err){}
    }
  }

  function markScrollableModals(){
    const root=document.getElementById('modalRoot');
    if(!root) return;
    root.querySelectorAll('.modal-backdrop').forEach(x=>x.classList.add('sdc-v231-backdrop'));
    root.querySelectorAll('.modal').forEach(x=>x.classList.add('sdc-v231-modal'));
  }

  function polish(){
    document.body.classList.add('sdc-v231-quality');
    cleanDuplicatedHomeText();
    improveClickableCards();
    markScrollableModals();
  }

  setViewportUnit();
  window.addEventListener('resize', setViewportUnit, {passive:true});
  window.addEventListener('orientationchange', setViewportUnit, {passive:true});
  window.addEventListener('hashchange', routeFromHash, {passive:true});

  document.addEventListener('DOMContentLoaded', function(){
    polish();
    routeFromHash();
    const app=document.getElementById('app') || document.body;
    try{
      new MutationObserver(function(){ polish(); }).observe(app,{childList:true,subtree:true});
    }catch(err){}
  });
})();
