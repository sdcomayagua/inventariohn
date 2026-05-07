(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=()=>{try{return new Date().toLocaleTimeString('es-HN',{hour:'numeric',minute:'2-digit'})}catch(e){return ''}};
  let busy=false;
  function cloudText(){
    const t=($('.top-title p')?.textContent||'').toLowerCase();
    if(t.includes('nube activa')) return ['Nube','Activa','ok'];
    if(t.includes('url guardada')) return ['Nube','URL guardada','warn'];
    return ['Nube','Local','warn'];
  }
  function insertCommand(){
    const top=$('.quality-strip') || $('.topbar');
    if(!top || $('.command-panel')) return;
    const [cLabel,cValue,cClass]=cloudText();
    const strip=document.createElement('section');
    strip.className='command-panel no-print';
    strip.innerHTML=`
      <div class="command-panel-head"><b>Centro de control SD</b><span>Presencia Máxima</span></div>
      <div class="command-panel-grid">
        <div class="command-panel-item ${cClass}"><small>${esc(cLabel)}</small><strong>${esc(cValue)}</strong></div>
        <div class="command-panel-item ok"><small>Modo</small><strong>Privado</strong></div>
        <div class="command-panel-item"><small>Cliente</small><strong>Ficha limpia</strong></div>
        <div class="command-panel-item"><small>Revisión</small><strong>${esc(time())}</strong></div>
      </div>`;
    top.insertAdjacentElement('afterend',strip);
  }
  function updateLabels(){
    document.title='SD COMAYAGUA · Centro de Mando Privado';
    const versionBox=$$('.quality-strip div').find(d=>(d.textContent||'').toLowerCase().includes('versión'));
    if(versionBox){const b=versionBox.querySelector('b'); if(b)b.textContent='Presencia Máxima';}
    $$('.top-title p').forEach(p=>{p.innerHTML=p.innerHTML.replace(/\s·\sV3\d/g,'').replace(/V3\d/g,'')});
    const cmd=$('.command-panel');
    if(cmd){
      const [label,value,cls]=cloudText();
      const first=$('.command-panel-item',cmd);
      if(first){first.className='command-panel-item '+cls; first.innerHTML=`<small>${esc(label)}</small><strong>${esc(value)}</strong>`;}
      const items=$$('.command-panel-item',cmd); const last=items[3]; if(last){last.innerHTML=`<small>Revisión</small><strong>${esc(time())}</strong>`;}
    }
  }
  function enhanceModal(){
    const modal=$('.modal'); if(!modal) return;
    const cloud=$('.cloud-setup',modal);
    if(cloud && !$('.cloud-help-note',modal)){
      const note=document.createElement('div');
      note.className='cloud-help-note no-print';
      note.innerHTML='<b>Guía rápida:</b><span>1) Guardar y probar conexión. 2) Sincronizar ahora. 3) Respaldar todo. Los avisos aparecen aquí mismo y no se muestran al cliente.</span>';
      cloud.insertAdjacentElement('afterbegin',note);
    }
    const share=$('#productShareCard',modal);
    if(share && !$('.client-safe-note',share)){
      const safe=document.createElement('div');
      safe.className='client-safe-note no-print';
      safe.textContent='Vista previa privada: la imagen del cliente no incluye costos internos ni ganancias.';
      share.insertAdjacentElement('beforebegin',safe);
    }
    const doc=$('#printableDoc',modal);
    if(doc && !$('.doc-watermark',doc)){
      const water=document.createElement('div');
      water.className='doc-watermark';
      water.textContent='SD COMAYAGUA';
      doc.appendChild(water);
    }
  }
  function enhance(){
    document.body.classList.add('sdc-ready-presence');
    insertCommand();
    updateLabels();
    enhanceModal();
  }
  document.addEventListener('click',e=>{
    const btn=e.target.closest('button'); if(!btn) return;
    const text=(btn.textContent||'').toLowerCase();
    if(/guardar|sincronizar|respaldo|backup|nube|vender|cotizar|imagen|foto|whatsapp/.test(text)){
      btn.classList.add('sdc-touch');
      clearTimeout(btn._v37); btn._v37=setTimeout(()=>btn.classList.remove('sdc-touch'),260);
    }
    if(/guardar y probar conexión|sincronizar ahora|respaldar todo ahora/.test(text) && !busy){
      busy=true; setTimeout(()=>{busy=false; enhance();},1200);
    }
  },true);
  window.addEventListener('online',()=>setTimeout(enhance,60));
  window.addEventListener('offline',()=>setTimeout(enhance,60));
  const mo=new MutationObserver(()=>enhance());
  mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',enhance); else enhance();
})();
