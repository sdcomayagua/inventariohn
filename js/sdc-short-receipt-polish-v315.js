/* v317: etiquetas y explicaciones claras para recibos cortos.
   Azul: ENVÍO NORMAL.
   Anaranjado: PAGAR A RECIBIR.
   La explicación va debajo del encabezado para no deformarlo. */
(function(){
  'use strict';

  var NORMAL_TITLE = 'ENVÍO NORMAL';
  var COD_TITLE = 'PAGAR A RECIBIR';
  var NORMAL_NOTE = 'Aquí deberá depositar o transferir el dinero por banco o Tigo Money.';
  var COD_NOTE = 'Aquí podrá pagar en efectivo una vez reciba el paquete en sus manos.';

  function isCodCard(card){
    if(!card) return false;
    return card.getAttribute('data-variant') === 'cod' || card.classList.contains('sdc208-cod');
  }

  function noteText(isCod){
    return isCod ? COD_NOTE : NORMAL_NOTE;
  }

  function ensureExplanation(card,isCod){
    var head = card.querySelector('.sdc208-head');
    if(!head) return;

    var note = card.querySelector(':scope > .sdc315-method-explain');
    var oldInside = head.querySelector('.sdc315-method-explain');

    if(oldInside){
      note = oldInside;
      head.insertAdjacentElement('afterend', note);
    }

    if(!note){
      note = document.createElement('p');
      note.className = 'sdc315-method-explain';
      head.insertAdjacentElement('afterend', note);
    }

    note.textContent = noteText(isCod);
  }

  function polishCard(card){
    if(!card) return;
    var title = card.querySelector('.sdc208-head-copy h2');
    var mode = card.querySelector('.sdc208-mode');
    var isCod = isCodCard(card);

    if(title){
      title.textContent = isCod ? COD_TITLE : NORMAL_TITLE;
      title.setAttribute('aria-label', isCod ? 'Pagar a recibir' : 'Envío normal');
    }

    if(mode){
      mode.textContent = isCod ? 'Pagar al recibir' : 'Envío normal';
    }

    ensureExplanation(card,isCod);
    card.dataset.sdc315Polished = '1';
  }

  function polishAll(root){
    var scope = root && root.querySelectorAll ? root : document;
    if(scope.matches && scope.matches('.short-receipt.sdc208-ticket, .sdc208-ticket.short-receipt')) polishCard(scope);
    scope.querySelectorAll('.short-receipt.sdc208-ticket, .sdc208-ticket.short-receipt').forEach(polishCard);
  }

  function start(){
    polishAll(document);
    var observer = new MutationObserver(function(mutations){
      mutations.forEach(function(m){
        m.addedNodes && m.addedNodes.forEach(function(node){
          if(!node || node.nodeType !== 1) return;
          polishAll(node);
        });
      });
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
