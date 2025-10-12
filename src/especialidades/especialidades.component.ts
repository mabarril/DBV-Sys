import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EspecialidadesService } from './especialidades.service';
import { MembrosService } from '../membros/membros.service';
import { Especialidade, ConclusaoEspecialidade, AreaEspecialidade } from './especialidade.model';
import { Membro } from '../membros/membro.model';
import { EspecialidadeFormComponent } from './especialidade-form/especialidade-form.component';
import { ConclusaoFormComponent } from './conclusao-form/conclusao-form.component';

interface GroupedEspecialidades {
  area: AreaEspecialidade;
  especialidades: Especialidade[];
}

interface RelatorioItem {
  membroNome: string;
  unidade: string;
  especialidadeNome: string;
  dataConclusao: string;
  instrutorNome: string;
}

@Component({
  selector: 'app-especialidades',
  standalone: true,
  imports: [DatePipe, EspecialidadeFormComponent, ConclusaoFormComponent],
  templateUrl: './especialidades.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspecialidadesComponent {
  private especialidadesService = inject(EspecialidadesService);
  private membrosService = inject(MembrosService);

  especialidades = this.especialidadesService.getEspecialidades();
  conclusoes = this.especialidadesService.getConclusoes();
  membros = this.membrosService.getMembros();

  isEspecialidadeModalOpen = signal(false);
  editingEspecialidade = signal<Especialidade | null>(null);
  
  isConclusaoModalOpen = signal(false);
  activeEspecialidadeForConclusao = signal<Especialidade | null>(null);

  // --- Report Logic ---
  filtros = signal({
    especialidadeId: '',
    unidade: '',
    ano: '',
    mes: ''
  });
  relatorioGerado = signal(false);
  relatorioResultados = signal<RelatorioItem[]>([]);

  unidades = computed(() => {
    const allUnidades = this.membros().map(m => m.unidade);
    return [...new Set(allUnidades)].sort();
  });

  anosDisponiveis = computed(() => {
    const allAnos = this.conclusoes().map(c => new Date(c.dataConclusao).getFullYear());
    return [...new Set(allAnos)].sort((a, b) => b - a);
  });

  meses = [
    { valor: '1', nome: 'Janeiro' }, { valor: '2', nome: 'Fevereiro' },
    { valor: '3', nome: 'Março' }, { valor: '4', nome: 'Abril' },
    { valor: '5', nome: 'Maio' }, { valor: '6', nome: 'Junho' },
    { valor: '7', nome: 'Julho' }, { valor: '8', nome: 'Agosto' },
    { valor: '9', nome: 'Setembro' }, { valor: '10', nome: 'Outubro' },
    { valor: '11', nome: 'Novembro' }, { valor: '12', nome: 'Dezembro' }
  ];

  private membrosMap = computed(() => {
    const map = new Map<number, string>();
    this.membros().forEach(membro => map.set(membro.id, membro.nome));
    return map;
  });

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

  groupedEspecialidades = computed<GroupedEspecialidades[]>(() => {
    const grouped: { [key in AreaEspecialidade]?: Especialidade[] } = {};
    for (const especialidade of this.especialidades()) {
      if (!grouped[especialidade.area]) {
        grouped[especialidade.area] = [];
      }
      grouped[especialidade.area]?.push(especialidade);
    }
    return Object.entries(grouped).map(([area, especialidades]) => ({
      area: area as AreaEspecialidade,
      especialidades,
    }));
  });

  getConclusoesPorEspecialidade(especialidadeId: number): ConclusaoEspecialidade[] {
    return this.conclusoes().filter(c => c.especialidadeId === especialidadeId);
  }

  getMembroNome(membroId: number): string {
    return this.membrosMap().get(membroId) ?? 'Desconhecido';
  }

  // Especialidade Modal
  openEspecialidadeModal(especialidade: Especialidade | null): void {
    this.editingEspecialidade.set(especialidade);
    this.isEspecialidadeModalOpen.set(true);
  }

  closeEspecialidadeModal(): void {
    this.isEspecialidadeModalOpen.set(false);
  }

  handleSaveEspecialidade(data: Omit<Especialidade, 'id'> & { id?: number }): void {
    if (data.id) {
      this.especialidadesService.updateEspecialidade(data as Especialidade);
    } else {
      this.especialidadesService.addEspecialidade(data);
    }
    this.closeEspecialidadeModal();
  }

  handleDeleteEspecialidade(especialidade: Especialidade): void {
    if (confirm(`Tem certeza que deseja excluir a especialidade ${especialidade.nome}? Todas as conclusões associadas também serão removidas.`)) {
      this.especialidadesService.deleteEspecialidade(especialidade.id);
    }
  }

  // Conclusao Modal
  openConclusaoModal(especialidade: Especialidade): void {
    this.activeEspecialidadeForConclusao.set(especialidade);
    this.isConclusaoModalOpen.set(true);
  }

  closeConclusaoModal(): void {
    this.isConclusaoModalOpen.set(false);
  }

  handleSaveConclusao(data: { membroIds: number[]; instrutorId: number; dataConclusao: string; }): void {
    const especialidadeId = this.activeEspecialidadeForConclusao()?.id;
    if (especialidadeId) {
      for (const membroId of data.membroIds) {
        const jaExiste = this.conclusoes().some(c => 
          c.membroId === membroId && c.especialidadeId === especialidadeId
        );

        if (!jaExiste) {
          const novaConclusao: ConclusaoEspecialidade = {
            membroId,
            especialidadeId,
            instrutorId: data.instrutorId,
            dataConclusao: data.dataConclusao,
          };
          this.especialidadesService.addConclusao(novaConclusao);
        }
      }
    }
    this.closeConclusaoModal();
  }

  // Report Methods
  onFiltroChange(event: Event, tipo: 'especialidadeId' | 'unidade' | 'ano' | 'mes'): void {
    const value = (event.target as HTMLSelectElement).value;
    this.filtros.update(f => ({ ...f, [tipo]: value }));
  }

  gerarRelatorio(): void {
    const { especialidadeId, unidade, ano, mes } = this.filtros();
    
    const resultadosFiltrados = this.conclusoes()
      .filter(c => {
        const data = new Date(`${c.dataConclusao}T12:00:00`); // Use T12 to avoid timezone issues
        const membro = this.membrosDataMap().get(c.membroId);

        const matchEspecialidade = !especialidadeId || c.especialidadeId === Number(especialidadeId);
        const matchUnidade = !unidade || membro?.unidade === unidade;
        const matchAno = !ano || data.getFullYear() === Number(ano);
        const matchMes = !mes || (data.getMonth() + 1) === Number(mes);
        
        return matchEspecialidade && matchUnidade && matchAno && matchMes;
      })
      .map(c => {
        const membro = this.membrosDataMap().get(c.membroId);
        const instrutor = this.membrosMap().get(c.instrutorId);
        return {
          membroNome: membro?.nome ?? 'Desconhecido',
          unidade: membro?.unidade ?? 'N/A',
          especialidadeNome: this.especialidadesMap().get(c.especialidadeId) ?? 'Desconhecida',
          dataConclusao: c.dataConclusao,
          instrutorNome: instrutor ?? 'Desconhecido'
        };
      })
      .sort((a, b) => new Date(b.dataConclusao).getTime() - new Date(a.dataConclusao).getTime());

    this.relatorioResultados.set(resultadosFiltrados);
    this.relatorioGerado.set(true);
  }
}
