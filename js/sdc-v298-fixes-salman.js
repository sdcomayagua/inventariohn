/* SDC v298 - ajustes pedidos: categorias 2 columnas, detalle ancho y miniaturas en recibo corto */
(function(){
  'use strict';
  function clean(v){return String(v||'').trim();}
  function getProducts(){try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return []}}
  function firstImage(p){return clean(p.image||p.imagen||p.foto||String(p.gallery||p.galeria||'').split(/\n|\||;/)[0]||'')}
  function inject(){
    if(document.getElementById('sdc-v298-fixes-style')) return;
    var css = [
      '#modalRoot .category-sheet-v199 .category-sheet-grid-v199{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-card-v199{width:auto!important;min-width:0!important;margin:0!important;min-height:138px!important;padding:12px!important;border-radius:24px!important;text-align:center!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-card-v199:first-child{grid-column:1/-1!important;min-height:190px!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-main-v199{width:100%!important;height:100%!important;display:grid!important;place-items:center!important;text-align:center!important}',
      '#modalRoot .category-sheet-v199 [data-catprint-v199]{display:none!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-actions-v199{display:flex!important;justify-content:center!important;gap:10px!important}',
      '#modalRoot .product-detail-modal-v221 .v250-qty-line{width:100%!important;max-width:none!important;box-sizing:border-box!important;padding:18px!important;overflow:visible!important}',
      '#modalRoot .product-detail-modal-v221 .v49-qty-wrap{width:100%!important;max-width:none!important}',
      '#modalRoot .product-detail-modal-v221 .v49-qty-stepper{width:100%!important;max-width:none!important;display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:12px!important;box-sizing:border-box!important;overflow:visible!important}',
      '#modalRoot .product-detail-modal-v221 .v49-qty-stepper button,#modalRoot .product-detail-modal-v221 .v49-qty-stepper b{width:100%!important;min-width:0!important;min-height:72px!important;border-radius:22px!important;display:grid!important;place-items:center!important;box-sizing:border-box!important}',
      '#modalRoot .product-detail-modal-v221 .v250-price-cards{width:100%!important;max-width:none!important;display:grid!important;grid-template-columns:1fr!important;gap:12px!important}',
      '#modalRoot .product-detail-modal-v221 .v250-price-cards .v164-price-option{width:100%!important;max-width:none!important;justify-self:stretch!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}',
      '#modalRoot .product-detail-modal-v221 .v250-price-cards [data-v49-card="normal"]{transform:none!important;margin-left:0!important}',
      '.sdc208-line.has-sdc298-thumb{display:grid!important;grid-template-columns:42px 54px minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important}',
      '.sdc298-receipt-thumb{width:54px!important;height:54px!important;border-radius:14px!important;object-fit:cover!important;background:#eef6ff!important;border:1px solid #d9e8f8!important}',
      '.sdc230-compare-export .sdc208-line.has-sdc298-thumb{grid-template-columns:42px 54px minmax(0,1fr) auto!important}',
      '@media(max-width:700px){#modalRoot .category-sheet-v199 .category-sheet-grid-v199{grid-template-columns:repeat(2,minmax(0,1fr))!important}#modalRoot .category-sheet-v199 .category-sheet-card-v199:first-child{grid-column:1/-1!important}#modalRoot .category-sheet-v199 .category-sheet-main-v199 b{font-size:42px!important}#modalRoot .category-sheet-v199 .category-sheet-card-v199:first-child .category-sheet-main-v199 b{font-size:56px!important}}'
    ].join('\n');
    var st=document.createElement('style'); st.id='sdc-v298-fixes-style'; st.textContent=css; document.head.appendChild(st);
  }
  function fixCategorySheet(){
    document.querySelectorAll('#modalRoot .category-sheet-v199').forEach(function(sheet){
      sheet.querySelectorAll('[data-catprint-v199]').forEach(function(btn){btn.remove()});
      sheet.querySelectorAll('.category-sheet-actions-v199').forEach(function(row){if(!row.querySelector('button')) row.remove()});
    });
  }
  function fixReceiptImages(){
    var products=getProducts(); if(!products.length) return;
    document.querySelectorAll('#modalRoot .sdc208-line:not(.has-sdc298-thumb)').forEach(function(line){
      var name=clean(line.querySelector('.sdc208-line-copy b')&&line.querySelector('.sdc208-line-copy b').textContent);
      if(!name) return;
      var p=products.find(function(x){return clean(x.name||x.nombre).toLowerCase()===name.toLowerCase()});
      var img=p?firstImage(p):''; if(!img) return;
      var index=line.querySelector('.sdc208-line-index'); if(!index) return;
      var im=document.createElement('img'); im.className='sdc298-receipt-thumb'; im.src=img; im.alt=name; im.crossOrigin='anonymous'; im.referrerPolicy='no-referrer'; im.onerror=function(){im.remove()};
      index.insertAdjacentElement('afterend',im); line.classList.add('has-sdc298-thumb');
    });
  }
  function run(){inject();fixCategorySheet();fixReceiptImages();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',function(){setTimeout(run,80)},true);
  setInterval(run,800);
})();
