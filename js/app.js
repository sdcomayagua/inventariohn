// data.js contiene un array "productos" con cada producto {nombre, img, categoria, stock}
const productosContainer = document.getElementById('productos-list');
const categoriasContainer = document.getElementById('categorias-list');

// Render categorías
categorias.forEach(c => {
  const card = document.createElement('div');
  card.className = 'categoria-card';
  card.innerHTML = `<img src="${c.img}" alt="${c.nombre}"><p>${c.nombre}</p>`;
  categoriasContainer.appendChild(card);
});

// Render productos
productos.forEach(producto => {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <img src="${producto.img}" alt="${producto.nombre}">
    <h3>${producto.nombre}</h3>
    <p>Categoría: ${producto.categoria}</p>
    <p>Stock: ${producto.stock}</p>
  `;
  productosContainer.appendChild(card);
});
