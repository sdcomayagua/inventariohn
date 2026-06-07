/* SDC v297 - Botones para copiar producto a WhatsApp y Facebook Marketplace */
(function(){
  'use strict';
  const PHONE='3151-7755';
  const L=n=>`Lps. ${Math.round(Number(n||0)).toLocaleString('es-HN')}`;
  const clean=s=>String(s||'').trim();
  const esc=s=>String(s||'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
  const tags=v=>clean(v).split(/[,;|/]+/).map(x=>clean(x)).filter(Boolean);
  const firstCat=p=>tags(p.categories||p.category||p.categoria||p.etiquetas||'General')[0]||'General';
  const stock=p=>{
    const rows=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);
    if(rows.length) return rows.reduce((a,r)=>a+(Number(r.qty||r.cantidad||r.stock||0)||0),0);
    return Math.max(0,Number(p.stock||p.existencia||0)||0);
  };
  const colorText=p=>{
    const rows=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);
    const out=rows.map(r=>({name:clean(r.name||r.color||r.nombre||r.label),qty:Number(r.qty||r.cantidad||r.stock||0)||0})).filter(r=>r.name&&r.qty>0);
    return out.length?out.map(r=>`${r.name} ${r.qty}`).join(' · '):'';
  };
  const autoDesc=p=>clean(p.description||p.descripcion)||`${clean(p.name)||'Producto'} disponible en SD Comayagua. Producto ideal para uso diario, venta local y entrega según zona. Precio y disponibilidad sujetos a confirmación.`;
  function getStateProducts(){
    try{ if(window.SDCStore&&typeof window.SDCStore.load==='function') return (window.SDCStore.load().products||[]); }catch(e){}
    return [];
  }
  function currentDetailProduct(){
    const modal=document.querySelector('#modalRoot .v49-product-detail, #modalRoot .v141-product-detail, #modalRoot .v163-product-detail');
    if(!modal) return null;
    const id=clean(modal.querySelector('.v141-meta-grid article:nth-child(3) b')?.textContent || modal.querySelector('.v49-detail-main small')?.textContent?.split('·').pop() || '');
    const title=clean(modal.querySelector('.v49-detail-main h4, .v141-head-copy h3')?.textContent || '');
    const products=getStateProducts();
    let p=products.find(x=>clean(x.id).toLowerCase()===id.toLowerCase());
    if(!p && title) p=products.find(x=>clean(x.name).toLowerCase()===title.toLowerCase());
    if(!p && (id||title)){
      const priceText=clean(modal.querySelector('.v141-price-box b')?.textContent || '').replace(/[^0-9.]/g,'');
      p={id:id||'',name:title||'Producto',categories:clean(modal.querySelector('.v141-meta-grid article:nth-child(2) b')?.textContent||'General'),price:Number(priceText||0),stock:Number(clean(modal.querySelector('.v141-meta-grid article:first-child b')?.textContent||'0').replace(/[^0-9.]/g,''))||0,description:''};
    }
    return p||null;
  }
  function whatsappText(p){
    const colors=colorText(p);
    const desc=autoDesc(p);
    return `🛍️ *${clean(p.name)}*\n\n💵 *Precio:* ${L(p.price)}\n🏷️ *Categoría:* ${firstCat(p)}\n🔢 *Código:* ${clean(p.id||'SDC')}\n📦 *Disponible:* ${stock(p)} unidad${stock(p)===1?'':'es'}${colors?`\n🎨 *Colores:* ${colors}`:''}\n\n📝 *Descripción:*\n${desc}\n\n📍 Somos *SD Comayagua*\n🚚 Envíos a domicilio según zona\n📲 WhatsApp: +504 ${PHONE}`;
  }
  function marketplaceText(p){
    const colors=colorText(p);
    const desc=autoDesc(p);
    return `Título: ${clean(p.name)}\n\nPrecio: ${L(p.price)}\nCategoría: ${firstCat(p)}\nCondición: Nuevo\nCódigo: ${clean(p.id||'SDC')}\nDisponibilidad: ${stock(p)} unidad${stock(p)===1?'':'es'}${colors?`\nColores disponibles: ${colors}`:''}\n\nDescripción:\n${desc}\n\nUbicación: Comayagua, Honduras\nEntrega: Envíos a domicilio con costo según zona. También coordinamos entrega local.\nForma de pago: Depósito / Tigo Money o pagar al recibir donde aplique.\n\nVendedor: SD Comayagua\nWhatsApp: +504 ${PHONE}`;
  }
  async function copyText(text,label){
    try{
      await navigator.clipboard.writeText(text);
      showToast(`${label} copiado ✅`);
    }catch(e){
      const ta=document.createElement('textarea');
      ta.value=text; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select();
      try{document.execCommand('copy');showToast(`${label} copiado ✅`);}catch(err){prompt('Copia este texto:',text);}
      ta.remove();
    }
  }
  function showToast(msg){
    const old=document.querySelector('.sdc-v297-mini-toast'); if(old) old.remove();
    const el=document.createElement('div'); el.className='sdc-v297-mini-toast'; el.textContent=msg; document.body.appendChild(el);
    setTimeout(()=>el.remove(),1800);
  }
  function enhanceCategoryShare(){
    document.querySelectorAll('.categoryShareClean-v199').forEach(card=>{
      if(card.dataset.v297ShareClean==='1') return;
      card.dataset.v297ShareClean='1';
      const summary=card.querySelector('.categoryShareSummary-v199'); if(summary) summary.remove();
      const p=card.querySelector('.categoryShareBrand-v199 p');
      if(p) p.textContent='Catálogo visual para cliente · productos seleccionados de SD Comayagua.';
      const box=card.querySelector('.categoryShareBrand-v199 > div');
      if(box && !box.querySelector('.sdc-v297-share-desc')){
        const desc=document.createElement('p');
        desc.className='sdc-v297-share-desc';
        desc.textContent='Toca o consulta por WhatsApp para confirmar disponibilidad, colores y entrega según tu zona.';
        box.appendChild(desc);
      }
    });
  }
  function enhanceDetail(){
    const modal=document.querySelector('#modalRoot .v49-product-detail, #modalRoot .v141-product-detail, #modalRoot .v163-product-detail');
    if(!modal || modal.querySelector('.sdc-v297-copy-panel')) return;
    const host=modal.querySelector('[data-panel="cliente"]') || modal.querySelector('.v141-detail-shell') || modal;
    const panel=document.createElement('section');
    panel.className='sdc-v297-copy-panel';
    panel.innerHTML=`<div class="sdc-v297-copy-head"><div><b>Copiar información para publicar</b><span>Usa estos botones para pegar rápido en WhatsApp Business o Facebook Marketplace.</span></div><i>↗</i></div><div class="sdc-v297-copy-actions"><button type="button" class="sdc-v297-copy-wa">Copiar para WhatsApp</button><button type="button" class="sdc-v297-copy-mp">Copiar para Marketplace</button></div>`;
    host.appendChild(panel);
    panel.querySelector('.sdc-v297-copy-wa').addEventListener('click',()=>{const p=currentDetailProduct(); if(p) copyText(whatsappText(p),'WhatsApp'); else showToast('No encontré el producto');});
    panel.querySelector('.sdc-v297-copy-mp').addEventListener('click',()=>{const p=currentDetailProduct(); if(p) copyText(marketplaceText(p),'Marketplace'); else showToast('No encontré el producto');});
  }
  function run(){enhanceCategoryShare(); enhanceDetail();}
  const obs=new MutationObserver(run);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(run,80),true);
  document.addEventListener('DOMContentLoaded',run);
  setInterval(run,900);
})();
