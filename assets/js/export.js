import { downloadBlob, showToast } from './helpers.js';
function assertLibraries(){ if(!window.html2canvas) throw new Error('html2canvas no cargó todavía. Intente de nuevo.'); if(!window.jspdf?.jsPDF) throw new Error('jsPDF no cargó todavía. Intente de nuevo.'); }
export async function captureInvoiceElement(element){
  if(!window.html2canvas) throw new Error('html2canvas no cargó todavía. Intente de nuevo.');
  return await window.html2canvas(element,{scale:3,useCORS:true,backgroundColor:'#ffffff',logging:false,windowWidth:element.scrollWidth,windowHeight:element.scrollHeight});
}
export async function downloadInvoiceImage(element, quoteId){
  const canvas = await captureInvoiceElement(element);
  canvas.toBlob(blob=>{ if(!blob) return showToast('No se pudo generar la imagen.'); downloadBlob(blob, `${quoteId || 'cotizacion'}-SDC.png`); showToast('Imagen generada correctamente.'); }, 'image/png', 1);
}
export async function downloadInvoicePdf(element, quoteId){
  assertLibraries();
  const canvas = await captureInvoiceElement(element);
  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({orientation:'portrait',unit:'pt',format:'a4'});
  const pageW = pdf.internal.pageSize.getWidth(); const pageH = pdf.internal.pageSize.getHeight(); const margin=22;
  const usableW = pageW - margin * 2; const usableH = pageH - margin * 2; const ratio = canvas.height / canvas.width;
  let renderW = usableW; let renderH = renderW * ratio;
  if(renderH > usableH){ renderH = usableH; renderW = renderH / ratio; }
  const x=(pageW-renderW)/2; pdf.addImage(imgData,'PNG',x,margin,renderW,renderH,undefined,'FAST');
  pdf.save(`${quoteId || 'cotizacion'}-SDC.pdf`); showToast('PDF generado correctamente.');
}
