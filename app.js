/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbzb6tcVvH-ZPfMf1fhbxbKRanhChthWBFV0OJ4mOdOMbW5MLGB7Mmrcnf-alAg0foeH/exec";
let invProducts = [];
let invEditIndex = null;

/* ============================
   USUARIOS
============================ */
const invUsers = {
  "GaboHN": "199311",
  "JarCoHN": "jarco"
};

/* ============================
   LOGIN
============================ */
function invLogin() {
  const u = document.getElementById("inv-user").value;
  const p = document.getElementById("inv-pass").value;

  if (invUsers[u] && invUsers[u] === p) {
    localStorage.setItem("inv-logged", u);
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
  invLoadProducts();
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
   CATEGORÍAS
============================ */
function invLoadCategories() {
  const filter = document.getElementById("inv-filter");
  const cats = [...new Set(invProducts.map(p => p.category))];

  filter.innerHTML = `<option value="all">Todas las categorías</option>`;
  cats.forEach(c => {
    filter.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

/* ============================
   BUSCAR
============================ */
function invSearch() {
  const term = document.getElementById("inv-search").value.toLowerCase();
  const filtered = invProducts.filter(p =>
    p.name.toLowerCase().includes(term)
  );
  invRenderProducts(filtered);
}

/* ============================
   ORDENAR
============================ */
function invSort(list) {
  const sort = document.getElementById("inv-sort").value;

  switch (sort) {
    case "price-asc": return list.sort((a, b) => a.price - b.price);
    case "price-desc": return list.sort((a, b) => b.price - a.price);
    case "qty-asc": return list.sort((a, b) => a.qty - b.qty);
    case "qty-desc": return list.sort((a, b) => b.qty - a.qty);
    case "date-new": return list.sort((a, b) => b.createdAt - a.createdAt);
    case "date-old": return list.sort((a, b) => a.createdAt - b.createdAt);
    default: return list;
  }
}

/* ============================
   FILTRAR + ORDENAR
============================ */
function invLoadProducts() {
  const filter = document.getElementById("inv-filter").value;

  let list = invProducts.filter(p =>
    filter === "all" || p.category === filter
  );

  list = invSort(list);

  invRenderProducts(list);
}

/* ============================
   ACTUALIZAR STOCK EN TIEMPO REAL
============================ */
async function invChangeStock(id, delta) {
  const idx = invProducts.findIndex(p => p.id === id);
  if (idx === -1) return;

  const p = invProducts[idx];

  p.qty += delta;
  if (p.qty < 0) p.qty = 0;
  p.updatedAt = Date.now();

  // Actualizar DOM inmediatamente
  const span = document.getElementById(`inv-stock-${p.id}`);
  if (span) span.textContent = p.qty;

  // Actualizar estilo AGOTADO
  const card = document.getElementById(`inv-item-${p.id}`);
  if (card) {
    if (p.qty === 0) {
      card.classList.add("inv-out");
    } else {
      card.classList.remove("inv-out");
    }
  }

  await invSaveToSheet(p, true);
}

/* ============================
   RENDERIZAR PRODUCTOS
============================ */
function invRenderProducts(list) {
  const container = document.getElementById("inv-products");
  container.innerHTML = "";

  list.forEach((p) => {
    const mainImg = p.images[0] || "https://via.placeholder.com/1200";

    let thumbs = "";
    p.images.forEach(img => {
      thumbs += `<img src="${img}" onclick="this.parentNode.previousElementSibling.src='${img}'">`;
    });

    const outTag = p.qty == 0 ? `<div class="inv-out-tag">AGOTADO</div>` : "";
    const outClass = p.qty == 0 ? "inv-out" : "";

    container.innerHTML += `
      <div class="inv-item ${outClass}" id="inv-item-${p.id}">
        ${outTag}
        <img class="inv-main-img" src="${mainImg}">
        <div class="inv-thumbs">${thumbs}</div>

        <h4>${p.name}</h4>
        <p>Categoría: ${p.category}</p>
        <p>Precio: <b>Lps. ${p.price}</b></p>

        <p>Stock:</p>
        <div class="inv-stock-row">
          <button class="inv-stock-btn" onclick="invChangeStock(${p.id}, -1)">-</button>
          <span class="inv-stock-num" id="inv-stock-${p.id}">${p.qty}</span>
          <button class="inv-stock-btn" onclick="invChangeStock(${p.id}, 1)">+</button>
        </div>

        <p>Creado: ${new Date(p.createdAt).toLocaleString()}</p>
        <p>Editado: ${new Date(p.updatedAt).toLocaleString()}</p>
        <div class="inv-uploaded">Subido por: ${p.uploadedBy}</div>

        <button class="inv-edit-btn" onclick="invEditById(${p.id})">Editar</button>
        <button class="inv-wa-btn" onclick="invSendWAById(${p.id})">WhatsApp</button>
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
    document.getElementById("inv-img3"),
    document.getElementById("inv-img4"),
    document.getElementById("inv-img5")
  ];

  let readers = [];
  let newImages = [];

  fileInputs.forEach((input) => {
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
    const user = localStorage.getItem("inv-logged") || "Desconocido";

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
        uploadedBy: old.uploadedBy || user,
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
   EDITAR PRODUCTO (POR ID)
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

  if (p.images && p.images.length) {
    p.images.forEach((img, idx) => {
      editBox.innerHTML += `
        <div class="inv-mini-edit">
          <img src="${img}">
          <div class="inv-delete-img" onclick="invDeleteImage(${idx})">🗑 Quitar</div>
        </div>
      `;
    });
  }

  document.getElementById("inv-modal").style.display = "flex";
}

/* ============================
   ELIMINAR IMAGEN
============================ */
async function invDeleteImage(idx) {
  const p = invProducts[invEditIndex];
  if (!p.images) p.images = [];
  p.images.splice(idx, 1);
  p.updatedAt = Date.now();

  await invSaveToSheet(p, true);
  invEdit(invEditIndex);
}

/* ============================
   WHATSAPP POR PRODUCTO (POR ID)
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

  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

/* ============================
   AUTO LOGIN
============================ */
if (localStorage.getItem("inv-logged")) {
  document.getElementById("inv-login").style.display = "none";
  document.getElementById("inv-panel").style.display = "block";
  invFetchProducts();
}
