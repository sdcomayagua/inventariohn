/* SDC v297 - Apartado Publicar dentro del detalle de producto */
(function(){
  'use strict';
  const PHONE='3151-7755';
  const L=n=>`Lps. ${Math.round(Number(n||0)).toLocaleString('es-HN')}`;
  const clean=s=>String(s||'').trim();
  const tags=v=>clean(v).split(/[,;|/]+/).map(x=>clean(x)).filter(Boolean);
  const firstCat=p=>tags(p.categories||p.category||p.categoria||p.etiquetas||'General')[0]||'General';
  const productName=p=>clean(p.name||p.nombre||'Producto disponible');
  const productCode=p=>clean(p.id||p.codigo||'SDC');
  const productPrice=p=>Number(p.price||p.precio||p.precio_venta||0)||0;
  const productImg=p=>clean(p.image||p.imagen||p.foto||'');
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
  const autoDesc=p=>clean(p.description||p.descripcion)||`${productName(p)} disponible en SD Comayagua. Producto ideal para uso diario, venta local y entrega según zona. Precio y disponibilidad sujetos a confirmación.`;
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
    let p=products.find(x=>clean(x.id||x.codigo).toLowerCase()===id.toLowerCase());
    if(!p && title) p=products.find(x=>clean(x.name||x.nombre).toLowerCase()===title.toLowerCase());
    if(!p && (id||title)){
      const priceText=clean(modal.querySelector('.v141-price-box b')?.textContent || '').replace(/[^0-9.]/g,'');
      p={id:id||'',name:title||'Producto',categories:clean(modal.querySelector('.v141-meta-grid article:nth-child(2) b')?.textContent||'General'),price:Number(priceText||0),stock:Number(clean(modal.querySelector('.v141-meta-grid article:first-child b')?.textContent||'0').replace(/[^0-9.]/g,''))||0,description:'',image:clean(modal.querySelector('.v49-detail-image img,.v141-detail-image img')?.src||'')};
    }
    return p||null;
  }
  function whatsappBusinessText(p){
    const colors=colorText(p);
    const desc=autoDesc(p);
    const st=stock(p);
    return `🛍️ *${productName(p)}*\n\n💵 *Precio:* ${L(productPrice(p))}\n🏷️ *Categoría:* ${firstCat(p)}\n🔢 *Código:* ${productCode(p)}\n📦 *Disponible:* ${st} unidad${st===1?'':'es'}${colors?`\n🎨 *Colores:* ${colors}`:''}\n\n📝 *Descripción:*\n${desc}\n\n📍 Somos *SD Comayagua*\n🚚 Envíos a domicilio según zona\n💳 Depósito / Tigo Money o pagar al recibir donde aplique\n📲 WhatsApp: +504 ${PHONE}`;
  }
  function marketplaceText(p){
    const colors=colorText(p);
    const desc=autoDesc(p);
    const st=stock(p);
    return `Título: ${productName(p)}\n\nPrecio: ${L(productPrice(p))}\nCategoría: ${firstCat(p)}\nCondición: Nuevo\nCódigo: ${productCode(p)}\nDisponibilidad: ${st} unidad${st===1?'':'es'}${colors?`\nColores disponibles: ${colors}`:''}\n\nDescripción:\n${desc}\n\nUbicación: Comayagua, Honduras\nEntrega: Envíos a domicilio con costo según zona. También coordinamos entrega local.\nForma de pago: Depósito / Tigo Money o pagar al recibir donde aplique.\n\nVendedor: SD Comayagua\nWhatsApp: +504 ${PHONE}`;
  }
  function statusText(p){
    const st=stock(p);
    const colors=colorText(p);
    return `🔥 Disponible en SD Comayagua\n\n${productName(p)}\n💵 ${L(productPrice(p))}\n📦 Disponible: ${st} unidad${st===1?'':'es'}${colors?`\n🎨 ${colors}`:''}\n\n📍 Comayagua\n🚚 Envíos según zona\n📲 ${PHONE}`;
  }
  function groupText(p){
    const colors=colorText(p);
    return `Buenas 👋\n\nTengo disponible:\n🛍️ ${productName(p)}\n💵 Precio: ${L(productPrice(p))}\n📦 Stock: ${stock(p)} unidad${stock(p)===1?'':'es'}${colors?`\n🎨 Colores: ${colors}`:''}\n🔢 Código: ${productCode(p)}\n\n${autoDesc(p)}\n\nSomos SD Comayagua. Entregas a domicilio con costo según zona.\nWhatsApp: +504 ${PHONE}`;
  }
  function shortDescText(p){
    const colors=colorText(p);
    return `${productName(p)} - ${L(productPrice(p))}\n${autoDesc(p)}\nCódigo: ${productCode(p)}${colors?`\nColores: ${colors}`:''}\nSD Comayagua · WhatsApp +504 ${PHONE}`;
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
    setTimeout(()=>el.remove(),1900);
  }
  function downloadImage(){
    const btn=document.querySelector('#modalRoot #v49DownloadProductPhoto');
    if(btn){ btn.click(); showToast('Generando imagen del producto...'); return; }
    const p=currentDetailProduct();
    const img=productImg(p||{});
    if(!img) return showToast('Este producto no tiene imagen');
    const a=document.createElement('a');
    a.href=img;
    a.download=`producto-${productCode(p)}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    showToast('Imagen descargada');
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
        desc.textContent='Consulta por WhatsApp para confirmar disponibilidad, colores y entrega según tu zona.';
        box.appendChild(desc);
      }
    });
  }
  function addButton(parent,cls,label,sub,handler){
    const b=document.createElement('button');
    b.type='button'; b.className=cls;
    b.innerHTML=`<b>${label}</b><span>${sub}</span>`;
    b.addEventListener('click',()=>{const p=currentDetailProduct(); if(!p && cls!=='sdc-v297-copy-img') return showToast('No encontré el producto'); handler(p);});
    parent.appendChild(b);
  }
  function enhanceDetail(){
    const modal=document.querySelector('#modalRoot .v49-product-detail, #modalRoot .v141-product-detail, #modalRoot .v163-product-detail');
    if(!modal || modal.querySelector('.sdc-v297-copy-panel')) return;
    const host=modal.querySelector('[data-panel="cliente"]') || modal.querySelector('.v141-detail-shell') || modal;
    const panel=document.createElement('section');
    panel.className='sdc-v297-copy-panel';
    panel.innerHTML=`<div class="sdc-v297-copy-head"><div><b>Publicar producto</b><span>Textos listos para copiar en WhatsApp Business, estados, grupos y Facebook Marketplace.</span></div><i>↗</i></div><div class="sdc-v297-copy-actions"></div>`;
    host.appendChild(panel);
    const actions=panel.querySelector('.sdc-v297-copy-actions');
    addButton(actions,'sdc-v297-copy-wa','WhatsApp Business','Ficha completa',p=>copyText(whatsappBusinessText(p),'WhatsApp Business'));
    addButton(actions,'sdc-v297-copy-mp','Marketplace','Formato Facebook',p=>copyText(marketplaceText(p),'Marketplace'));
    addButton(actions,'sdc-v297-copy-status','Estado WhatsApp','Texto corto',p=>copyText(statusText(p),'Estado'));
    addButton(actions,'sdc-v297-copy-group','Grupo de ventas','Publicación rápida',p=>copyText(groupText(p),'Grupo de ventas'));
    addButton(actions,'sdc-v297-copy-short','Descripción corta','Nombre + precio',p=>copyText(shortDescText(p),'Descripción corta'));
    addButton(actions,'sdc-v297-copy-img','Descargar imagen','PNG del producto',()=>downloadImage());
  }
  function run(){enhanceCategoryShare(); enhanceDetail();}
  const obs=new MutationObserver(run);
  obs.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(run,80),true);
  document.addEventListener('DOMContentLoaded',run);
  setInterval(run,900);
})();
