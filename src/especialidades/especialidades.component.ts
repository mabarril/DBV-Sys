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

  private membrosMap = computed(() => {
    const map = new Map<number, string>();
    this.membros().forEach(membro => map.set(membro.id, membro.nome));
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
}