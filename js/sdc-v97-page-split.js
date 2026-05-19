/* SDC V97: separar INICIO y PRODUCTOS sin tocar la lógica principal del POS. */
(function(){
  'use strict';
  const KEY='sdc_v97_page';
  const VALID=['inicio','productos'];
  let busy=false;

  function currentPage(){
    const saved=localStorage.getItem(KEY);
    return VALID.includes(saved)?saved:'inicio';
  }

  function setPage(page, opts={}){
    const clean=VALID.includes(page)?page:'inicio';
    localStorage.setItem(KEY, clean);
    document.body.dataset.sdcPage=clean;
    applyPageState(opts);
    if(opts.scroll!==false){
      const top=document.querySelector('.topbar') || document.getElementById('app');
      top?.scrollIntoView({behavior:opts.smooth===false?'auto':'smooth',block:'start'});
    }
  }

  function tabsHTML(active){
    return `<nav class="sdc-page-tabs-v97 no-print" data-sdc-page-tabs="1" aria-label="Secciones principales">
      <button type="button" data-sdc-page-target="inicio" class="${active==='inicio'?'active':''}"><i>⌂</i><span>Inicio</span></button>
      <button type="button" data-sdc-page-target="productos" class="${active==='productos'?'active':''}"><i>▦</i><span>Productos</span></button>
    </nav>`;
  }

  function ensureTabs(){
    const top=document.querySelector('.topbar');
    if(!top) return;
    let tabs=document.querySelector('[data-sdc-page-tabs]');
    if(!tabs){
      top.insertAdjacentHTML('afterend', tabsHTML(currentPage()));
      tabs=document.querySelector('[data-sdc-page-tabs]');
      tabs?.addEventListener('click',ev=>{
        const btn=ev.target.closest('[data-sdc-page-target]');
        if(!btn) return;
        ev.preventDefault();
        setPage(btn.dataset.sdcPageTarget);
      });
    }
  }

  function updateTabs(){
    const page=currentPage();
    document.querySelectorAll('[data-sdc-page-target]').forEach(btn=>{
      btn.classList.toggle('active', btn.dataset.sdcPageTarget===page);
      btn.setAttribute('aria-current', btn.dataset.sdcPageTarget===page?'page':'false');
    });
  }

  function updateBottomNav(){
    const page=currentPage();
    const nav=document.querySelector('.bottom-nav');
    if(!nav) return;
    const home=nav.querySelector('[data-action="catalog"]');
    const products=nav.querySelector('[data-action="focusSearch"]');
    if(home){
      home.classList.toggle('active', page==='inicio');
      const span=home.querySelector('span');
      if(span) span.textContent='Inicio';
    }
    if(products){
      products.classList.toggle('active', page==='productos');
      const span=products.querySelector('span');
      const icon=products.querySelector('i');
      if(span) span.textContent='Productos';
      if(icon) icon.textContent='▦';
    }
  }

  function focusProductSearch(){
    setTimeout(()=>{
      const search=document.querySelector('#inventorySearchInput') || document.querySelector('#searchInput');
      if(search){
        search.scrollIntoView({behavior:'smooth',block:'center'});
        setTimeout(()=>search.focus({preventScroll:true}),220);
      }
    },120);
  }

  function applyPageState(opts={}){
    const page=currentPage();
    document.body.dataset.sdcPage=page;
    document.body.classList.add('sdc-v97-pages');
    ensureTabs();
    updateTabs();
    updateBottomNav();
    if(page==='productos' && opts.focusSearch) focusProductSearch();
  }

  function schedule(opts={}){
    if(busy) return;
    busy=true;
    requestAnimationFrame(()=>{
      applyPageState(opts);
      busy=false;
    });
  }

  document.addEventListener('click',ev=>{
    const pageBtn=ev.target.closest('[data-sdc-page-target]');
    if(pageBtn){
      ev.preventDefault();
      ev.stopPropagation();
      setPage(pageBtn.dataset.sdcPageTarget);
      return;
    }
    const actionBtn=ev.target.closest('[data-action]');
    if(!actionBtn) return;
    const action=actionBtn.dataset.action;
    if(action==='catalog'){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      setPage('inicio');
      return;
    }
    if(action==='focusSearch'){
      ev.preventDefault();
      ev.stopImmediatePropagation();
      setPage('productos',{focusSearch:true});
      return;
    }
    if(['cardAdmin','cardClient','captureClean','layoutOne','layoutTwo','categoryGoList'].includes(action)){
      localStorage.setItem(KEY,'productos');
      document.body.dataset.sdcPage='productos';
      schedule({scroll:false});
    }
  },true);

  document.addEventListener('DOMContentLoaded',()=>schedule({scroll:false}),{passive:true});
  window.addEventListener('load',()=>schedule({scroll:false}),{passive:true});
  const mo=new MutationObserver(()=>schedule({scroll:false}));
  mo.observe(document.documentElement,{childList:true,subtree:true});
  window.SDCSetPageV97=setPage;
})();
