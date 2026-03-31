/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyki7otdBUFr_FYQzEREb52DwNBlyuQADj4Y9qg8rwn841rokXFus0sqk2Qf_4M_tOg/exec";

let invProducts = [];
let invEditIndex = null;
let invCurrentPage = 1;
let invItemsPerPage = 10;

/* ============================
   ROLES
============================ */
const invUsers = {
  "Renee":   { pass: "TU_CLAVE", role: "admin" },
  "GaboHN":  { pass: "199311",   role: "admin" },
  "JarcoHN": { pass: "jarco",    role: "admin" }
};

let invCurrentUser = null;

/* ============================
   LOGIN
============================ */
function invLogin() {
  const u = document.getElementById("inv-user").value;
  const p = document.getElementById("inv-pass").value;

  if (invUsers[u] && invUsers[u].pass === p) {
    invCurrentUser = { name: u, role: invUsers[u].role };
    localStorage.setItem("inv-logged", JSON.stringify(invCurrentUser));
    window.location.href = "inventario.html";
  } else {
    alert("Usuario o contraseña incorrectos");
  }
}

function invLogout() {
  localStorage.removeItem("inv-logged");
  window.location.href = "index.html";
}

/* ============================
   CARGAR PRODUCTOS
============================ */
async function invFetchProducts() {
  const res = await fetch(API_URL);
  const data = await res.json();

  invProducts = data.map(p => ({
    id: Number(p.id),
    name: p.name,
    price: Number(p.price),
    qty: Number(p.qty),
    category: p.category,
    images: JSON.parse(p.images || "[]"),
    uploadedBy: p.uploadedBy || "Desconocido",
    createdAt: Number(p.createdAt),
    updatedAt: Number(p.updatedAt)
  }));

  invLoadCategories();
  invRenderProducts();
}

/* ============================
   GUARDAR EN SHEETS
============================ */
async function invSaveToSheet(product) {
  await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(product)
  });
}

/* ============================
   FILTROS
============================ */
function invLoadCategories() {
  const filter = document.getElementById("inv-filter");
  const cats = [...new Set(invProducts.map(p => p.category))];

  filter.innerHTML = `<option value="all">Todas</option>`;
  cats.forEach(c => {
    filter.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

function invApplyFilters(list) {
  const cat = document.getElementById("inv-filter").value;
  const stock = document.getElementById("inv-stock-filter").value;
  const min = Number(document.getElementById("inv-min-price").value);
  const max = Number(document.getElementById("inv-max-price").value);

  return list.filter(p => {
    if (cat !== "all" && p.category !== cat) return false;
    if (stock === "out" && p.qty > 0) return false;
    if (stock === "in" && p.qty === 0) return false;
    if (min && p.price < min) return false;
    if (max && p.price > max) return false;
    return true;
  });
}

/* ============================
   PAGINACIÓN
============================ */
function invRenderProducts() {
  let list = invApplyFilters(invProducts);

  const start = (invCurrentPage - 1) * invItemsPerPage;
  const end = start + invItemsPerPage;
  const pageItems = list.slice(start, end);

  invRenderPagination(list.length);
  invRenderList(pageItems, start);
}

function invRenderPagination(total) {
  const pages = Math.ceil(total / invItemsPerPage);
  const box = document.getElementById("inv-pagination");

  box.innerHTML = `
    <button onclick="invPrevPage()" ${invCurrentPage === 1 ? "disabled" : ""}>Anterior</button>
    <span>Página ${invCurrentPage} de ${pages}</span>
    <button onclick="invNextPage(${pages})" ${invCurrentPage === pages ? "disabled" : ""}>Siguiente</button>
  `;
}

function invPrevPage() {
  if (invCurrentPage > 1) {
    invCurrentPage--;
    invRenderProducts();
  }
}

function invNextPage(max) {
  if (invCurrentPage < max) {
    invCurrentPage++;
    invRenderProducts();
  }
}

function invChangeItemsPerPage() {
  invItemsPerPage = Number(document.getElementById("inv-items-per-page").value);
  invCurrentPage = 1;
  invRenderProducts();
}

/* ============================
   STOCK (FUNCIONA)
============================ */
async function invChangeStock(index, delta) {
  const p = invProducts[index];
  if (!p) return;

  p.qty += delta;
  if (p.qty < 0) p.qty = 0;
  p.updatedAt = Date.now();

  document.getElementById(`inv-stock-${index}`).textContent = p.qty;

  await invSaveToSheet(p);
}

/* ============================
   RENDER
============================ */
function invRenderList(list, offset) {
  const container = document.getElementById("inv-products");
  container.innerHTML = "";

  const isAdmin = invCurrentUser?.role === "admin";

  list.forEach((p, localIndex) => {
    const index = offset + localIndex;
    const mainImg = p.images[0] || "https://via.placeholder.com/1200";

    let thumbs = "";
    p.images.forEach(img => {
      thumbs += `<img src="${img}" onclick="this.parentNode.previousElementSibling.src='${img}'">`;
    });

    container.innerHTML += `
      <div class="inv-item ${p.qty === 0 ? "inv-out" : ""}">
        ${p.qty === 0 ? `<div class="inv-out-tag">AGOTADO</div>` : ""}
        
        <img class="inv-main-img" src="${mainImg}">
        <div class="inv-thumbs">${thumbs}</div>

        <h4>${p.name}</h4>
        <p>Categoría: ${p.category}</p>
        <p>Precio: Lps. ${p.price}</p>

        <div class="inv-stock-row">
          <button onclick="invChangeStock(${index}, -1)">-</button>
          <span id="inv-stock-${index}">${p.qty}</span>
          <button onclick="invChangeStock(${index}, 1)">+</button>
        </div>

        <button onclick="invEditByIndex(${index})">Editar</button>
        <button onclick="invSendWAByIndex(${index})">WhatsApp</button>

        ${isAdmin ? `<button class="inv-delete-btn" onclick="invDeleteByIndex(${index})">Eliminar</button>` : ""}
      </div>
    `;
  });
}

/* ============================
   AUTO LOGIN
============================ */
const savedUser = localStorage.getItem("inv-logged");
if (savedUser && window.location.pathname.includes("inventario")) {
  invCurrentUser = JSON.parse(savedUser);
  invFetchProducts();
}
