SD COMAYAGUA · POS PRIVADO + DASHBOARD FINANCIERO
Versión: sdc_pos_dashboard_v2

CONTENIDO DEL PAQUETE
1. index.html
2. css/app.css
3. js/config.js
4. js/demo-data.js
5. js/api.js
6. js/hn-data.js
7. js/app.js
8. assets/logo-sdc-2026.png
9. assets/no-image.svg
10. apps-script/Code.gs
11. plantilla_sd_comayagua_pos_dashboard_v2.xlsx

MEJORAS DE ESTA VERSIÓN
- Selector de Departamento y Municipio de Honduras: 18 departamentos y 298 municipios.
- Ya no se escribe departamento/municipio manualmente.
- Fotos de productos más claras: contenedor más grande, fondo blanco y object-fit: contain para evitar recortes feos.
- Imagen del producto se puede tocar para verla grande.
- Editor de producto separado: botón “Nuevo producto” / “Editar”. No estorba encima del inventario.
- Subida de imagen desde el celular:
  - Si Apps Script está conectado, sube la imagen a Google Drive y guarda el link.
  - Si no hay Apps Script, la guarda localmente como respaldo.
- Factura con 2 diseños:
  - Pro limpia.
  - Modo gamer.
- Botón para descargar factura como imagen.
- Botón para compartir imagen por WhatsApp usando el menú de compartir del celular cuando el navegador lo permite.
- Mejor acomodo de precios en factura para que no se vea todo junto.
- URL de Apps Script ya puede quedar fija desde js/config.js y también se conserva en Configuración/localStorage.
- Apps Script actualizado con:
  - uploadImage para Drive.
  - hoja municipios_hn.
  - descuento o devolución de stock por diferencia cuando se edita una factura.

PASOS PARA GOOGLE SHEETS
1. Suba el archivo plantilla_sd_comayagua_pos_dashboard_v2.xlsx a Google Drive.
2. Abra el archivo con Google Sheets.
3. Revise que existan estas hojas:
   - productos_pos
   - facturas_pos
   - ajustes_pos
   - clientes_envios
   - logs_pos
   - listas
   - municipios_hn
   - Dashboard_POS
4. Copie el ID del Google Sheet desde la URL.
   Ejemplo:
   https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit

PASOS PARA APPS SCRIPT
1. En el Google Sheet, vaya a Extensiones > Apps Script.
2. Borre cualquier código de Code.gs.
3. Pegue todo el contenido de apps-script/Code.gs.
4. Cambie esta línea:
   const SHEET_ID = 'PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET';
   por el ID real de su hoja.
5. Verifique que esta línea quede igual que en la app:
   const API_KEY = 'SDC_POS_2026';
6. Guarde.
7. Ejecute la función setup una vez.
8. Acepte permisos.
9. Vaya a Implementar > Nueva implementación.
10. Tipo: Aplicación web.
11. Ejecutar como: Yo.
12. Quién tiene acceso: Cualquier persona con el enlace.
13. Implemente y copie la URL que termina en /exec.

PASOS PARA GITHUB PAGES
1. Suba o reemplace en su repositorio estos archivos y carpetas:
   - index.html
   - css/
   - js/
   - assets/
2. Puede subir también apps-script/ y la plantilla como respaldo.
3. GitHub Pages solo necesita index.html, css, js y assets para funcionar.
4. En GitHub, vaya a Settings > Pages.
5. Source: Deploy from a branch.
6. Branch: main / root.
7. Abra la URL de GitHub Pages.

CONECTAR LA APP CON APPS SCRIPT
1. Abra la app en GitHub Pages.
2. Entre a Configuración.
3. Pegue la URL /exec de Apps Script en “URL Apps Script /exec”.
4. Verifique que API Key sea: SDC_POS_2026
5. Presione Guardar configuración.
6. Presione Probar y sincronizar.

NOTA SOBRE LA URL PERMANENTE
- En js/config.js se puede dejar una URL /exec fija para no estar copiando y pegando.
- Si cambia la implementación de Apps Script, cambie esa URL en js/config.js y vuelva a subir el archivo.
- También puede cambiarla desde Configuración dentro de la app.

SUBIR FOTOS DE PRODUCTOS
1. Entre a Productos.
2. Toque “Nuevo producto” o “Editar”.
3. Toque “Subir imagen”.
4. Seleccione la foto desde el celular.
5. Guarde el producto.
6. Si Apps Script está conectado, la imagen queda en Drive y se guarda el enlace en productos_pos.

REGLA DE ENVÍO USADA
- Envío Normal: Lps. 110 fijo.
- Pagar al Recibir: subtotal de productos + Lps. 100 de envío base.
- Comisión: 6% sobre subtotal + envío base, redondeado a Lempiras enteros.
- Total final: productos + envío + comisión - descuento.

IMPORTANTE
- La app funciona localmente aunque no conecte con Sheets, usando datos de prueba y localStorage.
- Para sincronizar productos reales, debe usar la URL /exec correcta.
- No guarde contraseñas ni cuentas bancarias completas dentro de la plantilla.
- Use “Lps.” como moneda visible, no HNL.
