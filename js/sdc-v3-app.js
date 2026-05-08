/* SDC Inventario V3: mejoras progresivas para convertir el panel en app móvil privada. */
(function(){
  'use strict';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  let raf = 0;
  let lastCommandSignature = '';

  function money(n){
    const v = Math.round(Number(n)||0);
    return 'Lps. ' + v.toLocaleString('es-HN');
  }
  function num(n){ return (Number(n)||0).toLocaleString('es-HN'); }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function todayISO(d){
    const x = d ? new Date(d) : new Date();
    if(Number.isNaN(x.getTime())) return '';
    return x.toISOString().slice(0,10);
  }
  function isToday(d){ return todayISO(d) === todayISO(); }
  function loadState(){
    try{
      if(window.SDCStore && typeof window.SDCStore.load === 'function') return window.SDCStore.load();
    }catch(e){}
    return {products:[],sales:[],quotes:[],clients:[],expenses:[],settings:{}};
  }
  function calcDocTotal(doc){
    if(!doc) return 0;
    if(Number(doc.total)) return Number(doc.total)||0;
    const items = Array.isArray(doc.items) ? doc.items : [];
    const products = items.reduce((sum,it)=> sum + (Number(it.qty||1) * Number(it.price||it.unitPrice||0)),0);
    const shipping = Number(doc.shipping||doc.shippingCost||0)||0;
    const commission = Number(doc.commission||doc.commissionAmount||0)||0;
    return Math.round(products + shipping + commission);
  }
  function stats(){
    const s = loadState();
    const products = Array.isArray(s.products) ? s.products : [];
    const sales = Array.isArray(s.sales) ? s.sales : [];
    const expenses = Array.isArray(s.expenses) ? s.expenses : [];
    const quotes = Array.isArray(s.quotes) ? s.quotes : [];
    let stock = 0, saleValue = 0, invested = 0, noCost = 0, noImage = 0, soldOut = 0, lowStock = 0;
    const lowLimit = Number(s.settings && s.settings.lowStockLimit) || 3;
    products.forEach(p=>{
      const st = Number(p.stock)||0;
      const price = Number(p.price)||0;
      const cost = Number(p.cost)||0;
      stock += st;
      saleValue += st * price;
      invested += st * cost;
      if(cost <= 0) noCost++;
      if(!String(p.image||p.imagen||'').trim() && !String(p.gallery||p.galeria||'').trim()) noImage++;
      if(st <= 0) soldOut++;
      if(st > 0 && st <= lowLimit) lowStock++;
    });
    const todaySales = sales.filter(x => isToday(x.date || x.createdAt || x.fecha));
    const todayExpenses = expenses.filter(x => isToday(x.date || x.createdAt || x.fecha));
    const soldToday = todaySales.reduce((sum,x)=> sum + calcDocTotal(x), 0);
    const expensesToday = todayExpenses.reduce((sum,x)=> sum + (Number(x.amount||x.monto)||0),0);
    const pending = sales.filter(x => /pend|pagar|recibir|credito|crédito/i.test(String(x.status||x.paymentStatus||''))).reduce((sum,x)=>sum+calcDocTotal(x),0);
    const quoteOpen = quotes.filter(x => !/vend|cerr|anul|cancel/i.test(String(x.status||''))).length;
    return {products:products.length,stock,saleValue,invested,profit:saleValue-invested,noCost,noImage,soldOut,lowStock,soldToday,expensesToday,netToday:soldToday-expensesToday,pending,quoteOpen,clients:(s.clients||[]).length};
  }
  function actionClick(action){
    const btn = $$(`[data-action="${action}"]`).find(el => !el.closest('.sdc-v3-command') && !el.closest('.sdc-v3-bottom'));
    if(btn){ btn.click(); return true; }
    return false;
  }
  function setSearch(term){
    const input = $('#searchInput');
    if(!input) return false;
    input.focus({preventScroll:true});
    input.value = term;
    input.dispatchEvent(new Event('input', {bubbles:true}));
    setTimeout(()=>$('#inventario')?.scrollIntoView({behavior:'smooth', block:'start'}),80);
    return true;
  }
  function copyText(text){
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(()=>toast('Resumen copiado.')).catch(()=>fallbackCopy(text));
    }else fallbackCopy(text);
  }
  function fallbackCopy(text){
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    try{document.execCommand('copy'); toast('Resumen copiado.');}catch(e){toast('No se pudo copiar.');}
    ta.remove();
  }
  function toast(msg){
    const t = $('#toast');
    if(!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>t.classList.remove('show'),2200);
  }
  function summaryText(){
    const st = stats();
    return [
      'RESUMEN PRIVADO SD COMAYAGUA',
      'Productos: ' + num(st.products),
      'Stock total: ' + num(st.stock),
      'Valor de venta: ' + money(st.saleValue),
      'Invertido: ' + money(st.invested),
      'Ganancia estimada: ' + money(st.profit),
      'Vendido hoy: ' + money(st.soldToday),
      'Gastos hoy: ' + money(st.expensesToday),
      'Neto hoy: ' + money(st.netToday),
      'Alertas: ' + num(st.lowStock) + ' bajo stock, ' + num(st.soldOut) + ' agotados, ' + num(st.noCost) + ' sin costo, ' + num(st.noImage) + ' sin imagen.'
    ].join('\n');
  }
  function commandSignature(){
    const st = stats();
    return JSON.stringify({products:st.products,stock:st.stock,saleValue:st.saleValue,invested:st.invested,profit:st.profit,noCost:st.noCost,noImage:st.noImage,soldOut:st.soldOut,lowStock:st.lowStock,soldToday:st.soldToday,expensesToday:st.expensesToday,netToday:st.netToday,pending:st.pending,quoteOpen:st.quoteOpen,clients:st.clients});
  }
  function commandHTML(){
    const st = stats();
    const riskClass = st.soldOut || st.noCost ? 'danger' : (st.lowStock ? 'warn' : 'good');
    return `
      <section class="sdc-v3-command no-print" data-sdc-v3="command">
        <div class="sdc-v3-glass">
          <div class="sdc-v3-row">
            <div class="sdc-v3-title">
              <div class="sdc-v3-orb">SD</div>
              <div><b>Centro de control V3</b><span>Resumen rápido para vender, cotizar y revisar inventario desde celular.</span></div>
            </div>
          </div>
          <div class="sdc-v3-health">
            <button class="sdc-v3-health-card good" data-v3-action="receipts" type="button"><small>Vendido hoy</small><b>${money(st.soldToday)}</b><span>Neto ${money(st.netToday)}</span></button>
            <button class="sdc-v3-health-card ${riskClass}" data-v3-action="lowStock" type="button"><small>Alertas</small><b>${num(st.lowStock + st.soldOut + st.noCost)}</b><span>${num(st.lowStock)} bajo · ${num(st.soldOut)} agot.</span></button>
            <button class="sdc-v3-health-card" data-v3-action="profit" type="button"><small>Ganancia estimada</small><b>${money(st.profit)}</b><span>Venta ${money(st.saleValue)}</span></button>
            <button class="sdc-v3-health-card ${st.noImage?'warn':''}" data-v3-action="noImage" type="button"><small>Sin imagen</small><b>${num(st.noImage)}</b><span>Mejora catálogo</span></button>
          </div>
          <div class="sdc-v3-actions">
            <button class="sdc-v3-action primary" data-v3-action="quote" type="button"><i>▧</i><b>Cotizar</b><span>Pedido para cliente</span></button>
            <button class="sdc-v3-action" data-v3-action="quickSale" type="button"><i>⚡</i><b>Venta rápida</b><span>Producto + total</span></button>
            <button class="sdc-v3-action" data-v3-action="newProduct" type="button"><i>＋</i><b>Producto</b><span>Agregar stock</span></button>
            <button class="sdc-v3-action" data-v3-action="receipts" type="button"><i>▤</i><b>Caja</b><span>Ventas del día</span></button>
            <button class="sdc-v3-action" data-v3-action="clients" type="button"><i>◉</i><b>Clientes</b><span>Agenda</span></button>
            <button class="sdc-v3-action" data-v3-action="backup" type="button"><i>⤓</i><b>Respaldo</b><span>Guardar copia</span></button>
          </div>
          <div class="sdc-v3-note">
            <p><b>Consejo:</b> use Cliente o Captura antes de enviar la foto para ocultar inversión y ganancia.</p>
            <button class="sdc-v3-copy" data-v3-action="copySummary" type="button">Copiar resumen</button>
          </div>
        </div>
      </section>`;
  }
  function bottomHTML(){
    return `<nav class="sdc-v3-bottom no-print" data-sdc-v3="bottom" aria-label="Navegación rápida V3">
      <button type="button" data-v3-action="home"><i>⌂</i><span>Inicio</span></button>
      <button type="button" data-v3-action="focusSearch"><i>⌕</i><span>Buscar</span></button>
      <button type="button" class="primary" data-v3-action="quote"><i>▧</i><span>Cotizar</span></button>
      <button type="button" data-v3-action="quickSale"><i>⚡</i><span>Vender</span></button>
      <button type="button" data-v3-action="receipts"><i>▤</i><span>Caja</span></button>
    </nav>`;
  }
  function inject(){
    if(!document.body) return;
    document.body.classList.add('sdc-v3-app');
    const app = $('#app');
    if(!app || app.querySelector('[data-sdc-loading="1"]') || app.classList.contains('login-wrap')) return;
    const hero = $('.hero', app);
    if(hero && !app.querySelector('[data-sdc-v3="command"]')){
      hero.insertAdjacentHTML('afterend', commandHTML());
      lastCommandSignature = commandSignature();
    }
    if(!document.querySelector('[data-sdc-v3="bottom"]')){
      document.body.insertAdjacentHTML('beforeend', bottomHTML());
    }
  }
  function refresh(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const old = $('[data-sdc-v3="command"]');
      const sig = commandSignature();
      if(old && sig !== lastCommandSignature){
        old.outerHTML = commandHTML();
        lastCommandSignature = sig;
      }
      inject();
    });
  }
  document.addEventListener('click', function(ev){
    const btn = ev.target.closest('[data-v3-action]');
    if(!btn) return;
    const a = btn.dataset.v3Action;
    ev.preventDefault();
    if(a==='home') return window.scrollTo({top:0,behavior:'smooth'});
    if(a==='focusSearch'){
      const input=$('#searchInput');
      if(input){ input.focus({preventScroll:false}); input.scrollIntoView({behavior:'smooth',block:'center'}); }
      return;
    }
    if(a==='copySummary') return copyText(summaryText());
    if(a==='lowStock') return actionClick('lowStock') || setSearch('');
    if(a==='noImage') return toast('Filtra visualmente: los productos sin imagen muestran el placeholder. Revisa esos productos desde Editar.');
    if(a==='noCost') return actionClick('noCost');
    actionClick(a);
  }, true);

  window.addEventListener('storage', refresh);
  window.addEventListener('scroll', () => document.body.classList.toggle('sdc-scrolled', scrollY > 20), {passive:true});

  const observer = new MutationObserver(refresh);
  function start(){
    inject();
    if(document.body) observer.observe(document.body, {childList:true, subtree:true});
    setTimeout(inject, 350);
    setTimeout(inject, 1100);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
