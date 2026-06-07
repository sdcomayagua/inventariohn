/* SDC v301 - botones livianos: Catálogo WhatsApp y Facebook */
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const clean = v => String(v || '').trim();
  const money = n => 'Lps. ' + Math.round(Number(n || 0)).toLocaleString('es-HN');
  const norm = v => clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();

  function storeProducts(){
    try{
      if(window.SDCStore && typeof window.SDCStore.load === 'function'){
        return window.SDCStore.load().products || []