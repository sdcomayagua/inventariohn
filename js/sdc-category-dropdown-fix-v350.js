/* v350 · Deja solo el dropdown de categorías en la búsqueda.
   Oculta el control duplicado que dice "Categorías" y conserva el selector tipo lista. */
(function(){
  'use strict';

  var scheduled=false;

  function txt(el){
    return (el && el.textContent || '').replace(/\s+/g,' ').trim();
  }

  function norm(value){
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^A-Z0-9+ ]/gi,' ')
      .replace(/\s+/g,' ')
      .trim()
      .toUpperCase();
  }

  function rect(el){
    try{return el.getBoundingClientRect ? el.getBoundingClientRect() : {width:0,height:0};}
    catch(e){return {width:0,height:0};}
  }

  function isCategorySelect(select){
    if(!select || select.tagName !== 'SELECT') return false;
    var optionText=Array.from(select.options || []).map(function(opt){return norm(opt.textContent || opt.value);}).join(' | ');
    if(/DEDAL|ACCESORIO|ADAPTADOR|AUDIO|BELLEZA|COCINA|MEMORIA|HOGAR/.test(optionText)) return true;
    if((select.options || []).length >= 8) return true;
    return false;
  }

  function findCategorySelect(){
    var selects=Array.from(document.querySelectorAll('select'));
    return selects.find(isCategorySelect) || null;
  }

  function findSearchInput(){
    return Array.from(document.querySelectorAll('input')).find(function(input){
      var p=norm(input.getAttribute('placeholder') || '');
      return /BUSCAR/.test(p) && (/PRODUCTO/.test(p) || /CODIGO/.test(p) || /CATEGORIA/.test(p));
    }) || null;
  }

  function findProductButton(scope){
    return Array.from((scope || document).querySelectorAll('button,a,[role="button"]')).find(function(el){
      var t=norm(txt(el));
      return /PRODUCTO/.test(t) && (t.length <= 45);
    }) || null;
  }

  function commonContainer(items){
    items=items.filter(Boolean);
    if(!items.length) return null;
    var current=items[0];
    for(var depth=0; depth<8 && current; depth++, current=current.parentElement){
      var ok=items.every(function(item){ return current.contains(item); });
      if(!ok) continue;
      var r=rect(current);
      if(r.width > 420 && r.height > 38) return current;
    }
    return items[0].parentElement || null;
  }

  function compactCategoryText(el){
    var t=norm(txt(el));
    t=t.replace(/^[0-9+\- ]+/,'').replace(/[0-9+\- ]+$/,'').trim();
    return t;
  }

  function duplicateCandidateScope(row, select){
    if(row) return row;
    var search=findSearchInput();
    return commonContainer([search,select]) || document;
  }

  function hideDuplicateCategoryControl(row, select){
    var scope=duplicateCandidateScope(row, select);
    if(!scope) return;

    var candidates=Array.from(scope.querySelectorAll('button,a,[role="button"],div,span,label'))
      .filter(function(el){
        if(el === select || el.contains(select) || select.contains(el)) return false;
        if(el.classList && el.classList.contains('sdc350-category-duplicate')) return false;
        var t=compactCategoryText(el);
        if(t !== 'CATEGORIAS' && t !== 'CATEGORIA') return false;
        var r=rect(el);
        if(r.width < 50 || r.height < 18) return false;
        return true;
      });

    candidates.sort(function(a,b){
      var ar=rect(a), br=rect(b);
      var at=txt(a).length, bt=txt(b).length;
      return (at-bt) || ((ar.width*ar.height)-(br.width*br.height));
    });

    var target=candidates[0];
    if(!target) return;

    var hide=target.closest('button,a,[role="button"]') || target;

    /* Si el texto está dentro de una tarjeta mayor, solo ocultamos el bloque pequeño, no toda la fila. */
    for(var i=0;i<3 && hide.parentElement && hide.parentElement!==scope;i++){
      var r=rect(hide.parentElement);
      var t=norm(txt(hide.parentElement));
      if(t === 'CATEGORIAS' || t === 'CATEGORIA') hide=hide.parentElement;
      else if(r.width <= 260 && r.height <= 70 && /^CATEGORIAS?$/.test(t)) hide=hide.parentElement;
      else break;
    }

    hide.classList.add('sdc350-category-duplicate');
    hide.setAttribute('aria-hidden','true');
  }

  function polish(){
    var select=findCategorySelect();
    if(!select) return;

    select.classList.add('sdc350-category-select');

    var search=findSearchInput();
    var product=findProductButton(document);
    var row=commonContainer([search,select,product]) || commonContainer([search,select]) || select.parentElement;
    if(row) row.classList.add('sdc350-category-row');

    hideDuplicateCategoryControl(row, select);
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(function(){
      scheduled=false;
      polish();
    });
  }

  function start(){
    polish();
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
    document.addEventListener('click',function(){ setTimeout(schedule,80); },true);
    window.addEventListener('resize',schedule,{passive:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
