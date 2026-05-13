(function(){
  'use strict';

  const BAD_COLOR_RE = /(18e7ff|18b9ff|28f6a1|00e5ff|22d8ff|25dfff|24e8ff|26e7ff|27defe|28c7e8|34f2b6|41e8ff|58d7ff|cyan|turquoise|rgb\(\s*24\s*,\s*231\s*,\s*255\s*\)|rgb\(\s*40\s*,\s*246\s*,\s*161\s*\)|rgb\(\s*34\s*,\s*216\s*,\s*255\s*\))/i;
  const VARS = {
    '--cyan':'#07182b',
    '--mint':'#ad2834',
    '--green':'#ad2834',
    '--accent':'#07182b',
    '--accent2':'#ad2834',
    '--sdc-blue':'#07182b',
    '--sdc-mint':'#ad2834',
    '--sdc-cyan':'#07182b',
    '--sdc-green':'#ad2834',
    '--sdc-pro-cyan':'#07182b',
    '--sdc-pro-green':'#ad2834',
    '--sdc-final-cyan':'#07182b',
    '--sdc-final-green':'#ad2834',
    '--sdc-max-cyan':'#07182b',
    '--sdc-max-mint':'#ad2834',
    '--v3-cyan':'#07182b',
    '--v3-green':'#ad2834',
    '--v47-cyan':'#07182b',
    '--v47-mint':'#ad2834'
  };

  function setVars(){
    const root = document.documentElement;
    Object.entries(VARS).forEach(([k,v])=>root.style.setProperty(k, v, 'important'));
    const theme = document.querySelector('meta[name="theme-color"]');
    if(theme) theme.setAttribute('content', '#07182b');
    document.title = 'SD Comayagua · Ventas Móvil V56';
  }

  function hasModal(){
    return !!document.querySelector('#modalRoot .modal, #modalRoot .modal-backdrop, .modal-backdrop');
  }

  function unlockScroll(){
    document.body.classList.add('sdc-v56-preview-style');
    document.documentElement.style.setProperty('overflow-y', 'auto', 'important');
    document.documentElement.style.setProperty('overflow-x', 'hidden', 'important');
    document.documentElement.style.setProperty('height', 'auto', 'important');
    document.documentElement.style.setProperty('touch-action', 'pan-y pinch-zoom', 'important');

    if(!hasModal()){
      document.body.classList.remove('modal-open','sdc-modal-open');
      document.documentElement.classList.remove('modal-open-root');
      document.body.style.setProperty('overflow-y', 'auto', 'important');
      document.body.style.setProperty('overflow-x', 'hidden', 'important');
      document.body.style.setProperty('height', 'auto', 'important');
      document.body.style.setProperty('position', 'static', 'important');
      document.body.style.setProperty('touch-action', 'pan-y pinch-zoom', 'important');
    }

    const app = document.querySelector('.app');
    if(app){
      app.style.setProperty('overflow', 'visible', 'important');
      app.style.setProperty('height', 'auto', 'important');
      app.style.setProperty('min-height', 'auto', 'important');
      app.style.setProperty('touch-action', 'pan-y pinch-zoom', 'important');
    }
  }

  function removeMarketingHero(){
    document.querySelectorAll('.hero h2, .hero p, .hero .v51-kicker, .v51-kicker').forEach(el=>{
      const text = (el.textContent || '').trim();
      if(!text || /vende rápido|desde tu celular|busca productos|panel móvil|ventas más rápidas|inventario más claro/i.test(text)){
        el.remove();
      }
    });
    document.querySelectorAll('.private-hero-head').forEach(head=>{
      const actions = head.querySelector('.v51-hero-actions');
      if(actions){
        head.innerHTML = '';
        head.appendChild(actions);
      }
    });
  }

  function polishTexts(){
    const topSub = document.querySelector('.top-title p');
    if(topSub) topSub.textContent = 'Ventas · inventario · cotizaciones';

    const invCopy = document.querySelector('#inventario .section-head p');
    if(invCopy) invCopy.textContent = 'Toca VER para abrir cotizar, vender, WhatsApp o editar.';

    const catCopy = document.querySelector('.category-head p');
    if(catCopy) catCopy.textContent = 'Filtra el inventario por categoría.';

    const searchTitle = document.querySelector('.search-title b');
    if(searchTitle) searchTitle.textContent = 'Buscar producto';

    const searchHelp = document.querySelector('.search-title span');
    if(searchHelp) searchHelp.textContent = 'Nombre, código o categoría';

    const input = document.querySelector('#searchInput');
    if(input){
      input.setAttribute('placeholder','Buscar producto...');
      input.setAttribute('enterkeyhint','search');
    }
  }

  function polishFooter(){
    document.querySelectorAll('.sdc-page-footer').forEach(footer=>{
      footer.className = 'sdc-page-footer no-print footer-v56';
      footer.innerHTML = '<p>Derechos reservados</p><b>Hecho por: Gabriel Guerrero.</b>';
    });
  }

  function removeOldFloatingControls(){
    document.querySelectorAll('.v51-top-badge,.sdc-mobile-control').forEach(el=>el.remove());
  }

  function killInlineBadColors(){
    document.querySelectorAll('[style]').forEach(el=>{
      const s = el.getAttribute('style') || '';
      if(!BAD_COLOR_RE.test(s)) return;
      el.style.removeProperty('color');
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('background-image');
      el.style.removeProperty('border-color');
      el.style.removeProperty('box-shadow');
    });
  }

  function normalizeScrollBlocks(){
    document.querySelectorAll('.quick-grid,.category-grid,.alert-grid,#inventario .grid,.inventory-content,.chips,.workflow-steps,.quote-body,.modal-body').forEach(el=>{
      el.style.setProperty('touch-action', 'pan-y pinch-zoom', 'important');
      if(!el.classList.contains('chips') && !el.classList.contains('workflow-steps')){
        el.style.setProperty('overflow-x', 'visible', 'important');
      }
      el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
    });
  }

  function makeProductCardsFriendly(){
    document.querySelectorAll('.product-card-v49').forEach(card=>{
      if(card.dataset.v56Ready) return;
      card.dataset.v56Ready = '1';
      card.style.setProperty('touch-action', 'manipulation', 'important');
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
    setVars();
    unlockScroll();
    removeMarketingHero();
    polishTexts();
    polishFooter();
    removeOldFloatingControls();
    killInlineBadColors();
    normalizeScrollBlocks();
    makeProductCardsFriendly();
  }

  let timer = 0;
  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(run, 35);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      run();
      if(document.body){
        new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
      }
    }, {once:true});
  }else{
    run();
    if(document.body){
      new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    }
  }

  window.addEventListener('pageshow', run, {passive:true});
  window.addEventListener('resize', run, {passive:true});
  window.addEventListener('orientationchange', run, {passive:true});
  window.addEventListener('scroll', function(){
    // Mantiene el scroll vivo después de renders pesados o cierres de modal.
    if(!hasModal()) unlockScroll();
  }, {passive:true});
})();
