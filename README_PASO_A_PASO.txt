SD COMAYAGUA · POS PRIVADO + DASHBOARD FINANCIERO
Versión: sdc_pos_dashboard_v1

CONTENIDO DEL PAQUETE
1. index.html
2. css/app.css
3. js/config.js
4. js/demo-data.js
5. js/api.js
6. js/app.js
7. assets/logo-sdc-2026.png
8. assets/no-image.svg
9. apps-script/Code.gs
10. plantilla_sd_comayagua_pos_dashboard_v1.xlsx

QUÉ INCLUYE ESTA VERSIÓN
- Dashboard financiero.
- Métricas: total productos, stock total, valor venta, invertido, ganancia proyectada, ganancia real, agotados y bajo stock.
- Productos con buscador, filtros por categoría y estado.
- POS / cotización con carrito.
- Formulario de cliente.
- Cálculo de envío normal.
- Cálculo de Pagar al Recibir: subtotal + envío base + comisión redondeada.
- Generación de mensaje para WhatsApp.
- Guardado básico en localStorage de cotizaciones/facturas.
- Edición de factura/cotización guardada.
- Clientes / Envíos generados desde los registros.
- Configuración desde la misma app.
- Switch Modo Gamer / Modo Pro.
- Datos de prueba si todavía no conecta con Sheets.
- Apps Script compatible con la plantilla incluida.

PASOS PARA GOOGLE SHEETS
1. Suba el archivo plantilla_sd_comayagua_pos_dashboard_v1.xlsx a Google Drive.
2. Abra el archivo con Google Sheets.
3. Revise que existan estas hojas:
   - productos_pos
   - facturas_pos
   - ajustes_pos
   - clientes_envios
   - logs_pos
   - listas
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
5. Guarde.
6. Ejecute la función setup una vez.
7. Acepte permisos.
8. Vaya a Implementar > Nueva implementación.
9. Tipo: Aplicación web.
10. Ejecutar como: Yo.
11. Quién tiene acceso: Cualquier persona con el enlace.
12. Implemente y copie la URL que termina en /exec.

PASOS PARA GITHUB PAGES
1. Suba a su repositorio estos archivos y carpetas:
   - index.html
   - css/
   - js/
   - assets/
2. Puede subir también apps-script/ y la plantilla como respaldo, pero GitHub Pages solo necesita index.html, css, js y assets.
3. En GitHub, vaya a Settings > Pages.
4. Source: Deploy from a branch.
5. Branch: main / root.
6. Abra la URL de GitHub Pages.

CONECTAR LA APP CON APPS SCRIPT
1. Abra la app en GitHub Pages.
2. Entre a Configuración.
3. Pegue la URL /exec de Apps Script en “URL Apps Script /exec”.
4. Verifique que API Key sea: SDC_POS_2026
5. Presione Guardar configuración.
6. Presione Probar y sincronizar.

REGLA DE ENVÍO USADA
- Envío Normal: Lps. 110 fijo.
- Pagar al Recibir: subtotal de productos + Lps. 100 de envío base.
- Comisión: 6% sobre subtotal + envío base, redondeado a Lempiras enteros.
- Total final: productos + envío + comisión - descuento.

IMPORTANTE
- La app funciona localmente aunque no conecte con Sheets, usando datos de prueba y localStorage.
- Para sincronizar productos reales, debe pegar la URL /exec correcta en Configuración.
- No guarde contraseñas ni cuentas bancarias completas dentro de la plantilla.
- Use “Lps.” como moneda visible, no HNL.
