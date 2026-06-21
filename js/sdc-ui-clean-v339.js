/* v341 · Limpieza segura de tarjetas y barra. */
(function(){
  'use strict';
  var busy=false;
  function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function css(el,p,v){if(el&&el.style)el.style.setProperty(p,v,'important');}
  function removeBox(el){
    if(!el)return;
    el.classList.add('sdc341-off');
    css(el,'display','none');css(el,'height','0');css(el,'min-height','0');css(el,'max-height','0');css(el,'margin','0');css(el,'padding','0');css(el,'overflow','hidden');
  }
  function hasMinusPlus(el){
    var b=Array.from((el||document).querySelectorAll('button'));
    return b.some(function(x){return text(x)==='-'||text(x)==='−';})&&b.some(function(x){return text(x)==='+';});
  }
  function safeParent(card,el){
    var best=el,cur=el;
    for(var i=0;i<5&&cur&&cur!==card;i++,cur=cur.parentElement){
      if(cur.querySelector&&cur.querySelector('h1,h2,h3,h4'))continue;
      if(text(cur).length<220)best=cur;
    }
    return best;
  }
  function cards(){
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      card.querySelectorAll('h1,h2,h3,h4,[class*="price"],[class*="stock"],[class*="badge"],[class*="meta"],button').forEach(function(el){
        if(el.classList.contains('sdc341-off'))return;
        if(el.style&&el.style.display==='none')el.style.removeProperty('display');
        if(el.style&&el.style.visibility==='hidden')el.style.removeProperty('visibility');
        css(el,'opacity','1');
      });
      Array.from(card.querySelectorAll('div,section,article,fieldset')).forEach(function(el){
        var t=text(el);
        if(/Cantidad/i.test(t)&&hasMinusPlus(el)&&t.length<260)removeBox(safeParent(card,el));
      });
      Array.from(card.querySelectorAll('div,section,p,span,b,strong,small,button')).forEach(function(el){
        var t=text(el);
        if(!t)return;
        if(/^(Comayagua|Honduras)$/i.test(t)||/Producto sin env|entrega local|Env[ií]o normal|Pagar al recibir|Dep[oó]sito|comisi[oó]n/i.test(t))removeBox(safeParent(card,el));
      });
    });
  }
  function bar(){
    document.querySelectorAll('.catalog-control-v178,.catalog-control-v189,.catalog-filter-row-v178,.catalog-filter-row-v189,.catalog-filter-row-v235').forEach(function(el){
      css(el,'position','relative');css(el,'top','auto');css(el,'z-index','5');css(el,'transform','none');css(el,'margin-bottom','18px');
    });
  }
  function run(){bar();cards();}
  function schedule(){if(busy)return;busy=true;requestAnimationFrame(function(){busy=false;run();});}
  function start(){run();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});document.addEventListener('click',function(){setTimeout(schedule,50);setTimeout(schedule,220);},true);var n=0,t=setInterval(function(){run();if(++n>24)clearInterval(t);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
