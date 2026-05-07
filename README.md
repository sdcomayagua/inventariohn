# SD Comayagua · Sistema de ventas · Versión 1

Paquete limpio para subir a GitHub Pages o a un hosting estático.

## Archivos principales

- `index.html`: entrada principal de la página.
- `js/config.js`: datos generales del negocio, WhatsApp, clave de acceso, comisión y moneda.
- `js/data.js`: departamentos, municipios, productos de ejemplo y placeholders.
- `js/storage.js`: guardado local, respaldos e importación/exportación.
- `js/app.js`: lógica principal del sistema.
- `js/v1-init.js`: ayudas de estabilidad para la versión 1.
- `css/styles.css`: estilos base del sistema.
- `css/v1-polish.css`: mejoras finales móviles y estructura visual de la versión 1.
- `assets/`: logo, categorías y placeholders.

## Cómo subir

1. Sube todo el contenido de esta carpeta al repositorio.
2. En GitHub Pages, usa la rama `main` y la carpeta raíz.
3. Abre la página y entra al panel con la clave configurada en `js/config.js`.
4. Antes de usar en ventas reales, entra a `Respaldo` y descarga una copia completa.

## Recomendación importante

Cambia la clave de acceso en `js/config.js` antes de publicar el enlace, especialmente si el repositorio es público.

## Limpieza realizada

Se eliminaron los archivos `.txt` de cambios anteriores para evitar confusión. Esta carpeta queda tratada como base limpia de trabajo, sin historial viejo de versiones.

Si el navegador tenía datos guardados de una versión anterior, el sistema intenta migrarlos automáticamente a la clave de almacenamiento de la Versión 1.
