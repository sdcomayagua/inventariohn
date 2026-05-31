/* SD Comayagua v192 · Scroll Rescue
   Desbloquea la página si algún modal/menú viejo deja overflow hidden. */
(function(){
  'use strict';
  const doc=document.documentElement;
  const body=document.body;
  let raf=0;

  function visible(el){
    if(!el) return false;
    const st=getComputedStyle(el);
    return st.display!=='none' && st.visibility!=='hidden' && Number(st.opacity||1)!==0;
  }

  function hasOpenModal(){
    return Array.from(document.querySelectorAll('.modal-backdrop,.sdc-menu-backdrop-v116')).some(visible);
  }

  function clearInlineLock(el){
    if(!el || !el.style) return;
    const props=['overflow','overflowY','height','maxHeight','position','top','left','right','bottom','width'];
    props.forEach(p=>{
      const v=el.style[p] || '';
      if(!v) return;
      if(p==='overflow' || p==='overflowY'){
        if(/hidden|clip/i.test(v)) el.style[p]='';
      }else if(p==='position'){
        if(/fixed/i.test(v)) el.style[p]='';
      }else if(p==='height' || p==='maxHeight'){
        if(/100vh|100dvh|0px/i.test(v)) el.style[p]='';
      }else if(/^-?\d+px$/.test(v) || /auto/i.test(v)){
        el.style[p]='';
      }
    });
  }

  function unlockScroll(){
    if(!body) return;
    const lockedByRealModal=hasOpenModal();
    if(!lockedByRealModal){
      doc.classList.remove('modal-open-root');
      body.classList.remove('modal-open');
      body.classList.add('sdc-v192-scroll-ready');
      clearInlineLock(doc);
      clearInlineLock(body);
      doc.style.overflowY='auto';
      body.style.overflowY='auto';
      doc.style.height='auto';
      body.style.height='auto';
      body.style.position='static';
    }
    document.querySelectorAll('#app,.app,#inventario,.inventory-content,.products-screen-v190').forEach(el=>{
      if(!lockedByRealModal){
        el.style.maxHeight='';
        el.style.height='';
        if(/hidden|clip/i.test(el.style.overflow||'')) el.style.overflow='';
      }
    });
  }

  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(function(){raf=0; unlockScroll();});
  }

  function makeScrollFeelAlive(){
    // En iOS/Android, al tocar tarjetas o chips, aseguramos que el documento esté desbloqueado.
    document.addEventListener('touchstart',schedule,{passive:true,capture:true});
    document.addEventListener('pointerdown',schedule,{passive:true,capture:true});
    document.addEventListener('wheel',schedule,{passive:true,capture:true});
    document.addEventListener('click',function(){setTimeout(unlockScroll,80);},{passive:true,capture:true});
  }

  function boot(){
    unlockScroll();
    makeScrollFeelAlive();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    window.addEventListener('pageshow',unlockScroll,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('orientationchange',function(){setTimeout(unlockScroll,250);},{passive:true});
    setTimeout(unlockScroll,250);
    setTimeout(unlockScroll,900);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
