/* SD COMAYAGUA · V32 final: estabilidad de scroll, modal y exportación */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function addV32(){
    document.body.classList.add('sdc-v32-final');
  }
  function resetInitialScroll(){
    try{ history.scrollRestoration='manual'; }catch(e){}
    if(location.hash) return;
    let n=0;
    const go=()=>{
      if(n++>4) return;
      if(!document.querySelector('#modalRoot .modal')) window.scrollTo({top:0,left:0,behavior:'auto'});
      setTimeout(go, n<2?60:220);
    };
    go();
  }
  function markModalState(){
    const has=!!document.querySelector('#modalRoot .modal, #modalRoot .modal-panel, #modalRoot .quote-modal, #modalRoot .sale-modal');
    document.body.classList.toggle('modal-open',has);
    document.body.classList.toggle('sdc-modal-open',has);
  }
  function makeBottomSafe(){
    const nav=$('.bottom-nav') || $('.sdc-v3-bottom');
    if(!nav) return;
    nav.setAttribute('data-sdc-v32-nav','1');
    const labels=$$('button span',nav).map(x=>x.textContent.trim().toLowerCase()).join('|');
    if(labels.includes('catálogo')){
      $$('button span',nav).forEach(sp=>{ if(sp.textContent.trim().toLowerCase()==='catálogo') sp.textContent='Inicio'; });
    }
  }
  function fixActionsLabels(){
    $$('.compact-actions,.doc-actions,.quick-actions,.receipt-actions,.actions-strip').forEach(box=>{
      box.setAttribute('data-sdc-v32-actions','1');
      $$('button,.btn',box).forEach(btn=>{
        const t=(btn.textContent||'').replace(/\s+/g,' ').trim();
        if(!btn.title && t) btn.title=t;
      });
    });
  }
  function keepModalScrollUsable(){
    const bodies=$$('#modalRoot .modal-body,#modalRoot .quote-body,#modalRoot .sale-body,#modalRoot .sheet-body');
    bodies.forEach(body=>{
      if(body.dataset.sdcV32Scroll) return;
      body.dataset.sdcV32Scroll='1';
      body.addEventListener('touchmove',ev=>ev.stopPropagation(),{passive:true});
      body.addEventListener('wheel',ev=>ev.stopPropagation(),{passive:true});
    });
  }
  function enhanceReceiptButtons(){
    const printable=$('#printableDoc');
    if(printable) printable.classList.add('receipt-v32-ready');
  }
  function run(){
    if(!document.body) return;
    addV32();
    markModalState();
    makeBottomSafe();
    fixActionsLabels();
    keepModalScrollUsable();
    enhanceReceiptButtons();
  }

  document.addEventListener('click',function(ev){
    const a=ev.target.closest('[data-action]');
    if(a && ['quote','sell','quickSale','receipts'].includes(a.dataset.action)){
      setTimeout(()=>{
        const body=$('#modalRoot .modal-body,#modalRoot .quote-body,#modalRoot .sale-body');
        if(body) body.scrollTop=0;
      },180);
    }
    const close=ev.target.closest('.close,[data-close],.modal-close');
    if(close) setTimeout(markModalState,80);
  },true);

  document.addEventListener('keydown',function(ev){
    if(ev.key==='Escape') setTimeout(markModalState,80);
  },true);

  const obs=new MutationObserver(()=>{
    clearTimeout(obs._t);
    obs._t=setTimeout(run,60);
  });
  function start(){
    run();
    resetInitialScroll();
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    setTimeout(run,400);
    setTimeout(run,1200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else start();
})();
