/* v345 · Hotfix final móvil y factura. No toca precios, stock ni Firebase. */
(function(){
  'use strict';
  var lock=false;
  function t(e){return(e&&e.textContent||'').replace(/\s+/g,' ').trim();}
  function c(e,p,v){if(e&&e.style)e.style.setProperty(p,v,'important');}
  function clean(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function ps(s){return String(s||'').match(/Lps\.\s*[0-9.,]+/gi)||[];}
  function mobile(){return matchMedia('(max-width:760px)').matches;}

  function moveUpdate(){
    var b=document.querySelector('.sdc344-update-app-btn');
    if(!b)return;
    b.classList.add('sdc345-ready');
    if(!mobile())return;
    var slot=document.querySelector('.sdc345-update-wrap');
    if(!slot){
      slot=document.createElement('div');
      slot.className='sdc345-update-wrap';
      var hero=b.closest('header,section,[class*="hero"]');
      if(hero&&hero.parentNode)hero.parentNode.insertBefore(slot,hero.nextSibling);
      else(document.getElementById('app')||document.body).prepend(slot);
    }
    if(b.parentNode!==slot)slot.appendChild(b);
  }

  function plusButtons(){
    document.querySelectorAll('button').forEach(function(b){
      if(t(b)!=='+')return;
      if(b.closest('.product-card,[class*="product-card"],.modal,[role="dialog"],.product-detail-modal-v221,.short-receipt,[class*="qty"],[class*="stepper"]'))return;
      b.classList.add('sdc345-create-compact');
      b.textContent='+ Producto';
    });
  }

  function toolbar(){
    document.querySelectorAll('.catalog-control-v178,.catalog-control-v189,.catalog-filter-row-v178,.catalog-filter-row-v189,.catalog-filter-row-v235').forEach(function(e){
      c(e,'position','relative');c(e,'top','auto');c(e,'transform','none');c(e,'z-index','5');
    });
  }

  function cards(){
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      card.querySelectorAll('h1,h2,h3,h4,[class*="price"],[class*="stock"],[class*="badge"],[class*="status"],[class*="meta"],button').forEach(function(e){
        if(e.classList.contains('sdc342-small-quote-off'))return;
        if(e.style&&e.style.display==='none')e.style.removeProperty('display');
        if(e.style&&e.style.visibility==='hidden')e.style.removeProperty('visibility');
        c(e,'opacity','1');
      });
    });
  }

  function nameFix(s){
    return clean(s).replace(/^(?:1\s*){3,}(?=[A-Za-zÁÉÍÓÚÑ])/i,'').replace(/^1{3,}(?=[A-Za-zÁÉÍÓÚÑ])/i,'').replace(/^\d+\s+(?=[A-Za-zÁÉÍÓÚÑ])/i,'').replace(/^1(?=[A-Za-zÁÉÍÓÚÑ])/i,'')||'Producto';
  }

  function data(line){
    var raw=clean(t(line)), img=line.querySelector('img'), all=ps(raw), price=all[all.length-1]||'';
    if(!img||!price)return null;
    var q='1', m=raw.match(/^\s*(\d{1,3})\b/); if(m)q=String(Number(m[1])||1);
    var body=raw; if(m)body=clean(body.slice(m[0].length));
    var i=body.lastIndexOf(price); if(i>=0)body=clean(body.slice(0,i));
    body=body.replace(/^Lps\.\s*[0-9.,]+\s*/i,'').replace(/([A-Za-zÁÉÍÓÚÑáéíóúñ])(?=\d+\s+unidad)/g,'$1 ');
    body=clean(body).replace(/^(?:1\s*){3,}(?=[A-Za-zÁÉÍÓÚÑ])/i,'').replace(/^1{3,}(?=[A-Za-zÁÉÍÓÚÑ])/i,'');
    var name=body, meta='', u=body.match(/\b\d+\s+unidad(?:es)?\s*[·\-]?\s*[\s\S]*$/i);
    if(u){name=body.slice(0,u.index);meta=u[0];}
    meta=clean(meta).replace(/c\/u\s*Color/i,'c/u · Color').replace(/Color:\s*Gene(?:ral)?/i,'Color: General');
    return{q:q,img:img,name:nameFix(name),meta:meta,price:price};
  }

  function rebuild(line){
    var d=data(line); if(!d)return;
    var q=document.createElement('div'); q.className='sdc345-qty'; q.textContent=d.q;
    var img=d.img.cloneNode(true); img.className='sdc345-thumb'; img.alt=d.name; img.loading='eager'; img.decoding='async';
    var info=document.createElement('div'); info.className='sdc345-info';
    var n=document.createElement('div'); n.className='sdc345-name'; n.textContent=d.name; info.appendChild(n);
    if(d.meta){var me=document.createElement('div'); me.className='sdc345-meta'; me.textContent=d.meta; info.appendChild(me);}
    var p=document.createElement('div'); p.className='sdc345-price'; p.textContent=d.price;
    line.innerHTML=''; line.append(q,img,info,p);
    line.classList.remove('sdc338-line','sdc339-line','sdc343-line','sdc331-has-thumb'); line.classList.add('sdc345-line'); line.dataset.sdc345Done=Date.now();
  }

  function receipts(root){(root||document).querySelectorAll('.short-receipt .sdc208-line,.shortReceiptExportHost .short-receipt .sdc208-line').forEach(rebuild);}
  function patch(){if(!window.html2canvas||window.html2canvas.__sdc345Patch)return;var old=window.html2canvas;window.html2canvas=function(node,opt){try{run();if(node&&node.querySelectorAll)receipts(node);}catch(e){}return old.call(this,node,opt);};window.html2canvas.__sdc345Patch=true;}
  function run(){moveUpdate();plusButtons();toolbar();cards();receipts(document);patch();}
  function schedule(){if(lock)return;lock=true;requestAnimationFrame(function(){lock=false;run();});}
  function start(){run();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});document.addEventListener('click',function(){setTimeout(schedule,40);setTimeout(schedule,220);},true);var n=0,x=setInterval(function(){run();if(++n>30)clearInterval(x);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
