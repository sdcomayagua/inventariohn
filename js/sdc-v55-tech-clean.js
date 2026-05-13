(function(){
  'use strict';

  const CYAN_RE = /(18e7ff|18b9ff|28f6a1|00e5ff|00f|cyan|turquoise)/i;

  function unlockScroll(){
    const hasModal = !!document.querySelector('#modalRoot .modal, #modalRoot .modal-backdrop');
    document.body.classList.add('sdc-v55-tech-clean');
    if(!hasModal){
      document.body.classList.remove('modal-open','sdc-modal-open');
      document.documentElement.classList.remove('modal-open-root');
    }
    document.documentElement.style.overflowY = 'auto';
    document.documentElement.style.overflowX = 'hidden';
    document.documentElement.style.touchAction = 'pan-y pinch-zoom';
    if(!hasModal){
      document.body.style.overflowY = 'auto';
      document.body.style.overflowX = 'hidden';
      document.body.style.touchAction = 'pan-y pinch-zoom';
    }
  }

  function polishFooter(){
    document.querySelectorAll('.sdc-page-footer').forEach(footer=>{
      footer.className = 'sdc-page-footer no-print footer-v55';
      footer.innerHTML = '<p>Derechos reservados</p><b>Hecho por: Gabriel Guerrero.</b>';
    });
  }

  function cleanOldBadges(){
    document.querySelectorAll('.v51-top-badge,.sdc-mobile-control').forEach(el=>el.remove());
  }

  function killInlineCyan(){
    document.querySelectorAll('[style]').forEach(el=>{
      const s = el.getAttribute('style') || '';
      if(!CYAN_RE.test(s)) return;
      el.style.color = '';
      el.style.background = '';
      el.style.backgroundColor = '';
      el.style.borderColor = '';
      el.style.boxShadow = 'none';
    });
  }

  function ensureClickableCards(){
    document.querySelectorAll('.product-card-v49').forEach(card=>{
      if(card.dataset.v55TouchReady) return;
      card.dataset.v55TouchReady = '1';
      card.style.touchAction = 'manipulation';
      card.addEventListener('click', function(ev){
        const btn = ev.target.closest('button,a,input,select,textarea,[data-action]');
        if(btn) return;
        const view = card.querySelector('[data-action="viewProduct"]');
        if(view) view.click();
      }, {passive:true});
    });
  }

  function normalizeHorizontalScroll(){
    document.querySelectorAll('.quick-grid,.category-grid,.alert-grid,#inventario .grid,.inventory-content').forEach(el=>{
      el.style.touchAction = 'pan-y pinch-zoom';
      el.style.overflowX = 'visible';
      el.style.scrollSnapType = 'none';
    });
  }

  function run(){
    if(!document.body) return;
    unlockScroll();
    polishFooter();
    cleanOldBadges();
    killInlineCyan();
    ensureClickableCards();
    normalizeHorizontalScroll();
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
  window.addEventListener('orientationchange', run, {passive:true});
})();
