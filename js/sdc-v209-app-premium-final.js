
/* SD Comayagua · v209 App Premium Final */
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  const navItems=[
    ['tabInicio','Inicio','⌂'],
    ['tabProductos','Catálogo','▦'],
    ['quote','Cotizar','🧾'],
    ['sell','Vender','⚡'],
    ['receipts','Caja','▤']
  ];

  function ensureBottomNav(){
    if(document.querySelector('.sdc209-bottom-nav')) return;
    const nav=document.createElement('nav');
    nav.className='sdc209-bottom-nav no-print';
    nav.setAttribute('aria-label','Navegación rápida móvil');
    nav.innerHTML=navItems.map(([action,label,icon])=>`<button type="button" data-sdc209-nav="${action}" aria-label="${label}"><i>${icon}</i><span>${label}</span></button>`).join('');
    document.body.appendChild(nav);
    nav.addEventListener('click',ev=>{
      const btn=ev.target.closest('[data-sdc209-nav]');
      if(!btn) return;
      ev.preventDefault();
      const action=btn.dataset.sdc209Nav;
      runAction(action);
    });
  }

  function runAction(action){
    const candidates=$$(`[data-action="${CSS.escape(action)}"]`).filter(el=>!el.closest('.sdc209-bottom-nav'));
    const visible=candidates.find(el=>el.offsetParent!==null) || candidates[0];
    if(visible){ visible.click(); return; }

    // Fallbacks si en ese momento el botón no está renderizado.
    const map={
      tabInicio:'tabInicio',
      tabProductos:'tabProductos',
      quote:'quote',
      sell:'sell',
      receipts:'receipts'
    };
    const fallback=$(`[data-sdc127="${map[action]||action}"]`);
    if(fallback){ fallback.click(); return; }

    if(action==='tabInicio') window.scrollTo({top:0,behavior:'smooth'});
  }

  function updateActive(){
    const page=(document.body.dataset.sdcPageV150||'inicio').toLowerCase();
    const modalOpen=!!document.querySelector('#modalRoot .modal');
    document.body.classList.toggle('sdc209-has-modal',modalOpen);
    $$('.sdc209-bottom-nav [data-sdc209-nav]').forEach(btn=>{
      const action=btn.dataset.sdc209Nav;
      const active=(action==='tabInicio' && page==='inicio') || (action==='tabProductos' && page==='productos') || (action==='quote' && !!document.querySelector('#modalRoot .quote-modal-v176:not(.sale)')) || (action==='sell' && modalOpen && /venta|factura/i.test(document.querySelector('#modalRoot .modal-head h3')?.textContent||'')) || (action==='receipts' && modalOpen && /recibos|caja/i.test(document.querySelector('#modalRoot .modal-head h3')?.textContent||''));
      btn.classList.toggle('active',active);
    });
  }

  function polish(){
    ensureBottomNav();
    updateActive();

    // Evita acciones flotantes dentro de modales; quedan al final del contenido.
    $$('#modalRoot .quote-actions-v176,#modalRoot .modal-actions,#modalRoot .short-receipt-actions').forEach(el=>{
      el.style.position='static';
      el.style.inset='auto';
      el.style.transform='none';
    });

    // Ajuste de textos largos en productos, recibos y métricas.
    $$('.product-card h3,.picker-item b,.cart-row b,.sdc208-line-copy b,.sdc209-mini-card b').forEach(el=>{
      el.style.overflowWrap='anywhere';
    });

    // Al abrir modal, asegurarse de que empiece arriba.
    const modal=$('#modalRoot .modal');
    if(modal && modal.dataset.sdc209Top!=='1'){
      modal.dataset.sdc209Top='1';
      modal.scrollTop=0;
      const body=$('#modalRoot .modal-body');
      if(body) body.scrollTop=0;
    }
  }

  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;polish();});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true});
  else polish();

  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(schedule,200),{passive:true});
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-sdc-page-v150','style']});
})();
