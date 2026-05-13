(function(){
  'use strict';

  const STORAGE_KEY = 'sdc-v57-theme';
  const light = {
    '--cyan':'#07182b','--mint':'#a61f2b','--green':'#a61f2b','--accent':'#07182b','--accent2':'#a61f2b',
    '--sdc-blue':'#07182b','--sdc-mint':'#a61f2b','--sdc-cyan':'#07182b','--sdc-green':'#a61f2b',
    '--sdc-pro-cyan':'#07182b','--sdc-pro-green':'#a61f2b','--sdc-final-cyan':'#07182b','--sdc-final-green':'#a61f2b',
    '--sdc-max-cyan':'#07182b','--sdc-max-mint':'#a61f2b','--v3-cyan':'#07182b','--v3-green':'#a61f2b','--v47-cyan':'#07182b','--v47-mint':'#a61f2b',
    '--v51-blue':'#07182b','--v51-green':'#a61f2b','--v52-gold':'#a61f2b','--v53-gold':'#a61f2b','--v54-gold':'#a61f2b'
  };
  const dark = {
    '--cyan':'#f4f6fb','--mint':'#cf3b48','--green':'#cf3b48','--accent':'#f4f6fb','--accent2':'#cf3b48',
    '--sdc-blue':'#f4f6fb','--sdc-mint':'#cf3b48','--sdc-cyan':'#f4f6fb','--sdc-green':'#cf3b48',
    '--sdc-pro-cyan':'#f4f6fb','--sdc-pro-green':'#cf3b48','--sdc-final-cyan':'#f4f6fb','--sdc-final-green':'#cf3b48',
    '--sdc-max-cyan':'#f4f6fb','--sdc-max-mint':'#cf3b48','--v3-cyan':'#f4f6fb','--v3-green':'#cf3b48','--v47-cyan':'#f4f6fb','--v47-mint':'#cf3b48',
    '--v51-blue':'#f4f6fb','--v51-green':'#cf3b48','--v52-gold':'#cf3b48','--v53-gold':'#cf3b48','--v54-gold':'#cf3b48'
  };

  const fragments = ['26'+'e7ff','29'+'efb4','18'+'e7ff','18'+'b9ff','28'+'f6a1','00'+'e5ff','22'+'d8ff','25'+'dfff','24'+'e8ff','27'+'defe','28'+'c7e8','34'+'f2b6','41'+'e8ff','58'+'d7ff','cy'+'an','tur'+'quoise','rgb\\(\\s*24\\s*,\\s*231\\s*,\\s*255\\s*\\)','rgb\\(\\s*40\\s*,\\s*246\\s*,\\s*161\\s*\\)','rgb\\(\\s*38\\s*,\\s*231\\s*,\\s*255\\s*\\)','rgb\\(\\s*41\\s*,\\s*239\\s*,\\s*180\\s*\\)'];
  const BAD_COLOR_RE = new RegExp(fragments.join('|'), 'i');

  function currentTheme(){
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  }

  function applyTheme(theme){
    const mode = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEY, mode);
    document.body.classList.add('sdc-v57-doble-modo');
    document.body.classList.toggle('sdc-theme-dark', mode === 'dark');
    document.body.classList.toggle('sdc-theme-light', mode !== 'dark');
    const root = document.documentElement;
    Object.entries(mode === 'dark' ? dark : light).forEach(([k,v]) => root.style.setProperty(k, v, 'important'));
    const meta = document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', mode === 'dark' ? '#0f141b' : '#07182b');
    document.querySelectorAll('.theme-switch-v57 button').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === mode));
  }

  function hasModal(){
    return !!document.querySelector('#modalRoot .modal, #modalRoot .modal-backdrop, .modal-backdrop');
  }

  function unlockScroll(){
    document.body.classList.add('sdc-v57-doble-modo');
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

  function addThemeSwitcher(){
    const topbar = document.querySelector('.topbar');
    if(!topbar || document.querySelector('.theme-switch-v57')) return;
    const wrap = document.createElement('section');
    wrap.className = 'theme-switch-v57 no-print';
    wrap.innerHTML = '<b>Modo visual</b><div class="theme-options"><button type="button" data-theme="light">Claro</button><button type="button" data-theme="dark">Oscuro</button></div>';
    topbar.insertAdjacentElement('afterend', wrap);
    wrap.addEventListener('click', function(ev){
      const btn = ev.target.closest('[data-theme]');
      if(!btn) return;
      applyTheme(btn.dataset.theme);
    });
    applyTheme(currentTheme());
  }

  function removeMarketingHero(){
    document.querySelectorAll('.hero h2, .hero p, .hero .v51-kicker, .v51-kicker').forEach(el=>{
      const text = (el.textContent || '').trim();
      if(!text || /vende\s*r[aá]pido|desde\s*tu\s*celular|busca\s*productos|panel\s*m[oó]vil|ventas\s*m[aá]s\s*r[aá]pidas|inventario\s*m[aá]s\s*claro/i.test(text)) el.remove();
    });
    document.querySelectorAll('.private-hero-head').forEach(head=>{
      const actions = head.querySelector('.v51-hero-actions');
      if(actions && head.children.length !== 1){
        head.innerHTML = '';
        head.appendChild(actions);
      }
    });
  }

  function polishTexts(){
    const topSub = document.querySelector('.top-title p');
    if(topSub) topSub.textContent = 'Ventas · inventario · cotizaciones';
    const invCopy = document.querySelector('#inventario .section-head p');
    if(invCopy) invCopy.textContent = 'Toque VER para abrir las opciones del producto.';
    const catCopy = document.querySelector('.category-head p');
    if(catCopy) catCopy.textContent = 'Filtre el inventario por categoría.';
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
      footer.className = 'sdc-page-footer no-print footer-v57';
      footer.innerHTML = '<p>Derechos reservados</p><b>Hecho por: Gabriel Guerrero.</b>';
    });
  }

  function removeOldFloatingControls(){
    document.querySelectorAll('.v51-top-badge,.sdc-mobile-control').forEach(el=>el.remove());
  }

  function cleanInlineColors(){
    document.querySelectorAll('[style]').forEach(el=>{
      const s = el.getAttribute('style') || '';
      if(!BAD_COLOR_RE.test(s)) return;
      el.style.removeProperty('color');
      el.style.removeProperty('background');
      el.style.removeProperty('background-color');
      el.style.removeProperty('background-image');
      el.style.removeProperty('border-color');
      el.style.removeProperty('box-shadow');
      el.style.removeProperty('text-shadow');
    });
  }

  function normalizeScrollBlocks(){
    document.querySelectorAll('.quick-grid,.category-grid,.alert-grid,#inventario .grid,.inventory-content,.chips,.workflow-steps,.quote-body,.modal-body').forEach(el=>{
      el.style.setProperty('touch-action', 'pan-y pinch-zoom', 'important');
      if(!el.classList.contains('chips') && !el.classList.contains('workflow-steps')) el.style.setProperty('overflow-x', 'visible', 'important');
      el.style.setProperty('-webkit-overflow-scrolling', 'touch', 'important');
    });
  }

  function productCardsOpenOnTap(){
    document.querySelectorAll('.product-card-v49').forEach(card=>{
      if(card.dataset.v57Ready) return;
      card.dataset.v57Ready = '1';
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
    applyTheme(currentTheme());
    unlockScroll();
    addThemeSwitcher();
    removeMarketingHero();
    polishTexts();
    polishFooter();
    removeOldFloatingControls();
    cleanInlineColors();
    normalizeScrollBlocks();
    productCardsOpenOnTap();
    document.title = 'SD Comayagua · Ventas Móvil V57';
  }

  let timer = 0;
  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(run, 35);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      run();
      if(document.body) new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
    }, {once:true});
  }else{
    run();
    if(document.body) new MutationObserver(schedule).observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['class','style']});
  }

  window.addEventListener('pageshow', run, {passive:true});
  window.addEventListener('resize', run, {passive:true});
  window.addEventListener('orientationchange', run, {passive:true});
  window.addEventListener('scroll', function(){ if(!hasModal()) unlockScroll(); }, {passive:true});
})();
