/* SD Comayagua v190 · Seguridad visual móvil
   Evita zoom accidental, corrige saltos y mejora enfoque en formularios. */
(function(){
  'use strict';
  let lastTouchEnd=0;
  document.addEventListener('touchend',function(ev){
    const now=Date.now();
    if(now-lastTouchEnd<=280 && !ev.target.closest('input,textarea,select')) ev.preventDefault();
    lastTouchEnd=now;
  },{passive:false});

  function scrollFocusedIntoView(ev){
    const el=ev.target;
    if(!el || !el.matches || !el.matches('input,textarea,select')) return;
    window.setTimeout(()=>{
      try{el.scrollIntoView({block:'center',behavior:'smooth'});}catch(err){}
    },260);
  }
  document.addEventListener('focusin',scrollFocusedIntoView);
})();
