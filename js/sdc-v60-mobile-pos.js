(function(){
  'use strict';
  const KEY='sdc_v83_theme';
  const THEMES=['light'];
  const LABEL={light:'Claro'};
  let busy=false;

  function getTheme(){
    return 'light';
  }
  function removeThemePanel(){
    document.querySelectorAll('[data-v60-theme-panel],.sdc-v60-theme-panel').forEach(panel=>panel.remove());
  }
  function setTheme(theme, silent){
    const clean='light';
    document.body.classList.add('sdc-v60-pos','sdc-v61-clean','sdc-v95-light-default','sdc-theme-light');
    document.body.classList.remove(
      'sdc-theme-black','sdc-theme-blue','sdc-theme-red','sdc-theme-gamer',
      'sdc-theme-dark','sdc-v57-dark','sdc-v57-light','pro-dark-mode','pro-white-mode','dark-mode'
    );
    document.documentElement.setAttribute('data-theme','light');
    localStorage.setItem(KEY, clean);
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content','#f4f7fb');
    removeThemePanel();
    if(!silent && window.dispatchEvent){
      try{window.dispatchEvent(new CustomEvent('sdc:v60-theme',{detail:{theme:clean}}));}catch(e){}
    }
  }
  function panelHTML(){ return ''; }
  function updateThemePanel(){ removeThemePanel(); }
  function ensurePanel(){ removeThemePanel(); }
  function cleanTextNodes(){
    // Quita textos de marketing heredados si algún script viejo los vuelve a pintar.
    const bad=[
      /ventas,\s*cotizaciones\s+e\s+inventario\s+sin\s+enredos\.?/ig,
      /cat[aá]logo\s+2026\s+cargado,?\s*acciones\s+grandes\s+para\s+m[oó]vil\s+y\s+sincronizaci[oó]n\s+directa\s+con\s+Apps\s+Script\.?/ig,
      /panel\s+conectado\s+a\s+Google\s+Sheets/ig,
      /vende\s+r[aá]pido/ig,
      /desde\s+tu\s+celular/ig,
      /sin\s+pantallas\s+complicadas/ig,
      /panel\s+m[oó]vil/ig,
      /toca\s+ver\s+para\s+abrir/ig
    ];
    document.querySelectorAll('h1,h2,h3,p,span,b,small,button').forEach(el=>{
      if(!el || !el.childNodes || el.childNodes.length!==1 || el.children.length) return;
      const txt=el.textContent||'';
      if(!txt.trim()) return;
      let next=txt;
      bad.forEach(rx=>{next=next.replace(rx,'').replace(/\s{2,}/g,' ').trim();});
      if(next!==txt.trim()) el.textContent=next;
    });
  }
  function purgeOldClasses(){
    document.body.classList.add('sdc-v60-pos','sdc-v61-clean','sdc-v95-light-default','sdc-theme-light');
    document.body.classList.remove('sdc-theme-black','sdc-theme-blue','sdc-theme-red','sdc-v57-dark','sdc-v57-light','dark-mode','pro-white-mode','pro-dark-mode');
    document.documentElement.style.setProperty('overflow-x','hidden','important');
    document.body.style.setProperty('overflow-x','hidden','important');
    if(!document.body.classList.contains('modal-open')){
      document.documentElement.style.setProperty('overflow-y','auto','important');
      document.body.style.setProperty('overflow-y','auto','important');
      document.body.style.setProperty('touch-action','auto','important');
    }
  }
  function sanitizeInlineColors(){ return; }
  function run(){
    if(busy) return;
    busy=true;
    requestAnimationFrame(()=>{
      setTheme(getTheme(), true);
      purgeOldClasses();
      ensurePanel();
      cleanTextNodes();
      sanitizeInlineColors();
      busy=false;
    });
  }
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);
  document.addEventListener('click', e=>{
    const btn=e.target.closest('[data-action]');
    if(btn) setTimeout(run,0);
  }, true);
  const mo=new MutationObserver(run);
  mo.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  setTheme(getTheme(), true);
})();
