/* SD Comayagua v190 · Mobile polish layer
   No toca Firebase ni datos. Solo mejora lectura, clases y microinteracciones. */
(function(){
  'use strict';
  const root=document.documentElement;
  const body=document.body;
  const reduceMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isMobileWidth(){return window.matchMedia ? window.matchMedia('(max-width: 640px)').matches : window.innerWidth<=640;}
  function markReady(){
    body.classList.add('sdc-v190-ready');
    body.classList.toggle('sdc-v190-phone',isMobileWidth());
    root.dataset.sdcV190='ready';
  }
  function annotateCards(){
    document.querySelectorAll('.product-card-v190').forEach(card=>{
      const title=(card.querySelector('h3')?.textContent || '').trim();
      card.dataset.longTitle=title.length>42?'1':'0';
      const stock=Number(card.dataset.productStock||'0');
      card.dataset.stockLevel=stock<=0?'out':stock<=3?'low':'ok';
    });
  }
  function compactStickyOnScroll(){
    const y=window.scrollY || 0;
    body.classList.toggle('sdc-v190-scrolled',y>36);
    body.classList.toggle('sdc-v190-deep-scroll',y>260);
  }
  function addTapFeedback(){
    if(reduceMotion) return;
    document.addEventListener('pointerdown',ev=>{
      const btn=ev.target.closest('button,[role="button"],.product-card-v190');
      if(!btn || btn.dataset.sdcTap==='1') return;
      btn.dataset.sdcTap='1';
      window.setTimeout(()=>{delete btn.dataset.sdcTap;},160);
    },{passive:true});
  }
  function improveSearchKeyboard(){
    document.querySelectorAll('#inventorySearchInput,#searchInput').forEach(input=>{
      if(input.dataset.sdcV190Search==='1') return;
      input.dataset.sdcV190Search='1';
      input.setAttribute('enterkeyhint','search');
      input.setAttribute('spellcheck','false');
      input.setAttribute('autocomplete','off');
    });
  }
  function enhance(){
    markReady();
    annotateCards();
    improveSearchKeyboard();
    compactStickyOnScroll();
  }
  const mo=new MutationObserver(()=>{
    if(window.__sdcV190Raf) return;
    window.__sdcV190Raf=requestAnimationFrame(()=>{
      window.__sdcV190Raf=0;
      enhance();
    });
  });
  function boot(){
    enhance();
    addTapFeedback();
    mo.observe(document.getElementById('app') || document.body,{childList:true,subtree:true});
    window.addEventListener('scroll',compactStickyOnScroll,{passive:true});
    window.addEventListener('resize',enhance,{passive:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
