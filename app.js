/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyki7otdBUFrFYQzEREb52DwNBlyuQADj4Y9qg8rwn841rokXFus0sqk2Qf4MtOg/exec";

let PRODUCTS = [];
let CURRENT_PAGE = 1;
let ITEMS_PER_PAGE = 10;

/* ============================
   LOGIN
============================ */
function invLogin() {
  const user = document.getElementById("inv-user").value.trim();
  const pass = document.getElementById("inv-pass").value.trim();

  if (user === "admin" && pass === "1234") {
    window.location.href = "inventario.html";
  } else {
    alert("Credenciales incorrectas");
  }
}

function invLogout() {
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
    renderProducts();
    updateDashboard();
    loadCategories();
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

  const images = [];
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById("inv-img" + i);
    if (input.files.length > 0) {
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
    images: JSON.stringify(images)
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
  container.innerHTML = "";

  const start = (CURRENT_PAGE - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = PRODUCTS.slice(start, end);

  pageItems.forEach(p => {
    const images = JSON.parse(p.images || "[]");
    const mainImg = images[0] || "";

    container.innerHTML += `
      <div class="inv-item">
        <img src="${mainImg}" class="inv-main-img">

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

/* ============================
   PAGINACIÓN
============================ */
function renderPagination() {
  const totalPages = Math.ceil(PRODUCTS.length / ITEMS_PER_PAGE);
  const pag = document.getElementById("inv-pagination");

  pag.innerHTML = `
    <button onclick="changePage(-1)">Anterior</button>
    <span>${CURRENT_PAGE} / ${totalPages}</span>
    <button onclick="changePage(1)">Siguiente</button>
  `;
}

function changePage(dir) {
  const totalPages = Math.ceil(PRODUCTS.length / ITEMS_PER_PAGE);
  CURRENT_PAGE += dir;

  if (CURRENT_PAGE < 1) CURRENT_PAGE = 1;
  if (CURRENT_PAGE > totalPages) CURRENT_PAGE = totalPages;

  renderProducts();
}

function invChangeItemsPerPage() {
  ITEMS_PER_PAGE = parseInt(document.getElementById("inv-items-per-page").value);
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
      change
    })
  });

  await loadProducts();
}

/* ============================
   DASHBOARD
============================ */
function updateDashboard() {
  let totalProducts = PRODUCTS.length;
  let totalQty = PRODUCTS.reduce((a, b) => a + parseInt(b.qty), 0);
  let totalValue = PRODUCTS.reduce((a, b) => a + (b.price * b.qty), 0);
  let outCount = PRODUCTS.filter(p => p.qty <= 0).length;

  document.getElementById("dash-total-products").innerText = totalProducts;
  document.getElementById("dash-total-qty").innerText = totalQty;
  document.getElementById("dash-total-value").innerText = totalValue;
  document.getElementById("dash-out-count").innerText = outCount;
}

/* ============================
   CATEGORÍAS
============================ */
function loadCategories() {
  const select = document.getElementById("inv-filter");
  const cats = [...new Set(PRODUCTS.map(p => p.category))];

  select.innerHTML = `<option value="all">Todas</option>`;
  cats.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

/* ============================
   INICIO
============================ */
if (window.location.pathname.includes("inventario.html")) {
  loadProducts();
}
