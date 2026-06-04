/* SD Comayagua · v233 Mobile Retouch helpers */
(function(){
  'use strict';
  function addClass(){
    if(document.body) document.body.classList.add('sdc-v233-retouch');
  }
  function fixViewport(){
    try{ document.documentElement.style.setProperty('--sdc233-vh',(window.innerHeight*0.01)+'px'); }catch(e){}
  }
  function keepProductsHash(){
    const h=(location.hash||'').toLowerCase();
    if((h==='#productos'||h==='#catalogo'||h==='#categorias') && typeof window.SDCSetPageV150==='function'){
      try{ window.SDCSetPageV150('productos'); }catch(e){}
    }
  }
  addClass();
  fixViewport();
  window.addEventListener('resize',fixViewport,{passive:true});
  window.addEventListener('orientationchange',fixViewport,{passive:true});
  window.addEventListener('hashchange',keepProductsHash,{passive:true});
  document.addEventListener('DOMContentLoaded',function(){
    addClass();
    keepProductsHash();
    const app=document.getElementById('app')||document.body;
    try{ new MutationObserver(addClass).observe(app,{childList:true,subtree:true}); }catch(e){}
  });
})();
