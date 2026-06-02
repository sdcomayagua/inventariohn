/* SD Comayagua v195 · Limpieza final de barra azul y chips horizontales. */
(function(){
  const qs=(s,r=document)=>r.querySelector(s);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  function clean(){
    document.body && document.body.classList.add('sdc-v195-no-blue-categorias');
    qsa('.category-strip-v191').forEach(el=>{ el.remove(); });
    qsa('.category-chip-v191').forEach(el=>{ el.remove(); });
    qsa('.catalog-metrics-v189').forEach(el=>{
      // Si quedó HTML viejo en caché, lo ocultamos para que no reaparezca la franja azul.
      el.setAttribute('aria-hidden','true');
      el.classList.add('sdc-v195-hidden-old-metrics');
    });
    const mini=qs('.catalog-mini-summary-v195');
    if(mini){
      mini.style.removeProperty('height');
      mini.style.removeProperty('overflow');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',clean,{once:true});
  else clean();
  const mo=new MutationObserver(()=>clean());
  try{ mo.observe(document.documentElement,{childList:true,subtree:true}); }catch(err){}
})();
