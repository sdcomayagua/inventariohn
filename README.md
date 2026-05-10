# SD COMAYAGUA POS PRO V2

Sistema privado para GitHub Pages + Google Apps Script + Google Sheets.

## Qué incluye esta versión

- Diseño premium con logo oficial `assets/img/logo.png`.
- Dashboard con inventario, capital invertido, valor de venta y ganancia proyectada.
- Catálogo móvil con opción de 1 producto por fila o 2 productos por fila.
- Cotización editable tipo factura.
- Descargar cotización como PDF.
- Descargar cotización como imagen para WhatsApp.
- Enviar resumen por WhatsApp.
- Convertir cotización en venta.
- Al convertir en venta, se descuenta stock.
- Al cancelar venta desde Apps Script/backend, se devuelve stock.
- Modo demo local si todavía no conecta Apps Script.

## Estructura de archivos

```txt
index.html
assets/
  css/styles.css
  img/logo.png
  img/logo-small.png
  img/product-placeholder.svg
  js/config.js
  js/helpers.js
  js/api.js
  js/export.js
  js/app.js
apps-script/
  Code.gs
```

## Instalación en Google Sheets + Apps Script

### 1. Crear Google Sheet

Cree un Google Sheets nuevo con el nombre que quiera, por ejemplo:

`SDC POS PRO V2`

### 2. Abrir Apps Script

En el Google Sheets:

`Extensiones > Apps Script`

Borre cualquier código y pegue todo el contenido de:

`apps-script/Code.gs`

### 3. Ejecutar setup inicial

En Apps Script, seleccione la función:

`setupInicial`

Luego pulse **Ejecutar** y autorice permisos.

Esto crea automáticamente estas hojas:

- productos
- cotizaciones
- ventas
- clientes
- ajustes

### 4. Desplegar como Web App

En Apps Script:

`Implementar > Nueva implementación > Aplicación web`

Configuración recomendada:

- Ejecutar como: **Yo**
- Quién tiene acceso: **Cualquier usuario con el enlace**

Copie la URL que termina en `/exec`.

### 5. Pegar URL en la página

Abra:

`assets/js/config.js`

Cambie esta línea:

```js
API_URL: 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT_EXEC',
```

Por su URL real de Apps Script:

```js
API_URL: 'https://script.google.com/macros/s/AKfycbx.../exec',
```

### 6. Subir a GitHub Pages

Suba estos archivos a su repositorio:

- `index.html`
- carpeta `assets/`

Active GitHub Pages desde:

`Settings > Pages > Deploy from branch`

## Cómo cambiar el logo

Reemplace este archivo:

`assets/img/logo.png`

por otro con el mismo nombre. La página lo tomará automáticamente.

## Reglas de envío incluidas

### Envío local

Costo editable. Por defecto: `Lps.100`.

### Envío normal

`Lps.110`

### Pagar al recibir

Fórmula:

`Subtotal productos + Lps.100 + 6% de comisión`

La comisión se calcula sobre:

`subtotal productos + Lps.100`

## Columnas de productos

La hoja `productos` usa estas columnas:

```txt
id, codigo, nombre, categoria, marca, descripcion, costo, precio, stock, activo, imagen, promos_json, orden, created_at, updated_at
```

Ejemplo de promociones por cantidad en `promos_json`:

```json
[{"qty":3,"price":180},{"qty":5,"price":160}]
```

Esto significa:

- desde 3 unidades: Lps.180 c/u
- desde 5 unidades: Lps.160 c/u

## Notas importantes

- Cotizar no aparta producto.
- El stock se descuenta hasta convertir la cotización en venta.
- Si el Apps Script todavía no está conectado, la página funciona en modo demo local.
- Para que el PDF/imagen salga bonito, use la sección de cotización y descargue desde los botones inferiores.
