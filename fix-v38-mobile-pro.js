(function(){
  "use strict";
  const THEME_KEY = "invThemeMode";

  function toast(msg){
    if (typeof window.showToast === "function") window.showToast(msg);
  }

  function getThemeMode(){
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch(e){ return "light"; }
  }

  function setTheme(mode){
    const resolved = mode === "auto"
      ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : mode;
    document.body.classList.toggle("theme-dark", resolved === "dark");
    document.body.classList.toggle("theme-light", resolved !== "dark");
    document.body.dataset.themeMode = mode;
    document.body.dataset.themeResolved = resolved;
    document.documentElement.style.colorScheme = resolved === "dark" ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolved === "dark" ? "#07111f" : "#f4f6fb");
    document.querySelectorAll("#theme-toggle").forEach((btn)=>{
      btn.textContent = resolved === "dark" ? "☀️" : "🌙";
      btn.title = resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
      btn.setAttribute("aria-label", btn.title);
    });
  }

  function applyTheme(){ setTheme(getThemeMode()); }

  window.getThemeMode = getThemeMode;
  window.applySavedTheme = applyTheme;
  window.updateThemeControls = applyTheme;
  window.toggleTheme = function(){
    const next = document.body.classList.contains("theme-dark") ? "light" : "dark";
    try { localStorage.setItem(THEME_KEY, next); } catch(e){}
    setTheme(next);
    toast(next === "dark" ? "Modo oscuro activado." : "Modo claro activado.");
  };

  function enhanceShell(){
    document.body.classList.add("v38-mobile-pro");
    const welcome = document.getElementById("inv-welcome");
    if (welcome && /sesión/i.test(welcome.textContent || "")) welcome.textContent = "Caja privada · venta y factura";
    const search = document.getElementById("inv-search");
    if (search) search.placeholder = "Buscar por producto, categoría o código";
    const title = document.querySelector(".catalog-section .section-title");
    if (title) title.textContent = "Catálogo rápido";
    const saleTitle = document.querySelector("#ventas .section-title");
    if (saleTitle) saleTitle.textContent = "Ventas recientes";
    const receiptTitle = document.querySelector("#comprobantes .section-title");
    if (receiptTitle) receiptTitle.textContent = "Facturas / comprobantes";
  }

  function enhanceDetailModal(){
    const actions = document.querySelector(".detail-actions");
    if (!actions || document.getElementById("detail-download-btn")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "detail-download-btn";
    btn.className = "btn-secondary";
    btn.textContent = "Descargar foto";
    btn.addEventListener("click", downloadCurrentProductImage);
    const edit = document.getElementById("detail-edit-btn");
    actions.insertBefore(btn, edit || null);
  }

  function getSafeFileName(text){
    return String(text || "producto")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "producto";
  }

  function downloadCurrentProductImage(){
    const img = document.getElementById("detail-main-img");
    if (!img || !img.src) {
      toast("No hay foto para descargar.");
      return;
    }
    const name = getSafeFileName(document.getElementById("detail-name")?.textContent || "producto");
    const a = document.createElement("a");
    a.href = img.src;
    a.download = `${name}-SDComayagua.jpg`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast("Foto lista para guardar o compartir.");
  }

  function addSaleHelper(){
    const box = document.querySelector(".sale-builder-box .sale-box-head");
    if (!box || document.getElementById("sale-helper-v38")) return;
    const p = document.createElement("p");
    p.id = "sale-helper-v38";
    p.className = "field-help";
    p.textContent = "Aquí puedes dejar el primer producto agregado y sumar más artículos antes de generar la factura.";
    box.insertAdjacentElement("afterend", p);
  }

  function polishReceiptButtons(){
    document.querySelectorAll("button").forEach((btn)=>{
      const t = (btn.textContent || "").trim();
      if (t === "Editar venta") btn.textContent = "Editar factura";
      if (t.includes("Confirmar venta y generar comprobante")) btn.textContent = "Generar factura";
    });
  }

  function observeProducts(){
    const products = document.getElementById("inv-products");
    if (!products || products.__v38Observer) return;
    products.__v38Observer = true;
    new MutationObserver(()=>{
      document.querySelectorAll(".product-action-btn.primary").forEach((btn)=>{
        btn.textContent = "Agregar a venta";
      });
      const count = document.getElementById("results-count");
      if (count) count.textContent = count.textContent.replace("resultado", "producto");
    }).observe(products, { childList:true, subtree:true });
  }

  function init(){
    enhanceShell();
    applyTheme();
    enhanceDetailModal();
    addSaleHelper();
    polishReceiptButtons();
    observeProducts();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once:true });
  else init();
  window.addEventListener("load", init, { once:true });
  setTimeout(init, 400);
  setTimeout(init, 1200);
})();
