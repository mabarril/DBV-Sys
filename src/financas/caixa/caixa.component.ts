import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FinancasService } from '../financas.service';
import { MovimentacaoCaixa } from '../inscricao.model';
import { MovimentacaoFormComponent } from './movimentacao-form/movimentacao-form.component';

@Component({
  selector: 'app-caixa',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MovimentacaoFormComponent],
  templateUrl: './caixa.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaixaComponent {
  private financasService = inject(FinancasService);

  isModalOpen = signal(false);
  editingMovimentacao = signal<MovimentacaoCaixa | null>(null);

  movimentacoes = computed(() => {
    return this.financasService.getMovimentacoes()().sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  });

  totalEntradas = computed(() => {
    return this.movimentacoes()
      .filter(m => m.tipo === 'Entrada')
      .reduce((acc, m) => acc + m.valor, 0);
  });

  totalSaidas = computed(() => {
    return this.movimentacoes()
      .filter(m => m.tipo === 'Saída')
      .reduce((acc, m) => acc + m.valor, 0);
  });

  saldoAtual = computed(() => this.totalEntradas() - this.totalSaidas());

  openModal(mov: MovimentacaoCaixa | null): void {
    this.editingMovimentacao.set(mov);
    this.isModalOpen.set(true);
  }
  
  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handleSave(data: Omit<MovimentacaoCaixa, 'id'> & { id?: number }): void {
    if (data.id) {
      this.financasService.updateMovimentacao(data as MovimentacaoCaixa);
    } else {
      this.financasService.addMovimentacao(data);
    }
    this.closeModal();
  }

  handleDelete(mov: MovimentacaoCaixa): void {
    if (confirm(`Tem certeza que deseja excluir a movimentação "${mov.descricao}"?`)) {
      this.financasService.deleteMovimentacao(mov.id);
    }
  }
}