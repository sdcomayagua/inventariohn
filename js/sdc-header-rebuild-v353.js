/* v353 · Reconstruye el encabezado superior en una versión limpia y estable.
   Mantiene los botones originales ocultos y los nuevos disparan sus acciones. No toca inventario, ventas, productos ni Firebase. */
(function(){
  'use strict';

  var made=false;
  var timer=null;

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

  function findTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,div,span'))
      .find(function(el){
        if(el.closest('.sdc353-hero')) return false;
        return norm(txt(el)) === 'SD COMAYAGUA';
      }) || null;
  }

  function findOriginalHero(){
    var title=findTitle();
    if(!title) return null;
    var node=title;
    for(var i=0;i<10 && node && node.parentElement;i++,node=node.parentElement){
      var t=txt(node);
      if(/SD\s+COMAYAGUA/i.test(t) && (/Men[uú]|Firebase|ACTIVO|Actualizar/i.test(t))){
        var r=node.getBoundingClientRect ? node.getBoundingClientRect() : {width:0,height:0};
        if(r.width > 300 && r.height > 80) return node;
      }
    }
    return title.closest('header,section,main > div,main > section') || null;
  }

  function findButton(regex, scope){
    var root=scope || document;
    return Array.from(root.querySelectorAll('button,a,[role="button"]'))
      .find(function(el){
        if(el.closest('.sdc353-hero')) return false;
        return regex.test(txt(el));
      }) || null;
  }

  function logoSrc(hero){
    var logo=hero && Array.from(hero.querySelectorAll('img')).find(function(img){
      var label=((img.getAttribute('src') || '') + ' ' + (img.getAttribute('alt') || '')).toLowerCase();
      return /logo|sdc|comayagua/.test(label);
    });
    return (logo && logo.getAttribute('src')) || 'assets/logo-sdc-2026.png';
  }

  function fecha(){
    try{
      return new Intl.DateTimeFormat('es-HN',{
        weekday:'short', day:'2-digit', month:'short',
        hour:'numeric', minute:'2-digit', second:'2-digit', hour12:true
      }).format(new Date()).replace(',', ' ·');
    }catch(e){
      return new Date().toLocaleString();
    }
  }

  function icon(kind){
    if(kind==='menu') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    if(kind==='refresh') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2s5 5.1 5 10a5 5 0 0 1-10 0c0-2.5 2.5-4.5 2.5-4.5S10 10 12 10c1.7 0 3-1.3 3-3 0-1.7-3-5-3-5z"/></svg>';
  }

  function makeBtn(cls,label,kind,original,action){
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='sdc353-btn '+cls;
    btn.innerHTML='<span class="sdc353-btn-icon">'+icon(kind)+'</span><span>'+label+'</span>';
    btn.addEventListener('click',function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      try{
        if(action) return action(btn);
        if(original && original.click) return original.click();
      }catch(error){
        console.warn('SDC v353: no se pudo ejecutar botón', label, error);
      }
    });
    return btn;
  }

  function makeHero(originalHero){
    var menuOriginal=findButton(/Men[uú]/i, originalHero) || findButton(/Men[uú]/i, document);
    var firebaseOriginal=findButton(/Firebase/i, originalHero) || findButton(/Firebase/i, document);
    var updateOriginal=findButton(/Actualizar\s+app|Actualizando/i, originalHero) || findButton(/Actualizar\s+app|Actualizando/i, document);

    var hero=document.createElement('section');
    hero.className='sdc353-hero';
    hero.setAttribute('aria-label','Encabezado SD Comayagua');
    hero.innerHTML=''+
      '<div class="sdc353-glow"></div>'+
      '<div class="sdc353-logo-wrap"><img class="sdc353-logo" src="'+logoSrc(originalHero)+'" alt="SD Comayagua" decoding="async"></div>'+
      '<div class="sdc353-brand">'+
        '<div class="sdc353-pill">PANEL PRIVADO</div>'+
        '<h1>SD COMAYAGUA</h1>'+
        '<p>CATÁLOGO · VENTAS · COTIZACIONES · INVENTARIO</p>'+
      '</div>'+
      '<div class="sdc353-actions"></div>'+
      '<div class="sdc353-status" aria-label="Estado activo"><span class="sdc353-dot"></span><b>ACTIVO</b><small></small></div>';

    var actions=hero.querySelector('.sdc353-actions');
    actions.appendChild(makeBtn('sdc353-menu','Menú','menu',menuOriginal));
    actions.appendChild(makeBtn('sdc353-fire','Firebase','fire',firebaseOriginal));
    actions.appendChild(makeBtn('sdc353-update','Actualizar app','refresh',updateOriginal,function(){
      if(window.sdcActualizarAppAhora) window.sdcActualizarAppAhora();
      else if(updateOriginal && updateOriginal.click) updateOriginal.click();
      else location.reload();
    }));

    function tick(){
      var small=hero.querySelector('.sdc353-status small');
      if(small) small.textContent=fecha();
    }
    tick();
    clearInterval(timer);
    timer=setInterval(tick,1000);
    return hero;
  }

  function install(){
    if(made && document.querySelector('.sdc353-hero')) return;
    var originalHero=findOriginalHero();
    if(!originalHero) return;
    if(originalHero.classList.contains('sdc353-original-hidden')) return;

    var hero=makeHero(originalHero);
    originalHero.parentElement.insertBefore(hero, originalHero);
    originalHero.classList.add('sdc353-original-hidden');
    originalHero.setAttribute('aria-hidden','true');
    document.body.classList.add('sdc-v353-header-rebuild');
    made=true;
  }

  function schedule(){
    requestAnimationFrame(install);
  }

  function start(){
    install();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(install,400);
    setTimeout(install,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
