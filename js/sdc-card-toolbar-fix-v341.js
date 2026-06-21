/* v341 · Corrige tarjetas y barra de filtros. */
(function(){
  'use strict';
  var scheduled=false;
  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function imp(el,p,v){if(el&&el.style)el.style.setProperty(p,v,'important');}
  function isPlusMinus(box){
    var bs=Array.from((box||document).querySelectorAll('button'));
    return bs.some(function(b){return /^[-−]$/.test(txt(b));}) && bs.some(function(b){return /^\+$/.test(txt(b));});
  }
  function off(el){
    if(!el)return;
    el.classList.add('sdc341-card-quote-off');
    ['display','height','min-height','max-height','margin','padding','border','overflow'].forEach(function(p){
      imp(el,p,{display:'none',height:'0','min-height':'0','max-height':'0',margin:'0',padding:'0',border:'0',overflow:'hidden'}[p]);
    });
  }
  function smallParent(card,el,kind){
    var best=el,cur=el;
    for(var i=0;i<6&&cur&&cur!==card;i++,cur=cur.parentElement){
      if(cur.querySelector&&cur.querySelector('h1,h2,h3,h4'))continue;
      var t=txt(cur);
      if(kind==='qty'&&/Cantidad/i.test(t)&&isPlusMinus(cur)&&t.length<220)best=cur;
      if(kind==='ship'&&/Comayagua|Honduras|Producto sin env|entrega local|Env[ií]o normal|Pagar al recibir|Dep[oó]sito|comisi[oó]n/i.test(t)&&t.length<220)best=cur;
    }
    return best;
  }
  function fixCards(){
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      card.querySelectorAll('h1,h2,h3,h4,[class*="price"],[class*="stock"],[class*="badge"],[class*="meta"],button').forEach(function(el){
        if(el.classList.contains('sdc341-card-quote-off'))return;
        if(el.style&&el.style.display==='none')el.style.removeProperty('display');
        if(el.style&&el.style.visibility==='hidden')el.style.removeProperty('visibility');
        imp(el,'opacity','1');
      });
      Array.from(card.querySelectorAll('div,section,article,fieldset')).forEach(function(el){
        var t=txt(el);
        if(/Cantidad/i.test(t)&&isPlusMinus(el)&&t.length<240)off(smallParent(card,el,'qty'));
      });
      Array.from(card.querySelectorAll('div,section,article,p,span,b,strong,small,button')).forEach(function(el){
        var t=txt(el);
        if(/^(Comayagua|Honduras)$/i.test(t)||/Producto sin env|entrega local|Env[ií]o normal|Pagar al recibir|Dep[oó]sito\s*\/\s*Tigo|comisi[oó]n/i.test(t))off(smallParent(card,el,'ship'));
      });
    });
  }
  function fixBar(){
    document.querySelectorAll('.catalog-control-v178,.catalog-control-v189,.catalog-filter-row-v178,.catalog-filter-row-v189,.catalog-filter-row-v235').forEach(function(el){
      imp(el,'position','relative');imp(el,'top','auto');imp(el,'z-index','5');imp(el,'transform','none');imp(el,'margin-bottom','18px');
    });
  }
  function run(){fixBar();fixCards();}
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;run();});}
  function start(){run();new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style']});document.addEventListener('click',function(){setTimeout(schedule,40);setTimeout(schedule,220);},true);var n=0,t=setInterval(function(){run();if(++n>24)clearInterval(t);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
