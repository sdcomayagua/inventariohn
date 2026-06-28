/* v347 · Limpieza de textos de envío dentro de tarjetas de catálogo.
   En desktop elimina: Lps duplicado, Envío normal, Pagar al recibir.
   No cambia datos, precios, ventas ni Firebase. */
(function(){
  'use strict';
  var busy=false;

  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function css(el,p,v){if(el&&el.style)el.style.setProperty(p,v,'important');}
  function hide(el,cls){
    if(!el) return;
    el.classList.add(cls||'sdc347-card-shipping');
    css(el,'display','none');
    css(el,'visibility','hidden');
    css(el,'height','0');
    css(el,'min-height','0');
    css(el,'max-height','0');
    css(el,'margin','0');
    css(el,'padding','0');
    css(el,'border','0');
    css(el,'overflow','hidden');
  }

  function safeHideParent(card,el){
    var best=el;
    var cur=el;
    for(var i=0;i<5 && cur && cur!==card;i++,cur=cur.parentElement){
      var t=txt(cur);
      if(!t) continue;
      if(cur.querySelector && cur.querySelector('img,h1,h2,h3,h4,button')) continue;
      if(t.length<260 && /Env[ií]o normal|Pagar al recibir|Producto sin env|Dep[oó]sito\s*\/\s*Tigo|comisi[oó]n/i.test(t)) best=cur;
    }
    return best;
  }

  function cleanCard(card){
    if(!card) return;

    /* Restaurar botones normales en desktop por si v346 los marcó para móvil. */
    if(window.matchMedia('(min-width:761px)').matches){
      card.querySelectorAll('.sdc346-external-action').forEach(function(btn){
        if(btn.style && btn.style.display==='none') btn.style.removeProperty('display');
        btn.classList.remove('sdc346-external-action');
      });
    }

    Array.from(card.querySelectorAll('div,section,p,span,small,b,strong')).forEach(function(el){
      var t=txt(el);
      if(!t) return;

      /* Bloques completos de envío que se miran feos bajo el precio. */
      if(/Env[ií]o normal\s*Lps\.?\s*\d+|Pagar al recibir\s*Lps\.?\s*\d+|Producto sin env[ií]o|Dep[oó]sito\s*\/\s*Tigo|Env[ií]o\s*\+\s*comisi[oó]n/i.test(t)){
        hide(safeHideParent(card,el),'sdc347-card-shipping');
        return;
      }

      /* Si aparece una línea exacta de precio local duplicado debajo del precio grande. */
      if(/^Lps\.?\s*[0-9.,]+$/i.test(t)){
        var cls=(el.className||'').toString().toLowerCase();
        var parentCls=(el.parentElement&&el.parentElement.className||'').toString().toLowerCase();
        var looksMain=/price|precio|amount|total/i.test(cls+' '+parentCls);
        var fontSize=0;
        try{fontSize=parseFloat(getComputedStyle(el).fontSize)||0;}catch(e){}
        if(!looksMain || fontSize<22){
          var prevText='';
          try{prevText=txt(el.parentElement||el);}catch(e){}
          if(prevText.length<80){
            hide(el,'sdc347-duplicate-local-price');
          }
        }
      }
    });
  }

  function run(){
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(cleanCard);
  }

  function schedule(){
    if(busy) return;
    busy=true;
    requestAnimationFrame(function(){busy=false;run();});
  }

  function start(){
    run();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(){setTimeout(schedule,50);setTimeout(schedule,220);},true);
    var n=0,timer=setInterval(function(){run();if(++n>28)clearInterval(timer);},250);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
