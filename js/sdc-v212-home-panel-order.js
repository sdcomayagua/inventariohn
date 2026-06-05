/* SD Comayagua · v212 Inicio limpio */
(function(){
  'use strict';

  function page(){
    return document.body?.dataset?.sdcPageV150 || '';
  }

  function polishHomePanel(){
    document.body.classList.add('sdc-v212-home-panel-control');

    const app=document.getElementById('app');
    if(!app) return;

    const header=app.querySelector('header.sdc-top-v178');
    const panel=app.querySelector('.sdc210-s24-panel');

    if(panel){
      const label=panel.querySelector('.sdc210-panel-head span');
      const title=panel.querySelector('.sdc210-panel-head b');
      if(label) label.textContent='Accesos rápidos';
      if(title) title.textContent='Inicio rápido';
    }

    if(panel && header && page()==='inicio'){
      if(header.nextElementSibling !== panel){
        header.insertAdjacentElement('afterend', panel);
      }
    }
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      polishHomePanel();
    });
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', polishHomePanel, {once:true});
  }else{
    polishHomePanel();
  }

  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true});
})();
