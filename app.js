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
let CURRENT_EDIT_IMAGES = [];

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

function getPlaceholderImage(label = "Sin imagen") {
  return `https://placehold.co/700x700/101725/e8f0ff?text=${encodeURIComponent(label)}`;
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
    const mainImage = images[0] || getPlaceholderImage("Sin imagen");
    const qty = Number(product.qty || 0);
    const safeId = String(product.id || "");
    const safeName = escapeHtml(product.name || "Sin nombre");
    const statusLabel = qty > 0 ? "Disponible" : "Agotado";

    const card = document.createElement("article");
    card.className = "product-card glass-panel product-card-luxe product-card-minimal";

    card.innerHTML = `
      <button class="product-tile product-tile-minimal" type="button" onclick="viewProduct('${safeId}')" aria-label="Abrir ${safeName}">
        <div class="product-media product-media-minimal">
          <span class="product-status ${qty > 0 ? "in" : "out"}">${statusLabel}</span>
          <img class="product-main-img" src="${mainImage}" alt="${safeName}">
        </div>

        <div class="product-minimal-copy compact">
          <h3 class="product-name product-name-minimal">${safeName}</h3>
          <div class="product-bottom-row">
            <p class="product-meta-line stock-pill">${qty > 0 ? `Stock ${qty}` : "Stock 0"}</p>
          </div>
        </div>
      </button>

      <div class="product-admin-actions minimal">
        <button class="icon-action-btn" type="button" onclick="startEditById('${safeId}')" aria-label="Editar producto">✎</button>
        <button class="icon-action-btn danger" type="button" onclick="deleteProduct('${safeId}')" aria-label="Eliminar producto">🗑</button>
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
    await postToApi({
      action: "stock",
      id,
      change,
      user: CURRENT_USER.alias
    });
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("No se pudo actualizar el stock.");
  } finally {
    showLoading(false);
  }
}

function setImageSlotState(index, options = {}) {
  const { src = "", label = "Sin archivo", filled = false } = options;
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

function populateExistingImages(images = []) {
  CURRENT_EDIT_IMAGES = Array.isArray(images) ? [...images] : [];
  for (let i = 1; i <= 5; i += 1) {
    const existing = CURRENT_EDIT_IMAGES[i - 1] || "";
    if (existing) {
      setImageSlotState(i, { src: existing, label: "Imagen actual", filled: true });
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
    title.textContent = "Agregar producto";
    CURRENT_EDIT_IMAGES = [];
  }

  modal.style.display = "flex";
}

function invCloseModal() {
  document.getElementById("inv-modal").style.display = "none";
  clearModalFields();
  EDITING_ID = null;
  CURRENT_EDIT_IMAGES = [];
}

function clearModalFields() {
  ["inv-name", "inv-price", "inv-qty", "inv-category"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  for (let i = 1; i <= 5; i += 1) {
    const input = document.getElementById(`inv-img${i}`);
    if (input) input.value = "";
    setImageSlotState(i, { src: "", label: "Sin archivo", filled: false });
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

function estimateDataUrlBytes(dataUrl = "") {
  const parts = String(dataUrl).split(",");
  const payload = parts[1] || "";
  return Math.ceil((payload.length * 3) / 4);
}

async function compressImageForUpload(file, options = {}) {
  if (!file?.type?.startsWith("image/")) {
    return fileToBase64(file);
  }

  const source = await fileToBase64(file);
  const image = new Image();
  image.decoding = "async";

  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = source;
  });

  const targetBytes = options.targetBytes || 12_000;
  let maxSide = options.maxSide || 480;
  if (file.size > 8_000_000) maxSide = 360;
  else if (file.size > 4_000_000) maxSide = 420;

  let width = image.width;
  let height = image.height;
  const ratio = Math.min(1, maxSide / Math.max(width, height));
  width = Math.max(1, Math.round(width * ratio));
  height = Math.max(1, Math.round(height * ratio));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return source;

  const render = (mime, quality) => {
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#111827";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL(mime, quality);
  };

  let output = render("image/webp", 0.5);
  if (!output.startsWith("data:image/webp")) {
    output = render("image/jpeg", 0.5);
  }

  const attempts = [0.42, 0.34, 0.26, 0.2];
  for (const q of attempts) {
    if (estimateDataUrlBytes(output) <= targetBytes) break;
    output = output.startsWith("data:image/webp") ? render("image/webp", q) : render("image/jpeg", q);
  }

  while (estimateDataUrlBytes(output) > targetBytes && Math.max(width, height) > 220) {
    width = Math.max(220, Math.round(width * 0.82));
    height = Math.max(220, Math.round(height * 0.82));
    output = output.startsWith("data:image/webp") ? render("image/webp", 0.22) : render("image/jpeg", 0.22);
  }

  return output;
}

async function postToApi(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || "La operación falló.");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}


function getImagesPayloadLength(images = []) {
  return JSON.stringify(images).length;
}

async function shrinkImagesToSafePayload(images = []) {
  const safeImages = [...images];
  let payloadLength = getImagesPayloadLength(safeImages);
  if (payloadLength <= 45_000) return safeImages;

  for (let i = 0; i < safeImages.length; i += 1) {
    if (!String(safeImages[i]).startsWith("data:image/")) continue;
    const file = dataUrlToFile(safeImages[i], `image-${i + 1}.jpg`);
    safeImages[i] = await compressImageForUpload(file, { targetBytes: 8_000, maxSide: 320 });
    payloadLength = getImagesPayloadLength(safeImages);
    if (payloadLength <= 45_000) return safeImages;
  }

  while (getImagesPayloadLength(safeImages) > 45_000 && safeImages.length > 1) {
    safeImages.pop();
  }

  return safeImages;
}

function dataUrlToFile(dataUrl, filename) {
  const [meta, payload] = String(dataUrl).split(",");
  const mime = /data:(.*?);base64/.exec(meta)?.[1] || "image/jpeg";
  const binary = atob(payload || "");
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

async function invSaveProduct() {
  const saveBtn = document.getElementById("save-product-btn");
  const name = document.getElementById("inv-name")?.value.trim();
  const price = parseFloat(document.getElementById("inv-price")?.value || "");
  const qty = parseInt(document.getElementById("inv-qty")?.value || "", 10);
  const category = document.getElementById("inv-category")?.value.trim();

  if (!name || Number.isNaN(price) || Number.isNaN(qty) || !category) {
    alert("Completa nombre, precio, cantidad y categoría.");
    return;
  }

  const finalImages = [];

  try {
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = "Guardando...";
    }
    showLoading(true, EDITING_ID ? "Guardando cambios..." : "Agregando producto...");

    for (let i = 1; i <= 5; i += 1) {
      const input = document.getElementById(`inv-img${i}`);
      if (input?.files?.length) {
        finalImages.push(await compressImageForUpload(input.files[0], { targetBytes: 12_000, maxSide: 480 }));
      } else if (CURRENT_EDIT_IMAGES[i - 1]) {
        finalImages.push(CURRENT_EDIT_IMAGES[i - 1]);
      }
    }

    const safeImages = await shrinkImagesToSafePayload(finalImages);

    const payload = {
      action: EDITING_ID ? "edit" : "add",
      id: EDITING_ID,
      name,
      price,
      qty,
      category,
      images: JSON.stringify(safeImages),
      user: CURRENT_USER.alias
    };

    if (payload.images.length > 45_000) {
      throw new Error("Las imágenes siguen siendo muy pesadas para el guardado actual.");
    }

    await postToApi(payload);
    invCloseModal();
    await loadProducts();
  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el producto. Ya reduje las fotos mucho más, pero tu almacenamiento actual todavía rechazó el guardado.");
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = "Guardar producto";
    }
    showLoading(false);
  }
}

async function deleteProduct(id) {
  if (!confirm("¿Eliminar este producto?")) return;
  try {
    showLoading(true, "Eliminando producto...");
    await postToApi({ action: "delete", id, user: CURRENT_USER.alias });
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
  setText("detail-stock", stockLabel > 0 ? `Stock: ${stockLabel}` : "Agotado");
  setText("detail-summary-price", priceLabel);
  setText("detail-summary-stock", stockLabel > 0 ? stockLabel : "0");
  setText("detail-summary-category", product.category || "Sin categoría");
  setText("detail-image-counter", `1 / ${finalImages.length}`);
  setText("detail-meta-note", `${stockLabel > 0 ? "Producto disponible" : "Producto agotado"} · Código ${String(product.id || "--")}`);

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
    await postToApi({
      action: "stock",
      id: ACTIVE_DETAIL_ID,
      change,
      user: CURRENT_USER.alias
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
