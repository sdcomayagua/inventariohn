/* SDC V103: botón ACTUALIZAR que borra caché y carga la última versión. */
(function(){
  'use strict';
  const VERSION='103-hard-refresh';
  const STAMP='sdc_refresh_stamp';

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){
      el.textContent=msg;
      el.classList.add('show');
      clearTimeout(el._sdcRefreshTimer);
      el._sdcRefreshTimer=setTimeout(()=>el.classList.remove('show'),2400);
    }else{
      console.log(msg);
    }
  }

  function buttonHTML(){
    return `<button type="button" class="btn small secondary sdc-refresh-btn-v103" data-sdc-hard-refresh="1" title="Actualizar sistema y borrar caché" aria-label="Actualizar sistema y borrar caché">
      <span class="sdc-refresh-icon-v103">↻</span>
      <span class="sdc-refresh-text-v103">Actualizar</span>
    </button>`;
  }

  function ensureButton(){
    const top=document.querySelector('.topbar');
    if(!top || top.querySelector('[data-sdc-hard-refresh]')) return;
    const logout=top.querySelector('[data-action="lock"]');
    const sync=top.querySelector('[data-action="sync"]');
    const anchor=logout || sync;
    if(anchor) anchor.insertAdjacentHTML('beforebegin',buttonHTML());
    else top.insertAdjacentHTML('beforeend',buttonHTML());
  }

  async function clearBrowserCaches(){
    const jobs=[];
    try{
      if('caches' in window){
        const names=await caches.keys();
        jobs.push(...names.map(name=>caches.delete(name)));
      }
    }catch(err){ console.warn('No se pudo limpiar CacheStorage',err); }
    try{
      if('serviceWorker' in navigator){
        const regs=await navigator.serviceWorker.getRegistrations();
        jobs.push(...regs.map(reg=>reg.unregister()));
      }
    }catch(err){ console.warn('No se pudo quitar service worker',err); }
    await Promise.allSettled(jobs);
  }

  function cleanLocalRuntimeCache(){
    try{
      const keepPrefixes=['sdc_','SDC'];
      const keepExact=new Set([
        'sdc_v83_theme','sdc_v97_page','sdc_inventory_layout','sdc_card_view'
      ]);
      Object.keys(localStorage).forEach(key=>{
        if(keepExact.has(key)) return;
        // Mantener datos del negocio; solo quitar marcas de cache/version/boot.
        if(/cache|version|stamp|boot|assets|build|refresh/i.test(key)) localStorage.removeItem(key);
      });
      Object.keys(sessionStorage).forEach(key=>sessionStorage.removeItem(key));
      localStorage.setItem(STAMP,VERSION+'-'+Date.now());
      localStorage.setItem('sdc_v83_theme','light');
    }catch(err){ console.warn('No se pudo limpiar storage temporal',err); }
  }

  async function hardRefresh(){
    const btn=document.querySelector('[data-sdc-hard-refresh]');
    if(btn){
      btn.disabled=true;
      btn.classList.add('is-updating');
      const text=btn.querySelector('.sdc-refresh-text-v103');
      if(text) text.textContent='Actualizando...';
    }
    toast('Actualizando sistema y borrando caché...');
    await clearBrowserCaches();
    cleanLocalRuntimeCache();
    const url=new URL(window.location.href);
    url.searchParams.set('v','103');
    url.searchParams.set('t',Date.now().toString());
    window.location.replace(url.toString());
  }

  document.addEventListener('click',ev=>{
    const btn=ev.target.closest('[data-sdc-hard-refresh]');
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    hardRefresh();
  },true);

  document.addEventListener('DOMContentLoaded',ensureButton,{passive:true});
  window.addEventListener('load',ensureButton,{passive:true});
  const mo=new MutationObserver(ensureButton);
  mo.observe(document.documentElement,{childList:true,subtree:true});
})();
