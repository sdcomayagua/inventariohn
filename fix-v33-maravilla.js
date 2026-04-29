
(function(){
  'use strict';

  const VERSION = 'v33-maravilla';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function exists(fn){ return typeof window[fn] === 'function'; }

  function isVisible(el){
    if(!el) return false;
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && el.offsetParent !== null;
  }

  function lockBody(){ document.documentElement.classList.add('modal-lock'); document.body.classList.add('modal-open'); }
  function unlockBodySoon(){
    setTimeout(() => {
      const open = $$('.modal').some(m => {
        const st = getComputedStyle(m);
        return st.display !== 'none' && st.visibility !== 'hidden';
      });
      if(!open){
        document.documentElement.classList.remove('modal-lock');
        document.body.classList.remove('modal-open');
      }
    }, 40);
  }

  function showModal(id){
    const modal = document.getElementById(id);
    if(!modal) return false;
    modal.style.display = 'flex';
    modal.classList.add('show','active','is-open');
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-modal','true');
    lockBody();
    const focusable = modal.querySelector('input,select,textarea,button');
    if(focusable) setTimeout(() => { try{ focusable.focus({preventScroll:true}); }catch(_){} }, 80);
    return true;
  }

  function openProduct(){
    try{
      if(exists('invOpenModal')){
        window.invOpenModal(false);
        lockBody();
        return;
      }
    }catch(err){ console.warn('No abrió invOpenModal, usando respaldo.', err); }
    showModal('inv-modal');
  }

  function openSale(){
    try{
      if(exists('openSaleModal')){
        window.openSaleModal('');
        lockBody();
        return;
      }
    }catch(err){ console.warn('No abrió openSaleModal, usando respaldo.', err); }
    showModal('sale-modal');
  }

  function bind(id, handler){
    const el = document.getElementById(id);
    if(!el || el.dataset.v33Bound === '1') return;
    el.dataset.v33Bound = '1';
    el.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      handler();
    }, {capture:true});
  }

  function bindFallbacks(){
    // Botones nuevos con ID
    ['btn-hero-product','btn-quick-product','btn-dock-product','hero-new-product','quick-new-product','dock-new-product'].forEach(id => bind(id, openProduct));
    ['btn-hero-sale','btn-quick-sale','btn-dock-sale','hero-new-sale','quick-new-sale','dock-new-sale'].forEach(id => bind(id, openSale));

    // Respaldos para botones viejos o repetidos
    $$('button, a').forEach(el => {
      const txt = (el.textContent || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
      const onclick = (el.getAttribute('onclick') || '').toLowerCase();
      if(el.dataset.v33SmartBound === '1') return;

      const looksProduct = onclick.includes('invopenmodal') || txt === 'nuevo producto' || txt.includes('+ producto') || txt === 'producto';
      const looksSale = onclick.includes('opensalemodal') || txt === 'nueva venta' || txt.includes('vender');

      if(looksProduct || looksSale){
        el.dataset.v33SmartBound = '1';
        el.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if(looksProduct) openProduct();
          else openSale();
        }, {capture:true});
      }
    });
  }

  function closeByBackdrop(){
    document.addEventListener('click', (ev) => {
      const modal = ev.target.classList && ev.target.classList.contains('modal') ? ev.target : null;
      if(modal){
        modal.style.display = 'none';
        modal.classList.remove('show','active','is-open');
        unlockBodySoon();
      }
      const closeBtn = ev.target.closest('[onclick*="Close"], [onclick*="close"], .modal-close, .close-modal');
      if(closeBtn) unlockBodySoon();
    }, {capture:false});
    document.addEventListener('keydown', (ev) => {
      if(ev.key === 'Escape') unlockBodySoon();
    });
  }

  function improveText(){
    const title = $('.hero-title');
    if(title && title.textContent.includes('Inventario, ventas y comprobantes')){
      title.innerHTML = 'Panel de ventas<br>e inventario';
    }
    const eyebrow = $('.hero-banner .eyebrow');
    if(eyebrow) eyebrow.textContent = 'CONTROL PROFESIONAL';
    const productBtn = $('#btn-hero-product');
    if(productBtn) productBtn.textContent = 'Agregar producto';
    const saleBtn = $('#btn-hero-sale');
    if(saleBtn) saleBtn.textContent = 'Nueva venta';
  }

  function polishLayout(){
    document.body.classList.add('v33-maravilla-ready');
    const search = $('#inv-search');
    if(search){
      search.setAttribute('autocomplete','off');
      search.setAttribute('inputmode','search');
      search.placeholder = 'Buscar producto o código';
    }

    // Quitar textos técnicos o chips duplicados demasiado largos si existen
    $$('.hero-meta-strip span').forEach((chip, i) => {
      const labels = ['Stock activo','Ventas rápidas','Comprobantes'];
      if(labels[i]) chip.textContent = labels[i];
    });

    // Evitar botones sin tipo en formularios
    $$('button').forEach(b => { if(!b.getAttribute('type')) b.setAttribute('type','button'); });
  }

  function forceFreshServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    try{
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(reg => {
          if(reg && reg.update) reg.update().catch(()=>{});
        });
      });
    }catch(_){}
  }

  function init(){
    polishLayout();
    improveText();
    bindFallbacks();
    closeByBackdrop();
    forceFreshServiceWorker();
    window.__SDC_OPEN_PRODUCT__ = openProduct;
    window.__SDC_OPEN_SALE__ = openSale;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();

  // Por si app.js pinta botones después
  setTimeout(bindFallbacks, 500);
  setTimeout(bindFallbacks, 1500);
})();
