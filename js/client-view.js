(function(){
  const STORE_KEY='sdc_control_ventas_v90';
  const $=(s,r=document)=>r.querySelector(s);
  function safeJSON(raw,fallback){try{return JSON.parse(raw)}catch(e){return fallback}}
  function state(){return safeJSON(localStorage.getItem(STORE_KEY), {}) || {};}
  function money(n){return 'Lps. '+Number(n||0).toLocaleString('es-HN',{maximumFractionDigits:0});}
  function clean(v){return String(v||'').trim();}
  function imgs(p){return [p.image,p.imagen,clean(p.gallery).split(/\n|,|\|/)[0]].map(clean).find(x=>x.length>5) || 'assets/placeholders/no-image.svg';}
  function whats(){return ((window.SDC_CONFIG && window.SDC_CONFIG.whatsapp) || '+504 3151-7755').replace(/\D/g,'');}
  function render(){
    const s=state(); const q=clean($('#clientSearch').value).toLowerCase();
    const products=(Array.isArray(s.products)?s.products:[]).filter(p=>Number(p.stock)>0).filter(p=>!q || [p.name,p.nombre,p.categories,p.description].join(' ').toLowerCase().includes(q));
    $('#clientWhatsApp').href='https://wa.me/'+whats()+'?text='+encodeURIComponent('Hola SD COMAYAGUA, quiero consultar productos disponibles.');
    $('#clientGrid').innerHTML=products.length?products.map(p=>{
      const name=clean(p.name||p.nombre||'Producto disponible');
      const desc=clean(p.description||p.descripcion||'Producto disponible para entrega. Consulta disponibilidad antes de confirmar tu pedido.');
      const msg=`Hola SD COMAYAGUA, quiero información de: ${name}. Precio visto: ${money(p.price)}.`;
      return `<article class="client-card"><div class="client-img"><img src="${imgs(p).replace(/"/g,'&quot;')}" alt="${name.replace(/"/g,'&quot;')}" onerror="this.onerror=null;this.src='assets/placeholders/no-image.svg'"><b class="client-price">${money(p.price)}</b></div><h2>${name}</h2><p class="client-desc">${desc}</p><div class="client-meta"><span>Disponible: ${Number(p.stock||0).toLocaleString('es-HN')}</span><span>${clean(p.categories||'General')}</span></div><a target="_blank" rel="noopener" href="https://wa.me/${whats()}?text=${encodeURIComponent(msg)}">Consultar por WhatsApp</a></article>`;
    }).join(''):'<div class="empty">No hay productos visibles todavía. Abrí primero el panel privado y sincronizá el inventario.</div>';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{render();$('#clientSearch').addEventListener('input',render)});else{render();$('#clientSearch').addEventListener('input',render)}
})();
