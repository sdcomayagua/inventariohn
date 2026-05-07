(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  let lastNotice=0;
  function miniToast(title,msg){
    const now=Date.now(); if(now-lastNotice<450) return; lastNotice=now;
    let el=$('.v36-toast');
    if(!el){el=document.createElement('div');el.className='v36-toast';document.body.appendChild(el)}
    el.innerHTML='<b>'+escapeHtml(title)+'</b> · '+escapeHtml(msg);
    el.classList.add('show'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),2600);
  }
  function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function formatTime(){try{return new Date().toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})}catch(e){return ''}}
  function enhance(){
    document.body.classList.add('sdc-ready-v36');
    const top=$('.topbar');
    if(top && !$('.quality-strip-v36')){
      const strip=document.createElement('section');
      strip.className='quality-strip-v36 no-print';
      strip.innerHTML='<div class="online"><span>Estado del sistema</span><b>'+(navigator.onLine?'Conectado':'Sin internet')+'</b></div><div><span>Versión</span><b>V36 Calidad Elite</b></div><div><span>Última revisión</span><b>'+formatTime()+'</b></div>';
      top.insertAdjacentElement('afterend',strip);
    }
    $$('.product-share-card .share-description, .client-description, .doc-next-v35 p, .process-card span').forEach(el=>{el.style.textAlign='justify'});
  }
  function updateNetwork(){
    const el=$('.quality-strip-v36 .online b');
    if(el) el.textContent=navigator.onLine?'Conectado':'Sin internet';
    miniToast(navigator.onLine?'Conexión activa':'Sin internet', navigator.onLine?'Puedes sincronizar con la nube.':'Los cambios quedan local hasta recuperar conexión.');
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const text=(btn.textContent||'').toLowerCase();
    if(/guardar|sincronizar|respaldo|backup|nube|finalizar/.test(text)){
      btn.classList.add('v36-pressed'); setTimeout(()=>btn.classList.remove('v36-pressed'),260);
      if(/sincronizar/.test(text)) miniToast('Sincronizando','Revisando Google Sheets y Apps Script.');
      else if(/respaldo|backup/.test(text)) miniToast('Respaldo','Guardando copia completa.');
      else if(/guardar/.test(text)) miniToast('Guardando','Aplicando cambios.');
    }
  },true);
  window.addEventListener('online',updateNetwork);
  window.addEventListener('offline',updateNetwork);
  const mo=new MutationObserver(()=>enhance());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance); else enhance();
})();
