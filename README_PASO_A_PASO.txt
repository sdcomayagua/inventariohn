SD COMAYAGUA · POS DASHBOARD V7 MOBILE S24 ULTRA
=================================================

Esta versión está trabajada como MOBILE-FIRST para uso en Samsung S24 Ultra y celulares grandes.
Mantiene la estructura completa del proyecto anterior: GitHub Pages + Google Sheets + Apps Script + plantilla Excel.

ARCHIVOS PRINCIPALES
--------------------
index.html
css/app.css
js/config.js
js/demo-data.js
js/api.js
js/hn-data.js
js/app.js
assets/logo-sdc-2026.png
assets/no-image.svg
apps-script/Code.gs
plantilla_sd_comayagua_pos_dashboard_v5.xlsx

QUÉ SE MEJORÓ EN V7
-------------------
1. Pantalla móvil más profesional:
   - Inicio más compacto.
   - Acciones rápidas tipo app.
   - Métricas en carrusel horizontal para no ocupar tanta altura.

2. Inventario optimizado para celular:
   - Tarjetas más limpias.
   - Menos datos estorbando en pantalla pequeña.
   - Botones más coherentes: Vender y Editar.
   - Resumen rápido de productos visibles, disponibles y por revisar.

3. POS más cómodo para Samsung S24 Ultra:
   - Barra de total final fija dentro del POS.
   - Botón rápido de WhatsApp.
   - Paneles más claros: productos, cliente/envío/total, factura.
   - Botones más táctiles y con mejor tamaño.

4. Factura / cotización mejorada:
   - Vista móvil tipo tarjeta para que no se vea apretada.
   - Exportación HD más grande para que no salga pequeña al compartir.
   - Diseño premium claro y azul gamer.
   - Nota final más profesional.

5. Modo Pro y Modo Gamer:
   - Se reforzaron colores para evitar texto oscuro sobre fondos oscuros.
   - Botones, chips, campos y tarjetas tienen mejor contraste.

CÓMO SUBIR A GITHUB PAGES
-------------------------
1. Descomprima este ZIP.
2. Abra la carpeta del proyecto.
3. Suba/reemplace en GitHub estos archivos y carpetas:
   - index.html
   - css/
   - js/
   - assets/
   - apps-script/Code.gs si también quiere actualizar backend
   - plantilla Excel si quiere conservarla como respaldo

4. En GitHub Pages, espere unos minutos.
5. Abra la página en modo incógnito o borre caché del navegador.

IMPORTANTE SOBRE CACHE
----------------------
Esta versión usa sufijo v7-mobile-s24 en index.html para forzar carga nueva de CSS y JS.
Si aún mira diseño viejo, borre caché del navegador o agregue ?v=7 al final de la URL.

CONEXIÓN CON APPS SCRIPT
------------------------
La URL y configuración se mantienen en:
js/config.js

No se eliminaron los campos de Apps Script ni la conexión con Sheets.

RECOMENDACIÓN DE USO
--------------------
Para vender rápido desde celular:
1. Entre a POS.
2. Busque el producto.
3. Agregue al carrito.
4. Complete cliente, municipio y envío.
5. Use Imagen HD o WhatsApp.

Para inventario:
1. Entre a Productos.
2. Use búsqueda o categoría.
3. Toque Vender o Editar.

SD COMAYAGUA · Soluciones Digitales Comayagua
