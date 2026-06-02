/* SD Comayagua v228 · Modal Scroll Stable */
(function(){
  'use strict';

  const MQ='(max-width: 760px)';

  function mobile(){
    try{return window.matchMedia(MQ).matches;}catch(e){return window.innerWidth<=760;}
  }

  function setImp(el,prop,value){
    if(!el || !el.style) return;
    try{ el.style.setProperty(prop,value,'important'); }catch(e){}
  }

  function clearLimit(el){
    if(!el) return;
    setImp(el,'height','auto');
    setImp(el,'min-height','0');
    setImp(el,'max-height','none');
    setImp(el,'overflow','visible');
    setImp(el,'overflow-y','visible');
    setImp(el,'overflow-x','hidden');
    setImp(el,'touch-action','pan-y pinch-zoom');
    setImp(el,'overscroll-behavior','auto');
  }

  function stabilize(){
    if(!mobile()) return;

    const root=document.querySelector('#modalRoot');
    const backdrop=root && root.querySelector('.modal-backdrop');
    const modal=root && root.querySelector('.modal');
    if(!root || !backdrop || !modal) return;

    document.documentElement.classList.add('modal-open-root');
    document.body.classList.add('modal-open');
    modal.classList.add('sdc-v228-scroll-modal');
    backdrop.classList.add('sdc-v228-scroll-backdrop');

    setImp(root,'position','fixed');
    setImp(root,'inset','0');
    setImp(root,'z-index','99999');
    setImp(root,'width','100vw');
    setImp(root,'height','100dvh');
    setImp(root,'overflow','hidden');

    setImp(backdrop,'position','fixed');
    setImp(backdrop,'inset','0');
    setImp(backdrop,'display','block');
    setImp(backdrop,'width','100vw');
    setImp(backdrop,'height','100dvh');
    setImp(backdrop,'max-height','100dvh');
    setImp(backdrop,'overflow-y','auto');
    setImp(backdrop,'overflow-x','hidden');
    setImp(backdrop,'-webkit-overflow-scrolling','touch');
    setImp(backdrop,'touch-action','pan-y pinch-zoom');
    setImp(backdrop,'overscroll-behavior','contain');
    setImp(backdrop,'padding','7px 7px 34px');
    setImp(backdrop,'place-items','unset');
    setImp(backdrop,'align-items','flex-start');
    setImp(backdrop,'justify-content','initial');

    setImp(modal,'position','relative');
    setImp(modal,'display','block');
    setImp(modal,'width','min(calc(100vw - 14px),540px)');
    setImp(modal,'max-width','min(calc(100vw - 14px),540px)');
    setImp(modal,'height','auto');
    setImp(modal,'min-height','0');
    setImp(modal,'max-height','none');
    setImp(modal,'overflow','visible');
    setImp(modal,'margin','0 auto 30px');
    setImp(modal,'transform','none');
    setImp(modal,'touch-action','pan-y pinch-zoom');

    modal.querySelectorAll('.modal-head,.quote-head-v176').forEach(head=>{
      setImp(head,'position','relative');
      setImp(head,'top','auto');
      setImp(head,'flex','none');
    });

    modal.querySelectorAll([
      '.modal-body',
      '.quote-body-v176',
      '.quote-grid-v176',
      '.sdc210-wizard-mode',
      '.picker-list',
      '.picker-list-v200',
      '.cart-list',
      '.gift-list-v176',
      '.gift-picker-list',
      '#docPreview',
      '.preview-card-v176',
      '.v49-product-detail',
      '.v141-product-detail',
      '.v163-product-detail',
      '.v141-detail-shell',
      '.v163-detail-shell',
      '.v141-tabpanel',
      '.v163-tabpanel'
    ].join(',')).forEach(clearLimit);

    modal.querySelectorAll([
      '.sdc210-smart-cart',
      '.sdc210-step-controls',
      '.quote-actions-v176',
      '.modal-actions',
      '.v141-detail-actions',
      '.v163-detail-actions',
      '.v49-detail-actions'
    ].join(',')).forEach(el=>{
      setImp(el,'position','static');
      setImp(el,'bottom','auto');
      setImp(el,'top','auto');
      setImp(el,'left','auto');
      setImp(el,'right','auto');
      setImp(el,'transform','none');
    });

    // Categorías del cotizador: si está cerrada se mantiene cerrada.
    modal.querySelectorAll('.quote-category-list-v201').forEach(el=>{
      if(!el.classList.contains('is-open')){
        setImp(el,'display','none');
      }else{
        setImp(el,'display','grid');
        clearLimit(el);
      }
    });
  }

  function scrollTopOnStep(ev){
    const t=ev.target;
    if(!t || !t.closest) return;
    if(!t.closest('#modalRoot .modal')) return;
    if(!t.closest('[data-sdc210-step],[data-sdc210-prev],[data-sdc210-next]')) return;
    setTimeout(()=>{
      stabilize();
      const bd=document.querySelector('#modalRoot .modal-backdrop');
      if(bd){
        try{bd.scrollTo({top:0,behavior:'smooth'});}
        catch(e){bd.scrollTop=0;}
      }
    },80);
  }

  function boot(){
    stabilize();
    document.addEventListener('click',scrollTopOnStep,true);
    ['touchstart','touchmove','pointerdown','wheel','scroll','resize'].forEach(type=>{
      window.addEventListener(type,()=>requestAnimationFrame(stabilize),{passive:true,capture:true});
    });
    new MutationObserver(()=>requestAnimationFrame(stabilize)).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setInterval(stabilize,700);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
