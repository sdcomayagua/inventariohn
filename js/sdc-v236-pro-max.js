document.documentElement.dataset.sdcV236='1';

/* SDC v296 fuerza estructura visual real en pantallas dinamicas */
(function(){
  if(window.__sdcV296StructureFix) return;
  window.__sdcV296StructureFix = true;

  const BLUE = '#075fca';
  const NAVY = '#08264d';
  const BORDER = '1px solid rgba(131,164,195,.28)';
  const SHADOW = '0 12px 30px rgba(6,43,82,.08)';

  function txt(el){ return String(el && el.textContent || '').toLowerCase(); }
  function css(el,obj){ if(!el) return; Object.assign(el.style,obj); }
  function isVisible(el){ return !!(el && el.offsetParent !== null); }
  function cardsIn(root){
    return Array.from(root.querySelectorAll('div,section,article')).filter(el=>{
      const t=txt(el);
      if(!t) return false;
      const r=el.getBoundingClientRect();
      if(r.width < 120 || r.height < 80) return false;
      const hasBtn=el.querySelector('button,a');
      const hasCardText=/imprimir|png|disponible|unidades|env[ií]o normal|pagar al recibir|comayagua/.test(t);
      return hasBtn || hasCardText;
    });
  }

  function fixCategories(){
    const root = document.querySelector('#modalRoot');
    if(!root || !/categor[ií]as/.test(txt(root))) return;
    const modalBody = Array.from(root.querySelectorAll('div,section')).find(el=>{
      const t=txt(el);
      const r=el.getBoundingClientRect();
      return r.width>260 && r.height>300 && /todas las categor/i.test(t) && /imprimir/i.test(t) && /png/i.test(t);
    });
    if(!modalBody) return;

    const categoryCards = Array.from(modalBody.children).filter(el=>{
      const t=txt(el);
      const r=el.getBoundingClientRect();
      return r.height>90 && /imprimir/.test(t) && /png/.test(t);
    });

    const listParent = categoryCards.length ? categoryCards[0].parentElement : null;
    if(listParent){
      css(listParent,{
        display:'grid',
        gridTemplateColumns:'repeat(2,minmax(0,1fr))',
        gap:'12px',
        alignItems:'stretch'
      });
    }

    categoryCards.forEach(card=>{
      css(card,{
        width:'auto',
        minWidth:'0',
        minHeight:'170px',
        padding:'14px',
        borderRadius:'22px',
        background:'#fff',
        border:BORDER,
        boxShadow:SHADOW,
        display:'flex',
        flexDirection:'column',
        justifyContent:'space-between',
        overflow:'hidden'
      });
      Array.from(card.querySelectorAll('h1,h2,h3,b,strong')).forEach(x=>css(x,{fontSize:'16px',lineHeight:'1.12',margin:'0 0 4px',color:'#08264d'}));
      Array.from(card.querySelectorAll('button,a')).forEach(btn=>css(btn,{minHeight:'40px',borderRadius:'14px',fontSize:'14px',fontWeight:'800',padding:'0 8px'}));
      const nums=Array.from(card.querySelectorAll('*')).filter(x=>/^\s*\d+\s*$/.test(x.textContent||'') && x.textContent.trim().length<4);
      nums.forEach(n=>css(n,{fontSize:'38px',lineHeight:'.95',fontWeight:'900',color:BLUE,margin:'0 0 4px'}));
    });

    if(window.innerWidth < 390 && listParent){ listParent.style.gridTemplateColumns='1fr'; }
  }

  function fixCatalog(){
    const app=document.querySelector('#app');
    if(!app || !/cat[aá]logo/.test(txt(app))) return;
    const cards = Array.from(app.querySelectorAll('div,article,section')).filter(el=>{
      const t=txt(el);
      const r=el.getBoundingClientRect();
      return r.width>250 && r.height>100 && /disponible/.test(t) && /unidades/.test(t) && el.querySelector('img');
    });
    cards.forEach(card=>{
      const img=card.querySelector('img');
      css(card,{borderRadius:'26px',padding:'14px',minHeight:'120px',background:'#fff',border:BORDER,boxShadow:SHADOW,gap:'14px'});
      css(img,{width:'92px',height:'92px',maxWidth:'92px',objectFit:'contain',borderRadius:'18px',background:'#f7fbff'});
      Array.from(card.querySelectorAll('h2,h3,b,strong')).forEach(h=>{
        const tx=txt(h);
        if(!/disponible|unidades/.test(tx)) css(h,{fontSize:'18px',lineHeight:'1.13',letterSpacing:'-.2px',color:NAVY,margin:'0'});
      });
      Array.from(card.querySelectorAll('span,em,small,button')).forEach(x=>{
        const t=txt(x);
        if(/disponible|unidades/.test(t)) css(x,{borderRadius:'999px',minHeight:'32px',padding:'0 12px',fontSize:'13px',fontWeight:'800',display:'inline-flex',alignItems:'center'});
      });
    });
  }

  function fixDetailPrices(){
    const root=document.querySelector('#modalRoot');
    if(!root || !/dedales|cantidad|colores/.test(txt(root))) return;
    const blocks = Array.from(root.querySelectorAll('div,section,article')).filter(el=>{
      const t=txt(el);
      const r=el.getBoundingClientRect();
      return r.width>180 && r.height>55 && (/env[ií]o normal/.test(t)||/pagar al recibir/.test(t)||/comayagua/.test(t)) && /lps/.test(t);
    });
    blocks.forEach(card=>{
      css(card,{
        width:'100%',
        maxWidth:'none',
        minHeight:'108px',
        padding:'16px 18px',
        borderRadius:'24px',
        background:'#fff',
        border:BORDER,
        display:'grid',
        gridTemplateColumns:'minmax(0,1fr) auto',
        alignItems:'center',
        gap:'12px',
        margin:'0 0 12px',
        overflow:'visible',
        transform:'none'
      });
      Array.from(card.querySelectorAll('*')).forEach(x=>{
        if(/lps\.\s*\d+/i.test(x.textContent||'')) css(x,{fontSize:'clamp(32px,8vw,44px)',lineHeight:'1',fontWeight:'900',whiteSpace:'nowrap',textAlign:'right',color:BLUE});
        else css(x,{maxWidth:'100%',overflow:'visible',wordBreak:'normal'});
      });
    });
  }

  function fixReceipts(){
    const app=document.querySelector('#app');
    const body=txt(app)+txt(document.querySelector('#modalRoot'));
    if(!/comparativa de pago|recibo corto|ahorro por dep[oó]sito/.test(body)) return;
    const scope = /comparativa de pago/.test(txt(document.querySelector('#modalRoot'))) ? document.querySelector('#modalRoot') : app;
    if(!scope) return;
    Array.from(scope.querySelectorAll('div,section,article')).forEach(el=>{
      const t=txt(el);
      const r=el.getBoundingClientRect();
      if(r.width>250 && r.height>140 && (/env[ií]o normal|pagar al recibir|recibo corto|total a pagar/.test(t))){
        css(el,{borderRadius:'24px',boxSizing:'border-box',overflow:'hidden'});
      }
    });
  }

  function run(){
    try{ fixCategories(); fixCatalog(); fixDetailPrices(); fixReceipts(); }catch(e){ console.warn('SDC v296 visual fix',e); }
  }

  let timer=null;
  function schedule(){ clearTimeout(timer); timer=setTimeout(run,80); }
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true,attributes:true});
  window.addEventListener('resize',schedule);
  window.addEventListener('load',schedule);
  document.addEventListener('click',()=>setTimeout(run,120),true);
  setInterval(run,1200);
  schedule();
})();
