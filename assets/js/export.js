import { showToast } from './helpers.js';

function prepareNode(node){
  node.classList.add('invoice-export-mode');
  return () => node.classList.remove('invoice-export-mode');
}

async function canvasFromNode(node){
  if(!window.html2canvas) throw new Error('No cargó html2canvas. Revise internet/CDN.');
  const cleanup = prepareNode(node);
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const canvas = await html2canvas(node, {
    scale: 3,
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: Math.max(document.documentElement.clientWidth, 1280)
  });
  cleanup();
  return canvas;
}

export async function downloadInvoiceImage(node, filename = 'cotizacion'){
  const canvas = await canvasFromNode(node);
  const link = document.createElement('a');
  link.download = `${filename}-SDC.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
  showToast('Imagen descargada.');
}

export async function downloadInvoicePdf(node, filename = 'cotizacion'){
  if(!window.jspdf?.jsPDF) throw new Error('No cargó jsPDF. Revise internet/CDN.');
  const canvas = await canvasFromNode(node);
  const imgData = canvas.toDataURL('image/png', 1.0);
  const { jsPDF } = window.jspdf;

  const isLandscape = canvas.width >= canvas.height * 0.92;
  const pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit:'mm', format:'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  const w = canvas.width * ratio;
  const h = canvas.height * ratio;
  const x = (pageW - w) / 2;
  const y = Math.max(margin, (pageH - h) / 2);
  pdf.addImage(imgData, 'PNG', x, y, w, h, undefined, 'FAST');
  pdf.save(`${filename}-SDC.pdf`);
  showToast('PDF descargado.');
}
