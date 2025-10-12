import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FinancasService } from '../financas.service';
import { Custo } from '../inscricao.model';
import { CustoFormComponent } from './custo-form/custo-form.component';

@Component({
  selector: 'app-custos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, CustoFormComponent],
  templateUrl: './custos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustosComponent {
  private financasService = inject(FinancasService);

  isModalOpen = signal(false);
  editingCusto = signal<Custo | null>(null);

  custos = computed(() => {
    return this.financasService.getCustos()()
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  });

  openModal(custo: Custo | null): void {
    this.editingCusto.set(custo);
    this.isModalOpen.set(true);
  }
  
  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handleSave(data: Omit<Custo, 'id'> & { id?: number }): void {
    if (data.id) {
      this.financasService.updateCusto(data as Custo);
    } else {
      this.financasService.addCusto(data);
    }
    this.closeModal();
  }

  handleDelete(custo: Custo): void {
    if (confirm(`Tem certeza que deseja excluir o custo "${custo.descricao}"?`)) {
      this.financasService.deleteCusto(custo.id);
    }
  }
}