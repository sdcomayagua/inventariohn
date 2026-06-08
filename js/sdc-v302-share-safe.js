/* SDC v302 share safe */
(function(){
 if(window.SDCV302ShareSafeReady)return;window.SDCV302ShareSafeReady=true;
 const PHONE='3151-7775',WA='50431517775';
 const q=s=>document.querySelector(s),c=v=>String(v||'').trim(),m=n=>'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');
 function all(){try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return[]}}
 function nm(p){return c(p.name||p.nombre||'Producto')}
 function pr(p){return Number(p.price||p.precio||p.precio_venta||0)||0}
 function st(p){let r=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);return r.length?r.reduce((a,x)=>a+(Number(x.qty||x.cantidad||x.stock||0)||0),0):Math.max(0,Number(p.stock||p.existencia||0)||0)}
 function ca(p){return c(String(p.categories||p.category||p.categoria||'General').split(/[,;|/]/)[0])||'General'}
 function ds(p){return c(p.description||p.descripcion)||nm(p)+' disponible en SD Comayagua. Producto nuevo, listo para entrega segun zona. Precio y disponibilidad sujetos a confirmacion.'}
 function norm(x){return c(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
 function code(p){
   let saved=c(p.codigo_producto||p.codigoProducto||p.productCode||p.sku||p.code||p.codigo);
   if(/^(SD|SDC)-/i.test(saved))return saved.toUpperCase();
   let n=norm(nm(p)),b='';
   if(/DEDAL/.test(n)&&/(V1|VERSION 1)/.test(n))b='DGV1';
   else if(/DEDAL/.test(n)&&/(V2|VERSION 2)/.test(n))b='DGV2';
   else{
     b=(n.match(/[A-Z0-9]+/g)||[]).filter(x=>!['DE','DEL','LA','EL','LOS','LAS','PARA','CON','Y','EN','POR','UN','UNA'].includes(x)).map(x=>/^V?\d+$/.test(x)?(x[0]=='V'?x:'V'+x):(/[0-9]/.test(x)&&x.length<6?x:x[0])).join('').slice(0,8)||'PROD';
   }
   return 'SD-'+b+'-'+Math.round(pr(p));
 }
 function unit(p){let n=norm(nm(p)+' '+ca(p));return /DEDAL|GATILLO/.test(n)?'par':'unidad'}
 function plural(u){return u==='par'?'pares':u+'s'}
 function cur(){let r=q('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail');if(!r)return null;let t=c((r.querySelector('.v49-detail-main h4,.v141-head-copy h3,.v163-detail-main h4,h3,h4')||{}).textContent||''),id=c((r.querySelector('.v141-meta-grid article:nth-child(3) b,.v49-detail-main small,.v163-detail-main small')||{}).textContent||'').split('·').pop();return all().find(p=>c(p.id||p.codigo).toLowerCase()===id.toLowerCase())||all().find(p=>nm(p).toLowerCase()===t.toLowerCase())||null}
 function buy(p){return 'Hola SD COMAYAGUA 👋 quiero comprar '+nm(p)+'. ¿Me confirma disponibilidad y opciones de entrega?'}
 function link(p){return 'https://wa.me/'+WA+'?text='+encodeURIComponent(buy(p))}
 function wa(p){return '🎮 '+nm(p)+'\n\n'+ds(p)+'\n\n✅ Precio: '+m(pr(p))+'\n✅ Categoria: '+ca(p)+'\n✅ Codigo: '+code(p)+'\n✅ Inventario disponible: '+st(p)+'\n\n📍 Disponible en Comayagua\n📲 WhatsApp: +504 '+PHONE+'\n💬 Pedir por WhatsApp:\n'+link(p)}
 function fb(p){return '🛒 PUBLICACION PARA FACEBOOK\n\n📌 Titulo: '+nm(p)+'\n💵 Precio: '+m(pr(p))+'\n🔖 Codigo: '+code(p)+'\n🏷️ Categoria: '+ca(p)+'\n📦 Disponible: '+st(p)+'\n\n📝 Descripcion:\n'+ds(p)+'\n\n📍 Comayagua, Honduras\n📲 WhatsApp: +504 '+PHONE}
 function ia(p){
   let s=st(p),u=unit(p),us=s===1?u:plural(u),cod=code(p),available=s>0;
   let regla=available?'Si el cliente pide '+s+' '+us+' o menos, puede continuar con la cotizacion.\n\nSi el cliente pide mas de '+s+' '+us+', la IA NO debe confirmar esa cantidad. Debe responder:\n\n“Por el momento solo tengo disponible '+s+' '+us+' de '+nm(p)+' 😅 ¿Desea llevar esa cantidad o prefiere que le muestre otra opcion similar? 👀”':'Este producto esta agotado. Si el cliente pregunta por este producto, la IA debe responder:\n\n“Por el momento '+nm(p)+' esta agotado 😔 ¿Desea que le muestre otra opcion similar disponible? 👀”';
   return 'NOMBRE DEL PRODUCTO\n'+nm(p)+'\n\nPRECIO\n'+Math.round(pr(p))+'\n\nDETALLES DEL PRODUCTO\n\n🎮 '+nm(p)+'\n\n'+ds(p)+'\n\n✅ Precio: '+m(pr(p))+' cada '+u+'\n✅ Categoria: '+ca(p)+'\n✅ Codigo del producto: '+cod+'\n✅ Inventario disponible: '+s+' '+us+'\n✅ Producto nuevo y listo para entrega\n✅ Precio sujeto a disponibilidad\n✅ Consultar entrega segun zona\n\n📍 Disponible en Comayagua\n📲 WhatsApp: +504 '+PHONE+'\nConsulta disponibilidad.\n\n💬 PEDIR POR WHATSAPP:\n'+link(p)+'\n\n'+cod+'\n\n📦 INVENTARIO PARA LA IA\n\nInventario disponible: '+s+' '+us+'\nEstado: '+(available?'✅ Disponible':'❌ Agotado')+'\n\nRegla de cantidad:\nAntes de cotizar o confirmar este producto, la IA debe comparar la cantidad que pide el cliente con el inventario disponible.\n\n'+regla+'\n\nSi el inventario disponible llega a 0, este producto queda agotado y la IA no debe ofrecerlo, cotizarlo ni confirmar pedidos de este producto.\n\nLa IA no debe inventar disponibilidad ni confirmar mas cantidad de la que aparece en inventario.\n\nIMPORTANTE: cada vez que vendas unidades, actualiza la cantidad del inventario en esta ficha para que la IA responda con la disponibilidad correcta.'
 }
 function toast(x){let e=document.createElement('div');e.textContent=x;e.style.cssText='position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:999999;background:#071a35;color:white;padding:12px 16px;border-radius:999px;font-weight:900';document.body.appendChild(e);setTimeout(()=>e.remove(),1700)}
 function manual(t){prompt('Copie el texto:',t)}
 function cp(t,l){let a=document.createElement('textarea');a.value=t;a.setAttribute('readonly','');a.style.cssText='position:fixed;top:-1000px;left:-1000px;opacity:0';document.body.appendChild(a);a.focus();a.select();a.setSelectionRange(0,a.value.length);let ok=false;try{ok=document.execCommand('copy')}catch(e){}a.remove();if(ok)return toast(l+' copiado ✅');if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(()=>toast(l+' copiado ✅')).catch(()=>manual(t))}else manual(t)}
 function add(){let r=q('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail');if(!r||r.querySelector('.sdc302box'))return;let h=r.querySelector('[data-panel="cliente"]')||r.querySelector('.v141-detail-shell')||r;let d=document.createElement('section');d.className='sdc302box';d.style.cssText='margin:14px 0;padding:14px;border-radius:20px;background:#f4f8ff;border:1px solid #d9e8f8';d.innerHTML='<b>Compartir producto</b><p style="margin:7px 0 0;color:#64748b;font-size:12px">Textos listos para publicar y para entrenar la IA por articulo.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px"><button class="sdc302wa" type="button" style="border:0;border-radius:16px;min-height:54px;background:#25d366;color:white;font-weight:900">Catalogo WhatsApp</button><button class="sdc302fb" type="button" style="border:0;border-radius:16px;min-height:54px;background:#1677f2;color:white;font-weight:900">Facebook</button><button class="sdc302ia" type="button" style="border:0;border-radius:16px;min-height:54px;background:#0b63ce;color:white;font-weight:900;grid-column:1/-1">WhatsApp Business IA</button></div>';h.appendChild(d)}
 document.addEventListener('click',e=>{let w=e.target.closest&&e.target.closest('.sdc302wa'),f=e.target.closest&&e.target.closest('.sdc302fb'),i=e.target.closest&&e.target.closest('.sdc302ia');if(w||f||i){let p=cur();if(!p)return toast('No encontre el producto');e.preventDefault();if(w)cp(wa(p),'WhatsApp');if(f)cp(fb(p),'Facebook');if(i)cp(ia(p),'WhatsApp Business IA')}else setTimeout(add,120)},true);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add();
 setInterval(add,900);
})();