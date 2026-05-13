(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  let wiredShortcuts = false;
  let wiredGoTop = false;
  let enhanceTimer = 0;

  function setSearchState(input){
    const bar = input && input.closest('.searchbar');
    if(bar) bar.classList.toggle('has-value', !!String(input.value || '').trim());
  }

  function enhanceSearch(){
    const input = $('#searchInput');
    if(!input) return;
    input.setAttribute('aria-label', 'Buscar producto por nombre, código, categoría o detalle');
    input.setAttribute('placeholder', 'Busca producto, código, categoría o detalle');
    const bar = input.closest('.searchbar');
    if(bar && !bar.querySelector('.v51-clear-search')){
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'v51-clear-search';
      clear.setAttribute('aria-label', 'Limpiar búsqueda');
      clear.textContent = '×';
      clear.addEventListener('click', function(ev){
        ev.preventDefault();
        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles:true}));
        setSearchState(input);
        input.focus({preventScroll:true});
      });
      bar.appendChild(clear);
    }
    if(!input.dataset.v51SearchBound){
      input.dataset.v51SearchBound = '1';
      input.addEventListener('input', () => setSearchState(input));
      input.addEventListener('change', () => setSearchState(input));
    }
    setSearchState(input);
  }

  function enhanceTopbar(){
    const title = $('.top-title');
    if(title && !title.querySelector('.v51-top-badge')){
      const badge = document.createElement('span');
      badge.className = 'v51-top-badge';
      badge.textContent = 'PRO';
      title.appendChild(badge);
    }
  }

  function enhanceQuickButtons(){
    const labels = {
      cardClient:'Vista limpia para cliente',
      captureClean:'Modo captura para fotos y publicaciones',
      quote:'Crear cotización',
      sell:'Registrar venta',
      catalog:'Volver al catálogo',
      newProduct:'Agregar producto',
      quickSale:'Venta rápida',
      quotes:'Cotizaciones guardadas',
      clients:'Agenda de clientes',
      receipts:'Caja y recibos',
      profit:'Control de ganancia',
      backup:'Crear respaldo'
    };
    $$('.quick-btn').forEach(btn => {
      const action = btn.dataset.action;
      if(action && labels[action]) btn.setAttribute('title', labels[action]);
    });
  }

  function enhanceProductCards(){
    $$('.product-card-v49').forEach(card => {
      card.setAttribute('tabindex', '0');
      if(!card.dataset.v51CardBound){
        card.dataset.v51CardBound = '1';
        card.addEventListener('keydown', ev => {
          if(ev.key !== 'Enter') return;
          const view = card.querySelector('[data-action="viewProduct"]');
          if(view){ ev.preventDefault(); view.click(); }
        });
      }
    });
  }

  function enhanceGoTop(){
    const btn = $('#goTop');
    if(!btn) return;
    if(!wiredGoTop){
      wiredGoTop = true;
      btn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
      window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 520);
      }, {passive:true});
    }
    btn.classList.toggle('visible', window.scrollY > 520);
  }

  function wireShortcuts(){
    if(wiredShortcuts) return;
    wiredShortcuts = true;
    document.addEventListener('keydown', ev => {
      const target = ev.target;
      const tag = String(target && target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      const input = $('#searchInput');
      if(!input) return;
      if((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k'){
        ev.preventDefault();
        input.scrollIntoView({behavior:'smooth', block:'center'});
        setTimeout(() => input.focus({preventScroll:true}), 160);
        return;
      }
      if(!typing && ev.key === '/'){
        ev.preventDefault();
        input.scrollIntoView({behavior:'smooth', block:'center'});
        setTimeout(() => input.focus({preventScroll:true}), 160);
        return;
      }
      if(ev.key === 'Escape' && document.activeElement === input && input.value){
        input.value = '';
        input.dispatchEvent(new Event('input', {bubbles:true}));
        setSearchState(input);
      }
    });
  }

  function enhance(){
    document.body.classList.add('sdc-v51-upgrade');
    enhanceTopbar();
    enhanceSearch();
    enhanceQuickButtons();
    enhanceProductCards();
    enhanceGoTop();
    wireShortcuts();
  }

  function scheduleEnhance(){
    if(enhanceTimer) cancelAnimationFrame(enhanceTimer);
    enhanceTimer = requestAnimationFrame(() => {
      enhanceTimer = 0;
      enhance();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enhance();
    const app = document.getElementById('app');
    if(app){
      new MutationObserver(scheduleEnhance).observe(app, {childList:true, subtree:true});
    }
  });
})();
