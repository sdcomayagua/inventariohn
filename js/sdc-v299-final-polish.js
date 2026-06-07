/* SDC v299 - pulido final Salman */
(function(){
  'use strict';
  const clean=v=>String(v||'').trim();
  const money=n=>'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');
  const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const list=()=>{try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return[]}};
  const tags=v=>clean(v).split(/[,;|/]+/).map(clean).filter(Boolean);
  const cat=p=>tags(p.categories||p.category||p.categoria||p.etiquetas||'General')[0]||'General';
  const name=p=>clean(p.name||p.nombre||'Producto');
  const price=p=>Number(p.price||p.precio||0)||0;
  const img=p=>clean(p.image||p.imagen||p.foto||String(p.gallery||'').split(/\n|\||;/)[0]||'');
  const desc=p=>clean(p.description||p.descripcion)||name(p)+' disponible en SD Comayagua. Producto nuevo, listo para entrega según zona. Precio y disponibilidad sujetos a confirmación.';
  function stock(p){const r=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);return r.length?r.reduce((a,x)=>a+(Number(x.qty||x.cantidad||x.stock||0)||0),0):Math.max(0,Number(p.stock||p.existencia||0)||0)}
  function colors(p){const r=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);return r.map(x=>({n:clean(x.name||x.color||x.nombre),q:Number(x.qty||x.cantidad||x.stock||0)||0})).filter(x=>x.n&&x.q>0).map(x=>x.n+' '+x.q).join(' · ')}
  function code(p){
    const n=norm(name(p)); let b='';
    if(/DEDAL/.test(n)&&/(V1|VERSION 1|VERSIÓN 1)/.test(n)) b='DGV1';
    else if(/DEDAL/.test(n)&&/(V2|VERSION 2|VERSIÓN 2)/.test(n)) b='DGV2';
    else{const skip=['DE','DEL','LA','EL','LOS','LAS','PARA','CON','Y','EN','POR','UN','UNA'];const w=(n.match(/[A-Z0-9]+/g)||[]).filter(x=>!skip.includes(x));b=w.map(x=>/^V?\d+$/.test(x)?(x[0]==='V'?x:'V'+x):(/[0-9]/.test(x)&&x.length<6?x:x[0])).join('').slice(0,7)||'PROD'}
    return 'SDC-'+b+'-'+Math.round(price(p));
  }
  function currentProduct(){
    const root=document.querySelector('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail');
    if(!root)return null;
    const title=clean((root.querySelector('.v49-detail-main h4,.v141-head-copy h3,.v163-detail-main h4,h3,h4')||{}).textContent||'');
    const raw=clean((root.querySelector('.v49-detail-main small,.v141-meta-grid article:nth-child(3) b,.v163-detail-main small')||{}).textContent||'').split('·').pop();
    return list().find(p=>clean(p.id||p.codigo).toLowerCase()===clean(raw).toLowerCase())||list().find(p=>name(p).toLowerCase()===title.toLowerCase())||null;
  }
  function css(){
    const txt=[
      '#modalRoot .product-detail-modal-v221 .v49-detail-main small,#modalRoot .product-detail-modal-v221 .v163-detail-main small{font-size:13px!important;letter-spacing:.02em!important}',
      '.productPhotoFacts-v163{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important}.productPhotoFacts-v163 span{min-height:70px!important}',
      '.productPhotoClean-v163{height:auto!important;min-height:0!important;padding:18px!important}.productPhotoImageWrap-v163{max-height:430px!important}.productPhotoPrice-v163{margin:2px 0 8px!important}.productPhotoFooter-v163{margin-top:12px!important}',
      '.sdc208-line.has-v299,.shortReceiptExportHost .sdc208-line.has-v299,.sdc230-compare-export .sdc208-line.has-v299{display:grid!important;grid-template-columns:42px 60px minmax(0,1fr)!important;grid-template-areas:"num img info" "num img price"!important;gap:8px 10px!important;align-items:center!important;overflow:hidden!important}',
      '.has-v299 .sdc208-line-index{grid-area:num!important}.has-v299 .sdc299-thumb,.has-v299 .sdc298-receipt-thumb{grid-area:img!important}.has-v299 .sdc208-line-copy{grid-area:info!important;min-width:0!important;text-align:left!important;overflow:hidden!important}.has-v299 strong{grid-area:price!important;grid-column:auto!important;justify-self:end!important;position:static!important;left:auto!important;right:auto!important;transform:none!important;margin:0!important;padding:0!important;max-width:100%!important;white-space:nowrap!important;text-align:right!important;color:#d61c3b!important}',
      '.has-v299 .sdc208-line-copy b{white-space:normal!important;word-break:normal!important;overflow-wrap:normal!important;font-size:16px!important;line-height:1.08!important}.has-v299 .sdc208-line-copy span,.has-v299 .sdc208-line-copy em{white-space:normal!important;font-size:11px!important;line-height:1.15!important}',
      '.sdc299-thumb{width:60px!important;height:60px!important;border-radius:14px!important;object-fit:cover!important;background:#eef6ff!important;border:1px solid #d9e8f8!important}',
      '.sdc230-compare-pill b{color:#d61c3b!important;font-size:26px!important;line-height:1!important;font-weight:950!important}.sdc230-compare-pill b::before{content:"🔥 ";}.sdc230-compare-pill small{color:#52677f!important;font-size:13px!important;line-height:1.25!important;margin-top:8px!important;display:block!important}'
    ].join('\n');
    let st=document.getElementById('sdc-v299-style'); if(!st){st=document.createElement('style');st.id='sdc-v299-style';document.head.appendChild(st)} st.textContent=txt;
  }
  function patchCodes(){
    const p=currentProduct(); if(!p)return; const c=code(p), ca=cat(p);
    const root=document.querySelector('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail'); if(!root)return;
    root.querySelectorAll('.v49-detail-main small,.v163-detail-main small,.v141-head-copy small').forEach(el=>el.textContent=ca+' · '+c);
    root.querySelectorAll('.v141-meta-grid article').forEach(a=>{const s=clean(a.querySelector('span')?.textContent).toLowerCase(); if(s.includes('codigo')||s.includes('código')){const b=a.querySelector('b'); if(b)b.textContent=c}});
  }
  function patchReceipts(){
    const ps=list(); if(!ps.length)return;
    document.querySelectorAll('#modalRoot .sdc208-line,.sdc230-compare-export .sdc208-line').forEach(line=>{
      line.classList.add('has-v299');
      if(line.querySelector('.sdc299-thumb,.sdc298-receipt-thumb'))return;
      const nm=clean(line.querySelector('.sdc208-line-copy b')?.textContent); if(!nm)return;
      const p=ps.find(x=>name(x).toLowerCase()===nm.toLowerCase()); const imsrc=p?img(p):''; if(!imsrc)return;
      const idx=line.querySelector('.sdc208-line-index'); if(!idx)return;
      const im=document.createElement('img'); im.className='sdc299-thumb'; im.src=imsrc; im.alt=nm; im.crossOrigin='anonymous'; im.referrerPolicy='no-referrer'; im.onerror=()=>im.remove(); idx.insertAdjacentElement('afterend',im);
    });
  }
  function copy(t,label){try{navigator.clipboard.writeText(t).then(()=>toast(label+' copiado ✅'))}catch(e){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast(label+' copiado ✅')}}
  function toast(m){let o=document.querySelector('.sdc-v297-mini-toast'); if(o)o.remove(); let e=document.createElement('div');e.className='sdc-v297-mini-toast';e.textContent=m;document.body.appendChild(e);setTimeout(()=>e.remove(),1800)}
  function wa(p){const co=colors(p), st=stock(p);return '🛍️ *'+name(p)+'*\n\n━━━━━━━━━━━━━━━━━━━━\n\n💵 *Precio:* '+money(price(p))+'\n🏷️ *Categoría:* '+cat(p)+'\n🔖 *Código catálogo:* '+code(p)+'\n📦 *Disponible:* '+st+' unidad'+(st===1?'':'es')+(co?'\n🎨 *Colores:* '+co:'')+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n📝 *Descripción:*\n'+desc(p)+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n📍 *SD Comayagua*\n🚚 Entregas a domicilio según zona\n💳 Depósito / Tigo Money o pagar al recibir donde aplique\n📲 WhatsApp: +504 3151-7755'}
  function market(p){const co=colors(p), st=stock(p);return '🛒 *PUBLICACIÓN PARA MARKETPLACE*\n\n━━━━━━━━━━━━━━━━━━━━\n\n📌 *Título:* '+name(p)+'\n💵 *Precio:* '+money(price(p))+'\n🔖 *Código:* '+code(p)+'\n🏷️ *Categoría:* '+cat(p)+'\n✅ *Condición:* Nuevo\n📦 *Disponibilidad:* '+st+' unidad'+(st===1?'':'es')+(co?'\n🎨 *Colores:* '+co:'')+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n📝 *Descripción:*\n'+desc(p)+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n📍 *Ubicación:* Comayagua, Honduras\n🚚 *Entrega:* A domicilio con costo según zona. También coordinamos entrega local.\n💳 *Pago:* Depósito / Tigo Money o pagar al recibir donde aplique.\n\n🏪 *Vendedor:* SD Comayagua\n📲 *WhatsApp:* +504 3151-7755'}
  function status(p){const co=colors(p);return '🔥 *Disponible en SD Comayagua*\n\n🛍️ '+name(p)+'\n💵 '+money(price(p))+'\n🔖 '+code(p)+'\n📦 Stock: '+stock(p)+' unidad'+(stock(p)===1?'':'es')+(co?'\n🎨 '+co:'')+'\n\n📍 Comayagua\n🚚 Entrega según zona\n📲 3151-7755'}
  function group(p){const co=colors(p);return 'Buenas 👋\n\n━━━━━━━━━━━━━━━━━━━━\n\nTengo disponible:\n\n🛍️ *'+name(p)+'*\n💵 *Precio:* '+money(price(p))+'\n🔖 *Código:* '+code(p)+'\n📦 *Stock:* '+stock(p)+' unidad'+(stock(p)===1?'':'es')+(co?'\n🎨 *Colores:* '+co:'')+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n📝 *Detalle:*\n'+desc(p)+'\n\n━━━━━━━━━━━━━━━━━━━━\n\n📍 Somos *SD Comayagua*\n🚚 Entregas a domicilio con costo según zona\n📲 WhatsApp: +504 3151-7755'}
  function short(p){return '🛍️ *'+name(p)+'*\n💵 '+money(price(p))+'\n🔖 '+code(p)+'\n\n📝 '+desc(p)+'\n\n🏪 SD Comayagua\n📲 +504 3151-7755'}
  window.addEventListener('click',ev=>{const b=ev.target.closest&&ev.target.closest('.sdc-v297-copy-wa,.sdc-v297-copy-mp,.sdc-v297-copy-status,.sdc-v297-copy-group,.sdc-v297-copy-short'); if(!b)return; const p=currentProduct(); if(!p)return; ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation(); if(b.classList.contains('sdc-v297-copy-wa'))return copy(wa(p),'WhatsApp Business'); if(b.classList.contains('sdc-v297-copy-mp'))return copy(market(p),'Marketplace'); if(b.classList.contains('sdc-v297-copy-status'))return copy(status(p),'Estado'); if(b.classList.contains('sdc-v297-copy-group'))return copy(group(p),'Grupo'); if(b.classList.contains('sdc-v297-copy-short'))return copy(short(p),'Descripción corta')},true);
  function run(){css();patchCodes();patchReceipts()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(run,80),true);
  setInterval(run,700);
})();
