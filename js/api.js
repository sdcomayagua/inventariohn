window.SDCApi = (() => {
  const cleanUrl = () => String(window.SDC_CONFIG?.appsScriptUrl || '').trim().replace(/\s+/g, '');
  const ready = () => /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:$|[?#])/.test(cleanUrl());

  function withTimeout(ms = 18000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    return { signal:ctrl.signal, done:() => clearTimeout(timer) };
  }

  function buildUrl(params = {}) {
    const url = new URL(cleanUrl());
    Object.entries(params).forEach(([k,v]) => {
      if (v !== undefined && v !== null && String(v) !== '') url.searchParams.set(k, v);
    });
    url.searchParams.set('_sdc', Date.now().toString());
    return url.toString();
  }

  async function parseJsonResponse(res) {
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); }
    catch(err) {
      const preview = String(text || '').replace(/\s+/g, ' ').slice(0, 180);
      if (preview.includes('Sign in') || preview.includes('Iniciar sesión') || preview.includes('<html')) {
        throw new Error('Apps Script respondió con una página HTML, no JSON. Revise que el despliegue sea Web App y acceso: Cualquier usuario.');
      }
      throw new Error(`Apps Script no devolvió JSON válido. Respuesta: ${preview || 'vacía'}`);
    }
    if (!res.ok) throw new Error(data?.message || `Apps Script respondió HTTP ${res.status}.`);
    if (data && data.ok === false) throw new Error(data.message || 'Apps Script devolvió ok:false.');
    return data;
  }

  async function fetchJson(params = {}, timeout = 18000) {
    const t = withTimeout(timeout);
    try {
      const res = await fetch(buildUrl(params), {
        method:'GET',
        redirect:'follow',
        cache:'no-store',
        signal:t.signal,
        headers:{ 'Accept':'application/json,text/plain,*/*' }
      });
      return await parseJsonResponse(res);
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('Apps Script tardó demasiado en responder. Revise conexión, despliegue o permisos.');
      if (/Failed to fetch|NetworkError|Load failed/i.test(String(err?.message || err))) {
        throw new Error('El navegador no pudo leer Apps Script. Revise que la URL termine en /exec y que el acceso sea “Cualquier usuario”.');
      }
      throw err;
    } finally { t.done(); }
  }

  async function get(action = 'all', params = {}) {
    if (!ready()) return { ok:false, offline:true, message:'Apps Script no configurado o URL /exec inválida.' };
    const actionClean = String(action || 'all').toLowerCase();
    const attempts = [];
    if (actionClean === 'products') {
      attempts.push(
        { action:'products', only:'productos', resource:'products' },
        { action:'productos' },
        { only:'productos' },
        { resource:'products' },
        {}
      );
    } else if (actionClean === 'all') {
      attempts.push(
        { action:'all', only:'all', resource:'all' },
        {},
        { action:'products', only:'productos', resource:'products' }
      );
    } else {
      attempts.push({ action:actionClean }, { only:actionClean }, { resource:actionClean });
    }

    let lastError;
    for (const base of attempts) {
      try { return await fetchJson({ ...base, ...params }); }
      catch (err) { lastError = err; }
    }
    throw lastError || new Error('No se pudo leer Apps Script.');
  }

  async function test() {
    if (!ready()) throw new Error('URL inválida. Pegue el enlace completo que termina en /exec.');
    return fetchJson({ action:'ping' }, 12000);
  }

  async function post(action, payload = {}) {
    if (!ready()) return { ok:false, offline:true, message:'Apps Script no configurado.' };
    const body = JSON.stringify({ action, apiKey: window.SDC_CONFIG.apiKey, ...payload });
    const t = withTimeout(22000);
    try {
      const res = await fetch(cleanUrl(), {
        method:'POST',
        redirect:'follow',
        headers:{ 'Content-Type':'text/plain;charset=utf-8', 'Accept':'application/json,text/plain,*/*' },
        body,
        signal:t.signal
      });
      return await parseJsonResponse(res);
    } catch (err) {
      if (err?.name === 'AbortError') throw new Error('Apps Script tardó demasiado guardando.');
      if (/Failed to fetch|NetworkError|Load failed/i.test(String(err?.message || err))) {
        throw new Error('No se pudo enviar a Apps Script. Revise URL /exec, acceso público y despliegue.');
      }
      throw err;
    } finally { t.done(); }
  }

  return { ready, get, post, test, cleanUrl };
})();
