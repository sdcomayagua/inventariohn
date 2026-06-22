/* v348 · Reconstruye fila de producto en factura/comparativo para PC y móvil.
   Corrige texto pegado tipo 1Dedales V11 unidad y separa foto/nombre/precio.
   No cambia precios, stock, ventas ni Firebase. */
(function(){
  'use strict';
  var busy=false;

  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function priceList(s){return String(s||'').match(/Lps\.\s*[0-9.,]+/gi)||[];}

  function normalizeTitle(name){
    name=clean(name)
      .replace(/^(?:1\s*){2,}(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/^1{2,}(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/^1(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/^\d+\s+(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/\s+/g,' ')
      .trim();
    return name || 'Producto';
  }

  function getStored(line){
    var name=line.getAttribute('data-sdc348-name') || line.getAttribute('data-sdc346-name') || '';
    var meta=line.getAttribute('data-sdc348-meta') || line.getAttribute('data-sdc346-meta') || '';
    var qty=line.getAttribute('data-sdc348-qty') || line.getAttribute('data-sdc346-qty') || '';
    var price=line.getAttribute('data-sdc348-price') || line.getAttribute('data-sdc346-price') || '';
    return {name:name,meta:meta,qty:qty,price:price};
  }

  function parse(line){
    var img=line.querySelector('img');
    if(!img) return null;
    var stored=getStored(line);
    var raw=clean(txt(line));
    var prices=priceList(raw);
    var price=stored.price || (prices.length?prices[prices.length-1]:'');
    if(!price) price='Lps. 0';

    var qty=stored.qty || '1';
    var qm=raw.match(/^\s*(\d{1,3})(?=\D)/);
    if(qm) qty=String(Number(qm[1])||1);

    var body=raw;
    if(qm) body=clean(body.slice(qm[0].length));
    var pi=body.lastIndexOf(price);
    if(pi>=0) body=clean(body.slice(0,pi));

    body=body
      .replace(/^Lps\.\s*[0-9.,]+\s*/i,'')
      .replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])(?=\d+\s+unidad)/g,'$1 ')
      .replace(/([a-záéíóúñ])(?=Color:)/ig,'$1 · ')
      .replace(/c\/u\s*Color/ig,'c/u · Color')
      .replace(/Color:\s*Gene(?:ral)?/ig,'Color: General')
      .replace(/\s+/g,' ')
      .trim();

    var name=stored.name || body;
    var meta=stored.meta || '';
    var cut=body.match(/\b\d+\s+unidad(?:es)?\s*[·\-]?\s*[\s\S]*$/i);
    if(cut){
      name=stored.name || body.slice(0,cut.index);
      meta=stored.meta || cut[0];
    }

    /* Si la línea ya fue reconstruida y quedó pegada, reparar. */
    name=normalizeTitle(name);
    meta=clean(meta)
      .replace(/^1(?=\s*unidad)/,'')
      .replace(/c\/u\s*Color/ig,'c/u · Color')
      .replace(/Color:\s*Gene(?:ral)?/ig,'Color: General')
      .replace(/\s+/g,' ');

    return {img:img,qty:qty,name:name,meta:meta,price:price};
  }

  function rebuild(line){
    if(!line || line.dataset.sdc348Building==='1') return;
    var data=parse(line);
    if(!data || !data.img) return;
    line.dataset.sdc348Building='1';

    var qty=document.createElement('div');
    qty.className='sdc348-qty';
    qty.textContent=data.qty || '1';

    var img=data.img.cloneNode(true);
    img.className='sdc348-thumb';
    img.alt=data.name || 'Producto';
    img.loading='eager';
    img.decoding='async';

    var info=document.createElement('div');
    info.className='sdc348-info';
    var name=document.createElement('div');
    name.className='sdc348-name';
    name.textContent=data.name || 'Producto';
    info.appendChild(name);
    if(data.meta){
      var meta=document.createElement('div');
      meta.className='sdc348-meta';
      meta.textContent=data.meta;
      info.appendChild(meta);
    }

    var price=document.createElement('div');
    price.className='sdc348-price';
    price.textContent=data.price || 'Lps. 0';

    line.innerHTML='';
    line.appendChild(qty);
    line.appendChild(img);
    line.appendChild(info);
    line.appendChild(price);
    line.classList.remove('sdc338-line','sdc339-line','sdc343-line','sdc345-line','sdc346-line','sdc331-has-thumb');
    line.classList.add('sdc348-line');
    line.setAttribute('data-sdc348-name',data.name||'Producto');
    line.setAttribute('data-sdc348-meta',data.meta||'');
    line.setAttribute('data-sdc348-qty',data.qty||'1');
    line.setAttribute('data-sdc348-price',data.price||'Lps. 0');
    line.dataset.sdc348Building='0';
  }

  function run(root){
    var scope=root&&root.querySelectorAll?root:document;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(rebuild);
  }

  function patchCanvas(){
    if(!window.html2canvas || window.html2canvas.__sdc348Patch) return;
    var old=window.html2canvas;
    window.html2canvas=function(node,opt){
      try{run(document); if(node&&node.querySelectorAll)run(node);}catch(e){}
      return old.call(this,node,opt);
    };
    window.html2canvas.__sdc348Patch=true;
  }

  function schedule(){
    if(busy) return;
    busy=true;
    requestAnimationFrame(function(){busy=false;run(document);patchCanvas();});
  }

  function start(){
    run(document);
    patchCanvas();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){setTimeout(schedule,40);setTimeout(schedule,240);},true);
    var n=0,t=setInterval(function(){run(document);patchCanvas();if(++n>34)clearInterval(t);},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
