/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbyki7otdBUFr_FYQzEREb52DwNBlyuQADj4Y9qg8rwn841rokXFus0sqk2Qf_4M_tOg/exec";

let invProducts = [];
let invEditIndex = null;
let invCurrentPage = 1;
let invItemsPerPage = 10;

/* ============================
   ROLES Y USUARIOS
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

    document.getElementById("inv-login").style.display = "none";
    document.getElementById("inv-panel").style.display = "block";

    invFetchProducts();
  } else {
    alert("Usuario o contraseña incorrectos");
  }
}

function invLogout() {
  localStorage.removeItem("inv-logged");
  location.reload();
}

/* ============================
   CARGAR DESDE GOOGLE SHEETS
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
   GUARDAR EN GOOGLE SHEETS
============================ */
async function invSaveToSheet(product, isEdit) {
  const method = isEdit ? "PUT" : "POST";

  await fetch(API_URL, {
    method,
    body: JSON.stringify(product)
  });

  await invFetchProducts();
}

/* ============================
   ELIMINAR PRODUCTO
============================ */
async function invDeleteProduct(id) {
  if (!confirm("¿Eliminar este producto?")) return;

  await fetch(API_URL, {
    method: "DELETE",
    body: JSON.stringify({ id })
  });

  await invFetchProducts();
}

/* ============================
   FILTROS AVANZADOS
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
  invRenderList(pageItems);
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
   STOCK EN TIEMPO REAL
============================ */
async function invChangeStock(id, delta) {
  const p = invProducts.find(x => x.id === id);
  if (!p) return;

  p.qty += delta;
  if (p.qty < 0) p.qty = 0;
  p.updatedAt = Date.now();

  document.getElementById(`inv-stock-${id}`).textContent = p.qty;

  await invSaveToSheet(p, true);
}

/* ============================
   RENDERIZAR PRODUCTOS
============================ */
function invRenderList(list) {
  const container = document.getElementById("inv-products");
  container.innerHTML = "";

  list.forEach(p => {
    const mainImg = p.images[0] || "https://via.placeholder.com/1200";

    let thumbs = "";
    p.images.forEach(img => {
      thumbs += `<img src="${img}" onclick="this.parentNode.previousElementSibling.src='${img}'">`;
    });

    const isAdmin = invCurrentUser?.role === "admin";

    container.innerHTML += `
      <div class="inv-item ${p.qty === 0 ? "inv-out" : ""}">
        ${p.qty === 0 ? `<div class="inv-out-tag">AGOTADO</div>` : ""}
        
        <img class="inv-main-img" src="${mainImg}">
        <div class="inv-thumbs">${thumbs}</div>

        <h4>${p.name}</h4>
        <p>Categoría: ${p.category}</p>
        <p>Precio: Lps. ${p.price}</p>

        <div class="inv-stock-row">
          <button onclick="invChangeStock(${p.id}, -1)">-</button>
          <span id="inv-stock-${p.id}">${p.qty}</span>
          <button onclick="invChangeStock(${p.id}, 1)">+</button>
        </div>

        <button onclick="invEditById(${p.id})">Editar</button>
        <button onclick="invSendWAById(${p.id})">WhatsApp</button>

        ${isAdmin ? `<button class="inv-delete-btn" onclick="invDeleteProduct(${p.id})">Eliminar</button>` : ""}
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
    document.getElementById(id).value = "";
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
    document.getElementById("inv-img3"),
    document.getElementById("inv-img4"),
    document.getElementById("inv-img5")
  ];

  let readers = [];
  let newImages = [];

  fileInputs.forEach(input => {
    if (input.files.length > 0) {
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

    await invSaveToSheet(product, invEditIndex !== null);

    invCloseModal();
  });
}

/* ============================
   EDITAR PRODUCTO
============================ */
function invEditById(id) {
  const idx = invProducts.findIndex(p => p.id === id);
  if (idx === -1) return;
  invEdit(idx);
}

function invEdit(i) {
  invEditIndex = i;
  const p = invProducts[i];

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
        <img src="${img}">
        <div class="inv-delete-img" onclick="invDeleteImage(${idx})">🗑 Quitar</div>
      </div>
    `;
  });

  document.getElementById("inv-modal").style.display = "flex";
}

/* ============================
   ELIMINAR IMAGEN
============================ */
async function invDeleteImage(idx) {
  const p = invProducts[invEditIndex];
  p.images.splice(idx, 1);
  p.updatedAt = Date.now();

  await invSaveToSheet(p, true);
  invEdit(invEditIndex);
}

/* ============================
   WHATSAPP POR PRODUCTO
============================ */
function invSendWAById(id) {
  const p = invProducts.find(p => p.id === id);
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
   AUTO LOGIN
============================ */
const savedUser = localStorage.getItem("inv-logged");
if (savedUser) {
  invCurrentUser = JSON.parse(savedUser);
  document.getElementById("inv-login").style.display = "none";
  document.getElementById("inv-panel").style.display = "block";
  invFetchProducts();
}
