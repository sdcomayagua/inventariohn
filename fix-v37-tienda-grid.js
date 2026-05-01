
(function(){
  "use strict";
  const THEME_KEY = "invThemeMode";

  function forceDayMode(){
    try { localStorage.setItem(THEME_KEY, "light"); } catch(e){}
    document.body.classList.add("v37-shop","theme-light");
    document.body.classList.remove("theme-dark");
    document.body.dataset.themeMode = "light";
    document.body.dataset.themeResolved = "light";
    document.documentElement.style.colorScheme = "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", "#f7f7fb");
    const btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.textContent = "☀️";
      btn.title = "Modo día activo";
      btn.setAttribute("aria-label", "Modo día activo");
    }
  }

  function polishButtons(){
    document.querySelectorAll(".product-action-btn.primary").forEach((btn)=>{
      const txt = (btn.textContent || "").trim().toLowerCase();
      if (txt === "vender" || txt.includes("vender")) {
        btn.textContent = "Agregar al Carrito";
        btn.setAttribute("title","Agregar este producto a la venta");
      }
    });
  }

  function addFloatingIcons(){
    document.querySelectorAll(".product-card").forEach((card)=>{
      if (card.querySelector(".store-floating-icons")) return;
      const icons = document.createElement("div");
      icons.className = "store-floating-icons";
      icons.innerHTML = "<span>🎁</span><span>♡</span>";
      card.appendChild(icons);
    });
  }

  function normalizeCatalogTitle(){
    const title = document.querySelector(".catalog-section .section-title");
    if (title) title.textContent = "Catálogo de productos";
    const count = document.getElementById("results-count");
    if (count) count.textContent = count.textContent.replace("resultado","producto");
  }

  function init(){
    forceDayMode();
    polishButtons();
    addFloatingIcons();
    normalizeCatalogTitle();

    const products = document.getElementById("inv-products");
    if (products && !products.__v37Observer){
      products.__v37Observer = true;
      new MutationObserver(()=>{
        polishButtons();
        addFloatingIcons();
        normalizeCatalogTitle();
      }).observe(products, {childList:true, subtree:true});
    }
  }

  // Dejar el modo día funcionando aunque el JS principal intente aplicar modo oscuro.
  window.updateThemeControls = function(){ forceDayMode(); };
  window.applySavedTheme = function(){ forceDayMode(); };
  window.getThemeMode = function(){ return "light"; };
  window.toggleTheme = function(){
    forceDayMode();
    if (typeof window.showToast === "function") window.showToast("Modo día activo.");
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
  window.addEventListener("load", init, {once:true});
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();
