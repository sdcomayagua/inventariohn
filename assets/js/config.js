export const CONFIG = {
  STORE_NAME: 'Soluciones Digitales Comayagua',
  STORE_SHORT: 'SD COMAYAGUA',
  WHATSAPP_NUMBER: '50431517755',
  LOGO_PATH: 'assets/img/logo.png',
  PLACEHOLDER_IMAGE: 'assets/img/product-placeholder.svg',

  // Pegue aquí la URL /exec de su Apps Script cuando lo despliegue.
  // Ejemplo: https://script.google.com/macros/s/AKfycbx.../exec
  API_URL: 'PEGA_AQUI_TU_URL_DE_APPS_SCRIPT_EXEC',

  // Si activa seguridad en Apps Script, use la misma clave aquí.
  // Para uso privado, no publique esta página con una clave sensible.
  ADMIN_KEY: '',

  SHIPPING: {
    localDefault: 100,
    normal: 110,
    codBase: 100,
    codPercent: 0.06,
    companies: ['C807', 'Forza', 'Cargo Expreso', 'Entrega local']
  },

  BUSINESS_COPY: {
    quoteDisclaimer: 'Cotizar no aparta producto. El stock se descuenta hasta convertir la cotización en venta.',
    customerFooter: 'Precios sujetos a disponibilidad.'
  }
};
