/* v335 · Crear producto, Muestra, Agotado persistente y retoques del detalle.
   Diseñado como capa de compatibilidad sobre la app actual. */
(function(){
  'use strict';
  var scheduled=false;
  var uiReady=false;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }
  function setImp(el, prop, value){ if(el && el.style) el.style.setProperty(prop,value,'important'); }
  function toast(msg){
    var el=document.getElementById('toast');
    if(!el) return alert(msg);
    el.textContent=msg;
    el.classList.add('show');
    clearTimeout(el._sdc335Timer);
    el._sdc335Timer=setTimeout(function(){el.classList.remove('show');},2800);
  }
  function slug(s){ return String(s||'producto').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toUpperCase().slice(0,70) || ('SDC-'+Date.now()); }
  function moneyToNumber(v){ var n=Number(String(v||'').replace(/[^0-9.-]/g,'')); return Number.isFinite(n)?n:0; }
  function isMobile(){ return matchMedia('(max-width: 760px)').matches; }

  function ensureFirebaseLoaded(){
    return new Promise(function(resolve){
      if(window.guardarProductoFirebase) return resolve(true);
      try{ window.sdcLoadFirebaseNow && window.sdcLoadFirebaseNow(); }catch(e){}
      var tries=0;
      var timer=setInterval(function(){
        if(window.guardarProductoFirebase || ++tries>50){ clearInterval(timer); resolve(!!window.guardarProductoFirebase); }
      },120);
    });
  }

  function parseVariants(value, fallbackStock){
    var raw=String(value||'').trim();
    if(!raw){ return [{nombre:'General', stock:Math.max(0, Math.floor(moneyToNumber(fallbackStock)))}]; }
    return raw.split(/[|;\n,]+/).map(function(part){
      var p=part.trim();
      if(!p) return null;
      var bits=p.split(/[:=]/);
      var name=(bits[0]||'General').trim() || 'General';
      var stock=bits.length>1 ? moneyToNumber(bits.slice(1).join('=')) : moneyToNumber(fallbackStock);
      return {nombre:name, stock:Math.max(0,Math.floor(stock))};
    }).filter(Boolean);
  }

  function openCreateProductModal(){
    if(document.querySelector('.sdc335-product-modal')) return;
    var overlay=document.createElement('div');
    overlay.className='sdc335-product-modal';
    overlay.innerHTML=''+
      '<div class="sdc335-product-box" role="dialog" aria-modal="true" aria-label="Crear producto">'+
        '<div class="sdc335-product-head"><h2>Crear nuevo producto</h2><button class="sdc335-close" type="button" aria-label="Cerrar">×</button></div>'+
        '<form class="sdc335-form">'+
          '<div class="sdc335-field"><label>Nombre</label><input name="nombre" required placeholder="Ej. Memoria USB 128GB"></div>'+
          '<div class="sdc335-field"><label>Código / SKU</label><input name="codigo" placeholder="Se genera si lo dejás vacío"></div>'+
          '<div class="sdc335-field"><label>Categoría</label><input name="categoria" required placeholder="Ej. Memorias USB"></div>'+
          '<div class="sdc335-field"><label>Precio venta</label><input name="precio" inputmode="decimal" required placeholder="Ej. 250"></div>'+
          '<div class="sdc335-field"><label>Costo compra</label><input name="costo" inputmode="decimal" placeholder="Ej. 180"></div>'+
          '<div class="sdc335-field"><label>Stock real</label><input name="stock" inputmode="numeric" value="1"></div>'+
          '<div class="sdc335-field sdc335-full"><label>Colores / variantes</label><input name="variantes" placeholder="General=1 | Azul=3 | Rojo=2"></div>'+
          '<div class="sdc335-field sdc335-full"><label>Imagen URL</label><input name="img" placeholder="https://..."></div>'+
          '<div class="sdc335-field sdc335-full"><label>Promos</label><input name="promos" placeholder="1=250 | 2=480 | 3=700"></div>'+
          '<div class="sdc335-field sdc335-full"><label>Descripción</label><textarea name="descripcion" placeholder="Descripción corta del producto"></textarea></div>'+
          '<label class="sdc335-check"><input type="checkbox" name="muestra"><span>Solo muestra / para cotizar<small>No cuenta como inventario real ni inversión. Sirve para productos que comprás solo cuando el cliente confirma.</small></span></label>'+
          '<div class="sdc335-actions"><button class="sdc335-save" type="submit">Guardar en Firebase</button><button class="sdc335-cancel" type="button">Cancelar</button></div>'+
        '</form>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('[name="nombre"]').focus();
    overlay.addEventListener('click',function(ev){ if(ev.target===overlay || ev.target.closest('.sdc335-close,.sdc335-cancel')) overlay.remove(); });
    overlay.querySelector('form').addEventListener('submit',async function(ev){
      ev.preventDefault();
      var fd=new FormData(ev.currentTarget);
      var nombre=String(fd.get('nombre')||'').trim();
      var categoria=String(fd.get('categoria')||'').trim() || 'General';
      var muestra=fd.get('muestra')==='on';
      var stock=moneyToNumber(fd.get('stock'));
      var producto={
        codigo:String(fd.get('codigo')||'').trim() || ('SDC-'+slug(categoria)+'-'+Date.now()),
        nombre:nombre,
        name:nombre,
        categoria:categoria,
        categorias:categoria,
        precio:moneyToNumber(fd.get('precio')),
        price:moneyToNumber(fd.get('precio')),
        costo:moneyToNumber(fd.get('costo')),
        cost:moneyToNumber(fd.get('costo')),
        stock:muestra ? 0 : stock,
        stock_inicial:muestra ? 0 : stock,
        variantes:muestra ? parseVariants(fd.get('variantes'), 0).map(function(v){v.stock=0;return v;}) : parseVariants(fd.get('variantes'), stock),
        img:String(fd.get('img')||'').trim(),
        image:String(fd.get('img')||'').trim(),
        promos:String(fd.get('promos')||'').trim(),
        descripcion:String(fd.get('descripcion')||'').trim(),
        muestra:muestra,
        soloMuestra:muestra,
        sample:muestra,
        tipoInventario:muestra?'muestra':'inventario',
        estado:muestra?'muestra':'disponible',
        active:true,
        activo:true
      };
      if(!producto.nombre || !producto.precio){ return toast('Falta nombre o precio.'); }
      overlay.querySelector('.sdc335-save').disabled=true;
      overlay.querySelector('.sdc335-save').textContent='Guardando...';
      var ready=await ensureFirebaseLoaded();
      if(!ready){ toast('Firebase todavía no está listo.'); overlay.querySelector('.sdc335-save').disabled=false; return; }
      try{
        await window.guardarProductoFirebase(producto);
        toast('Producto guardado en Firebase.');
        overlay.remove();
        setTimeout(function(){ location.href=location.pathname+'?v=335-'+Date.now(); },700);
      }catch(error){
        console.error(error);
        toast('No se pudo guardar el producto.');
        overlay.querySelector('.sdc335-save').disabled=false;
        overlay.querySelector('.sdc335-save').textContent='Guardar en Firebase';
      }
    });
  }

  function injectCreateButtons(){
    if(!document.querySelector('.sdc335-create-fab')){
      var fab=document.createElement('button');
      fab.type='button';
      fab.className='sdc335-create-fab';
      fab.innerHTML='<span>＋</span><b>Crear producto</b>';
      fab.addEventListener('click',openCreateProductModal);
      document.body.appendChild(fab);
    }
    var controls=document.querySelector('.catalog-filter-row-v235,.catalog-filter-row-v178,.catalog-control-v178,.catalog-control-v189');
    if(controls && !controls.querySelector('.sdc335-create-btn')){
      var btn=document.createElement('button');
      btn.type='button';
      btn.className='sdc335-create-btn';
      btn.textContent='＋ Crear producto';
      btn.addEventListener('click',openCreateProductModal);
      controls.appendChild(btn);
    }
  }

  function detailProductId(modal){
    var small=txt(modal.querySelector('.v141-head-copy small,.v49-detail-main small,.v163-detail-main small,small'));
    if(small.indexOf('·')!==-1){
      var parts=small.split('·').map(function(x){return x.trim();}).filter(Boolean);
      return parts[parts.length-1];
    }
    var title=txt(modal.querySelector('h1,h2,h3'));
    return slug(title);
  }

  async function setProductState(modal,state){
    var id=detailProductId(modal);
    if(!id) return toast('No pude detectar el código del producto.');
    var ready=await ensureFirebaseLoaded();
    if(!ready) return toast('Firebase no está listo.');
    try{
      if(state==='muestra') await window.marcarProductoMuestraFirebase(id, {}, true);
      else if(state==='normal') await window.marcarProductoMuestraFirebase(id, {}, false);
      else await window.marcarProductoEstadoFirebase(id, state, {});
      toast(state==='agotado'?'Producto guardado como AGOTADO.':state==='muestra'?'Producto guardado como MUESTRA.':'Producto volvió a inventario normal.');
      setTimeout(function(){ location.href=location.pathname+'?v=335-'+Date.now(); },700);
    }catch(error){ console.error(error); toast('No se pudo actualizar Firebase.'); }
  }

  function injectDetailActions(){
    document.querySelectorAll('.product-detail-modal-v221,.modal').forEach(function(modal){
      var t=txt(modal);
      if(!/CANTIDAD|ENV[IÍ]O NORMAL|PAGAR A RECIBIR|Colores/i.test(t)) return;
      if(modal.querySelector('.sdc335-detail-actions')) return;
      var row=document.createElement('div');
      row.className='sdc335-detail-actions no-print';
      row.innerHTML='<button type="button" class="sdc335-agotado">Agotado</button><button type="button" class="sdc335-muestra">Muestra</button><button type="button" class="sdc335-normal">Inventario</button>';
      row.querySelector('.sdc335-agotado').addEventListener('click',function(){ setProductState(modal,'agotado'); });
      row.querySelector('.sdc335-muestra').addEventListener('click',function(){ setProductState(modal,'muestra'); });
      row.querySelector('.sdc335-normal').addEventListener('click',function(){ setProductState(modal,'normal'); });
      var anchor=modal.querySelector('.v49-price-cards,.v141-price-cards,.v163-price-cards') || modal.querySelector('.sdc321-detail-social-wrap') || modal.querySelector('.modal-body') || modal;
      if(anchor.parentNode && anchor!==modal) anchor.parentNode.insertBefore(row,anchor);
      else modal.appendChild(row);
    });
  }

  function interceptExistingAgotado(){
    if(window.__sdc335AgotadoIntercept) return;
    window.__sdc335AgotadoIntercept=true;
    document.addEventListener('click',function(ev){
      var btn=ev.target.closest && ev.target.closest('button,a');
      if(!btn) return;
      if(!/^agotado$/i.test(txt(btn))) return;
      var modal=btn.closest('.product-detail-modal-v221,.modal');
      if(modal) setTimeout(function(){ setProductState(modal,'agotado'); },80);
    },true);
  }

  function hideLocalAndEmptySpace(){
    document.querySelectorAll('.product-detail-modal-v221,.modal').forEach(function(modal){
      modal.querySelectorAll('[data-v49-card],[data-delivery],.v49-price-cards > *,.v141-price-cards > *,.v163-price-cards > *').forEach(function(card){
        var t=txt(card);
        if(/\bCOMAYAGUA\b/i.test(t) || /Producto\s+sin\s+env[ií]o/i.test(t) || /entrega\s+local\s+seg[uú]n\s+zona/i.test(t)){
          card.classList.add('sdc335-hide-local-delivery','sdc333-hide-local-delivery');
          ['display','height','min-height','max-height','margin','padding','border','overflow'].forEach(function(p){
            setImp(card,p,{display:'none',height:'0','min-height':'0','max-height':'0',margin:'0',padding:'0',border:'0',overflow:'hidden'}[p]);
          });
        }
      });
    });
  }

  function fixReadableText(){
    var colorNames=['Colores','Azul','Rojo','Negro','Blanco','General','Verde','Rosado','Morado','Amarillo','Gris','Dorado','Plateado'];
    document.querySelectorAll('.product-detail-modal-v221 *,.modal *').forEach(function(el){
      var t=txt(el);
      if(!t || t.length>20) return;
      if(/^\d+$/.test(t)){
        var r=el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};
        var inColor=el.closest('[class*="color"], [class*="stock"], [class*="variant"], [class*="pill"]');
        if(inColor && r.width<=70){
          el.classList.add('sdc335-color-number');
          setImp(el,'color','#fff');
          setImp(el,'text-shadow','0 1px 2px rgba(0,0,0,.25)');
        }
        return;
      }
      if(colorNames.some(function(n){ return t.toLowerCase()===n.toLowerCase(); })){
        el.classList.add(t.toLowerCase()==='general'?'sdc335-general-name':'sdc335-color-name');
        setImp(el,'color','#061b34');
        setImp(el,'text-shadow','none');
        setImp(el,'font-weight','950');
      }
    });
  }

  function markSampleCards(){
    document.querySelectorAll('article.product-card,[data-id],[data-product-id]').forEach(function(card){
      var t=txt(card);
      if(/\bMUESTRA\b|solo muestra|para cotizar/i.test(t) && !card.querySelector('.sdc335-sample-badge')){
        var badge=document.createElement('div');
        badge.className='sdc335-sample-badge';
        badge.textContent='🟡 Muestra · no cuenta inventario';
        var h=card.querySelector('h3,h2,h4');
        if(h && h.parentNode) h.parentNode.insertBefore(badge,h.nextSibling);
        else card.appendChild(badge);
      }
    });
  }

  function polish(){
    injectCreateButtons();
    injectDetailActions();
    hideLocalAndEmptySpace();
    fixReadableText();
    markSampleCards();
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){ scheduled=false; polish(); });
  }

  function start(){
    interceptExistingAgotado();
    polish();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){ setTimeout(schedule,50); setTimeout(schedule,220); },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
