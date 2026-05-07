(function(){
  const VERSION='Elite';
  function ready(){
    document.body.classList.add('sdc-ready-executive');
    addBadge();
    bindTouchFeedback();
    observeQuality();
  }
  function addBadge(){
    if(document.querySelector('.elite-badge')) return;
    const badge=document.createElement('div');
    badge.className='elite-badge no-print';
    badge.textContent='SDC '+VERSION;
    document.body.appendChild(badge);
  }
  function bindTouchFeedback(){
    document.addEventListener('pointerdown',e=>{
      const el=e.target.closest('button,.btn,.category-card,.product-card');
      if(!el) return;
      el.classList.add('sdc-touch');
      setTimeout(()=>el.classList.remove('sdc-touch'),160);
    },{passive:true});
    document.addEventListener('focusin',e=>{
      const el=e.target.closest('input,select,textarea,button');
      if(el) el.classList.add('sdc-focus-ring');
    });
    document.addEventListener('focusout',e=>{
      const el=e.target.closest('input,select,textarea,button');
      if(el) el.classList.remove('sdc-focus-ring');
    });
  }
  function observeQuality(){
    const root=document.getElementById('modalRoot')||document.body;
    const enhance=()=>{
      document.querySelectorAll('#productShareCard:not([data-elite])').forEach(card=>{
        card.dataset.v38='1';
        card.classList.add('share-elite-ready');
      });
      document.querySelectorAll('#printableDoc:not([data-elite])').forEach(doc=>{
        doc.dataset.v38='1';
        doc.classList.add('doc-elite-ready');
      });
    };
    enhance();
    new MutationObserver(enhance).observe(root,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready); else ready();
})();
