/* SDC v298 - ajustes finales Salman: categorias, detalle, recibos, textos y codigos */
(function(){
  'use strict';
  function clean(v){return String(v||'').trim();}
  function money(n){return 'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');}
  function normalize(v){return clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();}
  function getProducts(){try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return []}}
  function firstImage(p){return clean(p.image||p.imagen||p.foto||String(p.gallery||p.galeria||'').split(/\n|\||;/)[0]||'')}
  function tags(v){return clean(v).split(/[,;|/]+/).map(clean).filter(Boolean)}
  function firstCat(p){return tags(p.categories||p.category||p.categoria||p.etiquetas||'General')[0]||'General'}
  function price(p){return Number(p.price||p.precio||p.precio_venta||0)||0}
  function nameOf(p){return clean(p.name||p.nombre||'Producto disponible')}
  function stockOf(p){
    var rows=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);
    if(rows.length) return rows.reduce(function(a,r){return a+(Number(r.qty||r.cantidad||r.stock||0)||0)},0);
    return Math.max(0,Number(p.stock||p.existencia||0)||0);
  }
  function colorsOf(p){
    var rows=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);
    var out=rows.map(function(r){return {name:clean(r.name||r.color||r.nombre||r.label),qty:Number(r.qty||r.cantidad||r.stock||0)||0}}).filter(function(r){return r.name&&r.qty>0});
    return out.length?out.map(function(r){return r.name+' '+r.qty}).join(' · '):'';
  }
  function descOf(p){return clean(p.description||p.descripcion)||nameOf(p)+' disponible en SD Comayagua. Producto nuevo, listo para entrega según zona. Precio y disponibilidad sujetos a confirmación.'}
  function shortCatalogCode(p){
    var n=normalize(nameOf(p));
    var cat=normalize(firstCat(p));
    var base='';
    if(/DEDAL/.test(n)&&/(V1|VERSION 1|VERSIÓN 1)/.test(n)) base='DUV1';
    else if(/DEDAL/.test(n)&&/(V2|VERSION 2|VERSIÓN 2)/.test(n)) base='DUV2';
    else{
      var words=n.match(/[A-Z0-9]+/g)||[];
      words=words.filter(function(w){return !['DE','DEL','LA','EL','LOS','LAS','PARA','CON','Y','EN','POR','UN','UNA'].includes(w)});
      base=words.map(function(w){
        if(/^V?\d+$/.test(w)) return w.startsWith('V')?w:'V'+w;
        if(/[0-9]/.test(w)&&w.length<=5) return w;
        return w.charAt(0);
      }).join('').slice(0,6);
      if(!base) base=(cat.charAt(0)||'P')+'01';
    }
    return 'SDC-'+base+'-'+Math.round(price(p)||0);
  }
  function currentDetailProduct(){
    var root=document.querySelector('#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail,#modalRoot .product-detail-modal-v221');
    if(!root) return null;
    var title=clean((root.querySelector('.v49-detail-main h4,.v141-head-copy h3,.v163-detail-main h4,h3,h4')||{}).textContent||'');
    var id=clean(((root.querySelector('.v49-detail-main small,.v141-meta-grid article:nth-child(3) b')||{}).textContent||'').split('·').pop());
    var products=getProducts();
    var p=products.find(function(x){return clean(x.id||x.codigo).toLowerCase()===id.toLowerCase()});
    if(!p&&title) p=products.find(function(x){return clean(x.name||x.nombre).toLowerCase()===title.toLowerCase()});
    return p||null;
  }
  function inject(){
    if(document.getElementById('sdc-v298-fixes-style')) return;
    var css = [
      '#modalRoot .category-sheet-v199 .category-sheet-grid-v199{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-card-v199{width:auto!important;min-width:0!important;margin:0!important;min-height:138px!important;padding:12px!important;border-radius:24px!important;text-align:center!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-card-v199:first-child{grid-column:1/-1!important;min-height:190px!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-main-v199{width:100%!important;height:100%!important;display:grid!important;place-items:center!important;text-align:center!important}',
      '#modalRoot .category-sheet-v199 [data-catprint-v199]{display:none!important}',
      '#modalRoot .category-sheet-v199 .category-sheet-actions-v199{display:flex!important;justify-content:center!important;gap:10px!important}',
      '#modalRoot .product-detail-modal-v221 .v250-qty-line{width:100%!important;max-width:none!important;box-sizing:border-box!important;padding:18px!important;overflow:visible!important}',
      '#modalRoot .product-detail-modal-v221 .v49-qty-wrap{width:100%!important;max-width:none!important}',
      '#modalRoot .product-detail-modal-v221 .v49-qty-stepper{width:100%!important;max-width:none!important;display:grid!important;grid-template-columns:1fr 1fr 1fr!important;gap:12px!important;box-sizing:border-box!important;overflow:visible!important}',
      '#modalRoot .product-detail-modal-v221 .v49-qty-stepper button,#modalRoot .product-detail-modal-v221 .v49-qty-stepper b{width:100%!important;min-width:0!important;min-height:72px!important;border-radius:22px!important;display:grid!important;place-items:center!important;box-sizing:border-box!important}',
      '#modalRoot .product-detail-modal-v221 .v250-price-cards{width:100%!important;max-width:none!important;display:grid!important;grid-template-columns:1fr!important;gap:12px!important}',
      '#modalRoot .product-detail-modal-v221 .v250-price-cards .v164-price-option{width:100%!important;max-width:none!important;justify-self:stretch!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}',
      '#modalRoot .product-detail-modal-v221 .v250-price-cards [data-v49-card="normal"]{transform:none!important;margin-left:0!important}',
      '.productPhotoClean-v163{height:auto!important;min-height:0!important;padding:18px!important;border-radius:30px!important;overflow:hidden!important}',
      '.productPhotoHead-v163{margin:0 0 14px!important;padding:16px!important;border-radius:24px!important}',
      '.productPhotoMain-v163{display:block!important;gap:12px!important}',
      '.productPhotoImageWrap-v163{width:100%!important;max-height:430px!important;margin:0 0 14px!important;border-radius:24px!important;overflow:hidden!important}',
      '.productPhotoImageWrap-v163 img{width:100%!important;height:100%!important;object-fit:contain!important;background:#fff!important}',
      '.productPhotoBody-v163{padding:0 8px!important}',
      '.productPhotoBody-v163 h2{margin:10px 0 6px!important;font-size:38px!important;line-height:1.03!important}',
      '.productPhotoPrice-v163{font-size:54px!important;margin:4px 0 2px!important;line-height:.9!important}',
      '.productPhotoQty-v163{padding:13px!important;margin:6px 0 10px!important;border-radius:18px!important}',
      '.productPhotoFacts-v163{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:9px!important;margin:8px 0 10px!important}',
      '.productPhotoFacts-v163 span{min-height:70px!important;padding:12px!important;border-radius:16px!important}',
      '.productPhotoNote-v163{margin-top:8px!important;padding:14px!important;border-radius:18px!important}',
      '.productPhotoFooter-v163{margin-top:12px!important;padding:16px!important;border-radius:0 0 22px 22px!important}',
      '.sdc208-line.has-sdc298-thumb{display:grid!important;grid-template-columns:42px 54px minmax(0,1fr) auto!important;gap:10px!important;align-items:center!important;overflow:hidden!important}',
      '.sdc298-receipt-thumb{width:54px!important;height:54px!important;border-radius:14px!important;object-fit:cover!important;background:#eef6ff!important;border:1px solid #d9e8f8!important}',
      '.sdc230-compare-export .sdc208-line.has-sdc298-thumb{grid-template-columns:42px 54px minmax(0,1fr) 92px!important;overflow:hidden!important}',
      '.sdc230-compare-export .sdc208-line-copy{min-width:0!important;text-align:left!important;overflow:hidden!important}',
      '.sdc230-compare-export .sdc208-line-copy b,.sdc230-compare-export .sdc208-line-copy span,.sdc230-compare-export .sdc208-line-copy em{white-space:normal!important;overflow:hidden!important;text-overflow:ellipsis!important}',
      '.sdc230-compare-export .sdc208-line strong{grid-column:4!important;justify-self:end!important;align-self:center!important;position:static!important;left:auto!important;right:auto!important;transform:none!important;margin:0!important;padding:0!important;text-align:right!important;white-space:nowrap!important;font-size:18px!important;max-width:92px!important;overflow:hidden!important;color:#d61c3b!important}',
      '.sdc230-compare-pill b{color:#d61c3b!important}.sdc230-compare-pill small{color:#52677f!important}',
      '@media(max-width:700px){#modalRoot .category-sheet-v199 .category-sheet-grid-v199{grid-template-columns:repeat(2,minmax(0,1fr))!important}#modalRoot .category-sheet-v199 .category-sheet-card-v199:first-child{grid-column:1/-1!important}#modalRoot .category-sheet-v199 .category-sheet-main-v199 b{font-size:42px!important}#modalRoot .category-sheet-v199 .category-sheet-card-v199:first-child .category-sheet-main-v199 b{font-size:56px!important}}'
    ].join('\n');
    var st=document.createElement('style'); st.id='sdc-v298-fixes-style'; st.textContent=css; document.head.appendChild(st);
  }
  function fixCategorySheet(){
    document.querySelectorAll('#modalRoot .category-sheet-v199').forEach(function(sheet){
      sheet.querySelectorAll('[data-catprint-v199]').forEach(function(btn){btn.remove()});
      sheet.querySelectorAll('.category-sheet-actions-v199').forEach(function(row){if(!row.querySelector('button')) row.remove()});
    });
  }
  function fixReceiptImages(){
    var products=getProducts(); if(!products.length) return;
    document.querySelectorAll('#modalRoot .sdc208-line:not(.has-sdc298-thumb),.sdc230-compare-export .sdc208-line:not(.has-sdc298-thumb)').forEach(function(line){
      var name=clean(line.querySelector('.sdc208-line-copy b')&&line.querySelector('.sdc208-line-copy b').textContent);
      if(!name) return;
      var p=products.find(function(x){return clean(x.name||x.nombre).toLowerCase()===name.toLowerCase()});
      var img=p?firstImage(p):''; if(!img) return;
      var index=line.querySelector('.sdc208-line-index'); if(!index) return;
      var im=document.createElement('img'); im.className='sdc298-receipt-thumb'; im.src=img; im.alt=name; im.crossOrigin='anonymous'; im.referrerPolicy='no-referrer'; im.onerror=function(){im.remove()};
      index.insertAdjacentElement('afterend',im); line.classList.add('has-sdc298-thumb');
    });
  }
  function write(text,label){
    try{navigator.clipboard.writeText(text).then(function(){toast(label+' copiado ✅')})}catch(e){
      var ta=document.createElement('textarea'); ta.value=text; ta.style.position='fixed'; ta.style.left='-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast(label+' copiado ✅');
    }
  }
  function toast(msg){
    var old=document.querySelector('.sdc-v297-mini-toast'); if(old) old.remove();
    var el=document.createElement('div'); el.className='sdc-v297-mini-toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(function(){el.remove()},1800);
  }
  function textWA(p){
    var c=colorsOf(p), code=shortCatalogCode(p), st=stockOf(p);
    return '🛍️ *'+nameOf(p)+'*\n\n💵 *Precio:* '+money(price(p))+'\n🏷️ *Categoría:* '+firstCat(p)+'\n🔖 *Código catálogo:* '+code+'\n📦 *Disponible:* '+st+' unidad'+(st===1?'':'es')+(c?'\n🎨 *Colores:* '+c:'')+'\n\n📝 *Descripción:*\n'+descOf(p)+'\n\n📍 *SD Comayagua*\n🚚 Entregas a domicilio según zona\n💳 Depósito / Tigo Money o pagar al recibir donde aplique\n📲 WhatsApp: +504 3151-7755';
  }
  function textMarketplace(p){
    var c=colorsOf(p), code=shortCatalogCode(p), st=stockOf(p);
    return 'Título: '+nameOf(p)+'\n\nPrecio: '+money(price(p))+'\nCódigo de catálogo: '+code+'\nCategoría: '+firstCat(p)+'\nCondición: Nuevo\nDisponibilidad: '+st+' unidad'+(st===1?'':'es')+(c?'\nColores disponibles: '+c:'')+'\n\nDescripción:\n'+descOf(p)+'\n\nUbicación: Comayagua, Honduras\nEntrega: Envíos a domicilio con costo según zona. También coordinamos entrega local.\nForma de pago: Depósito / Tigo Money o pagar al recibir donde aplique.\n\nVendedor: SD Comayagua\nWhatsApp: +504 3151-7755';
  }
  function textStatus(p){
    var c=colorsOf(p), code=shortCatalogCode(p);
    return '🔥 *Disponible en SD Comayagua*\n\n🛍️ '+nameOf(p)+'\n💵 '+money(price(p))+'\n🔖 '+code+'\n📦 Stock: '+stockOf(p)+' unidad'+(stockOf(p)===1?'':'es')+(c?'\n🎨 '+c:'')+'\n\n📍 Comayagua\n🚚 Entrega según zona\n📲 3151-7755';
  }
  function textGroup(p){
    var c=colorsOf(p), code=shortCatalogCode(p);
    return 'Buenas 👋\n\nTengo disponible:\n\n🛍️ *'+nameOf(p)+'*\n💵 Precio: *'+money(price(p))+'*\n🔖 Código: *'+code+'*\n📦 Stock: *'+stockOf(p)+' unidad'+(stockOf(p)===1?'':'es')+'*'+(c?'\n🎨 Colores: '+c:'')+'\n\n📝 '+descOf(p)+'\n\n📍 Somos *SD Comayagua*\n🚚 Entregas a domicilio con costo según zona\n📲 WhatsApp: +504 3151-7755';
  }
  function textShort(p){
    var c=colorsOf(p), code=shortCatalogCode(p);
    return '🛍️ '+nameOf(p)+'\n💵 '+money(price(p))+'\n🔖 '+code+'\n\n'+descOf(p)+(c?'\n\n🎨 Colores: '+c:'')+'\n\nSD Comayagua · WhatsApp +504 3151-7755';
  }
  function interceptCopyButtons(){
    document.addEventListener('click',function(ev){
      var btn=ev.target.closest&&ev.target.closest('.sdc-v297-copy-wa,.sdc-v297-copy-mp,.sdc-v297-copy-status,.sdc-v297-copy-group,.sdc-v297-copy-short');
      if(!btn) return;
      var p=currentDetailProduct(); if(!p) return;
      ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
      if(btn.classList.contains('sdc-v297-copy-wa')) return write(textWA(p),'WhatsApp Business');
      if(btn.classList.contains('sdc-v297-copy-mp')) return write(textMarketplace(p),'Marketplace');
      if(btn.classList.contains('sdc-v297-copy-status')) return write(textStatus(p),'Estado');
      if(btn.classList.contains('sdc-v297-copy-group')) return write(textGroup(p),'Grupo');
      if(btn.classList.contains('sdc-v297-copy-short')) return write(textShort(p),'Descripción corta');
    },true);
  }
  function run(){inject();fixCategorySheet();fixReceiptImages();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',function(){setTimeout(run,80)},true);
  setInterval(run,700);
  interceptCopyButtons();
})();
