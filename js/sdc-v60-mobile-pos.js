(function(){
  'use strict';
  const KEY='sdc_v83_theme';
  const THEMES=['black','blue','red'];
  const LABEL={black:'Negro',blue:'Azul',red:'Rojo'};
  const ICON={black:'●',blue:'◆',red:'●'};
  let busy=false;

  function getTheme(){
    const saved=localStorage.getItem(KEY);
    return THEMES.includes(saved)?saved:'black';
  }
  function setTheme(theme, silent){
    const clean=THEMES.includes(theme)?theme:'black';
    document.body.classList.add('sdc-v60-pos','sdc-v61-clean');
    document.body.classList.toggle('sdc-theme-black', clean==='black');
    document.body.classList.toggle('sdc-theme-blue', clean==='blue');
    document.body.classList.toggle('sdc-theme-red', clean==='red');
    document.body.classList.remove('sdc-theme-gamer');
    document.body.classList.remove('sdc-theme-dark','sdc-v57-dark','pro-dark-mode','dark-mode');
    localStorage.setItem(KEY, clean);
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content', clean==='blue'?'#153f83':(clean==='red'?'#941425':'#061522'));
    updateThemePanel();
    if(!silent && window.dispatchEvent){
      try{window.dispatchEvent(new CustomEvent('sdc:v60-theme',{detail:{theme:clean}}));}catch(e){}
    }
  }
  function panelHTML(){
    const t=getTheme();
    return `<section class="sdc-v60-theme-panel no-print" data-v60-theme-panel="1">
      <div class="sdc-v60-theme-title">Estilo visual</div>
      <div class="sdc-v60-theme-buttons" role="group" aria-label="Estilo visual">
        ${THEMES.map(name=>`<button type="button" data-v60-theme="${name}" aria-pressed="${t===name}"><span class="theme-dot" aria-hidden="true">${ICON[name]}</span><span>${LABEL[name]}</span></button>`).join('')}
      </div>
    </section>`;
  }
  function updateThemePanel(){
    const t=getTheme();
    document.querySelectorAll('[data-v60-theme]').forEach(btn=>{
      btn.setAttribute('aria-pressed', String(btn.dataset.v60Theme===t));
    });
  }
  function ensurePanel(){
    const app=document.getElementById('app');
    const top=document.querySelector('.topbar');
    if(!app || !top) return;
    let panel=document.querySelector('[data-v60-theme-panel]');
    if(!panel){
      top.insertAdjacentHTML('afterend', panelHTML());
      panel=document.querySelector('[data-v60-theme-panel]');
      panel?.addEventListener('click', e=>{
        const btn=e.target.closest('[data-v60-theme]');
        if(!btn) return;
        setTheme(btn.dataset.v60Theme);
        // Sin barra/toast al cambiar modo visual; el botón activo ya confirma el cambio.
      });
    }
    updateThemePanel();
  }
  function cleanTextNodes(){
    // Quita textos de marketing heredados si algún script viejo los vuelve a pintar.
    const bad=[
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
    document.body.classList.add('sdc-v60-pos','sdc-v61-clean');
    document.body.classList.remove('sdc-v57-dark','sdc-v57-light','dark-mode','pro-white-mode','pro-dark-mode');
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
