/* v337 · Correcciones puntuales finales.
   No cambia precios, inventario ni cálculos. */
(function(){
  'use strict';
  var scheduled=false;
  var patchedDownload=false;
  var RED_RE=/SI\s+USAS\s+ENV[IÍ]O\s+NORMAL\s+TE\s+AHORRAS/i;
  var RED='#d61c3b';

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el, prop, value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }
  function clearInlineColor(el){ if(el && el.style){ el.style.removeProperty('color'); el.style.removeProperty('text-shadow'); } }
  function slug(s){ return String(s||'sdc').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase().slice(0,60) || 'sdc'; }
  function stamp(){ var d=new Date(); return d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0')+'-'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+String(d.getSeconds()).padStart(2,'0'); }

  function toast(msg){
    var el=document.getElementById('toast');
    if(!el) return;
    el.textContent=msg;
    el.classList.add('show');
    clearTimeout(el._sdc331Timer);
    el._sdc331Timer=setTimeout(function(){el.classList.remove('show');},2600);
  }

  function productTitleFromModal(modal){
    return txt(modal && modal.querySelector('.v141-head-copy h3,.v49-detail-main h3,.v163-detail-main h3,.modal-head h3,h3,h2')) || 'Producto SD Comayagua';
  }

  function productTextFromModal(modal){
    var title=productTitleFromModal(modal);
    var normal=txt(modal && modal.querySelector('[data-v49-total="normal"]'));
    var cod=txt(modal && modal.querySelector('[data-v49-total="cod"]'));
    var local=txt(modal && modal.querySelector('[data-v49-total="local"]'));
    var price=normal || local || txt(modal && modal.querySelector('.v141-price-box b,.v163-price-box b,[class*="price"] b'));
    var colors=Array.from((modal||document).querySelectorAll('.v86-color-client,.v141-color-card,.v163-color-card,.v164-color-card')).map(txt).filter(Boolean).slice(0,5).join(' · ');
    var out='🔥 '+title+' disponible en SD COMAYAGUA\n\n';
    if(price) out+='Precio: '+price+'\n';
    if(cod) out+='Pagar a recibir: '+cod+'\n';
    if(colors) out+='Colores/stock: '+colors+'\n';
    out+='\n📍 Comayagua\n📲 WhatsApp: +504 3151-7755';
    return out;
  }

  function openWhatsAppNoPrompt(modal){
    var message=productTextFromModal(modal || document);
    var url='https://wa.me/?text='+encodeURIComponent(message);
    window.open(url,'_blank','noopener,noreferrer');
    toast('WhatsApp abierto sin pedir número.');
  }

  function interceptWhatsAppClicks(){
    document.addEventListener('click',function(ev){
      var btn=ev.target.closest && ev.target.closest('#v53WhatsAppProduct,[data-sdc321-social-action="whatsapp"],.sdc321-social-wa');
      if(!btn) return;
      var modal=btn.closest('.product-detail-modal-v221,.modal') || document.querySelector('.product-detail-modal-v221,.modal');
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();
      openWhatsAppNoPrompt(modal);
    },true);
  }

  function patchDownloadNames(){
    if(patchedDownload || !window.HTMLAnchorElement) return;
    patchedDownload=true;
    var original=HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click=function(){
      try{
        if(this.download && /\.png$|\.jpg$|\.jpeg$|\.webp$/i.test(this.download)){
          var name=this.download.replace(/\.(png|jpg|jpeg|webp)$/i,'');
          var ext=(this.download.match(/\.(png|jpg|jpeg|webp)$/i)||['.png'])[0];
          if(!/\d{8}-\d{6}/.test(name)) this.download=slug(name)+'-'+stamp()+ext.toLowerCase();
        }
      }catch(e){}
      return original.apply(this,arguments);
    };
    document.addEventListener('click',function(ev){
      var a=ev.target.closest && ev.target.closest('a[download]');
      if(!a || !a.download) return;
      try{
        var ext=(a.download.match(/\.(png|jpg|jpeg|webp)$/i)||['.png'])[0];
        var base=a.download.replace(/\.(png|jpg|jpeg|webp)$/i,'');
        if(!/\d{8}-\d{6}/.test(base)) a.download=slug(base)+'-'+stamp()+ext.toLowerCase();
      }catch(e){}
    },true);
  }

  function catalogImageMap(){
    var map=[];
    document.querySelectorAll('#inventario article.product-card, article.product-card').forEach(function(card){
      var name=txt(card.querySelector('h3,h2,h4'));
      var img=card.querySelector('.product-photo-v178 img,.product-photo-v246 img,img');
      if(name && img && img.src) map.push({name:name.toLowerCase(), src:img.src});
    });
    return map;
  }

  function findProductImageForText(lineText,map){
    var low=String(lineText||'').toLowerCase();
    var hit=map.find(function(x){ return x.name && low.indexOf(x.name) !== -1; });
    if(hit) return hit.src;
    hit=map.find(function(x){
      var first=x.name.split(/\s+/).slice(0,2).join(' ');
      return first.length>4 && low.indexOf(first)!==-1;
    });
    return hit && hit.src;
  }

  function addReceiptThumbs(root){
    var scope=root && root.querySelectorAll ? root : document;
    var map=catalogImageMap();
    if(!map.length) return;
    scope.querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .sdc208-line').forEach(function(line){
      if(line.querySelector('.sdc331-receipt-thumb,img')) return;
      var src=findProductImageForText(txt(line),map);
      if(!src) return;
      var img=document.createElement('img');
      img.className='sdc331-receipt-thumb';
      img.src=src;
      img.alt='Producto';
      img.decoding='async';
      img.loading='eager';
      var first=line.firstElementChild;
      if(first && first.nextSibling) line.insertBefore(img,first.nextSibling);
      else line.insertBefore(img,line.firstChild);
      line.classList.add('sdc331-has-thumb');
    });
  }

  function smallestSavingsNodes(receipt){
    var all=Array.from(receipt.querySelectorAll('small,span,b,strong,p,div')).filter(function(el){ return RED_RE.test(txt(el)); });
    return all.filter(function(el){ return !Array.from(el.children || []).some(function(child){ return RED_RE.test(txt(child)); }); });
  }

  function forceSavingsRed(root){
    var scope=root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('.short-receipt,.shortReceiptExportHost .short-receipt').forEach(function(receipt){
      receipt.querySelectorAll('.sdc331-saving-red').forEach(function(el){
        el.classList.remove('sdc331-saving-red');
        clearInlineColor(el);
        el.querySelectorAll('*').forEach(clearInlineColor);
      });
      receipt.querySelectorAll('[style]').forEach(function(el){
        var color=(el.style.color || '').toLowerCase().replace(/\s+/g,'');
        if((color===RED || color==='rgb(214,28,59)' || color==='#d61c3b') && !RED_RE.test(txt(el))) clearInlineColor(el);
      });
      smallestSavingsNodes(receipt).forEach(function(el){
        el.classList.add('sdc337-saving-red');
        setImp(el,'color',RED);
        setImp(el,'font-weight','950');
        setImp(el,'text-align','center');
        setImp(el,'text-shadow','none');
        el.querySelectorAll('*').forEach(function(c){ setImp(c,'color',RED); });
      });
    });
  }

  function fixColorNumbers(root){
    var scope=root && root.querySelectorAll ? root : document;
    var colorNames=['Azul','Rojo','Negro','Blanco','Verde','Rosado','Morado','Amarillo','Gris','Dorado','Plateado'];
    scope.querySelectorAll('.product-detail-modal-v221 [class*="color"] *').forEach(function(el){
      var t=txt(el);
      if(!t) return;
      if(/^\d+$/.test(t) || /^[0-9]+\s*(u|und|disp)?\.?$/i.test(t)){
        el.classList.add('sdc332-color-number');
        setImp(el,'color','#fff');
        setImp(el,'text-shadow','0 1px 2px rgba(0,0,0,.24)');
        return;
      }
      if(colorNames.some(function(name){ return t.toLowerCase()===name.toLowerCase(); })){
        el.classList.add('sdc332-color-name');
        setImp(el,'color','#061b34');
        setImp(el,'text-shadow','none');
        setImp(el,'font-weight','950');
      }
    });
    scope.querySelectorAll('.product-detail-modal-v221 [class*="color"]').forEach(function(el){
      var t=txt(el);
      if(colorNames.some(function(name){ return t.indexOf(name)!==-1; })){
        setImp(el,'color','#061b34');
        setImp(el,'text-shadow','none');
      }
    });
  }

  function looksLikeCategoryCapture(el){
    if(!el || !el.querySelectorAll) return false;
    var t=txt(el);
    return /Vista\s+r[aá]pida\s+para\s+cliente/i.test(t) && /Productos\s+disponibles\s+para\s+cotizar/i.test(t);
  }

  function findCategoryHeader(root){
    return Array.from(root.querySelectorAll('header,section,div')).find(function(el){
      var t=txt(el);
      var r=el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
      return r.width>500 && r.height>80 && /Vista\s+r[aá]pida\s+para\s+cliente/i.test(t);
    });
  }

  function extractCategoryName(head){
    var candidates=Array.from((head||document).querySelectorAll('h1,h2,h3,b,strong,span,div')).map(function(el){return {el:el,t:txt(el)};}).filter(function(x){
      return /^[A-ZÁÉÍÓÚÑ0-9\s]{4,32}$/.test(x.t) && !/SD\s*COMAYAGUA|PANEL|Vista|Cliente|jun|a\.\s*m\.|p\.\s*m\./i.test(x.t);
    });
    var hit=candidates.find(function(x){return /DEDAL|AUDIO|ADAPTADOR|ACCESORIO|GAMER|CABLE|AUTOMOTRIZ|BELLEZA|HOGAR|COCINA/i.test(x.t);}) || candidates[0];
    return hit || null;
  }

  function polishCategoryPng(root){
    var scope=root && root.querySelectorAll ? root : document;
    Array.from(scope.querySelectorAll('body *')).forEach(function(el){
      if(!looksLikeCategoryCapture(el)) return;
      var cap=el;
      for(var i=0;i<7 && cap.parentElement;i++){
        if(looksLikeCategoryCapture(cap.parentElement)) cap=cap.parentElement;
        else break;
      }
      var head=findCategoryHeader(cap);
      if(!head) return;
      head.classList.add('sdc331-category-capture-header');
      var found=extractCategoryName(head);
      if(found && !head.querySelector('.sdc331-clean-category-title')){
        found.el.classList.add('sdc331-hidden-bad-title');
        var clean=document.createElement('div');
        clean.className='sdc331-clean-category-title';
        clean.textContent=found.t;
        head.appendChild(clean);
      }
      head.querySelectorAll('h1,h2,h3,b,strong,span,p,small').forEach(function(n){
        if(!n.classList.contains('sdc331-hidden-bad-title')) setImp(n,'color','#fff');
      });
      cap.querySelectorAll('article,section,div').forEach(function(card){
        if(card===head || head.contains(card)) return;
        var hasPrice=/Lps\.\s*\d+/i.test(txt(card));
        if(!hasPrice || !card.querySelector('img')) return;
        card.querySelectorAll('h1,h2,h3,h4').forEach(function(h){
          if(/^Lps\./i.test(txt(h))) return;
          h.classList.add('sdc331-product-name-clean');
        });
        card.querySelectorAll('small,span,b,strong').forEach(function(n){
          var t=txt(n);
          if(/^[A-ZÁÉÍÓÚÑ]+\s*·\s*[A-Z0-9-]{3,}/.test(t) || /[A-Z0-9]{10,}/.test(t)) n.classList.add('sdc331-product-code-clean');
          if(/^\d+\s*disp\.?$/i.test(t)) n.classList.add('sdc331-stock-readable');
        });
      });
    });
  }

  function polish(root){
    fixColorNumbers(root);
    forceSavingsRed(root);
    addReceiptThumbs(root);
    polishCategoryPng(root);
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
    interceptWhatsAppClicks();
    patchDownloadNames();
    polish(document);
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(){ setTimeout(schedule,40); setTimeout(schedule,180); },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
