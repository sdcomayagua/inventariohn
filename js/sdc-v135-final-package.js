/* SDC V137 FINAL PACKAGE: cargador único de UI final, escritorio, móvil, recibos, logo, menú y páginas separadas. */
(function(){
  'use strict';
  if(window.SDCV135FinalPackage) return;
  window.SDCV135FinalPackage = true;

  const VERSION = '137-logo-pages';

  function addCss(path){
    if(document.querySelector('link[href*="'+path+'"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = path + '?v=' + VERSION;
    document.head.appendChild(link);
  }

  function addScript(path){
    if(document.querySelector('script[src*="'+path+'"]')) return;
    const script = document.createElement('script');
    script.defer = true;
    script.src = path + '?v=' + VERSION;
    document.body.appendChild(script);
  }

  function setVersion(){
    document.documentElement.setAttribute('data-sdc-version', VERSION);
    if(document.body){
      document.body.classList.add('sdc-v137-final-package');
      document.body.classList.add('sdc-v136-final-package');
      document.body.classList.add('sdc-v135-final-package');
    }
  }

  function loadPackage(){
    addCss('css/sdc-v126-performance-hotfix.css');
    addCss('css/sdc-v128-final-mobile-polish.css');
    addCss('css/sdc-v130-receipts-clean.css');
    addCss('css/sdc-v131-s24-ui-final.css');
    addCss('css/sdc-v132-actions-bottom-final.css');
    addCss('css/sdc-v133-desktop-final.css');
    addCss('css/sdc-v134-large-mobile-final.css');
    addCss('css/sdc-v136-logo-receipt-mobile-fix.css');

    addScript('js/sdc-v135-menu-actions-final.js');
    addScript('js/sdc-v137-logo-pages.js');
    setVersion();
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', loadPackage, {once:true});
  }else{
    loadPackage();
  }
})();
