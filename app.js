/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyki7otdBUFrFYQzEREb52DwNBlyuQADj4Y9qg8rwn841rokXFus0sqk2Qf4MtOg/exec";

let PRODUCTS = [];
let FILTERED = [];
let CURRENT_PAGE = 1;
let ITEMS_PER_PAGE = 10;

let CURRENT_USER = null;

/* ============================
   LOGIN POR PIN (6 dígitos)
============================ */
function invLogin() {
  const pin = document.getElementById("inv-user").value.trim();

  const users = {
    "199311": "Gabriel",
    "123456": "JarCo"
  };

  if (users[pin]) {
    CURRENT_USER = users[pin];
    localStorage.setItem("invUser", CURRENT_USER);
    window.location.href = "inventario.html";
  } else {
    alert("PIN incorrecto");
  }
}

function invLogout() {
  localStorage.removeItem("invUser");
  window.location.href = "index.html";
}

/* ============================
   MODAL
============================ */
function invOpenModal() {
  document.getElementById("inv-modal").style.display = "flex";
}

function invCloseModal() {
  document.getElementById("inv-modal").style.display = "none";
  clearModalFields();
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
   GUARDAR PRODUCTO
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
    action: "add",
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
            ${thumbs.map((t, i) => `<img src="${t}" onclick="swapMainImage(this)" data-id="${p.id}">`).join("")}
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
   CATEGORÍAS Y FILTROS
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

  const cat = catSel ? catSel.value : "all";
  const stock = stockSel ? stockSel.value : "all";
  const minPrice = minPriceInput && minPriceInput.value ? parseFloat(minPriceInput.value) : null;
  const maxPrice = maxPriceInput && maxPriceInput.value ? parseFloat(maxPriceInput.value) : null;

  FILTERED = PRODUCTS.filter(p => {
    let ok = true;

    if (cat !== "all" && p.category !== cat) ok = false;
    if (stock === "in" && Number(p.qty) <= 0) ok = false;
    if (stock === "out" && Number(p.qty) > 0) ok = false;
    if (minPrice !== null && Number(p.price) < minPrice) ok = false;
    if (maxPrice !== null && Number(p.price) > maxPrice) ok = false;

    return ok;
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
   INICIO
============================ */
if (window.location.pathname.includes("inventario.html")) {
  window.addEventListener("load", () => {
    CURRENT_USER = localStorage.getItem("invUser") || "ADMIN";

    const catSel = document.getElementById("inv-filter");
    const stockSel = document.getElementById("inv-stock-filter");
    const minPriceInput = document.getElementById("inv-min-price");
    const maxPriceInput = document.getElementById("inv-max-price");

    if (catSel) catSel.addEventListener("change", applyFilters);
    if (stockSel) stockSel.addEventListener("change", applyFilters);
    if (minPriceInput) minPriceInput.addEventListener("input", applyFilters);
    if (maxPriceInput) maxPriceInput.addEventListener("input", applyFilters);

    const selItems = document.getElementById("inv-items-per-page");
    if (selItems) ITEMS_PER_PAGE = parseInt(selItems.value || "10");

    loadProducts();
  });
}
