(function(){
  const cfg = window.SDC_CONFIG;
  const sampleProducts = [
    {id:'P-DED-V1',nombre:'Dedales Gamer V1',categoria:'Gamer',precio:25,costo:12,stock:20,activo:true,imagen:'',descripcion:'Dedales para jugar en celular con mejor deslizamiento, comodidad y precisión. Ideales para Free Fire, PUBG Mobile, Call of Duty Mobile y otros juegos táctiles.',promos:'1:25 | 3:69 | 6:132 | 8:168 | 10:200 | 12:240 | 20:400'},
    {id:'P-TRIGGER',nombre:'Trigger / Gatillos para Celular',categoria:'Gamer',precio:150,costo:90,stock:8,activo:true,imagen:'',descripcion:'Gatillos para mejorar la reacción en juegos móviles. Diseño compacto, cómodo y práctico para partidas rápidas.',promos:''},
    {id:'P-QKZ',nombre:'Audífonos QKZ',categoria:'Audio',precio:250,costo:160,stock:6,activo:true,imagen:'',descripcion:'Audífonos con sonido claro, buen volumen y diseño cómodo para música, llamadas y juegos.',promos:''}
  ];
  function defaultState(){
    return {
      productos: sampleProducts,
      ventas: [], cotizaciones: [], clientes: [], gastos: [], chats: [], catalogos: [],
      ajustes: {envioNormal:110, envioRecibirBase:100, comisionRecibir:6, whatsapp:cfg.whatsapp, tienda:cfg.storeName},
      meta: {createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), lastBackup:''}
    };
  }
  function load(){
    try{ const raw=localStorage.getItem(cfg.storageKey); return raw ? normalize(JSON.parse(raw)) : defaultState(); }
    catch(e){ console.error(e); return defaultState(); }
  }
  function save(state){ state.meta=state.meta||{}; state.meta.updatedAt=new Date().toISOString(); localStorage.setItem(cfg.storageKey, JSON.stringify(state)); }
  function normalize(state){
    const base = defaultState();
    const merged = Object.assign(base, state || {});
    merged.ajustes = Object.assign(base.ajustes, (state&&state.ajustes)||{});
    merged.meta = Object.assign(base.meta, (state&&state.meta)||{});
    ['productos','ventas','cotizaciones','clientes','gastos','chats','catalogos'].forEach(k=>{ if(!Array.isArray(merged[k])) merged[k]=[]; });
    return merged;
  }
  function exportJson(state){
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'respaldo-sd-comayagua-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  window.SDCStorage = {defaultState, load, save, normalize, exportJson};
})();
