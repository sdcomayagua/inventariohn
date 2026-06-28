/* v343 · Rehace la fila del producto en factura/comparativo.
   No cambia montos, cantidades ni inventario. */
(function(){
  'use strict';
  var busy=false;

  function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function priceList(t){return String(t||'').match(/Lps\.\s*[0-9.,]+/gi)||[];}
  function clean(t){return String(t||'').replace(/\s+/g,' ').trim();}
  function css(el,p,v){if(el&&el.style)el.style.setProperty(p,v,'important');}

  function parse(line){
    var raw=clean(text(line));
    var prices=priceList(raw);
    var price=prices.length?prices[prices.length-1]:'';
    var qty='1';
    var qtyMatch=raw.match(/^\s*(\d{1,3})\b/);
    if(qtyMatch) qty=qtyMatch[1];

    var body=raw;
    if(qtyMatch) body=clean(body.slice(qtyMatch[0].length));
    if(price){
      var i=body.lastIndexOf(price);
      if(i>=0) body=clean(body.slice(0,i));
    }
    body=clean(body.replace(/^Lps\.\s*[0-9.,]+\s*/i,''));

    var name=body;
    var meta='';
    var unit=body.match(/\b\d+\s+unidad(?:es)?\s*[·\-]\s*[\s\S]*$/i);
    if(unit){
      name=clean(body.slice(0,unit.index));
      meta=clean(unit[0]);
    }
    if(!name){
      var h=line.querySelector('h1,h2,h3,h4,b,strong');
      name=clean(text(h))||'Producto';
    }
    return {qty:qty,name:name,meta:meta,price:price};
  }

  function rebuild(line){
    if(!line) return;
    var img=line.querySelector('img');
    var data=parse(line);
    if(!img||!data.price||!data.name) return;

    var img2=img.cloneNode(true);
    img2.className='sdc343-thumb';
    img2.alt=img.alt||'Producto';
    img2.loading='eager';
    img2.decoding='async';

    var qty=document.createElement('div');
    qty.className='sdc343-qty';
    qty.textContent=data.qty||'1';

    var info=document.createElement('div');
    info.className='sdc343-info';
    var name=document.createElement('div');
    name.className='sdc343-name';
    name.textContent=data.name;
    info.appendChild(name);
    if(data.meta){
      var meta=document.createElement('div');
      meta.className='sdc343-meta';
      meta.textContent=data.meta;
      info.appendChild(meta);
    }

    var price=document.createElement('div');
    price.className='sdc343-price';
    price.textContent=data.price;

    line.innerHTML='';
    line.appendChild(qty);
    line.appendChild(img2);
    line.appendChild(info);
    line.appendChild(price);
    line.classList.remove('sdc338-line','sdc339-line');
    line.classList.add('sdc343-line');
    line.dataset.sdc343Done=String(Date.now());

    css(qty,'color','#0b63ce');
    css(price,'color','#d61c3b');
  }

  function run(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(rebuild);
  }

  function patchCanvas(){
    if(!window.html2canvas||window.html2canvas.__sdc343ReceiptPatch) return;
    var original=window.html2canvas;
    var patched=function(node,opts){
      try{run(document); if(node&&node.querySelectorAll)run(node);}catch(e){}
      return original.call(this,node,opts);
    };
    patched.__sdc343ReceiptPatch=true;
    window.html2canvas=patched;
  }

  function schedule(){
    if(busy) return;
    busy=true;
    requestAnimationFrame(function(){busy=false;patchCanvas();run(document);});
  }

  function start(){
    patchCanvas();
    run(document);
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){setTimeout(schedule,40);setTimeout(schedule,220);},true);
    var n=0,t=setInterval(function(){patchCanvas();run(document);if(++n>24)clearInterval(t);},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
