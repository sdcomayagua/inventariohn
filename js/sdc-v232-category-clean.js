/* SD Comayagua · v232
   Al elegir una categoría desde el botón CATEGORÍA, muestra Catálogo/Productos
   y no deja visible el Panel privado de inversión. */
(function(){
  'use strict';

  function goProducts(delay){
    window.setTimeout(function(){
      try{
        localStorage.setItem('sdc_v150_page','productos');
        localStorage.setItem('sdc_v97_page','productos');
      }catch(err){}
      if(typeof window.SDCSetPageV150 === 'function'){
        try{ window.SDCSetPageV150('productos'); return; }catch(err){}
      }
      if(document.body) document.body.dataset.sdcPageV150='productos';
    }, delay || 0);
  }

  document.addEventListener('click', function(ev){
    const target = ev.target && ev.target.closest ? ev.target.closest('[data-catpick-v191],[data-catcard],[data-action="categoryQuick"]') : null;
    if(!target) return;
    goProducts(80);
  }, true);

  document.addEventListener('change', function(ev){
    const el = ev.target;
    if(!el) return;
    if(el.id === 'categorySelect' || el.id === 'inventoryCategorySelect'){
      goProducts(40);
    }
  }, true);

  // Si el usuario entra con #productos o desde categorias.html, forzar catálogo limpio.
  function routeHash(){
    const h=(location.hash||'').toLowerCase();
    if(h==='#productos' || h==='#catalogo' || h==='#categorias') goProducts(10);
  }
  window.addEventListener('hashchange', routeHash, {passive:true});
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', routeHash, {once:true});
  else routeHash();
})();
