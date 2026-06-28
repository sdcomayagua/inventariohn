/* v400 STABLE · Estabilizador visual.
   Marca el header, tabs y tarjetas sin cambiar datos ni lógica de ventas. */
(function(){
  'use strict';
  var scheduled=false;

  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();}
  function add(el,cls){if(el&&el.classList)el.classList.add(cls);return el;}
  function rect(el){try{return el.getBoundingClientRect();}catch(e){return {width:0,height:0};}}

  function closestHero(title){
    var node=title;
    for(var i=0;i<10&&node&&node.parentElement;i++,node=node.parentElement){
      var t=txt(node);
      var r=rect(node);
      if(/SD\s+COMAYAGUA/i.test(t)&&r.width>300&&r.height>80) return node;
    }
    return title.closest('header,section,main>div,main>section')||null;
  }

  function findTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,div,span')).find(function(el){
      return norm(txt(el))==='SD COMAYAGUA';
    })||null;
  }

  function tagHeader(){
    var title=findTitle();
    if(!title) return;
    var hero=closestHero(title);
    if(!hero) return;
    hero.setAttribute('data-sdc400-hero','1');
    add(hero,'sdc400-hero');
    title.setAttribute('data-sdc400-title','1');

    var brand=title.parentElement;
    for(var i=0;i<5&&brand&&brand!==hero;i++,brand=brand.parentElement){
      if(txt(brand).length<260) break;
    }
    if(brand&&brand!==hero){brand.setAttribute('data-sdc400-brand','1');add(brand,'sdc400-brand');}

    Array.from(hero.querySelectorAll('div,span,p,small,b,strong')).forEach(function(el){
      var t=txt(el);
      if(/PANEL\s+PRIVADO/i.test(t)&&t.length<70) el.setAttribute('data-sdc400-badge','1');
      if(/CAT[ÁA]LOGO|CATALOGO/i.test(t)&&/VENTAS/i.test(t)&&/INVENTARIO/i.test(t)) el.setAttribute('data-sdc400-subtitle','1');
    });

    var btns=Array.from(hero.querySelectorAll('button,a,[role="button"]')).filter(function(el){return /Men[uú]|Firebase|Actualizar/i.test(txt(el));});
    if(btns.length){
      var common=btns[0].parentElement;
      for(var d=0;d<6&&common;d++,common=common.parentElement){
        if(btns.every(function(b){return common.contains(b);})&&txt(common).length<260){
          common.setAttribute('data-sdc400-actions','1');add(common,'sdc400-actions');break;
        }
      }
    }
  }

  function tagTabs(){
    var tabs=Array.from(document.querySelectorAll('nav,section,div')).filter(function(el){
      var t=txt(el),r=rect(el);
      return r.width>300&&r.height<180&&/INICIO/i.test(t)&&/PANEL/i.test(t)&&/PRODUCTOS/i.test(t);
    }).sort(function(a,b){return txt(a).length-txt(b).length;})[0];
    if(tabs){tabs.setAttribute('data-sdc400-tabs','1');add(tabs,'sdc400-tabs');}
  }

  function repairCards(){
    if(!window.matchMedia('(min-width:761px)').matches) return;
    document.querySelectorAll('article.product-card,.product-card,[class*="product-card"]').forEach(function(card){
      card.style.setProperty('height','auto','important');
      card.style.setProperty('max-height','none','important');
      card.style.setProperty('overflow','visible','important');
      card.querySelectorAll('h1,h2,h3,h4,[class*="name"],[class*="title"],[class*="price"],[class*="precio"],[class*="amount"]').forEach(function(el){
        el.style.setProperty('display','block','important');
        el.style.setProperty('visibility','visible','important');
        el.style.setProperty('opacity','1','important');
        el.style.setProperty('height','auto','important');
        el.style.setProperty('max-height','none','important');
        el.style.setProperty('overflow','visible','important');
      });
    });
  }

  function run(){
    document.body.classList.add('sdc-v400-stable');
    tagHeader();
    tagTabs();
    repairCards();
  }
  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){scheduled=false;run();});
  }
  function start(){
    run();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true});
    var n=0,t=setInterval(function(){run();if(++n>30)clearInterval(t);},300);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
