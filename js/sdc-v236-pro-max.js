document.documentElement.dataset.sdcV236='1';
window.__sdcV296StructureFix=true;
window.addEventListener('click',e=>{if(e.target.closest('[data-catcapture-v199]'))setTimeout(()=>document.querySelector('[data-action="categoriesSheet"]')?.click(),900)},true);

(function(){
  if(window.__sdcV301CopyButtons) return;
  window.__sdcV301CopyButtons=true;

  function clean(s){return String(s||'').replace(/\s+/g,' ').trim();}
  function money(s){const m=clean(s).match(/Lps\.?\s*\d+(?:[.,]\d+)?/i);return m?m[0].replace('Lps','Lps.'):'';}
  function codeFrom(root){
    const t=clean(root.textContent);
    const parts=t.match(/[A-Z]{2,}[A-Z0-9-]{2,}|SDC-\d+/g)||[];
    return parts.find(x=>/^SDC-/.test(x))||parts[parts.length-1]||'';
  }
  function productData(root){
    const title=clean(root.querySelector('h1,h2,h3,.modal-title')?.textContent)||'Producto SD Comayagua';
    const text=clean(root.textContent);
    const price=money(text)||'Consultar precio';
    const code=codeFrom(root)||'Consultar código';
    const cat=(text.match(/Dedales|Audio|Controles|Coolers|Accesorios|Adaptador MicroSD|Cables/i)||['Producto'])[0];
    const colors=[];
    root.querySelectorAll('button,span,em,b,strong,small').forEach(el=>{
      const v=clean(el.textContent);
      if(/^(Azul|Rojo|Negro|General|Gris|Blanco|Verde|Rosado|Dorado)\b/i.test(v) && v.length<30) colors.push(v);
    });
    const unique=[...new Set(colors)].slice(0,6).join(', ');
    return {title,price,code,cat,colors:unique};
  }
  function waText(d){
    return `✨ *${d.title}*\n\n💵 Precio: *${d.price}*\n🏷️ Categoría: ${d.cat}\n🔖 Código: ${d.code}${d.colors?`\n🎨 Disponible: ${d.colors}`:''}\n\n✅ Producto disponible en SD Comayagua.\n📲 WhatsApp: +504 3151-7755`;
  }
  function mpText(d){
    return `Título: ${d.title}\n\nPrecio: ${d.price}\nCondición: Nuevo\nCategoría: ${d.cat}\nUbicación: Comayagua, Honduras\nCódigo: ${d.code}${d.colors?`\nColores/disponibilidad: ${d.colors}`:''}\n\nDescripción:\nProducto disponible en SD Comayagua. Consulte disponibilidad antes de cerrar compra. Envíos a domicilio según zona. Pago por depósito/Tigo Money o pagar al recibir donde aplique.\n\nContacto: +504 3151-7755`;
  }
  async function copy(txt,msg){
    try{await navigator.clipboard.writeText(txt);toast(msg);}catch(e){prompt('Copie el texto:',txt);}
  }
  function toast(msg){
    const old=document.querySelector('.sdc-v297-mini-toast');if(old)old.remove();
    const el=document.createElement('div');el.className='sdc-v297-mini-toast';el.textContent=msg;document.body.appendChild(el);
    setTimeout(()=>el.remove(),2200);
  }
  function findDetail(){
    const root=document.querySelector('#modalRoot');
    if(!root) return null;
    const modal=root.querySelector('.product-detail-modal-v221,.modal');
    if(!modal) return null;
    const t=clean(modal.textContent);
    if(!/Añadir venta|Añadir cotización|WhatsApp|Colores|Cantidad/i.test(t)) return null;
    return modal;
  }
  function addPanel(){
    const modal=findDetail();
    if(!modal||modal.querySelector('.sdc-v297-copy-panel')) return;
    const actions=modal.querySelector('.v163-detail-actions,.modal-actions,.product-actions-v235')||modal.querySelector('.modal-body');
    if(!actions) return;
    const panel=document.createElement('section');
    panel.className='sdc-v297-copy-panel';
    panel.innerHTML='<div class="sdc-v297-copy-head"><div><b>Copiar publicación</b><span>Texto listo para WhatsApp o Facebook Marketplace.</span></div><i>📋</i></div><div class="sdc-v297-copy-actions"><button class="sdc-v297-copy-wa" type="button">Copiar WhatsApp</button><button class="sdc-v297-copy-mp" type="button">Copiar Facebook Marketplace</button></div>';
    panel.querySelector('.sdc-v297-copy-wa').addEventListener('click',()=>copy(waText(productData(modal)),'Texto para WhatsApp copiado'));
    panel.querySelector('.sdc-v297-copy-mp').addEventListener('click',()=>copy(mpText(productData(modal)),'Texto para Marketplace copiado'));
    actions.insertAdjacentElement('afterend',panel);
  }
  new MutationObserver(()=>setTimeout(addPanel,80)).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(addPanel,140),true);
  window.addEventListener('load',addPanel);
  setInterval(addPanel,1200);
})();
