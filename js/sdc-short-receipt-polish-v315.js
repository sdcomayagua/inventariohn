/* v318: textos claros, ahorro en rojo y categorías en dos columnas. */
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

  function markSavings(card){
    card.querySelectorAll('.sdc208-variant-note small').forEach(function(small){
      var raw = small.textContent || '';
      var money = (raw.match(/Lps\.\s*[0-9.,]+/i) || ['Lps.'])[0];
      small.textContent = 'SI USAS ENVÍO NORMAL TE AHORRAS: ' + money;
      small.style.color = '#d61c3b';
      small.style.fontWeight = '950';
      small.style.letterSpacing = '.02em';
      small.style.textAlign = 'center';
      small.style.display = 'block';
      small.style.marginTop = '8px';
    });
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
    markSavings(card);
    card.dataset.sdc315Polished = '1';
  }

  function fixCategories(root){
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.category-sheet-grid-v191, .category-sheet-grid-v199').forEach(function(grid){
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      grid.style.gap = '10px';
      grid.style.width = '100%';
      grid.style.alignItems = 'stretch';
    });
    scope.querySelectorAll('.category-sheet-card-v199').forEach(function(card){
      card.style.gridColumn = 'auto';
      card.style.width = '100%';
      card.style.minWidth = '0';
      card.style.maxWidth = 'none';
      card.style.margin = '0';
    });
    scope.querySelectorAll('.category-sheet-main-v199').forEach(function(btn){
      btn.style.width = '100%';
      btn.style.minWidth = '0';
      btn.style.padding = '18px 8px';
    });
    scope.querySelectorAll('.category-sheet-actions-v199').forEach(function(actions){
      actions.style.display = 'grid';
      actions.style.gridTemplateColumns = '1fr 1fr';
      actions.style.gap = '7px';
    });
  }

  function fixQty(root){
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.delivery-qty-v245').forEach(function(box){
      box.style.width = '100%';
      box.style.display = 'grid';
      box.style.gridTemplateColumns = '1fr';
      box.style.gap = '8px';
    });
    scope.querySelectorAll('.delivery-qty-box-v245').forEach(function(box){
      box.style.width = '100%';
      box.style.maxWidth = 'none';
      box.style.display = 'grid';
      box.style.gridTemplateColumns = '58px minmax(0, 1fr) 58px';
      box.style.gap = '8px';
    });
  }

  function polishAll(root){
    var scope = root && root.querySelectorAll ? root : document;
    if(scope.matches && scope.matches('.short-receipt.sdc208-ticket, .sdc208-ticket.short-receipt')) polishCard(scope);
    scope.querySelectorAll('.short-receipt.sdc208-ticket, .sdc208-ticket.short-receipt').forEach(polishCard);
    fixCategories(scope);
    fixQty(scope);
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
