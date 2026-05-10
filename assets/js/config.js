export const CONFIG = {
  STORE_NAME: 'Soluciones Digitales Comayagua',
  STORE_SHORT: 'SD COMAYAGUA',
  WHATSAPP_NUMBER: '50431517755',
  LOGO_PATH: 'assets/img/logo.png',
  PLACEHOLDER_IMAGE: 'assets/img/product-placeholder.svg',

  // URL actual del Web App. Si vuelve a desplegar Apps Script, pegue aquí la URL /exec nueva.
  API_URL: 'https://script.google.com/macros/s/AKfycbzZKAqIR_u-rmcdDUodffpLtZb5zFXOXms8MEcbN0zkfvXhEUe_MQE49dyAtDzaTkWY/exec',

  // No se deja visible en GitHub Pages. La página la pedirá una vez y la guardará en su navegador.
  ADMIN_KEY: '',

  SHIPPING: {
    localDefault: 100,
    normal: 110,
    codBase: 100,
    codPercent: 0.06,
    companies: ['Entrega local', 'C807', 'Forza', 'Cargo Expreso']
  },

  BUSINESS_COPY: {
    quoteDisclaimer: 'Cotizar no aparta producto. El stock se descuenta hasta convertir la cotización en venta.',
    customerFooter: 'Precios sujetos a disponibilidad.'
  }
};
