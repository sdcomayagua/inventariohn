/* SD Comayagua v191 · UX de categorías
   Mantiene visible la categoría activa y agrega polish sin tocar Firebase. */
(function(){
  'use strict';
  function qs(sel,root){return (root||document).querySelector(sel)}
  function qsa(sel,root){return Array.from((root||document).querySelectorAll(sel))}
  function centerActiveCategory(){
    const active=qs('.category-strip-v191 .category-chip-v191.active');
    if(!active) return;
    try{active.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'});}catch(err){}
  }
  function markLongCategoryNames(){
    qsa('.category-chip-v191 span,.category-sheet-card-v191 span').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(txt.length>14) el.dataset.long='1';
      else delete el.dataset.long;
    });
  }
  function focusCategoriesOnce(){
    let shouldFocus=false;
    try{
      shouldFocus=location.hash==='#categorias' || sessionStorage.getItem('sdc_v191_focus_categories')==='1';
      sessionStorage.removeItem('sdc_v191_focus_categories');
    }catch(err){ shouldFocus=location.hash==='#categorias'; }
    if(!shouldFocus || document.body.dataset.sdc191Focused==='1') return;
    const rail=qs('.category-rail-v191');
    if(!rail) return;
    document.body.dataset.sdc191Focused='1';
    window.setTimeout(function(){
      try{rail.scrollIntoView({block:'center',behavior:'smooth'});}catch(err){}
    },360);
  }
  function enhance(){
    document.body.classList.add('sdc-v191-categorias');
    markLongCategoryNames();
    centerActiveCategory();
    focusCategoriesOnce();
  }
  let raf=0;
  const schedule=function(){
    if(raf) return;
    raf=requestAnimationFrame(function(){raf=0;enhance();});
  };
  const mo=new MutationObserver(schedule);
  function boot(){
    enhance();
    const app=document.getElementById('app') || document.body;
    mo.observe(app,{childList:true,subtree:true});
    window.addEventListener('resize',schedule,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
