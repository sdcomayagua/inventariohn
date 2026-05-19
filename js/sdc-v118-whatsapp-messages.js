/* SDC V118: mensajes de WhatsApp más claros para cotización, venta y productos. */
(function(){
  'use strict';

  const BUSINESS='SD COMAYAGUA';
  const WA=' +504 3151-7755';

  function t(v){return String(v??'').replace(/\s+/g,' ').trim();}
  function text(sel,root=document){return t(root.querySelector(sel)?.textContent||'');}
  function val(sel,root=document){return t(root.querySelector(sel)?.value||'');}
  function moneyText(v){
    const raw=t(v);
    if(!raw) return 'Lps. 0';
    return raw.replace(/Lps\.?\s*/i,'Lps. ');
  }
  function cleanPhone(v){
    const n=String(v||'').replace(/\D/g,'');
    if(!n) return '';
    if(n.length===8) return '504'+n;
    if(n.length===11 && n.startsWith('504')) return n;
    return n;
  }
  function openWA(phone,msg){
    const num=cleanPhone(phone);
    const url=num?`https://wa.me/${num}?text=${encodeURIComponent(msg)}`:`https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url,'_blank','noopener');
  }
  function copy(msg){navigator.clipboard?.writeText(msg).catch(()=>{});}
  function toast(msg){const el=document.getElementById('toast'); if(el){el.textContent=msg;el.classList.add('show');clearTimeout(el._v118);el._v118=setTimeout(()=>el.classList.remove('show'),2600);} }

  function isSaleModal(){
    const h=text('.quote-head h3,#modalRoot .modal-head h3');
    const st=text('.quote-status');
    return /venta|factura|recibo/i.test(h+' '+st);
  }
  function docKind(){return isSaleModal()?'recibo':'cotización';}
  function totalFromSummary(){
    const candidates=[...document.querySelectorAll('#totalsMini .summary-total b:last-child,.summary-total b:last-child,.grand b:last-child')].map(x=>t(x.textContent)).filter(Boolean);
    return moneyText(candidates[candidates.length-1]||'Lps. 0');
  }
  function summaryValue(label){
    const rows=[...document.querySelectorAll('#totalsMini .summary-row,.summary-row')];
    const row=rows.find(r=>t(r.textContent).toLowerCase().includes(label.toLowerCase()));
    if(!row) return 'Lps. 0';
    const bs=row.querySelectorAll('b');
    return moneyText(t(bs[bs.length-1]?.textContent||''));
  }
  function getItems(){
    const rows=[...document.querySelectorAll('#cartList .cart-row')];
    return rows.map(r=>{
      const name=t(r.querySelector('.cart-info b,b')?.textContent||'Producto');
      const line=t(r.querySelector('.cart-info span,span')?.textContent||'');
      const qty=t(r.querySelector('.qtybox input')?.value||'1');
      return {name,line,qty};
    }).filter(x=>x.name && !/agrega productos/i.test(x.name));
  }
  function customerInfo(){
    return {
      client: val('[data-k="client"]') || 'Cliente',
      phone: val('[data-k="phone"]'),
      dep: val('[data-k="department"]'),
      mun: val('[data-k="municipality"]'),
      ref: val('[data-k="reference"]'),
      type: val('[data-k="shippingType"]'),
      company: val('[data-k="company"]'),
      status: val('[data-k="status"]')
    };
  }
  function deliveryLabel(type){
    const v=t(type).toLowerCase();
    if(v.includes('cod')) return 'Pagar al recibir';
    if(v.includes('local')) return 'Envío local / por definir';
    return 'Depósito o Tigo Money';
  }
  function buildDocMessage(){
    const sale=isSaleModal();
    const kind=sale?'RECIBO DE COMPRA':'COTIZACIÓN';
    const c=customerInfo();
    const items=getItems();
    const subtotal=summaryValue('Productos');
    const envio=summaryValue('Envío');
    const comision=summaryValue('Comisión');
    const total=totalFromSummary();
    const date=new Date().toLocaleString('es-HN',{day:'2-digit',month:'long',year:'numeric',hour:'numeric',minute:'2-digit'});
    const lines=[];
    lines.push(`*${kind} - ${BUSINESS}*`);
    lines.push('');
    lines.push(`Hola ${c.client||'cliente'}, le compartimos el detalle ${sale?'de su compra':'de su cotización'}:`);
    lines.push('');
    lines.push('*Productos:*');
    if(items.length){
      items.forEach((it,i)=>{
        lines.push(`${i+1}. ${it.name}`);
        lines.push(`   Cantidad: ${it.qty}`);
        if(it.line) lines.push(`   ${it.line}`);
      });
    }else{
      lines.push('1. Producto pendiente de confirmar');
    }
    lines.push('');
    lines.push('*Resumen:*');
    lines.push(`Subtotal productos: ${subtotal}`);
    lines.push(`Envío: ${envio}`);
    if(!/0$/.test(comision)) lines.push(`Comisión: ${comision}`);
    lines.push(`*TOTAL A PAGAR: ${total}*`);
    lines.push('');
    lines.push('*Entrega / pago:*');
    lines.push(`Modalidad: ${deliveryLabel(c.type)}`);
    if(c.company) lines.push(`Empresa o entrega: ${c.company}`);
    if(c.dep || c.mun) lines.push(`Ubicación: ${[c.dep,c.mun].filter(Boolean).join(' / ')}`);
    if(c.ref) lines.push(`Referencia: ${c.ref}`);
    lines.push('');
    if(sale){
      lines.push('✅ Su pedido queda registrado con los datos anteriores.');
      lines.push('Por favor confirme que nombre, teléfono, ubicación y forma de entrega están correctos.');
    }else{
      lines.push('✅ Esta cotización está sujeta a disponibilidad de inventario.');
      lines.push('Para reservar o facturar, confirme por este medio.');
    }
    lines.push('');
    lines.push(`Fecha: ${date}`);
    lines.push(`${BUSINESS}`);
    lines.push(`WhatsApp:${WA}`);
    return lines.join('\n');
  }

  function buildProductMessage(){
    const root=document.getElementById('modalRoot')||document;
    const title=text('h2,h3',root)||text('.product-title',root)||'Producto SD Comayagua';
    const price=[...root.querySelectorAll('b,strong,span')].map(x=>t(x.textContent)).find(x=>/Lps\.?/i.test(x))||'';
    const desc=text('.product-description,.product-detail p,p',root);
    return [
      `*PRODUCTO - ${BUSINESS}*`,
      '',
      `Producto: ${title}`,
      price?`Precio: ${moneyText(price)}`:'Precio: por confirmar',
      desc?`Descripción: ${desc}`:'',
      '',
      'Opciones de entrega:',
      '• Depósito / Tigo Money',
      '• Pagar al recibir',
      '• Envío local según zona',
      '',
      '✅ Precio sujeto a disponibilidad.',
      `${BUSINESS}`,
      `WhatsApp:${WA}`
    ].filter(Boolean).join('\n');
  }

  function intercept(){
    document.addEventListener('click',ev=>{
      const wa=ev.target.closest('#waText');
      if(wa){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const msg=buildDocMessage();
        copy(msg);
        openWA(customerInfo().phone,msg);
        toast(`${docKind()} copiada y WhatsApp abierto.`);
        return;
      }
      const prod=ev.target.closest('#v53WhatsAppProduct,[data-action="sendProductWhatsApp"]');
      if(prod){
        ev.preventDefault();
        ev.stopImmediatePropagation();
        const phone=prompt('Número WhatsApp del cliente. Déjelo vacío para elegir el chat manualmente:','');
        if(phone===null) return;
        const msg=buildProductMessage();
        copy(msg);
        openWA(phone,msg);
        toast('Mensaje de producto copiado y WhatsApp abierto.');
      }
    },true);
  }

  function renameButtons(){
    const wa=document.getElementById('waText');
    if(wa) wa.innerHTML='<span>Enviar WhatsApp</span>';
    const dl=document.getElementById('downloadDoc');
    if(dl) dl.innerHTML='<span>Descargar imagen</span>';
    const short=document.getElementById('shortReceipt');
    if(short) short.innerHTML='<span>Recibo corto</span>';
    const finish=document.getElementById('finishSale');
    if(finish && !/guardar|finalizar/i.test(finish.textContent)) finish.innerHTML='<span>Finalizar venta</span>';
  }

  function boot(){
    intercept();
    renameButtons();
    new MutationObserver(renameButtons).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
