/* v327 · Pulido dinámico fuerte para modal y PNG de categorías.
   No cambia inventario, precios ni cálculos. */
(function(){
  'use strict';
  var scheduled=false;
  var styleInjected=false;

  function txt(el){ return (el && el.textContent || '').replace(/\s+/g,' ').trim(); }

  function setImp(el, prop, value){
    if(!el || !el.style) return;
    el.style.setProperty(prop,value,'important');
  }

  function injectRuntimeStyle(){
    if(styleInjected) return;
    styleInjected=true;
    var st=document.createElement('style');
    st.id='sdc327-category-runtime-style';
    st.textContent='\n'
      +'body.sdc-v319-quality-polish .category-sheet-grid-v199{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:8px!important;width:100%!important;min-width:0!important}\n'
      +'body.sdc-v319-quality-polish .category-sheet-grid-v199>.category-sheet-card-v199{min-width:0!important;width:100%!important;max-width:none!important;margin:0!important}\n'
      +'body.sdc-v319-quality-polish .category-sheet-grid-v199>.category-sheet-card-v199:first-child{grid-column:1/-1!important}\n'
      +'body.sdc-v319-quality-polish .category-sheet-actions-v199{grid-template-columns:1fr 1fr!important;gap:5px!important}\n'
      +'body.sdc-v319-quality-polish .category-sheet-actions-v199 button{min-width:0!important;width:100%!important;font-size:10px!important;padding-inline:4px!important}\n'
      +'.sdc327-clean-header-title{position:absolute!important;left:150px!important;top:72px!important;right:34px!important;color:#fff!important;font-size:60px!important;line-height:.9!important;font-weight:950!important;letter-spacing:-.06em!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;z-index:4!important}\n'
      +'.sdc327-stock-pill{min-width:86px!important;padding:8px 14px!important;white-space:nowrap!important;font-size:13px!important;line-height:1!important}\n';
    document.head.appendChild(st);
  }

  function looksLikeCategoryCapture(el){
    if(!el || !el.querySelectorAll) return false;
    var t=txt(el);
    return /SD\s*COMAYAGUA/i.test(t) && /Vista\s+r[aá]pida\s+para\s+cliente/i.test(t) && /Productos\s+disponibles\s+para\s+cotizar/i.test(t);
  }

  function topCaptureRoot(node){
    var el=node;
    var best=node;
    for(var i=0;i<10 && el && el.parentElement;i++,el=el.parentElement){
      if(looksLikeCategoryCapture(el)) best=el;
      var w=el.offsetWidth || 0;
      var h=el.offsetHeight || 0;
      if(w>850 && h>500 && looksLikeCategoryCapture(el)) best=el;
    }
    return best;
  }

  function addTitle(root){
    if(!root || root.querySelector('.sdc327-category-capture-title,.sdc326-category-capture-title,.sdc325-category-capture-title,.sdc324-category-capture-title')) return;
    var title=document.createElement('div');
    title.className='sdc327-category-capture-title';
    title.innerHTML='SD COMAYAGUA · CATÁLOGO<small>Productos disponibles para cotizar</small>';
    root.insertBefore(title, root.firstChild);
  }

  function findCategoryTitle(head){
    if(!head) return null;
    var candidates=Array.from(head.querySelectorAll('h1,h2,h3,b,strong,span,div')).filter(function(el){
      var t=txt(el);
      return /^[A-ZÁÉÍÓÚÑ0-9\s]{4,28}$/.test(t) && !/SD\s*COMAYAGUA|Vista|Cliente|jun|a\.\s*m\.|p\.\s*m\./i.test(t);
    });
    return candidates.find(function(el){ return /DEDAL|AUDIO|GAMER|CABLE|ADAPTADOR|ACCESORIO|MICRO|HOGAR|COCINA/i.test(txt(el)); }) || candidates[0];
  }

  function polishHeader(root){
    if(!root) return;
    var candidates=Array.from(root.querySelectorAll('header,section,div')).filter(function(el){
      var t=txt(el);
      return /SD\s*COMAYAGUA/i.test(t) && /Vista\s+r[aá]pida\s+para\s+cliente/i.test(t);
    });
    var head=candidates.find(function(el){ return (el.offsetHeight||0)>70 && (el.offsetWidth||0)>400; }) || candidates[0];
    if(head){
      head.classList.add('sdc327-category-capture-header','sdc326-category-capture-header','sdc325-category-capture-header','sdc324-category-capture-header');
      setImp(head,'background','linear-gradient(135deg,#061b34 0%,#0b63ce 72%,#2b96ff 100%)');
      setImp(head,'border-radius','34px');
      setImp(head,'margin-bottom','24px');
      setImp(head,'position','relative');
      setImp(head,'min-height','190px');
      setImp(head,'padding','28px 34px 22px');
      setImp(head,'overflow','hidden');

      var originalTitle=findCategoryTitle(head);
      var label=originalTitle ? txt(originalTitle) : '';
      if(originalTitle){
        originalTitle.classList.add('sdc327-hidden-original-category-title');
        setImp(originalTitle,'display','none');
      }
      if(label && !head.querySelector('.sdc327-clean-header-title')){
        var clean=document.createElement('div');
        clean.className='sdc327-clean-header-title';
        clean.textContent=label;
        head.appendChild(clean);
      }
    }
  }

  function polishPrices(root){
    if(!root) return;
    root.querySelectorAll('b,strong,span,div,h2,h3').forEach(function(el){
      var t=txt(el);
      if(/^Lps\.\s*\d+/i.test(t) && t.length<18){
        el.classList.add('sdc327-category-capture-price','sdc326-category-capture-price','sdc325-category-capture-price','sdc324-category-capture-price');
        setImp(el,'color','#d61c3b');
        setImp(el,'font-size','40px');
        setImp(el,'font-weight','950');
        setImp(el,'letter-spacing','-.055em');
        setImp(el,'white-space','nowrap');
      }
    });
  }

  function polishStockPills(root){
    if(!root) return;
    root.querySelectorAll('b,strong,span,small,em,div').forEach(function(el){
      var t=txt(el);
      if(/^\d+\s*(disp\.?|unid\.?|unidades)$/i.test(t) || /^\d+\s*disp\.?$/i.test(t)){
        el.classList.add('sdc327-stock-pill','sdc326-stock-pill','sdc326-category-stock-pill');
        setImp(el,'min-width','86px');
        setImp(el,'width','auto');
        setImp(el,'min-height','30px');
        setImp(el,'height','auto');
        setImp(el,'padding','8px 14px');
        setImp(el,'border-radius','999px');
        setImp(el,'display','inline-flex');
        setImp(el,'align-items','center');
        setImp(el,'justify-content','center');
        setImp(el,'white-space','nowrap');
        setImp(el,'line-height','1');
        setImp(el,'font-size','13px');
        setImp(el,'font-weight','950');
        setImp(el,'letter-spacing','-.01em');
        setImp(el,'color','#0b63ce');
        setImp(el,'background','#eef6ff');
        setImp(el,'border','1px solid #cfe4ff');
        setImp(el,'overflow','visible');
        setImp(el,'transform','none');
      }
    });
  }

  function polishProductText(card){
    if(!card) return;
    Array.from(card.querySelectorAll('h1,h2,h3,h4')).forEach(function(h){
      var t=txt(h);
      if(!t || /^Lps\./i.test(t) || /DISPONIBLE/i.test(t)) return;
      h.classList.add('sdc327-product-name-clean');
      setImp(h,'display','block');
      setImp(h,'position','relative');
      setImp(h,'transform','none');
      setImp(h,'margin','10px 0 14px');
      setImp(h,'padding','0');
      setImp(h,'font-size','25px');
      setImp(h,'line-height','1.08');
      setImp(h,'letter-spacing','-.045em');
      setImp(h,'color','#07192f');
      setImp(h,'z-index','2');
      setImp(h,'clear','both');
    });
    Array.from(card.querySelectorAll('span,small,b,strong')).forEach(function(el){
      var t=txt(el);
      if(/^[A-ZÁÉÍÓÚÑ]+\s*·\s*[A-Z0-9-]{3,}/.test(t) || /[A-Z0-9]{8,}/.test(t)){
        el.classList.add('sdc327-product-code-clean');
        setImp(el,'display','block');
        setImp(el,'margin','0 0 8px');
        setImp(el,'font-size','12px');
        setImp(el,'line-height','1.15');
        setImp(el,'letter-spacing','.08em');
        setImp(el,'color','#647d98');
        setImp(el,'white-space','nowrap');
        setImp(el,'overflow','hidden');
        setImp(el,'text-overflow','ellipsis');
      }
    });
  }

  function polishProductCards(root){
    if(!root) return;
    var cards=Array.from(root.querySelectorAll('article,section,div')).filter(function(el){
      if(el.classList.contains('sdc327-category-capture-header') || el.classList.contains('sdc326-category-capture-header') || el.classList.contains('sdc325-category-capture-header') || el.classList.contains('sdc324-category-capture-header')) return false;
      var t=txt(el);
      return /^DISPONIBLE/i.test(t) || (/Lps\.\s*\d+/i.test(t) && el.querySelector('img') && t.length>20);
    });
    cards.forEach(function(card){
      var w=card.offsetWidth || 0;
      var h=card.offsetHeight || 0;
      if(w>180 && h>160){
        card.classList.add('sdc327-category-product-card','sdc326-category-product-card','sdc325-category-product-card','sdc324-category-product-card');
        setImp(card,'background','#fff');
        setImp(card,'border','1px solid #d8e7f6');
        setImp(card,'border-radius','28px');
        setImp(card,'overflow','hidden');
        polishProductText(card);
      }
    });
  }

  function polishCapture(root){
    if(!root) return;
    root.classList.add('sdc327-category-capture','sdc326-category-capture','sdc325-category-capture','sdc324-category-capture');
    setImp(root,'background','#eef6ff');
    setImp(root,'padding','28px');
    setImp(root,'overflow','hidden');
    addTitle(root);
    polishHeader(root);
    polishPrices(root);
    polishStockPills(root);
    polishProductCards(root);
  }

  function polishCategoryCaptures(){
    Array.from(document.querySelectorAll('body *')).forEach(function(el){
      if(looksLikeCategoryCapture(el)){
        polishCapture(topCaptureRoot(el));
      }
    });
  }

  function modalShellFor(grid){
    return grid.closest('.modal,.modal-card,.modal-shell,[role="dialog"]') || grid.closest('#modalRoot > *') || grid.parentElement;
  }

  function forceCategoryGrid(grid){
    if(!grid) return;
    injectRuntimeStyle();
    grid.classList.add('sdc324-category-grid-fixed','sdc325-category-grid-fixed');
    setImp(grid,'display','grid');
    setImp(grid,'grid-template-columns','minmax(0,1fr) minmax(0,1fr)');
    setImp(grid,'gap','8px');
    setImp(grid,'width','100%');
    setImp(grid,'min-width','0');
    setImp(grid,'align-items','stretch');

    var body=grid.closest('.category-sheet-v191,.category-sheet-v199,.modal-body');
    if(body){
      setImp(body,'padding','9px');
      setImp(body,'overflow-x','hidden');
      setImp(body,'overflow-y','auto');
      setImp(body,'max-height','calc(100dvh - 86px)');
    }

    var shell=modalShellFor(grid);
    if(shell){
      setImp(shell,'width','min(96vw, 560px)');
      setImp(shell,'max-width','min(96vw, 560px)');
      setImp(shell,'margin-left','auto');
      setImp(shell,'margin-right','auto');
      setImp(shell,'overflow','hidden');
    }

    Array.from(grid.children).forEach(function(card,idx){
      card.classList.add('sdc325-category-card-fixed');
      setImp(card,'min-width','0');
      setImp(card,'width','100%');
      setImp(card,'max-width','none');
      setImp(card,'margin','0');
      if(idx===0){
        card.classList.add('sdc324-all-categories-card','sdc325-all-categories-card');
        setImp(card,'grid-column','1 / -1');
      }else{
        setImp(card,'grid-column','auto');
      }
      var main=card.querySelector('.category-sheet-main-v199');
      if(main){
        setImp(main,'min-height',idx===0?'108px':'94px');
        setImp(main,'padding','10px 4px 5px');
        setImp(main,'display','grid');
        setImp(main,'place-items','center');
        setImp(main,'text-align','center');
      }
      var title=card.querySelector('.category-sheet-main-v199 span');
      if(title){
        setImp(title,'font-size',idx===0?'13px':'12px');
        setImp(title,'line-height','1.05');
        setImp(title,'overflow-wrap','anywhere');
      }
      var n=card.querySelector('.category-sheet-main-v199 b');
      if(n){
        setImp(n,'font-size',idx===0?'34px':'32px');
        setImp(n,'line-height','.86');
      }
      var small=card.querySelector('.category-sheet-main-v199 small');
      if(small){ setImp(small,'font-size','10px'); }
      var actions=card.querySelector('.category-sheet-actions-v199');
      if(actions){
        setImp(actions,'display','grid');
        setImp(actions,'grid-template-columns','1fr 1fr');
        setImp(actions,'gap','5px');
        setImp(actions,'padding','5px 6px 10px');
        setImp(actions,'position','static');
      }
      if(actions){
        actions.querySelectorAll('button').forEach(function(btn){
          setImp(btn,'min-width','0');
          setImp(btn,'width','100%');
          setImp(btn,'min-height','32px');
          setImp(btn,'font-size','10px');
          setImp(btn,'padding-left','4px');
          setImp(btn,'padding-right','4px');
          setImp(btn,'border-radius','11px');
        });
      }
    });
  }

  function polishCategorySheet(){
    document.querySelectorAll('.category-sheet-grid-v191,.category-sheet-grid-v199').forEach(forceCategoryGrid);
  }

  function patchCanvasCapture(){
    if(!window.html2canvas || window.html2canvas.__sdc327Patched) return;
    var original=window.html2canvas;
    var patched=function(node, opts){
      try{
        if(looksLikeCategoryCapture(node) || (node && node.querySelector && node.querySelector('*') && looksLikeCategoryCapture(node.querySelector('*')))){
          polishCapture(topCaptureRoot(node));
        }
      }catch(e){}
      return original.call(this,node,opts);
    };
    patched.__sdc327Patched=true;
    patched.__sdc326Patched=true;
    patched.__sdc325Patched=true;
    window.html2canvas=patched;
  }

  function polish(){
    patchCanvasCapture();
    polishCategorySheet();
    polishCategoryCaptures();
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
    new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    document.addEventListener('click',function(ev){
      if(ev.target.closest && ev.target.closest('[data-catcapture-v199], [data-action="categoryCapture"], [data-action="categoriesSheet"]')){
        setTimeout(polish,10);
        setTimeout(polish,60);
        setTimeout(polish,160);
        setTimeout(polish,420);
      }
    },true);
    var tries=0;
    var timer=setInterval(function(){
      patchCanvasCapture();
      if(window.html2canvas || ++tries>30) clearInterval(timer);
    },250);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
