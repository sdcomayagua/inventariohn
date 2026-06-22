/* v346 · Limpieza final móvil y facturas.
   No cambia precios, stock, ventas ni Firebase. */
(function(){
  'use strict';
  var busy=false;
  var receiptBusy=false;

  function isMobile(){return window.matchMedia('(max-width:760px)').matches;}
  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function css(el,p,v){if(el&&el.style)el.style.setProperty(p,v,'important');}
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function prices(s){return String(s||'').match(/Lps\.\s*[0-9.,]+/gi)||[];}
  function debounce(fn, wait){var timer;return function(){var args=arguments;clearTimeout(timer);timer=setTimeout(function(){fn.apply(null,args);},wait);};}

  function simplifyHeader(){
    if(!isMobile()) return;
    Array.from(document.querySelectorAll('header,section,[class*="hero"],[class*="brand"]')).forEach(function(box){
      Array.from(box.querySelectorAll('p,span,small,div')).forEach(function(el){
        var t=txt(el);
        if(!t) return;
        if(/CAT[ÁA]LOGO\s*[·•]\s*VENTAS\s*[·•]\s*COTIZACIONES/i.test(t) || /CAT[ÁA]LOGO\s*[·•]\s*VENTAS\s*[·•]\s*COTIZACIONES\s*[·•]\s*INVENTARIO/i.test(t)){
          el.classList.add('sdc346-brand-tags');
        }
        if(/^CAT[ÁA]LOGO DIGITAL$/i.test(t)){
          el.classList.add('sdc346-products-badge');
        }
      });
    });
  }

  function moveUpdateButton(){
    var btn=document.querySelector('.sdc344-update-app-btn');
    if(!btn) return;
    btn.classList.add('sdc346-update-ready');
    if(!isMobile()) return;
    btn.innerHTML='<span class="sdc344-icon">↻</span><span>Actualizar app</span>';
    var firebase=Array.from(document.querySelectorAll('button,a')).find(function(el){return /Firebase/i.test(txt(el));});
    if(firebase && firebase.parentElement && btn.parentElement!==firebase.parentElement){
      firebase.parentElement.appendChild(btn);
    }
  }

  function fixCategoryPanel(){
    if(!isMobile()) return;
    var controls=document.querySelectorAll('.catalog-control-v178,.catalog-control-v189,.catalog-filter-row-v178,.catalog-filter-row-v189,.catalog-filter-row-v235');
    controls.forEach(function(panel){
      css(panel,'position','relative');
      css(panel,'top','auto');
      css(panel,'transform','none');
      css(panel,'z-index','5');
      var categoryTexts=Array.from(panel.querySelectorAll('div,span,b,strong,button')).filter(function(el){
        var t=txt(el);
        return /^▦?\s*Categor[ií]as\s*$/i.test(t) || /^Categor[ií]as\s*$/i.test(t);
      });
      categoryTexts.forEach(function(el,idx){
        /* Mantener el dropdown/botón principal, ocultar el rótulo duplicado mezclado. */
        if(idx===0 && !el.matches('select')){
          var parent=el.closest('button,div,section') || el;
          if(parent && !parent.querySelector('select') && txt(parent).length < 60){
            parent.classList.add('sdc346-category-duplicate');
          }
        }
      });
    });

    document.querySelectorAll('select,[role="combobox"]').forEach(function(el){
      var t=txt(el);
      if(/Categor/i.test(t) || /category/i.test(el.className||'')){
        el.setAttribute('aria-label','Seleccionar categoría');
      }
    });

    Array.from(document.querySelectorAll('button')).forEach(function(btn){
      var t=txt(btn);
      if(t==='+' && !btn.closest('.product-card,[class*="product-card"],.modal,[role="dialog"],.product-detail-modal-v221,[class*="qty"],[class*="stepper"],.short-receipt')){
        btn.classList.add('sdc346-create-compact');
        btn.innerHTML='<span style="font-size:22px;line-height:1">＋</span><span>Producto</span>';
      }
    });
  }

  function cleanProductCards(){
    if(!isMobile()) return;
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      card.style.cursor='pointer';
      card.querySelectorAll('h1,h2,h3,h4,[class*="price"],[class*="stock"],[class*="badge"],[class*="status"],[class*="meta"]').forEach(function(el){
        if(el.style && el.style.display==='none') el.style.removeProperty('display');
        if(el.style && el.style.visibility==='hidden') el.style.removeProperty('visibility');
        css(el,'opacity','1');
      });
      card.querySelectorAll('button,a').forEach(function(btn){
        var t=txt(btn).toLowerCase();
        if(['admin','cotizar','vender','detalle'].indexOf(t)>=0){
          btn.classList.add('sdc346-external-action');
        }
      });
      Array.from(card.querySelectorAll('div,span,p,small,b,strong')).forEach(function(el){
        var t=txt(el);
        if(/Env[ií]o normal\s*Lps\.|Pagar al recibir\s*Lps\.|Producto sin env[ií]o|Dep[oó]sito\s*\/\s*Tigo|Env[ií]o\s*\+\s*comisi[oó]n/i.test(t)){
          var target=el;
          for(var i=0;i<4 && target.parentElement && target.parentElement!==card;i++){
            var pt=txt(target.parentElement);
            if(pt.length<240 && /Env[ií]o normal|Pagar al recibir|Producto sin env/i.test(pt)) target=target.parentElement;
          }
          target.classList.add('sdc346-shipping-extra');
        }
      });
    });
  }

  function simplifyProductsHero(){
    if(!isMobile()) return;
    Array.from(document.querySelectorAll('p,span,small,div')).forEach(function(el){
      var t=txt(el);
      if(/^CAT[ÁA]LOGO DIGITAL$/i.test(t)) el.classList.add('sdc346-products-badge');
    });
  }

  function normalizeName(name){
    name=clean(name)
      .replace(/^(?:1\s*){2,}(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/^1{2,}(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/^1(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/^\d+\s+(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/,'')
      .replace(/\s+/g,' ')
      .trim();
    return name || 'Producto';
  }

  function parseReceiptLine(line){
    var img=line.querySelector('img');
    if(!img) return null;
    var full=clean(txt(line));
    if(!full) return null;
    var priceList=prices(full);
    var price=priceList.length?priceList[priceList.length-1]:'Lps. 0';
    var qty='1';
    var qm=full.match(/^\s*(\d{1,3})\b/);
    if(qm) qty=String(Number(qm[1])||1);

    var body=full;
    if(qm) body=clean(body.slice(qm[0].length));
    var pi=body.lastIndexOf(price);
    if(pi>=0) body=clean(body.slice(0,pi));
    body=body
      .replace(/^Lps\.\s*[0-9.,]+\s*/i,'')
      .replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])(?=\d+\s+unidad)/g,'$1 ')
      .replace(/c\/u\s*Color/ig,'c/u · Color')
      .replace(/Color:\s*Gene(?:ral)?/ig,'Color: General');

    var name=body;
    var meta='';
    var cut=body.match(/\b\d+\s+unidad(?:es)?\s*[·\-]?\s*[\s\S]*$/i);
    if(cut){
      name=body.slice(0,cut.index);
      meta=cut[0];
    }
    name=normalizeName(name);
    meta=clean(meta);
    return {qty:qty,img:img,name:name,meta:meta,price:price};
  }

  function rebuildReceiptLine(line){
    if(!line || line.dataset.sdc346Lock==='1') return;
    var data=parseReceiptLine(line);
    if(!data) return;
    line.dataset.sdc346Lock='1';
    var qty=document.createElement('div');
    qty.className='sdc346-qty';
    qty.textContent=data.qty;
    var img=data.img.cloneNode(true);
    img.className='sdc346-thumb';
    img.alt=data.name;
    img.loading='eager';
    img.decoding='async';
    var info=document.createElement('div');
    info.className='sdc346-info';
    var name=document.createElement('div');
    name.className='sdc346-name';
    name.textContent=data.name;
    info.appendChild(name);
    if(data.meta){
      var meta=document.createElement('div');
      meta.className='sdc346-meta';
      meta.textContent=data.meta;
      info.appendChild(meta);
    }
    var price=document.createElement('div');
    price.className='sdc346-price';
    price.textContent=data.price;
    line.innerHTML='';
    line.appendChild(qty);
    line.appendChild(img);
    line.appendChild(info);
    line.appendChild(price);
    line.classList.remove('sdc338-line','sdc339-line','sdc343-line','sdc345-line','sdc331-has-thumb');
    line.classList.add('sdc346-line');
    line.dataset.sdc346Lock='0';
    line.dataset.sdc346Done=String(Date.now());
  }

  function fixReceipts(root){
    var scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(rebuildReceiptLine);
  }

  var safeReceipt=debounce(function(){fixReceipts(document);},160);

  function patchCanvas(){
    if(!window.html2canvas || window.html2canvas.__sdc346Patch) return;
    var old=window.html2canvas;
    window.html2canvas=function(node,opt){
      try{run(); if(node && node.querySelectorAll)fixReceipts(node);}catch(e){}
      return old.call(this,node,opt);
    };
    window.html2canvas.__sdc346Patch=true;
  }

  function run(){
    simplifyHeader();
    moveUpdateButton();
    fixCategoryPanel();
    simplifyProductsHero();
    cleanProductCards();
    safeReceipt();
    patchCanvas();
  }

  function schedule(){
    if(busy) return;
    busy=true;
    requestAnimationFrame(function(){busy=false;run();});
  }

  function start(){
    run();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(){setTimeout(schedule,50);setTimeout(schedule,240);},true);
    var n=0,timer=setInterval(function(){run();if(++n>36)clearInterval(timer);},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
