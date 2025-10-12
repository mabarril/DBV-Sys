import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EventosService } from '../../eventos/eventos.service';
import { MembrosService } from '../../membros/membros.service';
import { Evento } from '../../eventos/evento.model';
import { Membro } from '../../membros/membro.model';
import { RelatoriosPdfService } from '../relatorios-pdf.service';

@Component({
  selector: 'app-relatorio-eventos',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './relatorio-eventos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioEventosComponent {
  private eventosService = inject(EventosService);
  private membrosService = inject(MembrosService);
  private pdfService = inject(RelatoriosPdfService);

  eventos = computed(() => this.eventosService.getEventos()().sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()));
  private inscricoes = this.eventosService.getInscricoes();
  private membros = this.membrosService.getMembros();
  
  eventoSelecionadoId = signal<number | null>(null);

  private membrosMap = computed(() => {
    const map = new Map<number, Membro>();
    this.membros().forEach(m => map.set(m.id, m));
    return map;
  });

  eventoSelecionado = computed(() => {
    const id = this.eventoSelecionadoId();
    if (!id) return null;
    return this.eventos().find(e => e.id === id);
  });

  inscritosNoEvento = computed<Membro[]>(() => {
    const id = this.eventoSelecionadoId();
    if (!id) return [];

    const inscritosIds = this.inscricoes()
      .filter(i => i.eventoId === id)
      .map(i => i.membroId);
    
    return inscritosIds
      .map(id => this.membrosMap().get(id))
      .filter((m): m is Membro => !!m)
      .sort((a,b) => a.nome.localeCompare(b.nome));
  });

  onEventoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.eventoSelecionadoId.set(value ? Number(value) : null);
  }

  calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return age;
  }

  exportPdf(): void {
    const evento = this.eventoSelecionado();
    if (!evento) return;
    
    const colunas = ['Nome', 'Unidade', 'Cargo', 'Idade'];
    const dados = this.inscritosNoEvento().map(m => [
      m.nome,
      m.unidade,
      m.cargo,
      this.calculateAge(m.dataNascimento).toString()
    ]);
     const totalizadores = [
        [{ content: `Total de Inscritos: ${dados.length}`, colSpan: 4, styles: { halign: 'right' } }]
    ];

    const titulo = `Relatório de Inscrições - ${evento.tipo}`;
    const nomeArquivo = `relatorio_evento_${evento.tipo.replace(/\s+/g, '_')}`;
    
    this.pdfService.gerarPdf(titulo, colunas, dados, nomeArquivo, totalizadores);
  }
}
