(function(){
  const VERSION='V38';
  function ready(){
    document.body.classList.add('sdc-ready-v38');
    addBadge();
    bindTouchFeedback();
    observeQuality();
  }
  function addBadge(){
    if(document.querySelector('.elite-v38-badge')) return;
    const badge=document.createElement('div');
    badge.className='elite-v38-badge no-print';
    badge.textContent='SDC Elite '+VERSION;
    document.body.appendChild(badge);
  }
  function bindTouchFeedback(){
    document.addEventListener('pointerdown',e=>{
      const el=e.target.closest('button,.btn,.category-card,.product-card');
      if(!el) return;
      el.classList.add('v38-touch');
      setTimeout(()=>el.classList.remove('v38-touch'),160);
    },{passive:true});
    document.addEventListener('focusin',e=>{
      const el=e.target.closest('input,select,textarea,button');
      if(el) el.classList.add('v38-focus-ring');
    });
    document.addEventListener('focusout',e=>{
      const el=e.target.closest('input,select,textarea,button');
      if(el) el.classList.remove('v38-focus-ring');
    });
  }
  function observeQuality(){
    const root=document.getElementById('modalRoot')||document.body;
    const enhance=()=>{
      document.querySelectorAll('#productShareCard:not([data-v38])').forEach(card=>{
        card.dataset.v38='1';
        card.classList.add('share-v38-ready');
      });
      document.querySelectorAll('#printableDoc:not([data-v38])').forEach(doc=>{
        doc.dataset.v38='1';
        doc.classList.add('doc-v38-ready');
      });
    };
    enhance();
    new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready); else ready();
})();
