const API_URL = "https://script.google.com/macros/s/AKfycbyL-7yiraIZB0f0xqA5axDv-emMYCyNcT66mhOQ7sjxyDVeF2KWijPxm49VMhT3lxQ/exec";
const STORAGE_KEYS = {
  session: "invSession",
  themeMode: "invThemeMode",
  productMeta: "invProductMeta",
  sales: "invSales",
  movements: "invMovements",
  receipts: "invReceipts",
  inventoryCache: "invInventoryCache"
};

const LOW_STOCK_LIMIT = 3;

const NATIONAL_SHIPPING_OPTIONS = [
  { id: "envio-normal", label: "Envío Normal", price: 110 },
  { id: "pagar-recibir", label: "Pagar al Recibir", price: 160 }
];

const COMAYAGUA_SHIPPING_OPTIONS = [
  { id: "piedras-bonitas", label: "Colonia Piedras Bonitas", price: 0 },
  { id: "barrio-santa-lucia", label: "Barrio Santa Lucía", price: 10 },
  { id: "barrio-san-blas", label: "Barrio San Blas", price: 20 },
  { id: "barrio-centro", label: "Barrio Centro", price: 30 },
  { id: "barrio-arriba", label: "Barrio Arriba", price: 30 },
  { id: "barrio-abajo", label: "Barrio Abajo", price: 30 },
  { id: "barrio-cabanas", label: "Barrio Cabañas", price: 30 },
  { id: "barrio-san-francisco", label: "Barrio San Francisco", price: 30 },
  { id: "barrio-torondon", label: "Barrio Torondón", price: 30 },
  { id: "colonia-21-abril", label: "Colonia 21 de Abril", price: 35 },
  { id: "centro-comayagua", label: "Centro de Comayagua", price: 35 },
  { id: "barrio-san-sebastian", label: "Barrio San Sebastián", price: 35 },
  { id: "barrio-san-gebastian", label: "Barrio San Gebastián", price: 35 },
  { id: "barrio-la-merced", label: "Barrio La Merced", price: 40 },
  { id: "barrio-la-independencia", label: "Barrio La Independencia", price: 40 },
  { id: "barrio-el-calvario", label: "Barrio El Calvario", price: 40 },
  { id: "colonia-las-colinas", label: "Colonia Las Colinas", price: 40 },
  { id: "colonia-escoto", label: "Colonia Escoto", price: 40 },
  { id: "colonia-san-pablo", label: "Colonia San Pablo", price: 40 },
  { id: "colonia-10-mayo", label: "Colonia 10 de Mayo", price: 40 },
  { id: "colonia-boquin", label: "Colonia Boquín", price: 40 },
  { id: "colonia-nueva-comayagua", label: "Colonia Nueva Comayagua", price: 40 },
  { id: "colonia-el-prado", label: "Colonia El Prado", price: 40 },
  { id: "colonia-lazos-amistad", label: "Colonia Lazos de Amistad", price: 40 },
  { id: "colonia-rodolfo-alfaro", label: "Colonia Rodolfo Alfaro", price: 40 },
  { id: "colonia-los-lirios", label: "Colonia Los Lirios", price: 40 },
  { id: "colonia-sitramedis", label: "Colonia Sitramedis", price: 45 },
  { id: "colonia-lincoln", label: "Colonia Lincoln", price: 45 },
  { id: "colonia-madreselva", label: "Colonia Madreselva", price: 45 },
  { id: "residencial-el-recreo", label: "Residencial El Recreo", price: 45 },
  { id: "residencial-valladolid", label: "Residencial Valladolid", price: 45 },
  { id: "residencial-la-zarcita", label: "Residencial La Zarcita", price: 45 },
  { id: "palmira", label: "Palmira", price: 50 },
  { id: "cabanas", label: "Cabañas", price: 50 },
  { id: "terminal-buses", label: "Terminal de Buses", price: 50 },
  { id: "estacion-policia", label: "Estación de Policía", price: 50 },
  { id: "universidad-curc", label: "Universidad de Comayagua CURC", price: 50 }
];

const USERS = {
  sdcomayagua: {
    password: "199311",
    name: "Gabriel",
    alias: "SDC Admin",
    role: "Administrador principal",
    initials: "SD"
  },
  jarco: {
    password: "jarco",
    name: "JarCo",
    alias: "JarCo",
    role: "Administrador",
    initials: "JC"
  }
};

const money = new Intl.NumberFormat("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const IMAGE_RULES = {
  maxImages: 5,
  totalChars: 180000,
  hardTotalChars: 210000,
  singleImageMaxChars: 48000,
  minImageChars: 9000,
  maxSideSingle: 1400,
  maxSideMulti: 1120,
  minSide: 320
};

let PRODUCTS = [];
let FILTERED = [];
let CURRENT_PAGE = 1;
let ITEMS_PER_PAGE = 12;
let CURRENT_USER = null;
let EDITING_ID = null;
let CURRENT_EDIT_IMAGES = [];
let ACTIVE_DETAIL_ID = null;
let LAST_SYNC_AT = null;
let INSTALL_PROMPT = null;
let ACTIVE_RECEIPT_ID = null;
let PENDING_PRODUCT_META = null;
let SALE_CART = [];
let SYSTEM_THEME_MEDIA = null;

function isInventoryPage() {
  return document.body.classList.contains("app-page");
}

function readStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession() {
  return readStore(STORAGE_KEYS.session, null);
}

function saveSession(username) {
  const user = USERS[username];
  if (!user) return;
  writeStore(STORAGE_KEYS.session, { username, alias: user.alias, initials: user.initials, role: user.role });
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatMoney(value) {
  return `Lps. ${money.format(Number(value || 0))}`;
}

function formatDateTime(dateLike) {
  const date = new Date(dateLike);
  return date.toLocaleString("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDateOnly(dateLike) {
  const date = new Date(dateLike);
  return date.toLocaleDateString("es-HN", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function getThemeMode() {
  return localStorage.getItem(STORAGE_KEYS.themeMode) || "auto";
}

function applySavedTheme() {
  SYSTEM_THEME_MEDIA = SYSTEM_THEME_MEDIA || window.matchMedia("(prefers-color-scheme: dark)");
  const mode = getThemeMode();
  const dark = mode === "auto" ? SYSTEM_THEME_MEDIA.matches : mode === "dark";
  document.body.classList.toggle("theme-dark", dark);
  document.body.classList.toggle("theme-light", !dark);
  document.body.dataset.themeMode = mode;
  updateThemeControls();
}

function updateThemeControls() {
  const mode = getThemeMode();
  const label = mode === "auto" ? "◐" : mode === "dark" ? "☀️" : "🌙";
  const title = mode === "auto"
    ? "Tema automático"
    : mode === "dark"
      ? "Tema oscuro activo"
      : "Tema claro activo";
  document.querySelectorAll("#theme-toggle").forEach((btn) => {
    btn.textContent = label;
    btn.title = `${title}. Toca para cambiar.`;
  });
}

function toggleTheme() {
  const current = getThemeMode();
  const next = current === "auto" ? "dark" : current === "dark" ? "light" : "auto";
  localStorage.setItem(STORAGE_KEYS.themeMode, next);
  applySavedTheme();
  showToast(next === "auto" ? "Tema automático activado." : `Tema ${next === "dark" ? "oscuro" : "claro"} activado.`);
}

function parseImages(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getPlaceholderImage(label = "Sin imagen") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop stop-color="#101827"/>
          <stop offset="1" stop-color="#1a2941"/>
        </linearGradient>
      </defs>
      <rect fill="url(#g)" width="1200" height="900" rx="48"/>
      <circle cx="420" cy="330" r="84" fill="#304867"/>
      <path d="M210 700 458 470l150 138 84-96 302 188H210Z" fill="#203248"/>
      <text x="50%" y="84%" text-anchor="middle" fill="#dfeaff" font-family="Arial, sans-serif" font-size="46">${escapeHtml(label)}</text>
    </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getProductMetaStore() {
  return readStore(STORAGE_KEYS.productMeta, {});
}

function saveProductMeta(productId, meta) {
  if (!productId) return;
  const store = getProductMetaStore();
  store[String(productId)] = {
    ...(store[String(productId)] || {}),
    ...meta
  };
  writeStore(STORAGE_KEYS.productMeta, store);
}

function getSales() {
  return readStore(STORAGE_KEYS.sales, []);
}

function setSales(sales) {
  writeStore(STORAGE_KEYS.sales, sales.slice(0, 300));
}

function getMovements() {
  return readStore(STORAGE_KEYS.movements, []);
}

function setMovements(movements) {
  writeStore(STORAGE_KEYS.movements, movements.slice(0, 500));
}

function getReceipts() {
  return readStore(STORAGE_KEYS.receipts, []);
}

function setReceipts(receipts) {
  writeStore(STORAGE_KEYS.receipts, receipts.slice(0, 300));
}

function cacheInventoryResponse(response) {
  writeStore(STORAGE_KEYS.inventoryCache, response);
}

function getCachedInventoryResponse() {
  return readStore(STORAGE_KEYS.inventoryCache, null);
}

function buildMovement(entry) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    user: CURRENT_USER?.alias || "Sistema",
    ...entry
  };
}

function pushMovement(entry) {
  const items = getMovements();
  items.unshift(buildMovement(entry));
  setMovements(items);
}

function pushSale(sale) {
  const items = getSales();
  items.unshift(sale);
  setSales(items);
}

function pushReceipt(receipt) {
  const items = getReceipts();
  items.unshift(receipt);
  setReceipts(items);
}

function getProductById(id) {
  return PRODUCTS.find((item) => String(item.id) === String(id));
}

function enrichProducts(products) {
  const metaStore = getProductMetaStore();
  return (products || []).map((product) => {
    const meta = metaStore[String(product.id)] || {};
    const cost = Number(meta.cost ?? product.cost ?? 0);
    const price = Number(product.price || 0);
    return {
      ...product,
      cost,
      sku: String(meta.sku || product.sku || product.id || "").trim(),
      notes: String(meta.notes || "").trim(),
      price,
      qty: Number(product.qty || 0),
      margin: price - cost
    };
  });
}

function ensureAuthenticated() {
  const session = getSession();
  if (!session || !USERS[session.username]) {
    window.location.href = "index.html";
    return false;
  }
  CURRENT_USER = { ...USERS[session.username], ...session };
  return true;
}

function invLogin() {
  const username = document.getElementById("inv-user")?.value.trim().toLowerCase();
  const password = document.getElementById("inv-pass")?.value.trim();
  const user = USERS[username];
  if (!user || user.password !== password) {
    alert("Usuario o contraseña incorrectos.");
    return;
  }
  saveSession(username);
  window.location.href = "inventario.html";
}

function invLogout() {
  clearSession();
  window.location.href = "index.html";
}

function registerCoreEvents() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    INSTALL_PROMPT = event;
    const btn = document.getElementById("install-btn");
    if (btn) btn.style.display = "inline-flex";
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      invCloseModal();
      closeDetailModal();
      closeReceiptModal();
      closeSheets();
      closeSaleModal();
    }
  });

  window.addEventListener("click", (event) => {
    ["inv-modal", "detail-modal", "sale-modal"].forEach((id) => {
      const modal = document.getElementById(id);
      if (event.target === modal) modal.style.display = "none";
    });
  });

  window.addEventListener("online", updateNetworkStatus);
  window.addEventListener("offline", updateNetworkStatus);

  SYSTEM_THEME_MEDIA = SYSTEM_THEME_MEDIA || window.matchMedia("(prefers-color-scheme: dark)");
  if (SYSTEM_THEME_MEDIA?.addEventListener) {
    SYSTEM_THEME_MEDIA.addEventListener("change", () => {
      if (getThemeMode() === "auto") applySavedTheme();
    });
  }

  updateNetworkStatus();
}

function bindKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const isTyping = ["input", "textarea", "select"].includes(activeTag);
    if (!isTyping && event.key === "/") {
      event.preventDefault();
      document.getElementById("inv-search")?.focus();
    }
    if (!isTyping && (event.key === "n" || event.key === "N")) invOpenModal(false);
    if (!isTyping && (event.key === "v" || event.key === "V")) openSaleModal();
  });
}

function updateNetworkStatus() {
  const pill = document.getElementById("network-pill");
  if (!pill) return;
  const online = navigator.onLine;
  pill.textContent = online ? "En línea" : "Modo sin conexión";
  pill.classList.toggle("offline", !online);
}

async function installApp() {
  if (!INSTALL_PROMPT) return;
  INSTALL_PROMPT.prompt();
  await INSTALL_PROMPT.userChoice;
  INSTALL_PROMPT = null;
  const btn = document.getElementById("install-btn");
  if (btn) btn.style.display = "none";
}

function setupLoginPage() {
  applySavedTheme();
  registerCoreEvents();
  const existing = getSession();
  if (existing && USERS[existing.username]) {
    window.location.href = "inventario.html";
    return;
  }
  ["inv-user", "inv-pass"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") invLogin();
    });
  });
}

function setupAppPage() {
  if (!ensureAuthenticated()) return;
  applySavedTheme();
  registerCoreEvents();
  setupHeader();
  bindInventoryEvents();
  bindUploadDropZones();
  bindKeyboardShortcuts();
  bindSalesEvents();
  ITEMS_PER_PAGE = parseInt(document.getElementById("inv-items-per-page")?.value || "12", 10);
  loadProducts();
}

function setupHeader() {
  setText("inv-avatar", CURRENT_USER.initials || "SD");
  setText("inv-welcome", `Sesión: ${CURRENT_USER.alias}`);
  setText("inv-role", CURRENT_USER.role || "Administrador");
}

function bindInventoryEvents() {
  ["inv-filter", "inv-stock-filter", "inv-sort"].forEach((id) => {
    document.getElementById(id)?.addEventListener("change", applyFilters);
  });
  ["inv-search", "inv-min-price", "inv-max-price"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", applyFilters);
  });
  document.getElementById("inv-items-per-page")?.addEventListener("change", invChangeItemsPerPage);
}

function bindSalesEvents() {
  document.getElementById("sale-product-select")?.addEventListener("change", syncSaleFormFromSelectedProduct);
  document.getElementById("sale-shipping-enabled")?.addEventListener("change", toggleShippingFields);
  document.getElementById("sale-shipping-zone")?.addEventListener("change", populateShippingOptionSelect);
  document.getElementById("sale-shipping-option")?.addEventListener("change", updateSaleSummary);
}

function showLoading(show, label = "Cargando...") {
  let overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.className = "loading-overlay hidden";
    overlay.innerHTML = `<div class="loading-panel glass-panel"><div class="loading-spinner"></div><p id="loading-text">${escapeHtml(label)}</p></div>`;
    document.body.appendChild(overlay);
  }
  const text = document.getElementById("loading-text");
  if (text) text.textContent = label;
  overlay.classList.toggle("hidden", !show);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2600);
}

function updateSyncMeta() {
  const label = LAST_SYNC_AT
    ? LAST_SYNC_AT.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  setText("sync-status", navigator.onLine ? "Sincronizado" : "Modo sin conexión");
  setText("sync-time-pill", `Actualizado ${label}`);
}

function bindUploadDropZones() {
  for (let i = 1; i <= IMAGE_RULES.maxImages; i += 1) {
    const slot = document.getElementById(`slot${i}`);
    const input = document.getElementById(`inv-img${i}`);
    if (!slot || !input) continue;

    ["dragenter", "dragover"].forEach((eventName) => {
      slot.addEventListener(eventName, (event) => {
        event.preventDefault();
        slot.classList.add("dragging");
      });
    });

    ["dragleave", "drop"].forEach((eventName) => {
      slot.addEventListener(eventName, (event) => {
        event.preventDefault();
        slot.classList.remove("dragging");
      });
    });

    slot.addEventListener("drop", (event) => {
      const file = event.dataTransfer?.files?.[0];
      if (!file) return;
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      invPreviewImage(input, `prev${i}`);
    });
  }
}

function renderCategoryChips() {
  const wrap = document.getElementById("quick-categories");
  const select = document.getElementById("inv-filter");
  if (!wrap || !select) return;
  const categories = [...new Set(PRODUCTS.map((item) => String(item.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const current = select.value || "all";
  const chips = [`<button type="button" class="category-chip ${current === "all" ? "active" : ""}" onclick="setCategoryFilter('all')">Todas</button>`]
    .concat(categories.map((category) => `<button type="button" class="category-chip ${current === category ? "active" : ""}" onclick="setCategoryFilter('${escapeHtml(category)}')">${escapeHtml(category)}</button>`));
  wrap.innerHTML = chips.join("");
}

function setCategoryFilter(value) {
  const select = document.getElementById("inv-filter");
  if (!select) return;
  select.value = value;
  applyFilters();
}

function triggerImportBackup() {
  document.getElementById("inventory-import-input")?.click();
}

function exportInventoryBackup() {
  const payload = {
    exportedAt: new Date().toISOString(),
    products: PRODUCTS,
    productMeta: getProductMetaStore(),
    sales: getSales(),
    movements: getMovements(),
    receipts: getReceipts(),
    themeMode: getThemeMode()
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `inventario-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importInventoryBackup(input) {
  const file = input?.files?.[0];
  if (!file) return;
  try {
    showLoading(true, "Importando respaldo...");
    const data = JSON.parse(await file.text());

    if (data.productMeta) writeStore(STORAGE_KEYS.productMeta, data.productMeta);
    if (data.sales) writeStore(STORAGE_KEYS.sales, data.sales);
    if (data.movements) writeStore(STORAGE_KEYS.movements, data.movements);
    if (data.receipts) writeStore(STORAGE_KEYS.receipts, data.receipts);
    if (data.themeMode) localStorage.setItem(STORAGE_KEYS.themeMode, data.themeMode);

    const items = Array.isArray(data.products) ? data.products : [];
    for (const item of items) {
      await postToApi({
        action: item.id ? "edit" : "add",
        id: item.id || undefined,
        name: item.name,
        price: item.price,
        qty: item.qty,
        category: item.category,
        images: item.images || "[]",
        user: CURRENT_USER.alias
      });
      if (item.id && (item.cost || item.sku || item.notes)) {
        saveProductMeta(item.id, { cost: item.cost || 0, sku: item.sku || "", notes: item.notes || "" });
      }
    }

    applySavedTheme();
    await loadProducts();
    showToast("Respaldo importado correctamente.");
  } catch (error) {
    console.error(error);
    alert("No se pudo importar el respaldo.");
  } finally {
    input.value = "";
    showLoading(false);
  }
}

async function loadProducts(showRefreshFeedback = false) {
  if (showRefreshFeedback) showLoading(true, "Actualizando inventario...");
  try {
    const response = await fetch(`${API_URL}?action=get`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo consultar el inventario.");
    const data = await response.json();
    cacheInventoryResponse(data);
    PRODUCTS = enrichProducts(Array.isArray(data.products) ? data.products : []);
    FILTERED = [...PRODUCTS];
    LAST_SYNC_AT = new Date();
    resolvePendingProductMeta();
    loadCategories();
    updateDashboard();
    renderServerHistory(data.history || []);
    applyFilters();
    updateNetworkStatus();
  } catch (error) {
    console.error(error);
    const cached = getCachedInventoryResponse();
    if (cached?.products?.length) {
      PRODUCTS = enrichProducts(cached.products);
      FILTERED = [...PRODUCTS];
      LAST_SYNC_AT = new Date();
      loadCategories();
      updateDashboard();
      renderServerHistory(cached.history || []);
      applyFilters();
      showToast("Se cargó la última copia local del inventario.");
    } else {
      PRODUCTS = [];
      FILTERED = [];
      updateDashboard();
      renderProducts();
      renderServerHistory([]);
      alert("No se pudieron cargar los productos.");
    }
  } finally {
    showLoading(false);
  }
}

function resolvePendingProductMeta() {
  if (!PENDING_PRODUCT_META) return;
  const candidate = PRODUCTS.find((item) => (
    String(item.name).trim().toLowerCase() === String(PENDING_PRODUCT_META.name).trim().toLowerCase()
    && String(item.category).trim().toLowerCase() === String(PENDING_PRODUCT_META.category).trim().toLowerCase()
    && Number(item.price || 0) === Number(PENDING_PRODUCT_META.price || 0)
    && Number(item.qty || 0) === Number(PENDING_PRODUCT_META.qty || 0)
  ));
  if (candidate) {
    saveProductMeta(candidate.id, PENDING_PRODUCT_META.meta);
    PENDING_PRODUCT_META = null;
    PRODUCTS = enrichProducts(PRODUCTS);
  }
}

function getPeriodMetrics() {
  const sales = getSales();
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);
  const monthKey = todayKey.slice(0, 7);
  const todaySales = sales.filter((sale) => String(sale.createdAt || "").slice(0, 10) === todayKey);
  const monthSales = sales.filter((sale) => String(sale.createdAt || "").slice(0, 7) === monthKey);
  const totalToday = todaySales.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const profitToday = todaySales.reduce((sum, item) => sum + Number(item.profit || 0), 0);
  const totalMonth = monthSales.reduce((sum, item) => sum + Number(item.total || 0), 0);
  return { todaySales, monthSales, totalToday, profitToday, totalMonth };
}

function updateDashboard() {
  const totalProducts = PRODUCTS.length;
  const totalQty = PRODUCTS.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalValue = PRODUCTS.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const outCount = PRODUCTS.filter((item) => Number(item.qty || 0) <= 0).length;
  const inStock = PRODUCTS.filter((item) => Number(item.qty || 0) > 0).length;
  const lowStock = PRODUCTS.filter((item) => Number(item.qty || 0) > 0 && Number(item.qty || 0) <= LOW_STOCK_LIMIT).length;
  const categoryCount = new Set(PRODUCTS.map((item) => String(item.category || "").trim()).filter(Boolean)).size;
  const avgPrice = totalProducts ? PRODUCTS.reduce((sum, item) => sum + Number(item.price || 0), 0) / totalProducts : 0;
  const movements = getMovements();
  const metrics = getPeriodMetrics();

  setText("dash-total-products", totalProducts);
  setText("dash-total-qty", totalQty);
  setText("dash-total-value", formatMoney(totalValue));
  setText("dash-out-count", outCount);
  setText("dash-low-stock", lowStock);
  setText("dash-category-count", categoryCount);
  setText("dash-in-stock", inStock);
  setText("dash-avg-price", formatMoney(avgPrice));
  setText("dash-sales-today", formatMoney(metrics.totalToday));
  setText("dash-sales-profit", formatMoney(metrics.profitToday));
  setText("dash-sales-month", formatMoney(metrics.totalMonth));
  setText("dash-movements", movements.length);
  setText("quick-total-products", totalProducts);
  setText("quick-in-stock", inStock);
  setText("quick-out-stock", outCount);
  setText("sidebar-total-products", totalProducts);
  setText("sidebar-sales-today", formatMoney(metrics.totalToday));
  setText("sidebar-profit-today", formatMoney(metrics.profitToday));
  setText("sidebar-sync-note", LAST_SYNC_AT ? `Última sincronización ${LAST_SYNC_AT.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" })}` : "Listo para gestionar");
  setText("sales-today-count", metrics.todaySales.length);
  setText("sales-today-total", formatMoney(metrics.totalToday));
  setText("sales-today-profit", formatMoney(metrics.profitToday));
  setText("sales-month-total", formatMoney(metrics.totalMonth));
  updateSyncMeta();
  renderSalesList();
  renderMovementList();
  renderReceiptsList();
  populateSaleProductSelect();
}

function loadCategories() {
  const select = document.getElementById("inv-filter");
  if (!select) return;
  const categories = [...new Set(PRODUCTS.map((item) => String(item.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const current = select.value || "all";
  select.innerHTML = '<option value="all">Todas</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });
  select.value = categories.includes(current) ? current : "all";
  renderCategoryChips();
}

function applyFilters() {
  const category = document.getElementById("inv-filter")?.value || "all";
  const stock = document.getElementById("inv-stock-filter")?.value || "all";
  const minPriceRaw = document.getElementById("inv-min-price")?.value || "";
  const maxPriceRaw = document.getElementById("inv-max-price")?.value || "";
  const search = (document.getElementById("inv-search")?.value || "").trim().toLowerCase();
  const sort = document.getElementById("inv-sort")?.value || "featured";
  const minPrice = minPriceRaw === "" ? null : Number(minPriceRaw);
  const maxPrice = maxPriceRaw === "" ? null : Number(maxPriceRaw);

  FILTERED = PRODUCTS.filter((product) => {
    const name = String(product.name || "");
    const productCategory = String(product.category || "");
    const price = Number(product.price || 0);
    const qty = Number(product.qty || 0);
    const lookup = `${name} ${productCategory} ${product.sku || ""} ${product.id || ""} ${product.notes || ""}`.toLowerCase();
    if (category !== "all" && productCategory !== category) return false;
    if (stock === "in" && qty <= 0) return false;
    if (stock === "low" && !(qty > 0 && qty <= LOW_STOCK_LIMIT)) return false;
    if (stock === "out" && qty > 0) return false;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;
    if (search && !lookup.includes(search)) return false;
    return true;
  });

  FILTERED.sort((a, b) => {
    if (sort === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
    if (sort === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
    if (sort === "qtyDesc") return Number(b.qty || 0) - Number(a.qty || 0);
    if (sort === "qtyAsc") return Number(a.qty || 0) - Number(b.qty || 0);
    return String(a.name || "").localeCompare(String(b.name || ""), "es", { sensitivity: "base" });
  });

  CURRENT_PAGE = 1;
  renderCategoryChips();
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById("inv-products");
  const empty = document.getElementById("inv-empty");
  if (!container) return;
  container.innerHTML = "";
  setText("results-count", `${FILTERED.length} resultado${FILTERED.length === 1 ? "" : "s"}`);
  if (!FILTERED.length) {
    if (empty) empty.style.display = "block";
    renderPagination();
    return;
  }
  if (empty) empty.style.display = "none";
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  if (CURRENT_PAGE > totalPages) CURRENT_PAGE = totalPages;
  const start = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  const pageItems = FILTERED.slice(start, start + ITEMS_PER_PAGE);

  pageItems.forEach((product) => {
    const images = parseImages(product.images);
    const mainImage = images[0] || getPlaceholderImage("Sin imagen");
    const qty = Number(product.qty || 0);
    const inStock = qty > 0;
    const lowStock = qty > 0 && qty <= LOW_STOCK_LIMIT;
    const safeId = String(product.id || "");
    const safeName = escapeHtml(product.name || "Sin nombre");
    const safeCategory = escapeHtml(product.category || "General");
    const imageLabel = images.length ? `${images.length} foto${images.length === 1 ? "" : "s"}` : "Sin foto";
    const mediaClass = images.length ? "product-media" : "product-media is-placeholder";

    const card = document.createElement("article");
    card.className = "product-card glass-panel";
    card.innerHTML = `
      <button class="product-tile" type="button" onclick="viewProduct('${safeId}')" aria-label="Abrir ${safeName}">
        <div class="${mediaClass}">
          <img class="product-main-img" src="${mainImage}" alt="${safeName}" loading="lazy" decoding="async">
          <span class="product-status ${inStock ? "in" : "out"}">${inStock ? "Disponible" : "Agotado"}</span>
          <span class="media-count">${imageLabel}</span>
          ${lowStock ? '<span class="low-stock-badge">Bajo stock</span>' : ""}
        </div>
        <div class="product-copy">
          <div class="product-meta-row">
            <span class="meta-pill">${safeCategory}</span>
            <span class="meta-pill soft">${escapeHtml(product.sku || `ID ${safeId || '--'}`)}</span>
          </div>
          <h3 class="product-name">${safeName}</h3>
          <p class="product-stock-line">${inStock ? `${qty} en stock` : "Sin existencias"}</p>
          <div class="product-price-row">
            <strong class="product-price">${formatMoney(product.price)}</strong>
            <span class="product-mini-note">Ganancia: ${formatMoney(product.margin)}</span>
          </div>
        </div>
      </button>
      <div class="product-action-row product-action-row-v5">
        <button class="mini-icon-btn sell-btn" type="button" onclick="openSaleModal('${safeId}')"><span>💳</span><small>Vender</small></button>
        <button class="mini-icon-btn" type="button" onclick="startEditById('${safeId}')"><span>✎</span><small>Editar</small></button>
        <button class="mini-icon-btn danger" type="button" onclick="deleteProduct('${safeId}')"><span>🗑</span><small>Eliminar</small></button>
      </div>`;
    container.appendChild(card);
  });
  renderPagination();
}

function renderPagination() {
  const container = document.getElementById("inv-pagination");
  if (!container) return;
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  container.innerHTML = `
    <button class="btn-secondary" type="button" ${CURRENT_PAGE === 1 ? "disabled" : ""} onclick="changePage(-1)">Anterior</button>
    <span class="page-indicator">Página ${CURRENT_PAGE} / ${totalPages}</span>
    <button class="btn-secondary" type="button" ${CURRENT_PAGE === totalPages ? "disabled" : ""} onclick="changePage(1)">Siguiente</button>`;
}

function changePage(direction) {
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  CURRENT_PAGE = Math.min(totalPages, Math.max(1, CURRENT_PAGE + direction));
  renderProducts();
  scrollToSection("productos");
}

function invChangeItemsPerPage() {
  ITEMS_PER_PAGE = parseInt(document.getElementById("inv-items-per-page")?.value || "12", 10);
  CURRENT_PAGE = 1;
  renderProducts();
}

function clearFilters() {
  const defaults = {
    "inv-filter": "all",
    "inv-stock-filter": "all",
    "inv-min-price": "",
    "inv-max-price": "",
    "inv-sort": "featured",
    "inv-search": ""
  };
  Object.entries(defaults).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  applyFilters();
}

function renderServerHistory(history) {
  const list = document.getElementById("inv-history-list");
  if (!list) return;
  list.innerHTML = "";
  const items = Array.isArray(history) ? history.slice(0, 20) : [];
  if (!items.length) {
    list.innerHTML = "<li>No hay actividad sincronizada todavía.</li>";
    return;
  }
  items.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    list.appendChild(li);
  });
}

function toggleActivityPanel(force) {
  const card = document.getElementById("activity-card");
  const list = document.getElementById("inv-history-list");
  const btn = document.getElementById("activity-toggle-btn");
  if (!card || !list || !btn) return;
  const shouldOpen = typeof force === "boolean" ? force : list.hasAttribute("hidden");
  if (shouldOpen) {
    list.removeAttribute("hidden");
    card.classList.remove("collapsed");
    btn.textContent = "Ocultar actividad";
  } else {
    list.setAttribute("hidden", "hidden");
    card.classList.add("collapsed");
    btn.textContent = "Ver actividad";
  }
}

function renderSalesList() {
  const wrap = document.getElementById("sales-list");
  if (!wrap) return;
  const sales = getSales().slice(0, 8);
  if (!sales.length) {
    wrap.innerHTML = '<div class="list-empty">Todavía no hay ventas registradas.</div>';
    return;
  }
  wrap.innerHTML = sales.map((sale) => `
    <article class="list-card glass-panel">
      <div class="list-card-head">
        <div>
          <strong>Venta #${escapeHtml(sale.number)}</strong>
          <p>${escapeHtml(sale.customer || "Cliente general")} · ${escapeHtml(sale.payment || "Pago")}</p>
        </div>
        <span class="list-amount">${formatMoney(sale.total)}</span>
      </div>
      <div class="list-card-meta">
        <span>${formatDateTime(sale.createdAt)}</span>
        <span>Ganancia ${formatMoney(sale.profit)}</span>
      </div>
      <div class="list-card-actions">
        <button class="mini-icon-btn" type="button" onclick="openReceiptWindow('${escapeHtml(sale.receiptId)}', false)"><span>👁</span><small>Ver</small></button>
        <button class="mini-icon-btn" type="button" onclick="openReceiptWindow('${escapeHtml(sale.receiptId)}', true)"><span>🖨</span><small>Imprimir</small></button>
        <button class="mini-icon-btn danger" type="button" onclick="deleteSale('${escapeHtml(sale.id)}')"><span>🗑</span><small>Eliminar</small></button>
      </div>
    </article>`).join("");
}

function movementIcon(type) {
  return ({ add: "＋", edit: "✎", stock: "⇅", sale: "💳", delete: "🗑", import: "⤒" })[type] || "•";
}

function renderMovementList() {
  const wrap = document.getElementById("movement-list");
  if (!wrap) return;
  const movements = getMovements().slice(0, 12);
  setText("movement-count-label", `${getMovements().length} movimiento${getMovements().length === 1 ? "" : "s"}`);
  if (!movements.length) {
    wrap.innerHTML = '<div class="list-empty">Todavía no hay movimientos locales registrados.</div>';
    return;
  }
  wrap.innerHTML = movements.map((entry) => `
    <article class="list-card glass-panel movement-card">
      <div class="movement-icon">${movementIcon(entry.type)}</div>
      <div class="movement-copy">
        <strong>${escapeHtml(entry.title || "Movimiento")}</strong>
        <p>${escapeHtml(entry.detail || "Sin detalle")}</p>
        <small>${formatDateTime(entry.createdAt)} · ${escapeHtml(entry.user || "Sistema")}</small>
      </div>
      ${entry.amount !== undefined ? `<span class="list-amount">${typeof entry.amount === "number" ? formatMoney(entry.amount) : escapeHtml(entry.amount)}</span>` : ""}
    </article>`).join("");
}

function renderReceiptsList() {
  const wrap = document.getElementById("receipts-list");
  if (!wrap) return;
  const receipts = getReceipts().slice(0, 8);
  if (!receipts.length) {
    wrap.innerHTML = '<div class="list-empty">Todavía no hay comprobantes generados.</div>';
    return;
  }
  wrap.innerHTML = receipts.map((receipt) => `
    <article class="list-card glass-panel">
      <div class="list-card-head">
        <div>
          <strong>Comprobante #${escapeHtml(receipt.number)}</strong>
          <p>${escapeHtml(receipt.customer || "Cliente general")}</p>
        </div>
        <span class="list-amount">${formatMoney(receipt.total)}</span>
      </div>
      <div class="list-card-meta">
        <span>${formatDateTime(receipt.createdAt)}</span>
        <span>${escapeHtml(receipt.payment || "Pago")}</span>
      </div>
      <div class="list-card-actions">
        <button class="mini-icon-btn" type="button" onclick="openReceiptWindow('${escapeHtml(receipt.id)}', false)"><span>👁</span><small>Abrir</small></button>
        <button class="mini-icon-btn" type="button" onclick="openReceiptWindow('${escapeHtml(receipt.id)}', true)"><span>🖨</span><small>Imprimir</small></button>
      </div>
    </article>`).join("");
}

function populateSaleProductSelect(preselectedId = "") {
  const select = document.getElementById("sale-product-select");
  if (!select) return;
  const current = preselectedId || select.value;
  const options = PRODUCTS.filter((item) => Number(item.qty || 0) > 0)
    .sort((a, b) => String(a.name).localeCompare(String(b.name), "es", { sensitivity: "base" }));
  select.innerHTML = options.length
    ? options.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)} · ${formatMoney(item.price)} · stock ${item.qty}</option>`).join("")
    : '<option value="">Sin productos con stock</option>';
  if (current && options.some((item) => String(item.id) === String(current))) {
    select.value = current;
  }
  syncSaleFormFromSelectedProduct();
}

function syncSaleFormFromSelectedProduct() {
  const product = getProductById(document.getElementById("sale-product-select")?.value);
  if (!product) return;
  const qtyInput = document.getElementById("sale-qty");
  const priceInput = document.getElementById("sale-price");
  if (qtyInput) {
    qtyInput.max = String(product.qty || 1);
    if (!qtyInput.value || Number(qtyInput.value) <= 0) qtyInput.value = "1";
  }
  if (priceInput) priceInput.value = String(Number(product.price || 0).toFixed(2));
}

function setImageSlotState(index, { src = "", label = "Sin archivo", filled = false } = {}) {
  const preview = document.getElementById(`prev${index}`);
  const hint = document.getElementById(`hint${index}`);
  const slot = document.getElementById(`slot${index}`);
  if (preview) {
    preview.src = src || "";
    preview.style.display = src ? "block" : "none";
  }
  if (hint) hint.textContent = label;
  if (slot) slot.classList.toggle("has-image", Boolean(filled || src));
}

function clearModalFields() {
  ["inv-name", "inv-price", "inv-cost", "inv-qty", "inv-category", "inv-sku", "inv-notes"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });
  for (let i = 1; i <= IMAGE_RULES.maxImages; i += 1) {
    const input = document.getElementById(`inv-img${i}`);
    if (input) input.value = "";
    setImageSlotState(i, { src: "", label: "Sin archivo", filled: false });
  }
}

function populateExistingImages(images = []) {
  CURRENT_EDIT_IMAGES = Array.isArray(images) ? [...images] : [];
  for (let i = 1; i <= IMAGE_RULES.maxImages; i += 1) {
    const current = CURRENT_EDIT_IMAGES[i - 1] || "";
    if (current) setImageSlotState(i, { src: current, label: "Imagen actual", filled: true });
  }
}

function invOpenModal(isEdit = false, product = null) {
  const modal = document.getElementById("inv-modal");
  const title = document.getElementById("inv-modal-title");
  if (!modal || !title) return;
  clearModalFields();
  CURRENT_EDIT_IMAGES = [];
  EDITING_ID = null;
  if (isEdit && product) {
    title.textContent = "Editar producto";
    EDITING_ID = product.id;
    document.getElementById("inv-name").value = product.name || "";
    document.getElementById("inv-price").value = product.price || 0;
    document.getElementById("inv-cost").value = product.cost || 0;
    document.getElementById("inv-qty").value = product.qty || 0;
    document.getElementById("inv-category").value = product.category || "";
    document.getElementById("inv-sku").value = product.sku || "";
    document.getElementById("inv-notes").value = product.notes || "";
    populateExistingImages(parseImages(product.images));
  } else {
    title.textContent = "Agregar producto";
  }
  modal.style.display = "flex";
}

function invCloseModal() {
  document.getElementById("inv-modal").style.display = "none";
  EDITING_ID = null;
  CURRENT_EDIT_IMAGES = [];
}

function startEditById(id) {
  const product = getProductById(id);
  if (product) invOpenModal(true, product);
}

function invPreviewImage(input, previewId) {
  const file = input.files?.[0];
  const index = Number(String(previewId).replace("prev", "")) || 1;
  if (!file) {
    const existing = CURRENT_EDIT_IMAGES[index - 1] || "";
    setImageSlotState(index, existing ? { src: existing, label: "Imagen actual", filled: true } : { src: "", label: "Sin archivo", filled: false });
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    setImageSlotState(index, {
      src: String(event.target?.result || ""),
      label: file.name,
      filled: true
    });
  };
  reader.readAsDataURL(file);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

async function compressImageSource(source, options = {}) {
  const dataUrl = typeof source === "string" ? source : await fileToBase64(source);
  const targetChars = options.targetChars || IMAGE_RULES.singleImageMaxChars;
  const maxSide = options.maxSide || IMAGE_RULES.maxSideSingle;
  const minSide = options.minSide || IMAGE_RULES.minSide;
  let quality = options.initialQuality || 0.78;
  const image = await loadImageFromDataUrl(dataUrl);
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  let width = Math.max(minSide, Math.round(image.width * ratio));
  let height = Math.max(minSide, Math.round(image.height * ratio));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const render = (w, h, q) => {
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", q);
  };
  let output = render(width, height, quality);
  let guard = 0;
  while (output.length > targetChars && guard < 10) {
    quality = Math.max(0.32, quality - 0.06);
    width = Math.max(minSide, Math.round(width * 0.92));
    height = Math.max(minSide, Math.round(height * 0.92));
    output = render(width, height, quality);
    guard += 1;
  }
  return output;
}

async function normalizeImagesForSave(images) {
  let finalImages = [...images];
  let total = JSON.stringify(finalImages).length;
  const count = Math.max(1, finalImages.length);
  let targetChars = Math.max(IMAGE_RULES.minImageChars, Math.min(IMAGE_RULES.singleImageMaxChars, Math.floor((IMAGE_RULES.totalChars - 400) / count)));
  finalImages = await Promise.all(finalImages.map((img) => compressImageSource(img, {
    targetChars,
    maxSide: count > 1 ? IMAGE_RULES.maxSideMulti : IMAGE_RULES.maxSideSingle,
    initialQuality: 0.72
  })));
  total = JSON.stringify(finalImages).length;
  let safety = 0;
  while (total > IMAGE_RULES.hardTotalChars && safety < 6) {
    targetChars = Math.max(IMAGE_RULES.minImageChars, Math.floor(targetChars * 0.8));
    finalImages = await Promise.all(finalImages.map((img) => compressImageSource(img, {
      targetChars,
      maxSide: Math.max(IMAGE_RULES.minSide, IMAGE_RULES.maxSideMulti - safety * 20),
      initialQuality: 0.62
    })));
    total = JSON.stringify(finalImages).length;
    safety += 1;
  }
  return finalImages;
}

async function postToApi(payload) {
  const attempts = [
    async (signal) => fetch(API_URL, { method: "POST", body: JSON.stringify(payload), redirect: "follow", signal }),
    async (signal) => fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload), redirect: "follow", signal })
  ];
  let lastError = null;
  for (const attempt of attempts) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);
      const response = await attempt(controller.signal);
      clearTimeout(timeout);
      const text = await response.text();
      if (!response.ok) throw new Error(text || "La operación falló.");
      if (/exception|error|failed/i.test(text) && !/ok|success|guardado|actualizado|eliminado/i.test(text)) throw new Error(text);
      return text;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("La operación falló.");
}

async function invSaveProduct() {
  const saveBtn = document.getElementById("save-product-btn");
  const helper = document.getElementById("image-helper-text");
  const name = document.getElementById("inv-name")?.value.trim();
  const category = document.getElementById("inv-category")?.value.trim();
  const price = Number(document.getElementById("inv-price")?.value || 0);
  const cost = Number(document.getElementById("inv-cost")?.value || 0);
  const qty = Number(document.getElementById("inv-qty")?.value || 0);
  const sku = document.getElementById("inv-sku")?.value.trim();
  const notes = document.getElementById("inv-notes")?.value.trim();

  if (!name || !category || Number.isNaN(price) || Number.isNaN(qty) || Number.isNaN(cost) || price < 0 || qty < 0 || cost < 0) {
    alert("Completa nombre, categoría, precio, costo y cantidad válidos.");
    return;
  }

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
    }
    showLoading(true, EDITING_ID ? "Guardando cambios..." : "Guardando producto...");

    const selectedFiles = [];
    for (let i = 1; i <= IMAGE_RULES.maxImages; i += 1) {
      const input = document.getElementById(`inv-img${i}`);
      if (input?.files?.[0]) selectedFiles.push(input.files[0]);
    }
    const selectedCount = Math.max(1, selectedFiles.length || CURRENT_EDIT_IMAGES.filter(Boolean).length || 1);
    const targetChars = Math.max(IMAGE_RULES.minImageChars, Math.min(IMAGE_RULES.singleImageMaxChars, Math.floor((IMAGE_RULES.totalChars - 400) / selectedCount)));
    const finalImages = [];
    for (let i = 1; i <= IMAGE_RULES.maxImages; i += 1) {
      const input = document.getElementById(`inv-img${i}`);
      const file = input?.files?.[0];
      if (file) {
        finalImages.push(await compressImageSource(file, {
          targetChars,
          maxSide: selectedCount > 1 ? IMAGE_RULES.maxSideMulti : IMAGE_RULES.maxSideSingle,
          initialQuality: 0.76
        }));
      } else if (CURRENT_EDIT_IMAGES[i - 1]) {
        finalImages.push(CURRENT_EDIT_IMAGES[i - 1]);
      }
    }
    const normalizedImages = await normalizeImagesForSave(finalImages);
    const imagesJson = JSON.stringify(normalizedImages);
    if (imagesJson.length > IMAGE_RULES.hardTotalChars) throw new Error("Las fotos siguen pasando el límite de guardado del inventario.");

    await postToApi({
      action: EDITING_ID ? "edit" : "add",
      id: EDITING_ID,
      name,
      price,
      qty,
      category,
      images: imagesJson,
      user: CURRENT_USER.alias
    });

    if (EDITING_ID) {
      saveProductMeta(EDITING_ID, { cost, sku, notes });
      pushMovement({ type: "edit", title: `Producto actualizado: ${name}`, detail: `${category} · ${formatMoney(price)} · stock ${qty}`, amount: "Editado" });
    } else {
      PENDING_PRODUCT_META = { name, category, price, qty, meta: { cost, sku, notes } };
      pushMovement({ type: "add", title: `Producto agregado: ${name}`, detail: `${category} · ${formatMoney(price)} · stock ${qty}`, amount: "Nuevo" });
    }

    if (helper) {
      helper.textContent = normalizedImages.length
        ? `Fotos optimizadas para guardado móvil. (${normalizedImages.length} imagen${normalizedImages.length === 1 ? "" : "es"}). La primera queda como portada.`
        : "Puedes subir hasta 5 fotos. La primera será la portada y la app las reduce automáticamente antes de guardar.";
    }

    invCloseModal();
    await loadProducts();
    showToast("Producto guardado correctamente.");
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el producto.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar producto";
    }
    showLoading(false);
  }
}

async function updateStock(id, change, source = "Ajuste rápido") {
  const product = getProductById(id);
  if (!product) return;
  if (Number(product.qty || 0) + Number(change || 0) < 0) {
    alert("No puedes dejar el stock en negativo.");
    return;
  }
  try {
    showLoading(true, change > 0 ? "Aumentando stock..." : "Reduciendo stock...");
    await postToApi({ action: "stock", id, change, user: CURRENT_USER.alias });
    pushMovement({
      type: "stock",
      title: `${change > 0 ? "Entrada" : "Salida"} de stock: ${product.name}`,
      detail: `${source} · cambio ${change > 0 ? `+${change}` : change} · existencias previas ${product.qty}`,
      amount: change > 0 ? `+${change}` : `${change}`
    });
    await loadProducts();
    if (ACTIVE_DETAIL_ID && String(ACTIVE_DETAIL_ID) === String(id)) viewProduct(id);
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar el stock.");
  } finally {
    showLoading(false);
  }
}

async function deleteProduct(id) {
  const product = getProductById(id);
  if (!product || !window.confirm("¿Eliminar este producto?")) return;
  try {
    showLoading(true, "Eliminando producto...");
    await postToApi({ action: "delete", id, user: CURRENT_USER.alias });
    pushMovement({ type: "delete", title: `Producto eliminado: ${product.name}`, detail: `${product.category} · ${formatMoney(product.price)}`, amount: "Eliminado" });
    closeDetailModal();
    await loadProducts();
    showToast("Producto eliminado.");
  } catch (error) {
    console.error(error);
    alert("No se pudo eliminar el producto.");
  } finally {
    showLoading(false);
  }
}

function viewProduct(id) {
  const product = getProductById(id);
  const modal = document.getElementById("detail-modal");
  if (!product || !modal) return;
  ACTIVE_DETAIL_ID = id;
  const images = parseImages(product.images);
  const gallery = images.length ? images : [getPlaceholderImage("Sin imagen")];
  const qty = Number(product.qty || 0);
  setText("detail-name", product.name || "Producto");
  setText("detail-price", formatMoney(product.price));
  setText("detail-category", product.category || "Sin categoría");
  setText("detail-stock", qty > 0 ? `Stock: ${qty}` : "Agotado");
  setText("detail-sku", product.sku || `ID ${product.id || "--"}`);
  setText("detail-summary-price", formatMoney(product.price));
  setText("detail-summary-cost", formatMoney(product.cost));
  setText("detail-summary-margin", formatMoney(product.margin));
  setText("detail-summary-stock", qty > 0 ? qty : "0");
  setText("detail-image-counter", `1 / ${gallery.length}`);
  setText("detail-meta-note", qty > 0 ? `${qty} unidades disponibles · Código ${product.id || "--"}` : `Producto agotado · Código ${product.id || "--"}`);
  setText("detail-notes", product.notes || "Sin notas internas.");
  const main = document.getElementById("detail-main-img");
  if (main) main.src = gallery[0];
  const thumbs = document.getElementById("detail-thumbs");
  if (thumbs) {
    thumbs.innerHTML = gallery.map((img, index) => `
      <button type="button" class="detail-thumb ${index === 0 ? "is-active" : ""}" onclick="swapDetailImage('${escapeHtml(img)}', ${index + 1}, ${gallery.length}, this)">
        <img src="${img}" alt="Miniatura ${index + 1}">
      </button>`).join("");
  }
  document.getElementById("detail-edit-btn").onclick = () => startEditById(id);
  document.getElementById("detail-delete-btn").onclick = () => deleteProduct(id);
  document.getElementById("detail-sale-btn").onclick = () => openSaleModal(id);
  modal.style.display = "flex";
}

function swapDetailImage(src, index, total, button) {
  const main = document.getElementById("detail-main-img");
  if (main) main.src = src;
  setText("detail-image-counter", `${index} / ${total}`);
  document.querySelectorAll(".detail-thumb").forEach((item) => item.classList.remove("is-active"));
  if (button) button.classList.add("is-active");
}

function closeDetailModal() {
  const modal = document.getElementById("detail-modal");
  if (modal) modal.style.display = "none";
  ACTIVE_DETAIL_ID = null;
}

async function quickAdjustDetailStock(change) {
  if (!ACTIVE_DETAIL_ID) return;
  await updateStock(ACTIVE_DETAIL_ID, change, "Ajuste desde ficha");
}

function getShippingCatalog(zone) {
  return zone === "COMAYAGUA" ? COMAYAGUA_SHIPPING_OPTIONS : NATIONAL_SHIPPING_OPTIONS;
}

function populateShippingOptionSelect() {
  const zoneSelect = document.getElementById("sale-shipping-zone");
  const optionSelect = document.getElementById("sale-shipping-option");
  const preview = document.getElementById("sale-shipping-preview");
  if (!zoneSelect || !optionSelect) return;
  const zone = zoneSelect.value === "COMAYAGUA" ? "COMAYAGUA" : "NACIONAL";
  const items = getShippingCatalog(zone);
  optionSelect.innerHTML = items.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)} · ${formatMoney(item.price)}</option>`).join("");
  const first = items[0];
  if (preview) {
    preview.textContent = first ? `${zone === "COMAYAGUA" ? "Comayagua" : "Nacional"}: ${first.label} · ${formatMoney(first.price)}` : "";
  }
  updateSaleSummary();
}

function getSelectedShipping() {
  const enabled = document.getElementById("sale-shipping-enabled")?.checked;
  if (!enabled) return null;
  const zone = document.getElementById("sale-shipping-zone")?.value === "COMAYAGUA" ? "COMAYAGUA" : "NACIONAL";
  const optionId = document.getElementById("sale-shipping-option")?.value || "";
  const item = getShippingCatalog(zone).find((entry) => entry.id === optionId) || null;
  if (!item) return null;
  return {
    id: `shipping-${zone.toLowerCase()}-${item.id}`,
    type: "shipping",
    zone,
    name: zone === "COMAYAGUA" ? `Envío Comayagua · ${item.label}` : `Envío Nacional · ${item.label}`,
    sku: zone === "COMAYAGUA" ? "ENV-COM" : "ENV-NAC",
    qty: 1,
    price: Number(item.price || 0),
    cost: 0,
    total: Number(item.price || 0),
    profit: Number(item.price || 0)
  };
}

function toggleShippingFields() {
  const enabled = document.getElementById("sale-shipping-enabled")?.checked;
  const fields = document.getElementById("sale-shipping-fields");
  if (fields) fields.hidden = !enabled;
  if (enabled) populateShippingOptionSelect();
  updateSaleSummary();
}

function resetSaleModal() {
  SALE_CART = [];
  document.getElementById("sale-customer").value = "";
  document.getElementById("sale-payment").value = "Efectivo";
  document.getElementById("sale-qty").value = "1";
  document.getElementById("sale-price").value = "0";
  document.getElementById("sale-discount").value = "0";
  document.getElementById("sale-note").value = "";
  document.getElementById("sale-shipping-enabled").checked = false;
  document.getElementById("sale-shipping-zone").value = "NACIONAL";
  populateShippingOptionSelect();
  toggleShippingFields();
  renderSaleCart();
  updateSaleSummary();
}

function openSaleModal(preselectedId = "") {
  const modal = document.getElementById("sale-modal");
  if (!modal) return;
  resetSaleModal();
  populateSaleProductSelect(preselectedId);
  if (preselectedId) {
    const select = document.getElementById("sale-product-select");
    if (select) select.value = preselectedId;
  }
  syncSaleFormFromSelectedProduct();
  modal.style.display = "flex";
}

function closeSaleModal() {
  const modal = document.getElementById("sale-modal");
  if (modal) modal.style.display = "none";
  SALE_CART = [];
}

function renderSaleCart() {
  const wrap = document.getElementById("sale-cart-list");
  if (!wrap) return;
  const shipping = getSelectedShipping();
  if (!SALE_CART.length && !shipping) {
    wrap.innerHTML = '<div class="list-empty">Aún no has agregado productos a esta venta.</div>';
    return;
  }
  const productCards = SALE_CART.map((line, index) => `
    <article class="list-card glass-panel">
      <div class="list-card-head">
        <div>
          <strong>${escapeHtml(line.name)}</strong>
          <p>${line.qty} x ${formatMoney(line.price)}</p>
        </div>
        <span class="list-amount">${formatMoney(line.total)}</span>
      </div>
      <div class="list-card-meta">
        <span>Ganancia ${formatMoney(line.profit)}</span>
        <span>${escapeHtml(line.sku || `ID ${line.id}`)}</span>
      </div>
      <div class="list-card-actions">
        <button class="mini-icon-btn danger" type="button" onclick="removeSaleLine(${index})"><span>✕</span><small>Quitar</small></button>
      </div>
    </article>`).join("");
  const shippingCard = shipping ? `
    <article class="list-card glass-panel shipping-line-card">
      <div class="list-card-head">
        <div>
          <strong>${escapeHtml(shipping.name)}</strong>
          <p>${shipping.zone === "COMAYAGUA" ? "Tarifa por colonia" : "Tarifa nacional"}</p>
        </div>
        <span class="list-amount">${formatMoney(shipping.total)}</span>
      </div>
      <div class="list-card-meta">
        <span>Opcional activado</span>
        <span>${escapeHtml(shipping.sku)}</span>
      </div>
    </article>` : "";
  wrap.innerHTML = productCards + shippingCard;
}

function addSaleLine() {
  const product = getProductById(document.getElementById("sale-product-select")?.value);
  const qty = Number(document.getElementById("sale-qty")?.value || 0);
  const price = Number(document.getElementById("sale-price")?.value || 0);
  if (!product || qty <= 0 || price < 0) {
    alert("Selecciona un producto y una cantidad válida.");
    return;
  }
  const currentQtyInCart = SALE_CART.filter((item) => String(item.id) === String(product.id)).reduce((sum, item) => sum + Number(item.qty || 0), 0);
  if (qty + currentQtyInCart > Number(product.qty || 0)) {
    alert("No hay suficiente stock para esa cantidad.");
    return;
  }
  SALE_CART.push({
    id: product.id,
    name: product.name,
    sku: product.sku,
    qty,
    price,
    cost: Number(product.cost || 0),
    total: qty * price,
    profit: qty * (price - Number(product.cost || 0))
  });
  renderSaleCart();
  updateSaleSummary();
  document.getElementById("sale-qty").value = "1";
  syncSaleFormFromSelectedProduct();
}

function removeSaleLine(index) {
  SALE_CART.splice(index, 1);
  renderSaleCart();
  updateSaleSummary();
}

function updateSaleSummary() {
  const shipping = getSelectedShipping();
  const productsSubtotal = SALE_CART.reduce((sum, line) => sum + Number(line.total || 0), 0);
  const shippingTotal = Number(shipping?.total || 0);
  const subtotal = productsSubtotal + shippingTotal;
  const baseProfit = SALE_CART.reduce((sum, line) => sum + Number(line.profit || 0), 0) + Number(shipping?.profit || 0);
  const discount = Number(document.getElementById("sale-discount")?.value || 0);
  const total = Math.max(0, subtotal - discount);
  const profit = Math.max(0, baseProfit - discount);
  setText("sale-subtotal", formatMoney(subtotal));
  setText("sale-discount-total", formatMoney(discount));
  setText("sale-total", formatMoney(total));
  setText("sale-profit", formatMoney(profit));
  setText("sale-shipping-total", formatMoney(shippingTotal));
  const shippingLabel = document.getElementById("sale-shipping-preview");
  if (shippingLabel) shippingLabel.textContent = shipping ? `${shipping.name} · ${formatMoney(shipping.total)}` : "Sin envío agregado";
  renderSaleCart();
  return { subtotal, discount, total, profit, shippingTotal };
}

function buildReceiptNumber() {
  const receipts = getReceipts();
  return String(receipts.length + 1).padStart(4, "0");
}

async function deleteSale(saleId) {
  const sales = getSales();
  const sale = sales.find((item) => String(item.id) === String(saleId));
  if (!sale) {
    alert("No se encontró esa venta.");
    return;
  }
  if (!window.confirm(`¿Eliminar la venta #${sale.number}? Esto regresará el stock de los productos.`)) return;

  try {
    showLoading(true, "Eliminando venta y restaurando stock...");
    for (const line of sale.items || []) {
      if (line.type === "shipping") {
        pushMovement({
          type: "delete",
          title: `Envío eliminado: ${line.name}`,
          detail: `Se retiró el cargo opcional del comprobante`,
          amount: formatMoney(line.total || 0)
        });
        continue;
      }
      await postToApi({ action: "stock", id: line.id, change: Math.abs(Number(line.qty || 0)), user: CURRENT_USER.alias });
      pushMovement({
        type: "delete",
        title: `Venta eliminada: ${line.name}`,
        detail: `Se devolvió ${line.qty} unidad(es) al stock`,
        amount: formatMoney(line.total || 0)
      });
    }
    setSales(sales.filter((item) => String(item.id) !== String(saleId)));
    setReceipts(getReceipts().filter((item) => String(item.id) !== String(sale.receiptId)));
    await loadProducts();
    showToast("Venta eliminada y stock restaurado.");
  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo eliminar la venta.");
  } finally {
    showLoading(false);
  }
}

async function completeSale() {
  const shipping = getSelectedShipping();
  if (!SALE_CART.length && !shipping) {
    alert("Agrega al menos un producto o un envío a la venta.");
    return;
  }
  const summary = updateSaleSummary();
  const customer = document.getElementById("sale-customer")?.value.trim() || "Cliente general";
  const payment = document.getElementById("sale-payment")?.value || "Efectivo";
  const note = document.getElementById("sale-note")?.value.trim() || "";
  const btn = document.getElementById("complete-sale-btn");
  try {
    btn.disabled = true;
    btn.textContent = "Procesando venta...";
    showLoading(true, "Guardando venta y actualizando stock...");

    for (const line of SALE_CART) {
      const product = getProductById(line.id);
      if (!product || Number(product.qty || 0) < Number(line.qty || 0)) {
        throw new Error(`Stock insuficiente para ${line.name}.`);
      }
    }

    for (const line of SALE_CART) {
      await postToApi({ action: "stock", id: line.id, change: -Math.abs(line.qty), user: CURRENT_USER.alias });
    }

    const number = buildReceiptNumber();
    const receiptId = `R-${Date.now()}`;
    const sale = {
      id: `S-${Date.now()}`,
      receiptId,
      number,
      createdAt: new Date().toISOString(),
      customer,
      payment,
      note,
      subtotal: summary.subtotal,
      discount: summary.discount,
      total: summary.total,
      profit: summary.profit,
      shipping: shipping ? { ...shipping } : null,
      items: [...SALE_CART.map((line) => ({ ...line })), ...(shipping ? [{ ...shipping }] : [])],
      user: CURRENT_USER.alias
    };
    const receipt = { ...sale, id: receiptId };
    pushSale(sale);
    pushReceipt(receipt);

    SALE_CART.forEach((line) => {
      pushMovement({
        type: "sale",
        title: `Venta: ${line.name}`,
        detail: `${line.qty} unidad(es) · ${customer} · ${payment}`,
        amount: formatMoney(line.total)
      });
    });

    if (shipping) {
      pushMovement({
        type: "sale",
        title: `Envío agregado: ${shipping.zone === "COMAYAGUA" ? "Comayagua" : "Nacional"}`,
        detail: `${shipping.name} · ${customer}`,
        amount: formatMoney(shipping.total)
      });
    }

    closeSaleModal();
    await loadProducts();
    openReceiptModal(receiptId, false);
    showToast("Venta registrada.");
  } catch (error) {
    console.error(error);
    alert(error.message || "No se pudo completar la venta.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Confirmar venta y generar comprobante";
    showLoading(false);
  }
}

function findReceipt(receiptId) {
  return getReceipts().find((item) => String(item.id) === String(receiptId));
}

function buildReceiptHtml(receipt) {
  const itemsRows = receipt.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.sku || "--")}</td>
      <td>${item.qty}</td>
      <td>${formatMoney(item.price)}</td>
      <td>${formatMoney(item.total)}</td>
    </tr>`).join("");
  return `<!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Comprobante ${receipt.number}</title>
    <style>
      body{font-family:Inter,Arial,sans-serif;background:#f5f7fb;color:#0f172a;padding:32px}
      .paper{max-width:820px;margin:0 auto;background:#fff;border-radius:24px;padding:32px;box-shadow:0 20px 44px rgba(15,23,42,.08)}
      h1,h2,p{margin:0} .top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:24px}
      .muted{color:#64748b}.block{margin-bottom:18px}.pill{display:inline-block;padding:6px 12px;border-radius:999px;background:#edf2ff;color:#1e3a8a;font-size:12px;font-weight:700}
      table{width:100%;border-collapse:collapse;margin-top:16px} th,td{padding:12px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:14px}
      .totals{margin-top:24px;display:grid;gap:10px;justify-items:end}.totals strong{font-size:18px}
      .footer{margin-top:26px;padding-top:16px;border-top:1px solid #e2e8f0}
      @media print {body{background:#fff;padding:0}.paper{box-shadow:none;border-radius:0;max-width:none;padding:20px}}
    </style>
  </head>
  <body>
    <div class="paper">
      <div class="top">
        <div>
          <span class="pill">Comprobante</span>
          <h1 style="margin-top:12px">Inventario</h1>
          <p class="muted">Comprobante limpio y profesional</p>
        </div>
        <div style="text-align:right">
          <h2>#${receipt.number}</h2>
          <p class="muted">${formatDateTime(receipt.createdAt)}</p>
          <p class="muted">Atendido por ${escapeHtml(receipt.user || "Admin")}</p>
        </div>
      </div>

      <div class="block">
        <p><strong>Cliente:</strong> ${escapeHtml(receipt.customer || "Cliente general")}</p>
        <p><strong>Pago:</strong> ${escapeHtml(receipt.payment || "Efectivo")}</p>
        ${receipt.note ? `<p><strong>Nota:</strong> ${escapeHtml(receipt.note)}</p>` : ""}
      </div>

      <table>
        <thead>
          <tr><th>Producto</th><th>SKU</th><th>Cant.</th><th>Precio</th><th>Total</th></tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>

      <div class="totals">
        <p>Subtotal: <strong>${formatMoney(receipt.subtotal)}</strong></p>
        <p>Descuento: <strong>${formatMoney(receipt.discount)}</strong></p>
        <p>Total: <strong>${formatMoney(receipt.total)}</strong></p>
        <p>Ganancia estimada: <strong>${formatMoney(receipt.profit)}</strong></p>
      </div>

      <div class="footer muted">
        <p>Documento generado desde la app Inventario.</p>
      </div>
    </div>
  </body>
  </html>`;
}

function openReceiptModal(receiptId, autoPrint = false) {
  const receipt = findReceipt(receiptId);
  if (!receipt) {
    alert("No se encontró el comprobante.");
    return;
  }
  ACTIVE_RECEIPT_ID = receiptId;
  const modal = document.getElementById("receipt-modal");
  const frame = document.getElementById("receipt-frame");
  const title = document.getElementById("receipt-modal-title");
  if (!modal || !frame) return;
  if (title) title.textContent = `Comprobante #${receipt.number}`;
  frame.srcdoc = buildReceiptHtml(receipt);
  modal.style.display = "flex";
  if (autoPrint) {
    frame.onload = () => {
      setTimeout(() => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
        } catch {}
      }, 180);
      frame.onload = null;
    };
  }
}

function closeReceiptModal() {
  const modal = document.getElementById("receipt-modal");
  const frame = document.getElementById("receipt-frame");
  if (modal) modal.style.display = "none";
  if (frame) frame.srcdoc = "";
}

function openReceiptWindow(receiptId, autoPrint = false) {
  openReceiptModal(receiptId, autoPrint);
}

function openReceiptInTab(receiptId, autoPrint = false) {
  const receipt = findReceipt(receiptId);
  if (!receipt) {
    alert("No se encontró el comprobante.");
    return;
  }
  const html = buildReceiptHtml(receipt);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    openReceiptModal(receiptId, autoPrint);
    showToast("Se abrió el comprobante dentro de la app.");
    return;
  }
  win.onload = () => {
    if (autoPrint) {
      setTimeout(() => {
        try {
          win.focus();
          win.print();
        } catch {}
      }, 250);
    }
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };
}

function openCurrentReceiptInTab() {
  if (!ACTIVE_RECEIPT_ID) return;
  openReceiptInTab(ACTIVE_RECEIPT_ID, false);
}

function printCurrentReceipt() {
  const frame = document.getElementById("receipt-frame");
  if (!frame) return;
  try {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  } catch {
    if (ACTIVE_RECEIPT_ID) openReceiptInTab(ACTIVE_RECEIPT_ID, true);
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeSheets() {
  ["summary-panel", "filters-panel"].forEach((id) => document.getElementById(id)?.classList.add("hidden"));
  document.body.classList.remove("sheet-open");
}

function togglePanel(panelId) {
  const panels = ["summary-panel", "filters-panel"];
  let opened = false;
  panels.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === panelId) {
      const willOpen = el.classList.contains("hidden");
      el.classList.toggle("hidden", !willOpen);
      opened = willOpen;
    } else {
      el.classList.add("hidden");
    }
  });
  document.body.classList.toggle("sheet-open", opened);
}

function toggleSummaryPanel() { togglePanel("summary-panel"); }
function toggleFiltersPanel() { togglePanel("filters-panel"); }

function setQuickStockFilter(value) {
  const filter = document.getElementById("inv-stock-filter");
  if (!filter) return;
  filter.value = value;
  applyFilters();
  scrollToSection("productos");
}

window.addEventListener("DOMContentLoaded", () => {
  if (isInventoryPage()) setupAppPage();
  else setupLoginPage();
});

window.invOpenModal = invOpenModal;
window.invCloseModal = invCloseModal;
window.invLogin = invLogin;
window.invLogout = invLogout;
window.toggleTheme = toggleTheme;
window.installApp = installApp;
window.loadProducts = loadProducts;
window.changePage = changePage;
window.clearFilters = clearFilters;
window.toggleSummaryPanel = toggleSummaryPanel;
window.toggleFiltersPanel = toggleFiltersPanel;
window.setQuickStockFilter = setQuickStockFilter;
window.setCategoryFilter = setCategoryFilter;
window.triggerImportBackup = triggerImportBackup;
window.importInventoryBackup = importInventoryBackup;
window.exportInventoryBackup = exportInventoryBackup;
window.startEditById = startEditById;
window.invPreviewImage = invPreviewImage;
window.updateStock = updateStock;
window.deleteProduct = deleteProduct;
window.viewProduct = viewProduct;
window.swapDetailImage = swapDetailImage;
window.closeDetailModal = closeDetailModal;
window.quickAdjustDetailStock = quickAdjustDetailStock;
window.scrollToTop = scrollToTop;
window.scrollToSection = scrollToSection;
window.closeSheets = closeSheets;
window.openSaleModal = openSaleModal;
window.closeSaleModal = closeSaleModal;
window.deleteSale = deleteSale;
window.toggleActivityPanel = toggleActivityPanel;
window.addSaleLine = addSaleLine;
window.removeSaleLine = removeSaleLine;
window.updateSaleSummary = updateSaleSummary;
window.completeSale = completeSale;
window.openReceiptWindow = openReceiptWindow;
window.openReceiptModal = openReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.openReceiptInTab = openReceiptInTab;
window.openCurrentReceiptInTab = openCurrentReceiptInTab;
window.printCurrentReceipt = printCurrentReceipt;
window.invSaveProduct = invSaveProduct;
window.invChangeItemsPerPage = invChangeItemsPerPage;
