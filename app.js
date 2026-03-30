let invEditIndex = null;

// Usuarios permitidos
const invUsers = {
  "sdcomayagua": "199311",
  "jarco": "jarco"
};

/* ============================
   LOGIN
============================ */
function invLogin() {
  const u = document.getElementById("inv-user").value;
  const p = document.getElementById("inv-pass").value;

  if (invUsers[u] && invUsers[u] === p) {
    localStorage.setItem("inv-logged", "true");
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
   CARGAR PRODUCTOS
============================ */
function invLoadProducts() {
  const list = JSON.parse(localStorage.getItem("inv-products") || "[]");
  const filter = document.getElementById("inv-filter").value;

  const filtered = list.filter(p =>
    filter === "all" || p.category === filter
  );

  invRenderProducts(filtered);
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

    container.innerHTML += `
      <div class="inv-item">
        <img class="inv-main-img" src="${mainImg}">
        <div class="inv-thumbs">${thumbs}</div>
        <h4>${p.name}</h4>
        <p>Categoría: ${p.category}</p>
        <p>Precio: <b>Lps. ${p.price}</b></p>
        <p>Stock: <b>${p.qty}</b></p>
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
  const price = document.getElementById("inv-price").value;
  const qty = document.getElementById("inv-qty").value;
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

    const product = { name, price, qty, category, images: newImages };

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
   MANTENER SESIÓN
============================ */
if (localStorage.getItem("inv-logged") === "true") {
  document.getElementById("inv-login").style.display = "none";
  document.getElementById("inv-panel").style.display = "block";
  invLoadProducts();
  invLoadCategories();
}
