import { Injectable } from '@angular/core';

declare const jspdf: any;

@Injectable({
  providedIn: 'root'
})
export class RelatoriosPdfService {
  constructor() { }

  gerarPdf(titulo: string, colunas: any[], dados: any[][], nomeArquivo: string, totalizadores?: string[][]): void {
    const { jsPDF } = jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const clubName = 'Clube de Desbravadores';
    const today = new Date().toLocaleDateString('pt-BR');

    (pdf as any).autoTable({
      head: [colunas],
      body: dados,
      foot: totalizadores,
      startY: 22,
      didDrawPage: (data: any) => {
        // Cabeçalho
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text(clubName, pageWidth / 2, 10, { align: 'center' });
        
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(titulo, pageWidth / 2, 16, { align: 'center' });
        
        // Rodapé
        const pageCount = (pdf as any).internal.getNumberOfPages();
        pdf.setFontSize(8);
        pdf.text(`Página ${data.pageNumber} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        pdf.text(`Gerado em: ${today}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
      },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [30, 30, 30],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      footStyles: {
        fillColor: [230, 230, 230],
        textColor: 0,
        fontStyle: 'bold',
        halign: 'right'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      theme: 'grid'
    });
    
    // Recalcula o total de páginas e adiciona ao rodapé
    const pageCount = (pdf as any).internal.getNumberOfPages();
     for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`${nomeArquivo}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}