/* SDC Mobile Pro: mejoras progresivas para usar el panel desde celular. */
(function(){
  'use strict';

  const actions = [
    {action:'quote', icon:'▧', label:'Cotizar', primary:true},
    {action:'quickSale', icon:'⚡', label:'Rápida'},
    {action:'newProduct', icon:'＋', label:'Producto'},
    {action:'receipts', icon:'▤', label:'Caja'}
  ];

  function setViewportUnit(){
    document.documentElement.style.setProperty('--sdc-vh', `${window.innerHeight * 0.01}px`);
  }

  function addBodyClass(){
    document.body.classList.add('sdc-mobile-pro');
  }

  function findOriginalAction(action){
    return Array.from(document.querySelectorAll(`[data-action="${action}"]`))
      .find(el => !el.closest('.sdc-mobile-control'));
  }

  function controlHTML(){
    return `<div class="sdc-mobile-control no-print" aria-label="Acciones rápidas SDC">
      ${actions.map(item => `<button type="button" class="${item.primary?'primary':''}" data-sdc-action="${item.action}"><i>${item.icon}</i><span>${item.label}</span></button>`).join('')}
    </div>`;
  }

  function enhanceLayout(){
    addBodyClass();
    const app = document.getElementById('app');
    if(!app || !app.classList.contains('app')) return;

    const topbar = app.querySelector('.topbar');
    if(topbar && !app.querySelector('.sdc-mobile-control')){
      topbar.insertAdjacentHTML('afterend', controlHTML());
    }

    const categoryGrid = app.querySelector('.category-grid');
    const activeCategory = categoryGrid?.querySelector('.category-card.active');
    if(activeCategory && !activeCategory.dataset.sdcCentered){
      activeCategory.dataset.sdcCentered = '1';
      requestAnimationFrame(() => {
        try{ activeCategory.scrollIntoView({behavior:'smooth', inline:'center', block:'nearest'}); }catch(e){}
      });
    }
  }

  document.addEventListener('click', function(ev){
    const btn = ev.target.closest('[data-sdc-action]');
    if(!btn) return;
    ev.preventDefault();
    const original = findOriginalAction(btn.dataset.sdcAction);
    if(original) original.click();
  }, true);

  window.addEventListener('resize', setViewportUnit, {passive:true});
  window.addEventListener('orientationchange', function(){setTimeout(setViewportUnit, 250);}, {passive:true});
  window.addEventListener('scroll', function(){
    document.body.classList.toggle('sdc-scrolled', window.scrollY > 24);
  }, {passive:true});

  const observer = new MutationObserver(function(){
    window.requestAnimationFrame(enhanceLayout);
  });

  setViewportUnit();
  addBodyClass();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      enhanceLayout();
      observer.observe(document.body, {childList:true, subtree:true});
    });
  }else{
    enhanceLayout();
    observer.observe(document.body, {childList:true, subtree:true});
  }
})();
