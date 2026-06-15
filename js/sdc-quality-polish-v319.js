/* v319 · Pulido dinámico seguro para mejorar lectura, imágenes, scroll y botones. */
(function(){
  'use strict';

  var POLISH_CLASS = 'sdc-v319-quality-polish';
  var scheduled = false;
  var observer = null;
  var purpleTokens = ['purple','#7c3aed','#8b5cf6','#a855f7','rgb(124, 58, 237)','rgb(139, 92, 246)','rgb(168, 85, 247)'];

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true});
    else fn();
  }

  function safeText(s){ return String(s == null ? '' : s).trim(); }

  function hasAnyToken(value, tokens){
    value = String(value || '').toLowerCase();
    return tokens.some(function(token){ return value.indexOf(token) !== -1; });
  }

  function markBody(){
    document.documentElement.classList.add(POLISH_CLASS);
    if(document.body) document.body.classList.add(POLISH_CLASS);
    try{ document.documentElement.style.colorScheme = 'light'; }catch(e){}
  }

  function polishImage(img){
    if(!img || img.dataset.sdc319Img === '1') return;
    img.dataset.sdc319Img = '1';
    try{
      var src = safeText(img.getAttribute('src'));
      var isLogo = /logo|sdc/i.test(src) || /logo|sdc/i.test(safeText(img.alt));
      if(!isLogo && !img.hasAttribute('loading')) img.loading = 'lazy';
      if(!img.hasAttribute('decoding')) img.decoding = 'async';
      img.draggable = false;
      if(!safeText(img.alt)) img.alt = isLogo ? 'SD Comayagua' : 'Producto SD Comayagua';
    }catch(e){}
  }

  function polishActionGroup(group){
    if(!group || group.dataset.sdc319Actions === '1') return;
    var buttons = group.querySelectorAll('button,.btn,a[role="button"]');
    if(buttons.length >= 2){
      group.dataset.sdc319Actions = '1';
      group.classList.add('sdc319-action-grid');
    }
  }

  function polishButton(btn){
    if(!btn || btn.dataset.sdc319Btn === '1') return;
    btn.dataset.sdc319Btn = '1';
    try{
      if(!btn.getAttribute('type') && btn.tagName === 'BUTTON') btn.setAttribute('type','button');
      if(!safeText(btn.getAttribute('aria-label')) && !safeText(btn.textContent)) btn.setAttribute('aria-label','Acción');
    }catch(e){}
  }

  function replacePurpleInline(el){
    if(!el || !el.getAttribute) return;
    var style = el.getAttribute('style') || '';
    if(!hasAnyToken(style, purpleTokens)) return;
    try{
      if(hasAnyToken(el.style.color, purpleTokens)) el.style.color = '#0f766e';
      if(hasAnyToken(el.style.borderColor, purpleTokens)) el.style.borderColor = 'rgba(15,118,110,.28)';
      if(hasAnyToken(el.style.backgroundColor, purpleTokens)) el.style.backgroundColor = '#eef6f5';
      if(hasAnyToken(el.style.background, purpleTokens)) el.style.background = '#eef6f5';
      el.dataset.sdc319NoPurple = '1';
    }catch(e){}
  }

  function fixLightText(el){
    if(!el || !el.getAttribute) return;
    var style = el.getAttribute('style') || '';
    if(!/color\s*:\s*(#fff|white|#ffffff|rgb\(255,\s*255,\s*255\))/i.test(style)) return;
    if(el.closest('.shortReceiptExportHost,.productPhotoClean,[data-export]')) return;
    try{ el.style.color = '#102033'; }catch(e){}
  }

  function polishScrollBox(el){
    if(!el || el.dataset.sdc319Scroll === '1') return;
    el.dataset.sdc319Scroll = '1';
    try{
      el.style.webkitOverflowScrolling = 'touch';
      if(!el.style.overflowY) el.style.overflowY = 'auto';
      if(!el.style.overscrollBehavior) el.style.overscrollBehavior = 'contain';
    }catch(e){}
  }

  function enhance(root){
    root = root && root.querySelectorAll ? root : document;
    markBody();

    root.querySelectorAll('img').forEach(polishImage);
    root.querySelectorAll('button,.btn').forEach(polishButton);
    root.querySelectorAll('.modal-actions,.client-actions-v22,.category-sheet-actions-v199,.quote-actions,.receipt-actions,.cart-actions,.form-actions,.sdc-actions,.action-row').forEach(polishActionGroup);
    root.querySelectorAll('.modal-body,.sheet-body,.drawer-body,.receipts-v22,.clients-v22,.quick-sale-v26,.daily-close-v26').forEach(polishScrollBox);
    root.querySelectorAll('[style*="purple"],[style*="#7c3aed"],[style*="#8b5cf6"],[style*="#a855f7"]').forEach(replacePurpleInline);
    root.querySelectorAll('[style*="color:#fff"],[style*="color: #fff"],[style*="color:white"],[style*="color: white"],[style*="color:#ffffff"],[style*="color: #ffffff"]').forEach(fixLightText);

    var app = document.getElementById('app');
    if(app){
      app.setAttribute('tabindex','-1');
      app.setAttribute('aria-label','Panel principal de SD Comayagua');
    }
  }

  function schedule(root){
    if(scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function(){
      scheduled = false;
      enhance(root || document);
    });
  }

  ready(function(){
    enhance(document);

    var goTop = document.getElementById('goTop');
    if(goTop && !goTop.dataset.sdc319Bound){
      goTop.dataset.sdc319Bound = '1';
      goTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
    }

    observer = new MutationObserver(function(mutations){
      for(var i=0;i<mutations.length;i++){
        if(mutations[i].addedNodes && mutations[i].addedNodes.length){ schedule(document); return; }
      }
    });
    observer.observe(document.documentElement, {childList:true, subtree:true});

    window.addEventListener('resize', function(){ schedule(document); }, {passive:true});
    window.addEventListener('orientationchange', function(){ setTimeout(function(){ schedule(document); }, 180); }, {passive:true});
  });
})();
