/* SDC V132: editor de imágenes + recibos/cotizaciones + UI S24 Ultra + botones al final. */
(function(){
  'use strict';
  if(window.SDCV129PhotoEditor) return;
  window.SDCV129PhotoEditor = true;

  function ensureCss(){
    const files = [
      'css/sdc-v130-receipts-clean.css?v=132-actions-bottom',
      'css/sdc-v131-s24-ui-final.css?v=132-actions-bottom',
      'css/sdc-v132-actions-bottom-final.css?v=132-actions-bottom'
    ];
    files.forEach(href=>{
      const clean = href.split('?')[0];
      if(document.querySelector('link[href*="'+clean+'"]')) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function toast(msg){
    const el=document.getElementById('toast');
    if(el){
      el.textContent=msg;
      el.classList.add('show');
      clearTimeout(el._v129);
      el._v129=setTimeout(()=>el.classList.remove('show'),2300);
    }
  }

  function enhanceRow(row,index){
    if(!row || row.dataset.sdcV129Enhanced==='1') return;
    const input=row.querySelector('input[data-upload-image]');
    const url=row.querySelector('.pImageUrl');
    const del=row.querySelector('[data-delimage]');
    const actions=row.querySelector('.image-row-actions-v83') || row.querySelector('.image-row-actions');
    if(!input || !actions) return;

    row.dataset.sdcV129Enhanced='1';

    const oldLabel=input.closest('label');
    if(oldLabel){
      oldLabel.classList.add('sdc-v129-native-input-holder');
      oldLabel.setAttribute('aria-hidden','true');
    }

    const tools=document.createElement('div');
    tools.className='sdc-v129-photo-tools';
    tools.innerHTML=`
      <button class="sdc-v129-photo-btn camera" type="button" data-sdc-v129-camera>📷 <span>Tomar foto</span></button>
      <button class="sdc-v129-photo-btn gallery" type="button" data-sdc-v129-gallery>🖼️ <span>Galería</span></button>
    `;

    actions.prepend(tools);
    if(del){
      del.classList.add('sdc-v129-remove-photo');
      del.textContent='Quitar imagen';
      actions.appendChild(del);
    }

    const openPicker=(camera)=>{
      try{
        input.value='';
        input.setAttribute('accept','image/*');
        if(camera) input.setAttribute('capture','environment');
        else input.removeAttribute('capture');
        input.click();
      }catch(err){
        toast('No se pudo abrir la cámara o galería.');
      }
    };

    tools.querySelector('[data-sdc-v129-camera]').addEventListener('click',e=>{e.preventDefault();openPicker(true);});
    tools.querySelector('[data-sdc-v129-gallery]').addEventListener('click',e=>{e.preventDefault();openPicker(false);});

    input.addEventListener('change',()=>{
      const file=input.files && input.files[0];
      if(file) toast('Foto cargada. Toca Guardar y sincronizar.');
    });

    if(url){
      url.setAttribute('placeholder','Enlace de imagen opcional');
      url.setAttribute('autocomplete','off');
    }
  }

  function enhanceEditor(){
    const root=document.getElementById('modalRoot');
    if(!root) return;
    const editor=root.querySelector('.product-editor');
    if(!editor) return;

    const imageBox=editor.querySelector('.image-upload-box-v83');
    if(imageBox && imageBox.dataset.sdcV129Box!=='1'){
      imageBox.dataset.sdcV129Box='1';
      const label=imageBox.querySelector(':scope > .label');
      if(label) label.textContent='Imágenes del producto';
      const hint=imageBox.querySelector('.hint');
      if(hint) hint.textContent='Foto principal arriba. Puedes tomar foto, elegir desde galería o pegar un enlace. Luego toca Guardar y sincronizar.';
      const add=imageBox.querySelector('#addImageRow');
      if(add) add.textContent='+ Agregar otra foto';
    }

    root.querySelectorAll('.image-row-v83').forEach((row,i)=>enhanceRow(row,i));
  }

  function boot(){
    ensureCss();
    enhanceEditor();
    const root=document.getElementById('modalRoot');
    if(root){
      let scheduled=false;
      new MutationObserver(()=>{
        if(scheduled) return;
        scheduled=true;
        setTimeout(()=>{scheduled=false;ensureCss();enhanceEditor();},100);
      }).observe(root,{childList:true,subtree:true});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
