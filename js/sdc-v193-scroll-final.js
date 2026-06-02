/* SD Comayagua v193 · Scroll Final
   Repara scroll vertical y agrega arrastre horizontal real en categorías/chips. */
(function(){
  'use strict';
  const doc=document.documentElement;
  const body=document.body;
  const H_SCROLL_SELECTORS=[
    '.category-strip-v191',
    '.quote-category-strip',
    '.quick-scroll-v83',
    '.alert-scroll-v83',
    '.chips',
    '.panel-table-wrap-v150'
  ].join(',');
  let raf=0;

  function isVisible(el){
    if(!el || !el.isConnected) return false;
    const st=getComputedStyle(el);
    if(st.display==='none' || st.visibility==='hidden' || Number(st.opacity||1)===0) return false;
    const r=el.getBoundingClientRect();
    return r.width>0 && r.height>0;
  }
  function hasOpenModal(){
    return Array.from(document.querySelectorAll('.modal-backdrop')).some(isVisible);
  }
  function hasOpenMenu(){
    return document.body.classList.contains('sdc-menu-open-v116') && Array.from(document.querySelectorAll('.sdc-menu-backdrop-v116,.sdc-menu-drawer-v116')).some(isVisible);
  }
  function setImp(el,prop,value){
    try{ el.style.setProperty(prop,value,'important'); }catch(err){}
  }
  function clearBadInline(el){
    if(!el || !el.style) return;
    ['overflow','overflow-y','height','max-height','position','top','left','right','bottom'].forEach(prop=>{
      const v=el.style.getPropertyValue(prop) || '';
      if(!v) return;
      if(prop.includes('overflow') && /hidden|clip/i.test(v)) el.style.removeProperty(prop);
      if((prop==='height'||prop==='max-height') && /100vh|100dvh|0px/i.test(v)) el.style.removeProperty(prop);
      if(prop==='position' && /fixed/i.test(v)) el.style.removeProperty(prop);
      if(['top','left','right','bottom'].includes(prop) && /^-?\d+(\.\d+)?px$/i.test(v)) el.style.removeProperty(prop);
    });
  }
  function unlockPageScroll(){
    const locked=hasOpenModal() || hasOpenMenu();
    body.classList.add('sdc-v193-scroll-final');
    if(locked) return;

    doc.classList.remove('modal-open-root');
    body.classList.remove('modal-open');
    clearBadInline(doc);
    clearBadInline(body);

    setImp(doc,'height','auto');
    setImp(doc,'min-height','100%');
    setImp(doc,'max-height','none');
    setImp(doc,'overflow-y','scroll');
    setImp(doc,'overflow-x','hidden');
    setImp(doc,'touch-action','pan-x pan-y pinch-zoom');

    setImp(body,'position','static');
    setImp(body,'height','auto');
    setImp(body,'min-height','100%');
    setImp(body,'max-height','none');
    setImp(body,'overflow-y','auto');
    setImp(body,'overflow-x','hidden');
    setImp(body,'touch-action','pan-x pan-y pinch-zoom');

    document.querySelectorAll('#app,.app,#inventario,.products-screen-v178,.products-screen-v189,.products-screen-v190,.inventory-content,.grid').forEach(el=>{
      clearBadInline(el);
      setImp(el,'height','auto');
      setImp(el,'max-height','none');
      setImp(el,'overflow','visible');
      setImp(el,'touch-action','pan-x pan-y pinch-zoom');
    });
  }
  function scheduleUnlock(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0; unlockPageScroll(); enhanceHorizontalScrollers();});
  }

  function canScrollHorizontally(el){
    return el && el.scrollWidth > el.clientWidth + 2;
  }
  function enhanceOneScroller(el){
    if(!el || el.dataset.sdcV193Hscroll==='1') return;
    el.dataset.sdcV193Hscroll='1';
    let startX=0,startY=0,startLeft=0,dragging=false,moved=false,pid=null;

    el.addEventListener('pointerdown',ev=>{
      if(ev.button && ev.button!==0) return;
      if(!canScrollHorizontally(el)) return;
      dragging=true; moved=false; pid=ev.pointerId;
      startX=ev.clientX; startY=ev.clientY; startLeft=el.scrollLeft;
      try{el.setPointerCapture(pid);}catch(err){}
      el.classList.add('is-drag-ready');
    },{passive:true});

    el.addEventListener('pointermove',ev=>{
      if(!dragging) return;
      const dx=ev.clientX-startX;
      const dy=ev.clientY-startY;
      if(Math.abs(dx)>7 && Math.abs(dx)>Math.abs(dy)*1.08){
        moved=true;
        el.classList.add('is-dragging');
        el.scrollLeft=startLeft-dx;
        ev.preventDefault();
      }
    },{passive:false});

    function endDrag(){
      if(!dragging) return;
      dragging=false;
      el.classList.remove('is-drag-ready','is-dragging');
      if(moved){
        el.dataset.sdcV193Moved='1';
        setTimeout(()=>{delete el.dataset.sdcV193Moved;},180);
      }
      try{ if(pid!==null) el.releasePointerCapture(pid); }catch(err){}
      pid=null;
    }
    el.addEventListener('pointerup',endDrag,{passive:true});
    el.addEventListener('pointercancel',endDrag,{passive:true});
    el.addEventListener('lostpointercapture',endDrag,{passive:true});
    el.addEventListener('click',ev=>{
      if(el.dataset.sdcV193Moved==='1'){
        ev.preventDefault();
        ev.stopPropagation();
      }
    },true);

    // Rueda de mouse/trackpad: si mueve de lado, desplaza la tira horizontal.
    el.addEventListener('wheel',ev=>{
      if(!canScrollHorizontally(el)) return;
      const delta=Math.abs(ev.deltaX)>Math.abs(ev.deltaY) ? ev.deltaX : (ev.shiftKey ? ev.deltaY : 0);
      if(delta){
        el.scrollLeft += delta;
        ev.preventDefault();
      }
    },{passive:false});
  }
  function enhanceHorizontalScrollers(){
    document.querySelectorAll(H_SCROLL_SELECTORS).forEach(enhanceOneScroller);
  }

  function boot(){
    unlockPageScroll();
    enhanceHorizontalScrollers();
    ['touchstart','pointerdown','wheel','scroll','resize'].forEach(type=>{
      window.addEventListener(type,scheduleUnlock,{passive:true,capture:true});
    });
    document.addEventListener('click',()=>setTimeout(scheduleUnlock,50),{passive:true,capture:true});
    new MutationObserver(scheduleUnlock).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setTimeout(scheduleUnlock,250);
    setTimeout(scheduleUnlock,900);
    setTimeout(scheduleUnlock,1800);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
