/* v352 · Etiquetado para balance visual del encabezado.
   Solo agrega clases de presentación; no modifica datos, inventario, ventas ni Firebase. */
(function(){
  'use strict';

  var scheduled=false;

  function txt(el){
    return (el && el.textContent || '').replace(/\s+/g,' ').trim();
  }

  function norm(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/\s+/g,' ')
      .trim()
      .toUpperCase();
  }

  function add(el, cls){
    if(el && el.classList) el.classList.add(cls);
    return el;
  }

  function rect(el){
    try{return el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};}
    catch(e){return {width:0,height:0};}
  }

  function findTitle(){
    return Array.from(document.querySelectorAll('[data-sdc328-title="brand"],h1,h2,h3,div,span')).find(function(el){
      return norm(txt(el)) === 'SD COMAYAGUA';
    }) || null;
  }

  function findHero(title){
    if(!title) return null;
    return title.closest('.sdc349-premium-hero,.sdc328-app-hero,[data-sdc349="premium-hero"],header,section') || null;
  }

  function hasActionText(el){
    return /Men[uú]|Firebase|Actualizar\s+app|ACTIVO/i.test(txt(el));
  }

  function findBrandCopy(title, hero){
    if(!title || !hero) return null;
    var best=title;
    var node=title.parentElement;
    for(var i=0;i<7 && node && node!==hero;i++,node=node.parentElement){
      if(hasActionText(node)) break;
      var t=txt(node);
      var r=rect(node);
      if(t.length <= 260 && r.width >= title.getBoundingClientRect().width * .65){
        best=node;
      }
    }
    return best;
  }

  function findActions(hero){
    if(!hero) return null;
    var existing=hero.querySelector('.sdc349-hero-actions,.sdc328-hero-actions');
    if(existing) return existing;
    var btns=Array.from(hero.querySelectorAll('button,a,[role="button"]')).filter(function(el){
      return /Men[uú]|Firebase|Actualizar\s+app/i.test(txt(el));
    });
    if(!btns.length) return null;
    var current=btns[0];
    for(var i=0;i<8 && current && current!==hero;i++,current=current.parentElement){
      var ok=btns.every(function(btn){return current.contains(btn);});
      if(!ok) continue;
      var t=txt(current);
      var r=rect(current);
      if(t.length < 280 && r.width > 220) return current;
    }
    return btns[0].parentElement;
  }

  function tagHero(){
    var title=findTitle();
    var hero=findHero(title);
    if(!title || !hero) return;

    add(document.body,'sdc-v352-visual-balance');
    add(hero,'sdc352-hero-balanced');
    add(title,'sdc352-brand-title');

    var brandCopy=findBrandCopy(title, hero);
    add(brandCopy,'sdc352-brand-copy');
    add(brandCopy,'sdc349-brand-block');

    var logo=Array.from(hero.querySelectorAll('img')).find(function(img){
      var label=((img.getAttribute('src')||'')+' '+(img.getAttribute('alt')||'')).toLowerCase();
      return /logo|sdc|comayagua/.test(label);
    }) || hero.querySelector('img');
    add(logo,'sdc352-logo');

    var actions=findActions(hero);
    add(actions,'sdc352-actions');

    Array.from(hero.querySelectorAll('button,a,[role="button"]')).forEach(function(el){
      var t=txt(el);
      if(/Men[uú]/i.test(t)) add(el,'sdc352-btn-menu');
      if(/Firebase/i.test(t)) add(el,'sdc352-btn-firebase');
      if(/Actualizar\s+app|Actualizando/i.test(t)) add(el,'sdc352-btn-update');
    });

    Array.from(hero.querySelectorAll('div,span,p,small')).forEach(function(el){
      var t=txt(el);
      if(/CAT[ÁA]LOGO|CATALOGO/i.test(t) && /VENTAS/i.test(t) && /INVENTARIO/i.test(t)) add(el,'sdc352-subtitle');
      if(/PANEL\s+PRIVADO/i.test(t) && t.length < 80) add(el,'sdc352-badge');
      if(/ACTIVO/i.test(t) && t.length < 120) add(el,'sdc352-status');
    });
  }

  function tagTabs(){
    var tabs=document.querySelector('.sdc349-premium-tabs,.sdc328-main-tabs,[data-sdc349="premium-tabs"]');
    if(!tabs) return;
    add(tabs,'sdc352-tabs-balanced');
  }

  function polish(){
    tagHero();
    tagTabs();
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
    window.addEventListener('resize',schedule,{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
