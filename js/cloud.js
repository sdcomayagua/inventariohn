(function(){
  const cfg = window.SDC_CONFIG;
  function getCloudConfig(){
    try { return Object.assign({url:cfg.defaultAppsScriptUrl,pin:''}, JSON.parse(localStorage.getItem(cfg.cloudKey)||'{}')); }
    catch(e){ return {url:cfg.defaultAppsScriptUrl,pin:''}; }
  }
  function saveCloudConfig(data){
    const next = Object.assign(getCloudConfig(), data||{});
    localStorage.setItem(cfg.cloudKey, JSON.stringify(next));
    return next;
  }
  function cleanUrl(url){ return String(url||'').trim().replace(/\/$/,''); }
  function jsonp(action, params){
    return new Promise((resolve,reject)=>{
      const conf=getCloudConfig();
      const base=cleanUrl(conf.url);
      if(!base) return reject(new Error('Falta URL de Apps Script'));
      const cb='SDC_CB_'+Date.now()+'_'+Math.floor(Math.random()*99999);
      const url=new URL(base);
      url.searchParams.set('action',action);
      url.searchParams.set('callback',cb);
      url.searchParams.set('pin',conf.pin||'');
      Object.entries(params||{}).forEach(([k,v])=>url.searchParams.set(k,v));
      const script=document.createElement('script');
      const timer=setTimeout(()=>{ cleanup(); reject(new Error('La nube no respondió. Revisá URL, permisos o PIN.')); },14000);
      function cleanup(){ clearTimeout(timer); delete window[cb]; script.remove(); }
      window[cb]=(data)=>{ cleanup(); data&&data.ok ? resolve(data) : reject(new Error((data&&data.message)||'Respuesta de nube inválida')); };
      script.onerror=()=>{ cleanup(); reject(new Error('No se pudo contactar Apps Script.')); };
      script.src=url.toString();
      document.body.appendChild(script);
    });
  }
  function formPost(action, state){
    return new Promise((resolve,reject)=>{
      const conf=getCloudConfig();
      const base=cleanUrl(conf.url);
      if(!base) return reject(new Error('Falta URL de Apps Script'));
      const frameName='sdc_cloud_frame_'+Date.now();
      const iframe=document.createElement('iframe');
      iframe.name=frameName; iframe.style.display='none';
      const form=document.createElement('form');
      form.method='POST'; form.action=base; form.target=frameName; form.style.display='none';
      const fields={action, pin:conf.pin||'', payload:JSON.stringify(state||{})};
      Object.entries(fields).forEach(([k,v])=>{ const input=document.createElement('textarea'); input.name=k; input.value=v; form.appendChild(input); });
      let done=false;
      const timer=setTimeout(()=>{ if(!done){ done=true; cleanup(); resolve({ok:true,message:'Enviado a nube. Si el PIN es correcto, quedó guardado.'}); } },3500);
      function cleanup(){ clearTimeout(timer); setTimeout(()=>{iframe.remove(); form.remove();},800); }
      iframe.onload=()=>{ if(!done){ done=true; cleanup(); resolve({ok:true,message:'Acción enviada a Google Sheets.'}); } };
      document.body.appendChild(iframe); document.body.appendChild(form); form.submit();
    });
  }
  window.SDCCloud = {
    getCloudConfig, saveCloudConfig,
    ping:()=>jsonp('ping'),
    load:()=>jsonp('load'),
    publicLoad:()=>jsonp('public'),
    save:(state)=>formPost('save',state),
    backup:(state)=>formPost('backup',state)
  };
})();
