/* v349 · Etiquetado de UI para rediseño premium.
   No cambia datos, inventario, ventas, precios ni Firebase. */
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

  function closestPresentationBlock(el){
    var node=el;
    for(var i=0;i<8 && node && node.parentElement;i++,node=node.parentElement){
      var r=rect(node);
      var text=txt(node);
      if(r.width>Math.min(700,window.innerWidth*.55) && r.height>110 && /SD\s+COMAYAGUA/i.test(text)) return node;
    }
    return el && (el.closest('header,section,main > div,main > section') || el.parentElement);
  }

  function smallestMatch(root, regex, maxLen){
    if(!root) return null;
    var items=Array.from(root.querySelectorAll('button,a,span,p,b,strong,small,div,h1,h2,h3,section'));
    var matches=items.filter(function(el){
      var t=txt(el);
      return t && t.length <= (maxLen || 120) && regex.test(t);
    });
    matches.sort(function(a,b){return txt(a).length - txt(b).length;});
    return matches[0] || null;
  }

  function findBrandTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,div,span')).find(function(el){
      return norm(txt(el)) === 'SD COMAYAGUA';
    }) || null;
  }

  function tagButtonByText(root, regex, cls){
    var btn=Array.from(root.querySelectorAll('button,a,[role="button"]')).find(function(el){
      return regex.test(txt(el));
    });
    if(btn) add(btn,cls);
    return btn;
  }

  function commonActionZone(items){
    items=items.filter(Boolean);
    if(!items.length) return null;
    var current=items[0];
    for(var depth=0;depth<6 && current;depth++,current=current.parentElement){
      var ok=items.every(function(item){return current.contains(item);});
      if(!ok) continue;
      var r=rect(current);
      var t=txt(current);
      if(t.length<260 && r.width>180 && r.height>36) return current;
    }
    return items[0].parentElement;
  }

  function tagHero(){
    var title=findBrandTitle();
    if(!title) return false;

    add(document.body,'sdc-v349-premium');
    add(title,'sdc349-brand-title');

    var hero=closestPresentationBlock(title);
    if(!hero) return false;
    add(hero,'sdc349-premium-hero');
    hero.setAttribute('data-sdc349','premium-hero');

    var logo=Array.from(hero.querySelectorAll('img')).find(function(img){
      var label=((img.getAttribute('src') || '') + ' ' + (img.getAttribute('alt') || '')).toLowerCase();
      return /logo|sdc|comayagua/.test(label);
    }) || hero.querySelector('img');
    add(logo,'sdc349-brand-logo');

    var subtitle=smallestMatch(hero,/CAT[ÁA]LOGO|CATALOGO/i,160);
    if(subtitle && /VENTAS/i.test(txt(subtitle)) && /INVENTARIO/i.test(txt(subtitle))) add(subtitle,'sdc349-brand-subtitle');

    var badge=smallestMatch(hero,/PANEL\s+PRIVADO/i,70);
    add(badge,'sdc349-private-badge');

    var menu=tagButtonByText(hero,/Men[uú]/i,'sdc349-menu-btn');
    var firebase=tagButtonByText(hero,/Firebase/i,'sdc349-firebase-btn');
    var update=tagButtonByText(hero,/Actualizar\s+app|Actualizando/i,'sdc349-update-btn');
    var actions=commonActionZone([menu,firebase,update]);
    add(actions,'sdc349-hero-actions');

    var status=smallestMatch(hero,/ACTIVO/i,95);
    if(status){
      var shell=status;
      for(var i=0;i<3 && shell.parentElement && shell.parentElement!==hero;i++){
        var shellText=txt(shell.parentElement);
        if(/ACTIVO/i.test(shellText) && shellText.length<=110) shell=shell.parentElement;
        else break;
      }
      add(shell,'sdc349-status-pill');
    }

    return true;
  }

  function findTabs(){
    var candidates=Array.from(document.querySelectorAll('nav,section,div')).filter(function(el){
      var t=txt(el);
      var r=rect(el);
      return r.width>Math.min(560,window.innerWidth*.6) && r.height<180 && /INICIO/i.test(t) && /PANEL/i.test(t) && /PRODUCTOS/i.test(t);
    });
    candidates.sort(function(a,b){return txt(a).length - txt(b).length;});
    return candidates[0] || null;
  }

  function tabShell(labelNode,tabs){
    if(!labelNode) return null;
    var direct=labelNode.closest('button,a,[role="tab"],[role="button"]');
    if(direct && tabs.contains(direct)) return direct;

    var node=labelNode;
    var best=labelNode;
    for(var i=0;i<6 && node && node.parentElement && node.parentElement!==tabs;i++,node=node.parentElement){
      var r=rect(node);
      var t=txt(node);
      if(r.width>70 && r.height>30 && t.length<90) best=node;
    }
    return best;
  }

  function tagTab(tabs, regex, cls, active){
    var label=smallestMatch(tabs,regex,70);
    var shell=tabShell(label,tabs);
    add(shell,'sdc349-tab-item');
    add(shell,cls);
    if(active) add(shell,'sdc349-tab-active');
    return shell;
  }

  function tagTabs(){
    var tabs=findTabs();
    if(!tabs) return false;
    add(tabs,'sdc349-premium-tabs');
    tabs.setAttribute('data-sdc349','premium-tabs');
    tagTab(tabs,/INICIO/i,'sdc349-tab-inicio',false);
    tagTab(tabs,/^PANEL$|PANEL/i,'sdc349-tab-panel',false);
    tagTab(tabs,/PRODUCTOS/i,'sdc349-tab-products',true);
    return true;
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
