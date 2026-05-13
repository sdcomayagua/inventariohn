(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  let raf = 0;

  const quickMeta = {
    cardClient: ['Cliente', 'Vista limpia', '👁'],
    captureClean: ['Captura', 'Foto limpia', '▣'],
    quote: ['Cotizar', 'Calcular total', 'L'],
    sell: ['Vender', 'Registrar venta', '✓'],
    catalog: ['Catálogo', 'Ver productos', '⌂'],
    newProduct: ['Producto', 'Agregar nuevo', '+'],
    quickSale: ['Rápida', 'Venta ágil', '⚡'],
    quotes: ['Guardadas', 'Cotizaciones', '▤'],
    clients: ['Clientes', 'Agenda', '◎'],
    receipts: ['Caja', 'Ventas', '$'],
    profit: ['Ganancia', 'Control interno', '↗'],
    backup: ['Respaldo', 'Copia segura', '⬢']
  };

  function setText(el, text){
    if(el && typeof text === 'string' && el.textContent.trim() !== text) el.textContent = text;
  }

  function enhanceMeta(){
    document.body.classList.add('sdc-v52-mobile-premium');
    document.documentElement.style.setProperty('--cyan', '#d8b76a');
    document.documentElement.style.setProperty('--mint', '#f0d487');
    document.documentElement.style.setProperty('--green', '#caa45e');
    const theme = document.querySelector('meta[name="theme-color"]');
    if(theme) theme.setAttribute('content', '#11100f');
    if(document.title.includes('V51')) document.title = 'SD Comayagua · Ventas Móvil V52';
  }

  function enhanceHero(){
    setText($('.v51-kicker'), 'Panel móvil');
    const heroTitle = $('.hero h2');
    if(heroTitle && /Ventas más rápidas|inventario más claro/i.test(heroTitle.textContent)){
      heroTitle.remove();
    }
    const heroText = $('.hero p');
    if(heroText && /Gestiona productos|cotiza/i.test(heroText.textContent)){
      heroText.remove();
    }
    const buttons = $$('.v51-hero-actions button');
    if(buttons[0]) buttons[0].textContent = 'Vender';
    if(buttons[1]) buttons[1].textContent = 'Cotizar';
    if(buttons[2]) buttons[2].textContent = '+ Producto';
  }

  function enhanceQuick(){
    $$('.quick-btn').forEach(btn => {
      const meta = quickMeta[btn.dataset.action];
      if(!meta) return;
      const [title, sub, icon] = meta;
      const b = btn.querySelector('b');
      const small = btn.querySelector('small');
      setText(b, title);
      setText(small, sub);
      btn.setAttribute('data-v52-icon', icon);
      btn.setAttribute('aria-label', `${title}: ${sub}`);
    });
  }

  function enhanceSearch(){
    const searchPanel = $('#searchPanel');
    if(searchPanel){
      const title = searchPanel.querySelector('.search-title b');
      const helper = searchPanel.querySelector('.search-title span');
      setText(title, 'Buscar producto');
      setText(helper, 'Nombre, código o categoría');
    }
    const input = $('#searchInput');
    if(input){
      input.setAttribute('placeholder', 'Buscar producto...');
      input.setAttribute('enterkeyhint', 'search');
      input.setAttribute('autocapitalize', 'none');
    }
  }

  function enhanceInventoryHead(){
    const invCopy = $('#inventario .section-head p');
    if(invCopy) invCopy.textContent = 'Productos listos para ver, cotizar, vender o compartir.';
    const newBtn = $('.inventory-new-btn');
    if(newBtn) newBtn.textContent = '+ Producto';
    $$('.layout-toggle button').forEach(btn => {
      if(btn.textContent.trim() === '1 fila') btn.textContent = 'Grande';
      if(btn.textContent.trim() === '2 fila') btn.textContent = 'Compacta';
    });
  }

  function enhanceCategories(){
    const catCopy = $('.category-head p');
    if(catCopy) catCopy.textContent = 'Toca una categoría para filtrar el inventario.';
  }

  function enhanceCards(){
    $$('.product-card-v49').forEach(card => {
      card.setAttribute('data-v52-card', '1');
      const buttons = $$('.v49-card-actions button', card);
      if(buttons[0]) buttons[0].setAttribute('aria-label', 'Ver producto');
      if(buttons[1]) buttons[1].setAttribute('aria-label', 'Cotizar producto');
      if(buttons[2]) buttons[2].setAttribute('aria-label', 'Vender producto');
      if(buttons[3]) buttons[3].setAttribute('aria-label', 'Enviar por WhatsApp');
    });
  }

  function enhance(){
    enhanceMeta();
    enhanceHero();
    enhanceQuick();
    enhanceSearch();
    enhanceInventoryHead();
    enhanceCategories();
    enhanceCards();
  }

  function schedule(){
    if(raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      enhance();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    enhance();
    const app = document.getElementById('app');
    if(app) new MutationObserver(schedule).observe(app, {childList:true, subtree:true});
  });
  window.addEventListener('resize', schedule, {passive:true});
})();
