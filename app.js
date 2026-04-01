/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyL-7yiraIZB0f0xqA5axDv-emMYCyNcT66mhOQ7sjxyDVeF2KWijPxm49VMhT3lxQ/exec";

let PRODUCTS = [];
let FILTERED = [];
let CURRENT_PAGE = 1;
let ITEMS_PER_PAGE = 10;

let CURRENT_USER = null;   // alias visible (GaboHN / JarCo)
let CURRENT_ROLE = "ADMIN";
let EDITING_ID = null;

/* ============================
   LOGIN POR PIN
============================ */
function invLogin() {
  const pin = document.getElementById("inv-user").value.trim();

  const users = {
    "199311": { name: "Gabriel", alias: "GaboHN", role: "ADMIN" },
    "123456": { name: "JarCo", alias: "JarCo", role: "ADMIN" }
  };

  if (users[pin]) {
    CURRENT_USER = users[pin].alias;
    CURRENT_ROLE = users[pin].role;

    localStorage.setItem("invUser", CURRENT_USER);
    localStorage.setItem("invRole", CURRENT_ROLE);

    window.location.href = "inventario.html";
  } else {
    alert("PIN incorrecto");
  }
}

function invLogout() {
  localStorage.removeItem("invUser");
  localStorage.removeItem("invRole");
  window.location.href = "index.html";
}

/* ============================
   TEMA DÍA / NOCHE
============================ */
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById("theme-toggle");

  if (body.classList.contains("theme-dark")) {
    body.classList.remove("theme-dark");
    body.classList.add("theme-light");
    btn.textContent = "Modo Noche";
    localStorage.setItem("invTheme", "light");
  } else {
    body.classList.remove("theme-light");
    body.classList.add("theme-dark");
    btn.textContent = "Modo Día";
    localStorage.setItem("invTheme", "dark");
  }
}

function applySavedTheme() {
  const saved = localStorage.getItem("invTheme") || "dark";
  const body = document.body;
  const btn = document.getElementById("theme-toggle");

  if (saved === "light") {
    body.classList.remove("theme-dark");
    body.classList.add("theme-light");
    if (btn) btn.textContent = "Modo Noche";
  } else {
    body.classList.remove("theme-light");
    body.classList.add("theme-dark");
    if (btn) btn.textContent = "Modo Día";
  }
}

/* ============================
   MODAL
============================ */
function invOpenModal(isEdit = false, product = null) {
  const modal = document.getElementById("inv-modal");
  const title = document.getElementById("inv-modal-title");

  if (isEdit && product) {
    EDITING_ID = product.id;
    title.textContent = "Editar producto";
    document.getElementById("inv-name").value = product.name;
    document.getElementById("inv-price").value = product.price;
    document.getElementById("inv-qty").value = product.qty;
    document.getElementById("inv-category").value = product.category;
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
  document.getElementById("inv-name").value = "";
  document.getElementById("inv-price").value = "";
  document.getElementById("inv-qty").value = "";
  document.getElementById("inv-category").value = "";

  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById("inv-img" + i);
    const img = document.getElementById("prev" + i);
    if (input) input.value = "";
    if (img) {
      img.src = "";
      img.style.display = "none";
    }
  }
}

/* ============================
   PREVIEW DE IMÁGENES
============================ */
function invPreviewImage(input, previewId) {
  const file = input.files[0];
  const img = document.getElementById(previewId);

  if (!file) {
    img.style.display = "none";
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    img.src = e.target.result;
    img.style.display = "block";
  };
  reader.readAsDataURL(file);
}

/* ============================
   CARGAR PRODUCTOS DESDE SHEETS
============================ */
async function loadProducts() {
  try {
    const res = await fetch(API_URL + "?action=get");
    const data = await res.json();

    PRODUCTS = data.products || [];
    FILTERED = [...PRODUCTS];

    applyFilters();
    updateDashboard();
    loadCategories();
    renderHistory(data.history || []);
  } catch (e) {
    console.error("Error cargando productos:", e);
  }
}

/* ============================
   GUARDAR / EDITAR PRODUCTO
============================ */
async function invSaveProduct() {
  const name = document.getElementById("inv-name").value.trim();
  const price = parseFloat(document.getElementById("inv-price").value);
  const qty = parseInt(document.getElementById("inv-qty").value);
  const category = document.getElementById("inv-category").value.trim();

  if (!name || isNaN(price) || isNaN(qty) || !category) {
    alert("Completa nombre, precio, cantidad y categoría.");
    return;
  }

  const images = [];
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById("inv-img" + i);
    if (input && input.files.length > 0) {
      const base64 = await fileToBase64(input.files[0]);
      images.push(base64);
    }
  }

  const payload = {
    action: EDITING_ID ? "edit" : "add",
    id: EDITING_ID,
    name,
    price,
    qty,
    category,
    images: JSON.stringify(images),
    user: CURRENT_USER
  };

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  invCloseModal();
  await loadProducts();
}

/* Convertir archivo a base64 */
function fileToBase64(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/* ============================
   ELIMINAR PRODUCTO
============================ */
async function deleteProduct(id) {
  if (!confirm("¿Eliminar este producto?")) return;

  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "delete",
      id,
      user: CURRENT_USER
    })
  });

  await loadProducts();
}

/* ============================
   RENDER DE PRODUCTOS
============================ */
function renderProducts() {
  const container = document.getElementById("inv-products");
  if (!container) return;
  container.innerHTML = "";

  const start = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = FILTERED.slice(start, end);

  pageItems.forEach(p => {
    const images = JSON.parse(p.images || "[]");
    const mainImg = images[0] || "";
    const thumbs = images.slice(1);

    container.innerHTML += `
      <div class="inv-item">
        ${mainImg ? `<img src="${mainImg}" class="inv-main-img">` : ""}

        ${thumbs.length ? `
          <div class="inv-thumbs">
            ${thumbs.map((t) => `<img src="${t}" onclick="swapMainImage(this)">`).join("")}
          </div>
        ` : ""}

        <h4>${p.name}</h4>
        <p>Lps. ${p.price}</p>
        <p>Categoría: ${p.category}</p>

        <div class="inv-stock-row">
          <button onclick="updateStock('${p.id}', -1)">-</button>
          <span>${p.qty}</span>
          <button onclick="updateStock('${p.id}', 1)">+</button>
        </div>

        <div class="inv-actions-row">
          <button class="btn-secondary" onclick='invOpenModal(true, ${JSON.stringify(p)})'>Editar</button>
          <button class="btn-secondary" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </div>
      </div>
    `;
  });

  renderPagination();
}

/* Cambiar imagen principal al tocar thumbnail */
function swapMainImage(thumb) {
  const card = thumb.closest(".inv-item");
  const main = card.querySelector(".inv-main-img");
  if (main) {
    const temp = main.src;
    main.src = thumb.src;
    thumb.src = temp;
  }
}

/* ============================
   PAGINACIÓN
============================ */
function renderPagination() {
  const pag = document.getElementById("inv-pagination");
  if (!pag) return;

  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));

  pag.innerHTML = `
    <button onclick="changePage(-1)">Anterior</button>
    <span>${CURRENT_PAGE} / ${totalPages}</span>
    <button onclick="changePage(1)">Siguiente</button>
  `;
}

function changePage(dir) {
  const totalPages = Math.max(1, Math.ceil(FILTERED.length / ITEMS_PER_PAGE));
  CURRENT_PAGE += dir;

  if (CURRENT_PAGE < 1) CURRENT_PAGE = 1;
  if (CURRENT_PAGE > totalPages) CURRENT_PAGE = totalPages;

  renderProducts();
}

function invChangeItemsPerPage() {
  const sel = document.getElementById("inv-items-per-page");
  if (!sel) return;
  ITEMS_PER_PAGE = parseInt(sel.value);
  CURRENT_PAGE = 1;
  renderProducts();
}

/* ============================
   ACTUALIZAR STOCK
============================ */
async function updateStock(id, change) {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "stock",
      id,
      change,
      user: CURRENT_USER
    })
  });

  await loadProducts();
}

/* ============================
   DASHBOARD
============================ */
function updateDashboard() {
  const totalProducts = PRODUCTS.length;
  const totalQty = PRODUCTS.reduce((a, b) => a + parseInt(b.qty || 0), 0);
  const totalValue = PRODUCTS.reduce((a, b) => a + (Number(b.price || 0) * Number(b.qty || 0)), 0);
  const outCount = PRODUCTS.filter(p => Number(p.qty) <= 0).length;

  setText("dash-total-products", totalProducts);
  setText("dash-total-qty", totalQty);
  setText("dash-total-value", totalValue.toFixed(2));
  setText("dash-out-count", outCount);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

/* ============================
   CATEGORÍAS, FILTROS, BÚSQUEDA, ORDEN
============================ */
function loadCategories() {
  const select = document.getElementById("inv-filter");
  if (!select) return;

  const cats = [...new Set(PRODUCTS.map(p => p.category).filter(Boolean))];

  select.innerHTML = `<option value="all">Todas</option>`;
  cats.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function applyFilters() {
  const catSel = document.getElementById("inv-filter");
  const stockSel = document.getElementById("inv-stock-filter");
  const minPriceInput = document.getElementById("inv-min-price");
  const maxPriceInput = document.getElementById("inv-max-price");
  const searchInput = document.getElementById("inv-search");
  const sortSel = document.getElementById("inv-sort");

  const cat = catSel ? catSel.value : "all";
  const stock = stockSel ? stockSel.value : "all";
  const minPrice = minPriceInput && minPriceInput.value ? parseFloat(minPriceInput.value) : null;
  const maxPrice = maxPriceInput && maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;
  const search = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const sortBy = sortSel ? sortSel.value : "name";

  FILTERED = PRODUCTS.filter(p => {
    let ok = true;

    if (cat !== "all" && p.category !== cat) ok = false;
    if (stock === "in" && Number(p.qty) <= 0) ok = false;
    if (stock === "out" && Number(p.qty) > 0) ok = false;
    if (minPrice !== null && Number(p.price) < minPrice) ok = false;
    if (maxPrice !== null && Number(p.price) > maxPrice) ok = false;

    if (search) {
      const text = (p.name + " " + p.category).toLowerCase();
      if (!text.includes(search)) ok = false;
    }

    return ok;
  });

  FILTERED.sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    } else if (sortBy === "price") {
      return Number(a.price) - Number(b.price);
    } else if (sortBy === "qty") {
      return Number(a.qty) - Number(b.qty);
    }
    return 0;
  });

  CURRENT_PAGE = 1;
  renderProducts();
}

/* ============================
   HISTORIAL
============================ */
function renderHistory(history) {
  const list = document.getElementById("inv-history-list");
  if (!list) return;

  list.innerHTML = "";
  history.slice(0, 30).forEach(h => {
    const li = document.createElement("li");
    li.textContent = h;
    list.appendChild(li);
  });
}

/* ============================
   HEADER: SALUDO Y AVATAR
============================ */
function setupHeader() {
  const welcome = document.getElementById("inv-welcome");
  const role = document.getElementById("inv-role");
  const avatar = document.getElementById("inv-avatar");

  if (!welcome || !role || !avatar) return;

  if (CURRENT_USER === "GaboHN") {
    welcome.textContent = "Hola, GaboHN 👋";
    role.textContent = "Administrador principal";
    avatar.textContent = "GH";
  } else if (CURRENT_USER === "JarCo") {
    welcome.textContent = "Hola, JarCo 👋";
    role.textContent = "Administrador";
    avatar.textContent = "JC";
  } else {
    welcome.textContent = "Hola 👋";
    role.textContent = "Usuario";
    avatar.textContent = "US";
  }
}

/* ============================
   INICIO
============================ */
if (window.location.pathname.includes("inventario.html")) {
  window.addEventListener("load", () => {
    CURRENT_USER = localStorage.getItem("invUser") || "ADMIN";
    CURRENT_ROLE = localStorage.getItem("invRole") || "ADMIN";

    applySavedTheme();
    setupHeader();

    const catSel = document.getElementById("inv-filter");
    const stockSel = document.getElementById("inv-stock-filter");
    const minPriceInput = document.getElementById("inv-min-price");
    const maxPriceInput = document.getElementById("inv-max-price");
    const searchInput = document.getElementById("inv-search");
    const sortSel = document.getElementById("inv-sort");
    const selItems = document.getElementById("inv-items-per-page");

    if (catSel) catSel.addEventListener("change", applyFilters);
    if (stockSel) stockSel.addEventListener("change", applyFilters);
    if (minPriceInput) minPriceInput.addEventListener("input", applyFilters);
    if (maxPriceInput) maxPriceInput.addEventListener("input", applyFilters);
    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (sortSel) sortSel.addEventListener("change", applyFilters);
    if (selItems) ITEMS_PER_PAGE = parseInt(selItems.value || "10");

    loadProducts();
  });
} else {
  // En login también aplicamos tema guardado
  window.addEventListener("load", () => {
    applySavedTheme();
  });
}
