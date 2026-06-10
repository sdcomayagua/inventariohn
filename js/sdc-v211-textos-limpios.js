/* SD Comayagua · v211 Textos limpios */
(function(){
  'use strict';
  const replacements = [
    ['Modo S24 Ultra','Accesos rápidos'],
    ['S24 Ultra','móvil'],
    ['Galaxy móvil','celular'],
    ['Galaxy S24 Ultra','celular'],
    ['Panel móvil premium','Panel de ventas'],
    ['Optimizado para celular ·',''],
    ['Optimizado para móvil ·',''],
    ['Optimizado para Galaxy S24 Ultra ·',''],
    ['optimizada para Galaxy S24 Ultra','lista para uso móvil diario'],
    ['optimizada para celular','móvil'],
    ['Abriendo la versión optimizada para celular.','Abriendo el panel móvil de ventas.']
  ];
  function cleanTextNode(node){
    let v=node.nodeValue;
    let next=v;
    replacements.forEach(([a,b])=>{ next=next.split(a).join(b); });
    if(next!==v) node.nodeValue=next.replace(/\s+·\s+·\s+/g,' · ').replace(/^\s+|\s+$/g,'');
  }
  function walk(root){
    const walker=document.createTreeWalker(root||document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
      const p=node.parentElement;
      if(!p) return NodeFilter.FILTER_REJECT;
      if(['SCRIPT','STYLE','TEXTAREA','INPUT'].includes(p.tagName)) return NodeFilter.FILTER_REJECT;
      return /S24|Ultra|Optimizado|optimizada|Panel móvil premium|versión optimizada/.test(node.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }});
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(cleanTextNode);
  }
  function polish(){
    document.body.classList.add('sdc-v211-clean-copy');
    walk(document.body);
    const panel=document.querySelector('.sdc210-s24-panel');
    if(panel){
      const label=panel.querySelector('.sdc210-panel-head span');
      const title=panel.querySelector('.sdc210-panel-head b');
      if(label) label.textContent='Accesos rápidos';
      if(title) title.textContent='Panel de ventas';
    }
  }
  let raf=0;
  function schedule(){
    if(raf) return;
    raf=requestAnimationFrame(()=>{raf=0;polish();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',polish,{once:true});
  else polish();
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
})();
