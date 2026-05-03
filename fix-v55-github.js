/* ==========================================================
   SDC V55 - Correcciones para GitHub Pages + modo localStorage
   ========================================================== */
(function () {
  'use strict';

  const LOCAL_PRODUCTS_KEY = 'sdc_v55_products_local';
  const LOCAL_MODE_KEY = 'sdc_v55_mode';
  const DEFAULT_PASS_TEXT = '199311';

  function q(id) { return document.getElementById(id); }
  function money(n) {
    return 'Lps. ' + Number(n || 0).toLocaleString('es-HN', { maximumFractionDigits: 0 });
  }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"]|'/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[ch];
    });
  }
  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch (_) { return fallback; }
  }
  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function dataSvg(title, subtitle, colorA, colorB) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colorA}"/><stop offset="1" stop-color="${colorB}"/></linearGradient></defs>
      <rect width="1200" height="1200" rx="86" fill="url(#g)"/>
      <rect x="92" y="92" width="1016" height="1016" rx="74" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.28)" stroke-width="2"/>
      <circle cx="840" cy="290" r="140" fill="rgba(255,255,255,.16)"/>
      <circle cx="334" cy="820" r="210" fill="rgba(255,255,255,.12)"/>
      <text x="600" y="555" text-anchor="middle" font-family="Poppins,Inter,Arial" font-size="78" font-weight="900" fill="#fff">${esc(title)}</text>
      <text x="600" y="640" text-anchor="middle" font-family="Poppins,Inter,Arial" font-size="34" font-weight="700" fill="rgba(255,255,255,.82)">${esc(subtitle)}</text>
      <text x="600" y="1015" text-anchor="middle" font-family="Poppins,Inter,Arial" font-size="28" font-weight="800" fill="rgba(255,255,255,.72)">SD COMAYAGUA</text>
    </svg>`;
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
  }
  function sampleProducts() {
    return [
      {
        id: 'SDC-001', sku: 'SDC-001', name: 'Dedales Gamer', category: 'Gamer', price: 25, cost: 8, qty: 20,
        images: JSON.stringify([dataSvg('DEDALES', 'Gamer táctiles', '#0759c7', '#12bff3')]),
        notes: 'Ideales para Free Fire, PUBG y juegos táctiles. Precio por par.',
      },
      {
        id: 'SDC-002', sku: 'SDC-002', name: 'Gatillos Gamer para Celular', category: 'Gamer', price: 190, cost: 95, qty: 8,
        images: JSON.stringify([dataSvg('GATILLOS', 'Mayor precisión', '#0f2f74', '#0ea5e9')]),
        notes: 'Accesorio para mejorar el control en juegos móviles.',
      },
      {
        id: 'SDC-003', sku: 'SDC-003', name: 'Enfriador para Celular', category: 'Tecnología', price: 400, cost: 230, qty: 5,
        images: JSON.stringify([dataSvg('ENFRIADOR', 'Para celular', '#10233f', '#38bdf8')]),
        notes: 'Ayuda a reducir calentamiento durante juegos, directos o uso intenso.',
      }
    ];
  }
  function normalizeProduct(item) {
    const qty = Number(item?.qty ?? item?.stock ?? item?.cantidad ?? item?.existencias ?? 0) || 0;
    const price = Number(item?.price ?? item?.precio ?? item?.precio_actual ?? 0) || 0;
    const id = String(item?.id || item?.sku || item?.codigo || ('SDC-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)));
    let images = item?.images ?? item?.imagenes ?? item?.galeria ?? '[]';
    if (Array.isArray(images)) images = JSON.stringify(images.filter(Boolean));
    if (typeof images !== 'string') images = '[]';
    return {
      ...item,
      id,
      sku: String(item?.sku || item?.codigo || id),
      name: String(item?.name || item?.nombre || 'Producto sin nombre'),
      category: String(item?.category || item?.categoria || 'General'),
      price,
      cost: Number(item?.cost ?? item?.costo ?? 0) || 0,
      qty,
      stock: qty,
      images,
      notes: String(item?.notes || item?.nota || item?.descripcion || '')
    };
  }
  function getLocalProducts() {
    let list = readJson(LOCAL_PRODUCTS_KEY, null);
    if (!Array.isArray(list) || !list.length) {
      const cached = readJson(STORAGE_KEYS.inventoryCache, null);
      if (cached && Array.isArray(cached.products) && cached.products.length) list = cached.products;
    }
    if (!Array.isArray(list) || !list.length) list = sampleProducts();
    list = list.map(normalizeProduct);
    writeJson(LOCAL_PRODUCTS_KEY, list);
    try { cacheInventoryResponse({ products: list, history: [] }); } catch (_) {}
    return list;
  }
  function setLocalProducts(list) {
    const clean = (Array.isArray(list) ? list : []).map(normalizeProduct);
    writeJson(LOCAL_PRODUCTS_KEY, clean);
    try { cacheInventoryResponse({ products: clean, history: [] }); } catch (_) {}
    return clean;
  }
  function refreshLocalUi(message) {
    PRODUCTS = enrichProducts(getLocalProducts());
    FILTERED = PRODUCTS.slice();
    LAST_SYNC_AT = new Date();
    try { loadCategories(); } catch (_) {}
    try { updateDashboard(); } catch (_) {}
    try { renderServerHistory([]); } catch (_) {}
    try { applyFilters(); } catch (_) { try { renderProducts(); } catch (__) {} }
    try { updateNetworkStatus(); } catch (_) {}
    if (message) try { showToast(message); } catch (_) {}
  }

  // Fuerza modo claro para evitar pantallas grises/oscuras guardadas en localStorage.
  try { localStorage.setItem(STORAGE_KEYS.themeMode, 'light'); } catch (_) {}

  window.showLoginErrorV55 = function (text) {
    const panel = document.querySelector('.login-panel');
    if (!panel) { alert(text); return; }
    let box = panel.querySelector('.login-error-v55');
    if (!box) {
      box = document.createElement('div');
      box.className = 'login-error-v55';
      const btn = panel.querySelector('.premium-login-btn') || panel.querySelector('button');
      if (btn && btn.parentNode) btn.parentNode.insertBefore(box, btn);
      else panel.appendChild(box);
    }
    box.textContent = text;
  };

  // Login corregido: mensaje elegante y advertencia si no se cambió la contraseña.
  window.invLogin = invLogin = function () {
    const username = (q('inv-user')?.value || '').trim().toLowerCase();
    const password = (q('inv-pass')?.value || '').trim();
    const user = USERS[username];
    if (!user || user.password !== password || user.password === DEFAULT_PASS_TEXT) {
      window.showLoginErrorV55(user && user.password === DEFAULT_PASS_TEXT
        ? 'Cambia ADMIN_PASS dentro del archivo antes de usar el acceso.'
        : 'Acceso no autorizado');
      return;
    }
    saveSession(username);
    window.location.href = 'inventario.html';
  };

  // GitHub Pages/localStorage: la app ya no queda vacía si el backend no responde.
  window.loadProducts = loadProducts = async function (showRefreshFeedback) {
    try {
      if (showRefreshFeedback) showLoading(true, 'Actualizando inventario local...');
      refreshLocalUi(showRefreshFeedback ? 'Inventario local actualizado.' : '');
    } finally {
      try { showLoading(false); } catch (_) {}
    }
  };

  // Operaciones locales para agregar, editar, borrar y ajustar stock.
  window.postToApi = postToApi = async function (payload) {
    const action = String(payload?.action || '').toLowerCase();
    let list = getLocalProducts();
    if (action === 'add') {
      const next = normalizeProduct({
        id: payload.id || ('SDC-' + Date.now()),
        sku: payload.id || ('SDC-' + Date.now()),
        name: payload.name,
        category: payload.category,
        price: payload.price,
        qty: payload.qty,
        images: payload.images || '[]'
      });
      list.unshift(next);
    } else if (action === 'edit') {
      const id = String(payload.id || '');
      const idx = list.findIndex(p => String(p.id) === id);
      const next = normalizeProduct({
        ...(idx >= 0 ? list[idx] : {}),
        id: id || undefined,
        name: payload.name,
        category: payload.category,
        price: payload.price,
        qty: payload.qty,
        images: payload.images || (idx >= 0 ? list[idx].images : '[]')
      });
      if (idx >= 0) list[idx] = next; else list.unshift(next);
    } else if (action === 'delete') {
      const id = String(payload.id || '');
      list = list.filter(p => String(p.id) !== id);
    } else if (action === 'stock') {
      const id = String(payload.id || '');
      list = list.map(p => {
        if (String(p.id) !== id) return p;
        const qty = Math.max(0, Number(p.qty || 0) + Number(payload.change || 0));
        return { ...p, qty, stock: qty };
      });
    }
    setLocalProducts(list);
    return JSON.stringify({ ok: true, mode: 'localStorage' });
  };

  // Importación corregida para guardar directamente en localStorage.
  window.importInventoryBackup = importInventoryBackup = async function (input) {
    const file = input?.files?.[0];
    if (!file) return;
    try {
      showLoading(true, 'Importando respaldo...');
      const data = JSON.parse(await file.text());
      if (data.productMeta) writeStore(STORAGE_KEYS.productMeta, data.productMeta);
      if (data.sales) writeStore(STORAGE_KEYS.sales, data.sales);
      if (data.movements) writeStore(STORAGE_KEYS.movements, data.movements);
      if (data.receipts) writeStore(STORAGE_KEYS.receipts, data.receipts);
      const items = Array.isArray(data.products) ? data.products : [];
      setLocalProducts(items.length ? items : sampleProducts());
      refreshLocalUi('Respaldo importado correctamente.');
    } catch (err) {
      console.error(err);
      alert('No se pudo importar el respaldo. Revisa que sea un JSON válido.');
    } finally {
      if (input) input.value = '';
      try { showLoading(false); } catch (_) {}
    }
  };

  function copyText(text, okMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => showToast(okMessage)).catch(() => fallbackCopy(text, okMessage));
    } else fallbackCopy(text, okMessage);
  }
  function fallbackCopy(text, okMessage) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); showToast(okMessage); } catch (_) { alert(text); }
    area.remove();
  }
  function salesText(product) {
    const benefits = String(product.notes || '').trim();
    return [
      `Producto: ${product.name}`,
      `Precio: ${money(product.price)}`,
      `Disponible en SD COMAYAGUA.`,
      benefits ? `Detalle: ${benefits}` : '',
      `Para pedidos escribir al WhatsApp +504 3151-7755.`
    ].filter(Boolean).join('\n');
  }
  window.copyProductSalesTextV55 = function () {
    const product = getProductById(ACTIVE_DETAIL_ID);
    if (!product) return;
    copyText(salesText(product), 'Texto de venta copiado.');
  };
  window.copyProductImagesV55 = function () {
    const product = getProductById(ACTIVE_DETAIL_ID);
    if (!product) return;
    let images = [];
    try { images = JSON.parse(product.images || '[]'); } catch (_) {}
    copyText(images.join('\n'), images.length ? 'Enlaces de imágenes copiados.' : 'Este producto no tiene enlaces externos de imágenes.');
  };

  // Botones extra en la ficha del producto: galería/texto listo para cliente.
  const oldViewProduct = window.viewProduct || viewProduct;
  window.viewProduct = viewProduct = function (id) {
    oldViewProduct(id);
    setTimeout(function () {
      const actions = document.querySelector('#detail-modal .detail-actions');
      if (!actions || actions.dataset.v55Ready) return;
      actions.dataset.v55Ready = '1';
      const btnText = document.createElement('button');
      btnText.className = 'btn-secondary';
      btnText.type = 'button';
      btnText.textContent = 'Copiar texto';
      btnText.onclick = window.copyProductSalesTextV55;
      const btnImgs = document.createElement('button');
      btnImgs.className = 'btn-secondary';
      btnImgs.type = 'button';
      btnImgs.textContent = 'Copiar fotos';
      btnImgs.onclick = window.copyProductImagesV55;
      actions.appendChild(btnText);
      actions.appendChild(btnImgs);
    }, 30);
  };

  // Ajustes de carga visual y limpieza de textos.
  function bootV55() {
    document.body.classList.add('v55-github-ready');
    localStorage.setItem(LOCAL_MODE_KEY, 'localStorage');
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) heroTitle.textContent = 'Caja móvil privada';
    const heroCopy = document.querySelector('.hero-copy');
    if (heroCopy) heroCopy.textContent = 'Catálogo compacto, venta rápida y comprobantes listos para captura.';
    const pill = q('network-pill');
    if (pill) pill.textContent = 'Modo local';
    setTimeout(function(){ if (document.body.classList.contains('app-page')) refreshLocalUi(); }, 50);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootV55, { once: true });
  else bootV55();
})();
