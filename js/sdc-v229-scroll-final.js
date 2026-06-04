/* SD Comayagua v229 · Scroll Final */
(function(){
  'use strict';

  function mobile(){
    try{return matchMedia('(max-width:760px)').matches;}catch(e){return innerWidth<=760;}
  }

  function setImp(el,prop,value){
    if(!el || !el.style) return;
    try{el.style.setProperty(prop,value,'important');}catch(e){}
  }

  function apply(){
    if(!mobile()) return;
    const modal=document.querySelector('#modalRoot .modal.quote-modal-v176, #modalRoot .modal.product-detail-modal-v221');
    if(!modal) return;

    const backdrop=modal.closest('.modal-backdrop');
    const isQuote=modal.classList.contains('quote-modal-v176');
    const body=isQuote ? modal.querySelector(':scope > .quote-body-v176') : modal.querySelector(':scope > .modal-body');
    const head=isQuote ? modal.querySelector(':scope > .quote-head-v176') : modal.querySelector(':scope > .modal-head');

    modal.classList.add('sdc-v229-scroll-modal');
    if(backdrop) backdrop.classList.add('sdc-v229-scroll-backdrop');

    setImp(document.documentElement,'overflow','hidden');
    setImp(document.documentElement,'height','100dvh');
    setImp(document.body,'overflow','hidden');
    setImp(document.body,'height','100dvh');

    const root=document.querySelector('#modalRoot');
    if(root){
      setImp(root,'position','fixed');
      setImp(root,'inset','0');
      setImp(root,'z-index','99999');
      setImp(root,'width','100vw');
      setImp(root,'height','100dvh');
      setImp(root,'overflow','hidden');
    }

    if(backdrop){
      setImp(backdrop,'position','fixed');
      setImp(backdrop,'inset','0');
      setImp(backdrop,'display','flex');
      setImp(backdrop,'align-items','flex-start');
      setImp(backdrop,'justify-content','center');
      setImp(backdrop,'width','100vw');
      setImp(backdrop,'height','100dvh');
      setImp(backdrop,'max-height','100dvh');
      setImp(backdrop,'overflow','hidden');
      setImp(backdrop,'padding','7px');
      setImp(backdrop,'touch-action','none');
    }

    setImp(modal,'position','relative');
    setImp(modal,'display','flex');
    setImp(modal,'flex-direction','column');
    setImp(modal,'width','min(calc(100vw - 14px),540px)');
    setImp(modal,'max-width','min(calc(100vw - 14px),540px)');
    setImp(modal,'height','auto');
    setImp(modal,'min-height','0');
    setImp(modal,'max-height','calc(100dvh - 14px)');
    setImp(modal,'overflow','hidden');
    setImp(modal,'margin','0 auto');
    setImp(modal,'transform','none');
    setImp(modal,'touch-action','auto');

    if(head){
      setImp(head,'position','relative');
      setImp(head,'top','auto');
      setImp(head,'flex','0 0 auto');
      setImp(head,'z-index','3');
    }

    if(body){
      setImp(body,'flex','1 1 auto');
      setImp(body,'display','block');
      setImp(body,'min-height','0');
      setImp(body,'height','auto');
      setImp(body,'max-height','none');
      setImp(body,'overflow-y','auto');
      setImp(body,'overflow-x','hidden');
      setImp(body,'-webkit-overflow-scrolling','touch');
      setImp(body,'overscroll-behavior','contain');
      setImp(body,'touch-action','pan-y pinch-zoom');
      setImp(body,'padding-bottom','28px');
    }

    if(isQuote){
      modal.querySelectorAll('.picker-list,.picker-list-v200,.cart-list,.gift-list-v176,.gift-picker-list,#docPreview').forEach(el=>{
        setImp(el,'max-height','none');
        setImp(el,'height','auto');
        setImp(el,'overflow','visible');
        setImp(el,'touch-action','pan-y pinch-zoom');
      });
      modal.querySelectorAll('.quote-category-list-v201').forEach(el=>{
        if(el.classList.contains('is-open')){
          setImp(el,'display','grid');
          setImp(el,'max-height','none');
          setImp(el,'overflow','visible');
        }else{
          setImp(el,'display','none');
        }
      });
    }else{
      modal.querySelectorAll('.v141-detail-shell,.v163-detail-shell,.v49-tab,.v141-tabpanel,.v163-tabpanel').forEach(el=>{
        setImp(el,'max-height','none');
        setImp(el,'overflow','visible');
        setImp(el,'touch-action','pan-y pinch-zoom');
      });
    }

    modal.querySelectorAll('.sdc210-smart-cart,.sdc210-step-controls,.quote-actions-v176,.modal-actions,.v141-detail-actions,.v163-detail-actions,.v49-detail-actions').forEach(el=>{
      setImp(el,'position','static');
      setImp(el,'bottom','auto');
      setImp(el,'top','auto');
      setImp(el,'left','auto');
      setImp(el,'right','auto');
      setImp(el,'transform','none');
    });
  }

  function scrollBodyTop(){
    const modal=document.querySelector('#modalRoot .modal.quote-modal-v176, #modalRoot .modal.product-detail-modal-v221');
    if(!modal) return;
    const body=modal.classList.contains('quote-modal-v176') ? modal.querySelector(':scope > .quote-body-v176') : modal.querySelector(':scope > .modal-body');
    if(body){
      try{body.scrollTo({top:0,behavior:'smooth'});}catch(e){body.scrollTop=0;}
    }
  }

  function boot(){
    apply();
    document.addEventListener('click',function(ev){
      if(ev.target && ev.target.closest && ev.target.closest('[data-sdc210-step],[data-sdc210-prev],[data-sdc210-next]')){
        setTimeout(function(){apply(); scrollBodyTop();},80);
      }else{
        setTimeout(apply,50);
      }
    },true);
    ['touchstart','pointerdown','wheel','resize','orientationchange'].forEach(type=>{
      window.addEventListener(type,function(){requestAnimationFrame(apply);},{passive:true,capture:true});
    });
    new MutationObserver(function(){requestAnimationFrame(apply);}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setInterval(apply,500);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
