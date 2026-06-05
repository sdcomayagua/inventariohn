/* SD Comayagua v194 · Marca visual para imágenes automáticas por categoría. */
(function(){
  'use strict';
  function isCategoryFallback(src){
    const s=String(src||'');
    return s.indexOf('data:image/svg+xml')===0 || s.indexOf('/assets/categorias/')>-1 || s.indexOf('assets/categorias/')>-1;
  }
  function mark(){
    document.querySelectorAll('img').forEach(function(img){
      const src=img.currentSrc || img.getAttribute('src') || '';
      const fallback=isCategoryFallback(src);
      img.classList.toggle('has-category-fallback-v194', fallback);
      const photo=img.closest && img.closest('.product-photo-v178');
      if(photo) photo.classList.toggle('has-category-fallback-v194', fallback);
    });
  }
  var raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(function(){raf=0;mark();});
  }
  function boot(){
    document.body.classList.add('sdc-v194-category-images');
    mark();
    var app=document.getElementById('app') || document.body;
    new MutationObserver(schedule).observe(app,{childList:true,subtree:true,attributes:true,attributeFilter:['src','class']});
    window.addEventListener('load',mark,{once:false,passive:true});
    window.addEventListener('resize',schedule,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
