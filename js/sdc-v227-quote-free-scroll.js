/* SD Comayagua v227 · Quote Free Scroll */
(function(){
  'use strict';

  function setImp(el,prop,value){
    if(!el || !el.style) return;
    try{ el.style.setProperty(prop,value,'important'); }catch(err){}
  }

  function freeQuoteScroll(){
    const modal=document.querySelector('#modalRoot .modal.quote-modal-v176');
    if(!modal) return;
    const backdrop=modal.closest('.modal-backdrop');
    const body=modal.querySelector('.quote-body-v176');

    modal.classList.add('sdc-v227-quote-modal');
    if(backdrop) backdrop.classList.add('sdc-v227-quote-backdrop');

    if(backdrop){
      setImp(backdrop,'position','fixed');
      setImp(backdrop,'inset','0');
      setImp(backdrop,'display','block');
      setImp(backdrop,'width','100vw');
      setImp(backdrop,'height','100dvh');
      setImp(backdrop,'max-height','100dvh');
      setImp(backdrop,'overflow-y','scroll');
      setImp(backdrop,'overflow-x','hidden');
      setImp(backdrop,'-webkit-overflow-scrolling','touch');
      setImp(backdrop,'touch-action','pan-y pinch-zoom');
      setImp(backdrop,'overscroll-behavior','contain');
      setImp(backdrop,'align-items','flex-start');
      setImp(backdrop,'place-items','unset');
      setImp(backdrop,'padding','7px 7px 28px');
    }

    setImp(modal,'display','block');
    setImp(modal,'height','auto');
    setImp(modal,'min-height','0');
    setImp(modal,'max-height','none');
    setImp(modal,'overflow','visible');
    setImp(modal,'margin','0 auto 26px');
    setImp(modal,'touch-action','pan-y pinch-zoom');

    const head=modal.querySelector('.quote-head-v176');
    if(head){
      setImp(head,'position','relative');
      setImp(head,'top','auto');
      setImp(head,'flex','none');
    }

    if(body){
      setImp(body,'display','block');
      setImp(body,'height','auto');
      setImp(body,'min-height','0');
      setImp(body,'max-height','none');
      setImp(body,'overflow','visible');
      setImp(body,'overflow-y','visible');
      setImp(body,'overflow-x','hidden');
      setImp(body,'-webkit-overflow-scrolling','touch');
      setImp(body,'touch-action','pan-y pinch-zoom');
    }

    modal.querySelectorAll('.quote-grid-v176,.sdc210-wizard-mode,.picker-list-v200,.cart-list,.gift-list-v176,.gift-picker-list,#docPreview,.preview-card-v176').forEach(el=>{
      setImp(el,'height','auto');
      setImp(el,'min-height','0');
      setImp(el,'max-height','none');
      setImp(el,'overflow','visible');
      setImp(el,'touch-action','pan-y pinch-zoom');
    });

    modal.querySelectorAll('.sdc210-step-controls,.sdc210-smart-cart,.quote-actions-v176').forEach(el=>{
      setImp(el,'position','static');
      setImp(el,'bottom','auto');
      setImp(el,'left','auto');
      setImp(el,'right','auto');
      setImp(el,'transform','none');
    });
  }

  function bindStepScroll(){
    document.addEventListener('click',function(ev){
      if(!ev.target.closest('#modalRoot .quote-modal-v176')) return;
      setTimeout(function(){
        freeQuoteScroll();
        const backdrop=document.querySelector('#modalRoot .modal-backdrop.sdc-v227-quote-backdrop');
        if(backdrop && ev.target.closest('[data-sdc210-step],[data-sdc210-prev],[data-sdc210-next]')){
          try{ backdrop.scrollTo({top:0,behavior:'smooth'}); }
          catch(err){ backdrop.scrollTop=0; }
        }
      },80);
    },true);
  }

  function boot(){
    freeQuoteScroll();
    bindStepScroll();
    new MutationObserver(function(){ freeQuoteScroll(); }).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setInterval(freeQuoteScroll,900);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
