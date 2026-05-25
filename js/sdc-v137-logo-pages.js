/* SDC V137: logo limpio + navegación por páginas reales desde el menú hamburguesa. */
(function(){
  'use strict';
  if(window.SDCV137LogoPages) return;
  window.SDCV137LogoPages = true;

  const VERSION='137-logo-pages';
  const PAGE_MAP={
    '/productos.html':{page:'productos'},
    '/vender.html':{page:'inicio',action:'sell'},
    '/cotizar.html':{page:'inicio',action:'quote'},
    '/ganancias.html':{page:'inicio',menu:'ganancias'},
    '/recibos.html':{page:'inicio',menu:'recibos'},
    '/alertas.html':{page:'inicio',menu:'alertas'},
    '/cotizaciones.html':{page:'inicio',menu:'cotizaciones'},
    '/producto.html':{page:'productos',action:'newProduct'}
  };
  const MENU_URL={
    inicio:'index.html',
    productos:'productos.html',
    vender:'vender.html',
    cotizar:'cotizar.html',
    ganancias:'ganancias.html',
    recibos:'recibos.html',
    alertas:'alertas.html',
    cotizaciones:'cotizaciones.html',
    nuevo:'producto.html'
  };

  function route(){
    const file='/' + location.pathname.split('/').pop();
    return PAGE_MAP[file] || null;
  }
  function setInitialRoute(){
    const r=route();
    if(!r) return;
    try{localStorage.setItem('sdc_v97_page',r.page||'inicio');}catch(e){}
    window.SDC_INITIAL_ROUTE=r;
    document.documentElement.setAttribute('data-sdc-page-file', location.pathname.split('/').pop()||'index.html');
  }

  function cleanLogoText(){
    const imgs=[...document.querySelectorAll('img')].filter(img=>/logo|logo-sdc|assets\/logo/i.test(img.getAttribute('src')||''));
    imgs.forEach(img=>{
      img.style.objectFit='contain';
      img.style.objectPosition='center';
      img.style.background='#fff';
      let node=img.parentElement;
      for(let i=0; node && i<4; i++, node=node.parentElement){
        node.style.overflow='visible';
        [...node.children].forEach(ch=>{
          if(ch===img || ch.contains(img)) return;
          const txt=(ch.textContent||'').replace(/\s+/g,'').trim().toUpperCase();
          if(txt==='SD'){
            ch.setAttribute('aria-hidden','true');
            ch.style.display='none';
          }
        });
      }
    });
    // Cajas típicas de recibo que traen letras SD separadas del logo.
    document.querySelectorAll('.receipt-logo-box span,.receipt-logo-wrap span,.doc-logo-wrap span,.rp-logo span,.logo-initials,.logo-text-only').forEach(el=>{
      const txt=(el.textContent||'').replace(/\s+/g,'').trim().toUpperCase();
      if(txt==='SD'){
        el.setAttribute('aria-hidden','true');
        el.style.display='none';
      }
    });
  }

  function goMenu(action){
    const url=MENU_URL[action];
    if(!url) return false;
    const base=location.pathname.replace(/[^/]*$/,'');
    location.href=base+url+'?v='+VERSION;
    return true;
  }

  function bindMenuPages(){
    document.addEventListener('click',function(e){
      const btn=e.target.closest('[data-sdc127]');
      if(!btn) return;
      const action=btn.getAttribute('data-sdc127');
      if(action==='open' || action==='close') return;
      if(!MENU_URL[action]) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      goMenu(action);
    },true);
  }

  function triggerRouteAction(){
    const r=route();
    if(!r || (!r.action && !r.menu)) return;
    let tries=0;
    const timer=setInterval(()=>{
      tries++;
      cleanLogoText();
      if(r.action){
        const b=document.querySelector('[data-action="'+r.action+'"]');
        if(b){clearInterval(timer); b.click(); return;}
      }
      if(r.menu){
        const m=document.querySelector('[data-sdc127="'+r.menu+'"]');
        if(m){clearInterval(timer); m.click(); return;}
      }
      if(tries>35) clearInterval(timer);
    },180);
  }

  function boot(){
    setInitialRoute();
    bindMenuPages();
    cleanLogoText();
    triggerRouteAction();
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled) return;
      scheduled=true;
      setTimeout(()=>{scheduled=false;cleanLogoText();},80);
    }).observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
