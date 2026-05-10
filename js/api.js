window.SDCApi = (() => {
  const cleanUrl = () => String(window.SDC_CONFIG?.appsScriptUrl || '').trim();
  const ready = () => /^https:\/\/script\.google\.com\/macros\/s\//.test(cleanUrl());

  async function get(action = 'all', params = {}) {
    if (!ready()) return { ok:false, offline:true, message:'Apps Script no configurado.' };
    const url = new URL(cleanUrl());
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { method:'GET', redirect:'follow', cache:'no-store' });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error leyendo Apps Script');
    return data;
  }

  async function post(action, payload = {}) {
    if (!ready()) return { ok:false, offline:true, message:'Apps Script no configurado.' };
    const body = JSON.stringify({ action, apiKey: window.SDC_CONFIG.apiKey, ...payload });
    const res = await fetch(cleanUrl(), {
      method:'POST',
      redirect:'follow',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || 'Error guardando en Apps Script');
    return data;
  }

  return { ready, get, post };
})();
