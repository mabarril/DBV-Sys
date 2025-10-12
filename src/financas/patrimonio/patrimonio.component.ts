import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FinancasService } from '../financas.service';
import { Patrimonio } from '../inscricao.model';
import { PatrimonioFormComponent } from './patrimonio-form/patrimonio-form.component';

@Component({
  selector: 'app-patrimonio',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, PatrimonioFormComponent],
  templateUrl: './patrimonio.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatrimonioComponent {
  private financasService = inject(FinancasService);
  
  isModalOpen = signal(false);
  editingPatrimonio = signal<Patrimonio | null>(null);

  patrimonio = computed(() => {
    return this.financasService.getPatrimonio()()
      .sort((a, b) => new Date(b.dataAquisicao).getTime() - new Date(a.dataAquisicao).getTime());
  });

  openModal(item: Patrimonio | null): void {
    this.editingPatrimonio.set(item);
    this.isModalOpen.set(true);
  }
  
  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handleSave(data: Omit<Patrimonio, 'id'> & { id?: number }): void {
    if (data.id) {
      this.financasService.updatePatrimonio(data as Patrimonio);
    } else {
      this.financasService.addPatrimonio(data);
    }
    this.closeModal();
  }

  handleDelete(item: Patrimonio): void {
    if (confirm(`Tem certeza que deseja excluir o item "${item.nome}" do patrimônio?`)) {
      this.financasService.deletePatrimonio(item.id);
    }
  }
}