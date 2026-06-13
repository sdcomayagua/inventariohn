/* v315: etiquetas claras para recibos cortos.
   Reemplaza "Recibo corto" por:
   - ENVÍO NORMAL en el recibo azul
   - PAGAR A RECIBIR en el recibo anaranjado */
(function(){
  'use strict';

  var NORMAL_TITLE = 'ENVÍO NORMAL';
  var COD_TITLE = 'PAGAR A RECIBIR';

  function isCodCard(card){
    if(!card) return false;
    return card.getAttribute('data-variant') === 'cod' || card.classList.contains('sdc208-cod');
  }

  function polishCard(card){
    if(!card || card.__sdc315Polished) return;
    card.__sdc315Polished = true;
    var title = card.querySelector('.sdc208-head-copy h2');
    var mode = card.querySelector('.sdc208-mode');
    var isCod = isCodCard(card);

    if(title){
      title.textContent = isCod ? COD_TITLE : NORMAL_TITLE;
      title.setAttribute('aria-label', isCod ? 'Pagar a recibir' : 'Envío normal');
    }

    if(mode){
      var desired = isCod ? 'Pagar al recibir' : 'Envío normal';
      if(!mode.textContent || /recibo corto/i.test(mode.textContent)) mode.textContent = desired;
    }
  }

  function polishAll(root){
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt.sdc208-ticket, .sdc208-ticket.short-receipt').forEach(polishCard);
  }

  function start(){
    polishAll(document);
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes && m.addedNodes.forEach(function(node){
          if(!node || node.nodeType !== 1) return;
          if(node.matches && node.matches('.short-receipt.sdc208-ticket, .sdc208-ticket.short-receipt')) polishCard(node);
          polishAll(node);
        });
      });
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
