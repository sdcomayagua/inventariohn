(function () {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  let state = SDCStore.load();
  const app = $("#app"),
    modalRoot = $("#modalRoot"),
    toastEl = $("#toast");
  let currentView = "catalog";
  let filter = { q: "", cat: "Todos" };
  let quote = emptyQuote();
  let saleDraft = null;

  function money(n) {
    return `${state.settings.currency || "Lps."} ${Number(n || 0).toLocaleString("es-HN", { maximumFractionDigits: 0 })}`;
  }
  function num(n) {
    return Number(n || 0).toLocaleString("es-HN", { maximumFractionDigits: 0 });
  }
  function cleanPhone(p) {
    return String(p || "")
      .replace(/\D/g, "")
      .replace(/^5040?/, "504");
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => toastEl.classList.remove("show"), 2600);
  }
  function save() {
    SDCStore.save(state);
  }
  function escapeHtml(s) {
    return String(s ?? "").replace(
      /[&<>"]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
    );
  }
  function parseTags(str) {
    return String(str || "General")
      .split(/[;,|]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  function firstTag(p) {
    return parseTags(p.categories)[0] || "General";
  }
  function allCategories() {
    return [
      "Todos",
      ...Array.from(
        new Set(
          state.products
            .flatMap((p) => parseTags(p.categories))
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, "es")),
    ];
  }
  function placeholderFor(p) {
    const tags = parseTags(p.categories).join(" ").toLowerCase();
    if (
      tags.includes("gamer") ||
      tags.includes("dedal") ||
      tags.includes("gatillo")
    )
      return SDC_PLACEHOLDERS.gamer;
    if (
      tags.includes("tec") ||
      tags.includes("celular") ||
      tags.includes("audio") ||
      tags.includes("cable")
    )
      return SDC_PLACEHOLDERS.tecnologia;
    if (tags.includes("hogar") || tags.includes("cocina"))
      return SDC_PLACEHOLDERS.hogar;
    return SDC_PLACEHOLDERS.default;
  }
  function galleryOf(p) {
    const g = String(p.gallery || "")
      .split(/[\n,]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const list = [p.image, ...g].filter(Boolean);
    return Array.from(new Set(list));
  }
  function productImage(p) {
    return galleryOf(p)[0] || placeholderFor(p);
  }
  function statusOf(p) {
    const stock = Number(p.stock || 0);
    const raw = String(p.status || "").trim();
    if (stock <= 0) return "Agotado";
    if (raw && raw !== "Disponible") return raw;
    if (stock <= Number(state.settings.lowStockLimit || 3)) return "Bajo stock";
    return "Disponible";
  }
  function statusClass(label) {
    const x = String(label || "").toLowerCase();
    if (x.includes("agot")) return "sold";
    if (x.includes("bajo")) return "low";
    if (x.includes("consult")) return "ask";
    return "ok";
  }
  function richDescription(p) {
    const parts = [];
    if (p.description) parts.push(`<p>${escapeHtml(p.description)}</p>`);
    if (p.benefits) parts.push(`<p><b>Beneficios:</b> ${escapeHtml(p.benefits)}</p>`);
    if (p.includes) parts.push(`<p><b>Incluye:</b> ${escapeHtml(p.includes)}</p>`);
    if (p.note) parts.push(`<p><b>Nota:</b> ${escapeHtml(p.note)}</p>`);
    return parts.join("") || "<p>Sin descripción.</p>";
  }
  function onImgError(img, p) {
    img.onerror = null;
    img.src = placeholderFor(p || {});
  }
  function productById(id) {
    return state.products.find((p) => p.id === id);
  }
  function nextCode() {
    let max = 0;
    state.products.forEach((p) => {
      const m = String(p.id).match(/(\d+)$/);
      if (m) max = Math.max(max, Number(m[1]));
    });
    return `SDC-${String(max + 1).padStart(3, "0")}`;
  }
  function emptyQuote() {
    return {
      id: "COT-" + Date.now(),
      items: [],
      client: "",
      phone: "",
      department: "Comayagua",
      municipality: "Comayagua",
      reference: "",
      shippingType: "Normal",
      company: "Forza",
      shipping: 110,
      cod: true,
      discount: 0,
      date: new Date().toISOString(),
      saved: false,
    };
  }
  function emptySale() {
    return {
      ...emptyQuote(),
      id: "SDC-" + Date.now().toString().slice(-10),
      kind: "receipt",
    };
  }
  function itemTotal(it) {
    return Number(it.qty || 0) * Number(it.price || 0);
  }
  function calc(doc) {
    const products = (doc.items || []).reduce((a, it) => a + itemTotal(it), 0);
    const shipping = Number(doc.shipping || 0);
    const discount = Number(doc.discount || 0);
    const base = Math.max(0, products + shipping);
    const commission = doc.cod
      ? Math.round(base * ((state.settings.codPercent || 6) / 100))
      : 0;
    const delivery = shipping + commission;
    const total = Math.max(0, products + delivery - discount);
    return { products, shipping, commission, delivery, discount, total };
  }
  function setView(v) {
    currentView = v;
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    if (!state.unlocked) {
      renderLogin();
      return;
    }
    app.className = "app";
    app.innerHTML = `${topbar()}${hero()}${quickPanel()}${searchPanel()}${inventoryHTML()}${bottomNav()}`;
    bindMain();
  }
  function renderLogin() {
    app.className = "login-wrap";
    app.innerHTML = `<section class="login-card">
      <img class="login-logo" src="assets/logo-sdc.png" alt="Logo SD Comayagua">
      <h1 class="login-title">CAJA SDC</h1>
      <div class="pill login-pill"><span class="dot"></span> Panel privado de ventas</div>
      <div class="form-box">
        <label class="label" for="keyInput">Clave de acceso</label>
        <input id="keyInput" class="input" type="password" inputmode="numeric" placeholder="Ingresa tu clave" autocomplete="current-password">
        <button id="loginBtn" class="btn full" style="margin-top:14px">Entrar al panel</button>
      </div>
    </section>`;
    $("#loginBtn").onclick = unlock;
    $("#keyInput").addEventListener("keydown", (e) => {
      if (e.key === "Enter") unlock();
    });
  }
  function unlock() {
    if (
      $("#keyInput").value.trim() === (state.settings.accessKey || "199311")
    ) {
      state.unlocked = true;
      save();
      render();
      toast("Panel desbloqueado.");
    } else toast("Clave incorrecta.");
  }
  function topbar() {
    return `<header class="topbar"><img class="top-logo" src="assets/logo-sdc.png" alt="SD"><div class="top-title"><h1>SD COMAYAGUA</h1><p>Modo venta móvil</p></div><div class="spacer"></div><button class="btn small secondary" data-action="lock">Salir</button></header>`;
  }
  function hero() {
    const st = stats();
    return `<section class="hero" id="inicio">
      <div class="pill login-pill"><span class="dot"></span> SD Comayagua · Sistema privado</div>
      <h2>CONTROL DE VENTAS</h2><p>Inventario, cotizaciones, ventas, recibos editables, envíos y respaldo para trabajar rápido desde celular.</p>
      <div class="stats">
        <div class="stat"><b>${num(st.count)}</b><span>Productos</span></div><div class="stat"><b>${num(st.stock)}</b><span>Stock total</span></div>
        <div class="stat"><b>${money(st.value)}</b><span>Valor venta</span></div><div class="stat"><b>${money(st.invested)}</b><span>Invertido</span></div>
        <div class="stat"><b>${money(st.profit)}</b><span>Ganancia</span></div>
      </div>
    </section>`;
  }
  function stats() {
    let count = state.products.length,
      stock = 0,
      value = 0,
      invested = 0;
    state.products.forEach((p) => {
      stock += +p.stock || 0;
      value += (+p.stock || 0) * (+p.price || 0);
      invested += (+p.stock || 0) * (+p.cost || 0);
    });
    return { count, stock, value, invested, profit: value - invested };
  }
  function quickPanel() {
    const low = state.products.filter(
      (p) =>
        Number(p.stock) > 0 &&
        Number(p.stock) <= Number(state.settings.lowStockLimit || 3),
    ).length;
    const nocost = state.products.filter((p) => Number(p.cost) <= 0).length;
    const st = stats();
    return `<section class="quick no-print" aria-label="Accesos rápidos">
      <button data-action="catalog"><em class="quick-ico">⌂</em><b>Catálogo</b><span>Ver productos</span></button>
      <button data-action="sell"><em class="quick-ico">🛒</em><b>Vender</b><span>Seleccionar</span></button>
      <button data-action="newProduct"><em class="quick-ico">＋</em><b>Producto</b><span>Agregar nuevo</span></button>
      <button data-action="profit"><em class="quick-ico">▴</em><b>Ganancias</b><span>Por producto</span></button>
      <button data-action="receipts"><em class="quick-ico">▤</em><b>Recibos</b><span>Caja del día</span></button>
      <button data-action="backup"><em class="quick-ico">▧</em><b>Backup</b><span>Exportar</span></button>
    </section>
    <section class="alert-row no-print">
      <div class="alert-card"><div><b>${low} bajo stock</b><span>Revisa reposición.</span></div><button class="btn small secondary" data-action="lowStock">Ver</button></div>
      <div class="alert-card"><div><b>${nocost} sin costo</b><span>Agrega costo para ganancia real.</span></div><button class="btn small secondary" data-action="noCost">Revisar</button></div>
      <div class="alert-card"><div><b>Ganancia</b><span>${money(st.profit)} estimado.</span></div><button class="btn small secondary" data-action="profit">Detalle</button></div>
    </section>`;
  }
  function searchPanel() {
    return `<section class="search-panel no-print"><div class="searchbar"><span class="icon">⌕</span><input id="searchInput" placeholder="Buscar producto o código" value="${escapeHtml(filter.q)}"></div><div class="chips">${allCategories()
      .map(
        (c) =>
          `<button class="chip ${filter.cat === c ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`,
      )
      .join("")}</div></section>`;
  }
  function filteredProducts() {
    const q = filter.q.trim().toLowerCase();
    return state.products.filter((p) => {
      const tags = parseTags(p.categories);
      const inCat =
        filter.cat === "Todos" ||
        tags.some((t) => t.toLowerCase() === filter.cat.toLowerCase());
      const hay = [p.name, p.id, p.categories, p.description]
        .join(" ")
        .toLowerCase();
      return inCat && (!q || hay.includes(q));
    });
  }
  function inventoryHTML() {
    const list = filteredProducts();
    return `<section id="inventario"><div class="section-head"><h2>INVENTARIO</h2><span class="count-pill">${list.length} resultados</span></div>${list.length ? `<div class="grid">${list.map(productCard).join("")}</div>` : `<div class="empty-state">No encontré productos con esa búsqueda o etiqueta.</div>`}</section>`;
  }
  function productCard(p) {
    const tags = parseTags(p.categories);
    const status = statusOf(p);
    const percent = Math.max(
      5,
      Math.min(100, ((Number(p.stock) || 0) / 20) * 100),
    );
    const old = Number(p.oldPrice || 0);
    return `<article class="product-card" data-id="${escapeHtml(p.id)}"><div class="product-top"><div class="tag-stack"><span class="tag-pill">${escapeHtml(tags[0] || "General")}</span>${tags.length > 1 ? `<span class="tag-pill">+${tags.length - 1}</span>` : ""}</div><span class="code-pill">${escapeHtml(p.id)}</span></div>
      <div class="product-media"><img src="${escapeHtml(productImage(p))}" alt="${escapeHtml(p.name)}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${statusClass(status)}"><span class="dot" style="background:#031018;box-shadow:none"></span>${escapeHtml(status)}</span><b class="price-badge">${money(p.price)}</b>${old > 0 && old > Number(p.price || 0) ? `<span class="old-price-badge">Antes ${money(old)}</span>` : ""}</div>
      <h3 class="product-title">${escapeHtml(p.name)}</h3><div class="metrics"><div class="metric"><span>Stock</span><b>${num(p.stock)} disponibles</b></div><div class="metric"><span>Ganancia C/U</span><b>${money((+p.price || 0) - (+p.cost || 0))}</b></div><div class="metric"><span>Costo</span><b>${(+p.cost || 0) > 0 ? money(p.cost) : "Sin costo"}</b></div><div class="metric"><span>Valor stock</span><b>${money((+p.stock || 0) * (+p.price || 0))}</b></div></div><div class="stock-line"><i style="width:${percent}%"></i></div>
      <div class="card-actions"><button class="btn secondary quote" data-action="quoteProduct" data-id="${escapeHtml(p.id)}">Cotizar</button><button class="btn" data-action="sellProduct" data-id="${escapeHtml(p.id)}">Vender</button><button class="btn secondary" data-action="viewProduct" data-id="${escapeHtml(p.id)}">Ver</button><button class="btn ghost" data-action="editProduct" data-id="${escapeHtml(p.id)}">Editar</button></div></article>`;
  }
  function bottomNav() {
    return `<nav class="bottom-nav no-print"><button class="nav-btn ${currentView === "catalog" ? "active" : ""}" data-action="catalog"><i>⌂</i><span>Catálogo</span></button><button class="nav-btn" data-action="sell"><i>🛒</i><span>Vender</span></button><button class="nav-btn" data-action="receipts"><i>▤</i><span>Caja</span></button><button class="nav-btn" data-action="newProduct"><i>＋</i><span>Producto</span></button><button class="nav-btn ${currentView === "quote" ? "active" : ""}" data-action="quote"><i>▧</i><span>Cotizar</span></button></nav>`;
  }

  function bindMain() {
    $('[data-action="lock"]')?.addEventListener("click", () => {
      state.unlocked = false;
      save();
      render();
    });
    $("#searchInput")?.addEventListener("input", (e) => {
      filter.q = e.target.value;
      render();
    });
    $$(".chip").forEach(
      (b) =>
        (b.onclick = () => {
          filter.cat = b.dataset.cat;
          render();
        }),
    );
    document.querySelectorAll("[data-action]").forEach((btn) => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = 1;
      btn.addEventListener("click", mainAction);
    });
  }
  function mainAction(e) {
    const a = e.currentTarget.dataset.action,
      id = e.currentTarget.dataset.id;
    if (a === "catalog") return setView("catalog");
    if (a === "sell") return openSale();
    if (a === "quote") return openQuote();
    if (a === "newProduct") return openProductEditor();
    if (a === "editProduct") return openProductEditor(id);
    if (a === "viewProduct") return openProductDetails(id);
    if (a === "sellProduct") return openSale(id);
    if (a === "quoteProduct") return openQuote(id);
    if (a === "backup") return openBackup();
    if (a === "profit") return openProfit();
    if (a === "receipts") return openReceipts();
    if (a === "lowStock") {
      filter.cat = "Todos";
      filter.q = "";
      render();
      setTimeout(() => {
        state.products.filter((p) => +p.stock > 0 && +p.stock <= 3).length
          ? toast("Productos de bajo stock marcados con etiqueta amarilla.")
          : toast("No hay productos en bajo stock.");
      }, 50);
    }
    if (a === "noCost") {
      filter.cat = "Todos";
      filter.q = "Sin costo";
      render();
      openNoCost();
    }
  }

  function openModal(html, wide = false) {
    modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal ${wide ? "wide" : ""}">${html}</section></div>`;
    $(".close", modalRoot)?.addEventListener("click", closeModal);
    modalRoot
      .querySelector(".modal-backdrop")
      .addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-backdrop")) closeModal();
      });
  }
  function closeModal() {
    modalRoot.innerHTML = "";
  }


  function parsePromoRows(str) {
    const raw = String(str || "")
      .split(/[\n;|]+/)
      .map((x) => x.trim())
      .filter(Boolean);
    const rows = raw
      .map((line) => {
        const m = line.match(/(\d+(?:\.\d+)?)\s*(?:=|:|-|→|,)\s*(\d+(?:\.\d+)?)/);
        if (!m) return null;
        return { qty: m[1], price: m[2] };
      })
      .filter(Boolean);
    return rows.length ? rows : [{ qty: "", price: "" }];
  }

  function promoRowHTML(qty = "", price = "") {
    return `<div class="promo-row">
      <label class="promo-field"><span>Cantidad</span><input class="promo-qty" type="number" inputmode="numeric" min="1" value="${escapeHtml(qty)}" placeholder="Ej. 3"></label>
      <label class="promo-field"><span>Precio</span><input class="promo-price" type="number" inputmode="decimal" min="0" value="${escapeHtml(price)}" placeholder="Ej. 72"></label>
      <button type="button" class="promo-remove" title="Quitar promoción">×</button>
      <div class="promo-mini">Completa cantidad y precio.</div>
    </div>`;
  }

  function promoRowsHTML(promos) {
    return `<div class="promo-rows" id="promoRows">${parsePromoRows(promos)
      .map((r) => promoRowHTML(r.qty, r.price))
      .join("")}</div><div class="promo-summary" id="promoSummary"></div>`;
  }

  function bindPromoBuilder() {
    const rowsBox = $("#promoRows", modalRoot);
    if (!rowsBox) return;
    const updatePromos = () => {
      const lines = $$(".promo-row", rowsBox).map((row) => {
        const qty = Number($(".promo-qty", row)?.value || 0);
        const price = Number($(".promo-price", row)?.value || 0);
        const mini = $(".promo-mini", row);
        const txt = qty > 0 && price > 0 ? `${num(qty)} unidad${qty === 1 ? "" : "es"} = ${money(price)}` : "Completa cantidad y precio.";
        if (mini) mini.textContent = txt;
        return qty > 0 && price > 0 ? txt : "";
      }).filter(Boolean);
      const box = $("#promoSummary", modalRoot);
      if (box) box.innerHTML = lines.length ? `<b>Resumen:</b> ${lines.map(escapeHtml).join(" · ")}` : "Sin promociones agregadas todavía.";
    };
    const bindRow = (row) => {
      $$("input", row).forEach((inp) => (inp.oninput = updatePromos));
    };
    const bindRemove = () => {
      $$(".promo-remove", rowsBox).forEach((btn) => {
        btn.onclick = () => {
          const rows = $$(".promo-row", rowsBox);
          if (rows.length <= 1) {
            $(".promo-qty", rows[0]).value = "";
            $(".promo-price", rows[0]).value = "";
            updatePromos();
            return;
          }
          btn.closest(".promo-row")?.remove();
          updatePromos();
        };
      });
    };
    $("#addPromoRow", modalRoot).onclick = () => {
      rowsBox.insertAdjacentHTML("beforeend", promoRowHTML());
      const last = rowsBox.lastElementChild;
      bindRow(last);
      bindRemove();
      updatePromos();
      $(".promo-qty", last)?.focus();
    };
    $$(".promo-row", rowsBox).forEach(bindRow);
    bindRemove();
    updatePromos();
  }

  function collectPromos() {
    return $$(".promo-row", modalRoot)
      .map((row) => {
        const qty = Number($(".promo-qty", row)?.value || 0);
        const price = Number($(".promo-price", row)?.value || 0);
        return qty > 0 && price > 0 ? `${qty}=${price}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }


  function parseGalleryRows(str) {
    const rows = String(str || "")
      .split(/\n+/)
      .map((x) => x.trim())
      .filter(Boolean);
    return rows.length ? rows : [];
  }

  function imageRowHTML(url = "") {
    const safe = escapeHtml(url);
    return `<div class="image-row">
      <div class="image-preview">${safe ? `<img src="${safe}" alt="">` : `<span>IMG</span>`}</div>
      <label class="image-field"><span class="image-title">Imagen adicional</span><input class="image-url" type="url" value="${safe}" placeholder="https://..."></label>
      <button type="button" class="image-remove" title="Quitar imagen">×</button>
    </div>`;
  }

  function galleryRowsHTML(gallery) {
    return `<div class="image-rows" id="imageRows">${parseGalleryRows(gallery)
      .map((url) => imageRowHTML(url))
      .join("")}</div>`;
  }

  function collectGallery() {
    return $$(".image-url", modalRoot)
      .map((input) => input.value.trim())
      .filter(Boolean)
      .join("\n");
  }

  function bindImageBuilder() {
    const rowsBox = $("#imageRows", modalRoot);
    if (!rowsBox) return;
    const counter = $("#imageCounter", modalRoot);
    const updateMainPreview = () => {
      const input = $("#pImage", modalRoot);
      const preview = $("#mainImagePreview", modalRoot);
      const url = input?.value.trim() || "";
      if (preview) preview.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="">` : `<span>Principal</span>`;
    };
    const refreshNumbers = () => {
      $$(".image-row", rowsBox).forEach((row, idx) => {
        const title = $(".image-title", row);
        if (title) title.textContent = `Imagen ${idx + 2}`;
      });
    };
    const updateCounter = () => {
      const count = $$(".image-url", rowsBox).filter((input) => input.value.trim()).length;
      if (counter) counter.textContent = `${count} foto${count === 1 ? "" : "s"} extra`;
      refreshNumbers();
    };
    const bindPreview = (row) => {
      const input = $(".image-url", row);
      const preview = $(".image-preview", row);
      if (!input || !preview) return;
      input.oninput = () => {
        const url = input.value.trim();
        preview.innerHTML = url ? `<img src="${escapeHtml(url)}" alt="">` : `<span>IMG</span>`;
        updateCounter();
      };
    };
    const bindRemove = () => {
      $$(".image-remove", rowsBox).forEach((btn) => {
        btn.onclick = () => {
          btn.closest(".image-row")?.remove();
          updateCounter();
        };
      });
    };
    const addBtn = $("#addImageRow", modalRoot);
    if (addBtn) {
      addBtn.onclick = () => {
        rowsBox.insertAdjacentHTML("beforeend", imageRowHTML());
        const last = rowsBox.lastElementChild;
        bindPreview(last);
        bindRemove();
        updateCounter();
        $(".image-url", last)?.focus();
      };
    }
    $$(".image-row", rowsBox).forEach(bindPreview);
    bindRemove();
    $("#pImage", modalRoot)?.addEventListener("input", updateMainPreview);
    updateMainPreview();
    updateCounter();
  }

  function currentProductFromForm() {
    return {
      id: $("#pId", modalRoot)?.value.trim() || nextCode(),
      name: $("#pName", modalRoot)?.value.trim() || "Producto sin nombre",
      categories: $("#pCats", modalRoot)?.value.trim() || "General",
      cost: +($("#pCost", modalRoot)?.value || 0) || 0,
      price: +($("#pPrice", modalRoot)?.value || 0) || 0,
      oldPrice: +($("#pOldPrice", modalRoot)?.value || 0) || 0,
      stock: +($("#pStock", modalRoot)?.value || 0) || 0,
      status: $("input[name='pStatus']:checked", modalRoot)?.value || "Disponible",
      image: $("#pImage", modalRoot)?.value.trim() || "",
      gallery: collectGallery(),
      promos: collectPromos(),
      description: $("#pDesc", modalRoot)?.value.trim() || "",
      benefits: $("#pBenefits", modalRoot)?.value.trim() || "",
      includes: $("#pIncludes", modalRoot)?.value.trim() || "",
      note: $("#pNote", modalRoot)?.value.trim() || "",
    };
  }

  function productEditorPreview(p) {
    const tags = parseTags(p.categories);
    const old = Number(p.oldPrice || 0);
    return `<article class="product-card preview-product-card"><div class="product-top"><div class="tag-stack"><span class="tag-pill">${escapeHtml(tags[0] || "General")}</span>${tags.length > 1 ? `<span class="tag-pill">+${tags.length - 1}</span>` : ""}</div><span class="code-pill">${escapeHtml(p.id)}</span></div>
      <div class="product-media"><img src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${statusClass(statusOf(p))}"><span class="dot" style="background:#031018;box-shadow:none"></span>${escapeHtml(statusOf(p))}</span><b class="price-badge">${money(p.price)}</b>${old > 0 && old > Number(p.price || 0) ? `<span class="old-price-badge">Antes ${money(old)}</span>` : ""}</div>
      <h3 class="product-title">${escapeHtml(p.name)}</h3><div class="preview-desc">${richDescription(p)}</div></article>`;
  }

  function productForm(p = {}) {
    const prod = SDCStore.normalizeProduct(p, state.products.length);
    if (!p.id) prod.id = nextCode();
    const quickCats = ["Gamer Móvil", "Dedales", "Gatillos", "Tecnología", "Celulares", "Audio", "Cables", "Hogar", "Cocina", "Accesorios"];
    const selected = parseTags(prod.categories).map((x) => x.toLowerCase());
    const statuses = ["Disponible", "Bajo stock", "Agotado", "Consultar"];
    const st = statuses.includes(prod.status) ? prod.status : "Disponible";
    return `<div class="modal-head"><h3>${p.id ? "Editar" : "Nuevo"} producto</h3><button class="close">×</button></div>
      <div class="modal-body product-editor-body">
      <div class="card-box"><h4>Información básica</h4><div class="modal-grid">
      <label><span class="label">Nombre del producto</span><input id="pName" class="input" value="${escapeHtml(prod.name)}" placeholder="Ej. Dedales gamer V1"></label>
      <label><span class="label">Código</span><input id="pId" class="input" value="${escapeHtml(prod.id)}"></label>
      <label><span class="label">Costo compra</span><input id="pCost" class="input" type="number" value="${prod.cost}"></label>
      <label><span class="label">Precio actual</span><input id="pPrice" class="input" type="number" value="${prod.price}"></label>
      <label><span class="label">Precio antes / tachado</span><input id="pOldPrice" class="input" type="number" value="${prod.oldPrice || ""}" placeholder="Opcional"></label>
      <label><span class="label">Stock</span><input id="pStock" class="input" type="number" value="${prod.stock}"></label>
      <label class="span2"><span class="label">Categorías / etiquetas</span><input id="pCats" class="input" value="${escapeHtml(prod.categories)}" placeholder="Ejemplo: Dedales, Gamer Móvil"></label>
      <div class="span2 category-picker"><span class="label">Toca para agregar o quitar categoría</span><div class="chips cat-shortcuts">${quickCats.map((c) => `<button type="button" class="chip ${selected.includes(c.toLowerCase()) ? "active" : ""}" data-addcat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}</div></div>
      <div class="span2 status-picker"><span class="label">Estado del producto</span><div class="status-options">${statuses.map((x) => `<label class="status-option ${x === st ? "active" : ""}"><input type="radio" name="pStatus" value="${x}" ${x === st ? "checked" : ""}>${x}</label>`).join("")}</div></div>
      </div></div>

      <div class="card-box media-section"><h4>Imágenes del producto</h4><div class="modal-grid">
      <label class="span2 main-image-block"><span class="label">Imagen principal del producto</span><div class="main-image-line"><div class="main-image-preview" id="mainImagePreview"><span>Principal</span></div><input id="pImage" class="input" value="${escapeHtml(prod.image)}" placeholder="https://..."></div><small>Esta será la primera foto que aparece en el catálogo.</small></label>
      <div class="span2 image-box"><div class="image-box-head"><span class="label">Fotos adicionales del producto</span><span class="image-counter" id="imageCounter">0 fotos extra</span></div><p class="form-help image-help">Presiona <b>Añadir imagen</b> y se abre otro campo. Puedes repetirlo hasta terminar tus fotos.</p>${galleryRowsHTML(prod.gallery)}<button type="button" class="btn secondary small image-add" id="addImageRow">+ Añadir imagen</button></div>
      </div></div>

      <div class="card-box"><h4>Promociones y contenido</h4><div class="modal-grid">
      <div class="span2 promo-box"><span class="label">Añadir promociones</span><div class="promo-head"><b>Cantidad</b><b>Precio</b><i></i></div>${promoRowsHTML(prod.promos)}<button type="button" class="btn secondary small promo-add" id="addPromoRow">+ Agregar otra promoción</button><p class="form-help">Ejemplo: cantidad 3 y precio 72. Abajo verás el resumen automático antes de guardar.</p></div>
      <label class="span2"><span class="label">Descripción corta</span><textarea id="pDesc" class="textarea" placeholder="Describe el producto de forma clara y vendible.">${escapeHtml(prod.description)}</textarea></label>
      <label class="span2"><span class="label">Beneficios</span><textarea id="pBenefits" class="textarea small-textarea" placeholder="Ej. Mejor agarre, más comodidad, ideal para jugar.">${escapeHtml(prod.benefits || "")}</textarea></label>
      <label class="span2"><span class="label">Qué incluye</span><textarea id="pIncludes" class="textarea small-textarea" placeholder="Ej. 1 par, caja, cable, manual, etc.">${escapeHtml(prod.includes || "")}</textarea></label>
      <label class="span2"><span class="label">Nota especial</span><textarea id="pNote" class="textarea small-textarea" placeholder="Ej. Stock limitado, colores según existencia.">${escapeHtml(prod.note || "")}</textarea></label>
      </div></div>

      <div class="card-box preview-panel" id="productPreviewPanel" hidden><div class="section-head"><h4>Vista previa</h4><span>Así se verá antes de guardar</span></div><div id="productPreviewBox"></div></div>
      <div class="modal-actions product-savebar"><button class="btn secondary" id="previewProduct" type="button">Vista previa</button><button class="btn ghost" id="resetProductForm" type="button">Nuevo desde cero</button>${p.id ? `<button class="btn secondary" id="duplicateProduct" type="button">Duplicar</button><button class="btn danger" id="deleteProduct" type="button">Eliminar</button>` : ""}<button class="btn" id="saveProduct" type="button">Guardar producto</button></div>
      </div>`;
  }

  function openProductEditor(id) {
    const p = id ? productById(id) : {};
    openModal(productForm(p), true);
    const syncCategoryActive = () => {
      const tags = parseTags($("#pCats", modalRoot).value).map((x) => x.toLowerCase());
      $$("[data-addcat]", modalRoot).forEach((b) => b.classList.toggle("active", tags.includes(b.dataset.addcat.toLowerCase())));
    };
    $$("[data-addcat]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          const inp = $("#pCats", modalRoot);
          let tags = parseTags(inp.value);
          const exists = tags.some((t) => t.toLowerCase() === b.dataset.addcat.toLowerCase());
          tags = exists ? tags.filter((t) => t.toLowerCase() !== b.dataset.addcat.toLowerCase()) : [...tags, b.dataset.addcat];
          inp.value = tags.join(", ") || "General";
          syncCategoryActive();
        }),
    );
    $("#pCats", modalRoot)?.addEventListener("input", syncCategoryActive);
    $$(".status-option", modalRoot).forEach((lbl) => {
      lbl.onclick = () => {
        setTimeout(() => {
          $$(".status-option", modalRoot).forEach((x) => x.classList.toggle("active", $("input", x).checked));
        }, 0);
      };
    });
    bindImageBuilder();
    bindPromoBuilder();
    $("#previewProduct").onclick = () => {
      const np = currentProductFromForm();
      const panel = $("#productPreviewPanel", modalRoot);
      $("#productPreviewBox", modalRoot).innerHTML = productEditorPreview(np);
      panel.hidden = false;
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    $("#resetProductForm").onclick = () => {
      if (!confirm("¿Limpiar el formulario para crear otro producto?")) return;
      closeModal();
      openProductEditor();
    };
    $("#saveProduct").onclick = () => {
      const np = currentProductFromForm();
      const ix = state.products.findIndex((x) => x.id === id);
      if (ix >= 0) state.products[ix] = np;
      else state.products.push(np);
      save();
      SDCStore.saveBackup(state, "Antes/después de editar producto");
      closeModal();
      render();
      toast("Producto guardado.");
    };
    $("#duplicateProduct") &&
      ($("#duplicateProduct").onclick = () => {
        const cp = { ...currentProductFromForm(), id: nextCode(), name: currentProductFromForm().name + " copia" };
        state.products.push(cp);
        save();
        closeModal();
        render();
        toast("Producto duplicado.");
      });
    $("#deleteProduct") &&
      ($("#deleteProduct").onclick = () => {
        if (confirm("¿Eliminar este producto?")) {
          state.products = state.products.filter((x) => x.id !== id);
          save();
          closeModal();
          render();
          toast("Producto eliminado.");
        }
      });
  }

  function openProductDetails(id) {
    const p = productById(id);
    if (!p) return;
    const imgs = galleryOf(p);
    openModal(
      `<div class="modal-head"><h3>Producto</h3><button class="close">×</button></div><div class="modal-body"><div class="doc-wrap" style="background:#07111f;color:#eef8ff"><div class="product-media"><img src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><span class="stock-badge ${statusClass(statusOf(p))}">${escapeHtml(statusOf(p))}</span><b class="price-badge">${money(p.price)}</b>${(+p.oldPrice || 0) > (+p.price || 0) ? `<span class="old-price-badge">Antes ${money(p.oldPrice)}</span>` : ""}</div><h2>${escapeHtml(p.name)}</h2><div style="color:#b8c8d8">${richDescription(p)}</div><div class="metrics"><div class="metric"><span>Stock</span><b>${num(p.stock)}</b></div><div class="metric"><span>Categorías</span><b>${escapeHtml(parseTags(p.categories).join(", "))}</b></div><div class="metric"><span>Costo</span><b>${money(p.cost)}</b></div><div class="metric"><span>Ganancia C/U</span><b>${money((+p.price || 0) - (+p.cost || 0))}</b></div></div></div><div class="modal-actions"><button class="btn" data-action="sellProduct" data-id="${escapeHtml(id)}">Vender</button><button class="btn secondary" data-action="quoteProduct" data-id="${escapeHtml(id)}">Cotizar</button><button class="btn ghost" data-action="editProduct" data-id="${escapeHtml(id)}">Editar</button></div></div>`,
    );
    $$("[data-action]", modalRoot).forEach(
      (b) =>
        (b.onclick = (e) => {
          closeModal();
          mainAction({ currentTarget: b });
        }),
    );
  }

  function quoteModalHTML(isSale = false) {
    const doc = isSale ? saleDraft : quote;
    const title = isSale ? "Venta / factura real" : "Cotización previa";
    return `<div class="modal-head"><h3>${title}</h3><button class="close">×</button></div><div class="modal-body"><div class="pill"><span class="dot"></span>${isSale ? "Factura y registro" : "Preventa / información"}</div><div class="modal-grid flow-grid ${doc.items.length ? "has-items" : ""}" style="margin-top:14px"><div class="card-box picker-card span2"><div class="section-head" style="margin:0 0 12px"><h4>Seleccionar producto</h4><span>${state.products.length} encontrados</span></div><div class="searchbar"><span class="icon">⌕</span><input id="pickSearch" placeholder="Buscar por nombre, categoría o código..."></div><div class="chips" id="pickChips">${allCategories()
      .map(
        (c) =>
          `<button class="chip ${c === "Todos" ? "active" : ""}" data-pickcat="${escapeHtml(c)}">${escapeHtml(c)}</button>`,
      )
      .join(
        "",
      )}</div><div id="pickerList" class="picker-list"></div></div><div class="card-box calc-card"><h4>Datos para calcular</h4>${fieldsHTML(doc)}</div><div class="card-box cart-card"><h4>${isSale ? "Factura" : "Cotización"} actual</h4><div id="cartList" class="cart-list"></div><div id="totalsMini"></div></div><div class="preview-area span2"><div id="docPreview">${docCard(doc, isSale)}</div></div></div><div class="modal-actions"><button class="btn secondary" id="downloadDoc">↓ Imagen</button><button class="btn secondary" id="waText">WhatsApp texto</button><button class="btn" id="waPhoto">WhatsApp foto</button>${!isSale ? '<button class="btn ghost" id="saveQuote">Guardar cotización</button><button class="btn" id="toSale">Pasar a venta / factura real</button>' : '<button class="btn" id="finishSale">Finalizar venta</button><button class="btn secondary" id="printDoc">Imprimir / PDF</button>'}</div></div>`;
  }
  function fieldsHTML(doc) {
    return `<div class="modal-grid"><label><span class="label">Cliente opcional</span><input class="input bindDoc" data-k="client" value="${escapeHtml(doc.client)}"></label><label><span class="label">Teléfono cliente / WhatsApp</span><input class="input bindDoc" data-k="phone" inputmode="tel" value="${escapeHtml(doc.phone)}" placeholder="Sin +504 también funciona"></label><label><span class="label">Departamento</span><select class="select bindDoc" data-k="department">${SDC_DEPARTMENTS.map((d) => `<option ${doc.department === d ? "selected" : ""}>${d}</option>`).join("")}</select></label><label><span class="label">Municipio</span><select class="select bindDoc" data-k="municipality"></select></label><label class="span2"><span class="label">Referencia / barrio / colonia</span><input class="input bindDoc" data-k="reference" value="${escapeHtml(doc.reference)}"></label><label><span class="label">Empresa / entrega</span><select class="select bindDoc" data-k="company"><option>Domicilio</option><option>Forza</option><option>C807</option><option>Cargo Expreso</option><option>Bus local</option></select></label><label><span class="label">Envío Lps.</span><input class="input bindDoc" data-k="shipping" type="number" value="${doc.shipping}"></label><label><span class="label">Pagar al recibir</span><select class="select bindDoc" data-k="cod"><option value="true" ${doc.cod ? "selected" : ""}>Sí, aplicar comisión ${state.settings.codPercent || 6}%</option><option value="false" ${!doc.cod ? "selected" : ""}>No, sin comisión</option></select></label><label><span class="label">Descuento Lps.</span><input class="input bindDoc" data-k="discount" type="number" value="${doc.discount}"></label></div>`;
  }
  function bindDocFields(isSale) {
    const doc = isSale ? saleDraft : quote;
    const mun = $('[data-k="municipality"]', modalRoot);
    function fillMun() {
      const dep = $('[data-k="department"]', modalRoot).value;
      const list = SDC_MUNICIPALITIES[dep] || [];
      mun.innerHTML =
        list
          .map(
            (m) =>
              `<option ${doc.municipality === m ? "selected" : ""}>${m}</option>`,
          )
          .join("") + "<option>Otro municipio</option>";
      if (!list.includes(doc.municipality))
        mun.value = list[0] || "Otro municipio";
      doc.department = dep;
      doc.municipality = mun.value;
    }
    fillMun();
    $('[data-k="company"]', modalRoot).value = doc.company || "Forza";
    $$(".bindDoc", modalRoot).forEach(
      (el) =>
        (el.oninput = el.onchange =
          () => {
            let v = el.value;
            if (el.dataset.k === "shipping" || el.dataset.k === "discount")
              v = +v || 0;
            if (el.dataset.k === "cod") v = v === "true";
            doc[el.dataset.k] = v;
            if (el.dataset.k === "department") fillMun();
            refreshQuoteUI(isSale);
          }),
    );
  }
  function renderPicker(isSale) {
    const list = $("#pickerList", modalRoot);
    let q = "",
      cat = "Todos";
    function draw() {
      const term = q.toLowerCase();
      const items = state.products.filter(
        (p) =>
          (cat === "Todos" ||
            parseTags(p.categories).some(
              (t) => t.toLowerCase() === cat.toLowerCase(),
            )) &&
          (!term ||
            [p.name, p.id, p.categories]
              .join(" ")
              .toLowerCase()
              .includes(term)),
      );
      list.innerHTML =
        items
          .map(
            (p) =>
              `<div class="picker-item"><img src="${escapeHtml(productImage(p))}" onerror="this.onerror=null;this.src='${escapeHtml(placeholderFor(p))}'"><div><b>${escapeHtml(p.name)}</b><span>${money(p.price)} · Stock ${num(p.stock)} · ${escapeHtml(firstTag(p))}</span></div><button class="btn small" data-additem="${escapeHtml(p.id)}">Agregar</button></div>`,
          )
          .join("") || '<div class="empty-state">Sin productos.</div>';
      $$("[data-additem]", list).forEach(
        (b) => (b.onclick = () => addDocItem(b.dataset.additem, isSale)),
      );
    }
    $("#pickSearch", modalRoot).oninput = (e) => {
      q = e.target.value;
      draw();
    };
    $$("[data-pickcat]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          cat = b.dataset.pickcat;
          $$("[data-pickcat]", modalRoot).forEach((x) =>
            x.classList.toggle("active", x === b),
          );
          draw();
        }),
    );
    draw();
  }
  function addDocItem(id, isSale) {
    const p = productById(id);
    if (!p) return;
    const doc = isSale ? saleDraft : quote;
    const found = doc.items.find((x) => x.id === id);
    if (found) found.qty++;
    else
      doc.items.push({
        id: p.id,
        name: p.name,
        price: +p.price || 0,
        cost: +p.cost || 0,
        qty: 1,
        image: productImage(p),
      });
    refreshQuoteUI(isSale);
    toast("Producto agregado.");
  }
  function refreshQuoteUI(isSale) {
    const doc = isSale ? saleDraft : quote;
    $("#cartList", modalRoot).innerHTML = doc.items.length
      ? doc.items
          .map(
            (it, i) =>
              `<div class="cart-row"><div><b>${escapeHtml(it.name)}</b><br><span>${escapeHtml(it.id)} · Total ${money(itemTotal(it))}</span></div><div class="line-edit"><label><span>Precio</span><input data-price="${i}" type="number" inputmode="decimal" value="${it.price}"></label><label><span>Cant.</span><div class="qtybox"><button data-dec="${i}">−</button><input data-qty="${i}" type="number" inputmode="numeric" value="${it.qty}"><button data-inc="${i}">+</button></div></label></div><button class="btn small danger" data-rem="${i}">×</button></div>`,
          )
          .join("")
      : '<div class="empty-state">Agrega productos para calcular.</div>';
    const c = calc(doc);
    $("#totalsMini", modalRoot).innerHTML =
      `<div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión</b><b>${money(c.commission)}</b></div><div class="summary-total"><b>Total</b><b>${money(c.total)}</b></div></div>`;
    $("#docPreview", modalRoot).innerHTML = docCard(doc, isSale);
    $$("[data-inc]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          doc.items[+b.dataset.inc].qty++;
          refreshQuoteUI(isSale);
        }),
    );
    $$("[data-dec]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          const it = doc.items[+b.dataset.dec];
          it.qty = Math.max(1, it.qty - 1);
          refreshQuoteUI(isSale);
        }),
    );
    $$("[data-rem]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          doc.items.splice(+b.dataset.rem, 1);
          refreshQuoteUI(isSale);
        }),
    );
    $$("[data-qty]", modalRoot).forEach(
      (inp) =>
        (inp.oninput = () => {
          doc.items[+inp.dataset.qty].qty = Math.max(1, +inp.value || 1);
          refreshQuoteUI(isSale);
        }),
    );
    $$("[data-price]", modalRoot).forEach(
      (inp) =>
        (inp.onchange = () => {
          doc.items[+inp.dataset.price].price = Math.max(0, +inp.value || 0);
          refreshQuoteUI(isSale);
        }),
    );
  }
  function openQuote(id) {
    currentView = "quote";
    if (!quote.items.length) quote = emptyQuote();
    if (id) addDocItemTo(quote, id);
    openModal(quoteModalHTML(false), true);
    bindQuoteCommon(false);
  }
  function openSale(id, fromDoc = null) {
    saleDraft = fromDoc ? SDCStore.clone(fromDoc) : emptySale();
    saleDraft.id = "SDC-" + Date.now().toString().slice(-10);
    if (id) addDocItemTo(saleDraft, id);
    openModal(quoteModalHTML(true), true);
    bindQuoteCommon(true);
  }
  function addDocItemTo(doc, id) {
    const p = productById(id);
    if (!p) return;
    const found = doc.items.find((x) => x.id === id);
    if (found) found.qty++;
    else
      doc.items.push({
        id: p.id,
        name: p.name,
        price: +p.price || 0,
        cost: +p.cost || 0,
        qty: 1,
        image: productImage(p),
      });
  }
  function bindQuoteCommon(isSale) {
    renderPicker(isSale);
    bindDocFields(isSale);
    refreshQuoteUI(isSale);
    $("#downloadDoc").onclick = () =>
      downloadDocImage(isSale ? "recibo" : "cotizacion");
    $("#waText").onclick = () => sendWhatsAppText(isSale);
    $("#waPhoto").onclick = () => shareDocPhoto(isSale);
    $("#printDoc") && ($("#printDoc").onclick = () => window.print());
    $("#saveQuote") &&
      ($("#saveQuote").onclick = () => {
        quote.date = new Date().toISOString();
        quote.saved = true;
        state.quotes.unshift(SDCStore.clone(quote));
        save();
        toast("Cotización guardada.");
      });
    $("#toSale") &&
      ($("#toSale").onclick = () => {
        if (!quote.items.length)
          return toast("Agrega productos antes de pasar a venta.");
        closeModal();
        openSale(null, quote);
      });
    $("#finishSale") && ($("#finishSale").onclick = finishSale);
  }
  function docCard(doc, isSale) {
    const c = calc(doc);
    const code = doc.id || "SDC";
    const date = new Date(doc.date || Date.now()).toLocaleString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `<div class="doc-wrap" id="printableDoc"><div class="doc-head"><div><span class="doc-pill">${isSale ? "Factura gamer · WhatsApp" : "Cotización · WhatsApp"}</span><h2>SD COMAYAGUA</h2><p>${isSale ? "Recibo" : "Cotización"} · ${date}</p><p><b>${escapeHtml(code)}</b></p></div><img class="doc-logo" src="assets/logo-sdc.png" alt="Logo"></div><div class="doc-fields"><div class="doc-field"><span>Cliente</span><b>${escapeHtml(doc.client || "Cliente")}</b></div><div class="doc-field"><span>Teléfono</span><b>${escapeHtml(doc.phone || "No registrado")}</b></div><div class="doc-field"><span>Departamento</span><b>${escapeHtml(doc.department || "No seleccionado")}</b></div><div class="doc-field"><span>Municipio</span><b>${escapeHtml(doc.municipality || "No seleccionado")}</b></div>${doc.reference ? `<div class="doc-field wide"><span>Referencia / barrio / colonia</span><b>${escapeHtml(doc.reference)}</b></div>` : ""}</div><table class="doc-table"><thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Total</th></tr></thead><tbody>${doc.items.map((it) => `<tr><td><div class="doc-product"><img src="${escapeHtml(it.image || SDC_PLACEHOLDERS.default)}" onerror="this.onerror=null;this.src='${SDC_PLACEHOLDERS.default}'"><div>${escapeHtml(it.name)}<br><span style="color:#718191">${escapeHtml(it.id)}</span></div></div></td><td class="num">${num(it.qty)}</td><td class="num">${money(it.price)}</td><td class="num">${money(itemTotal(it))}</td></tr>`).join("") || '<tr><td colspan="4">Sin productos agregados</td></tr>'}</tbody></table><div class="summary"><div class="summary-row"><b>Productos</b><b>${money(c.products)}</b></div><div class="summary-row"><b>Envío</b><b>${money(c.shipping)}</b></div><div class="summary-row"><b>Comisión por pagar al recibir</b><b>${money(c.commission)}</b></div><div class="summary-row"><b>Total envío</b><b>${money(c.delivery)}</b></div><div class="summary-row"><b>Descuento</b><b>${money(c.discount)}</b></div><div class="summary-total"><b>${isSale ? "Total" : "Total cotizado"}</b><b>${money(c.total)}</b></div></div><div class="delivery-box"><b>Empresa / entrega:</b> ${escapeHtml(doc.company || "No seleccionada")}${doc.cod ? " · Pagar al recibir con comisión de empresa" : ""}</div><p class="doc-note">${isSale ? "Gracias por comprar en SD Comayagua." : "Cotización informativa. La venta se registra únicamente al pasarla a factura real."}<br>SD Comayagua · WhatsApp +504 3151-7755</p></div>`;
  }
  function whatsappText(doc, isSale) {
    const c = calc(doc);
    const date = new Date(doc.date || Date.now()).toLocaleString("es-HN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    return `🧾 *${isSale ? "RECIBO" : "COTIZACIÓN"} SD COMAYAGUA*\n\n📌 *Código:* ${doc.id}\n📅 *Fecha:* ${date}\n\n👤 *Cliente:* ${doc.client || "Cliente"}\n📞 *Teléfono:* ${doc.phone || "No registrado"}\n🏷️ *Departamento:* ${doc.department || "No seleccionado"}\n📍 *Municipio:* ${doc.municipality || "No seleccionado"}${doc.reference ? `\n🏠 *Referencia:* ${doc.reference}` : ""}\n\n🛒 *PRODUCTOS*\n${doc.items.map((it) => `• ${it.name}\n  Cantidad: ${it.qty}\n  Precio: ${money(it.price)}\n  Total: ${money(itemTotal(it))}`).join("\n")}\n\n🚚 *ENVÍO*\nEmpresa / entrega: ${doc.company || "No seleccionada"}\nEnvío: ${money(c.shipping)}\nComisión por pagar al recibir: ${money(c.commission)}\nTotal envío: ${money(c.delivery)}\n\n💰 *RESUMEN*\nProductos: ${money(c.products)}\nDescuento: ${money(c.discount)}\n*TOTAL A PAGAR: ${money(c.total)}*\n\nSD COMAYAGUA.\nWhatsApp: +504 3151-7755`;
  }
  function waUrl(phone, text) {
    const p = cleanPhone(phone);
    return p
      ? `https://wa.me/${p.length === 8 ? "504" + p : p}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
  }
  function currentDoc(isSale) {
    return isSale ? saleDraft : quote;
  }
  function chooseWaPhone(doc) {
    const storeLast = cleanPhone(state.settings.whatsappNumber || "").slice(-8);
    const current = cleanPhone(doc.phone || "").slice(-8);
    if (!current || current === storeLast) {
      const typed = prompt(
        "Número WhatsApp del cliente. Déjalo vacío para elegir el chat manualmente en WhatsApp:",
        current === storeLast ? "" : doc.phone || "",
      );
      if (typed === null) return null;
      doc.phone = typed.trim();
      refreshQuoteUI(doc.kind === "receipt" || doc === saleDraft);
    }
    return doc.phone || "";
  }
  function sendWhatsAppText(isSale) {
    const doc = currentDoc(isSale);
    if (!doc.items.length) return toast("Agrega productos primero.");
    const phone = chooseWaPhone(doc);
    if (phone === null) return;
    window.open(waUrl(phone, whatsappText(doc, isSale)), "_blank");
  }
  async function docToBlob() {
    const el = $("#printableDoc", modalRoot);
    if (!window.html2canvas) {
      window.print();
      return null;
    }
    const canvas = await html2canvas(el, {
      backgroundColor: "#eaf5f9",
      scale: 2,
      useCORS: true,
    });
    return new Promise((res) => canvas.toBlob(res, "image/png", 0.98));
  }
  async function downloadDocImage(name = "documento") {
    const blob = await docToBlob();
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}-sd-comayagua.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Imagen descargada.");
  }
  async function shareDocPhoto(isSale) {
    const doc = currentDoc(isSale);
    const phone = chooseWaPhone(doc);
    if (phone === null) return;
    const blob = await docToBlob();
    const text = whatsappText(doc, isSale);
    if (blob && navigator.canShare) {
      const file = new File(
        [blob],
        `${isSale ? "recibo" : "cotizacion"}-sd-comayagua.png`,
        { type: "image/png" },
      );
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text });
          return;
        } catch (e) {}
      }
    }
    if (blob) await downloadDocImage(isSale ? "recibo" : "cotizacion");
    window.open(waUrl(phone, text), "_blank");
    toast("Se descargó la imagen y se abrió WhatsApp.");
  }
  function finishSale() {
    if (!saleDraft.items.length) return toast("Agrega productos primero.");
    const c = calc(saleDraft);
    saleDraft.date = new Date().toISOString();
    saleDraft.total = c.total;
    const editingId = saleDraft._editingId;
    const originalItems = saleDraft._originalItems || [];
    const cleanSale = SDCStore.clone(saleDraft);
    delete cleanSale._editingId;
    delete cleanSale._originalItems;
    if (editingId) {
      const ids = new Set([
        ...originalItems.map((it) => it.id),
        ...cleanSale.items.map((it) => it.id),
      ]);
      ids.forEach((pid) => {
        const oldQty = originalItems
          .filter((it) => it.id === pid)
          .reduce((a, it) => a + (+it.qty || 0), 0);
        const newQty = cleanSale.items
          .filter((it) => it.id === pid)
          .reduce((a, it) => a + (+it.qty || 0), 0);
        const p = productById(pid);
        if (p) p.stock = Math.max(0, (+p.stock || 0) - (newQty - oldQty));
      });
      const ix = state.sales.findIndex((s) => s.id === editingId);
      if (ix >= 0) state.sales[ix] = cleanSale;
      else state.sales.unshift(cleanSale);
      SDCStore.saveBackup(state, "Factura actualizada");
      toast("Factura actualizada y caja guardada.");
    } else {
      state.sales.unshift(cleanSale);
      cleanSale.items.forEach((it) => {
        const p = productById(it.id);
        if (p) p.stock = Math.max(0, (+p.stock || 0) - (+it.qty || 0));
      });
      SDCStore.saveBackup(state, "Venta registrada");
      toast("Venta finalizada y recibo guardado.");
    }
    state.lastReceipt = SDCStore.clone(cleanSale);
    save();
    refreshQuoteUI(true);
    render();
  }

  function openBackup() {
    openModal(
      `<div class="modal-head"><h3>Backup de datos</h3><button class="close">×</button></div><div class="modal-body"><div class="card-box"><h4>Exportar / importar</h4><p style="color:#b8c8d8">Guarda este archivo antes de borrar o subir una versión nueva.</p><div class="modal-actions" style="position:static"><button class="btn" id="exportBackup">Descargar backup JSON</button><label class="btn secondary">Importar backup<input id="importBackup" type="file" accept="application/json" hidden></label><button class="btn ghost" id="manualBackup">Guardar copia local</button></div></div><div class="card-box"><h4>Copias locales</h4><div id="backupList"></div></div></div>`,
      true,
    );
    function draw() {
      const b = SDCStore.listBackups();
      $("#backupList").innerHTML =
        b
          .map(
            (x) =>
              `<div class="cart-row"><div><b>${escapeHtml(x.label)}</b><br><span>${new Date(x.date).toLocaleString("es-HN")}</span></div><button class="btn small secondary" data-restore="${x.id}">Restaurar</button></div>`,
          )
          .join("") || '<div class="empty-state">Sin copias locales.</div>';
      $$("[data-restore]", modalRoot).forEach(
        (btn) =>
          (btn.onclick = () => {
            state = SDCStore.restoreBackup(btn.dataset.restore) || state;
            closeModal();
            render();
            toast("Backup restaurado.");
          }),
      );
    }
    draw();
    $("#exportBackup").onclick = () => {
      const blob = new Blob([SDCStore.exportData(state)], {
        type: "application/json",
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "backup-sd-comayagua.json";
      a.click();
    };
    $("#manualBackup").onclick = () => {
      SDCStore.saveBackup(state, "Backup manual");
      draw();
      toast("Copia local guardada.");
    };
    $("#importBackup").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          state = SDCStore.importData(r.result);
          closeModal();
          render();
          toast("Backup importado.");
        } catch (err) {
          toast("No se pudo importar.");
        }
      };
      r.readAsText(f);
    };
  }
  function openProfit() {
    const rows = state.products.map((p) => ({
      p,
      profit: (+p.price || 0) - (+p.cost || 0),
      total: ((+p.price || 0) - (+p.cost || 0)) * (+p.stock || 0),
    }));
    openModal(
      `<div class="modal-head"><h3>Ganancias</h3><button class="close">×</button></div><div class="modal-body"><table class="profit-table"><thead><tr><th>Producto</th><th>C/U</th><th>Stock</th><th>Total</th></tr></thead><tbody>${rows.map((r) => `<tr><td>${escapeHtml(r.p.name)}</td><td>${money(r.profit)}</td><td>${num(r.p.stock)}</td><td>${money(r.total)}</td></tr>`).join("")}</tbody></table></div>`,
      true,
    );
  }
  function openReceipts() {
    openModal(
      `<div class="modal-head"><h3>Caja / recibos</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${state.sales.map((s) => `<div class="cart-row"><div><b>${escapeHtml(s.client || "Cliente")}</b><br><span>${escapeHtml(s.id)} · ${money(s.total || calc(s).total)}</span></div><button class="btn small secondary" data-openreceipt="${s.id}">Ver</button></div>`).join("") || '<div class="empty-state">Todavía no hay ventas registradas.</div>'}</div></div>`,
      true,
    );
    $$("[data-openreceipt]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          const s = state.sales.find((x) => x.id === b.dataset.openreceipt);
          if (s) {
            saleDraft = SDCStore.clone(s);
            saleDraft._editingId = s.id;
            saleDraft._originalItems = SDCStore.clone(s.items || []);
            openModal(quoteModalHTML(true), true);
            bindQuoteCommon(true);
          }
        }),
    );
  }
  function openNoCost() {
    openModal(
      `<div class="modal-head"><h3>Productos sin costo</h3><button class="close">×</button></div><div class="modal-body"><div class="cart-list">${
        state.products
          .filter((p) => +p.cost <= 0)
          .map(
            (p) =>
              `<div class="cart-row"><div><b>${escapeHtml(p.name)}</b><br><span>${escapeHtml(p.id)}</span></div><button class="btn small secondary" data-editcost="${p.id}">Editar</button></div>`,
          )
          .join("") ||
        '<div class="empty-state">Todo tiene costo registrado.</div>'
      }</div></div>`,
      true,
    );
    $$("[data-editcost]", modalRoot).forEach(
      (b) =>
        (b.onclick = () => {
          closeModal();
          openProductEditor(b.dataset.editcost);
        }),
    );
  }

  $("#goTop").onclick = () => window.scrollTo({ top: 0, behavior: "smooth" });
  window.addEventListener(
    "scroll",
    () => ($("#goTop").style.display = scrollY > 320 ? "block" : "none"),
  );
  render();
})();
