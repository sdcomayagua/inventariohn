# SD COMAYAGUA POS PRO V3

Versión mejorada para GitHub Pages + Google Apps Script + Google Sheets.

## Cambios incluidos en V3

- Diseño más limpio y más parecido al mockup premium.
- Se eliminó la leyenda de “Privado y sincronizado / GitHub Pages + Apps Script + Google Sheets”.
- Botón **Vista cliente** agregado arriba, junto a **1 por fila** y **2 por fila**.
- Filtro de **categorías** con selector y chips rápidos.
- El botón de producto ahora dice **🛒 Añadir al carrito**.
- Puede seguir agregando varios productos sin que la página lo mande automáticamente a cotización.
- Barra flotante de carrito con total y botón para abrir cotización.
- Cotización editable con PDF, imagen y WhatsApp.
- Editor de productos desde la página: foto, descripción, precio, costo, stock, categoría y promociones.
- Promociones por cantidad: ejemplo `2=50 | 3=69 | 10=200`.
- Apps Script conectado a la hoja `productos_pos` de la plantilla enviada.
- Incluye CSV `sheets-csv/productos_pos.csv` con los productos de su plantilla.

## Instalación rápida

1. Suba todo el contenido de este proyecto a su repositorio de GitHub Pages.
2. En Google Apps Script, pegue el archivo `apps-script/Code.gs`.
3. Ejecute la función `setupInicial()` una vez.
4. Despliegue como Web App:
   - Ejecutar como: **usted**
   - Acceso: **cualquiera con el enlace**
5. Si Google le da una URL `/exec` nueva, péguela en `assets/js/config.js` en `API_URL`.
6. Abra la página. Para guardar, editar o vender, la página pedirá la clave admin una vez y la guardará solo en ese navegador.

## Hojas usadas

- `productos_pos`
- `cotizaciones_pos`
- `ventas_pos`
- `clientes_envios`
- `ajustes_pos`
- `logs_pos`

## Logo

El logo oficial queda como:

```txt
assets/img/logo.png
```

Para cambiarlo, solo reemplace ese archivo por otro con el mismo nombre.

## Promociones

En cada producto puede agregar promociones por cantidad desde el formulario. Ejemplo:

```txt
1=25 | 2=50 | 3=69 | 4=92 | 10=200
```

El sistema interpreta esos precios como **total del paquete por cantidad**.
