SDC MOBILE PRO - CAMBIOS LISTOS PARA GITHUB PAGES

Archivos modificados/agregados:

1) index.html
   - Se agregó manifest.webmanifest para que el sitio se sienta más como app en celular.
   - Se conectó la nueva hoja de estilos: css/sdc-mobile-pro.css
   - Se conectó el nuevo script: js/sdc-mobile-pro.js

2) css/sdc-mobile-pro.css
   - Capa visual profesional encima de tu CSS actual.
   - No borra tu diseño base, solo lo mejora.
   - Mejora celular: topbar más compacta, búsqueda sticky, categorías horizontales, tarjetas más limpias, modales más cómodos, botones más táctiles y navegación inferior premium.

3) js/sdc-mobile-pro.js
   - Agrega una barra rápida móvil con: Cotizar, Rápida, Producto y Caja.
   - No cambia tu lógica de ventas; usa los botones reales que ya existen en tu app.
   - Mejora comportamiento en celular y centra la categoría activa.

4) manifest.webmanifest
   - Permite que la página se pueda instalar/abrir como app web en el celular cuando el navegador lo permita.

INSTRUCCIONES RÁPIDAS PARA SUBIR:

Opción recomendada:
1. Abre tu repositorio en GitHub.
2. Sube/reemplaza index.html.
3. Sube la carpeta css con el archivo nuevo sdc-mobile-pro.css dentro.
4. Sube la carpeta js con el archivo nuevo sdc-mobile-pro.js dentro.
5. Sube manifest.webmanifest en la raíz, al mismo nivel de index.html.
6. En GitHub Pages, espera unos segundos y recarga la página con limpiar caché.

Si solo quieres aplicar el parche:
- Usa el archivo ZIP llamado sdc-parche-mobile-pro.zip.
- Ahí van únicamente los archivos necesarios.

Si quieres subir todo el proyecto completo ya modificado:
- Usa sdc-inventario-pro-mobile.zip.

Nota importante:
No se tocó tu localStorage ni la clave del panel. Tus productos guardados en el navegador deberían seguir igual porque la llave de almacenamiento en js/storage.js no fue cambiada.
