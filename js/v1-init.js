/* SD Comayagua · Sistema limpio · utilidades seguras */
(function(){
  const STORAGE_NOTE_KEY = 'sdc_v1_installed_notice';
  window.addEventListener('DOMContentLoaded', function(){
    document.documentElement.setAttribute('data-sdc-version','1');
    if(!localStorage.getItem(STORAGE_NOTE_KEY)){
      localStorage.setItem(STORAGE_NOTE_KEY, new Date().toISOString());
    }
  });
  window.addEventListener('error', function(e){
    const toast = document.getElementById('toast');
    if(!toast) return;
    toast.textContent = 'Aviso: revisa que todos los archivos se subieron correctamente.';
    toast.style.display = 'block';
    clearTimeout(window.__sdcV1ErrToast);
    window.__sdcV1ErrToast = setTimeout(()=>toast.style.display='', 4200);
    console.error('SDC:', e.error || e.message);
  });
})();
