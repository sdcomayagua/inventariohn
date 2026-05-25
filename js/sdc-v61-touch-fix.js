(function(){
  'use strict';
  const KEY='sdc_v83_theme';
  function theme(){ return 'light'; }
  function applyTheme(){
    localStorage.setItem(KEY,'light');
    document.documentElement.setAttribute('data-theme','light');
    document.body.classList.add('sdc-v60-pos','sdc-v61-clean','sdc-v95-light-default','sdc-theme-light');
    document.body.classList.remove('sdc-theme-black','sdc-theme-red','sdc-theme-blue','sdc-theme-gamer','sdc-theme-dark','sdc-v57-dark','sdc-v57-light','dark-mode','pro-dark-mode','pro-white-mode');
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#f4f7fb');
    document.querySelectorAll('[data-v60-theme-panel],.sdc-v60-theme-panel').forEach(el=>el.remove());
  }
  function modalExists(){
    const root=document.getElementById('modalRoot');
    return !!(root && root.querySelector('.modal-backdrop,.modal,.sheet-modal'));
  }
  function unlockPageScroll(){
    document.documentElement.classList.remove('modal-open-root');
    document.body.classList.remove('modal-open');
    document.documentElement.style.setProperty('overflow-y','auto','important');
    document.body.style.setProperty('overflow-y','auto','important');
    document.documentElement.style.setProperty('height','auto','important');
    document.body.style.setProperty('height','auto','important');
    document.documentElement.style.setProperty('touch-action','auto','important');
    document.body.style.setProperty('touch-action','auto','important');
  }

  function fixToast(){
    const toast=document.getElementById('toast');
    if(!toast) return;
    if(toast.classList.contains('show')){
      clearTimeout(toast._sdcV62T);
      toast._sdcV62T=setTimeout(()=>toast.classList.remove('show'),2200);
    }
  }
  function centerActiveCategory(){
    const grid=document.querySelector('.category-grid');
    const active=grid && grid.querySelector('.category-card.active');
    if(!grid || !active) return;
    const cards=[...grid.querySelectorAll('.category-card')];
    if(cards.indexOf(active)<=0){ grid.scrollTo({left:0,behavior:'auto'}); return; }
    const left=active.offsetLeft - (grid.clientWidth-active.clientWidth)/2;
    grid.scrollTo({left:Math.max(0,left),behavior:'smooth'});
  }

  function fixScroll(){
    applyTheme();
    document.documentElement.style.setProperty('overflow-x','hidden','important');
    document.body.style.setProperty('overflow-x','hidden','important');
    const app=document.getElementById('app');
    if(app){
      app.style.setProperty('max-width','100vw','important');
      app.style.setProperty('overflow-x','hidden','important');
    }
    if(!modalExists()){
      unlockPageScroll();
    }else{
      document.body.classList.add('modal-open');
      document.documentElement.classList.add('modal-open-root');
      const modal=document.querySelector('#modalRoot .modal,#modalRoot .sheet-modal');
      if(modal){
        modal.style.setProperty('overflow-y','auto','important');
        modal.style.setProperty('-webkit-overflow-scrolling','touch');
        modal.style.setProperty('touch-action','pan-y','important');
      }
    }
    document.querySelectorAll('.category-grid,.chips,.quote-category-strip,.qty-presets').forEach(el=>{
      el.style.setProperty('-webkit-overflow-scrolling','touch');
      el.style.setProperty('touch-action','pan-x pan-y','important');
    });
    fixToast();
    setTimeout(centerActiveCategory,40);
  }
  function schedule(){
    if(schedule._raf) return;
    schedule._raf=requestAnimationFrame(()=>{schedule._raf=0; fixScroll();});
  }
  document.addEventListener('DOMContentLoaded', schedule, {passive:true});
  window.addEventListener('load', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  window.addEventListener('orientationchange', ()=>setTimeout(schedule,80), {passive:true});
  document.addEventListener('click', ()=>setTimeout(schedule,0), true);
  document.addEventListener('touchstart', schedule, {passive:true,capture:true});
  const mo=new MutationObserver(schedule);
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  window.SDCV61FixScroll=fixScroll;
  applyTheme();
  setTimeout(schedule,0);
})();
