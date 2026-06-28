/* v357 · Encabezado limpio forzado con archivo nuevo para evitar caché.
   Sustituye visualmente el header anterior. No cambia inventario, ventas, productos ni Firebase. */
(function(){
  'use strict';

  var installed=false;
  var clockTimer=null;

  function text(el){return (el && el.textContent || '').replace(/\s+/g,' ').trim();}
  function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();}

  function style(){
    if(document.getElementById('sdc357-header-style')) return;
    var css = `
.sdc357-original{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;pointer-events:none!important}
.sdc357-hero,.sdc357-hero *{box-sizing:border-box!important}.sdc357-hero{position:relative!important;isolation:isolate!important;width:calc(100vw - 92px)!important;max-width:1760px!important;min-height:126px!important;margin:24px auto 16px!important;padding:22px 28px!important;border-radius:26px!important;overflow:hidden!important;display:grid!important;grid-template-columns:82px minmax(0,1fr) auto!important;grid-template-areas:"logo brand right"!important;gap:22px!important;align-items:center!important;border:1px solid rgba(255,255,255,.42)!important;background:linear-gradient(130deg,#061934 0%,#073671 48%,#0b7eea 100%)!important;box-shadow:0 20px 48px rgba(6,31,63,.14),inset 0 1px 0 rgba(255,255,255,.25)!important}
.sdc357-hero:before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(118deg,transparent 0 53%,rgba(255,255,255,.075) 53% 63%,transparent 63%),linear-gradient(128deg,transparent 0 75%,rgba(255,255,255,.07) 75% 80%,transparent 80%)}.sdc357-hero:after{content:"";position:absolute;right:-80px;top:-90px;width:360px;height:300px;opacity:.22;z-index:-1;background-image:radial-gradient(rgba(255,255,255,.38) 1px,transparent 1.7px);background-size:11px 11px;border-radius:999px}
.sdc357-logoBox{grid-area:logo!important;width:82px!important;height:82px!important;border-radius:23px!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.96)!important;border:1px solid rgba(255,255,255,.75)!important;box-shadow:0 14px 32px rgba(0,13,43,.28),inset 0 1px 0 rgba(255,255,255,.9)!important}.sdc357-logo{width:66px!important;height:66px!important;object-fit:contain!important;border-radius:18px!important;display:block!important}
.sdc357-brand{grid-area:brand!important;min-width:0!important;display:flex!important;flex-direction:column!important;align-items:flex-start!important;justify-content:center!important}.sdc357-pill{display:inline-flex!important;width:max-content!important;margin:0 0 7px!important;padding:6px 12px!important;border-radius:999px!important;background:rgba(255,255,255,.13)!important;border:1px solid rgba(255,255,255,.2)!important;color:#eaf5ff!important;font-size:11px!important;font-weight:950!important;letter-spacing:.06em!important;line-height:1!important}.sdc357-title{margin:0!important;color:#fff!important;font-size:clamp(34px,3vw,50px)!important;line-height:.95!important;letter-spacing:-.055em!important;font-weight:1000!important;white-space:nowrap!important;overflow:visible!important;text-shadow:0 8px 24px rgba(0,0,0,.2)!important}.sdc357-sub{margin:8px 0 0!important;color:rgba(228,242,255,.9)!important;font-size:clamp(12px,.88vw,15px)!important;font-weight:950!important;line-height:1.16!important;letter-spacing:.025em!important;text-transform:uppercase!important}
.sdc357-right{grid-area:right!important;display:grid!important;grid-template-columns:1fr!important;gap:10px!important;justify-items:end!important;align-items:center!important}.sdc357-actions{display:flex!important;gap:9px!important;align-items:center!important;justify-content:flex-end!important}.sdc357-btn{appearance:none!important;border:1px solid rgba(255,255,255,.24)!important;height:44px!important;min-height:44px!important;padding:0 15px!important;border-radius:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:8px!important;font-size:14px!important;font-weight:950!important;line-height:1!important;letter-spacing:-.02em!important;white-space:nowrap!important;cursor:pointer!important;color:#fff!important;box-shadow:0 12px 24px rgba(0,25,73,.16),inset 0 1px 0 rgba(255,255,255,.2)!important}.sdc357-btn svg{width:20px!important;height:20px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.6!important;stroke-linecap:round!important;stroke-linejoin:round!important}.sdc357-menu{min-width:108px!important;background:rgba(255,255,255,.13)!important;backdrop-filter:blur(14px)!important}.sdc357-fire{min-width:128px!important;color:#0b63ce!important;background:linear-gradient(180deg,#fff 0%,#f4f9ff 100%)!important}.sdc357-update{min-width:142px!important;background:linear-gradient(135deg,#168bff 0%,#006be7 100%)!important}
.sdc357-status{position:relative!important;min-width:220px!important;height:48px!important;padding:8px 14px 8px 38px!important;border-radius:16px!important;background:rgba(255,255,255,.13)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 10px 24px rgba(0,18,58,.12)!important;color:#eaf5ff!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;backdrop-filter:blur(14px)!important}.sdc357-dot{position:absolute!important;left:15px!important;top:16px!important;width:10px!important;height:10px!important;border-radius:999px!important;background:#2df0a2!important;box-shadow:0 0 0 5px rgba(45,240,162,.13),0 0 16px rgba(45,240,162,.7)!important}.sdc357-status b{font-size:13px!important;font-weight:1000!important;color:#36f6a8!important;letter-spacing:.05em!important;line-height:1!important}.sdc357-status small{margin-top:5px!important;font-size:11.5px!important;font-weight:850!important;color:rgba(232,244,255,.86)!important;line-height:1!important}
@media (min-width:761px) and (max-width:1280px){.sdc357-hero{width:calc(100vw - 54px)!important;grid-template-columns:78px minmax(0,1fr)!important;grid-template-areas:"logo brand" "right right"!important;gap:14px 18px!important;padding:22px 24px!important}.sdc357-logoBox{width:78px!important;height:78px!important}.sdc357-logo{width:62px!important;height:62px!important}.sdc357-right{justify-items:start!important}.sdc357-title{font-size:clamp(33px,4.2vw,48px)!important}.sdc357-actions{flex-wrap:wrap!important;justify-content:flex-start!important}.sdc357-status{min-width:220px!important}}
@media (max-width:760px){.sdc357-hero{width:calc(100vw - 22px)!important;margin:10px auto 12px!important;padding:13px!important;min-height:0!important;border-radius:22px!important;grid-template-columns:64px minmax(0,1fr)!important;grid-template-areas:"logo brand" "right right"!important;gap:10px 12px!important;background:linear-gradient(145deg,#061b3d 0%,#075ec7 100%)!important}.sdc357-hero:after{right:-90px!important;top:-80px!important;width:250px!important;height:230px!important;opacity:.16!important}.sdc357-logoBox{width:64px!important;height:64px!important;border-radius:18px!important}.sdc357-logo{width:52px!important;height:52px!important;border-radius:15px!important}.sdc357-pill{margin-bottom:6px!important;padding:5px 8px!important;font-size:9px!important}.sdc357-title{font-size:clamp(25px,7vw,33px)!important;line-height:.95!important;white-space:normal!important;letter-spacing:-.052em!important}.sdc357-sub{margin-top:6px!important;font-size:10px!important;line-height:1.15!important}.sdc357-right{width:100%!important;display:grid!important;grid-template-columns:1fr!important;gap:8px!important;justify-items:stretch!important}.sdc357-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}.sdc357-btn{width:100%!important;min-width:0!important;height:44px!important;min-height:44px!important;padding:0 5px!important;border-radius:14px!important;font-size:12px!important;gap:4px!important}.sdc357-btn svg{width:18px!important;height:18px!important}.sdc357-status{width:100%!important;min-width:0!important;height:44px!important;border-radius:15px!important;padding:8px 10px 8px 36px!important}.sdc357-dot{left:14px!important;top:15px!important}.sdc357-status b{font-size:13px!important}.sdc357-status small{font-size:11px!important;margin-top:4px!important}}
`;
    var st=document.createElement('style');
    st.id='sdc357-header-style';
    st.textContent=css;
    document.head.appendChild(st);
  }

  function icon(kind){
    if(kind==='menu') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    if(kind==='refresh') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2s5 5.1 5 10a5 5 0 0 1-10 0c0-2.5 2.5-4.5 2.5-4.5S10 10 12 10c1.7 0 3-1.3 3-3 0-1.7-3-5-3-5z"/></svg>';
  }

  function fecha(){
    try{return new Intl.DateTimeFormat('es-HN',{weekday:'short',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date()).replace(',',' ·');}
    catch(e){return new Date().toLocaleString();}
  }

  function findTitle(){
    return Array.from(document.querySelectorAll('h1,h2,h3,div,span')).find(function(el){
      return !el.closest('.sdc357-hero,.sdc353-hero') && norm(text(el))==='SD COMAYAGUA';
    }) || null;
  }

  function findOriginalHero(){
    var title=findTitle();
    if(!title) return null;
    var node=title;
    for(var i=0;i<10 && node && node.parentElement;i++,node=node.parentElement){
      var t=text(node);
      if(/SD\s+COMAYAGUA/i.test(t) && (/Men[uú]|Firebase|ACTIVO|Actualizar/i.test(t))){
        var r=node.getBoundingClientRect?node.getBoundingClientRect():{width:0,height:0};
        if(r.width>300 && r.height>80) return node;
      }
    }
    return title.closest('header,section,main > div,main > section') || null;
  }

  function findButton(regex, scope){
    var root=scope || document;
    return Array.from(root.querySelectorAll('button,a,[role="button"]')).find(function(el){
      return !el.closest('.sdc357-hero,.sdc353-hero') && regex.test(text(el));
    }) || null;
  }

  function logoSrc(hero){
    var logo=hero && Array.from(hero.querySelectorAll('img')).find(function(img){
      var label=((img.getAttribute('src')||'')+' '+(img.getAttribute('alt')||'')).toLowerCase();
      return /logo|sdc|comayagua/.test(label);
    });
    return (logo && logo.getAttribute('src')) || 'assets/logo-sdc-2026.png';
  }

  function btn(cls,label,kind,original,action){
    var b=document.createElement('button');
    b.type='button';
    b.className='sdc357-btn '+cls;
    b.innerHTML='<span>'+icon(kind)+'</span><span>'+label+'</span>';
    b.addEventListener('click',function(ev){
      ev.preventDefault(); ev.stopPropagation();
      try{ if(action) return action(); if(original && original.click) return original.click(); }
      catch(e){ console.warn('SDC v357 botón', label, e); }
    });
    return b;
  }

  function make(heroOld){
    var menu=findButton(/Men[uú]/i,heroOld)||findButton(/Men[uú]/i,document);
    var fire=findButton(/Firebase/i,heroOld)||findButton(/Firebase/i,document);
    var update=findButton(/Actualizar\s+app|Actualizando|Actualizar/i,heroOld)||findButton(/Actualizar\s+app|Actualizando|Actualizar/i,document);
    var hero=document.createElement('section');
    hero.className='sdc357-hero';
    hero.innerHTML='<div class="sdc357-logoBox"><img class="sdc357-logo" src="'+logoSrc(heroOld)+'" alt="SD Comayagua" decoding="async"></div><div class="sdc357-brand"><div class="sdc357-pill">PANEL PRIVADO</div><h1 class="sdc357-title">SD COMAYAGUA</h1><p class="sdc357-sub">CATÁLOGO · VENTAS · COTIZACIONES · INVENTARIO</p></div><div class="sdc357-right"><div class="sdc357-actions"></div><div class="sdc357-status"><span class="sdc357-dot"></span><b>ACTIVO</b><small></small></div></div>';
    var actions=hero.querySelector('.sdc357-actions');
    actions.appendChild(btn('sdc357-menu','Menú','menu',menu));
    actions.appendChild(btn('sdc357-fire','Firebase','fire',fire));
    actions.appendChild(btn('sdc357-update','Actualizar','refresh',update,function(){ if(window.sdcActualizarAppAhora) window.sdcActualizarAppAhora(); else if(update && update.click) update.click(); else location.reload(); }));
    function tick(){var s=hero.querySelector('.sdc357-status small'); if(s) s.textContent=fecha();}
    tick(); clearInterval(clockTimer); clockTimer=setInterval(tick,1000);
    return hero;
  }

  function install(){
    style();
    if(installed && document.querySelector('.sdc357-hero')) return;
    document.querySelectorAll('.sdc353-hero').forEach(function(el){el.classList.add('sdc357-original');});
    var old=findOriginalHero();
    if(!old) return;
    var hero=make(old);
    old.parentElement.insertBefore(hero, old);
    old.classList.add('sdc357-original');
    old.setAttribute('aria-hidden','true');
    document.body.classList.add('sdc-v357-header-clean');
    installed=true;
  }

  function start(){
    install();
    new MutationObserver(function(){requestAnimationFrame(install);}).observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(install,400);
    setTimeout(install,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
