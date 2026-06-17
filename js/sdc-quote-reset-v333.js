/* v333 · Limpia entrega local COMAYAGUA y cantidad pegada de cotización anterior.
   No cambia inventario ni precios base. */
(function(){
  'use strict';
  var scheduled=false;
  var lastModal=null;
  var lastProductKey='';

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el, prop, value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }

  function modalKey(modal){
    if(!modal) return '';
    var title=txt(modal.querySelector('h1,h2,h3,.modal-title,.v49-title,.v141-head-copy h3'));
    var code=txt(modal.querySelector('small,.v49-detail-main small,.v141-head-copy small'));
    return title+'|'+code;
  }

  function hideLocalDelivery(modal){
    if(!modal) return;
    modal.querySelectorAll('[data-v49-card],[data-delivery],.v49-price-cards > *,.v141-price-cards > *,.v163-price-cards > *').forEach(function(card){
      var t=txt(card);
      if(/\bCOMAYAGUA\b/i.test(t) || /Producto\s+sin\s+env[ií]o/i.test(t) || /entrega\s+local\s+seg[uú]n\s+zona/i.test(t)){
        card.classList.add('sdc333-hide-local-delivery');
        setImp(card,'display','none');
        setImp(card,'visibility','hidden');
        setImp(card,'height','0');
        setImp(card,'min-height','0');
        setImp(card,'margin','0');
        setImp(card,'padding','0');
        setImp(card,'border','0');
        setImp(card,'overflow','hidden');
        card.setAttribute('aria-hidden','true');
      }
    });
  }

  function clickNormalIfNeeded(modal){
    if(!modal) return;
    var normal=modal.querySelector('[data-v49-card="normal"], [data-delivery="normal"]');
    if(normal && !/is-current|active|selected/i.test(normal.className || '')){
      try{ normal.click(); }catch(e){}
    }
  }

  function findQtyText(modal){
    if(!modal) return null;
    var candidates=Array.from(modal.querySelectorAll('input, b, strong, span, div')).filter(function(el){
      if(el.offsetParent === null && el.tagName !== 'INPUT') return false;
      var t=el.tagName === 'INPUT' ? String(el.value || '') : txt(el);
      return /^\d{1,3}$/.test(t);
    });
    var inQty=candidates.find(function(el){
      var parent=el.closest('[class*="qty"], [class*="cantidad"], .v49-qty-stepper, .v141-qty-stepper, .v163-qty-stepper');
      return !!parent;
    });
    return inQty || null;
  }

  function findMinusButton(modal){
    if(!modal) return null;
    var buttons=Array.from(modal.querySelectorAll('button'));
    return buttons.find(function(btn){
      var t=txt(btn);
      var aria=(btn.getAttribute('aria-label') || '').toLowerCase();
      return t === '-' || t === '−' || /menos|restar|disminuir/i.test(aria);
    }) || null;
  }

  function currentQty(modal){
    var el=findQtyText(modal);
    if(!el) return NaN;
    return parseInt(el.tagName === 'INPUT' ? el.value : txt(el),10);
  }

  function resetQtyToOne(modal){
    if(!modal || modal.dataset.sdc333QtyReset === '1') return;
    modal.dataset.sdc333QtyReset='1';
    var key=modalKey(modal);
    lastProductKey=key;

    var q=currentQty(modal);
    if(!Number.isFinite(q) || q <= 1) return;

    var minus=findMinusButton(modal);
    if(!minus) return;

    modal.classList.add('sdc333-qty-resetting');
    var guard=0;
    function step(){
      var now=currentQty(modal);
      if(!Number.isFinite(now) || now <= 1 || guard > 80){
        modal.classList.remove('sdc333-qty-resetting');
        return;
      }
      guard++;
      try{ minus.click(); }catch(e){}
      setTimeout(step,18);
    }
    step();
  }

  function markQuoteFinishedClicks(){
    document.addEventListener('click',function(ev){
      var btn=ev.target.closest && ev.target.closest('button,a');
      if(!btn) return;
      var t=txt(btn);
      if(/facturar|guardar|descargar|imagen|enviar|whatsapp|finalizar|cerrar\s+pedido/i.test(t)){
        try{
          sessionStorage.setItem('sdc333_last_quote_done','1');
          sessionStorage.setItem('sdc333_last_quote_done_at',String(Date.now()));
        }catch(e){}
      }
    },true);
  }

  function shouldResetModal(modal){
    if(!modal) return false;
    if(modal.dataset.sdc333QtyReset === '1') return false;
    var key=modalKey(modal);
    if(modal !== lastModal) return true;
    if(key && key !== lastProductKey) return true;
    try{
      var done=sessionStorage.getItem('sdc333_last_quote_done') === '1';
      var at=parseInt(sessionStorage.getItem('sdc333_last_quote_done_at') || '0',10);
      if(done && Date.now() - at < 1000*60*60) return true;
    }catch(e){}
    return false;
  }

  function polish(){
    document.querySelectorAll('.product-detail-modal-v221,.modal').forEach(function(modal){
      var t=txt(modal);
      if(!/CANTIDAD|ENV[IÍ]O NORMAL|PAGAR A RECIBIR|COMAYAGUA/i.test(t)) return;
      hideLocalDelivery(modal);
      clickNormalIfNeeded(modal);
      if(shouldResetModal(modal)){
        lastModal=modal;
        setTimeout(function(){ resetQtyToOne(modal); },60);
      }
    });
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      polish();
    });
  }

  function start(){
    markQuoteFinishedClicks();
    polish();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){ setTimeout(schedule,50); },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
