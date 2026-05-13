(function(){
  function boot(){
    if(!document.body) return;
    document.body.classList.add('sdc-v53-mobile-clean');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
