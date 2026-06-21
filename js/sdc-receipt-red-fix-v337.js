/* v337 · El rojo solo debe quedar en la frase de ahorro.
   Limpia estilos inline rojos aplicados por versiones anteriores. */
(function(){
  'use strict';
  var scheduled=false;
  var RED_RE=/SI\s+USAS\s+ENV[IÍ]O\s+NORMAL\s+TE\s+AHORRAS/i;
  var RED='#d61c3b';

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el, prop, value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }
  function clearInlineColor(el){ if(el && el.style){ el.style.removeProperty('color'); el.style.removeProperty('text-shadow'); } }
  function isReceipt(el){ return !!(el && el.closest && el.closest('.short-receipt,.shortReceiptExportHost')); }

  function smallestSavingsNodes(receipt){
    var all=Array.from(receipt.querySelectorAll('small,span,b,strong,p,div'))
      .filter(function(el){ return RED_RE.test(txt(el)); });
    return all.filter(function(el){
      return !Array.from(el.children || []).some(function(child){ return RED_RE.test(txt(child)); });
    });
  }

  function resetReceiptColors(receipt){
    if(!receipt) return;
    receipt.querySelectorAll('.sdc331-saving-red').forEach(function(el){
      el.classList.remove('sdc331-saving-red');
      clearInlineColor(el);
      el.querySelectorAll('*').forEach(clearInlineColor);
    });

    receipt.querySelectorAll('[style]').forEach(function(el){
      var color=(el.style && el.style.color || '').toLowerCase().replace(/\s+/g,'');
      if(color === RED || color === 'rgb(214,28,59)' || color === '#d61c3b'){
        if(!RED_RE.test(txt(el))) clearInlineColor(el);
      }
    });
  }

  function paintSavingsOnly(receipt){
    var nodes=smallestSavingsNodes(receipt);
    nodes.forEach(function(el){
      el.classList.add('sdc337-saving-red');
      setImp(el,'color',RED);
      setImp(el,'font-weight','950');
      setImp(el,'text-align','center');
      setImp(el,'text-shadow','none');
      el.querySelectorAll('*').forEach(function(child){ setImp(child,'color',RED); });
    });
  }

  function fixReceipt(receipt){
    resetReceiptColors(receipt);
    paintSavingsOnly(receipt);
  }

  function polish(root){
    var scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt,.shortReceiptExportHost .short-receipt').forEach(fixReceipt);
    if(scope.matches && scope.matches('.short-receipt')) fixReceipt(scope);
  }

  function patchCanvasCapture(){
    if(!window.html2canvas || window.html2canvas.__sdc337RedPatch) return;
    var original=window.html2canvas;
    var patched=function(node, opts){
      try{ polish(document); if(node && node.querySelectorAll) polish(node); }catch(e){}
      return original.call(this,node,opts);
    };
    patched.__sdc337RedPatch=true;
    window.html2canvas=patched;
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      patchCanvasCapture();
      polish(document);
    });
  }

  function start(){
    patchCanvasCapture();
    polish(document);
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(){ setTimeout(schedule,30); setTimeout(schedule,180); },true);
    var tries=0;
    var timer=setInterval(function(){ patchCanvasCapture(); polish(document); if(window.html2canvas || ++tries>20) clearInterval(timer); },250);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
