document.documentElement.dataset.sdcV236 = '1';
window.__sdcV296StructureFix = true;

(function(){
  if(window.__sdcKeepCategoryPngOpen) return;
  window.__sdcKeepCategoryPngOpen = true;
  document.addEventListener('click', function(ev){
    const btn = ev.target && ev.target.closest ? ev.target.closest('[data-catcapture-v199]') : null;
    if(!btn) return;
    window.__sdcReopenCategorySheet = true;
    setTimeout(function(){
      if(!window.__sdcReopenCategorySheet) return;
      window.__sdcReopenCategorySheet = false;
      const modalRoot = document