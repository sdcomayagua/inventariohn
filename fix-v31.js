/* SDCOMAYAGUA · FIX V31: abre modales aunque el navegador tenga caché vieja */
(function(){
  'use strict';
  const $ = (id) => document.getElementById(id);
  const originalProductModal = window.invOpenModal;
  const originalSaleModal = window.openSaleModal;
  const originalProductClose = window.invCloseModal;
  const originalSaleClose = window.closeSaleModal;

  function lockBody(){
    document.body.classList.add('modal-open','ui-lock');
  }
  function unlockBodyIfNoModal(){
    const visible = Array.from(document.querySelectorAll('.modal')).some(m => getComputedStyle(m).display !== 'none');
    if(!visible) document.body.classList.remove('modal-open','ui-lock');
  }
  function showModal(id){
    const modal = $(id);
    if(!modal) return false;
    modal.style.display = 'flex';
    modal.classList.add('show');
    lockBody();
    const first = modal.querySelector('input, select, textarea, button');
    if(first && typeof first.focus === 'function') setTimeout(() => first.focus({preventScroll:true}), 60);
    return true;
  }

  window.invOpenModal = function(isEdit, product){
    let opened = false;
    if(typeof originalProductModal === 'function'){
      try{ originalProductModal(isEdit, product); opened = true; }
      catch(err){ console.warn('Se aplicó apertura segura de producto:', err); }
    }
    if(!opened || !$('inv-modal') || getComputedStyle($('inv-modal')).display === 'none'){
      const title = $('inv-modal-title');
      if(title && !isEdit) title.textContent = 'Agregar producto';
      showModal('inv-modal');
    }else{
      $('inv-modal')?.classList.add('show');
      lockBody();
    }
  };

  window.openSaleModal = function(preselectedId){
    let opened = false;
    if(typeof originalSaleModal === 'function'){
      try{ originalSaleModal(preselectedId || ''); opened = true; }
      catch(err){ console.warn('Se aplicó apertura segura de venta:', err); }
    }
    if(!opened || !$('sale-modal') || getComputedStyle($('sale-modal')).display === 'none'){
      showModal('sale-modal');
    }else{
      $('sale-modal')?.classList.add('show');
      lockBody();
    }
  };

  window.invCloseModal = function(){
    if(typeof originalProductClose === 'function'){
      try{ originalProductClose(); }catch(err){ console.warn(err); }
    }
    const modal = $('inv-modal');
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; }
    unlockBodyIfNoModal();
  };

  window.closeSaleModal = function(){
    if(typeof originalSaleClose === 'function'){
      try{ originalSaleClose(); }catch(err){ console.warn(err); }
    }
    const modal = $('sale-modal');
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; }
    unlockBodyIfNoModal();
  };

  document.addEventListener('DOMContentLoaded', function(){
    document.querySelectorAll('button[onclick*="invOpenModal"]').forEach(btn => {
      btn.type = 'button';
      btn.addEventListener('click', function(ev){
        if(btn.dataset.safeBound === '1') return;
        btn.dataset.safeBound = '1';
        setTimeout(()=>{ btn.dataset.safeBound = '0'; }, 250);
        setTimeout(()=> window.invOpenModal(false), 0);
      }, {passive:true});
    });
    document.querySelectorAll('button[onclick*="openSaleModal"]').forEach(btn => {
      btn.type = 'button';
      btn.addEventListener('click', function(ev){
        if(btn.dataset.safeSaleBound === '1') return;
        btn.dataset.safeSaleBound = '1';
        setTimeout(()=>{ btn.dataset.safeSaleBound = '0'; }, 250);
        setTimeout(()=> window.openSaleModal(), 0);
      }, {passive:true});
    });

    document.addEventListener('keydown', function(ev){
      if(ev.key !== 'Escape') return;
      if($('sale-modal') && getComputedStyle($('sale-modal')).display !== 'none') window.closeSaleModal();
      if($('inv-modal') && getComputedStyle($('inv-modal')).display !== 'none') window.invCloseModal();
    });
  });
})();
