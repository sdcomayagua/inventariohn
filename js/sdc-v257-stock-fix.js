document.documentElement.dataset.sdcV257='stable-no-freeze';
/*
  Modo estable temporal.
  Se desactivan los parches v297-v300 porque varios observadores y timers
  estaban corriendo al mismo tiempo y podían congelar la página en celular.
*/
(function(){
  console.info('SDC: modo estable activo. Parches pesados desactivados para evitar freeze.');
})();
