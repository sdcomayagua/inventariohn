# SD COMAYAGUA - instalación limpia desde cero

Esta base se hizo limpia para evitar que GitHub Pages se quede pegado con archivos viejos o con caché anterior. No trae service worker ni PWA para evitar que la página cargue versiones antiguas.

## 1. Qué subir a GitHub

Subí todo el contenido de esta carpeta al repositorio:

- index.html
- cliente.html
- assets/
- css/
- js/
- apps-script/
- docs/
- .nojekyll

No subás ZIP dentro del repositorio. Primero descomprimí y luego subí las carpetas.

## 2. Google Sheets + Apps Script

1. Creá un Google Sheet nuevo o usá el que ya querés para SD COMAYAGUA.
2. Entrá a Extensiones > Apps Script.
3. Pegá todo el contenido de apps-script/Code.gs.
4. En el código, buscá:
   ADMIN_PIN_FALLBACK = 'CAMBIA_ESTE_PIN'
5. Cambiá CAMBIA_ESTE_PIN por un PIN privado que solo vos conozcás.
6. Ejecutá setup().
7. Aceptá permisos.
8. Implementá como Aplicación web.
9. Acceso: Cualquier usuario con el enlace.
10. Copiá la URL que termina en /exec.

## 3. Conectar la página

1. Abrí tu página en GitHub Pages.
2. Tocá el botón ⚙.
3. La URL de Apps Script ya va precargada.
4. Escribí el PIN.
5. Tocá Guardar y probar conexión.
6. Si dice Nube activa, ya podés guardar y cargar datos desde cualquier dispositivo.

## 4. Para no perder información

Antes de reemplazar archivos viejos, descargá una copia del repositorio actual o hacé un respaldo JSON desde la página anterior si todavía abre.

Esta nueva página no borra Google Sheets. El botón Limpiar caché local solo borra datos del navegador actual, no borra la nube.

## 5. Vista cliente

cliente.html es una vista limpia para enseñar productos. No muestra PIN, nube ni herramientas privadas.

## 6. Si la página no abre

- Confirmá que index.html esté en la raíz del repositorio.
- Confirmá que GitHub Pages publique desde la rama correcta.
- Abrí en modo incógnito.
- No subás la carpeta completa como una subcarpeta si GitHub espera index.html en la raíz.
- Si antes había service worker, borrá datos del sitio desde el navegador.

## Enlace actual de Apps Script

La página ya trae precargado este enlace en `js/config.js`:

https://script.google.com/macros/s/AKfycbzJB4A9WhU96M_luuUY_xYEDAnNCuU6dkHRCluszxbjaiPQyiDnF4VZqM6MhghiKsV0/exec

Si en el futuro publicas una nueva implementación de Apps Script, solo cambia ese enlace en `js/config.js`, dentro de `defaultAppsScriptUrl`.
