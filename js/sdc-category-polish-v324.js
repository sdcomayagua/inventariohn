/* v324 · Pulido dinámico para modal y PNG de categorías.
   No cambia inventario, precios ni cálculos. */
(function(){
  'use strict';
  var scheduled=false;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }

  function looksLikeCategoryCapture(el){
    if(!el || !el.querySelectorAll) return false;
    var t=txt(el);
    return /SD\s*COMAYAGUA/i.test(t) && /Vista\s+r[aá]pida\s+para\s+cliente/i.test(t) && /Productos\s+disponibles\s+para\s+cotizar/i.test(t);
  }

  function topCaptureRoot(node){
    var el=node;
    var best=node;
    for(var i=0;i<8 && el && el.parentElement;i++,el=el.parentElement){
      if(looksLikeCategoryCapture(el)) best=el;
      var w=el.offsetWidth || 0;
      var h=el.offsetHeight || 0;
      if(w>900 && h>500 && looksLikeCategoryCapture(el)) best=el;
    }
    return best;
  }

  function addTitle(root){
    if(!root || root.querySelector('.sdc324-category-capture-title')) return;
    var title=document.createElement('div');
    title.className='sdc324-category-capture-title';
    title.innerHTML='SD COMAYAGUA · CATÁLOGO<small>Productos disponibles para cotizar</small>';
    root.insertBefore(title, root.firstChild);
  }

  function polishHeader(root){
    if(!root) return;
    var candidates=Array.from(root.querySelectorAll('header,section,div')).filter(function(el){
      var t=txt(el);
      return /SD\s*COMAYAGUA/i.test(t) && /Vista\s+r[aá]pida\s+para\s+cliente/i.test(t);
    });
    var head=candidates.find(function(el){ return (el.offsetHeight||0)>70 && (el.offsetWidth||0)>400; }) || candidates[0];
    if(head) head.classList.add('sdc324-category-capture-header');
  }

  function polishPrices(root){
    if(!root) return;
    root.querySelectorAll('b,strong,span,div,h2,h3').forEach(function(el){
      var t=txt(el);
      if(/^Lps\.\s*\d+/i.test(t) && t.length<18){
        el.classList.add('sdc324-category-capture-price');
      }
    });
  }

  function polishProductCards(root){
    if(!root) return;
    var cards=Array.from(root.querySelectorAll('article,section,div')).filter(function(el){
      if(el.classList.contains('sdc324-category-capture-header')) return false;
      var t=txt(el);
      return /^DISPONIBLE/i.test(t) || (/Lps\.\s*\d+/i.test(t) && el.querySelector('img') && t.length>20);
    });
    cards.forEach(function(card){
      var w=card.offsetWidth || 0;
      var h=card.offsetHeight || 0;
      if(w>180 && h>160) card.classList.add('sdc324-category-product-card');
    });
  }

  function polishCapture(root){
    if(!root || root.dataset.sdc324Capture==='1') return;
    root.dataset.sdc324Capture='1';
    root.classList.add('sdc324-category-capture');
    addTitle(root);
    polishHeader(root);
    polishPrices(root);
    polishProductCards(root);
  }

  function polishCategoryCaptures(){
    Array.from(document.querySelectorAll('body *')).forEach(function(el){
      if(el.dataset && el.dataset.sdc324Checked==='1') return;
      if(el.dataset) el.dataset.sdc324Checked='1';
      if(looksLikeCategoryCapture(el)){
        polishCapture(topCaptureRoot(el));
      }
    });
  }

  function polishCategorySheet(){
    document.querySelectorAll('.category-sheet-grid-v199').forEach(function(grid){
      grid.classList.add('sdc324-category-grid-fixed');
      var first=grid.querySelector('.category-sheet-card-v199');
      if(first) first.classList.add('sdc324-all-categories-card');
    });
  }

  function polish(){
    polishCategorySheet();
    polishCategoryCaptures();
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      polish();
    });
  }

  function start(){
    polish();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('click',function(ev){
      if(ev.target.closest && ev.target.closest('[data-catcapture-v199], [data-action="categoryCapture"]')){
        setTimeout(polish,20);
        setTimeout(polish,120);
        setTimeout(polish,320);
      }
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
