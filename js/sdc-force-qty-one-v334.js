/* v334 · Fuerza la cantidad del detalle a 1 al abrir producto.
   Evita que quede pegada la cantidad de la cotización anterior. */
(function(){
  'use strict';
  var scheduled=false;
  var lastSeenKey='';
  var resetWindowUntil=0;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el, prop, value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }

  function isMinus(btn){
    var t=txt(btn);
    var aria=(btn && btn.getAttribute && (btn.getAttribute('aria-label')||btn.title||'') || '').toLowerCase();
    return t==='-' || t==='−' || /menos|restar|disminuir|decrease/i.test(aria);
  }
  function isPlus(btn){
    var t=txt(btn);
    var aria=(btn && btn.getAttribute && (btn.getAttribute('aria-label')||btn.title||'') || '').toLowerCase();
    return t==='+' || /m[aá]s|sumar|aumentar|increase|plus/i.test(aria);
  }

  function modalKey(modal){
    if(!modal) return '';
    var title=txt(modal.querySelector('h1,h2,h3,.modal-title,.v49-title,.v141-head-copy h3,.v49-detail-main h3'));
    var code=txt(modal.querySelector('.v141-head-copy small,.v49-detail-main small,small'));
    return title+'|'+code;
  }

  function findQtyStepper(modal){
    if(!modal) return null;
    var buttons=Array.from(modal.querySelectorAll('button'));
    var minus=buttons.find(isMinus);
    var plus=buttons.find(isPlus);
    if(!minus || !plus) return null;

    var common=minus.parentElement;
    for(var i=0;i<6 && common;i++,common=common.parentElement){
      if(common.contains(plus)) break;
    }
    if(!common) common=minus.parentElement || modal;

    var qtyEls=Array.from(common.querySelectorAll('input,b,strong,span,div')).filter(function(el){
      if(el===minus || el===plus || minus.contains(el) || plus.contains(el)) return false;
      var value=el.tagName==='INPUT' ? String(el.value||'') : txt(el);
      return /^\d{1,3}$/.test(value);
    });
    var qtyEl=qtyEls.find(function(el){
      var r=el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
      return r.width>20 && r.height>20;
    }) || qtyEls[0];

    return {wrap:common, minus:minus, plus:plus, qty:qtyEl};
  }

  function readQty(step){
    if(!step || !step.qty) return NaN;
    return parseInt(step.qty.tagName==='INPUT' ? step.qty.value : txt(step.qty),10);
  }

  function directSetOne(step){
    if(!step || !step.qty) return;
    if(step.qty.tagName==='INPUT'){
      step.qty.value='1';
      step.qty.dispatchEvent(new Event('input',{bubbles:true}));
      step.qty.dispatchEvent(new Event('change',{bubbles:true}));
    }else{
      step.qty.textContent='1';
    }
  }

  function clickMinus(step){
    if(!step || !step.minus) return;
    try{ step.minus.click(); }catch(e){}
    try{
      step.minus.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));
    }catch(e){}
  }

  function resetStepperToOne(modal, reason){
    var step=findQtyStepper(modal);
    if(!step) return;
    var q=readQty(step);
    if(!Number.isFinite(q) || q<=1) return;

    modal.dataset.sdc334Resetting='1';
    var guard=0;
    function loop(){
      step=findQtyStepper(modal);
      q=readQty(step);
      if(!Number.isFinite(q) || q<=1 || guard>=40){
        if(Number.isFinite(q) && q>1) directSetOne(step);
        modal.dataset.sdc334Resetting='0';
        return;
      }
      guard++;
      clickMinus(step);
      setTimeout(loop,24);
    }
    loop();
  }

  function hideLocalDelivery(modal){
    if(!modal) return;
    modal.querySelectorAll('[data-v49-card],[data-delivery],.v49-price-cards > *,.v141-price-cards > *,.v163-price-cards > *').forEach(function(card){
      var t=txt(card);
      if(/\bCOMAYAGUA\b/i.test(t) || /Producto\s+sin\s+env[ií]o/i.test(t) || /entrega\s+local\s+seg[uú]n\s+zona/i.test(t)){
        card.classList.add('sdc333-hide-local-delivery');
        ['display','visibility','height','min-height','margin','padding','border','overflow'].forEach(function(prop){
          var value={display:'none',visibility:'hidden',height:'0','min-height':'0',margin:'0',padding:'0',border:'0',overflow:'hidden'}[prop];
          setImp(card,prop,value);
        });
        card.setAttribute('aria-hidden','true');
      }
    });
  }

  function isProductDetail(modal){
    var t=txt(modal);
    return /CANTIDAD/i.test(t) && (/ENV[IÍ]O NORMAL/i.test(t) || /PAGAR A RECIBIR/i.test(t) || /Colores/i.test(t));
  }

  function markOpenWindow(modal){
    var key=modalKey(modal);
    if(key && key!==lastSeenKey){
      lastSeenKey=key;
      resetWindowUntil=Date.now()+1800;
      modal.dataset.sdc334OpenKey=key;
      modal.dataset.sdc333QtyReset='0';
      setTimeout(function(){ resetStepperToOne(modal,'open-1'); },50);
      setTimeout(function(){ resetStepperToOne(modal,'open-2'); },180);
      setTimeout(function(){ resetStepperToOne(modal,'open-3'); },520);
    }
  }

  function markQuoteFinishedClicks(){
    document.addEventListener('click',function(ev){
      var btn=ev.target.closest && ev.target.closest('button,a');
      if(!btn) return;
      var t=txt(btn);
      if(/agregar|cotizar|quitar|facturar|guardar|descargar|imagen|enviar|whatsapp|finalizar|cerrar\s+pedido/i.test(t)){
        resetWindowUntil=Date.now()+2200;
        try{
          sessionStorage.setItem('sdc333_last_quote_done','1');
          sessionStorage.setItem('sdc333_last_quote_done_at',String(Date.now()));
        }catch(e){}
        setTimeout(function(){
          document.querySelectorAll('.product-detail-modal-v221,.modal').forEach(function(m){ if(isProductDetail(m)) resetStepperToOne(m,'after-action'); });
        },90);
      }
    },true);
  }

  function polish(){
    document.querySelectorAll('.product-detail-modal-v221,.modal').forEach(function(modal){
      if(!isProductDetail(modal)) return;
      hideLocalDelivery(modal);
      markOpenWindow(modal);
      if(Date.now()<resetWindowUntil){
        resetStepperToOne(modal,'window');
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
    document.addEventListener('click',function(){ setTimeout(schedule,60); setTimeout(schedule,250); },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
