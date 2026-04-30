(function(){
  const THEME_KEY = 'invThemeMode';

  function normalizeTheme(value){
    return value === 'dark' ? 'dark' : 'light';
  }

  function currentTheme(){
    return normalizeTheme(localStorage.getItem(THEME_KEY));
  }

  function paintTheme(){
    const mode = currentTheme();
    const dark = mode === 'dark';
    document.body.classList.add('v36-clean');
    document.body.classList.toggle('theme-dark', dark);
    document.body.classList.toggle('theme-light', !dark);
    document.body.dataset.themeMode = mode;
    document.body.dataset.themeResolved = mode;
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#09111f' : '#f4f8ff');
    const label = dark ? '🌙' : '☀️';
    const title = dark ? 'Modo noche activo' : 'Modo día activo';
    document.querySelectorAll('#theme-toggle').forEach((btn) => {
      btn.textContent = label;
      btn.title = title + '. Toca para cambiar.';
      btn.setAttribute('aria-label', title + '. Toca para cambiar.');
    });
  }

  window.getThemeMode = function(){
    return currentTheme();
  };

  window.updateThemeControls = function(){
    paintTheme();
  };

  window.applySavedTheme = function(){
    localStorage.setItem(THEME_KEY, currentTheme());
    paintTheme();
  };

  window.toggleTheme = function(){
    const next = currentTheme() === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    paintTheme();
    if (typeof window.showToast === 'function') {
      window.showToast(next === 'dark' ? 'Modo noche activado.' : 'Modo día activado.');
    }
  };

  function polishSaleModal(){
    const pill = document.getElementById('sale-cart-pill');
    if (pill) pill.classList.add('sale-cart-pill');
  }

  function init(){
    document.body.classList.add('v36-clean');
    if (!localStorage.getItem(THEME_KEY) || localStorage.getItem(THEME_KEY) === 'auto') {
      localStorage.setItem(THEME_KEY, 'light');
    }
    paintTheme();
    polishSaleModal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once:true });
  } else {
    init();
  }
  window.addEventListener('load', init, { once:true });
})();
