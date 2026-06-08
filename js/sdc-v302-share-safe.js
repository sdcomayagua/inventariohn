/* SDC v302 share safe */
(function(){
 if(window.SDCV302ShareSafeReady)return;window.SDCV302ShareSafeReady=true;
 const q=s=>document.querySelector(s),c=v=>String(v||'').trim(),m=n=>'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');
 function all(){try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return[]}}
 function nm(p){return c(p.name||p.nombre||'Producto')} function pr