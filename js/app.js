(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  let state = window.SDCStorage.load();
  let currentCardText = '';
  let currentPhone = '';

  const fallbackImg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="900" height="900" viewBox="0 0 900 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#071522"/><stop offset="1" stop-color="#0a2a43"/></linearGradient></defs><rect width="900" height="900" rx="80" fill="url(#g)"/><circle cx="450" cy="330" r="132" fill="#18e7ff" opacity=".12"/><text x="450" y="405" font-family="Arial Black,Arial" font-size="112" text-anchor="middle" fill="#18e7ff">SD</text><text x="450" y="500" font-family="Arial" font-size="36" text-anchor="middle" fill="#d9e8f5" letter-spacing="5">COMAYAGUA</text><text x="450" y="565" font-family="Arial" font-size="26" text-anchor="middle" fill="#9bb1c3">Imagen pendiente</text></svg>`)}`;

  function money(n){ return 'Lps. ' + Math.round(Number(n)||0).toLocaleString('es-HN'); }
  function nowCode(prefix){ return prefix + '-' + new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14); }
  function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.remove('hidden'); clearTimeout(window.__toastTimer); window.__toastTimer=setTimeout(()=>el.classList.add('hidden'),3600); }
  function saveLocal(){ window.SDCStorage.save(state); render(); }
  function getProduct(id){ return state.productos.find(p=>p.id===id); }
  function isActive(p){ return p.activo !== false; }
  function productImage(p){ return (p && p.imagen && /^https?:\/\//i.test(p.imagen)) ? p.imagen : fallbackImg; }
  function parsePromos(txt){
    const promos = [];
    String(txt||'').split('|').forEach(part=>{
      const [q,price] = part.split(':').map(x=>Number(String(x||'').trim()));
      if(q>0 && price>=0) promos.push({qty:q,total:price});
    });
    return promos.sort((a,b)=>a.qty-b.qty);
  }
  function priceFor(product, qty){
    qty = Math.max(1, Number(qty)||1);
    const promos = parsePromos(product.promos);
    let selected = null;
    promos.forEach(p=>{ if(qty>=p.qty) selected = p; });
    if(selected && selected.qty === qty) return selected.total;
    if(selected && selected.qty > 0 && qty % selected.qty === 0) return selected.total * (qty / selected.qty);
    return (Number(product.precio)||0) * qty;
  }
  function shippingTotal(type, subtotal){
    const a=state.ajustes||{};
    if(type==='local') return {ship:0,fee:0,total:subtotal,label:'Entrega local / sin envío'};
    if(type==='recibir'){
      const ship=Number(a.envioRecibirBase)||100;
      const base=subtotal+ship;
      const fee=Math.round(base*((Number(a.comisionRecibir)||6)/100));
      return {ship,fee,total:base+fee,label:'Pagar al Recibir'};
    }
    const ship=Number(a.envioNormal)||110;
    return {ship,fee:0,total:subtotal+ship,label:'Envío Normal'};
  }
  function compute(productId, qty, shipType){
    const p=getProduct(productId) || state.productos[0];
    const subtotal=p ? priceFor(p, qty) : 0;
    return Object.assign({product:p, qty:Number(qty)||1, subtotal}, shippingTotal(shipType, subtotal));
  }
  function setTab(name){
    $$('.tab-panel').forEach(p=>p.classList.toggle('active',p.id==='tab-'+name));
    $$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===name));
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderStats(){
    const today = new Date().toISOString().slice(0,10);
    const salesToday = state.ventas.filter(v=>(v.fecha||'').slice(0,10)===today).reduce((s,v)=>s+(Number(v.total)||0),0);
    const invQty = state.productos.reduce((s,p)=>s+(Number(p.stock)||0),0);
    const profit = state.productos.reduce((s,p)=>s+((Number(p.precio)||0)-(Number(p.costo)||0))*(Number(p.stock)||0),0);
    const low = state.productos.filter(p=>Number(p.stock)<=3 && Number(p.stock)>0).length;
    $('#statToday').textContent=money(salesToday); $('#statInventory').textContent=invQty; $('#statProfit').textContent=money(profit);
    $('#mSales').textContent=state.ventas.length; $('#mQuotes').textContent=state.cotizaciones.length; $('#mLowStock').textContent=low; $('#mBackup').textContent=state.meta.lastBackup ? new Date(state.meta.lastBackup).toLocaleDateString('es-HN') : 'Pendiente';
    $('#statCloud').textContent = window.SDCCloud.getCloudConfig().pin ? 'Lista' : 'Local';
  }
  function renderProductOptions(){
    const opts = state.productos.filter(isActive).map(p=>`<option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)} · ${money(p.precio)}</option>`).join('');
    ['saleProduct','quoteProduct'].forEach(id=>{ const el=$('#'+id); if(el) el.innerHTML=opts || '<option value="">Sin productos</option>'; });
  }
  function renderProducts(){
    const query = ($('#searchInput')?.value||'').toLowerCase().trim();
    const list = $('#productList');
    const products = state.productos.filter(p=>{
      const hay = [p.nombre,p.categoria,p.descripcion].join(' ').toLowerCase();
      return !query || hay.includes(query);
    });
    list.innerHTML = products.map(p=>`
      <article class="product-card">
        <img class="product-img" src="${escapeAttr(productImage(p))}" alt="${escapeAttr(p.nombre)}" onerror="this.src='${fallbackImg}'" />
        <h3>${escapeHtml(p.nombre)}</h3>
        <p>${escapeHtml(p.descripcion || 'Sin descripción. Agregá una descripción para que la ficha del cliente se vea más profesional.')}</p>
        <div class="product-meta">
          <div><span>Precio</span><b>${money(p.precio)}</b></div>
          <div><span>Stock</span><b>${Number(p.stock)||0}</b></div>
          <div><span>Categoría</span><b>${escapeHtml(p.categoria||'General')}</b></div>
          <div><span>Estado</span><b>${isActive(p)?'Activo':'Oculto'}</b></div>
        </div>
        <div class="product-actions">
          <button data-edit="${escapeAttr(p.id)}">Editar</button>
          <button data-card="${escapeAttr(p.id)}">Ficha</button>
          <button data-dup="${escapeAttr(p.id)}">Duplicar</button>
        </div>
      </article>`).join('') || '<div class="form-card">No hay productos con esa búsqueda.</div>';
  }
  function renderTotals(){
    const sale = compute($('#saleProduct')?.value, $('#saleQty')?.value, $('#saleShipType')?.value);
    $('#salePreview').textContent = `Total: ${money(sale.total)} · Productos ${money(sale.subtotal)} · Envío ${money(sale.ship)}${sale.fee?` · Comisión ${money(sale.fee)}`:''}`;
    const quote = compute($('#quoteProduct')?.value, $('#quoteQty')?.value, $('#quoteShipType')?.value);
    $('#quotePreview').textContent = `Total estimado: ${money(quote.total)} · Productos ${money(quote.subtotal)} · Envío ${money(quote.ship)}${quote.fee?` · Comisión ${money(quote.fee)}`:''}`;
  }
  function render(){ renderStats(); renderProductOptions(); renderProducts(); renderTotals(); }
  function openModal(id){ $('#'+id).classList.remove('hidden'); }
  function closeModals(){ $$('.modal').forEach(m=>m.classList.add('hidden')); }
  function editProduct(id){
    const p = id ? getProduct(id) : {id:'',nombre:'',categoria:'',precio:'',costo:'',stock:'',imagen:'',descripcion:'',promos:''};
    $('#productModalTitle').textContent = id ? 'Editar producto' : 'Nuevo producto';
    $('#prodId').value=p.id||''; $('#prodName').value=p.nombre||''; $('#prodCategory').value=p.categoria||''; $('#prodPrice').value=p.precio||''; $('#prodCost').value=p.costo||''; $('#prodStock').value=p.stock||''; $('#prodImage').value=p.imagen||''; $('#prodDesc').value=p.descripcion||''; $('#prodPromos').value=p.promos||'';
    $('#btnDeleteProduct').style.display = id ? 'inline-flex' : 'none'; openModal('productModal');
  }
  function saveProduct(e){
    e.preventDefault();
    const id = $('#prodId').value || ('P-'+Date.now());
    const next = {id,nombre:$('#prodName').value.trim(),categoria:$('#prodCategory').value.trim()||'General',precio:Number($('#prodPrice').value)||0,costo:Number($('#prodCost').value)||0,stock:Number($('#prodStock').value)||0,imagen:$('#prodImage').value.trim(),descripcion:$('#prodDesc').value.trim(),promos:$('#prodPromos').value.trim(),activo:true};
    const idx=state.productos.findIndex(p=>p.id===id);
    if(idx>=0) state.productos[idx]=Object.assign(state.productos[idx],next); else state.productos.unshift(next);
    saveLocal(); closeModals(); toast('Producto guardado.');
  }
  function deleteProduct(){
    const id=$('#prodId').value; if(!id) return;
    if(confirm('¿Eliminar este producto del inventario local?')){ state.productos=state.productos.filter(p=>p.id!==id); saveLocal(); closeModals(); toast('Producto eliminado.'); }
  }
  function makeSale(){
    const calc=compute($('#saleProduct').value,$('#saleQty').value,$('#saleShipType').value); if(!calc.product) return toast('No hay producto seleccionado.');
    const sale={codigo:nowCode('VENTA'),fecha:new Date().toISOString(),cliente:$('#saleClient').value.trim()||'Cliente',telefono:$('#salePhone').value.trim(),direccion:$('#saleAddress').value.trim(),productoId:calc.product.id,producto:calc.product.nombre,cantidad:calc.qty,subtotal:calc.subtotal,envio:calc.ship,comision:calc.fee,total:calc.total,tipoEnvio:calc.label};
    state.ventas.unshift(sale); calc.product.stock=Math.max(0,(Number(calc.product.stock)||0)-calc.qty); saveLocal(); toast('Venta guardada y stock actualizado.'); buildClientCard(sale,'venta'); openModal('clientModal');
  }
  function makeQuote(){
    const calc=compute($('#quoteProduct').value,$('#quoteQty').value,$('#quoteShipType').value); if(!calc.product) return toast('No hay producto seleccionado.');
    const quote={codigo:nowCode('COT'),fecha:new Date().toISOString(),cliente:$('#quoteClient').value.trim()||'Cliente',productoId:calc.product.id,producto:calc.product.nombre,cantidad:calc.qty,subtotal:calc.subtotal,envio:calc.ship,comision:calc.fee,total:calc.total,tipoEnvio:calc.label};
    state.cotizaciones.unshift(quote); saveLocal(); toast('Cotización guardada.'); buildClientCard(quote,'cotizacion'); openModal('clientModal');
  }
  function buildClientCard(record, kind){
    const p = getProduct(record.productoId) || {};
    const title = kind==='venta' ? 'Factura / Pedido' : 'Cotización';
    const phone = String(state.ajustes.whatsapp || window.SDC_CONFIG.whatsapp).replace(/\D/g,'');
    currentPhone = record.telefono || phone;
    currentCardText = `${title} ${record.codigo}\nSD COMAYAGUA\n\nCliente: ${record.cliente||'Cliente'}\nProducto: ${record.producto}\nCantidad: ${record.cantidad}\nSubtotal: ${money(record.subtotal)}\nEnvío: ${money(record.envio)}${record.comision?`\nComisión: ${money(record.comision)}`:''}\nTotal: ${money(record.total)}\n\nPara confirmar el pedido enviar nombre completo, departamento, municipio, número de celular y dirección exacta con referencia.\nWhatsApp SD COMAYAGUA: +504 3151-7755`;
    $('#clientCard').innerHTML = `
      <div class="client-top"><img src="assets/img/logo-sdc.png" alt="Logo"><div><h2>SD COMAYAGUA</h2><p>WhatsApp: +504 3151-7755 · ${escapeHtml(title)} ${escapeHtml(record.codigo)}</p></div></div>
      <img class="client-product-img" src="${escapeAttr(productImage(p))}" alt="${escapeAttr(record.producto)}" onerror="this.src='${fallbackImg}'">
      <h3>${escapeHtml(record.producto)}</h3>
      <p class="desc">${escapeHtml(p.descripcion || 'Producto disponible en SD COMAYAGUA. Consultá disponibilidad antes de confirmar tu pedido.')}</p>
      <div class="client-price">
        <div><span>Cantidad</span><b>${record.cantidad}</b></div>
        <div><span>Productos</span><b>${money(record.subtotal)}</b></div>
        <div><span>${escapeHtml(record.tipoEnvio)}</span><b>${money(record.envio)}</b></div>
        <div class="client-total"><span>Total final</span><b>${money(record.total)}</b></div>
      </div>
      <div class="client-steps"><span>1. Confirmar datos</span><span>2. Revisar disponibilidad</span><span>3. Despachar pedido</span></div>
      <p class="desc"><b>Datos necesarios:</b> nombre completo, departamento, municipio, número de celular y dirección exacta con referencia. Para envíos fuera de Comayagua, confirmar empresa de envío: C807, Forza o Cargo Expreso.</p>
      <div class="client-footer">Gracias por comprar en SD COMAYAGUA · Atención por WhatsApp</div>`;
  }
  function openProductCard(id){
    const p=getProduct(id); if(!p) return;
    const record={codigo:nowCode('FICHA'),fecha:new Date().toISOString(),cliente:'Cliente',productoId:p.id,producto:p.nombre,cantidad:1,subtotal:Number(p.precio)||0,envio:Number(state.ajustes.envioNormal)||110,comision:0,total:(Number(p.precio)||0)+(Number(state.ajustes.envioNormal)||110),tipoEnvio:'Envío Normal'};
    buildClientCard(record,'cotizacion'); openModal('clientModal');
  }
  function escapeHtml(s){ return String(s??'').replace(/[&<>"]/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
  function escapeAttr(s){ return escapeHtml(s).replace(/'/g,'&#39;'); }
  async function saveAndPing(){
    const url=$('#cfgUrl').value.trim(), pin=$('#cfgPin').value.trim(); window.SDCCloud.saveCloudConfig({url,pin}); $('#cfgStatus').textContent='Probando conexión...';
    try{ const res=await window.SDCCloud.ping(); $('#cfgStatus').textContent='Conexión guardada correctamente. Nube activa.'; toast('Nube conectada.'); renderStats(); }
    catch(e){ $('#cfgStatus').textContent=e.message; toast('No conectó. Revisá PIN, URL y permisos.'); }
  }
  async function saveCloud(){
    toast('Guardando en nube...');
    try{ await window.SDCCloud.save(state); toast('Datos enviados a Google Sheets.'); }
    catch(e){ toast(e.message); }
  }
  async function loadCloud(){
    toast('Cargando nube...');
    try{ const res=await window.SDCCloud.load(); if(res.state){ state=window.SDCStorage.normalize(res.state); saveLocal(); closeModals(); toast('Datos cargados desde nube.'); } else toast('La nube no tiene estado guardado.'); }
    catch(e){ toast(e.message); }
  }
  async function backupCloud(){
    state.meta.lastBackup=new Date().toISOString(); saveLocal(); toast('Creando respaldo en nube...');
    try{ await window.SDCCloud.backup(state); toast('Respaldo enviado a Google Sheets.'); }
    catch(e){ toast(e.message); }
  }
  function bind(){
    $$('.tab,[data-tab]').forEach(btn=>btn.addEventListener('click',e=>{ const tab=btn.dataset.tab; if(tab) setTab(tab); }));
    $$('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModals));
    $$('.modal').forEach(m=>m.addEventListener('click',e=>{ if(e.target===m) closeModals(); }));
    $('#btnOpenConfig').addEventListener('click',()=>{ const c=window.SDCCloud.getCloudConfig(); $('#cfgUrl').value=c.url||window.SDC_CONFIG.defaultAppsScriptUrl; $('#cfgPin').value=c.pin||''; openModal('configPanel'); });
    $('#btnSaveConfig').addEventListener('click',saveAndPing); $('#btnCloudNow').addEventListener('click',saveCloud); $('#btnLoadCloud').addEventListener('click',loadCloud); $('#btnBackupCloud').addEventListener('click',backupCloud);
    $('#btnClearCache').addEventListener('click',()=>{ if(confirm('Esto borra datos locales de este navegador. No borra Google Sheets. ¿Continuar?')){ localStorage.removeItem(window.SDC_CONFIG.storageKey); state=window.SDCStorage.defaultState(); saveLocal(); closeModals(); toast('Caché local limpiada.'); } });
    $('#btnRefresh').addEventListener('click',render); $('#btnNewProduct').addEventListener('click',()=>editProduct()); $('#productForm').addEventListener('submit',saveProduct); $('#btnDeleteProduct').addEventListener('click',deleteProduct);
    $('#productList').addEventListener('click',e=>{ const edit=e.target.closest('[data-edit]'); const card=e.target.closest('[data-card]'); const dup=e.target.closest('[data-dup]'); if(edit) editProduct(edit.dataset.edit); if(card) openProductCard(card.dataset.card); if(dup){ const p=getProduct(dup.dataset.dup); if(p){ const copy=Object.assign({},p,{id:'P-'+Date.now(),nombre:p.nombre+' copia'}); state.productos.unshift(copy); saveLocal(); toast('Producto duplicado.'); } } });
    ['searchInput','saleProduct','saleQty','saleShipType','quoteProduct','quoteQty','quoteShipType'].forEach(id=>$('#'+id)?.addEventListener('input',render));
    $('#btnMakeSale').addEventListener('click',makeSale); $('#btnSaleCard').addEventListener('click',()=>{ const calc=compute($('#saleProduct').value,$('#saleQty').value,$('#saleShipType').value); if(calc.product){ buildClientCard({codigo:nowCode('PREV'),cliente:$('#saleClient').value||'Cliente',telefono:$('#salePhone').value,productoId:calc.product.id,producto:calc.product.nombre,cantidad:calc.qty,subtotal:calc.subtotal,envio:calc.ship,comision:calc.fee,total:calc.total,tipoEnvio:calc.label},'venta'); openModal('clientModal'); } });
    $('#btnMakeQuote').addEventListener('click',makeQuote); $('#btnQuoteCard').addEventListener('click',()=>{ const calc=compute($('#quoteProduct').value,$('#quoteQty').value,$('#quoteShipType').value); if(calc.product){ buildClientCard({codigo:nowCode('COT'),cliente:$('#quoteClient').value||'Cliente',productoId:calc.product.id,producto:calc.product.nombre,cantidad:calc.qty,subtotal:calc.subtotal,envio:calc.ship,comision:calc.fee,total:calc.total,tipoEnvio:calc.label},'cotizacion'); openModal('clientModal'); } });
    $('#btnCopyClientText').addEventListener('click',async()=>{ try{ await navigator.clipboard.writeText(currentCardText); toast('Texto copiado para WhatsApp.'); } catch(e){ toast('No se pudo copiar automáticamente.'); } });
    $('#btnOpenWhatsApp').addEventListener('click',()=>{ const target=(currentPhone||state.ajustes.whatsapp||window.SDC_CONFIG.whatsapp).replace(/\D/g,''); window.open(`https://wa.me/${target}?text=${encodeURIComponent(currentCardText)}`,'_blank'); });
    $('#btnPrintCard').addEventListener('click',()=>window.print());
    $('#btnExport').addEventListener('click',()=>window.SDCStorage.exportJson(state));
    $('#restoreInput').addEventListener('change',async e=>{ const file=e.target.files[0]; if(!file) return; try{ const txt=await file.text(); state=window.SDCStorage.normalize(JSON.parse(txt)); saveLocal(); toast('Respaldo restaurado.'); }catch(err){ toast('No se pudo restaurar ese archivo.'); } });
  }
  document.addEventListener('DOMContentLoaded',()=>{ bind(); render(); });
})();
