
/* SD Comayagua · v207 S24 Ultra Mobile Pro */
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function setVars(){
    const root = document.documentElement;
    root.style.setProperty('--sdc-vh', `${window.innerHeight}px`);
    root.style.setProperty('--sdc-vw', `${window.innerWidth}px`);

    document.body.classList.add('sdc-v207-mobile-pro');
    document.body.classList.toggle('sdc-v207-handset', window.innerWidth <= 540);
    document.body.classList.toggle(
      'sdc-v207-s24-ultra-like',
      window.innerWidth <= 540 && window.innerHeight >= 780 && window.devicePixelRatio >= 2.4
    );
  }

  function noHorizontalLeak(){
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.overflowX = 'hidden';

    const app = document.getElementById('app');
    if(app){
      app.style.maxWidth = window.innerWidth <= 760 ? '462px' : '';
      app.style.overflowX = 'hidden';
    }
  }

  function polishMoney(){
    $$('.stats .stat b,.panel-stats-v150 article b,.mini-stat-v195 b,.sdc204-total b,.sdc205-total b,.sdc206-total b').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(/^Lps\./i.test(txt) || txt.length > 8) el.classList.add('sdc207-fit-money');
    });
  }

  function polishModals(){
    const modalRoot = document.getElementById('modalRoot');
    if(!modalRoot) return;

    const hasModal = !!modalRoot.querySelector('.modal,.modal-backdrop');
    document.body.classList.toggle('sdc207-modal-open', hasModal);

    modalRoot.querySelectorAll('.quote-actions-v176,.modal-actions,.short-receipt-actions').forEach(el=>{
      el.style.position = 'static';
      el.style.bottom = 'auto';
      el.style.left = 'auto';
      el.style.right = 'auto';
      el.style.transform = 'none';
    });

    modalRoot.querySelectorAll('.modal').forEach(modal=>{
      modal.style.overflowX = 'hidden';
      modal.style.webkitOverflowScrolling = 'touch';
    });

    modalRoot.querySelectorAll('.picker-list,.picker-list-v200,.quote-category-list-v201').forEach(el=>{
      el.style.webkitOverflowScrolling = 'touch';
      el.style.overscrollBehavior = 'contain';
    });

    modalRoot.querySelectorAll('img').forEach(img=>{
      if(!img.getAttribute('loading')) img.setAttribute('loading','lazy');
      if(!img.getAttribute('decoding')) img.setAttribute('decoding','async');
    });
  }

  function improveLabels(){
    // Evita que labels automáticos tapen demasiado la foto.
    $$('.product-photo-v178').forEach(photo=>{
      const badge = photo.querySelector('.product-availability-v178');
      if(badge){
        badge.style.left = 'auto';
        badge.style.right = '7px';
      }
    });
  }

  function run(){
    setVars();
    noHorizontalLeak();
    polishMoney();
    polishModals();
    improveLabels();
  }

  let raf = 0;
  function schedule(){
    if(raf) return;
    raf = requestAnimationFrame(()=>{ raf = 0; run(); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', run, {once:true});
  }else{
    run();
  }

  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', ()=>setTimeout(schedule, 220), {passive:true});

  const obs = new MutationObserver(schedule);
  if(document.body){
    obs.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','src']});
  }else{
    document.addEventListener('DOMContentLoaded', ()=>{
      obs.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style','src']});
    }, {once:true});
  }
})();
