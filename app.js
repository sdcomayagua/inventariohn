let invEditIndex = null;

// Usuarios permitidos
const invUsers = {
  "GaboHN": "199311",
  "JarCo": "jarcohn"
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
    invLoadProducts();
    invLoadCategories();
  } else {
    alert("Usuario o contraseña incorrectos");
  }
}

function invLogout() {
  localStorage.removeItem("inv-logged");
  location.reload();
}

/* ============================
   STOCK (+ / -)
============================ */
function invChangeQty(val) {
  let qty = parseInt(document.getElementById("inv-qty").value || 0);
  qty += val;
  if (qty < 0) qty = 0;
  document.getElementById("inv-qty").value = qty;
}

/* ============================
   CATEGORÍAS
============================ */
function invLoadCategories() {
  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");
  const filter = document.getElementById("inv-filter");

  const cats = [...new Set(list.map(p => p.category))];

  filter.innerHTML = `<option value="all">Todas las categorías</option>`;
  cats.forEach(c => {
    filter.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

/* ============================
   BUSCADOR POR NOMBRE
============================ */
function invSearch() {
  const term = document.getElementById("inv-search").value.toLowerCase();
  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");

  const filtered = list.filter(p =>
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
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "qty-asc":
      return list.sort((a, b) => a.qty - b.qty);
    case "qty-desc":
      return list.sort((a, b) => b.qty - a.qty);
    case "date-new":
      return list.sort((a, b) => b.createdAt - a.createdAt);
    case "date-old":
      return list.sort((a, b) => a.createdAt - b.createdAt);
    default:
      return list;
  }
}

/* ============================
   CARGAR PRODUCTOS
============================ */
function invLoadProducts() {
  let list = JSON.parse(localStorage.getItem("inv-products") || "[]");
  const filter = document.getElementById("inv-filter").value;

  list = list.filter(p =>
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
      if (img) {
        thumbs += `<img src="${img}" onclick="this.parentNode.previousElementSibling.src='${img}'">`;
      }
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
  const price = parseFloat(document.getElementById("inv-price").value);
  const qty = parseInt(document.getElementById("inv-qty").value);
  const category = document.getElementById("inv-category").value;

  if (!name || !price || !qty || !category) {
    alert("Completa todos los campos");
    return;
  }

  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");

  let images = invEditIndex !== null ? [...list[invEditIndex].images] : [];

  const fileInputs = [
    document.getElementById("inv-img1"),
    document.getElementById("inv-img2"),
    document.getElementById("inv-img3"),
    document.getElementById("inv-img4"),
    document.getElementById("inv-img5")
  ];

  let readers = [];
  let newImages = [...images];

  fileInputs.forEach((input, idx) => {
    if (input.files.length > 0) {
      const reader = new FileReader();
      readers.push(
        new Promise(resolve => {
          reader.onload = e => {
            newImages[idx] = e.target.result;
            resolve();
          };
          reader.readAsDataURL(input.files[0]);
        })
      );
    }
  });

  Promise.all(readers).then(() => {
    newImages = newImages.filter(img => img);

    const now = Date.now();

    const product = { 
      name, 
      price, 
      qty, 
      category, 
      images: newImages,
      uploadedBy: localStorage.getItem("inv-logged"),
      createdAt: invEditIndex !== null ? list[invEditIndex].createdAt : now,
      updatedAt: now
    };

    if (invEditIndex !== null) {
      list[invEditIndex] = product;
    } else {
      list.push(product);
    }

    localStorage.setItem("inv-products", JSON.stringify(list));

    invCloseModal();
    invLoadProducts();
    invLoadCategories();
  });
}

/* ============================
   EDITAR PRODUCTO
============================ */
function invEdit(i) {
  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");
  const p = list[i];

  invEditIndex = i;

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
function invDeleteImage(idx) {
  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");
  list[invEditIndex].images.splice(idx, 1);
  localStorage.setItem("inv-products", JSON.stringify(list));
  invEdit(invEditIndex);
}

/* ============================
   EXPORTAR A WHATSAPP
============================ */
function invExportWhatsApp() {
  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");

  let text = "📦 *INVENTARIO HN*\n\n";

  list.forEach(p => {
    text += `🔹 *${p.name}*\n`;
    text += `   Precio: Lps. ${p.price}\n`;
    text += `   Stock: ${p.qty}\n`;
    text += `   Categoría: ${p.category}\n`;
    text += `   Subido por: ${p.uploadedBy}\n`;
    text += `   Creado: ${new Date(p.createdAt).toLocaleString()}\n`;
    text += `   Editado: ${new Date(p.updatedAt).toLocaleString()}\n\n`;
  });

  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank");
}

/* ============================
   MANTENER SESIÓN
============================ */
if (localStorage.getItem("inv-logged")) {
  document.getElementById("inv-login").style.display = "none";
  document.getElementById("inv-panel").style.display = "block";
  invLoadProducts();
  invLoadCategories();
}
