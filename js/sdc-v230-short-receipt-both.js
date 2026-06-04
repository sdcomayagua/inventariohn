/* SD Comayagua · v230 */
(function(){
  'use strict';

  function toast(msg){
    try{
      if(window.SDCApp && typeof window.SDCApp.toast==='function') return window.SDCApp.toast(msg);
    }catch(e){}
    try{
      const t=document.getElementById('toast');
      if(t){ t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
    }catch(e){}
  }

  function moneyNumber(text){
    const raw=String(text||'').replace(/,/g,'');
    const m=raw.match(/Lps\.\s*([0-9]+(?:\.[0-9]{1,2})?)/i) || raw.match(/([0-9]+(?:\.[0-9]{1,2})?)/);
    return m?Number(m[1]):0;
  }

  function receiptTotal(section){
    const el=section.querySelector('.sdc204-total b,.sdc205-total b,.short-line.grand b,.sdc208-line.grand b,.sdc208-total b,.receipt-total b');
    return moneyNumber(el ? el.textContent : '0');
  }

  function waitHtml2Canvas(timeout){
    timeout=timeout||7000;
    if(window.html2canvas) return Promise.resolve(window.html2canvas);
    const start=Date.now();
    return new Promise((resolve,reject)=>{
      const tick=()=>{
        if(window.html2canvas) return resolve(window.html2canvas);
        if(Date.now()-start>timeout) return reject(new Error('html2canvas no cargó'));
        setTimeout(tick,120);
      };
      tick();
    });
  }

  function downloadCanvas(canvas, filename){
    const a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');
    a.download=filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function buildCompareExport(modal){
    const sections=[...modal.querySelectorAll('.short-receipt-variant-v147')];
    if(sections.length<2) throw new Error('No se encontraron las dos variantes del recibo.');
    const left=sections[0].querySelector('.short-receipt,.sdc-short-v204,.sdc-short-v205,.sdc-short-v206');
    const right=sections[1].querySelector('.short-receipt,.sdc-short-v204,.sdc-short-v205,.sdc-short-v206');
    if(!left || !right) throw new Error('No se pudieron preparar los recibos.');

    const normalTotal=receiptTotal(sections[0]);
    const codTotal=receiptTotal(sections[1]);
    const savings=Math.max(0,codTotal-normalTotal);

    const host=document.createElement('div');
    host.className='sdc230-compare-export-host';
    host.style.cssText='position:fixed;left:-10000px;top:0;z-index:-1;opacity:1;pointer-events:none;';
    host.innerHTML=''
      + '<div class="sdc230-compare-export">'
      + '  <div class="sdc230-compare-head">'
      + '    <div>'
      + '      <span>SD COMAYAGUA</span>'
      + '      <h2>Comparativa de pago</h2>'
      + '      <p>Mira cuánto pagará el cliente según el tipo de entrega y cuánto se ahorra si deposita antes.</p>'
      + '    </div>'
      + '    <div class="sdc230-compare-pill">'
      + '      <b>Ahorro por depósito: Lps. ' + Math.round(savings) + '</b>'
      + '      <small>Envío normal: Lps. ' + Math.round(normalTotal) + ' · Pagar al recibir: Lps. ' + Math.round(codTotal) + '</small>'
      + '    </div>'
      + '  </div>'
      + '  <div class="sdc230-compare-grid">'
      + '    <section class="sdc230-compare-card"><div class="sdc230-compare-label normal">Envío normal / depósito antes</div></section>'
      + '    <section class="sdc230-compare-card"><div class="sdc230-compare-label cod">Pagar al recibir</div></section>'
      + '  </div>'
      + '  <div class="sdc230-compare-foot">Comparativa lista para compartir por WhatsApp</div>'
      + '</div>';
    const cards=host.querySelectorAll('.sdc230-compare-card');
    cards[0].appendChild(left.cloneNode(true));
    cards[1].appendChild(right.cloneNode(true));
    document.body.appendChild(host);
    return host;
  }

  async function exportBoth(modal){
    const btn=modal.querySelector('#downloadShortBoth');
    if(btn && btn.dataset.busy==='1') return;
    if(btn){ btn.dataset.busy='1'; btn.disabled=true; }
    try{
      await waitHtml2Canvas();
      const host=buildCompareExport(modal);
      await new Promise(r=>setTimeout(r,140));
      const target=host.firstElementChild;
      const canvas=await window.html2canvas(target, {
        backgroundColor:'#eef6ff',
        scale:2,
        useCORS:true,
        allowTaint:true,
        logging:false,
        width:target.scrollWidth,
        height:target.scrollHeight,
        windowWidth:target.scrollWidth,
        windowHeight:target.scrollHeight
      });
      const stamp=new Date();
      const pad=n=>String(n).padStart(2,'0');
      const filename='recibo-comparativo-'+stamp.getFullYear()+pad(stamp.getMonth()+1)+pad(stamp.getDate())+'-'+pad(stamp.getHours())+pad(stamp.getMinutes())+'.png';
      downloadCanvas(canvas, filename);
      host.remove();
      toast('Imagen comparativa descargada.');
    }catch(err){
      console.error(err);
      toast('No se pudo descargar la imagen comparativa.');
    }finally{
      if(btn){ btn.dataset.busy='0'; btn.disabled=false; }
    }
  }

  function enhanceShortReceiptModal(modal){
    if(!modal || modal.dataset.sdc230ShortReady==='1') return;
    const body=modal.querySelector('.short-receipt-screen-v147');
    const actions=modal.querySelector('.short-receipt-actions');
    if(!body || !actions) return;
    modal.dataset.sdc230ShortReady='1';

    if(!actions.querySelector('#downloadShortBoth')){
      const both=document.createElement('button');
      both.type='button';
      both.id='downloadShortBoth';
      both.className='btn sdc230-short-both';
      both.textContent='Descargar ambos';
      actions.appendChild(both);
      both.addEventListener('click', function(){ exportBoth(modal); });
    }
  }

  function refresh(){
    document.querySelectorAll('#modalRoot .modal').forEach(modal=>{
      const title=modal.querySelector('.modal-head h3');
      if(title && /factura corta comercial/i.test(title.textContent||'')){
        enhanceShortReceiptModal(modal);
      }
    });
  }

  function boot(){
    refresh();
    const obs=new MutationObserver(()=>refresh());
    obs.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('click',()=>setTimeout(refresh,80),true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
