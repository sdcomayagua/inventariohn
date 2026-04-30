/* SDCOMAYAGUA · V35 Premium Compacto
   Ajustes visuales y de interacción sin tocar la lógica principal. */
(function(){
  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function(){
    document.body.classList.add('v35-premium-compacto');

    // Nombre de sesión más limpio.
    var welcome = document.getElementById('inv-welcome');
    if(welcome && !/SDC Admin/i.test(welcome.textContent || '')){
      welcome.textContent = 'Sesión: SDC Admin';
    }

    // Evita que el botón flotante estorbe en móvil. Solo aparece al hacer scroll largo en escritorio.
    var topBtn = document.getElementById('floating-top-btn');
    function syncTopButton(){
      if(!topBtn) return;
      var mobile = window.innerWidth <= 720;
      topBtn.style.opacity = (!mobile && window.scrollY > 520) ? '.92' : '0';
      topBtn.style.pointerEvents = (!mobile && window.scrollY > 520) ? 'auto' : 'none';
    }
    window.addEventListener('scroll', syncTopButton, {passive:true});
    window.addEventListener('resize', syncTopButton);
    syncTopButton();

    // Bottom dock: estado activo visual según sección.
    var dockButtons = Array.from(document.querySelectorAll('.bottom-dock button, .mobile-company-dock button'));
    dockButtons.forEach(function(btn){
      btn.addEventListener('click', function(){
        dockButtons.forEach(function(b){ b.classList.remove('dock-selected'); });
        btn.classList.add('dock-selected');
      });
    });
    if(dockButtons[1]) dockButtons[1].classList.add('dock-selected');

    // En pantallas pequeñas, el hero no debe dejar huecos raros por alturas heredadas.
    var hero = document.querySelector('.hero-banner, .hero-premium');
    var quick = document.querySelector('.top-quickbar, .mobile-top-actions');
    function compactSections(){
      if(hero){ hero.style.minHeight = '0px'; hero.style.marginBottom = '0px'; }
      if(quick){ quick.style.marginTop = '0px'; }
    }
    compactSections();
    setTimeout(compactSections, 300);
    setTimeout(compactSections, 1000);
  });
})();
