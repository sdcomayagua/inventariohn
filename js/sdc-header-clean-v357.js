/* v357 simple · corrige el header existente sin crear duplicados */
(function(){
  'use strict';
  function add(){
    if(document.getElementById('sdc357-simple-style')) return;
    var s=document.createElement('style');
    s.id='sdc357-simple-style';
    s.textContent=`
.sdc349-premium-hero,.sdc328-app-hero,[data-sdc349="premium-hero"]{display:none!important;visibility:hidden!important;height:0!important;margin:0!important;padding:0!important;overflow:hidden!important;pointer-events:none!important}
.sdc353-hero{width:calc(100vw - 92px)!important;max-width:1760px!important;min-height:126px!important;margin:22px auto 14px!important;padding:21px 28px!important;border-radius:26px!important;display:grid!important;grid-template-columns:82px minmax(0,1fr) auto!important;grid-template-areas:"logo brand actions" "logo brand status"!important;gap:8px 22px!important;align-items:center!important;overflow:hidden!important}
.sdc353-logo-wrap{width:82px!important;height:82px!important;border-radius:22px!important}.sdc353-logo{width:66px!important;height:66px!important}
.sdc353-brand{min-width:0!important;overflow:visible!important}.sdc353-brand h1{font-size:clamp(32px,2.5vw,44px)!important;line-height:.96!important;letter-spacing:-.045em!important;white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important;max-width:none!important}.sdc353-brand p{font-size:clamp(12px,.86vw,14px)!important;line-height:1.16!important;margin-top:8px!important}.sdc353-pill{font-size:11px!important;padding:6px 12px!important;margin-bottom:7px!important}
.sdc353-actions{justify-self:end!important;align-self:end!important;gap:8px!important}.sdc353-btn{height:43px!important;min-height:43px!important;padding:0 14px!important;border-radius:14px!important;font-size:13.5px!important}.sdc353-menu{min-width:104px!important}.sdc353-fire{min-width:122px!important}.sdc353-update{min-width:132px!important}
.sdc353-status{justify-self:end!important;align-self:start!important;min-width:210px!important;min-height:44px!important;height:44px!important;padding:8px 13px 8px 36px!important;border-radius:15px!important}.sdc353-status b{font-size:12.5px!important}.sdc353-status small{font-size:11px!important;margin-top:4px!important}.sdc353-dot{left:14px!important;top:15px!important;width:10px!important;height:10px!important}
@media(max-width:760px){.sdc353-hero{width:calc(100vw - 22px)!important;margin:10px auto 12px!important;padding:13px!important;grid-template-columns:64px minmax(0,1fr)!important;grid-template-areas:"logo brand" "actions actions" "status status"!important;gap:10px 12px!important}.sdc353-logo-wrap{width:64px!important;height:64px!important}.sdc353-logo{width:52px!important;height:52px!important}.sdc353-brand h1{font-size:clamp(25px,7vw,33px)!important;white-space:normal!important}.sdc353-brand p{font-size:10px!important}.sdc353-actions{width:100%!important;display:grid!important;grid-template-columns:repeat(3,1fr)!important}.sdc353-btn{width:100%!important;min-width:0!important;font-size:12px!important;padding:0 5px!important}.sdc353-status{width:100%!important;min-width:0!important}}
`;
    document.head.appendChild(s);
  }
  function run(){add();document.body.classList.add('sdc-v357-simple-fix');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
})();
