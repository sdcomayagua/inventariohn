/* v338 · Ordena la fila del producto en los recibos/comparativos.
   Layout final: cantidad | foto grande | nombre/detalle | precio. */
(function(){
  'use strict';
  var scheduled=false;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el,prop,value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }
  function isPriceText(t){ return /^Lps\.\s*[0-9.,]+$/i.test(String(t||'').trim()); }
  function isQtyText(t){ return /^\d{1,3}$/.test(String(t||'').trim()); }

  function smallestPriceElement(line){
    var all=Array.from(line.querySelectorAll('*')).filter(function(el){
      if(el.tagName === 'IMG') return false;
      return isPriceText(txt(el));
    });
    return all.find(function(el){
      return !Array.from(el.children || []).some(function(child){ return isPriceText(txt(child)); });
    }) || all[0] || null;
  }

  function qtyElement(line){
    var kids=Array.from(line.children).filter(function(el){ return el.tagName !== 'IMG'; });
    return kids.find(function(el){ return isQtyText(txt(el)); }) || Array.from(line.querySelectorAll('*')).find(function(el){
      if(el.tagName === 'IMG') return false;
      return isQtyText(txt(el)) && !el.closest('.sdc338-info');
    }) || null;
  }

  function splitInfoText(info){
    if(!info || info.dataset.sdc338Split === '1') return;
    var raw=txt(info);
    if(!raw || isPriceText(raw) || isQtyText(raw)) return;
    var productMatch=raw.match(/^(.+?)(\s+\d+\s+unidad(?:es)?\s*·\s*Lps\.[\s\S]*)$/i);
    if(!productMatch) return;
    info.innerHTML='';
    var name=document.createElement('div');
    name.className='sdc338-name';
    name.textContent=productMatch[1].trim();
    var meta=document.createElement('div');
    meta.className='sdc338-meta';
    meta.textContent=productMatch[2].trim();
    info.appendChild(name);
    info.appendChild(meta);
    info.dataset.sdc338Split='1';
  }

  function tagInfoChildren(info){
    if(!info) return;
    var children=Array.from(info.children);
    if(!children.length){
      splitInfoText(info);
      return;
    }
    children.forEach(function(el){
      var t=txt(el);
      if(!t || isPriceText(t) || isQtyText(t)) return;
      if(/unidad|color|Lps\.\s*\d+\s*c\/u/i.test(t)) el.classList.add('sdc338-meta');
      else el.classList.add('sdc338-name');
    });
  }

  function normalizeLine(line){
    if(!line || line.dataset.sdc338Done === '1') return;
    var image=line.querySelector('img');
    var price=smallestPriceElement(line);
    if(!image || !price) return;
    var quantity=qtyElement(line);
    if(!quantity) return;

    var info=line.querySelector('.sdc338-info');
    if(!info){
      info=document.createElement('div');
      info.className='sdc338-info';
      var direct=Array.from(line.childNodes);
      direct.forEach(function(node){
        if(node.nodeType !== 1){
          if(String(node.textContent||'').trim()) info.appendChild(node);
          return;
        }
        if(node===quantity || node===image || node===price) return;
        if(node.contains && (node.contains(quantity) || node.contains(image) || node.contains(price))) return;
        info.appendChild(node);
      });
    }

    quantity.classList.add('sdc338-qty');
    image.classList.add('sdc338-thumb','sdc331-receipt-thumb');
    price.classList.add('sdc338-price');
    tagInfoChildren(info);
    splitInfoText(info);

    line.innerHTML='';
    line.appendChild(quantity);
    line.appendChild(image);
    line.appendChild(info);
    line.appendChild(price);
    line.classList.add('sdc338-line','sdc331-has-thumb');
    line.dataset.sdc338Done='1';

    setImp(quantity,'color','#0b63ce');
    setImp(quantity,'background','#eef6ff');
    setImp(quantity,'text-shadow','none');
    setImp(price,'color','#d61c3b');
  }

  function polish(root){
    var scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(normalizeLine);
  }

  function patchCanvasCapture(){
    if(!window.html2canvas || window.html2canvas.__sdc338LayoutPatch) return;
    var original=window.html2canvas;
    var patched=function(node,opts){
      try{ polish(document); if(node && node.querySelectorAll) polish(node); }catch(e){}
      return original.call(this,node,opts);
    };
    patched.__sdc338LayoutPatch=true;
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
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){ setTimeout(schedule,40); setTimeout(schedule,200); },true);
    var tries=0;
    var timer=setInterval(function(){ patchCanvasCapture(); polish(document); if(++tries>20) clearInterval(timer); },250);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
