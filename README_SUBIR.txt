SD COMAYAGUA

SUBIR A GITHUB PAGES:
1. Borra o reemplaza los archivos viejos de la página.
2. Sube TODO lo que viene dentro de este ZIP:
   - index.html
   - carpeta css
   - carpeta js
   - carpeta assets
3. No cambies el nombre index.html.
4. Antes de reemplazar la página, entra a Backup y descarga tu backup JSON.
5. Después de subir la versión nueva, si no ves tus productos anteriores, entra a Backup > Importar backup JSON.

MEJORAS APLICADAS:
- Se quitó el nombre de versión/modular del README y del título visible del navegador.
- Se agregó botón Sync en la barra superior para recargar los datos guardados en el dispositivo.
- Se corrigieron los cuadros principales para que el texto no salga sobrepuesto.
- Los botones de cotización, producto y editor ya no quedan pegados encima del contenido; ahora quedan al final.
- El botón Ver muestra una ficha limpia para cliente: imagen, precio, stock, descripción, categorías y promociones, sin costo ni ganancia.
- Desde Ver puedes descargar imagen del producto, compartir foto o enviar texto por WhatsApp.
- El editor de producto ahora permite Añadir imagen 1, imagen 2, imagen 3, etc.
- Las promociones por cantidad ahora se agregan con filas separadas: cantidad + precio total.
- Envío Normal queda como Lps.110 sin comisión.
- Pagar al Recibir queda como Lps.100 + comisión configurada.
- Se agregó validación para no enviar WhatsApp si la cotización queda en cero.
- Se limpió el problema de categorías que podían aparecer como [object Object].

NOTA SOBRE SINCRONIZACIÓN:
Esta página usa almacenamiento local del navegador. El botón Sync recarga lo guardado en ese mismo dispositivo. Para sincronizar entre teléfono, tablet y otro celular de forma automática, se necesita conectar la página a una base compartida, por ejemplo Google Sheets, Apps Script, Firebase o Supabase.

CAMBIOS V2 COTIZAR MOBILE:
- Cotizar ya no se extiende horizontalmente en celular.
- Modal de cotización se acomoda en una sola columna en móvil.
- El recibo/cotización se adapta al ancho del teléfono.
- Botones inferiores rediseñados con estilo glass premium, más compactos y acordes a la página.
