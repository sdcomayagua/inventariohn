/* v328 · Detección dinámica de estructura para escritorio.
   Agrega clases de presentación sin tocar lógica, inventario ni cálculos. */
(function(){
  'use strict';
  var scheduled=false;

  function text(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function isDesktop(){ return window.matchMedia && window.matchMedia('(min-width: 980px)').matches; }

  function closestBlock(el){
    var node=el;
    for(var i=0;i<7 && node;i++,node=node.parentElement){
      if(!node.parentElement) break;
      var r=node.getBoundingClientRect ? node.getBoundingClientRect() : {width:0,height:0};
      if(r.width > 700 && r.height > 100) return node;
    }
    return el;
  }

  function findByText(pattern, root){
    root=root||document;
    var all=Array.from(root.querySelectorAll('h1,h2,h3,header,section,div,nav,main'));
    return all.find(function(el){ return pattern.test(text(el)); });
  }

  function tagHeader(){
    var h1=Array.from(document.querySelectorAll('h1,h2,div')).find(function(el){
      return /^SD\s+COMAYAGUA$/i.test(text(el));
    });
    if(!h1) return;
    h1.dataset.sdc328Title='brand';
    var block=closestBlock(h1);
    if(block){
      block.classList.add('sdc328-app-hero');
      var actionZone=Array.from(block.children).find(function(child){
        var t=text(child);
        return /Men[uú]|Firebase|ACTIVO/i.test(t) && child !== h1;
      });
      if(actionZone) actionZone.classList.add('sdc328-hero-actions');
    }
  }

  function tagTabs(){
    var tabs=Array.from(document.querySelectorAll('nav,section,div')).find(function(el){
      var t=text(el);
      var r=el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
      return r.width>700 && r.height<120 && /INICIO/i.test(t) && /PANEL/i.test(t) && /PRODUCTOS/i.test(t);
    });
    if(tabs) tabs.classList.add('sdc328-main-tabs');
  }

  function tagProductsHero(){
    var title=Array.from(document.querySelectorAll('h1,h2,div')).find(function(el){
      return /^Productos$/i.test(text(el));
    });
    if(!title) return;
    var hero=closestBlock(title);
    if(hero){
      hero.classList.add('sdc328-products-hero');
      var shell=hero.parentElement;
      if(shell) shell.classList.add('sdc328-products-shell');
      var stats=Array.from(hero.querySelectorAll('div,section')).find(function(el){
        var t=text(el);
        var r=el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
        return /RESULTADOS/i.test(t) && /UNIDADES/i.test(t) && /Firebase/i.test(t) && r.width>250;
      });
      if(stats) stats.classList.add('sdc328-products-stats');
    }
  }

  function tagCategorySummary(){
    var card=Array.from(document.querySelectorAll('section,article,div')).find(function(el){
      var t=text(el);
      var r=el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
      return r.width>700 && /Todas\s+las\s+categor[ií]as/i.test(t) && /Ver\s+productos/i.test(t) && /Vista\s+cliente/i.test(t);
    });
    if(!card) return;
    card.classList.add('sdc328-category-summary');
    var actions=Array.from(card.querySelectorAll('div,section')).find(function(el){
      var t=text(el);
      return /Ver\s+productos/i.test(t) && /Imprimir/i.test(t) && /Vista\s+cliente/i.test(t);
    });
    if(actions) actions.classList.add('sdc328-category-actions');
  }

  function polish(){
    if(!isDesktop()) return;
    tagHeader();
    tagTabs();
    tagProductsHero();
    tagCategorySummary();
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
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    window.addEventListener('resize',schedule,{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
