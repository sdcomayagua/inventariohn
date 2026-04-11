const API_URL = "https://script.google.com/macros/s/AKfycbyL-7yiraIZB0f0xqA5axDv-emMYCyNcT66mhOQ7sjxyDVeF2KWijPxm49VMhT3lxQ/exec";
const STORAGE_KEYS = {
  session: "invSession",
  theme: "invTheme"
};

const USERS = {
  sdcomayagua: {
    password: "199311",
    name: "SD Comayagua",
    alias: "SDC",
    role: "Administrador principal",
    avatar: "SD"
  },
  jarco: {
    password: "jarco",
    name: "JarCo",
    alias: "JarCo",
    role: "Administrador",
    avatar: "JC"
  }
};

let PRODUCTS = [];
let FILTERED = [];
let CURRENT_PAGE = 1;
let ITEMS_PER_PAGE = 8;
let EDITING_ID = null;
let CURRENT_USER = null;
let TOAST_TIMER = null;

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

function saveSession(session) {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

function showToast(message, isError = false) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.style.background = isError ? "rgba(127, 29, 29, 0.95)" : "rgba(15, 23, 42, 0.94)";
  toast.classList.add("show");

  if (TOAST_TIMER) clearTimeout(TOAST_TIMER);
  TOAST_TIMER = setTimeout(() => {
    toast.classList.remove("show");
  }, 2400);
}

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `L ${amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeImages(rawImages) {
  try {
    const parsed = JSON.parse(rawImages || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function invLogin() {
  const userInput = document.getElementById("login-user");
  const passInput = document.getElementById("login-pass");
  if (!userInput || !passInput) return;

  const username = userInput.value.trim().toLowerCase();
  const password = passInput.value.trim();

  let session = null;

  if (USERS[username] && USERS[username].password === password) {
    const found = USERS[username];
    session = {
      username,
      name: found.name,
      alias: found.alias,
      role: found.role,
      avatar: found.avatar
    };
  }

  if (!session) {
    if (password === "199311") {
      session = {
        username: "sdcomayagua",
        name: USERS.sdcomayagua.name,
        alias: USERS.sdcomayagua.alias,
        role: USERS.sdcomayagua.role,
        avatar: USERS.sdcomayagua.avatar
      };
    } else if (password === "123456") {
      session = {
        username: "jarco",
        name: USERS.jarco.name,
        alias: USERS.jarco.alias,
        role: USERS.jarco.role,
        avatar: USERS.jarco.avatar
      };
    }
  }

  if (!session) {
    showToast("Credenciales incorrectas.", true);
    return;
  }

  saveSession(session);
  showToast("Acceso concedido.");
  window.location.href = "inventario.html";
}

function invLogout() {
  localStorage.removeItem(STORAGE_KEYS.session);
  window.location.href = "index.html";
}

function applySavedTheme() {
  const saved = localStorage.getItem(STORAGE_KEYS.theme) || "dark";
  document.body.classList.toggle("theme-light", saved === "light");
  document.body.classList.toggle("theme-dark", saved !== "light");

  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = saved === "light" ? "Modo oscuro" : "Modo claro";
  }
}

function toggleTheme() {
  const isLight = document.body.classList.contains("theme-light");
  const next = isLight ? "dark" : "light";
  localStorage.setItem(STORAGE_KEYS.theme, next);
  applySavedTheme();
}

function setupAuthPage() {
  const session = getSession();
  if (session && !isInventoryPage()) {
    const userInput = document.getElementById("login-user");
    if (userInput) userInput.value = session.username || "";
  }

  ["login-user", "login-pass"].forEach((id) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") invLogin();
    });
  });
}

function ensureSessionOnInventory() {
  const session = getSession();
  if (!session) {
    window.location.href = "index.html";
    return false;
  }
  CURRENT_USER = session;
  return true;
}

function setupHeader() {
  if (!CURRENT_USER) return;

  const avatar = document.getElementById("inv-avatar");
  const welcome = document.getElementById("inv-welcome");
  const role = document.getElementById("inv-role");
  const heroStatus = document.getElementById("hero-status");

  if (avatar) avatar.textContent = CURRENT_USER.avatar || "SD";
  if (welcome) welcome.textContent = `${CURRENT_USER.name} · ${CURRENT_USER.alias}`;
  if (role) role.textContent = CURRENT_USER.role;
  if (heroStatus) heroStatus.textContent = "Consulta stock, filtra categorías y actualiza productos de forma más rápida desde tu teléfono.";
}

async function loadProducts() {
  setLoadingState(true);

  try {
    const response = await fetch(`${API_URL}?action=get`, { cache: "no-store" });
    if (!response.ok) throw new Error("No se pudo consultar el inventario.");

    const data = await response.json();
    PRODUCTS = Array.isArray(data.products) ? data.products : [];
    FILTERED = [...PRODUCTS];

    loadCategories();
    applyFilters();
    updateDashboard();
    renderHistory(Array.isArray(data.history) ? data.history : []);
  } catch (error) {
    console.error(error);
    PRODUCTS = [];
    FILTERED = [];
    renderProducts();
    renderHistory([]);
    updateDashboard();
    showToast("No se pudieron cargar los productos.", true);
  } finally {
    setLoadingState(false);
  }
}

function setLoadingState(isLoading) {
  const heroStatus = document.getElementById("hero-status");
  if (heroStatus && isLoading) {
    heroStatus.textContent = "Cargando productos del inventario...";
  } else if (heroStatus) {
    heroStatus.textContent = `${PRODUCTS.length} productos sincronizados y listos para administrar.`;
  }
}

function loadCategories() {
  const select = document.getElementById("inv-filter");
  if (!select) return;

  const currentValue = select.value || "all";
  const categories = [...new Set(PRODUCTS.map((product) => (product.category || "").trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  select.innerHTML = `<option value="all">Todas</option>`;
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    select.appendChild(option);
  });

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }
}

function applyFilters() {
  const category = document.getElementById("inv-filter")?.value || "all";
  const stock = document.getElementById("inv-stock-filter")?.value || "all";
  const minPriceValue = document.getElementById("inv-min-price")?.value || "";
  const maxPriceValue = document.getElementById("inv-max-price")?.value || "";
  const search = (document.getElementById("inv-search")?.value || "").trim().toLowerCase();
  const sort = document.getElementById("inv-sort")?.value || "name";

  const minPrice = minPriceValue === "" ? null : Number(minPriceValue);
  const maxPrice = maxPriceValue === "" ? null : Number(maxPriceValue);

  FILTERED = PRODUCTS.filter((product) => {
    const name = String(product.name || "");
    const categoryText = String(product.category || "");
    const price = Number(product.price || 0);
    const qty = Number(product.qty || 0);
    const lookup = `${name} ${categoryText}`.toLowerCase();

    if (category !== "all" && categoryText !== category) return false;
    if (stock === "in" && qty <= 0) return false;
    if (stock === "out" && qty > 0) return false;
    if (minPrice !== null && price < minPrice) return false;
    if (maxPrice !== null && price > maxPrice) return false;
    if (search && !lookup.includes(search)) return false;
    return true;
  });

  FILTERED.sort((a, b) => {
    if (sort === "price") return Number(a.price || 0) - Number(b.price || 0);
    if (sort === "qty") return Number(a.qty || 0) - Number(b.qty || 0);
    return String(a.name || "").localeCompare(String(b.name || ""), "es");
  });

  CURRENT_PAGE = 1;
  renderProducts();
  updateResultsInfo();
}

function updateResultsInfo() {
  const resultChip = document.getElementById("result-chip");
  const resultsInfo = document.getElementById("results-info");

  const total = FILTERED.length;
  if (resultChip) resultChip.textContent = `${total} resultado${total === 1 ? "" : "s"}`;
  if (resultsInfo) resultsInfo.textContent = `Mostrando ${total} producto${total === 1 ? "" : "s"}`;
}

function updateDashboard() {
  const totalProducts = PRODUCTS.length;
  const totalQty = PRODUCTS.reduce((acc, item) => acc + Number(item.qty || 0), 0);
  const totalValue = PRODUCTS.reduce((acc, item) => acc + (Number(item.qty || 0) * Number(item.price || 0)), 0);
  const outCount = PRODUCTS.filter((item) => Number(item.qty || 0) <= 0).length;

  setText("dash-total-products", totalProducts.toLocaleString("es-HN"));
  setText("dash-total-qty", totalQty.toLocaleString("es-HN"));
  setText("dash-total-value", formatCurrency(totalValue));
  setText("dash-out-count", outCount.toLocaleString("es-HN"));
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderProducts() {
  const container = document.getElementById("inv-products");
  const emptyState = document.getElementById("empty-state");
  if (!container) return;

  container.innerHTML = "";

  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  if (CURRENT_PAGE > totalPages) CURRENT_PAGE = totalPages;

  const start = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  const pageItems = FILTERED.slice(start, start + ITEMS_PER_PAGE);

  if (!pageItems.length) {
    if (emptyState) emptyState.hidden = false;
    renderPagination();
    return;
  }

  if (emptyState) emptyState.hidden = true;

  pageItems.forEach((product) => {
    const images = normalizeImages(product.images);
    const mainImage = images[0] || "";
    const quantity = Number(product.qty || 0);
    const inStock = quantity > 0;

    const card = document.createElement("article");
    card.className = "product-card";

    const safeName = escapeHtml(product.name || "Sin nombre");
    const safeCategory = escapeHtml(product.category || "Sin categoría");

    card.innerHTML = `
      <div class="product-media">
        ${mainImage ? `<img src="${mainImage}" alt="${safeName}">` : `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800' viewBox='0 0 800 800'%3E%3Crect width='800' height='800' fill='%23111c33'/%3E%3Ctext x='50%25' y='50%25' fill='%2394a3b8' font-family='Arial' font-size='34' text-anchor='middle'%3ESin imagen%3C/text%3E%3C/svg%3E" alt="Sin imagen">`}
        <button type="button" aria-label="Ver imagen"></button>
        ${images.length > 1 ? `<span class="thumb-counter">${images.length} fotos</span>` : ""}
      </div>

      <div class="product-top">
        <div>
          <h4 class="product-title">${safeName}</h4>
        </div>
        <div class="product-price">${formatCurrency(product.price)}</div>
      </div>

      <div class="product-meta">
        <span class="category-badge">${safeCategory}</span>
        <span class="stock-badge ${inStock ? "in-stock" : "out-stock"}">${inStock ? `${quantity} en stock` : "Agotado"}</span>
      </div>

      <div class="product-divider"></div>

      <div class="stock-control">
        <div>
          <div class="eyebrow">Control de stock</div>
          <div class="stock-stepper">
            <button type="button" class="thumb-button decrease">−</button>
            <span class="stock-value">${quantity}</span>
            <button type="button" class="thumb-button increase">＋</button>
          </div>
        </div>
      </div>

      <div class="product-actions">
        <button class="btn btn-secondary edit-btn" type="button">Editar</button>
        <button class="btn btn-secondary delete-btn" type="button">Eliminar</button>
      </div>
    `;

    card.querySelector(".product-media button")?.addEventListener("click", () => {
      if (mainImage) openImageViewer(mainImage);
    });

    card.querySelector(".decrease")?.addEventListener("click", () => updateStock(product.id, -1));
    card.querySelector(".increase")?.addEventListener("click", () => updateStock(product.id, 1));
    card.querySelector(".edit-btn")?.addEventListener("click", () => invOpenModal(true, product));
    card.querySelector(".delete-btn")?.addEventListener("click", () => deleteProduct(product.id));

    container.appendChild(card);
  });

  renderPagination();
}

function renderPagination() {
  const pagination = document.getElementById("inv-pagination");
  if (!pagination) return;

  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  pagination.innerHTML = `
    <span>Página ${CURRENT_PAGE} de ${totalPages}</span>
    <div class="pager-buttons">
      <button class="btn btn-secondary btn-sm" type="button" ${CURRENT_PAGE <= 1 ? "disabled" : ""}>Anterior</button>
      <button class="btn btn-secondary btn-sm" type="button" ${CURRENT_PAGE >= totalPages ? "disabled" : ""}>Siguiente</button>
    </div>
  `;

  const buttons = pagination.querySelectorAll("button");
  buttons[0]?.addEventListener("click", () => changePage(-1));
  buttons[1]?.addEventListener("click", () => changePage(1));
}

function changePage(direction) {
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  CURRENT_PAGE = Math.min(totalPages, Math.max(1, CURRENT_PAGE + direction));
  renderProducts();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function invChangeItemsPerPage() {
  const value = Number(document.getElementById("inv-items-per-page")?.value || 8);
  ITEMS_PER_PAGE = value;
  CURRENT_PAGE = 1;
  renderProducts();
}

function clearFilters() {
  const defaults = {
    "inv-filter": "all",
    "inv-stock-filter": "all",
    "inv-min-price": "",
    "inv-max-price": "",
    "inv-search": "",
    "inv-sort": "name"
  };

  Object.entries(defaults).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.value = value;
  });

  applyFilters();
}

function toggleFiltersPanel() {
  const panel = document.getElementById("filters-panel");
  if (!panel) return;
  panel.classList.toggle("is-collapsed");
}

function renderHistory(history) {
  const list = document.getElementById("inv-history-list");
  if (!list) return;

  list.innerHTML = "";
  const items = history.slice(0, 20);

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "Aún no hay movimientos recientes para mostrar.";
    list.appendChild(li);
    return;
  }

  items.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry;
    list.appendChild(li);
  });
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
    document.getElementById("inv-qty").value = product.qty || 0;
    document.getElementById("inv-category").value = product.category || "";
  } else {
    EDITING_ID = null;
    title.textContent = "Agregar producto";
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}

function invCloseModal() {
  const modal = document.getElementById("inv-modal");
  if (!modal) return;

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  clearModalFields();
  EDITING_ID = null;
}

function clearModalFields() {
  ["inv-name", "inv-price", "inv-qty", "inv-category"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) input.value = "";
  });

  for (let index = 1; index <= 5; index += 1) {
    const fileInput = document.getElementById(`inv-img${index}`);
    const preview = document.getElementById(`prev${index}`);
    if (fileInput) fileInput.value = "";
    if (preview) {
      preview.src = "";
      preview.style.display = "none";
    }
  }
}

function invPreviewImage(input, previewId) {
  const file = input.files?.[0];
  const preview = document.getElementById(previewId);
  if (!preview) return;

  if (!file) {
    preview.src = "";
    preview.style.display = "none";
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    preview.src = event.target?.result || "";
    preview.style.display = "block";
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

async function invSaveProduct() {
  const name = document.getElementById("inv-name")?.value.trim();
  const category = document.getElementById("inv-category")?.value.trim();
  const price = Number(document.getElementById("inv-price")?.value || 0);
  const qty = Number(document.getElementById("inv-qty")?.value || 0);

  if (!name || !category || Number.isNaN(price) || Number.isNaN(qty) || price < 0 || qty < 0) {
    showToast("Completa nombre, categoría, precio y cantidad válidos.", true);
    return;
  }

  try {
    const images = [];
    for (let index = 1; index <= 5; index += 1) {
      const input = document.getElementById(`inv-img${index}`);
      const file = input?.files?.[0];
      if (file) {
        const base64 = await fileToBase64(file);
        images.push(base64);
      }
    }

    await postData({
      action: EDITING_ID ? "edit" : "add",
      id: EDITING_ID,
      name,
      price,
      qty,
      category,
      images: JSON.stringify(images),
      user: CURRENT_USER?.alias || CURRENT_USER?.name || "ADMIN"
    });

    invCloseModal();
    await loadProducts();
    showToast(EDITING_ID ? "Producto actualizado." : "Producto guardado.");
  } catch (error) {
    console.error(error);
    showToast("No se pudo guardar el producto.", true);
  }
}

async function updateStock(id, change) {
  try {
    await postData({
      action: "stock",
      id,
      change,
      user: CURRENT_USER?.alias || CURRENT_USER?.name || "ADMIN"
    });

    await loadProducts();
    showToast(change > 0 ? "Stock aumentado." : "Stock disminuido.");
  } catch (error) {
    console.error(error);
    showToast("No se pudo actualizar el stock.", true);
  }
}

async function deleteProduct(id) {
  const confirmed = window.confirm("¿Deseas eliminar este producto?");
  if (!confirmed) return;

  try {
    await postData({
      action: "delete",
      id,
      user: CURRENT_USER?.alias || CURRENT_USER?.name || "ADMIN"
    });

    await loadProducts();
    showToast("Producto eliminado.");
  } catch (error) {
    console.error(error);
    showToast("No se pudo eliminar el producto.", true);
  }
}

async function postData(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("La operación no pudo completarse.");
  }

  return response.text();
}

function openImageViewer(src) {
  const viewer = document.getElementById("image-viewer");
  const image = document.getElementById("image-viewer-main");
  if (!viewer || !image) return;

  image.src = src;
  viewer.classList.add("is-open");
  viewer.setAttribute("aria-hidden", "false");
}

function closeImageViewer() {
  const viewer = document.getElementById("image-viewer");
  const image = document.getElementById("image-viewer-main");
  if (!viewer || !image) return;

  viewer.classList.remove("is-open");
  viewer.setAttribute("aria-hidden", "true");
  image.src = "";
}

function bindInventoryEvents() {
  ["inv-filter", "inv-stock-filter", "inv-sort"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener("change", applyFilters);
  });

  ["inv-min-price", "inv-max-price", "inv-search"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener("input", applyFilters);
  });

  document.getElementById("inv-items-per-page")?.addEventListener("change", invChangeItemsPerPage);

  document.getElementById("inv-modal")?.addEventListener("click", (event) => {
    if (event.target.id === "inv-modal") invCloseModal();
  });

  document.getElementById("image-viewer")?.addEventListener("click", (event) => {
    if (event.target.id === "image-viewer") closeImageViewer();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      invCloseModal();
      closeImageViewer();
    }
  });
}

window.addEventListener("load", () => {
  applySavedTheme();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch((error) => console.error('SW error:', error));
  }

  if (isInventoryPage()) {
    if (!ensureSessionOnInventory()) return;
    setupHeader();
    bindInventoryEvents();
    ITEMS_PER_PAGE = Number(document.getElementById("inv-items-per-page")?.value || 8);
    loadProducts();
  } else {
    setupAuthPage();
  }
});
