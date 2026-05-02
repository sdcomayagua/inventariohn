(function(){
  "use strict";

  function ensureShopMode(){
    document.body.classList.add("v37-shop");
  }

  function polishButtons(){
    document.querySelectorAll(".product-action-btn.primary").forEach((btn)=>{
      const txt = (btn.textContent || "").trim().toLowerCase();
      if (txt === "vender" || txt.includes("vender")) {
        btn.textContent = "Agregar a venta";
        btn.setAttribute("title","Agregar este producto a la venta");
      }
    });
  }

  function addFloatingIcons(){
    document.querySelectorAll(".product-card").forEach((card)=>{
      if (card.querySelector(".store-floating-icons")) return;
      const icons = document.createElement("div");
      icons.className = "store-floating-icons";
      icons.innerHTML = "<span>📷</span><span>🧾</span>";
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
    ensureShopMode();
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
  window.addEventListener("load", init, {once:true});
  setTimeout(init, 500);
})();
