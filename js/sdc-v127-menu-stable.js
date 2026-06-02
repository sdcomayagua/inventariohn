/* SDC V179: menú premium azul, compacto y moderno. */
(function(){
  'use strict';

  const STORE_KEY = 'sdc_control_ventas_v90';
  const LOGO = 'assets/logo-sdc.png';
  let bound = false;

  function ensureCss(){ return; }

  function state(){
    try{ return window.SDCStore && window.SDCStore.load ? window.SDCStore.load() : JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); }
    catch(e){ return {products:[],sales:[],quotes:[]}; }
  }
  function n(v){ return Number(v)||0; }
  function money(v){ return 'Lps. ' + n(v).toLocaleString('es-HN',{maximumFractionDigits:0}); }
  function esc(s){ return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function stock(p){ return Array.isArray(p.colors)&&p.colors.length ? p.colors.reduce((a,r)=>a+n(r.qty),0) : n(p.stock); }
  function totalSale(s){ return n(s.total)||n(s.grandTotal)||(s.items||[]).reduce((a,it)=>a+n(it.total||n(it.price)*n(it.qty||1)),0); }
  function profitSale(s){ return (s.items||[]).reduce((a,it)=>a+(n(it.price)-n(it.cost))*n(it.qty||1),0); }
  function isToday(d){ const a=new Date(d||Date.now()), b=new Date(); return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function toast(msg){ const el=document.getElementById('toast'); if(el){ el.textContent=msg; el.classList.add('show'); clearTimeout(el._v127); el._v127=setTimeout(()=>el.classList.remove('show'),2200); } }

  function removeOldMenu(){
    document.querySelectorAll('.sdc-menu-fab-v116,.sdc-menu-backdrop-v116,.sdc-menu-drawer-v116').forEach(el=>el.remove());
  }
  function openMenu(){ document.body.classList.add('sdc-menu-open-v116'); }
  function closeMenu(){ document.body.classList.remove('sdc-menu-open-v116'); }
  function closePanels(){ document.querySelectorAll('.sdc-menu-modal-v116').forEach(el=>el.remove()); }

  function menuIcon(name){
    const icons = {
      home:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.2 12 4l9 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-4.2v-6.4H8.7V21H4.5A1.5 1.5 0 0 1 3 19.5v-8.3Z"/></svg>',
      grid:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z"/></svg>',
      bolt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4.8 13.4h6L9.7 22 19.2 9.7h-6.1L13 2Z"/></svg>',
      file:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6V3Zm7 1.8V8h3.2M8.7 12h6.6M8.7 16h6.6"/></svg>',
      dollar:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M16.5 7.4c-1-1-2.5-1.5-4-1.5-2.2 0-4 1-4 2.8 0 4 8 1.7 8 5.8 0 1.8-1.8 3-4.2 3-1.9 0-3.8-.7-4.9-2"/></svg>',
      receipt:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-2.2-1.3-2.1 1.3-2.1-1.3L9.5 21 6 19V3Zm3 6h6M9 13h6M9 17h4"/></svg>',
      bell:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10.8c0-3.2-2.2-5.5-6-5.5s-6 2.3-6 5.5v4.4L4.4 18h15.2L18 15.2v-4.4ZM9.8 20.2h4.4"/></svg>',
      box:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 4.5 7v10L12 21l7.5-4V7L12 3Zm0 0v8m7.5-4L12 11 4.5 7"/></svg>',
      cart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l1.4 9.2h9.8L19.5 8H7.1M9 19.2h.1M17 19.2h.1"/></svg>',
      shield:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5.8c0 4.2-2.7 7.4-7 9.2-4.3-1.8-7-5-7-9.2V6l7-3Z"/></svg>',
      arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>'
    };
    return icons[name] || icons.grid;
  }

  function menuItem(action, icon, title, subtitle, extraClass=''){
    return `<button class="sdc-menu-item-v116 sdc-menu-item-v179 ${extraClass}" type="button" data-sdc127="${action}">
      <i>${menuIcon(icon)}</i><span>${title}</span><small>${subtitle}</small>
    </button>`;
  }

  function renderMenu(){
    removeOldMenu();
    document.body.insertAdjacentHTML('beforeend', `
      <button class="sdc-menu-fab-v116 no-print" type="button" data-sdc127="open" aria-label="Abrir menú">☰</button>
      <div class="sdc-menu-backdrop-v116 no-print" data-sdc127="close"></div>
      <aside class="sdc-menu-drawer-v116 sdc-menu-drawer-v179 no-print" aria-label="Menú de SD Comayagua" role="dialog" aria-modal="true">
        <div class="sdc-menu-head-v116 sdc-menu-head-v179">
          <div class="sdc-menu-brand-v116 sdc-menu-brand-v179"><img src="${LOGO}" alt="SD"><div><b>SD Comayagua</b><span>Accesos rápidos</span></div></div>
          <button class="sdc-menu-close-v116 sdc-menu-close-v179" type="button" data-sdc127="close" aria-label="Cerrar menú">×</button>
        </div>

        <button class="sdc-menu-feature-v179" type="button" data-sdc127="vender">
          <i>${menuIcon('cart')}</i>
          <span><b>Vender</b><small>Crear nuevo recibo</small></span>
          <em>${menuIcon('arrow')}</em>
        </button>

        <div class="sdc-menu-separator-v179"></div>
        <p class="sdc-menu-kicker-v179">Menú</p>

        <div class="sdc-menu-grid-v116 sdc-menu-grid-v179">
          ${menuItem('inicio','home','Inicio','Panel principal')}
          ${menuItem('productos','grid','Productos','Catálogo')}
          ${menuItem('vender','bolt','Vender','Crear recibo')}
          ${menuItem('cotizar','file','Cotizar','Nueva cotización')}
          ${menuItem('ganancias','dollar','Ganancias','Utilidad y reportes')}
          ${menuItem('recibos','receipt','Recibos','Historial de caja')}
          ${menuItem('alertas','bell','Alertas','Inventario y más')}
          ${menuItem('nuevo','box','Inventario','Stock y existencias')}
        </div>

        <button class="sdc-menu-footer-v179" type="button" data-sdc127="productos">
          <i>${menuIcon('shield')}</i>
          <span><b>SD Comayagua</b><small>Soluciones para tu negocio</small></span>
          <em>${menuIcon('arrow')}</em>
        </button>
      </aside>`);
  }

  function goPage(page){
    closeMenu();
    closePanels();
    if(window.SDCSetPageV97) window.SDCSetPageV97(page,{smooth:false});
    else { localStorage.setItem('sdc_v97_page', page); location.reload(); }
  }

  function findVisibleButton(words){
    const list = Array.from(document.querySelectorAll('button,a,[role="button"]'));
    const targets = words.map(w=>w.toLowerCase());
    for(const el of list){
      if(el.closest('.sdc-menu-drawer-v116,.sdc-menu-modal-v116')) continue;
      const box = el.getBoundingClientRect();
      const visible = box.width > 4 && box.height > 4;
      if(!visible) continue;
      const txt = (el.textContent || el.getAttribute('aria-label') || '').toLowerCase().replace(/\s+/g,' ').trim();
      if(targets.some(w=>txt.includes(w))) return el;
    }
    return null;
  }

  function runHomeButton(words, fallbackMsg){
    closeMenu();
    closePanels();
    goPage('inicio');
    setTimeout(()=>{
      const btn = findVisibleButton(words);
      if(btn) btn.click();
      else toast(fallbackMsg || 'No encontré el botón en Inicio.');
    }, 260);
  }

  function modal(title, html){
    closeMenu();
    closePanels();
    const div = document.createElement('div');
    div.className = 'sdc-menu-modal-v116';
    div.innerHTML = `<section class="sdc-menu-modal-card-v116" role="dialog" aria-modal="true">
      <header class="sdc-menu-modal-head-v116"><h3>${esc(title)}</h3><button type="button" data-sdc127-panel-close>×</button></header>
      <div class="sdc-menu-modal-body-v116">${html}</div>
    </section>`;
    div.addEventListener('click', ev=>{ if(ev.target===div || ev.target.closest('[data-sdc127-panel-close]')) closePanels(); });
    document.body.appendChild(div);
  }

  function openGains(){
    const s=state(), products=s.products||[], sales=s.sales||[];
    const invested = products.reduce((a,p)=>a+n(p.cost)*stock(p),0);
    const estimated = products.reduce((a,p)=>a+(n(p.price)-n(p.cost))*stock(p),0);
    const todayProfit = sales.filter(x=>isToday(x.date)).reduce((a,x)=>a+profitSale(x),0);
    const rows = products.slice(0,25).map(p=>`<div class="sdc-list-row-v116"><div><b>${esc(p.name)}</b><span>Costo ${money(p.cost)} · Venta ${money(p.price)} · Stock ${stock(p)}</span></div><em class="sdc-pill-v116">${money(n(p.price)-n(p.cost))}</em></div>`).join('');
    modal('Ganancias', `<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Ganancia estimada</span><b>${money(estimated)}</b></div><div class="sdc-mini-stat-v116"><span>Invertido</span><b>${money(invested)}</b></div><div class="sdc-mini-stat-v116"><span>Ganancia hoy</span><b>${money(todayProfit)}</b></div><div class="sdc-mini-stat-v116"><span>Productos</span><b>${products.length}</b></div></div><div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">No hay productos.</div>'}</div>`);
  }

  function openReceipts(){
    const s=state(), sales=s.sales||[], todaySales=sales.filter(x=>isToday(x.date));
    const rows = sales.slice(0,40).map(x=>`<div class="sdc-list-row-v116"><div><b>${esc(x.client||'Cliente')}</b><span>${esc(x.id||'Recibo')} · ${new Date(x.date||Date.now()).toLocaleString('es-HN')}</span></div><em class="sdc-pill-v116">${money(totalSale(x))}</em></div>`).join('');
    modal('Recibos / Caja', `<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Ventas hoy</span><b>${money(todaySales.reduce((a,x)=>a+totalSale(x),0))}</b></div><div class="sdc-mini-stat-v116"><span>Recibos hoy</span><b>${todaySales.length}</b></div></div><div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">Todavía no hay recibos.</div>'}</div>`);
  }

  function openAlerts(){
    const s=state(), products=s.products||[], alerts=[];
    products.forEach(p=>{
      if(stock(p)<=0) alerts.push([p.name,'Stock en cero','Agotado']);
      else if(stock(p)<=3) alerts.push([p.name,`Solo ${stock(p)} unidades`,'Bajo stock']);
      if(!String(p.image||p.gallery||'').trim()) alerts.push([p.name,'Agrega imagen','Sin foto']);
      if(n(p.price)-n(p.cost)<10) alerts.push([p.name,`Ganancia ${money(n(p.price)-n(p.cost))}`,'Revisar']);
    });
    const rows=alerts.slice(0,70).map(x=>`<div class="sdc-list-row-v116"><div><b>${esc(x[0])}</b><span>${esc(x[1])}</span></div><em class="sdc-pill-v116">${esc(x[2])}</em></div>`).join('');
    modal('Alertas', `<div class="sdc-mini-stats-v116"><div class="sdc-mini-stat-v116"><span>Total alertas</span><b>${alerts.length}</b></div><div class="sdc-mini-stat-v116"><span>Productos</span><b>${products.length}</b></div></div><div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">No hay alertas.</div>'}</div>`);
  }

  function openQuotes(){
    const q=(state().quotes||[]);
    const rows=q.slice(0,40).map(x=>`<div class="sdc-list-row-v116"><div><b>${esc(x.client||'Cliente')}</b><span>${esc(x.id||'Cotización')} · ${new Date(x.date||Date.now()).toLocaleString('es-HN')}</span></div><em class="sdc-pill-v116">${money(totalSale(x))}</em></div>`).join('');
    modal('Cotizaciones', `<div class="sdc-list-v116">${rows || '<div class="sdc-empty-v116">No hay cotizaciones guardadas.</div>'}</div>`);
  }

  function newProduct(){
    closeMenu();
    closePanels();
    goPage('productos');
    setTimeout(()=>{
      const btn=findVisibleButton(['nuevo producto','+ producto','producto']);
      if(btn) btn.click();
      else toast('No encontré el botón Nuevo producto.');
    }, 300);
  }

  function handle(action){
    if(!action) return;
    if(action==='open') return openMenu();
    if(action==='close') return closeMenu();
    if(action==='inicio') return goPage('inicio');
    if(action==='productos') return goPage('productos');
    if(action==='vender') return runHomeButton(['vender ahora','vender'], 'Abre Inicio y toca Vender ahora.');
    if(action==='cotizar') return runHomeButton(['cotizar'], 'Abre Inicio y toca Cotizar.');
    if(action==='ganancias') return openGains();
    if(action==='recibos') return openReceipts();
    if(action==='alertas') return openAlerts();
    if(action==='cotizaciones') return openQuotes();
    if(action==='nuevo') return newProduct();
  }

  function bind(){
    if(bound) return;
    bound = true;
    document.addEventListener('click', ev=>{
      const node = ev.target.closest('[data-sdc127]');
      if(!node) return;
      ev.preventDefault();
      ev.stopPropagation();
      handle(node.dataset.sdc127);
    }, false);
    document.addEventListener('keydown', ev=>{ if(ev.key==='Escape'){ closeMenu(); closePanels(); } });
  }

  function boot(){
    ensureCss();
    renderMenu();
    bind();
  }

  window.SDCMenuV127 = {boot, openMenu, closeMenu};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
