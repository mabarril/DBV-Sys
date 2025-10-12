import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AtasService } from '../../atas/atas.service';
import { MembrosService } from '../../membros/membros.service';
import { Ata, TipoAta } from '../../atas/ata.model';

declare const jspdf: any;

@Component({
  selector: 'app-relatorio-atas',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './relatorio-atas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioAtasComponent {
  private atasService = inject(AtasService);
  private membrosService = inject(MembrosService);

  private atas = this.atasService.getAtas();
  private membros = this.membrosService.getMembros();

  tiposAta: TipoAta[] = ['Reunião de Diretoria', 'Comissão Disciplinar', 'Reunião Regular', 'Outro'];
  filtros = signal({ dataInicio: '', dataFim: '', tipo: '' });

  filteredAtas = computed(() => {
    const { dataInicio, dataFim, tipo } = this.filtros();
    return this.atas()
      .filter(ata => {
        const matchTipo = !tipo || ata.tipo === tipo;
        const dataAta = new Date(ata.data + 'T00:00:00');
        const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
        const fim = dataFim ? new Date(dataFim + 'T00:00:00') : null;
        let matchData = true;
        if (inicio && dataAta < inicio) matchData = false;
        if (fim && dataAta > fim) matchData = false;
        return matchTipo && matchData;
      })
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  });

  private membrosMap = computed(() => {
    const map = new Map<number, string>();
    this.membros().forEach(m => map.set(m.id, m.nome));
    return map;
  });

  getMembroNome(id: number): string {
    return this.membrosMap().get(id) ?? 'Membro desconhecido';
  }

  onFiltroChange(event: Event, tipo: 'dataInicio' | 'dataFim' | 'tipo') {
    const value = (event.target as HTMLInputElement).value;
    this.filtros.update(f => ({ ...f, [tipo]: value }));
  }

  exportPdf(): void {
    const { jsPDF } = jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let cursorY = margin;
    const today = new Date().toLocaleDateString('pt-BR');
    const clubName = 'Clube de Desbravadores';
    const reportTitle = 'Livro de Atas e Atos';

    const addHeader = () => {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(clubName, pageWidth / 2, margin, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text(reportTitle, pageWidth / 2, margin + 6, { align: 'center' });
      cursorY = margin + 16;
    };
    
    const addFooter = (pageNumber: number) => {
        pdf.setFontSize(8);
        pdf.text(`Gerado em: ${today}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        pdf.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    };

    let pageNumber = 1;
    addHeader();
    addFooter(pageNumber);

    this.filteredAtas().forEach((ata, index) => {
      if (index > 0) {
        cursorY += 5; 
        pdf.setLineWidth(0.5);
        pdf.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 8;
      }
      
      const checkPageBreak = (neededHeight: number) => {
        if (cursorY + neededHeight > pageHeight - margin) {
            pdf.addPage();
            pageNumber++;
            addHeader();
            addFooter(pageNumber);
        }
      };

      checkPageBreak(20);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(ata.titulo, margin, cursorY);
      cursorY += 6;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`${ata.tipo} - ${new Date(ata.data + 'T00:00:00').toLocaleDateString('pt-BR')}`, margin, cursorY);
      cursorY += 8;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const descLines = pdf.splitTextToSize(ata.descricao, pageWidth - margin * 2);
      checkPageBreak(descLines.length * 5);
      pdf.text(descLines, margin, cursorY);
      cursorY += descLines.length * 5 + 4;

      const participantes = ata.participantesIds.map(id => this.getMembroNome(id)).join(', ');
      checkPageBreak(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Participantes:', margin, cursorY);
      pdf.setFont('helvetica', 'normal');
      const partLines = pdf.splitTextToSize(participantes, pageWidth - margin * 2 - 25); // a bit of indent
      pdf.text(partLines, margin + 25, cursorY);
      cursorY += partLines.length * 5 + 4;
    });

    // Recalcula o total de páginas e adiciona ao rodapé de todas as páginas
    const pageCount = (pdf as any).internal.getNumberOfPages();
     for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    pdf.save(`relatorio_atas_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}
