SD COMAYAGUA · V91 MODULAR CORREGIDA

CÓMO SUBIR:
1. Abre tu repositorio de GitHub Pages.
2. Borra o reemplaza estos elementos del sitio anterior:
   - index.html
   - carpeta css
   - carpeta js
   - carpeta assets
3. Sube TODO el contenido de esta carpeta V91.
4. En el celular abre la página y, si miras algo viejo, borra caché o agrega ?v=91 al final de la URL.

QUÉ SE CORRIGIÓ:
- Botones de Cotización: Imagen, WhatsApp texto, WhatsApp foto, Guardar y Pasar a venta ya no quedan flotando encima. Ahora quedan al final del modal.
- Inventario: tarjetas con imagen cuadrada 1:1, sin salirse del cuadro ni tapar precio/stock/costo.
- Texto sobrepuesto: corregidos botones iniciales Catálogo, Vender, Producto, Ganancias, Recibos y Backup.
- Categorías múltiples: puedes escribirlas separadas por coma, punto y coma o barra vertical. Ejemplo: Dedales, Gamer Móvil, Gatillos.
- [object Object]: se limpiaron categorías, promociones y backups antiguos para que no vuelvan a salir como [object Object].
- Cotización en cero: se reconstruyó el cálculo para que productos, envío, comisión y total se calculen correctamente.
- Envíos:
  * Envío normal: Lps. 110 automático.
  * Pagar al recibir: Lps. 100 + comisión del 6% sobre productos + envío.
  * Domicilio local: activa campo manual para escribir el envío.
- Recibo: ahora muestra Productos, Envío, Comisión por pagar al recibir, Total envío, Descuento y Total.
- Imágenes vacías: ya no usa el logo como foto de producto; usa diseños de “imagen no disponible” según categoría.
- Impresión/PDF: preparado para hoja carta horizontal, intentando mantener el recibo en una sola página.

ARCHIVOS MODIFICADOS:
- index.html
- css/styles.css
- js/storage.js
- js/app.js
- js/data.js
- assets/logo_sdc_comayagua_clean_512.png
- assets/placeholder-default.svg
- assets/placeholder-gamer.svg
- assets/placeholder-dedales.svg
- assets/placeholder-tecnologia.svg
- assets/placeholder-celulares.svg
- assets/placeholder-hogar.svg

NOTA:
Si ya tienes productos guardados en el celular, la V91 intenta leer backups de versiones anteriores y limpiarlos automáticamente.
