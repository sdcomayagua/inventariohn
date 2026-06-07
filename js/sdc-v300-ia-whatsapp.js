/* SDC v300 - Ficha lista para guia IA WhatsApp Business */
(function(){
  'use strict';
  const clean=v=>String(v||'').trim();
  const norm=v=>clean(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const money=n=>'Lps. '+Math.round(Number(n||0)).toLocaleString('es-HN');
  const products=()=>{try{return (window.SDCStore&&SDCStore.load().products)||[]}catch(e){return[]}};
  const name=p=>clean(p.name||p.nombre||'Producto');
  const price=p=>Number(p.price||p.precio||0)||0;
  const desc=p=>clean(p.description||p.descripcion)||name(p)+' disponible en SD Comayagua. Producto nuevo, listo para entrega según zona. Precio y disponibilidad sujetos a confirmación.';
  const tags=v=>clean(v).split(/[,;|/]+/).map(clean).filter(Boolean);
  const cat=p=>tags(p.categories||p.category||p.categoria||p.etiquetas||'General')[0]||'General';
  function stock(p){
    const rows=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);
    if(rows.length) return rows.reduce((a,r)=>a+(Number(r.qty||r.cantidad||r.stock||0)||0),0);
    return Math.max(0,Number(p.stock||p.existencia||0)||0);
  }
  function colorRows(p){
    const rows=Array.isArray(p.colors)?p.colors:(Array.isArray(p.colores)?p.colores:[]);
    return rows.map(r=>({name:clean(r.name||r.color||r.nombre||r.label),qty:Number(r.qty||r.cantidad||r.stock||0)||0})).filter(r=>r.name);
  }
  function colorText(p){
    return colorRows(p).filter(r=>r.qty>0).map(r=>r.name+' '+r.qty).join(' · ');
  }
  function unitWord(p){
    const n=norm(name(p)+' '+cat(p));
    if(/DEDAL/.test(n)) return 'par';
    if(/AUDIFONO|AUDÍFONO|AURICULAR|HEADSET|DIADEMA/.test(n)) return 'unidad';
    if(/GATILLO/.test(n)) return 'par';
    return 'unidad';
  }
  function code(p){
    const n=norm(name(p)); let b='';
    if(/DEDAL/.test(n)&&/(V1|VERSION 1|VERSIÓN 1)/.test(n)) b='DGV1';
    else if(/DEDAL/.test(n)&&/(V2|VERSION 2|VERSIÓN 2)/.test(n)) b='DGV2';
    else{
      const skip=['DE','DEL','LA','EL','LOS','LAS','PARA','CON','Y','EN','POR','UN','UNA','PRO','PLUS','GAMER'];
      const w=(n.match(/[A-Z0-9]+/g)||[]).filter(x=>!skip.includes(x));
      b=w.map(x=>/^V?\d+$/.test(x)?(x[0]==='V'?x:'V'+x):(/[0-9]/.test(x)&&x.length<6?x:x[0])).join('').slice(0,7)||'PROD';
    }
    return 'SDC-'+b+'-'+Math.round(price(p));
  }
  function currentProduct(){
    const root=document.querySelector('#modalRoot .product-detail-modal-v221,#modalRoot .v49-product-detail,#modalRoot .v141-product-detail,#modalRoot .v163-product-detail');
    if(!root)return null;
    const title=clean((root.querySelector('.v49-detail-main h4,.v141-head-copy h3,.v163-detail-main h4,h3,h4')||{}).textContent||'');
    const raw=clean((root.querySelector('.v49-detail-main small,.v141-meta-grid article:nth-child(3) b,.v163-detail-main small')||{}).textContent||'').split('·').pop();
    return products().find(p=>clean(p.id||p.codigo).toLowerCase()===clean(raw).toLowerCase())||products().find(p=>name(p).toLowerCase()===title.toLowerCase())||null;
  }
  function iaText(p){
    const st=stock(p);
    const unit=unitWord(p);
    const plural=unit==='par'?'pares':unit+'s';
    const available=st>0;
    const colors=colorText(p);
    const codeText=code(p);
    const colorLine=colors?'\n✅ Colores disponibles: '+colors:'';
    const colorRule=colors?'\n\nInventario por color: '+colors+'\nSi el cliente pide un color específico, la IA debe verificar que ese color tenga cantidad disponible antes de confirmarlo.':'';
    const limitText=available
      ? 'Si el cliente pide '+st+' '+(st===1?unit:plural)+' o menos, puede continuar con la cotización.\n\nSi el cliente pide más de '+st+' '+(st===1?unit:plural)+', la IA no debe confirmar esa cantidad. Debe responder:\n\n“Por el momento solo tengo disponible '+st+' '+(st===1?unit:plural)+' de '+name(p)+' 😊 ¿Desea llevar esa cantidad o quiere que le muestre otra opción similar? 👀”'
      : 'Este producto está agotado. Si el cliente pregunta por este producto, la IA debe responder:\n\n“Por el momento '+name(p)+' está agotado 😔 ¿Desea que le muestre otra opción similar disponible? 👀”';
    return 'NOMBRE DEL PRODUCTO\n'+name(p)+'\n\nPRECIO\n'+Math.round(price(p))+'\n\nDETALLES DEL PRODUCTO\n\n🎮 '+name(p)+'\n\n'+desc(p)+'\n\n✅ Precio: '+money(price(p))+' cada '+unit+'\n✅ Categoría: '+cat(p)+'\n✅ Código del producto: '+codeText+'\n✅ Producto nuevo y listo para entrega\n✅ Precio sujeto a disponibilidad\n✅ Consultar entrega según zona'+colorLine+'\n\n📍 Disponible en Comayagua\n📲 WhatsApp: +504 3151-7755\nConsulta disponibilidad.\n\n'+codeText+'\n\n📦 INVENTARIO PARA LA IA\n\nInventario disponible: '+st+' '+(st===1?unit:plural)+'\nEstado: '+(available?'✅ Disponible':'❌ Agotado')+colorRule+'\n\nRegla de cantidad:\nAntes de cotizar o confirmar este producto, la IA debe comparar la cantidad que pide el cliente con el inventario disponible.\n\n'+limitText+'\n\nSi el inventario disponible llega a 0, este producto queda agotado y la IA no debe ofrecerlo, cotizarlo ni confirmar pedidos de este producto.\n\nLa IA no debe inventar disponibilidad ni confirmar más cantidad de la que aparece en inventario.';
  }
  function toast(msg){
    let old=document.querySelector('.sdc-v297-mini-toast'); if(old) old.remove();
    const el=document.createElement('div'); el.className='sdc-v297-mini-toast'; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),1800);
  }
  function copy(text){
    try{navigator.clipboard.writeText(text).then(()=>toast('Ficha IA WhatsApp copiada ✅'))}
    catch(e){const a=document.createElement('textarea'); a.value=text; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('Ficha IA WhatsApp copiada ✅')}
  }
  function addButton(){
    const actions=document.querySelector('#modalRoot .sdc-v297-copy-actions');
    if(!actions || actions.querySelector('.sdc-v300-copy-ia')) return;
    const b=document.createElement('button');
    b.type='button';
    b.className='sdc-v300-copy-ia';
    b.innerHTML='<b>IA WhatsApp</b><span>Ficha inventario</span>';
    b.addEventListener('click',ev=>{ev.preventDefault(); ev.stopPropagation(); const p=currentProduct(); if(!p)return toast('No encontré el producto'); copy(iaText(p));},true);
    actions.appendChild(b);
  }
  function css(){
    let st=document.getElementById('sdc-v300-style'); if(!st){st=document.createElement('style');st.id='sdc-v300-style';document.head.appendChild(st)}
    st.textContent='.sdc-v300-copy-ia{background:linear-gradient(135deg,#071a35,#0b63ce)!important}.sdc-v297-copy-actions:has(.sdc-v300-copy-ia){grid-template-columns:repeat(2,minmax(0,1fr))!important}.sdc-v300-copy-ia b{color:#fff!important}.sdc-v300-copy-ia span{color:rgba(255,255,255,.86)!important}';
  }
  function run(){css();addButton()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run();
  new MutationObserver(run).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(run,80),true);
  setInterval(run,700);
})();
