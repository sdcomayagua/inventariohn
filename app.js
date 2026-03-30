/* ============================
   CONFIG
============================ */
const API_URL = "https://script.google.com/macros/s/AKfycbzb6tcVvH-ZPfMf1fhbxbKRanhChthWBFV0OJ4mOdOMbW5MLGB7Mmrcnf-alAg0foeH/exec";
let invEditIndex = null;
let invProducts = [];

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
  invRenderProducts(invProducts);
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
   RENDERIZAR PRODUCTOS
============================ */
function invRenderProducts(list) {
  const container = document.getElementById("inv-products");
  container.innerHTML = "";

  list.forEach((p, i) => {
    const mainImg = p.images[0] || "https://via.placeholder.com/1200";

    let thumbs = "";
    p.images.forEach(img => {
      thumbs += `<img src="${img}" onclick="this.parentNode.previousElementSibling.src='${img}'">`;
    });

    const outTag = p.qty == 0 ? `<div class="inv-out-tag">AGOTADO</div>` : "";
    const outClass = p.qty == 0 ? "inv-out" : "";

    container.innerHTML += `
      <div class="inv-item ${outClass}">
        ${outTag}
        <img class="inv-main-img" src="${mainImg}">
        <div class="inv-thumbs">${thumbs}</div>
        <h4>${p.name}</h4>
        <p>Categoría: ${p.category}</p>
        <p>Precio: <b>Lps. ${p.price}</b></p>
        <p>Stock: <b>${p.qty}</b></p>
        <p>Creado: ${new Date(p.createdAt).toLocaleString()}</p>
        <p>Editado: ${new Date(p.updatedAt).toLocaleString()}</p>
        <div class="inv-uploaded">Subido por: ${p.uploadedBy}</div>
        <button class="inv-edit-btn" onclick="invEdit(${i})">Editar</button>
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

  if (!name || !price || qty < 0) {
    alert("Completa todos los campos");
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

  fileInputs.forEach((input, idx) => {
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
    const user = localStorage.getItem("inv-logged") || "Desconocido";

    let product = {
      id: invEditIndex !== null ? invProducts[invEditIndex].id : now,
      name,
      price,
      qty,
      category,
      images: invEditIndex !== null ? [...invProducts[invEditIndex].images, ...newImages] : newImages,
      uploadedBy: user,
      createdAt: invEditIndex !== null ? invProducts[invEditIndex].createdAt : now,
      updatedAt: now
    };

    await invSaveToSheet(product, invEditIndex !== null);

    invCloseModal();
  });
}

/* ============================
   EDITAR PRODUCTO
============================ */
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
   EXPORTAR A WHATSAPP
============================ */
function invExportWhatsApp() {
  let text = "📦 *INVENTARIO HN*\n\n";

  invProducts.forEach(p => {
    text += `🔹 *${p.name}*\n`;
    text += `   Precio: Lps. ${p.price}\n`;
    text += `   Stock: ${p.qty}\n`;
    text += `   Categoría: ${p.category}\n`;
    text += `   Subido por: ${p.uploadedBy}\n`;
    text += `   Creado: ${new Date(p.createdAt).toLocaleString()}\n`;
    text += `   Editado: ${new Date(p.updatedAt).toLocaleString()}\n\n`;
  });

  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

/* ============================
   AUTO LOGIN
============================ */
if (localStorage.getItem("inv-logged")) {
  document.getElementById("inv-login").style.display = "none";
  document.getElementById("inv-panel").style.display = "block";
  invFetchProducts();
}
