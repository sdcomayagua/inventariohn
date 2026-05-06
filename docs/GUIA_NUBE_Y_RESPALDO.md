# SD COMAYAGUA V28 · GitHub Pages + Google Sheets + Apps Script

Esta versión mejora la página sin cambiar la fuente principal que te gustó. La mejora más importante es que ya trae una capa de sincronización para que puedas usar el sistema en celular y computadora.

## 1. Qué se mejoró

- Modo **Pro Gamer** más premium, oscuro, con mejor profundidad visual y detalles neón sin arruinar la estructura.
- Botón **Nube** para conectar con Google Sheets + Apps Script.
- Botón **Sync**: si la nube está configurada, sincroniza con Sheets; si no está configurada, solo recarga datos locales.
- Botón **Respaldo** mejorado: permite respaldar todo en Google Sheets, sincronizar, descargar JSON, restaurar JSON y exportar CSV.
- Respaldo completo de: productos, ventas, cotizaciones, clientes, gastos, cierres, configuración, catálogos y chats/notas si luego se agregan al sistema.
- Guardado automático en nube cuando `syncAuto` está activo.
- Estado visual de nube en la pantalla principal.

## 2. Crear el Google Sheet

1. Entra a Google Drive.
2. Crea un archivo nuevo de Google Sheets.
3. Ponle nombre, por ejemplo: `SD COMAYAGUA - BASE DE DATOS`.
4. Dentro del Sheet ve a **Extensiones > Apps Script**.
5. Borra el código que aparece y pega todo el contenido del archivo:

`apps-script/Code.gs`

6. Cambia el PIN si quieres:

```js
const ADMIN_PIN = '199311';
```

7. Guarda el proyecto.
8. Ejecuta la función `setup()` una vez. Google pedirá permisos; acepta con tu cuenta.

## 3. Publicar Apps Script como Web App

1. En Apps Script, toca **Implementar > Nueva implementación**.
2. Tipo: **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Quién tiene acceso: **Cualquier usuario con el enlace**.
5. Implementar.
6. Copia la URL que termina en `/exec`.

## 4. Conectar la página

1. Sube esta carpeta a GitHub Pages como siempre.
2. Entra a tu página.
3. Inicia sesión.
4. Toca el botón **☁** o **Nube**.
5. Pega la URL `/exec` de Apps Script.
6. Escribe el PIN que dejaste en `Code.gs`.
7. Deja activado **Guardar automáticamente**.
8. Toca **Guardar y probar conexión**.

Si conecta bien, la página mostrará estado de nube. Desde ese momento, lo que registres en celular se guardará en Google Sheets y podrás verlo en computadora al sincronizar.

## 5. Cómo usarlo en el día a día

- Cuando agregues productos, ventas, cotizaciones o clientes, se guarda local y también intenta guardar en nube.
- En otro dispositivo, entra a la misma página y toca **Sync**.
- Antes de hacer cambios grandes, entra a **Respaldo > Respaldar TODO en Google Sheets**.
- Si quieres una copia descargable, entra a **Respaldo > Descargar respaldo completo JSON**.

## 6. Sobre privacidad

La clave de entrada de la página ayuda a bloquear la vista, pero si publicas la página en GitHub Pages público, el sitio puede estar accesible por internet. Para datos privados reales, lo sensible debe quedarse en Google Sheets/App Script y no se debe publicar información privada dentro del código.

## 7. Archivo importante

- Frontend: `index.html`, `css/styles.css`, `js/app.js`, `js/storage.js`, `js/cloud.js`, `js/data.js`.
- Backend para Google Sheets: `apps-script/Code.gs`.

