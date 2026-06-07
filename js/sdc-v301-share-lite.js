/* SDC v301 - botones livianos: Catálogo WhatsApp y Facebook */
(function(){
  'use strict';
  const clean=v=>String(v||'').trim();
  const money=n=>'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');
  const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const products=()=>{try{return (window.SDCStore&&window.SDCStore.load().products)||[]}catch(e){return[]}};
  const name=p=>clean(p.name||p.nombre||'Producto');
  const price=p=>Number(p.price||p.precio||0)||0;
  const tags=v=>clean(v).split(/[,;|/]+/).map(clean).filter(Boolean);
  const cat=p=>tags(p.categories||p.category