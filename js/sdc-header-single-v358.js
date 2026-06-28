/* v358 · Deja UN solo encabezado limpio.
   Oculta todos los headers anteriores y crea uno estable. No cambia inventario, ventas ni Firebase. */
(function(){
  'use strict';

  var installed=false;
  var clock=null;

  function txt(el){return (el && el.textContent || '').replace(/\s+/g,' ').trim();}

  function style(){
    if(document.getElementById('sdc358-style')) return;
    var css = `
.sdc358-hidden{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;pointer-events:none!important}
.sdc358-hero,.sdc358-hero *{box-sizing:border-box!important}.sdc358-hero{position:relative!important;isolation:isolate!important;width:calc(100vw - 92px)!important;max-width:1760px!important;min-height:126px!important;margin:24px auto 14px!important;padding:22px 28px!important;border-radius:26px!important;overflow:hidden!important;display:grid!important;grid-template-columns:82px minmax(0,1fr) auto!important;grid-template-areas:"logo brand right"!important;gap:22px!important;align-items:center!important;background:linear-gradient(130deg,#061934 0%,#073671 48%,#0b7eea 100%)!important;border:1px solid rgba(255,255,255,.42)!important;box-shadow:0 18px 44px rgba(6,31,63,.14),inset 0 1px 0 rgba(255,255,255,.25)!important}.sdc358-hero:before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(118deg,transparent 0 55%,rgba(255,255,255,.08) 55% 64%,transparent 64%),linear-gradient(128deg,transparent 0 77%,rgba(255,255,255,.07) 77% 82%,transparent 82%)}.sdc358-hero:after{content:"";position:absolute;right:-78px;top:-88px;width:340px;height:280px;z-index:-1;opacity:.20;background-image:radial-gradient(rgba(255,255,255,.38) 1px,transparent 1.7px);background-size:11px 11px;border-radius:999px}
.sdc358-logoBox{grid-area:logo!important;width:82px!important;height:82px!important;border-radius:23px!important;display:grid!important;place-items:center!important;background:rgba(255,255,255,.96)!important;border:1px solid rgba(255,255,255,.75)!important;box-shadow:0 14px 30px rgba(0,13,43,.26),inset 0 1px 0 rgba(255,255,255,.9)!important}.sdc358-logo{width:66px!important;height:66px!important;object-fit:contain!important;border-radius:18px!important;display:block!important}
.sdc358-brand{grid-area:brand!important;min-width:0!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important}.sdc358-pill{display:inline-flex!important;width:max-content!important;margin:0 0 7px!important;padding:6px 12px!important;border-radius:999px!important;background:rgba(255,255,255,.13)!important;border:1px solid rgba(255,255,255,.20)!important;color:#eaf5ff!important;font-size:11px!important;font-weight:950!important;letter-spacing:.06em!important;line-height:1!important}.sdc358-title{margin:0!important;color:#fff!important;font-size:clamp(32px,2.45vw,44px)!important;line-height:.96!important;letter-spacing:-.045em!important;font-weight:1000!important;white-space:nowrap!important;overflow:visible!important;text-shadow:0 7px 22px rgba(0,0,0,.20)!important}.sdc358-sub{margin:8px 0 0!important;color:rgba(228,242,255,.90)!important;font-size:clamp(12px,.84vw,14px)!important;font-weight:950!important;line-height:1.16!important;letter-spacing:.025em!important;text-transform:uppercase!important}
.sdc358-right{grid-area:right!important;display:grid!important;grid-template-columns:1fr!important;gap:9px!important;justify-items:end!important;align-items:center!important}.sdc358-actions{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important}.sdc358-btn{appearance:none!important;border:1px solid rgba(255,255,255,.24)!important;height:43px!important;min-height:43px!important;padding:0 14px!important;border-radius:14px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:7px!important;font-size:13.5px!important;font-weight:950!important;line-height:1!important;letter-spacing:-.02em!important;white-space:nowrap!important;cursor:pointer!important;color:#fff!important;box-shadow:0 11px 22px rgba(0,25,73,.15),inset 0 1px 0 rgba(255,255,255,.20)!important}.sdc358-btn svg{width:19px!important;height:19px!important;fill:none!important;stroke:currentColor!important;stroke-width:2.6!important;stroke-linecap:round!important;stroke-linejoin:round!important}.sdc358-menu{min-width:104px!important;background:rgba(255,255,255,.13)!important;backdrop-filter:blur(14px)!important}.sdc358-fire{min-width:122px!important;color:#0b63ce!important;background:linear-gradient(180deg,#fff 0%,#f4f9ff 100%)!important}.sdc358-update{min-width:132px!important;background:linear-gradient(135deg,#168bff 0%,#006be7 100%)!important}
.sdc358-status{position:relative!important;min-width:210px!important;height:44px!important;padding:8px 13px 8px 36px!important;border-radius:15px!important;background:rgba(255,255,255,.13)!important;border:1px solid rgba(255,255,255,.18)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 9px 22px rgba(0,18,58,.12)!important;color:#eaf5ff!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;backdrop-filter:blur(14px)!important}.sdc358-dot{position:absolute!important;left:14px!important;top:15px!important;width:10px!important;height:10px!important;border-radius:999px!important;background:#2df0a2!important;box-shadow:0 0 0 5px rgba(45,240,162,.13),0 0 16px rgba(45,240,162,.7)!important}.sdc358-status b{font-size:12.5px!important;font-weight:1000!important;color:#36f6a8!important;letter-spacing:.05em!important;line-height:1!important}.sdc358-status small{margin-top:4px!important;font-size:11px!important;font-weight:850!important;color:rgba(232,244,255,.86)!important;line-height:1!important}
@media (min-width:761px) and (max-width:1200px){.sdc358-hero{width:calc(100vw - 54px)!important;grid-template-columns:76px minmax(0,1fr)!important;grid-template-areas:"logo brand" "right right"!important;gap:13px 18px!important;padding:21px 24px!important}.sdc358-logoBox{width:76px!important;height:76px!important}.sdc358-logo{width:61px!important;height:61px!important}.sdc358-right{justify-items:start!important}.sdc358-actions{flex-wrap:wrap!important;justify-content:flex-start!important}.sdc358-title{font-size:clamp(31px,4vw,44px)!important}.sdc358-status{min-width:210px!important}}
@media (max-width:760px){.sdc358-hero{width:calc(100vw - 22px)!important;margin:10px auto 12px!important;padding:13px!important;min-height:0!important;border-radius:22px!important;grid-template-columns:64px minmax(0,1fr)!important;grid-template-areas:"logo brand" "right right"!important;gap:10px 12px!important;background:linear-gradient(145deg,#061b3d 0%,#075ec7 100%)!important}.sdc358-hero:after{right:-90px!important;top:-80px!important;width:250px!important;height:230px!important;opacity:.16!important}.sdc358-logoBox{width:64px!important;height:64px!important;border-radius:18px!important}.sdc358-logo{width:52px!important;height:52px!important;border-radius:15px!important}.sdc358-pill{margin-bottom:6px!important;padding:5px 8px!important;font-size:9px!important}.sdc358-title{font-size:clamp(25px,7vw,33px)!important;line-height:.95!important;white-space:normal!important;letter-spacing:-.052em!important}.sdc358-sub{margin-top:6px!important;font-size:10px!important;line-height:1.15!important}.sdc358-right{width:100%!important;display:grid!important;grid-template-columns:1fr!important;gap:8px!important;justify-items:stretch!important}.sdc358-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:7px!important}.sdc358-btn{width:100%!important;min-width:0!important;height:44px!important;min-height:44px!important;padding:0 5px!important;border-radius:14px!important;font-size:12px!important;gap:4px!important}.sdc358-btn svg{width:18px!important;height:18px!important}.sdc358-status{width:100%!important;min-width:0!important;height:44px!important;border-radius:15px!important;padding:8px 10px 8px 36px!important}.sdc358-dot{left:14px!important;top:15px!important}.sdc358-status b{font-size:13px!important}.sdc358-status small{font-size:11px!important;margin-top:4px!important}}
`;
    var s=document.createElement('style');
    s.id='sdc358-style';
    s.textContent=css;
    document.head.appendChild(s);
  }

  function icon(kind){
    if(kind==='menu') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    if(kind==='refresh') return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v6h-6"/></svg>';
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2s5 5.1 5 10a5 5 0 0 1-10 0c0-2.5 2.5-4.5 2.5-4.5S10 10 12 10c1.7 0 3-1.3 3-3 0-1.7-3-5-3-5z"/></svg>';
  }

  function now(){
    try{return new Intl.DateTimeFormat('es-HN',{weekday:'short',day:'2-digit',month:'short',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}).format(new Date()).replace(',',' ·');}
    catch(e){return new Date().toLocaleString();}
  }

  function oldHeaders(){
    var selectors='.sdc357-hero,.sdc353-hero,.sdc349-premium-hero,.sdc328-app-hero,[data-sdc349="premium-hero"]';
    return Array.from(document.querySelectorAll(selectors)).filter(function(el){return !el.classList.contains('sdc358-hero');});
  }

  function originalButton(regex){
    return Array.from(document.querySelectorAll('button,a,[role="button"]')).find(function(el){
      return !el.closest('.sdc358-hero') && regex.test(txt(el));
    }) || null;
  }

  function logoSrc(){
    var img=Array.from(document.querySelectorAll('img')).find(function(i){
      var label=((i.getAttribute('src')||'')+' '+(i.getAttribute('alt')||'')).toLowerCase();
      return /logo|sdc|comayagua/.test(label);
    });
    return (img && img.getAttribute('src')) || 'assets/logo-sdc-2026.png';
  }

  function makeBtn(cls,label,kind,original,custom){
    var b=document.createElement('button');
    b.type='button';
    b.className='sdc358-btn '+cls;
    b.innerHTML='<span>'+icon(kind)+'</span><span>'+label+'</span>';
    b.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      try{
        if(custom) return custom();
        if(original && original.click) return original.click();
      }catch(err){console.warn('SDC v358 botón',label,err);}
    });
    return b;
  }

  function createHero(){
    var menu=originalButton(/Men[uú]/i);
    var fire=originalButton(/Firebase/i);
    var update=originalButton(/Actualizar\s+app|Actualizando|Actualizar/i);
    var hero=document.createElement('section');
    hero.className='sdc358-hero';
    hero.innerHTML='<div class="sdc358-logoBox"><img class="sdc358-logo" src="'+logoSrc()+'" alt="SD Comayagua" decoding="async"></div><div class="sdc358-brand"><div class="sdc358-pill">PANEL PRIVADO</div><h1 class="sdc358-title">SD COMAYAGUA</h1><p class="sdc358-sub">CATÁLOGO · VENTAS · COTIZACIONES · INVENTARIO</p></div><div class="sdc358-right"><div class="sdc358-actions"></div><div class="sdc358-status"><span class="sdc358-dot"></span><b>ACTIVO</b><small></small></div></div>';
    var actions=hero.querySelector('.sdc358-actions');
    actions.appendChild(makeBtn('sdc358-menu','Menú','menu',menu));
    actions.appendChild(makeBtn('sdc358-fire','Firebase','fire',fire));
    actions.appendChild(makeBtn('sdc358-update','Actualizar','refresh',update,function(){
      if(window.sdcActualizarAppAhora) window.sdcActualizarAppAhora();
      else if(update && update.click) update.click();
      else location.reload();
    }));
    function tick(){var small=hero.querySelector('.sdc358-status small'); if(small) small.textContent=now();}
    tick();
    clearInterval(clock);
    clock=setInterval(tick,1000);
    return hero;
  }

  function placeHero(hero){
    var app=document.getElementById('app');
    var firstOld=oldHeaders()[0];
    if(firstOld && firstOld.parentElement){
      firstOld.parentElement.insertBefore(hero, firstOld);
      return true;
    }
    if(app){
      app.insertBefore(hero, app.firstChild);
      return true;
    }
    return false;
  }

  function install(){
    style();
    oldHeaders().forEach(function(el){el.classList.add('sdc358-hidden'); el.setAttribute('aria-hidden','true');});
    if(installed && document.querySelector('.sdc358-hero')) return;
    var hero=createHero();
    if(!placeHero(hero)) return;
    document.body.classList.add('sdc-v358-single-header');
    installed=true;
  }

  function start(){
    install();
    new MutationObserver(function(){requestAnimationFrame(install);}).observe(document.documentElement,{childList:true,subtree:true});
    setTimeout(install,300);
    setTimeout(install,900);
    setTimeout(install,1800);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
