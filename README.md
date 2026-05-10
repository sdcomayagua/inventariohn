SDC POS PRO V5 - GitHub Pages + Apps Script + Google Sheets

CAMBIOS VISUALES Y FUNCIONALES V5
- Departamento y municipio ahora son selectores: incluye los 18 departamentos y los 298 municipios de Honduras.
- Recibo/cotización más compacto: datos superiores en dos columnas donde conviene, menos espacios vacíos y mejor ajuste para imagen/PDF.
- La descarga de imagen/PDF usa una versión especial de exportación, más ancha y limpia, para que no salga como tarjeta muy larga de celular.
- La factura mantiene imagen del producto, código, cantidad, precio promedio, subtotal, envío, comisión y total.
- Tarjetas del catálogo reforzadas: en 1 por fila la imagen queda más grande y la información más ordenada.
- Vista cliente mantiene categorías visibles, botón para salir y cards limpias para enseñar al cliente sin mostrar edición.
- Carrito mejorado: + y - respetan stock, y el botón Quitar está separado para no tocarlo por error.
- Menú hamburguesa sigue cerrándose al seleccionar una sección, tocar fuera o presionar Escape.
- Admin conserva edición de producto, subida de imagen a Drive, descripción, precios, stock y promociones por cantidad.

ARCHIVOS PRINCIPALES MODIFICADOS
- index.html
- assets/css/styles.css
- assets/js/app.js
- assets/js/config.js
- assets/js/export.js

ARCHIVOS QUE DEBE SUBIR A GITHUB PAGES
- index.html
- carpeta assets completa
- carpeta sheets-csv si la usa como respaldo de plantilla

APPS SCRIPT
- Si ya pegó el Code.gs de la V4 y le funciona, no es obligatorio cambiarlo para estos ajustes visuales.
- Se incluye apps-script/Code.gs por si desea reinstalar el paquete completo.

IMPORTANTE
- En assets/js/config.js coloque su URL de Web App en API_URL.
- Por seguridad, la clave admin no queda fija en el frontend público; la página la pedirá una vez y la guarda en ese navegador.
