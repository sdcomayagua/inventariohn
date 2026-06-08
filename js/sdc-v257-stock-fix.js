document.documentElement.dataset.sdcV257='stable-share-v303-polish';
(function(){
  console.info('SDC: modo estable activo con botones livianos v303 + polish.');
  if(!document.getElementById('sdc-v303-user-polish-final')){
    var c=document.createElement('link');
    c.id='sdc-v303-user-polish-final';
    c.rel='stylesheet';
    c.href='css/sdc-v303-user-polish-final.css?v=303-final-1';
    document.head.appendChild(c);
  }
  if(!document.getElementById('sdc-v302-share-safe-loader')){
    var s=document.createElement('script');
    s.id='sdc-v302-share-safe-loader';
    s.defer=true;
    s.src='js/sdc-v302-share-safe.js?v=302-safe-3';
    document.head.appendChild(s);
  }
})();