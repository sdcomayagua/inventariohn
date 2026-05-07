(function(){
  const STORE_KEY = (window.SDCStore && window.SDCStore.KEY) || 'sdc_control_ventas_v90';
  const DEFAULT_URL = (window.SDC_CONFIG && window.SDC_CONFIG.syncUrl) || 'https://script.google.com/macros/s/AKfycbxRhSkmnCOPEM-EHeOwYoAkDuGhzCbBRkxWOnpMPWLsKdoEgRenh5WjHTPS4yLUYaUr/exec';
  const $ = (s,r=document)=>r.querySelector(s);
  function safeJSON(raw,fallback){try{return JSON.parse(raw)}catch(e){return fallback}}
  function saveState(s){localStorage.setItem(STORE_KEY, JSON.stringify(s));}
  function state(){return safeJSON(localStorage.getItem(STORE_KEY), {}) || {};}
  function cleanUrl(v){return String(v||'').trim().replace(/\?$/,'');}
  function lastDate(v){if(!v)return 'Pendiente'; try{return new Date(v).toLocaleString('es-HN',{day:'2-digit',month:'short',hour:'numeric',minute:'2-digit'});}catch(e){return 'Pendiente';}}
  function counts(s){return {products:(s.products||[]).length,sales:(s.sales||[]).length,quotes:(s.quotes||[]).length,clients:(s.clients||[]).length};}
  function ensureShell(){
    if($('.sdc-private-tools')) return;
    const tools=document.createElement('div');
    tools.className='sdc-private-tools no-print';
    tools.setAttribute('data-private','1');
    tools.innerHTML='<button type="button" id="sdcPrivateBtn" aria-label="Configuración privada">⚙</button>';
    const modal=document.createElement('div');
    modal.className='sdc-private-modal no-print';
    modal.setAttribute('data-private','1');
    modal.innerHTML='<div class="sdc-private-card"><div class="sdc-private-head"><b>Configuración privada</b><button type="button" id="sdcPrivateClose">×</button></div><div class="sdc-private-body" id="sdcPrivateBody"></div></div>';
    document.body.appendChild(tools); document.body.appendChild(modal);
    $('#sdcPrivateBtn').addEventListener('click',openPanel);
    $('#sdcPrivateClose').addEventListener('click',()=>modal.classList.remove('open'));
    modal.addEventListener('click',e=>{if(e.target===modal) modal.classList.remove('open');});
  }
  function setMsg(text,type='info'){
    const el=$('#sdcPrivateMsg'); if(!el)return;
    el.textContent=text; el.dataset.type=type;
  }
  function renderPanel(){
    const s=state(); s.settings=s.settings||{};
    const c=counts(s); const url=cleanUrl(s.settings.syncUrl || DEFAULT_URL);
    const cloud = url ? (String(s.settings.syncPin||'').trim() ? 'Lista' : 'Falta PIN') : 'Sin URL';
    $('#sdcPrivateBody').innerHTML=`
      <div class="sdc-private-status">
        <div><span>Nube</span><b>${cloud}</b></div>
        <div><span>Última sinc.</span><b>${lastDate(s.settings.lastCloudSyncAt)}</b></div>
        <div><span>Inventario</span><b>${c.products} productos</b></div>
        <div><span>Documentos</span><b>${c.sales} ventas · ${c.quotes} cotizaciones</b></div>
      </div>
      <label><span>URL de Apps Script</span><input id="sdcPrivateUrl" value="${url.replace(/"/g,'&quot;')}" placeholder="https://script.google.com/macros/s/.../exec"></label>
      <label><span>PIN de nube</span><input id="sdcPrivatePin" type="password" inputmode="numeric" value="${String(s.settings.syncPin||'').replace(/"/g,'&quot;')}" placeholder="PIN configurado en Apps Script"></label>
      <div class="sdc-private-message" id="sdcPrivateMsg">Este panel es privado del administrador. No aparece en capturas limpias, fotos de producto ni recibos para clientes.</div>
      <div class="sdc-private-actions">
        <button type="button" id="sdcSavePrivate">Guardar datos</button>
        <button type="button" id="sdcPingPrivate" class="ghost">Probar conexión</button>
        <button type="button" id="sdcDownloadPrivate">Descargar respaldo</button>
        <button type="button" id="sdcClearCache" class="ghost">Limpiar caché</button>
      </div>
      <button type="button" id="sdcOpenClient" class="wide-btn ghost">Abrir vista cliente limpia</button>
      <p class="sdc-private-message">Uso recomendado: guardá URL/PIN una vez, probá conexión, luego usá Sincronizar o Respaldo desde la página. La URL ya viene precargada para ahorrar tiempo.</p>
    `;
    bindPanel();
  }
  function openPanel(){ensureShell(); renderPanel(); $('.sdc-private-modal').classList.add('open');}
  function bindPanel(){
    $('#sdcSavePrivate').onclick=()=>{
      const s=state(); s.settings=s.settings||{};
      s.settings.syncUrl=cleanUrl($('#sdcPrivateUrl').value) || DEFAULT_URL;
      s.settings.syncPin=$('#sdcPrivatePin').value.trim();
      s.settings.syncAuto=true;
      s.settings.lastCloudStatus='Configuración guardada desde panel privado';
      saveState(s); setMsg('Guardado correctamente. Si la página no actualiza el estado, cerrá este panel y tocá Sincronizar.', 'ok');
      try{window.dispatchEvent(new Event('storage'));}catch(e){}
    };
    $('#sdcPingPrivate').onclick=async()=>{
      const url=cleanUrl($('#sdcPrivateUrl').value); const pin=encodeURIComponent($('#sdcPrivatePin').value.trim());
      if(!url || !pin){setMsg('Falta URL o PIN para probar conexión.','warn');return;}
      setMsg('Probando conexión con Apps Script...');
      try{
        const sep=url.includes('?')?'&':'?';
        const res=await fetch(`${url}${sep}action=ping&pin=${pin}&t=${Date.now()}`,{cache:'no-store'});
        const data=await res.json();
        if(!res.ok || data.ok===false) throw new Error(data.error || 'No respondió correctamente.');
        const s=state(); s.settings=s.settings||{}; s.settings.syncUrl=url; s.settings.syncPin=decodeURIComponent(pin); s.settings.lastCloudStatus='Conectado'; s.settings.lastCloudSyncAt=data.updatedAt || new Date().toISOString(); saveState(s);
        setMsg('Conexión correcta. La nube quedó guardada en este dispositivo.','ok');
      }catch(err){setMsg('No conectó: '+(err.message||err)+'. Revisá implementación Web App, permisos y PIN.','err');}
    };
    $('#sdcDownloadPrivate').onclick=()=>{
      const blob=new Blob([JSON.stringify(state(),null,2)],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='respaldo-sd-comayagua-completo.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); setMsg('Respaldo descargado en JSON.','ok');
    };
    $('#sdcClearCache').onclick=async()=>{
      setMsg('Limpiando caché de la app...');
      try{
        if('caches' in window){const keys=await caches.keys(); await Promise.all(keys.filter(k=>k.indexOf('sdc')>=0).map(k=>caches.delete(k)));}
        if(navigator.serviceWorker){const regs=await navigator.serviceWorker.getRegistrations(); await Promise.all(regs.map(r=>r.update().catch(()=>null)));}
        setMsg('Caché limpiado. Actualizá la página para ver los cambios nuevos.','ok');
      }catch(err){setMsg('No se pudo limpiar caché: '+(err.message||err),'err');}
    };
    $('#sdcOpenClient').onclick=()=>{window.open('cliente.html','_blank');};
  }
  function ready(){ensureShell();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready); else ready();
})();
