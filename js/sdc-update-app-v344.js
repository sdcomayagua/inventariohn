/* v344 · Botón Actualizar app.
   Borra caché, desregistra Service Worker y recarga con versión nueva. */
(function(){
  'use strict';
  var inserted=false;
  var refreshing=false;

  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}

  function toast(message){
    var old=document.querySelector('.sdc344-refresh-toast');
    if(old) old.remove();
    var el=document.createElement('div');
    el.className='sdc344-refresh-toast';
    el.textContent=message;
    document.body.appendChild(el);
    return el;
  }

  async function clearBrowserCache(){
    try{
      if(window.caches && caches.keys){
        var keys=await caches.keys();
        await Promise.all(keys.map(function(key){return caches.delete(key);}));
      }
    }catch(error){
      console.warn('No se pudo limpiar Cache Storage:', error);
    }
  }

  async function unregisterServiceWorkers(){
    try{
      if('serviceWorker' in navigator && navigator.serviceWorker.getRegistrations){
        var regs=await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(function(reg){return reg.unregister();}));
      }
    }catch(error){
      console.warn('No se pudo desregistrar Service Worker:', error);
    }
  }

  function nextUrl(){
    var url=new URL(window.location.href);
    url.searchParams.set('v','344-'+Date.now());
    url.searchParams.set('refresh','1');
    return url.toString();
  }

  async function updateApp(button){
    if(refreshing) return;
    refreshing=true;
    if(button){
      button.disabled=true;
      button.innerHTML='<span class="sdc344-icon">↻</span><span>Actualizando...</span>';
    }
    toast('Actualizando app... limpiando caché.');
    await clearBrowserCache();
    await unregisterServiceWorkers();
    try{ localStorage.setItem('sdc_last_manual_refresh', new Date().toISOString()); }catch(e){}
    setTimeout(function(){ window.location.replace(nextUrl()); },350);
  }

  function makeButton(){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='sdc344-update-app-btn sdc344-injected-top';
    btn.innerHTML='<span class="sdc344-icon">↻</span><span>Actualizar app</span>';
    btn.addEventListener('click',function(){ updateApp(btn); });
    return btn;
  }

  function findFirebaseButton(){
    var items=Array.from(document.querySelectorAll('button,a'));
    return items.find(function(el){ return /Firebase/i.test(txt(el)); }) || null;
  }

  function goodContainer(el){
    var current=el;
    for(var i=0;i<5 && current && current.parentElement;i++,current=current.parentElement){
      var style=getComputedStyle(current);
      var t=txt(current);
      if((style.display==='flex' || style.display==='grid') && t.length<220) return current;
    }
    return el && el.parentElement;
  }

  function insertButton(){
    if(inserted || document.querySelector('.sdc344-update-app-btn')) return;
    var btn=makeButton();
    var firebase=findFirebaseButton();
    if(firebase){
      var box=goodContainer(firebase);
      if(box){
        box.appendChild(btn);
        inserted=true;
        return;
      }
    }

    var app=document.getElementById('app') || document.body;
    var slot=document.createElement('div');
    slot.className='sdc344-update-app-slot';
    slot.appendChild(btn);
    app.insertBefore(slot, app.firstChild);
    inserted=true;
  }

  function start(){
    insertButton();
    new MutationObserver(function(){ insertButton(); }).observe(document.documentElement,{childList:true,subtree:true});
  }

  window.sdcActualizarAppAhora=function(){ updateApp(document.querySelector('.sdc344-update-app-btn')); };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
