# SD COMAYAGUA - Panel privado para GitHub Pages

Archivos listos para subir a GitHub Pages.

## Importante

Antes de publicar, abre `app-v54-compacto-mobile.js` y cambia:

```js
const ADMIN_PASS = "CAMBIAR_AQUI_MI_CONTRASEÑA";
```

Usuario administrador:

```js
const ADMIN_USER = "sdcomayagua";
```

## Subida

Sube todos los archivos a la raíz del repositorio y activa GitHub Pages en `Settings > Pages > Branch main > /root`.

La app funciona en modo localStorage para que el panel no quede vacío si no hay backend conectado.
