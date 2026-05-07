(function(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./sw.js').catch(function(err){
      console.warn('SDC PWA no pudo registrarse:', err);
    });
  });
})();
