/* v339 · Limpieza visual de controles, tarjetas y recibos.
   No cambia precios, inventario ni Firebase. */
(function(){
  'use strict';
  var scheduled=false;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el,prop,value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }
  function isPrice(t){ return /^Lps\.\s*[0-9.,]+$/i.test(String(t||'').trim()); }
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

  function hideBadLocalBlocks(){
    var bad=/Producto\s+sin\s+env[ií]o|entrega\s+local\s+seg[uú]n\s+zona|Comayagua\s*Lps\./i;
    document.querySelectorAll('article.product-card, .product-card, [class*="product-card"]').forEach(function(card){
      Array.from(card.querySelectorAll('div,p,span,section,article')).forEach(function(el){
        var t=txt(el);
        if(!bad.test(t)) return;
        var target=el;
        for(var i=0;i<3 && target.parentElement && target.parentElement!==card;i++){
          var pt=txt(target.parentElement);
          if(bad.test(pt) && pt.length < 220) target=target.parentElement;
        }
        target.classList.add('sdc339-hide-local');
        setImp(target,'display','none');
        setImp(target,'height','0');
        setImp(target,'padding','0');
        setImp(target,'margin','0');
      });
    });
  }

  function productImage(line){
    return line.querySelector('img');
  }

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

    /* Si quedó un precio de unidad antes del nombre por versiones anteriores, lo removemos del texto. */
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
    if(!line || line.dataset.sdc339Done==='1') return;
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
    line.dataset.sdc339Done='1';
  }

  function fixReceiptRows(root){
    var scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(rebuildReceiptLine);
  }

  function patchCanvasCapture(){
    if(!window.html2canvas || window.html2canvas.__sdc339Patch) return;
    var original=window.html2canvas;
    var patched=function(node,opts){
      try{ polish(); if(node && node.querySelectorAll) fixReceiptRows(node); }catch(e){}
      return original.call(this,node,opts);
    };
    patched.__sdc339Patch=true;
    window.html2canvas=patched;
  }

  function polish(){
    hideDuplicateCreateButtons();
    hideBadLocalBlocks();
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
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){ setTimeout(schedule,40); setTimeout(schedule,200); },true);
    var tries=0;
    var timer=setInterval(function(){ polish(); if(++tries>18) clearInterval(timer); },250);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
