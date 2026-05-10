SD COMAYAGUA · POS PRIVADO + DASHBOARD FINANCIERO
Versión: sdc_pos_dashboard_v4_profesional

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
11. plantilla_sd_comayagua_pos_dashboard_v4.xlsx

QUÉ SE CORRIGIÓ EN ESTA VERSIÓN
- Tarjeta de producto rediseñada tipo comprador/pro: imagen cuadrada 1:1 arriba y datos abajo.
- La foto del producto ahora se ve más limpia, con fondo blanco, proporción cuadrada y sin deformarse.
- El cliente no verá datos internos; esta vista sigue siendo panel privado.
- Datos internos visibles en producto: código, stock, nombre, categoría, versión/marca, precio, costo y ganancia.
- Botones reorganizados: Agregar a carrito, POS y Editar.
- Cotización y Venta quedan separadas.
- Guardar venta descuenta stock.
- Las cotizaciones guardadas tienen botón “Pasar a venta”. Al convertir, descuenta stock.
- Si edita una venta, el stock se ajusta por diferencia:
  - Si aumenta productos, descuenta solo lo adicional.
  - Si baja cantidades, devuelve stock localmente.
- Si borra una venta local, devuelve el stock localmente.
- Validación de stock: no permite vender más de lo disponible.
- Apps Script actualizado para reconocer status “Venta” y “Factura” como ventas reales con stock.
- Dashboard de Sheets actualizado para sumar ventas reales, no cotizaciones.
- La imagen que se sube desde celular se optimiza en 1200x1200 px para verse más profesional.
- Facturas/cotizaciones quedan con mejores columnas y menos sensación de texto amontonado.

PASOS PARA SUBIR A GITHUB PAGES
1. Descomprima el ZIP.
2. En su repositorio de GitHub Pages, reemplace estos archivos y carpetas:
   - index.html
   - css/
   - js/
   - assets/
3. Suba también apps-script/ y la plantilla .xlsx si quiere tener respaldo dentro del repositorio.
4. Abra su URL de GitHub Pages.
5. En el celular, si ve diseño viejo, borre caché o abra en modo incógnito para probar.

PASOS PARA GOOGLE SHEETS
1. Suba plantilla_sd_comayagua_pos_dashboard_v4.xlsx a Google Drive.
2. Ábrala con Google Sheets.
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

PASOS PARA APPS SCRIPT
1. En el Google Sheet, vaya a Extensiones > Apps Script.
2. Borre cualquier código viejo de Code.gs.
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

CONECTAR LA APP CON APPS SCRIPT
1. Abra la app en GitHub Pages.
2. Entre a Configuración.
3. Pegue la URL /exec de Apps Script en “URL Apps Script /exec”.
4. Verifique que API Key sea: SDC_POS_2026.
5. Presione Guardar configuración.
6. Presione Probar y sincronizar.

USO CORRECTO DE COTIZACIÓN Y VENTA
- Guardar cotización: no descuenta stock.
- Guardar venta / descontar stock: sí descuenta stock.
- Pasar a venta: convierte una cotización guardada en venta y descuenta stock.
- Editar / imagen: carga el registro en POS para cambiar productos, cliente, envío o generar imagen.

REGLA DE ENVÍO USADA
- Envío Normal: Lps. 110 fijo.
- Pagar al Recibir: subtotal de productos + Lps. 100 de envío base.
- Comisión: 6% sobre subtotal + envío base, redondeado a Lempiras enteros.
- Total final: productos + envío + comisión - descuento.

IMPORTANTE
- La app funciona localmente aunque no conecte con Sheets, usando localStorage.
- Para datos reales sincronizados, debe usar la URL /exec correcta.
- No guarde contraseñas ni cuentas bancarias completas dentro de la plantilla.
- Use “Lps.” como moneda visible, no HNL.
