import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { ClassesService } from './classes.service';
import { MembrosService } from '../membros/membros.service';
import { Unidade, NomeClasse, Classe } from './classe.model';
import { UnidadeFormComponent } from './unidade-form/unidade-form.component';

@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [UnidadeFormComponent],
  templateUrl: './classes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassesComponent {
  private classesService = inject(ClassesService);
  private membrosService = inject(MembrosService);

  classes = this.classesService.getClasses();
  isModalOpen = signal(false);
  editingUnidade = signal<Unidade | null>(null);
  activeClasse = signal<NomeClasse | null>(null);

  private counselorsMap = computed(() => {
    const map = new Map<number, string>();
    // FIX: Call the signal to get its value before using array methods.
    this.membrosService.getMembros()().forEach(membro => {
      map.set(membro.id, membro.nome);
    });
    return map;
  });

  getConselheiroNome(id: number | null): string {
    if (id === null) return 'Não definido';
    return this.counselorsMap().get(id) ?? 'Conselheiro não encontrado';
  }

  openAddModal(classe: Classe): void {
    this.activeClasse.set(classe.nome);
    this.editingUnidade.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(unidade: Unidade, classe: Classe): void {
    this.activeClasse.set(classe.nome);
    this.editingUnidade.set(unidade);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingUnidade.set(null);
    this.activeClasse.set(null);
  }

  handleSave(unidadeData: Omit<Unidade, 'id'> & { id?: number }): void {
    const classeNome = this.activeClasse();
    if (!classeNome) return;

    if (unidadeData.id) {
      this.classesService.updateUnidade(classeNome, unidadeData as Unidade);
    } else {
      this.classesService.addUnidade(classeNome, unidadeData);
    }
    this.closeModal();
  }

  handleDelete(unidade: Unidade, classe: Classe): void {
    if (confirm(`Tem certeza que deseja excluir a unidade ${unidade.nome}?`)) {
      this.classesService.deleteUnidade(classe.nome, unidade.id);
    }
  }
}
