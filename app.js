const API_URL = "https://script.google.com/macros/s/AKfycbyL-7yiraIZB0f0xqA5axDv-emMYCyNcT66mhOQ7sjxyDVeF2KWijPxm49VMhT3lxQ/exec";
const STORAGE_KEYS = {
  session: "invSession",
  theme: "invTheme"
};

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

const money = new Intl.NumberFormat("es-HN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const IMAGE_RULES = {
  maxImages: 5,
  totalChars: 46000,
  hardTotalChars: 48000,
  singleImageMaxChars: 14000,
  minImageChars: 3500,
  minSide: 170,
  maxSideSingle: 420,
  maxSideMulti: 320,
  minQuality: 0.14
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

function isInventoryPage() {
  return window.location.pathname.includes("inventario.html");
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || "null");
  } catch {
    return null;
  }
}

function saveSession(username) {
  const user = USERS[username];
  if (!user) return;
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ username, ...user }));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function parseImages(raw) {
  try {
    if (Array.isArray(raw)) return raw.filter(Boolean);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getPlaceholderImage(label = "Sin imagen") {
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#111827"/>
          <stop offset="1" stop-color="#1f2937"/>
        </linearGradient>
      </defs>
      <rect width="800" height="800" fill="url(#g)"/>
      <text x="400" y="410" text-anchor="middle" fill="#cbd5e1" font-size="44" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `)}`;
}

function getProductById(id) {
  return PRODUCTS.find((product) => String(product.id) === String(id));
}

function applySavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(saved === "light" ? "theme-light" : "theme-dark");
  updateThemeControls();
}

function updateThemeControls() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.textContent = document.body.classList.contains("theme-dark") ? "☀️" : "🌙";
}

function toggleTheme() {
  const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
  localStorage.setItem(STORAGE_KEYS.theme, next);
  applySavedTheme();
}

function invLogin() {
  const userInput = document.getElementById("inv-user");
  const passInput = document.getElementById("inv-pass");
  if (!userInput || !passInput) return;

  const username = userInput.value.trim().toLowerCase();
  const password = passInput.value.trim();
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

function ensureAuthenticated() {
  const session = getSession();
  if (!session || !USERS[session.username]) {
    window.location.href = "index.html";
    return false;
  }
  CURRENT_USER = session;
  return true;
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
    }
  });

  window.addEventListener("click", (event) => {
    const modal = document.getElementById("inv-modal");
    const detail = document.getElementById("detail-modal");
    if (event.target === modal) invCloseModal();
    if (event.target === detail) closeDetailModal();
  });
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
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", applyFilters);
  });

  ["inv-search", "inv-min-price", "inv-max-price"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", applyFilters);
  });

  document.getElementById("inv-items-per-page")?.addEventListener("change", invChangeItemsPerPage);
}

function showLoading(show, label = "Cargando...") {
  let overlay = document.getElementById("loading-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "loading-overlay";
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
      <div class="loading-box glass-panel">
        <div class="spinner"></div>
        <div id="loading-text"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const text = document.getElementById("loading-text");
  if (text) text.textContent = label;
  overlay.style.display = show ? "grid" : "none";
}

function updateSyncMeta() {
  if (!LAST_SYNC_AT) return;
  const label = LAST_SYNC_AT.toLocaleTimeString("es-HN", {
    hour: "2-digit",
    minute: "2-digit"
  });
  setText("sync-status", "Sincronizado");
  setText("sync-time-pill", `Actualizado ${label}`);
}

async function loadProducts(showRefreshFeedback = false) {
  if (showRefreshFeedback) showLoading(true, "Actualizando inventario...");

  try {
    const response = await fetch(`${API_URL}?action=get`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo consultar el inventario.");

    const data = await response.json();
    PRODUCTS = Array.isArray(data.products) ? data.products : [];
    FILTERED = [...PRODUCTS];
    LAST_SYNC_AT = new Date();

    loadCategories();
    updateDashboard();
    renderHistory(data.history || []);
    applyFilters();
  } catch (error) {
    console.error(error);
    PRODUCTS = [];
    FILTERED = [];
    updateDashboard();
    renderProducts();
    renderHistory([]);
    alert("No se pudieron cargar los productos.");
  } finally {
    showLoading(false);
  }
}

function updateDashboard() {
  const totalProducts = PRODUCTS.length;
  const totalQty = PRODUCTS.reduce((sum, item) => sum + Number(item.qty || 0), 0);
  const totalValue = PRODUCTS.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const outCount = PRODUCTS.filter((item) => Number(item.qty || 0) <= 0).length;
  const inStock = PRODUCTS.filter((item) => Number(item.qty || 0) > 0).length;
  const categoryCount = new Set(PRODUCTS.map((item) => String(item.category || "").trim()).filter(Boolean)).size;
  const avgPrice = totalProducts ? PRODUCTS.reduce((sum, item) => sum + Number(item.price || 0), 0) / totalProducts : 0;

  setText("dash-total-products", totalProducts);
  setText("dash-total-qty", totalQty);
  setText("dash-total-value", `Lps. ${money.format(totalValue)}`);
  setText("dash-out-count", outCount);
  setText("dash-category-count", categoryCount);
  setText("dash-in-stock", inStock);
  setText("dash-avg-price", `Lps. ${money.format(avgPrice)}`);
  updateSyncMeta();
}

function loadCategories() {
  const select = document.getElementById("inv-filter");
  if (!select) return;

  const categories = [...new Set(PRODUCTS.map((item) => String(item.category || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));
  const current = select.value || "all";

  select.innerHTML = '<option value="all">Todas</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  select.value = categories.includes(current) ? current : "all";
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
    const lookup = `${name} ${productCategory}`.toLowerCase();

    if (category !== "all" && productCategory !== category) return false;
    if (stock === "in" && qty <= 0) return false;
    if (stock === "out" && qty > 0) return false;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;
    if (search && !lookup.includes(search)) return false;
    return true;
  });

  FILTERED.sort((a, b) => {
    if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""), "es");
    if (sort === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
    if (sort === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
    if (sort === "qtyAsc") return Number(a.qty || 0) - Number(b.qty || 0);
    if (sort === "qtyDesc") return Number(b.qty || 0) - Number(a.qty || 0);
    return String(a.name || "").localeCompare(String(b.name || ""), "es");
  });

  CURRENT_PAGE = 1;
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
    const safeId = String(product.id || "");
    const safeName = escapeHtml(product.name || "Sin nombre");

    const card = document.createElement("article");
    card.className = "product-card glass-panel";
    card.innerHTML = `
      <button class="product-tile" type="button" onclick="viewProduct('${safeId}')" aria-label="Abrir ${safeName}">
        <div class="product-media">
          <img class="product-main-img" src="${mainImage}" alt="${safeName}">
          <span class="product-status ${inStock ? "in" : "out"}">${inStock ? "Disponible" : "Agotado"}</span>
        </div>
        <div class="product-copy">
          <h3 class="product-name">${safeName}</h3>
          <p class="product-stock-line">${inStock ? `${qty} en stock` : "Sin existencias"}</p>
        </div>
      </button>
      <div class="card-actions compact">
        <button class="btn-secondary" type="button" onclick="startEditById('${safeId}')">Editar</button>
        <button class="btn-secondary danger" type="button" onclick="deleteProduct('${safeId}')">Eliminar</button>
      </div>
    `;
    container.appendChild(card);
  });

  renderPagination();
}

function renderPagination() {
  const container = document.getElementById("inv-pagination");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  container.innerHTML = `
    <button type="button" ${CURRENT_PAGE <= 1 ? "disabled" : ""} onclick="changePage(-1)">Anterior</button>
    <span>${CURRENT_PAGE} / ${totalPages}</span>
    <button type="button" ${CURRENT_PAGE >= totalPages ? "disabled" : ""} onclick="changePage(1)">Siguiente</button>
  `;
}

function changePage(direction) {
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  CURRENT_PAGE = Math.max(1, Math.min(totalPages, CURRENT_PAGE + direction));
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
    "inv-search": "",
    "inv-filter": "all",
    "inv-stock-filter": "all",
    "inv-min-price": "",
    "inv-max-price": "",
    "inv-sort": "featured",
    "inv-items-per-page": "12"
  };

  Object.entries(defaults).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });

  ITEMS_PER_PAGE = 12;
  CURRENT_PAGE = 1;
  applyFilters();
}

function renderHistory(history) {
  const list = document.getElementById("inv-history-list");
  if (!list) return;

  list.innerHTML = "";
  const items = Array.isArray(history) ? history.slice(0, 20) : [];
  if (!items.length) {
    list.innerHTML = "<li>No hay movimientos recientes todavía.</li>";
    return;
  }

  items.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    list.appendChild(li);
  });
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
  ["inv-name", "inv-price", "inv-qty", "inv-category"].forEach((id) => {
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
    if (current) {
      setImageSlotState(i, { src: current, label: "Imagen actual", filled: true });
    }
  }
}

function invOpenModal(isEdit = false, product = null) {
  const modal = document.getElementById("inv-modal");
  const title = document.getElementById("inv-modal-title");
  if (!modal || !title) return;

  clearModalFields();

  if (isEdit && product) {
    EDITING_ID = product.id;
    title.textContent = "Editar producto";
    document.getElementById("inv-name").value = product.name || "";
    document.getElementById("inv-price").value = product.price || "";
    document.getElementById("inv-qty").value = product.qty || "";
    document.getElementById("inv-category").value = product.category || "";
    populateExistingImages(parseImages(product.images));
  } else {
    EDITING_ID = null;
    CURRENT_EDIT_IMAGES = [];
    title.textContent = "Agregar producto";
  }

  modal.style.display = "flex";
  requestAnimationFrame(() => {
    document.querySelector(".modal-content.modal-form")?.scrollTo({ top: 0 });
  });
}

function invCloseModal() {
  const modal = document.getElementById("inv-modal");
  if (modal) modal.style.display = "none";
  EDITING_ID = null;
  CURRENT_EDIT_IMAGES = [];
  clearModalFields();
}

function startEditById(id) {
  const product = getProductById(id);
  if (!product) return;
  closeDetailModal();
  invOpenModal(true, product);
}

function invPreviewImage(input, previewId) {
  const file = input.files?.[0];
  const index = Number(String(previewId).replace("prev", "")) || 1;

  if (!file) {
    const existing = CURRENT_EDIT_IMAGES[index - 1] || "";
    if (existing) {
      setImageSlotState(index, { src: existing, label: "Imagen actual", filled: true });
    } else {
      setImageSlotState(index, { src: "", label: "Sin archivo", filled: false });
    }
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    setImageSlotState(index, {
      src: event.target?.result || "",
      label: file.name,
      filled: true
    });
  };
  reader.readAsDataURL(file);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = dataUrl;
  });
}

async function compressImageSource(source, options = {}) {
  const dataUrl = typeof source === "string" ? source : await fileToBase64(source);
  if (!String(dataUrl).startsWith("data:image/")) return dataUrl;

  const targetChars = options.targetChars || IMAGE_RULES.singleImageMaxChars;
  const maxSide = options.maxSide || IMAGE_RULES.maxSideSingle;
  const minSide = options.minSide || IMAGE_RULES.minSide;
  let quality = options.initialQuality || 0.64;

  const image = await loadImageFromDataUrl(dataUrl);
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  let width = Math.max(minSide, Math.round(image.width * ratio));
  let height = Math.max(minSide, Math.round(image.height * ratio));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return dataUrl;

  const render = (w, h, q) => {
    canvas.width = w;
    canvas.height = h;
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(image, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", q);
  };

  let output = render(width, height, quality);
  let guard = 0;

  while (output.length > targetChars && guard < 18) {
    if (quality > IMAGE_RULES.minQuality) {
      quality = Math.max(IMAGE_RULES.minQuality, quality - 0.08);
    } else if (Math.max(width, height) > minSide) {
      width = Math.max(minSide, Math.round(width * 0.86));
      height = Math.max(minSide, Math.round(height * 0.86));
    } else {
      break;
    }
    output = render(width, height, quality);
    guard += 1;
  }

  return output;
}

async function normalizeImagesForSave(images) {
  let finalImages = [...images];
  let total = JSON.stringify(finalImages).length;
  if (total <= IMAGE_RULES.totalChars) return finalImages;

  const count = Math.max(1, finalImages.length);
  let targetChars = Math.max(
    IMAGE_RULES.minImageChars,
    Math.min(IMAGE_RULES.singleImageMaxChars, Math.floor((IMAGE_RULES.totalChars - 400) / count))
  );

  finalImages = await Promise.all(
    finalImages.map((img) => compressImageSource(img, {
      targetChars,
      maxSide: count > 1 ? IMAGE_RULES.maxSideMulti : IMAGE_RULES.maxSideSingle,
      initialQuality: 0.52
    }))
  );

  total = JSON.stringify(finalImages).length;
  let safety = 0;

  while (total > IMAGE_RULES.hardTotalChars && safety < 6) {
    targetChars = Math.max(IMAGE_RULES.minImageChars, Math.floor(targetChars * 0.8));
    finalImages = await Promise.all(
      finalImages.map((img) => compressImageSource(img, {
        targetChars,
        maxSide: Math.max(IMAGE_RULES.minSide, IMAGE_RULES.maxSideMulti - safety * 20),
        initialQuality: 0.4
      }))
    );
    total = JSON.stringify(finalImages).length;
    safety += 1;
  }

  return finalImages;
}

async function postToApi(payload) {
  const attempts = [
    async (signal) => fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      redirect: "follow",
      signal
    }),
    async (signal) => fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal
    })
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
      if (/exception|error|failed/i.test(text) && !/ok|success|guardado|actualizado|eliminado/i.test(text)) {
        throw new Error(text);
      }
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
  const qty = Number(document.getElementById("inv-qty")?.value || 0);

  if (!name || !category || Number.isNaN(price) || Number.isNaN(qty) || price < 0 || qty < 0) {
    alert("Completa nombre, categoría, precio y cantidad válidos.");
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
    const targetChars = Math.max(
      IMAGE_RULES.minImageChars,
      Math.min(IMAGE_RULES.singleImageMaxChars, Math.floor((IMAGE_RULES.totalChars - 400) / selectedCount))
    );

    const finalImages = [];
    for (let i = 1; i <= IMAGE_RULES.maxImages; i += 1) {
      const input = document.getElementById(`inv-img${i}`);
      const file = input?.files?.[0];
      if (file) {
        finalImages.push(await compressImageSource(file, {
          targetChars,
          maxSide: selectedCount > 1 ? IMAGE_RULES.maxSideMulti : IMAGE_RULES.maxSideSingle,
          initialQuality: 0.56
        }));
      } else if (CURRENT_EDIT_IMAGES[i - 1]) {
        finalImages.push(CURRENT_EDIT_IMAGES[i - 1]);
      }
    }

    const normalizedImages = await normalizeImagesForSave(finalImages);
    const imagesJson = JSON.stringify(normalizedImages);

    if (imagesJson.length > IMAGE_RULES.hardTotalChars) {
      throw new Error("Las fotos siguen pasando el límite de guardado del inventario.");
    }

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

    if (helper) {
      helper.textContent = normalizedImages.length
        ? `Fotos optimizadas para guardado móvil. (${normalizedImages.length} imagen${normalizedImages.length === 1 ? "" : "es"})`
        : "Puedes subir hasta 5 fotos. La app las reduce automáticamente antes de guardar.";
    }

    invCloseModal();
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el producto con foto. Ya dejé una compresión mucho más fuerte, pero tu Google Sheets o Apps Script está aceptando muy poco tamaño por producto. Prueba con 1 foto por producto y esta versión nueva.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar producto";
    }
    showLoading(false);
  }
}

async function updateStock(id, change) {
  try {
    showLoading(true, change > 0 ? "Aumentando stock..." : "Reduciendo stock...");
    await postToApi({
      action: "stock",
      id,
      change,
      user: CURRENT_USER.alias
    });
    await loadProducts();
    if (ACTIVE_DETAIL_ID && String(ACTIVE_DETAIL_ID) === String(id)) {
      viewProduct(id);
    }
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar el stock.");
  } finally {
    showLoading(false);
  }
}

async function deleteProduct(id) {
  if (!window.confirm("¿Eliminar este producto?")) return;
  try {
    showLoading(true, "Eliminando producto...");
    await postToApi({
      action: "delete",
      id,
      user: CURRENT_USER.alias
    });
    closeDetailModal();
    await loadProducts();
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
  const priceText = `Lps. ${money.format(Number(product.price || 0))}`;

  setText("detail-name", product.name || "Producto");
  setText("detail-price", priceText);
  setText("detail-category", product.category || "Sin categoría");
  setText("detail-stock", qty > 0 ? `Stock: ${qty}` : "Agotado");
  setText("detail-summary-price", priceText);
  setText("detail-summary-stock", qty > 0 ? qty : "0");
  setText("detail-summary-category", product.category || "Sin categoría");
  setText("detail-image-counter", `1 / ${gallery.length}`);
  setText("detail-meta-note", qty > 0 ? `${qty} unidades disponibles · Código ${product.id || "--"}` : `Producto agotado · Código ${product.id || "--"}`);

  const main = document.getElementById("detail-main-img");
  if (main) main.src = gallery[0];

  const thumbs = document.getElementById("detail-thumbs");
  if (thumbs) {
    thumbs.innerHTML = gallery.map((img, index) => `
      <button type="button" class="detail-thumb ${index === 0 ? "is-active" : ""}" onclick="swapDetailImage('${escapeHtml(img)}', ${index + 1}, ${gallery.length}, this)">
        <img src="${img}" alt="Miniatura ${index + 1}">
      </button>
    `).join("");
  }

  const editBtn = document.getElementById("detail-edit-btn");
  const deleteBtn = document.getElementById("detail-delete-btn");
  if (editBtn) editBtn.onclick = () => startEditById(id);
  if (deleteBtn) deleteBtn.onclick = () => deleteProduct(id);

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
  await updateStock(ACTIVE_DETAIL_ID, change);
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function togglePanel(panelId) {
  const panels = ["summary-panel", "filters-panel"];
  panels.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (id === panelId) el.classList.toggle("hidden");
    else el.classList.add("hidden");
  });
}

function toggleSummaryPanel() {
  togglePanel("summary-panel");
}

function toggleFiltersPanel() {
  togglePanel("filters-panel");
}

window.invOpenModal = invOpenModal;
window.invCloseModal = invCloseModal;
window.invLogin = invLogin;
window.invLogout = invLogout;
window.toggleTheme = toggleTheme;
window.installApp = installApp;
window.loadProducts = loadProducts;
window.clearFilters = clearFilters;
window.invChangeItemsPerPage = invChangeItemsPerPage;
window.viewProduct = viewProduct;
window.closeDetailModal = closeDetailModal;
window.startEditById = startEditById;
window.invPreviewImage = invPreviewImage;
window.invSaveProduct = invSaveProduct;
window.deleteProduct = deleteProduct;
window.changePage = changePage;
window.quickAdjustDetailStock = quickAdjustDetailStock;
window.scrollToTop = scrollToTop;
window.scrollToSection = scrollToSection;
window.toggleSummaryPanel = toggleSummaryPanel;
window.toggleFiltersPanel = toggleFiltersPanel;
window.swapDetailImage = swapDetailImage;

window.addEventListener("load", () => {
  if (isInventoryPage()) setupAppPage();
  else setupLoginPage();
});
