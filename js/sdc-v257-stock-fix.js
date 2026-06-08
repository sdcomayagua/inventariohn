document.documentElement.dataset.sdcV257='stable-share-v302-b';
(function(){
  console.info('SDC: modo estable activo con botones livianos v302-b.');
  if(!document.getElementById('sdc-v302-share-safe-loader')){
    var s=document.createElement('script');
    s.id='sdc-v302-share-safe-loader';
    s.defer=true;
    s.src='js/sdc-v302-share-safe.js?v=302-safe-2';
    document.head.appendChild(s);
  }
})();