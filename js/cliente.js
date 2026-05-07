(function(){
  const $=(s,r=document)=>r.querySelector(s);
  let products=[];
  const fallback=`data:image/svg+xml;charset=UTF-8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900"><rect width="900" height="900" rx="80" fill="#071522"/><text x="450" y="430" font-family="Arial Black" font-size="110" text-anchor="middle" fill="#18e7ff">SD</text><text x="450" y="510" font-family="Arial" font-size="36" text-anchor="middle" fill="#d9e8f5">COMAYAGUA</text></svg>')}`;
  function money(n){return 'Lps. '+Math.round(Number(n)||0).toLocaleString('es-HN')}
  function esc(s){return String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]))}
  function img(p){return p.imagen&&/^https?:\/\//i.test(p.imagen)?p.imagen:fallback}
  function render(){
    const q=($('#clientSearch').value||'').toLowerCase().trim();
    const list=products.filter(p=>[p.nombre,p.categoria,p.descripcion].join(' ').toLowerCase().includes(q));
    $('#clientProducts').innerHTML=list.map(p=>`<article class="product-card"><img class="product-img" src="${esc(img(p))}" onerror="this.src='${fallback}'"><h3>${esc(p.nombre)}</h3><p>${esc(p.descripcion||'Producto disponible. Consultá por WhatsApp para confirmar detalles.')}</p><div class="product-meta"><div><span>Precio</span><b>${money(p.precio)}</b></div><div><span>Stock</span><b>${Number(p.stock)||0}</b></div></div><a class="primary-btn" style="width:100%" href="https://wa.me/${window.SDC_CONFIG.whatsapp}?text=${encodeURIComponent('Hola, quiero información de: '+p.nombre)}" target="_blank">Consultar por WhatsApp</a></article>`).join('')||'<div class="form-card">No hay productos disponibles.</div>';
  }
  function jsonp(){
    const url=new URL(window.SDC_CONFIG.defaultAppsScriptUrl); const cb='SDC_PUBLIC_'+Date.now();
    url.searchParams.set('action','public'); url.searchParams.set('callback',cb);
    const script=document.createElement('script');
    window[cb]=(data)=>{ products=(data&&data.products)||[]; $('#clientStatus').textContent=products.length?'Catálogo cargado.':'No hay productos activos en nube.'; render(); delete window[cb]; script.remove(); };
    script.onerror=()=>{ $('#clientStatus').textContent='No se pudo cargar la nube. Revisá Apps Script.'; };
    script.src=url.toString(); document.body.appendChild(script);
  }
  document.addEventListener('DOMContentLoaded',()=>{ $('#clientSearch').addEventListener('input',render); jsonp(); });
})();
