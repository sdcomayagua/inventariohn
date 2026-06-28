/* v320 · Ajustes visuales detectados en capturas. No cambia datos ni cálculos. */
(function(){
  'use strict';
  var scheduled=false;

  function cleanOfferBars(root){
    (root||document).querySelectorAll('[data-v49-offer]').forEach(function(el){
      var txt=(el.textContent||'').trim();
      if(!txt){
        el.style.setProperty('display','none','important');
        el.style.setProperty('min-height','0','important');
        el.style.setProperty('height','0','important');
        el.style.setProperty('padding','0','important');
        el.style.setProperty('margin','0','important');
        el.style.setProperty('border','0','important');
        el.style.setProperty('box-shadow','none','important');
        el.setAttribute('aria-hidden','true');
      }else{
        el.removeAttribute('aria-hidden');
      }
    });
  }

  function polishDeliveryText(root){
    (root||document).querySelectorAll('[data-v49-card="cod"] span').forEach(function(span){
      if(/env[ií]o\s+pagar\s+al\s+recibir/i.test(span.textContent||'')){
        span.textContent='PAGAR A RECIBIR';
      }
    });
    (root||document).querySelectorAll('[data-v49-card="normal"] span').forEach(function(span){
      if(/env[ií]o\s+normal/i.test(span.textContent||'')){
        span.textContent='ENVÍO NORMAL';
      }
    });
  }

  function removePurpleTotals(root){
    (root||document).querySelectorAll('.quote-body-v176 .summary-total, .totals-mini-v176 .summary-total').forEach(function(el){
      el.style.setProperty('background','linear-gradient(135deg,#061b34 0%,#064f9f 52%,#0b72df 100%)','important');
      el.style.setProperty('color','#fff','important');
      el.querySelectorAll('*').forEach(function(child){ child.style.setProperty('color','#fff','important'); });
    });
  }

  function tagCodCards(root){
    (root||document).querySelectorAll('[data-v49-card="cod"]').forEach(function(card){
      card.classList.add('sdc320-cod-card');
      card.setAttribute('aria-label','Pagar a recibir con comisión');
    });
    (root||document).querySelectorAll('[data-v49-card="normal"]').forEach(function(card){
      card.classList.add('sdc320-normal-card');
      card.setAttribute('aria-label','Envío normal por depósito o Tigo Money');
    });
  }

  function polish(root){
    root=root&&root.querySelectorAll?root:document;
    cleanOfferBars(root);
    polishDeliveryText(root);
    removePurpleTotals(root);
    tagCodCards(root);
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
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
