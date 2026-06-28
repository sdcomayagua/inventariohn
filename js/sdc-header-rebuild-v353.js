/* v355 · Header estable en PC y compacto en celular.
   Oculta el header anterior y evita el botón duplicado de Actualizar app. */
(function(){
  'use strict';

  var made=false;
  var timer=null;

  function text(el){return (el && el.textContent || '').replace(/\s+/g,' ').trim();}
  function plain(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toUpperCase();}

  function addStyles(){
    if(document.getElementById('sdc355-header-style')) return;
    var css = `
body.sdc-v353-header-rebuild .sdc353-original-hidden{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;pointer-events:none!important}
.sdc353-hero,.sdc353-hero *{box-sizing:border-box!important}.sdc353-hero .sdc344-update-app-btn,.sdc353-hero .sdc344-update-app-slot{display:none!important;visibility:hidden!important;width:0!important;height:0!important;overflow:hidden!important;pointer-events:none!important}
.sdc353-hero{position:relative!important;isolation:isolate!important;width:calc(100vw - 92px)!important;max-width:1760px!important;min-height:156px!important;margin:34px auto 26px!important;padding:24px 30px!important;border-radius:28px!important;overflow:hidden!important;display:grid!important;grid-template-columns:104px minmax(620px,1fr) minmax(470px,520px)!important;grid-template-areas:"logo brand status" "logo brand actions"!important;column-gap:26px!important;row-gap:12px!important;align-items:center!important;border:1px solid rgba(255,255,255,.45)!important;background:radial-gradient(circle at 88% 28%,rgba(47,161,255,.34),transparent 27%),linear-gradient(130deg,#061934 0%,#073671 46%,#0b7eea 100%)!important;box-shadow:0 24px 58px rgba(6,31,63,.16),inset 0 1px 0 rgba(255,255,255,.28)!important}
.sdc353-hero:before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(118deg,transparent 0 52%,rgba(255,255,255,.08) 52% 62%,transparent 62%),linear-gradient(128deg,transparent 0 70%,rgba(255,255,255,.07) 70% 75%,transparent 75%)}
.sdc353-hero:after{content:"";position:absolute;right:-54px;top:-74px;width:390px;height:310px;z-index:-1;opacity:.23;background-image:radial-gradient(rgba(255,255,255,.42) 1px,transparent 1.7px);background-size:11px 11px;border-radius:999px}.sdc353-glow{display:none!important}
.sdc353-logo-wrap{grid-area:logo!important;display:grid!important;place-items:center!important;width:96px!important;height:96px!important;border-radius:25px!important;justify-self:center!important;align-self:center!important;background:rgba(255,255,255,.96)!important;border:1px solid rgba(255,255,255,.78)!important;box-shadow:0 18px 40px rgba(0,13,43,.30),inset 0 1px 0 rgba(255,255,255,.9)!important}.sdc353-logo{display:block!important;width:78px!important;height:78px!important;max-width:78px!important;max-height:78px!important;object-fit:contain!important;border-radius:21px!important;padding:0!important;background:transparent!important;box-shadow:none!important}
.sdc353-brand{grid-area:brand!important;width:100%!important;min-width:0!important;max-width:100%!important;overflow:visible!important;align-self:center!important;justify-self:start!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important}.sdc353-pill{display:inline-flex!important;width:max-content!important;margin:0 0 9px!important;padding:6px 13px!important;border-radius:999px!important;border:1px solid rgba(255,255,255,.20)!important;background:rgba(255,255,255,.13)!important;color:#eaf5ff!important;font-size:11px!important;line-height:1!important;font-weight:950!important;letter-spacing:.06em!important;text-transform:uppercase!important}.sdc353-brand h1{margin:0!important;color:#fff!important;width:auto!important;max-width:none!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;font-size:clamp(42px,3.9vw,64px)!important;line-height:.93!important;letter-spacing:-.06em!important;font-weight:1000!important;text-shadow:0 8px 26px rgba(0,0,0,.22)!important}.sdc353-brand p{margin:10px 0 0!important;max-width:780px!important;color:rgba(227,241,255,.88)!important;font-size:clamp(13px,1.1vw,17px)!important;line-height:1.2!important;font-weight:950!important;letter-spacing:.028em!important;text-transform:uppercase!important;white-space:normal!important}
.sdc353-actions{grid-area:actions!important;justify-self:end!important;align-self:start!important;width:auto!important;display:flex!important;flex-wrap:nowrap!important;align-items:center!important;justify-content:flex-end!important;gap:10px!important}.sdc353-btn{appearance:none!important;border:1px solid rgba(255,255,255,.24)!important;min-height:48px!important;height:48px!important;padding:0 18px!important;border-radius:16px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:9px!important;color:#fff!important;font-size:15px!important;line-height:1!important;font-weight:950!important;letter-spacing:-.02em!important;cursor:pointer!important;white-space:nowrap!important;box-shadow:0 14px 28px rgba(0,25,73,.18),inset 0 1px 0 rgba(255,255,255,.20)!important}.sdc353-btn svg{display:block!important;width:22px!important;height:22px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.6!important;stroke-linecap:round!important;stroke-linejoin:round!important}.sdc353-menu{min-width:128px!important;background:rgba(255,255,255,.13)!important;backdrop-filter:blur(14px)!important}.sdc353-fire,.sdc353-update{background:linear-gradient(135deg,#168bff 0%,#006be7 100%)!important}.sdc353-fire{min-width:150px!important}.sdc353-update{min-width:190px!important}
.sdc353-status{grid-area:status!important;justify-self:end!important;align-self:end!important;position:relative!important;min-width:250px!important;width:auto!important;min-height:56px!important;padding:10px 16px 10px 44px!important;border-radius:17px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;background:rgba(255,255,255,.13)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 12px 30px rgba(0,18,58,.13)!important;color:#eaf5ff!important;backdrop-filter:blur(14px)!important}.sdc353-dot{position:absolute!important;left:18px!important;top:17px!important;width:12px!important;height:12px!important;border-radius:999px!important;background:#2df0a2!important;box-shadow:0 0 0 6px rgba(45,240,162,.13),0 0 18px rgba(45,240,162,.7)!important}.sdc353-status b{color:#36f6a8!important;font-size:14px!important;line-height:1!important;font-weight:1000!important;letter-spacing:.05em!important}.sdc353-status small{display:block!important;margin-top:6px!important;color:rgba(232,244,255,.86)!important;font-size:12.5px!important;line-height:1.15!important;font-weight:850!important}
@media (min-width:761px) and (max-width:1160px){.sdc353-hero{width:calc(100vw - 52px)!important;grid-template-columns:92px minmax(0,1fr)!important;grid-template-areas:"logo brand" "actions actions" "status status"!important;row-gap:14px!important;padding:26px!important}.sdc353-logo-wrap{width:92px!important;height:92px!important}.sdc353-logo{width:76px!important;height:76px!important}.sdc353-brand h1{font-size:clamp(35px,5.7vw,52px)!important;white-space:normal!important}.sdc353-actions,.sdc353-status{justify-self:start!important}}
@media (max-width:760px){.sdc353-hero{width:calc(100vw - 22px)!important;margin:10px auto 12px!important;padding:13px!important;min-height:0!important;border-radius:22px!important;grid-template-columns:66px minmax(0,1fr)!important;grid-template-areas:"logo brand" "actions actions" "status status"!important;gap:10px 12px!important;background:linear-gradient(145deg,#061b3d 0%,#075ec7 100%)!important}.sdc353-hero:after{right:-80px!important;top:-80px!important;width:250px!important;height:230px!important;opacity:.16!important}.sdc353-logo-wrap{width:66px!important;height:66px!important;border-radius:18px!important}.sdc353-logo{width:54px!important;height:54px!important;border-radius:15px!important}.sdc353-brand{min-width:0!important}.sdc353-pill{margin:0 0 6px!important;padding:5px 8px!important;font-size:9px!important}.sdc353-brand h1{font-size:clamp(25px,7vw,33px)!important;line-height:.95!important;white-space:normal!important;letter-spacing:-.052em!important}.sdc353-brand p{margin-top:6px!important;font-size:10px!important;line-height:1.15!important;letter-spacing:.02em!important}.sdc353-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}.sdc353-btn{width:100%!important;min-width:0!important;height:46px!important;min-height:46px!important;padding:0 5px!important;border-radius:14px!important;font-size:12px!important;gap:4px!important}.sdc353-btn svg{width:18px!important;height:18px!important}.sdc353-menu,.sdc353-fire,.sdc353-update{min-width:0!important}.sdc353-status{width:100%!important;min-width:0!important;min-height:46px!important;border-radius:15px!important;padding:8px 10px 8px 36px!important;justify-self:stretch!important}.sdc353-dot{left:14px!important;top:16px!important;width:10px!important;height:10px!important}.sdc353-status b{font-size:13px!important}.sdc353-status small{font-size:11px!important;margin-top:4px!important}}
`;
    var style=document.createElement('style');
    style.id='sdc355-header-style';
    style.textContent=css;
    document.head.appendChild(style);
  }

  function findTitle(){return Array.from(document.querySelectorAll('h1,h2,h3,div,span')).find(function(el){return !el.closest('.sdc353-hero') && plain(text(el))==='SD COMAYAGUA';}) || null;}
  function findOriginalHero(){var title=findTitle(); if(!title) return null; var node=title; for(var i=0;i<10 && node && node.parentElement;i++,node=node.parentElement){var t=text(node); if(/SD\s+COMAYAGUA/i.test(t) && (/Men[uú]|Firebase|ACTIVO|Actualizar/i.test(t))){var r=node.getBoundingClientRect?node.getBoundingClientRect():{width:0,height:0}; if(r.width>300 && r.height>80) return node;}} return title.closest('header,section,main > div,main > section') || null;}
  function findButton(regex, scope){var root=scope || document; return Array.from(root.querySelectorAll('button,a,[role="button"]')).find(function(el){return !el.closest('.sdc353-hero') && regex.test(text(el));}) || null;}
  function logoSrc(hero){var logo=hero && Array.from(hero.querySelectorAll('img')).find(function(img){var label=((img.getAttribute('src')||'')+' '+(img.getAttribute('alt')||'')).toLowerCase(); return /logo|sdc|comayagua/.test(label);}); return (logo && logo.getAttribute('src')) || 'assets/logo-sdc-2026.png';}
  function fecha(){try{return new Intl.DateTimeFormat('es-HN',{weekday:'short',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date()).replace(',',' ·');}catch(e){return new Date().toLocaleString();}}
  function icon(kind){if(kind==='menu') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'; if(kind==='refresh') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6"/></svg>'; return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2s5 5.1 5 10a5 5 0 0 1-10 0c0-2.5 2.5-4.5 2.5-4.5S10 10 12 10c1.7 0 3-1.3 3-3 0-1.7-3-5-3-5z"/></svg>';}
  function makeBtn(cls,label,kind,original,action){var btn=document.createElement('button'); btn.type='button'; btn.className='sdc353-btn '+cls; btn.innerHTML='<span class="sdc353-btn-icon">'+icon(kind)+'</span><span>'+label+'</span>'; btn.addEventListener('click',function(ev){ev.preventDefault(); ev.stopPropagation(); try{if(action) return action(btn); if(original && original.click) return original.click();}catch(error){console.warn('SDC v355: no se pudo ejecutar botón', label, error);}}); return btn;}

  function makeHero(originalHero){
    var menuOriginal=findButton(/Men[uú]/i,originalHero)||findButton(/Men[uú]/i,document);
    var firebaseOriginal=findButton(/Firebase/i,originalHero)||findButton(/Firebase/i,document);
    var updateOriginal=findButton(/Actualizar\s+app|Actualizando/i,originalHero)||findButton(/Actualizar\s+app|Actualizando/i,document);
    var hero=document.createElement('section');
    hero.className='sdc353-hero';
    hero.setAttribute('aria-label','Encabezado SD Comayagua');
    hero.innerHTML='<div class="sdc353-glow"></div><div class="sdc353-logo-wrap"><img class="sdc353-logo" src="'+logoSrc(originalHero)+'" alt="SD Comayagua" decoding="async"></div><div class="sdc353-brand"><div class="sdc353-pill">PANEL PRIVADO</div><h1>SD COMAYAGUA</h1><p>CATÁLOGO · VENTAS · COTIZACIONES · INVENTARIO</p></div><div class="sdc353-actions"></div><div class="sdc353-status" aria-label="Estado activo"><span class="sdc353-dot"></span><b>ACTIVO</b><small></small></div>';
    var actions=hero.querySelector('.sdc353-actions');
    actions.appendChild(makeBtn('sdc353-menu','Menú','menu',menuOriginal));
    actions.appendChild(makeBtn('sdc353-fire','Firebase','fire',firebaseOriginal));
    actions.appendChild(makeBtn('sdc353-update','Actualizar','refresh',updateOriginal,function(){if(window.sdcActualizarAppAhora) window.sdcActualizarAppAhora(); else if(updateOriginal && updateOriginal.click) updateOriginal.click(); else location.reload();}));
    function tick(){var small=hero.querySelector('.sdc353-status small'); if(small) small.textContent=fecha();}
    tick(); clearInterval(timer); timer=setInterval(tick,1000);
    return hero;
  }

  function removeDuplicateUpdate(){
    document.querySelectorAll('.sdc353-hero .sdc344-update-app-btn,.sdc353-hero .sdc344-update-app-slot').forEach(function(el){el.remove();});
  }

  function install(){
    addStyles();
    removeDuplicateUpdate();
    if(made && document.querySelector('.sdc353-hero')) return;
    var originalHero=findOriginalHero();
    if(!originalHero || originalHero.classList.contains('sdc353-original-hidden')) return;
    var hero=makeHero(originalHero);
    originalHero.parentElement.insertBefore(hero,originalHero);
    originalHero.classList.add('sdc353-original-hidden');
    originalHero.setAttribute('aria-hidden','true');
    document.body.classList.add('sdc-v353-header-rebuild','sdc-v354-header-final','sdc-v355-mobile-compact');
    made=true;
  }

  function start(){
    install();
    new MutationObserver(function(){requestAnimationFrame(function(){removeDuplicateUpdate();install();});}).observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(install,400);
    setTimeout(install,1200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
