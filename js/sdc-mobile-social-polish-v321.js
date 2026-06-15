/* v321 · Botones rápidos para redes en tarjetas de producto.
   Usa acciones existentes: WhatsApp, textos para redes y foto limpia. */
(function(){
  'use strict';
  var scheduled=false;

  function productTitle(card){
    var h=card && card.querySelector('h3');
    return (h && h.textContent || 'producto').trim();
  }

  function productId(card){
    return (card && (card.dataset.id || card.dataset.productId) || '').trim();
  }

  function makeButton(cls, icon, label, action, id, title){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='sdc321-social-btn '+cls;
    btn.dataset.action=action;
    btn.dataset.id=id;
    btn.title=title || label;
    btn.setAttribute('aria-label', title || label);
    btn.innerHTML='<i aria-hidden="true">'+icon+'</i><span>'+label+'</span>';
    return btn;
  }

  function injectSocialRow(card){
    if(!card || card.dataset.sdc321Social==='1') return;
    var id=productId(card);
    if(!id) return;
    var actions=card.querySelector('.product-actions-v178, .product-actions-v190, .product-actions-v235');
    var copy=card.querySelector('.product-copy-v178, .product-copy-v235, .product-copy-v246') || actions;
    if(!copy) return;

    var name=productTitle(card);
    var row=document.createElement('div');
    row.className='sdc321-social-row no-print';
    row.setAttribute('aria-label','Botones rápidos para redes sociales');

    row.appendChild(makeButton('sdc321-social-wa','W','WhatsApp','waProduct',id,'Enviar '+name+' por WhatsApp'));
    row.appendChild(makeButton('sdc321-social-fb','f','Facebook','marketingProduct',id,'Copiar texto para Facebook Marketplace'));
    row.appendChild(makeButton('sdc321-social-ig','◎','Instagram','marketingProduct',id,'Copiar texto para Instagram'));
    row.appendChild(makeButton('sdc321-social-photo','▣','Foto','downloadProductPhotoDirect',id,'Descargar foto limpia del producto'));

    if(actions && actions.parentNode === card){
      card.insertBefore(row, actions);
    }else{
      copy.appendChild(row);
    }
    card.dataset.sdc321Social='1';
  }

  function polishImages(card){
    var img=card && card.querySelector('.product-photo-v178 img, .product-photo-v246 img');
    if(!img || img.dataset.sdc321Img==='1') return;
    img.dataset.sdc321Img='1';
    try{
      img.loading='lazy';
      img.decoding='async';
      img.draggable=false;
      if(!img.getAttribute('alt')) img.alt=productTitle(card);
    }catch(e){}
  }

  function polish(root){
    root=root&&root.querySelectorAll?root:document;
    root.querySelectorAll('#inventario article.product-card[data-id], #inventario article.product-card[data-product-id]').forEach(function(card){
      injectSocialRow(card);
      polishImages(card);
    });
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      polish(document);
    });
  }

  function start(){
    polish(document);
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
