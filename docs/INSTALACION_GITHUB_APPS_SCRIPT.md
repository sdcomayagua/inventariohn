# Instalación en GitHub Pages + Apps Script

## GitHub Pages

1. Descomprimí el ZIP.
2. Subí todo el contenido al repositorio.
3. En GitHub, entrá a **Settings > Pages**.
4. Publicá desde la rama principal.
5. Abrí la URL de GitHub Pages en el celular y computadora.

## Apps Script

1. Creá o abrí tu Google Sheet.
2. Entrá en **Extensiones > Apps Script**.
3. Pegá el contenido de `apps-script/Code.gs`.
4. Cambiá `ADMIN_PIN` por un PIN privado.
5. Ejecutá `setup()` una vez.
6. Ejecutá `installDailyBackupTrigger()` si querés respaldo diario.
7. Publicá como **Aplicación web**.
8. Copiá la URL que termina en `/exec`.
9. Pegala en el panel **Nube** de la página.

## Hojas que crea

- estado
- backups
- backups_data
- productos
- ventas
- cotizaciones
- clientes
- gastos
- cierres
- catalogos
- chats
- ajustes
- envios
- cupones
- historial
- errores
