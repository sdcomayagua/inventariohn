(function(){
  'use strict';

  function unlockScroll(){
    const hasModal = !!document.querySelector('#modalRoot .modal, #modalRoot .modal-backdrop');
    document.body.classList.add('sdc-v54-mobile-belleza');
    if(!hasModal){
      document.body.classList.remove('modal-open','sdc-modal-open');
      document.documentElement.classList.remove('modal-open-root');
    }
    if(document.documentElement.style.overflowY !== 'auto') document.documentElement.style.overflowY = 'auto';
    if(document.documentElement.style.touchAction !== 'pan-y pinch-zoom') document.documentElement.style.touchAction = 'pan-y pinch-zoom';
    const bodyOverflow = hasModal ? '' : 'auto';
    const bodyTouch = hasModal ? '' : 'pan-y pinch-zoom';
    if(document.body.style.overflowY !== bodyOverflow) document.body.style.overflowY = bodyOverflow;
    if(document.body.style.touchAction !== bodyTouch) document.body.style.touchAction = bodyTouch;
  }

  function polishFooter(){
    document.querySelectorAll('.sdc-page-footer').forEach(footer=>{
      if(footer.classList.contains('footer-v54')) return;
      footer.className = 'sdc-page-footer no-print footer-v54';
      footer.innerHTML = '<p>Derechos reservados</p><b>Hecho por: Gabriel Guerrero.</b>';
    });
  }

  function cleanOldBadges(){
    document.querySelectorAll('.v51-top-badge,.sdc-mobile-control').forEach(el=>el.remove());
  }

  function ensureClickableCards(){
    document.querySelectorAll('.product-card-v49').forEach(card=>{
      if(card.dataset.v54TouchReady) return;
      card.dataset.v54TouchReady = '1';
      card.style.touchAction = 'manipulation';
      card.addEventListener('click', function(ev){
        const btn = ev.target.closest('button,a,input,select,textarea,[data-action]');
        if(btn) return;
        const view = card.querySelector('[data-action="viewProduct"]');
        if(view) view.click();
      }, {passive:true});
    });
  }

  function run(){
    if(!document.body) return;
    unlockScroll();
    polishFooter();
    cleanOldBadges();
    ensureClickableCards();
  }

  const observer = new MutationObserver(()=>{
    clearTimeout(observer._t);
    observer._t = setTimeout(run, 40);
  });

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      run();
      observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    }, {once:true});
  }else{
    run();
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
  }

  window.addEventListener('pageshow', run, {passive:true});
  window.addEventListener('resize', run, {passive:true});
})();
