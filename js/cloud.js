(function(){
  function clone(x){return JSON.parse(JSON.stringify(x||{}));}
  function cleanUrl(url){return String(url||'').trim().replace(/\?$/,'');}
  function jsonSafe(raw,fallback){try{return JSON.parse(raw)}catch(e){return fallback}}
  function configured(state){return !!cleanUrl(state?.settings?.syncUrl);}
  function endpoint(state, action){
    const url = cleanUrl(state?.settings?.syncUrl);
    const pin = encodeURIComponent(String(state?.settings?.syncPin||''));
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}action=${encodeURIComponent(action)}&pin=${pin}&t=${Date.now()}`;
  }
  function keyOf(item, i){return String(item?.id || item?.key || item?.codigo || item?.phone || item?.name || item?.client || `row-${i}`);}
  function rowTime(item){
    const v = item?.updatedAt || item?.lastUpdated || item?.date || item?.lastDate || item?.createdAt || '';
    const n = Date.parse(v);
    return Number.isFinite(n) ? n : 0;
  }
  function mergeArray(localArr, remoteArr){
    const map = new Map();
    (remoteArr||[]).forEach((x,i)=>map.set(keyOf(x,i), clone(x)));
    (localArr||[]).forEach((x,i)=>{
      const k = keyOf(x,i);
      const old = map.get(k);
      if(!old){ map.set(k, clone(x)); return; }
      const lt = rowTime(x), rt = rowTime(old);
      // If rows don't have dates, prefer the local edit because it is the device currently saving.
      map.set(k, (!rt || lt>=rt) ? Object.assign({}, old, clone(x)) : old);
    });
    return Array.from(map.values());
  }
  function mergeStates(local, remote){
    if(!remote || !remote.products) return clone(local);
    const out = Object.assign({}, clone(remote), clone(local));
    ['products','sales','quotes','clients','closings','expenses','chats','catalogs'].forEach(k=>{
      out[k] = mergeArray(local?.[k]||[], remote?.[k]||[]);
    });
    out.settings = Object.assign({}, remote.settings||{}, local.settings||{});
    out.unlocked = !!local.unlocked;
    out.version = Math.max(Number(local.version||0), Number(remote.version||0), 93);
    return out;
  }
  async function getJSON(state, action){
    const res = await fetch(endpoint(state, action), {method:'GET', cache:'no-store'});
    const txt = await res.text();
    const data = jsonSafe(txt, null);
    if(!res.ok || !data || data.ok===false) throw new Error(data?.error || `Error HTTP ${res.status}`);
    return data;
  }
  async function postJSON(state, action, payload){
    const body = JSON.stringify({action, pin:String(state?.settings?.syncPin||''), payload});
    const res = await fetch(cleanUrl(state?.settings?.syncUrl), {
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body,
      cache:'no-store'
    });
    const txt = await res.text();
    const data = jsonSafe(txt, null);
    if(!res.ok || !data || data.ok===false) throw new Error(data?.error || `Error HTTP ${res.status}`);
    return data;
  }
  async function ping(state){return getJSON(state,'ping');}
  async function pull(state){const data = await getJSON(state,'load'); return data.state || null;}
  async function push(state, label='sync'){
    const clean = clone(state);
    clean.unlocked = false;
    clean.settings = Object.assign({}, clean.settings||{}, {syncPin:'', accessKey: clean.settings?.accessKey || ''});
    return postJSON(state,'save',{label, state:clean});
  }
  async function backup(state, label='backup'){
    const clean = clone(state);
    clean.unlocked = false;
    clean.settings = Object.assign({}, clean.settings||{}, {syncPin:'', accessKey: clean.settings?.accessKey || ''});
    return postJSON(state,'backup',{label, state:clean});
  }
  window.SDCCloud={configured, mergeStates, ping, pull, push, backup};
})();
