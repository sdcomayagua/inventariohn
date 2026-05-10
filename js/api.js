window.SDCApi = (() => {
  const cleanUrl = () => String(window.SDC_CONFIG?.appsScriptUrl || '').trim().replace(/\s+/g, '');
  const ready = () => /^https:\/\/script\.google\.com\/macros\/s\//.test(cleanUrl());

  function withTimeout(ms = 18000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return { signal:ctrl.signal, done:() => clearTimeout(timer) };
  }
  async function parseJsonResponse(res) {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch(err) { throw new Error('Apps Script no devolvió JSON válido. Revise que el despliegue sea Web App /exec y acceso público.'); }
  }

  async function get(action = 'all', params = {}) {
    if (!ready()) return { ok:false, offline:true, message:'Apps Script no configurado.' };
    const url = new URL(cleanUrl());
    url.searchParams.set('action', action);
    // Compatibilidad con backends anteriores que usaban ?only=productos o ?resource=products.
    if (action === 'products') { url.searchParams.set('only', 'productos'); url.searchParams.set('resource', 'products'); }
    if (action === 'all') { url.searchParams.set('only', 'all'); url.searchParams.set('resource', 'all'); }
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const t = withTimeout();
    try {
      const res = await fetch(url.toString(), { method:'GET', redirect:'follow', cache:'no-store', signal:t.signal });
      const data = await parseJsonResponse(res);
      if (data && data.ok === false) throw new Error(data.message || 'Error leyendo Apps Script');
      return data;
    } finally { t.done(); }
  }

  async function post(action, payload = {}) {
    if (!ready()) return { ok:false, offline:true, message:'Apps Script no configurado.' };
    const body = JSON.stringify({ action, apiKey: window.SDC_CONFIG.apiKey, ...payload });
    const t = withTimeout(22000);
    try {
      const res = await fetch(cleanUrl(), {
        method:'POST',
        redirect:'follow',
        headers:{ 'Content-Type':'text/plain;charset=utf-8' },
        body,
        signal:t.signal
      });
      const data = await parseJsonResponse(res);
      if (data && data.ok === false) throw new Error(data.message || 'Error guardando en Apps Script');
      return data;
    } finally { t.done(); }
  }

  return { ready, get, post };
})();
