(function(){
  "use strict";
  let running=false;
  function text(el, value){ if(el) el.textContent = value; }
  function enhance(){
    if(running) return; running=true;
    document.body.classList.add('v39-mobile-ultra','v37-shop');
    text(document.querySelector('.catalog-section .section-title'),'Catálogo rápido');
    const count=document.getElementById('results-count');
    if(count){ count.textContent=(count.textContent||'0 productos').replace(/resultados?/i,'productos'); }
    text(document.querySelector('#ventas .section-title'),'Ventas');
    text(document.querySelector('#comprobantes .section-title'),'Facturas');
    const welcome=document.getElementById('inv-welcome'); if(welcome) welcome.textContent='Caja privada · venta y factura';
    const search=document.getElementById('inv-search'); if(search){ search.placeholder='Buscar producto, categoría o código'; search.setAttribute('autocomplete','off'); }
    document.querySelectorAll('.mobile-company-dock').forEach(el=>el.remove());
    const dock=document.querySelector('.bottom-dock');
    if(dock){ dock.querySelectorAll('button').forEach(btn=>btn.classList.remove('dock-selected')); const sell=dock.querySelector('button:nth-child(2)'); if(sell) sell.classList.add('dock-selected'); }
    const products=document.getElementById('inv-products'); const empty=document.getElementById('inv-empty'); const totalText=(document.getElementById('results-count')?.textContent||'').trim();
    if(products && empty){ if(products.children.length){ empty.style.display='none'; } else if(/0/.test(totalText)){ empty.style.display='block'; } }
    document.querySelectorAll('.product-action-btn.primary').forEach(btn=>{ if(/vender|venta|agregar/i.test(btn.textContent||'')) btn.textContent='Agregar a venta'; });
    running=false;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', enhance, {once:true}); else enhance();
  window.addEventListener('load', enhance, {once:true});
  [80,300,700,1200,2000].forEach(ms=>setTimeout(enhance,ms));
  setTimeout(()=>{ const main=document.querySelector('.main-content')||document.body; try{ new MutationObserver(enhance).observe(main,{childList:true,subtree:true}); }catch(e){} },250);
})();
