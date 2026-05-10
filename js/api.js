// SD COMAYAGUA · cliente Apps Script robusto
(function(){
  function cfg(){ return window.SDC_CONFIG || {}; }
  function cleanUrl(){
    let url = String(cfg().appsScriptUrl || '').trim().replace(/\s+/g,'');
    if (/^script\.google\.com/i.test(url)) url = 'https://' + url;
    return url;
  }
  function ready(){ return /^https:\/\/script\.google\.com\/macros\/s\//.test(cleanUrl()); }
  function withParams(params){
    const url = new URL(cleanUrl());
    Object.entries(params || {}).forEach(([k,v]) => {
      if (v !== undefined && v !== null && String(v) !== '') url.searchParams.set(k, v);
    });
    return url.toString();
  }
  async function parseJson(res){
    const text = await res.text();
    try { return JSON.parse(text); }
    catch(e){ throw new Error('Apps Script no devolvió JSON válido. Respuesta: ' + text.slice(0,180)); }
  }
  async function get(resource){
    if (!ready()) throw new Error('URL de Apps Script inválida.');
    const url = withParams({ action:resource, only:resource, resource, key:cfg().apiKey || '' });
    const res = await fetch(url, { method:'GET', cache:'no-store', redirect:'follow' });
    if (!res.ok) throw new Error('Apps Script respondió HTTP ' + res.status);
    return parseJson(res);
  }
  async function post(action, payload){
    if (!ready()) throw new Error('URL de Apps Script inválida.');
    const body = { action, key:cfg().apiKey || '', ...(payload || {}) };
    const res = await fetch(cleanUrl(), {
      method:'POST',
      headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body:JSON.stringify(body),
      redirect:'follow'
    });
    if (!res.ok) throw new Error('Apps Script respondió HTTP ' + res.status);
    return parseJson(res);
  }
  async function test(){ return get('test'); }
  window.SDCApi = { ready, get, post, test, url:cleanUrl };
})();
