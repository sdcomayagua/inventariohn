const API_URL = "https://script.google.com/macros/s/AKfycbyL-7yiraIZB0f0xqA5axDv-emMYCyNcT66mhOQ7sjxyDVeF2KWijPxm49VMhT3lxQ/exec";

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

let PRODUCTS = [];
let FILTERED = [];
let CURRENT_PAGE = 1;
let ITEMS_PER_PAGE = 12;
let CURRENT_USER = null;
let EDITING_ID = null;
let INSTALL_PROMPT = null;
let ACTIVE_DETAIL_ID = null;
let LAST_SYNC_AT = null;

function getSession() {
  try {
    return JSON.parse(localStorage.getItem("invSession") || "null");
  } catch {
    return null;
  }
}

function saveSession(username) {
  const user = USERS[username];
  localStorage.setItem("invSession", JSON.stringify({ username, ...user }));
}

function clearSession() {
  localStorage.removeItem("invSession");
}

function invLogin() {
  const userInput = document.getElementById("inv-user");
  const passInput = document.getElementById("inv-pass");
  if (!userInput || !passInput) return;

  const username = userInput.value.trim().toLowerCase();
  const password = passInput.value.trim();
  const record = USERS[username];

  if (!record || record.password !== password) {
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

function toggleTheme() {
  const body = document.body;
  const next = body.classList.contains("theme-dark") ? "light" : "dark";
  body.classList.remove("theme-dark", "theme-light");
  body.classList.add(`theme-${next}`);
  localStorage.setItem("invTheme", next);
  updateThemeControls();
}

function applySavedTheme() {
  const saved = localStorage.getItem("invTheme") || "dark";
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(`theme-${saved}`);
  updateThemeControls();
}

function updateThemeControls() {
  const isDark = document.body.classList.contains("theme-dark");
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  if (window.location.pathname.includes("inventario.html")) {
    btn.textContent = isDark ? "☀️" : "🌙";
  } else {
    btn.textContent = isDark ? "Tema claro" : "Tema oscuro";
  }
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

function setupLoginPage() {
  applySavedTheme();
  registerCoreEvents();
  const existing = getSession();
  if (existing && USERS[existing.username]) {
    window.location.href = "inventario.html";
  }

  const user = document.getElementById("inv-user");
  const pass = document.getElementById("inv-pass");
  [user, pass].forEach((el) => {
    if (!el) return;
    el.addEventListener("keydown", (event) => {
      if (event.key === "Enter") invLogin();
    });
  });
}

function setupAppPage() {
  if (!ensureAuthenticated()) return;
  applySavedTheme();
  registerCoreEvents();
  setupHeader();
  bindFilters();
  setHeroDate();
  loadProducts();
}

function registerCoreEvents() {
  registerServiceWorker();

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    INSTALL_PROMPT = event;
    const btn = document.getElementById("install-btn");
    if (btn) btn.style.display = "inline-flex";
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

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

function setHeroDate() {
  const el = document.getElementById("hero-date");
  if (!el) return;
  const now = new Date();
  el.textContent = now.toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "short"
  });
}

function setupHeader() {
  const welcome = document.getElementById("inv-welcome");
  const role = document.getElementById("inv-role");
  const avatar = document.getElementById("inv-avatar");

  if (welcome) welcome.textContent = `Sesión: ${CURRENT_USER.alias}`;
  if (role) role.textContent = CURRENT_USER.role;
  if (avatar) avatar.textContent = CURRENT_USER.initials;
}

function bindFilters() {
  ["inv-filter", "inv-stock-filter", "inv-sort"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", applyFilters);
  });

  ["inv-min-price", "inv-max-price", "inv-search"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", applyFilters);
  });

  const itemsPerPage = document.getElementById("inv-items-per-page");
  if (itemsPerPage) ITEMS_PER_PAGE = parseInt(itemsPerPage.value || "12", 10);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseImages(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function getProductById(id) {
  return PRODUCTS.find((item) => String(item.id) === String(id));
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
        <div id="loading-text">${escapeHtml(label)}</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  const text = document.getElementById("loading-text");
  if (text) text.textContent = label;
  overlay.style.display = show ? "grid" : "none";
}

async function loadProducts(showRefreshFeedback = false) {
  if (showRefreshFeedback) showLoading(true, "Actualizando inventario...");
  try {
    const res = await fetch(`${API_URL}?action=get`, { cache: "no-store" });
    const data = await res.json();
    PRODUCTS = Array.isArray(data.products) ? data.products : [];
    FILTERED = [...PRODUCTS];
    LAST_SYNC_AT = new Date();
    updateDashboard();
    loadCategories();
    renderHistory(data.history || []);
    applyFilters();
  } catch (error) {
    console.error(error);
    alert("No se pudieron cargar los productos.");
  } finally {
    showLoading(false);
  }
}

function updateDashboard() {
  const totalProducts = PRODUCTS.length;
  const totalQty = PRODUCTS.reduce((sum, product) => sum + Number(product.qty || 0), 0);
  const totalValue = PRODUCTS.reduce((sum, product) => sum + (Number(product.qty || 0) * Number(product.price || 0)), 0);
  const outCount = PRODUCTS.filter((product) => Number(product.qty || 0) <= 0).length;
  const inStock = PRODUCTS.filter((product) => Number(product.qty || 0) > 0).length;
  const categoryCount = new Set(PRODUCTS.map((product) => String(product.category || "").trim()).filter(Boolean)).size;
  const avgPrice = totalProducts ? PRODUCTS.reduce((sum, product) => sum + Number(product.price || 0), 0) / totalProducts : 0;

  setText("dash-total-products", totalProducts);
  setText("dash-total-qty", totalQty);
  setText("dash-total-value", `Lps. ${money.format(totalValue)}`);
  setText("dash-out-count", outCount);
  setText("dash-category-count", categoryCount);
  setText("dash-in-stock", inStock);
  setText("dash-avg-price", `Lps. ${money.format(avgPrice)}`);
  updateSyncMeta();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function loadCategories() {
  const select = document.getElementById("inv-filter");
  if (!select) return;
  const categories = [...new Set(PRODUCTS.map((p) => String(p.category || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
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
  const minPrice = parseFloat(document.getElementById("inv-min-price")?.value || "");
  const maxPrice = parseFloat(document.getElementById("inv-max-price")?.value || "");
  const search = (document.getElementById("inv-search")?.value || "").trim().toLowerCase();
  const sort = document.getElementById("inv-sort")?.value || "featured";

  FILTERED = PRODUCTS.filter((product) => {
    const name = String(product.name || "").toLowerCase();
    const productCategory = String(product.category || "");
    const productPrice = Number(product.price || 0);
    const qty = Number(product.qty || 0);

    if (category !== "all" && productCategory !== category) return false;
    if (stock === "in" && qty <= 0) return false;
    if (stock === "out" && qty > 0) return false;
    if (!Number.isNaN(minPrice) && document.getElementById("inv-min-price")?.value !== "" && productPrice < minPrice) return false;
    if (!Number.isNaN(maxPrice) && document.getElementById("inv-max-price")?.value !== "" && productPrice > maxPrice) return false;
    if (search) {
      const haystack = `${name} ${String(product.category || "").toLowerCase()}`;
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  FILTERED.sort((a, b) => {
    if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""));
    if (sort === "priceAsc") return Number(a.price || 0) - Number(b.price || 0);
    if (sort === "priceDesc") return Number(b.price || 0) - Number(a.price || 0);
    if (sort === "qtyAsc") return Number(a.qty || 0) - Number(b.qty || 0);
    if (sort === "qtyDesc") return Number(b.qty || 0) - Number(a.qty || 0);
    return Number(b.qty || 0) - Number(a.qty || 0) || Number(a.price || 0) - Number(b.price || 0);
  });

  CURRENT_PAGE = 1;
  renderProducts();
}

function renderProducts() {
  const container = document.getElementById("inv-products");
  const empty = document.getElementById("inv-empty");
  const results = document.getElementById("results-count");
  if (!container) return;

  container.innerHTML = "";
  setText("results-count", `${FILTERED.length} resultado${FILTERED.length === 1 ? "" : "s"}`);

  if (FILTERED.length === 0) {
    if (empty) empty.style.display = "block";
    renderPagination();
    return;
  }

  if (empty) empty.style.display = "none";

  const start = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  const pageItems = FILTERED.slice(start, start + ITEMS_PER_PAGE);

  pageItems.forEach((product) => {
    const images = parseImages(product.images);
    const mainImage = images[0] || "https://via.placeholder.com/700x700?text=Sin+imagen";
    const qty = Number(product.qty || 0);
    const price = Number(product.price || 0);
    const imageCount = Math.max(images.length, 1);
    const stockRatio = Math.min(100, Math.max(6, qty <= 0 ? 6 : Math.round((qty / Math.max(qty, 10)) * 100)));
    const card = document.createElement("article");
    card.className = "product-card glass-panel product-card-luxe";

    card.innerHTML = `
      <div class="product-media">
        <span class="product-status ${qty > 0 ? "in" : "out"}">${qty > 0 ? "Disponible" : "Agotado"}</span>
        <span class="product-image-count">${imageCount} foto${imageCount === 1 ? "" : "s"}</span>
        <img class="product-main-img" src="${mainImage}" alt="${escapeHtml(product.name || "Producto")}">
      </div>
      ${images.length > 1 ? `
        <div class="thumb-row thumb-row-luxe">
          ${images.map((img, index) => `
            <button class="thumb-btn ${index === 0 ? "is-active" : ""}" type="button" onclick="swapCardImage(this, '${escapeHtml(img)}')">
              <img src="${img}" alt="Miniatura">
            </button>
          `).join("")}
        </div>
      ` : ""}
      <div class="product-head product-head-luxe">
        <div>
          <h3 class="product-name">${escapeHtml(product.name || "Sin nombre")}</h3>
          <div class="category-pill">${escapeHtml(product.category || "Sin categoría")}</div>
        </div>
        <p class="product-price">Lps. ${money.format(price)}</p>
      </div>
      <div class="product-meta-row">
        <span class="stock-pill">Stock: ${qty}</span>
        <span class="product-code">ID ${escapeHtml(String(product.id || "--")).slice(-6)}</span>
      </div>
      <div class="product-stock-progress">
        <span style="width:${stockRatio}%"></span>
      </div>
      <div class="price-stock-row price-stock-row-luxe">
        <div class="stock-editor">
          <button type="button" onclick="updateStock('${String(product.id)}', -1)">−</button>
          <span class="stock-count">${qty}</span>
          <button type="button" onclick="updateStock('${String(product.id)}', 1)">＋</button>
        </div>
        <button class="quick-view-btn" type="button" onclick="viewProduct('${String(product.id)}')">Ver ficha</button>
      </div>
      <div class="card-actions card-actions-luxe">
        <button class="btn-secondary" type="button" onclick="startEditById('${String(product.id)}')">Editar</button>
        <button class="btn-secondary" type="button" onclick="deleteProduct('${String(product.id)}')">Eliminar</button>
      </div>
    `;

    container.appendChild(card);
  });

  renderPagination();
}

function swapCardImage(button, src) {
  const card = button.closest(".product-card");
  const main = card?.querySelector(".product-main-img");
  if (main) main.src = src;
  card?.querySelectorAll(".thumb-btn").forEach((item) => item.classList.remove("is-active"));
  button?.classList.add("is-active");
}

function renderPagination() {
  const container = document.getElementById("inv-pagination");
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  container.innerHTML = `
    <button type="button" onclick="changePage(-1)">Anterior</button>
    <span>${CURRENT_PAGE} / ${totalPages}</span>
    <button type="button" onclick="changePage(1)">Siguiente</button>
  `;
}

function changePage(direction) {
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  CURRENT_PAGE += direction;
  if (CURRENT_PAGE < 1) CURRENT_PAGE = 1;
  if (CURRENT_PAGE > totalPages) CURRENT_PAGE = totalPages;
  renderProducts();
  scrollToSection("productos");
}

function invChangeItemsPerPage() {
  const value = parseInt(document.getElementById("inv-items-per-page")?.value || "12", 10);
  ITEMS_PER_PAGE = value;
  CURRENT_PAGE = 1;
  renderProducts();
}

async function updateStock(id, change) {
  try {
    showLoading(true, "Actualizando stock...");
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "stock",
        id,
        change,
        user: CURRENT_USER.alias
      })
    });
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar el stock.");
  } finally {
    showLoading(false);
  }
}

function invOpenModal(isEdit = false, product = null) {
  const modal = document.getElementById("inv-modal");
  const title = document.getElementById("inv-modal-title");
  if (!modal || !title) return;

  if (isEdit && product) {
    EDITING_ID = product.id;
    title.textContent = "Editar producto";
    document.getElementById("inv-name").value = product.name || "";
    document.getElementById("inv-price").value = product.price || "";
    document.getElementById("inv-qty").value = product.qty || "";
    document.getElementById("inv-category").value = product.category || "";
  } else {
    EDITING_ID = null;
    title.textContent = "Agregar producto";
    clearModalFields();
  }

  modal.style.display = "flex";
}

function invCloseModal() {
  document.getElementById("inv-modal").style.display = "none";
  clearModalFields();
  EDITING_ID = null;
}

function clearModalFields() {
  ["inv-name", "inv-price", "inv-qty", "inv-category"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  for (let i = 1; i <= 5; i += 1) {
    const input = document.getElementById(`inv-img${i}`);
    const preview = document.getElementById(`prev${i}`);
    if (input) input.value = "";
    if (preview) {
      preview.src = "";
      preview.style.display = "none";
    }
  }
}

function startEditById(id) {
  const product = getProductById(id);
  if (!product) return;
  closeDetailModal();
  invOpenModal(true, product);
}

function invPreviewImage(input, previewId) {
  const file = input.files?.[0];
  const preview = document.getElementById(previewId);
  if (!preview) return;
  if (!file) {
    preview.style.display = "none";
    preview.src = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    preview.src = event.target?.result;
    preview.style.display = "block";
  };
  reader.readAsDataURL(file);
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function invSaveProduct() {
  const name = document.getElementById("inv-name")?.value.trim();
  const price = parseFloat(document.getElementById("inv-price")?.value || "");
  const qty = parseInt(document.getElementById("inv-qty")?.value || "", 10);
  const category = document.getElementById("inv-category")?.value.trim();

  if (!name || Number.isNaN(price) || Number.isNaN(qty) || !category) {
    alert("Completa nombre, precio, cantidad y categoría.");
    return;
  }

  const existingProduct = EDITING_ID ? getProductById(EDITING_ID) : null;
  const existingImages = existingProduct ? parseImages(existingProduct.images) : [];
  const newImages = [];

  for (let i = 1; i <= 5; i += 1) {
    const input = document.getElementById(`inv-img${i}`);
    if (input?.files?.length) {
      newImages.push(await fileToBase64(input.files[0]));
    }
  }

  const payload = {
    action: EDITING_ID ? "edit" : "add",
    id: EDITING_ID,
    name,
    price,
    qty,
    category,
    images: JSON.stringify(newImages.length ? newImages : existingImages),
    user: CURRENT_USER.alias
  };

  try {
    showLoading(true, EDITING_ID ? "Guardando cambios..." : "Agregando producto...");
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    invCloseModal();
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el producto.");
  } finally {
    showLoading(false);
  }
}

async function deleteProduct(id) {
  if (!confirm("¿Eliminar este producto?")) return;
  try {
    showLoading(true, "Eliminando producto...");
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "delete", id, user: CURRENT_USER.alias })
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

function renderHistory(history) {
  const list = document.getElementById("inv-history-list");
  if (!list) return;
  list.innerHTML = "";
  const items = Array.isArray(history) ? history.slice(0, 30) : [];
  if (!items.length) {
    list.innerHTML = '<li>No hay movimientos recientes todavía.</li>';
    return;
  }

  items.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    list.appendChild(li);
  });
}

function viewProduct(id) {
  const product = getProductById(id);
  const modal = document.getElementById("detail-modal");
  if (!product || !modal) return;

  ACTIVE_DETAIL_ID = id;
  const images = parseImages(product.images);
  const finalImages = images.length ? images : ["https://via.placeholder.com/700x700?text=Sin+imagen"];
  const mainImage = finalImages[0];
  const thumbs = document.getElementById("detail-thumbs");
  const priceLabel = `Lps. ${money.format(Number(product.price || 0))}`;
  const stockLabel = Number(product.qty || 0);

  setText("detail-name", product.name || "Producto");
  setText("detail-price", priceLabel);
  setText("detail-category", product.category || "Sin categoría");
  setText("detail-stock", `Stock: ${stockLabel}`);
  setText("detail-summary-price", priceLabel);
  setText("detail-summary-stock", stockLabel);
  setText("detail-summary-category", product.category || "Sin categoría");
  setText("detail-image-counter", `1 / ${finalImages.length}`);
  setText("detail-meta-note", `Código interno · ${String(product.id || "--")} · ${stockLabel > 0 ? "Listo para venta" : "Sin existencias"}`);

  const main = document.getElementById("detail-main-img");
  if (main) {
    main.src = mainImage;
    main.dataset.index = "1";
    main.dataset.total = String(finalImages.length);
  }

  if (thumbs) {
    thumbs.innerHTML = finalImages.map((img, index) => `
      <button type="button" class="detail-thumb ${index === 0 ? "is-active" : ""}" onclick="swapDetailImage('${escapeHtml(img)}', ${index + 1}, ${finalImages.length}, this)">
        <img src="${img}" alt="Miniatura del producto">
      </button>
    `).join("");
  }

  const editBtn = document.getElementById("detail-edit-btn");
  const deleteBtn = document.getElementById("detail-delete-btn");
  if (editBtn) editBtn.onclick = () => startEditById(id);
  if (deleteBtn) deleteBtn.onclick = () => deleteProduct(id);

  modal.style.display = "flex";
}

function swapDetailImage(src, index = 1, total = 1, button = null) {
  const main = document.getElementById("detail-main-img");
  if (main) {
    main.src = src;
    main.dataset.index = String(index);
    main.dataset.total = String(total);
  }
  setText("detail-image-counter", `${index} / ${total}`);
  document.querySelectorAll(".detail-thumb").forEach((item) => item.classList.remove("is-active"));
  if (button) button.classList.add("is-active");
}

function closeDetailModal() {
  const modal = document.getElementById("detail-modal");
  if (modal) modal.style.display = "none";
  ACTIVE_DETAIL_ID = null;
}

function updateSyncMeta() {
  const syncTime = document.getElementById("sync-time-pill");
  const syncStatus = document.getElementById("sync-status");
  if (!LAST_SYNC_AT) return;
  const label = LAST_SYNC_AT.toLocaleTimeString("es-HN", { hour: "2-digit", minute: "2-digit" });
  if (syncTime) syncTime.textContent = `Actualizado ${label}`;
  if (syncStatus) syncStatus.textContent = "Sincronizado";
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

  const itemsPerPage = document.getElementById("inv-items-per-page");
  ITEMS_PER_PAGE = parseInt(itemsPerPage?.value || "12", 10);
  CURRENT_PAGE = 1;
  applyFilters();
}

async function quickAdjustDetailStock(change) {
  if (!ACTIVE_DETAIL_ID) return;
  try {
    showLoading(true, change > 0 ? "Sumando unidad..." : "Restando unidad...");
    await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "stock",
        id: ACTIVE_DETAIL_ID,
        change,
        user: CURRENT_USER.alias
      })
    });
    await loadProducts();
    viewProduct(ACTIVE_DETAIL_ID);
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar el stock.");
  } finally {
    showLoading(false);
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

window.addEventListener("click", (event) => {
  const modal = document.getElementById("inv-modal");
  const detail = document.getElementById("detail-modal");
  if (event.target === modal) invCloseModal();
  if (event.target === detail) closeDetailModal();
});

if (window.location.pathname.includes("inventario.html")) {
  window.addEventListener("load", setupAppPage);
} else {
  window.addEventListener("load", setupLoginPage);
}
