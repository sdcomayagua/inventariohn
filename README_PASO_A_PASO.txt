SDC V20 · AJUSTE VISUAL MÓVIL PRO

Archivos modificados en este paquete:
- index.html
- css/app.css
- js/app.js
- README_PASO_A_PASO.txt

Cambios aplicados:
1. La página ahora aprovecha mejor el ancho del celular.
   - Menos margen lateral.
   - Paneles más pegados al ancho real del teléfono.
   - Menos espacio desperdiciado entre tarjetas.

2. POS móvil más limpio.
   - Se eliminó el texto descriptivo debajo de “POS móvil”.
   - También se quitaron descripciones pequeñas que cargaban mucho la vista en celular.
   - Los títulos principales quedan más claros y directos.

3. Mejor comportamiento responsive.
   - En celular y tablet el POS ya no intenta apretar columnas.
   - La factura previa baja debajo del formulario para evitar que se vea comprimida.
   - Botones, campos y tarjetas se ajustan mejor sin salirse de margen.

4. Mejoras estéticas generales.
   - Bordes más limpios.
   - Sombras más suaves.
   - Menos padding excesivo.
   - Botones y tarjetas más compactos.
   - Barra inferior más ajustada al ancho del celular.

5. Factura previa más limpia dentro del POS.
   - Se quitó el selector visual de diseño de factura porque ya solo se usa Simple PRO.
   - La vista previa queda menos cargada dentro de la pantalla.

Instalación:
Reemplace estos archivos en su proyecto respetando la misma estructura:

/index.html
/css/app.css
/js/app.js

No se modificó Code.gs, la plantilla Excel ni la configuración de Google Sheets.
