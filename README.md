SDC POS PRO V4 - GitHub Pages + Apps Script + Google Sheets

CAMBIOS VISUALES Y FUNCIONALES V4
- Menú hamburguesa corregido: se cierra al seleccionar una opción, al tocar fuera o con Escape.
- Se quitaron las leyendas largas del inicio y se dejó un dashboard más limpio.
- Catálogo rediseñado con botones de vista por icono: 1 por fila, 2 por fila y vista cliente.
- Vista cliente con categorías visibles, botón para salir y cards limpias para mostrar productos al cliente.
- Cards de producto mejoradas: imagen más grande, sin descripción en la tarjeta, detalle completo en modal al tocar el producto.
- Carrito corregido: botones + y - funcionales, aviso cuando no hay stock suficiente y X separada para no tocarla por error.
- Cotización/factura rediseñada: incluye imagen del producto, mejor jerarquía visual y descarga como imagen/PDF.
- Admin mejorado: editar productos existentes, descripción, foto, precios, stock, orden y promociones por cantidad.
- Subida de imagen: puede seleccionar una foto y subirla a Drive mediante Apps Script.
- Apps Script corregido y actualizado con uploadImage, promociones, orden y mejor manejo de hojas.

ARCHIVOS PRINCIPALES
- index.html
- assets/css/styles.css
- assets/js/app.js
- assets/js/api.js
- assets/js/config.js
- apps-script/Code.gs
- assets/img/logo.png

IMPORTANTE
- En GitHub Pages suba: index.html, assets/ y sheets-csv/ si lo necesita.
- En Apps Script pegue el contenido de apps-script/Code.gs y despliegue como Web App.
- En assets/js/config.js coloque su URL de Web App en API_URL.
- Por seguridad, no se dejó la clave admin fija en el frontend público. La página la pedirá una vez y la guarda en el navegador.
