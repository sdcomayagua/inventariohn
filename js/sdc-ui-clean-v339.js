/* v342 · Restaura textos de tarjetas móviles y evita ocultar bloques completos. */
(function(){
  'use strict';
  var busy=false;
  function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function css(el,p,v){if(el&&el.style)el.style.setProperty(p,v,'important');}
  function unhide(el){
    if(!el||!el.style)return;
    ['display','visibility','height','min-height','max-height','margin','padding','border','overflow','opacity'].forEach(function(p){el.style.removeProperty(p);});
    el.classList.remove('sdc341-off','sdc339-hide-local','sdc340-off','sdc339-hide-duplicate-create');
  }
  function hideOnly(el){
    if(!el)return;
    el.classList.add('sdc342-small-quote-off');
    css(el,'display','none');
    css(el,'height','0');
    css(el,'min-height','0');
    css(el,'max-height','0');
    css(el,'margin','0');
    css(el,'padding','0');
    css(el,'overflow','hidden');
  }
  function restoreCards(){
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      unhide(card);
      card.querySelectorAll('.sdc341-off,.sdc339-hide-local,.sdc340-off,[style]').forEach(function(el){
        var t=text(el);
        if(/Lps\.|Admin|Cotizar|Vender|Detalle|Dedales|Tecnolog|Categor|SDC-|Disponible|disp\.|Bajo stock|Agotado/i.test(t)||el.querySelector('img,h1,h2,h3,h4,button'))unhide(el);
      });
      card.querySelectorAll('h1,h2,h3,h4,[class*="price"],[class*="stock"],[class*="badge"],[class*="meta"],[class*="tag"],button').forEach(function(el){
        unhide(el);
        css(el,'opacity','1');
      });
    });
  }
  function cleanSmallQuoteLabels(){
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      Array.from(card.querySelectorAll('span,small,b,strong,p,label')).forEach(function(el){
        var t=text(el);
        if(/^(Cantidad|Comayagua|Honduras)$/i.test(t))hideOnly(el);
        if(/Producto sin env|entrega local|Dep[oó]sito\s*\/\s*Tigo|Env[ií]o\s*\+\s*comisi[oó]n/i.test(t))hideOnly(el);
      });
      Array.from(card.querySelectorAll('div,section,fieldset')).forEach(function(el){
        var t=text(el);
        if(t.length<170&&!el.querySelector('img,h1,h2,h3,h4')&&/Cantidad/i.test(t)&&/[-−]/.test(t)&&/\+/.test(t))hideOnly(el);
        if(t.length<170&&!el.querySelector('img,h1,h2,h3,h4')&&/^(Comayagua|Honduras|Comayagua Honduras)$/i.test(t))hideOnly(el);
      });
    });
  }
  function fixBar(){
    document.querySelectorAll('.catalog-control-v178,.catalog-control-v189,.catalog-filter-row-v178,.catalog-filter-row-v189,.catalog-filter-row-v235').forEach(function(el){
      css(el,'position','relative');
      css(el,'top','auto');
      css(el,'z-index','5');
      css(el,'transform','none');
      css(el,'margin-bottom','18px');
    });
  }
  function run(){fixBar();restoreCards();cleanSmallQuoteLabels();}
  function schedule(){if(busy)return;busy=true;requestAnimationFrame(function(){busy=false;run();});}
  function start(){run();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});document.addEventListener('click',function(){setTimeout(schedule,50);setTimeout(schedule,220);},true);var n=0,t=setInterval(function(){run();if(++n>30)clearInterval(t);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
