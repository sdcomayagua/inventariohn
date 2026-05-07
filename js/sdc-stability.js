/* SD Comayagua · estabilidad móvil */
(function(){
  function unlockIfNoModal(){
    var root=document.getElementById('modalRoot');
    if(!root || !root.querySelector('.modal-backdrop')){
      document.body.classList.remove('modal-open');
    }
  }
  function allowModalScroll(){
    var root=document.getElementById('modalRoot');
    if(!root) return;
    if(root.querySelector('.modal-backdrop')){
      document.body.classList.add('modal-open');
      var modal=root.querySelector('.modal');
      if(modal){
        modal.style.overflowY='auto';
        modal.style.webkitOverflowScrolling='touch';
        modal.style.touchAction='pan-y';
      }
    }else{
      document.body.classList.remove('modal-open');
    }
  }
  window.addEventListener('DOMContentLoaded', function(){
    unlockIfNoModal();
    var root=document.getElementById('modalRoot');
    if(root && 'MutationObserver' in window){
      new MutationObserver(allowModalScroll).observe(root,{childList:true,subtree:false});
    }
    window.addEventListener('pageshow', unlockIfNoModal);
    window.addEventListener('orientationchange', function(){setTimeout(allowModalScroll, 250);});
  });
})();
