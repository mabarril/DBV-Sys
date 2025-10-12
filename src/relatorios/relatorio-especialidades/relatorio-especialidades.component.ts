import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EspecialidadesService } from '../../especialidades/especialidades.service';
import { MembrosService } from '../../membros/membros.service';
import { Membro } from '../../membros/membro.model';
import { RelatoriosPdfService } from '../relatorios-pdf.service';

interface RelatorioItem {
  membroNome: string;
  unidade: string;
  especialidadeNome: string;
  dataConclusao: string;
  instrutorNome: string;
}

@Component({
  selector: 'app-relatorio-especialidades',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './relatorio-especialidades.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioEspecialidadesComponent {
  private especialidadesService = inject(EspecialidadesService);
  private membrosService = inject(MembrosService);
  private pdfService = inject(RelatoriosPdfService);

  especialidades = this.especialidadesService.getEspecialidades();
  private conclusoes = this.especialidadesService.getConclusoes();
  private membros = this.membrosService.getMembros();

  filtros = signal({
    especialidadeId: '',
    unidade: '',
    ano: '',
    mes: ''
  });

  unidades = computed(() => {
    const allUnidades = this.membros().map(m => m.unidade);
    return [...new Set(allUnidades)].sort();
  });

  anosDisponiveis = computed(() => {
    const allAnos = this.conclusoes().map(c => new Date(c.dataConclusao).getFullYear());
    return [...new Set(allAnos)].sort((a: number, b: number) => b - a);
  });

  meses = [
    { valor: '1', nome: 'Janeiro' }, { valor: '2', nome: 'Fevereiro' },
    { valor: '3', nome: 'Março' }, { valor: '4', nome: 'Abril' },
    { valor: '5', nome: 'Maio' }, { valor: '6', nome: 'Junho' },
    { valor: '7', nome: 'Julho' }, { valor: '8', nome: 'Agosto' },
    { valor: '9', nome: 'Setembro' }, { valor: '10', nome: 'Outubro' },
    { valor: '11', nome: 'Novembro' }, { valor: '12', nome: 'Dezembro' }
  ];

  private membrosDataMap = computed(() => {
    const map = new Map<number, { nome: string; unidade: Membro['unidade'] }>();
    this.membros().forEach(m => map.set(m.id, { nome: m.nome, unidade: m.unidade }));
    return map;
  });

  private especialidadesMap = computed(() => {
    const map = new Map<number, string>();
    this.especialidades().forEach(e => map.set(e.id, e.nome));
    return map;
  });

  relatorioResultados = computed<RelatorioItem[]>(() => {
    const { especialidadeId, unidade, ano, mes } = this.filtros();
    
    return this.conclusoes()
      .filter(c => {
        const data = new Date(`${c.dataConclusao}T12:00:00`);
        const membro = this.membrosDataMap().get(c.membroId);

        const matchEspecialidade = !especialidadeId || c.especialidadeId === Number(especialidadeId);
        const matchUnidade = !unidade || membro?.unidade === unidade;
        const matchAno = !ano || data.getFullYear() === Number(ano);
        const matchMes = !mes || (data.getMonth() + 1) === Number(mes);
        
        return matchEspecialidade && matchUnidade && matchAno && matchMes;
      })
      .map(c => {
        const membro = this.membrosDataMap().get(c.membroId);
        const instrutor = this.membrosDataMap().get(c.instrutorId);
        return {
          membroNome: membro?.nome ?? 'Desconhecido',
          unidade: membro?.unidade ?? 'N/A',
          especialidadeNome: this.especialidadesMap().get(c.especialidadeId) ?? 'Desconhecida',
          dataConclusao: c.dataConclusao,
          instrutorNome: instrutor?.nome ?? 'Desconhecido'
        };
      })
      .sort((a, b) => new Date(b.dataConclusao).getTime() - new Date(a.dataConclusao).getTime());
  });

  onFiltroChange(event: Event, tipo: 'especialidadeId' | 'unidade' | 'ano' | 'mes'): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filtros.update(f => ({ ...f, [tipo]: value }));
  }

  exportPdf(): void {
    const colunas = ['Membro', 'Unidade', 'Especialidade', 'Data Conclusão', 'Instrutor'];
    const dados = this.relatorioResultados().map(item => [
      item.membroNome,
      item.unidade,
      item.especialidadeNome,
      new Date(item.dataConclusao  + 'T00:00:00').toLocaleDateString('pt-BR'),
      item.instrutorNome
    ]);
     const totalizadores = [
        [{ content: `Total de Conclusões: ${dados.length}`, colSpan: 5, styles: { halign: 'right' } }]
    ];

    this.pdfService.gerarPdf('Relatório de Especialidades', colunas, dados, 'relatorio_especialidades', totalizadores);
  }
}