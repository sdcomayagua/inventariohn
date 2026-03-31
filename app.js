/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyki7otdBUFr_FYQzEREb52DwNBlyuQADj4Y9qg8rwn841rokXFus0sqk2Qf_4M_tOg/exec";

let invProducts = [];
let invEditIndex = null;
let invCurrentPage = 1;
let invItemsPerPage = 10;
let invHistory = [];

/* ============================
   ROLES
============================ */
const invUsers = {
  "Renee":   { pass: "TU_CLAVE", role: "admin" },
  "GaboHN":  { pass: "199311",   role: "admin" },
  "JarCoHN": { pass: "jarco",    role: "admin" }
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
  invUpdateDashboard();
  invLoadHistoryFromStorage();
  invRenderHistory();
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
  if (!filter) return;

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
  const box = document.getElementById("inv-pagination");
  if (!box) return;

  const pages = Math.max(1, Math.ceil(total / invItemsPerPage));
  if (invCurrentPage > pages) invCurrentPage = pages;

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
   STOCK + HISTORIAL
============================ */
async function invChangeStock(index, delta) {
  const p = invProducts[index];
  if (!p) return;

  const oldQty = p.qty;
  p.qty += delta;
  if (p.qty < 0) p.qty = 0;
  p.updatedAt = Date.now();

  document.getElementById(`inv-stock-${index}`).textContent = p.qty;

  await invSaveToSheet(p);

  invAddHistory({
    type: "stock",
    productId: p.id,
    name: p.name,
    from: oldQty,
    to: p.qty,
    delta,
    user: invCurrentUser?.name || "Desconocido",
    at: Date.now()
  });

  invRenderHistory();
  invUpdateDashboard();
}

/* ============================
   RENDER LISTA
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
   MODAL
============================ */
function invOpenModal() {
  invEditIndex = null;

  document.getElementById("inv-modal-title").innerText = "Agregar Producto";
  document.getElementById("inv-edit-images").innerHTML = "";

  ["inv-img1","inv-img2","inv-img3","inv-img4","inv-img5"].forEach(id=>{
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  document.getElementById("inv-name").value = "";
  document.getElementById("inv-price").value = "";
  document.getElementById("inv-qty").value = 0;
  document.getElementById("inv-category").value = "";

  document.getElementById("inv-modal").style.display = "flex";
}

function invCloseModal() {
  document.getElementById("inv-modal").style.display = "none";
}

/* ============================
   GUARDAR PRODUCTO
============================ */
function invSaveProduct() {
  const name = document.getElementById("inv-name").value;
  const price = Number(document.getElementById("inv-price").value);
  const qty = Number(document.getElementById("inv-qty").value);
  const category = document.getElementById("inv-category").value;

  if (!name || isNaN(price) || isNaN(qty) || !category) {
    alert("Completa todos los campos correctamente");
    return;
  }

  const fileInputs = [
    document.getElementById("inv-img1"),
    document.getElementById("inv-img2"),
    document.get.getElementById("inv-img3"),
    document.getElementById("inv-img4"),
    document.getElementById("inv-img5")
  ];

  let readers = [];
  let newImages = [];

  fileInputs.forEach(input => {
    if (input && input.files && input.files.length > 0) {
      const reader = new FileReader();
      readers.push(
        new Promise(resolve => {
          reader.onload = e => {
            newImages.push(e.target.result);
            resolve();
          };
          reader.readAsDataURL(input.files[0]);
        })
      );
    }
  });

  Promise.all(readers).then(async () => {
    const now = Date.now();
    const user = invCurrentUser?.name || "Desconocido";

    let product;

    if (invEditIndex !== null) {
      const old = invProducts[invEditIndex];
      product = {
        id: old.id,
        name,
        price,
        qty,
        category,
        images: [...old.images, ...newImages],
        uploadedBy: old.uploadedBy,
        createdAt: old.createdAt,
        updatedAt: now
      };
    } else {
      product = {
        id: now,
        name,
        price,
        qty,
        category,
        images: newImages,
        uploadedBy: user,
        createdAt: now,
        updatedAt: now
      };
    }

    await invSaveToSheet(product);

    invAddHistory({
      type: invEditIndex !== null ? "edit" : "new",
      productId: product.id,
      name: product.name,
      qty: product.qty,
      user,
      at: now
    });

    invRenderHistory();
    invUpdateDashboard();
    invCloseModal();
    invFetchProducts();
  });
}

/* ============================
   EDITAR / ELIMINAR
============================ */
function invEditByIndex(index) {
  invEditIndex = index;
  const p = invProducts[index];

  document.getElementById("inv-modal-title").innerText = "Editar Producto";
  document.getElementById("inv-name").value = p.name;
  document.getElementById("inv-price").value = p.price;
  document.getElementById("inv-qty").value = p.qty;
  document.getElementById("inv-category").value = p.category;

  const editBox = document.getElementById("inv-edit-images");
  editBox.innerHTML = "";

  p.images.forEach((img, idx) => {
    editBox.innerHTML += `
      <div class="inv-mini-edit">
        <img src="${img}" style="width:60px;height:60px;border-radius:6px;margin:4px;">
        <div class="inv-delete-img" onclick="invDeleteImage(${idx})">🗑 Quitar</div>
      </div>
    `;
  });

  document.getElementById("inv-modal").style.display = "flex";
}

async function invDeleteByIndex(index) {
  if (!confirm("¿Eliminar este producto?")) return;

  const p = invProducts[index];
  const now = Date.now();

  p.name = "[ELIMINADO] " + p.name;
  p.qty = 0;
  p.updatedAt = now;

  await invSaveToSheet(p);

  invAddHistory({
    type: "delete",
    productId: p.id,
    name: p.name,
    user: invCurrentUser?.name || "Desconocido",
    at: now
  });

  invRenderHistory();
  invUpdateDashboard();
  invFetchProducts();
}

/* ============================
   ELIMINAR IMAGEN
============================ */
async function invDeleteImage(idx) {
  const p = invProducts[invEditIndex];
  p.images.splice(idx, 1);
  p.updatedAt = Date.now();

  await invSaveToSheet(p);
  invEditByIndex(invEditIndex);
}

/* ============================
   WHATSAPP
============================ */
function invSendWAByIndex(index) {
  const p = invProducts[index];
  if (!p) return;

  let text = `🔹 *${p.name}*\n`;
  text += `Precio: Lps. ${p.price}\n`;
  text += `Stock: ${p.qty}\n`;
  text += `Categoría: ${p.category}\n`;
  text += `Subido por: ${p.uploadedBy}\n`;
  text += `Creado: ${new Date(p.createdAt).toLocaleString()}\n`;
  text += `Editado: ${new Date(p.updatedAt).toLocaleString()}\n`;

  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

/* ============================
   DASHBOARD
============================ */
function invUpdateDashboard() {
  const totalProducts = invProducts.length;
  const totalQty = invProducts.reduce((sum, p) => sum + p.qty, 0);
  const totalValue = invProducts.reduce((sum, p) => sum + p.qty * p.price, 0);
  const outCount = invProducts.filter(p => p.qty === 0).length;

  document.getElementById("dash-total-products").textContent = totalProducts;
  document.getElementById("dash-total-qty").textContent = totalQty;
  document.getElementById("dash-total-value").textContent = totalValue.toFixed(2);
  document.getElementById("dash-out-count").textContent = outCount;
}

/* ============================
   HISTORIAL LOCAL
============================ */
function invAddHistory(entry) {
  invHistory.unshift(entry);
  if (invHistory.length > 100) invHistory.pop();
  localStorage.setItem("inv-history", JSON.stringify(invHistory));
}

function invLoadHistoryFromStorage() {
  const saved = localStorage.getItem("inv-history");
  if (saved) {
    invHistory = JSON.parse(saved);
  }
}

function invRenderHistory() {
  const ul = document.getElementById("inv-history-list");
  if (!ul) return;

  ul.innerHTML = "";
  invHistory.slice(0, 30).forEach(m => {
    let text = "";
    const date = new Date(m.at).toLocaleString();

    if (m.type === "stock") {
      text = `${date} — ${m.user} cambió ${m.name} de ${m.from} a ${m.to}`;
    } else if (m.type === "new") {
      text = `${date} — ${m.user} agregó ${m.name} (stock: ${m.qty})`;
    } else if (m.type === "edit") {
      text = `${date} — ${m.user} editó ${m.name}`;
    } else if (m.type === "delete") {
      text = `${date} — ${m.user} eliminó ${m.name}`;
    }

    ul.innerHTML += `<li>${text}</li>`;
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
