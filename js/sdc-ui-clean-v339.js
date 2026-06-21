/* v340 · Limpieza visual de controles y recibos.
   No oculta contenido principal de tarjetas. No cambia precios, inventario ni Firebase. */
(function(){
  'use strict';
  var scheduled=false;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el,prop,value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }
  function allPrices(t){ return String(t||'').match(/Lps\.\s*[0-9.,]+/gi) || []; }
  function clean(s){ return String(s||'').replace(/\s+/g,' ').trim(); }

  function hideDuplicateCreateButtons(){
    var productBtns=Array.from(document.querySelectorAll('button,a')).filter(function(btn){
      var t=txt(btn).toLowerCase();
      return /producto/.test(t) && (/\+|crear|nuevo/.test(t));
    });
    var nativeBtn=productBtns.find(function(btn){ return !btn.classList.contains('sdc335-create-btn') && !btn.classList.contains('sdc335-create-fab'); });
    if(nativeBtn && window.matchMedia('(min-width:761px)').matches){
      document.querySelectorAll('.sdc335-create-btn,.sdc335-create-fab').forEach(function(btn){
        btn.classList.add('sdc339-hide-duplicate-create');
        setImp(btn,'display','none');
        setImp(btn,'visibility','hidden');
      });
    }
  }

  function restoreCardText(){
    document.querySelectorAll('article.product-card, .product-card, [class*="product-card"]').forEach(function(card){
      card.querySelectorAll('.sdc339-hide-local').forEach(function(el){
        /* Restaurar cualquier bloque que pudo ocultarse de más en v339. */
        el.classList.remove('sdc339-hide-local');
        ['display','visibility','height','min-height','max-height','padding','margin','border','overflow'].forEach(function(p){
          if(el.style) el.style.removeProperty(p);
        });
      });
      /* Si el producto tiene precio/nombre oculto por estilo inline, volverlo visible. */
      card.querySelectorAll('[style]').forEach(function(el){
        var t=txt(el);
        if(/Lps\.\s*\d+|Admin|Cotizar|Vender|Detalle|Cantidad|Env[ií]o normal|Pagar al recibir/i.test(t)){
          if(el.style.display === 'none') el.style.removeProperty('display');
          if(el.style.visibility === 'hidden') el.style.removeProperty('visibility');
          if(el.style.height === '0px' || el.style.height === '0') el.style.removeProperty('height');
          if(el.style.maxHeight === '0px' || el.style.maxHeight === '0') el.style.removeProperty('max-height');
        }
      });
    });
  }

  function productImage(line){ return line.querySelector('img'); }

  function parseLine(line){
    var raw=clean(txt(line));
    var prices=allPrices(raw);
    var price=prices.length ? prices[prices.length-1] : '';
    var qty='1';
    var qtyMatch=raw.match(/^\s*(\d{1,3})\b/);
    if(qtyMatch) qty=qtyMatch[1];

    var body=raw;
    if(qtyMatch) body=clean(body.slice(qtyMatch[0].length));
    if(price){
      var idx=body.lastIndexOf(price);
      if(idx >= 0) body=clean(body.slice(0,idx));
    }
    body=clean(body.replace(/^Lps\.\s*[0-9.,]+\s*/i,''));

    var name=body;
    var meta='';
    var unit=body.match(/\b\d+\s+unidad(?:es)?\s*·[\s\S]*$/i);
    if(unit){
      name=clean(body.slice(0, unit.index));
      meta=clean(unit[0]);
    }
    if(!name){
      var possible=line.querySelector('h1,h2,h3,h4,b,strong');
      name=clean(txt(possible)) || 'Producto';
    }
    return {qty:qty, name:name, meta:meta, price:price};
  }

  function rebuildReceiptLine(line){
    if(!line || line.dataset.sdc340Done==='1') return;
    var img=productImage(line);
    var parsed=parseLine(line);
    if(!img || !parsed.price || !parsed.name) return;

    var imgClone=img.cloneNode(true);
    imgClone.className='sdc339-thumb';
    imgClone.alt=img.alt || 'Producto';
    imgClone.loading='eager';
    imgClone.decoding='async';

    var qty=document.createElement('div');
    qty.className='sdc339-qty';
    qty.textContent=parsed.qty || '1';

    var info=document.createElement('div');
    info.className='sdc339-info';
    var name=document.createElement('div');
    name.className='sdc339-name';
    name.textContent=parsed.name;
    var meta=document.createElement('div');
    meta.className='sdc339-meta';
    meta.textContent=parsed.meta;
    info.appendChild(name);
    if(parsed.meta) info.appendChild(meta);

    var price=document.createElement('div');
    price.className='sdc339-price';
    price.textContent=parsed.price;

    line.innerHTML='';
    line.appendChild(qty);
    line.appendChild(imgClone);
    line.appendChild(info);
    line.appendChild(price);
    line.classList.add('sdc339-line');
    line.classList.remove('sdc338-line');
    line.dataset.sdc340Done='1';
  }

  function fixReceiptRows(root){
    var scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(rebuildReceiptLine);
  }

  function patchCanvasCapture(){
    if(!window.html2canvas || window.html2canvas.__sdc340Patch) return;
    var original=window.html2canvas;
    var patched=function(node,opts){
      try{ polish(); if(node && node.querySelectorAll) fixReceiptRows(node); }catch(e){}
      return original.call(this,node,opts);
    };
    patched.__sdc340Patch=true;
    window.html2canvas=patched;
  }

  function polish(){
    hideDuplicateCreateButtons();
    restoreCardText();
    fixReceiptRows(document);
    patchCanvasCapture();
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
    polish();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(){ setTimeout(schedule,40); setTimeout(schedule,200); },true);
    var tries=0;
    var timer=setInterval(function(){ polish(); if(++tries>18) clearInterval(timer); },250);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
