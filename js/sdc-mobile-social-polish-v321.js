/* v322 · Botones de redes SOLO dentro del detalle del producto.
   Quita cualquier fila de redes del catálogo principal. No cambia inventario, precios ni cálculos. */
(function(){
  'use strict';
  var scheduled=false;

  function text(el){ return (el && el.textContent || '').trim(); }

  function productTitleFromModal(modal){
    return text(modal && modal.querySelector('.v141-head-copy h3, .modal-head h3, h3, h4')) || 'Producto SD Comayagua';
  }

  function productIdFromModal(modal){
    var small=text(modal && modal.querySelector('.v141-head-copy small, .v49-detail-main small, .v163-detail-main small'));
    if(small.indexOf('·') !== -1){
      var parts=small.split('·').map(function(x){return x.trim();}).filter(Boolean);
      return parts[parts.length-1] || '';
    }
    return '';
  }

  function visiblePrice(modal){
    var normal=text(modal && modal.querySelector('[data-v49-total="normal"]'));
    var local=text(modal && modal.querySelector('[data-v49-total="local"]'));
    var cod=text(modal && modal.querySelector('[data-v49-total="cod"]'));
    return {normal:normal, local:local, cod:cod};
  }

  function toast(msg){
    var el=document.getElementById('toast');
    if(!el) return;
    el.textContent=msg;
    el.classList.add('show');
    clearTimeout(el._sdc321Timer);
    el._sdc321Timer=setTimeout(function(){el.classList.remove('show');},2600);
  }

  function copyText(value, okMessage){
    value=String(value || '').trim();
    if(!value) return toast('No se pudo preparar el texto.');
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(value).then(function(){toast(okMessage || 'Texto copiado.');}).catch(function(){fallbackCopy(value,okMessage);});
    }else{
      fallbackCopy(value,okMessage);
    }
  }

  function fallbackCopy(value, okMessage){
    var ta=document.createElement('textarea');
    ta.value=value;
    ta.setAttribute('readonly','readonly');
    ta.style.position='fixed';
    ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    try{ document.execCommand('copy'); toast(okMessage || 'Texto copiado.'); }
    catch(e){ toast('Mantén presionado para copiar el texto.'); }
    ta.remove();
  }

  function socialText(modal, network){
    var title=productTitleFromModal(modal);
    var price=visiblePrice(modal);
    var main=price.normal || price.local || text(modal.querySelector('.v141-price-box b, .v163-price-box b')) || '';
    var cod=price.cod || '';
    var colors=Array.from(modal.querySelectorAll('.v86-color-client span, .v141-color-card span, .v163-color-card span')).map(text).filter(Boolean).slice(0,4).join(' · ');
    var base='🔥 '+title+' disponible en SD COMAYAGUA\n\nPrecio: '+main;
    if(cod) base+='\nPagar a recibir: '+cod;
    if(colors) base+='\nColores: '+colors;
    base+='\n\n📍 Somos de Comayagua\n📲 WhatsApp: +504 3151-7755';
    if(network==='instagram') base+='\n\n#SDComayagua #Comayagua #Honduras #TiendaOnline #ProductosHN';
    else base+='\n\nEscríbanos para más información.';
    return base;
  }

  function makeButton(cls, icon, label, action, title){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='sdc321-social-btn '+cls;
    btn.dataset.sdc321SocialAction=action;
    btn.title=title || label;
    btn.setAttribute('aria-label', title || label);
    btn.innerHTML='<i aria-hidden="true">'+icon+'</i><span>'+label+'</span>';
    return btn;
  }

  function cleanupCatalogRows(){
    document.querySelectorAll('#inventario .sdc321-social-row').forEach(function(row){row.remove();});
    document.querySelectorAll('#inventario article.product-card[data-sdc321-social]').forEach(function(card){delete card.dataset.sdc321Social;});
  }

  function polishCatalogImages(root){
    (root||document).querySelectorAll('#inventario article.product-card[data-id], #inventario article.product-card[data-product-id]').forEach(function(card){
      var img=card.querySelector('.product-photo-v178 img, .product-photo-v246 img');
      if(!img || img.dataset.sdc321Img==='1') return;
      img.dataset.sdc321Img='1';
      try{
        img.loading='lazy';
        img.decoding='async';
        img.draggable=false;
        if(!img.getAttribute('alt')) img.alt=text(card.querySelector('h3')) || 'Producto SD Comayagua';
      }catch(e){}
    });
  }

  function handleSocialClick(ev){
    var btn=ev.target.closest && ev.target.closest('[data-sdc321-social-action]');
    if(!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    var modal=btn.closest('.product-detail-modal-v221, .modal');
    var action=btn.dataset.sdc321SocialAction;

    if(action==='whatsapp'){
      var wa=document.getElementById('v53WhatsAppProduct');
      if(wa){ wa.click(); return; }
      return toast('Abra el producto completo para enviar por WhatsApp.');
    }
    if(action==='facebook'){
      copyText(socialText(modal,'facebook'),'Texto para Facebook copiado.');
      return;
    }
    if(action==='instagram'){
      copyText(socialText(modal,'instagram'),'Texto para Instagram copiado.');
      return;
    }
    if(action==='photo'){
      var photo=document.getElementById('v49DownloadProductPhoto');
      if(photo){ photo.click(); return; }
      return toast('Abra la pestaña IMAGEN para generar la foto.');
    }
  }

  function injectDetailSocial(modal){
    if(!modal || modal.querySelector('.sdc321-detail-social-wrap')) return;
    var id=productIdFromModal(modal);
    var title=productTitleFromModal(modal);
    var body=modal.querySelector('.v49-product-detail, .modal-body');
    if(!body) return;

    var wrap=document.createElement('section');
    wrap.className='sdc321-detail-social-wrap no-print';
    wrap.setAttribute('aria-label','Botones para compartir producto');
    wrap.innerHTML='<div class="sdc321-detail-social-head"><b>Compartir producto</b><span>Úsalo para redes o clientes</span></div>';

    var row=document.createElement('div');
    row.className='sdc321-social-row sdc321-detail-social-row';
    row.appendChild(makeButton('sdc321-social-wa','W','WhatsApp','whatsapp','Enviar '+title+' por WhatsApp'));
    row.appendChild(makeButton('sdc321-social-fb','f','Facebook','facebook','Copiar texto para Facebook Marketplace'));
    row.appendChild(makeButton('sdc321-social-ig','◎','Instagram','instagram','Copiar texto para Instagram'));
    row.appendChild(makeButton('sdc321-social-photo','▣','Foto','photo','Descargar foto limpia del producto'));
    wrap.appendChild(row);
    wrap.addEventListener('click',handleSocialClick,true);

    var actions=body.querySelector('.v49-detail-actions, .v141-detail-actions, .v163-detail-actions, .modal-actions');
    if(actions && actions.parentNode){
      actions.parentNode.insertBefore(wrap, actions);
    }else{
      body.appendChild(wrap);
    }
    if(id) wrap.dataset.productId=id;
  }

  function polish(root){
    cleanupCatalogRows();
    polishCatalogImages(root || document);
    document.querySelectorAll('.product-detail-modal-v221').forEach(injectDetailSocial);
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
