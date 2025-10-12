import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FinancasService } from '../../financas/financas.service';
import { RelatoriosPdfService } from '../relatorios-pdf.service';

@Component({
  selector: 'app-relatorio-caixa',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Relatório de Fluxo de Caixa</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label for="caixaDataInicio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
          <input type="date" id="caixaDataInicio" (change)="onFiltroChange($event, 'dataInicio')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
        </div>
        <div>
          <label for="caixaDataFim" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Final</label>
          <input type="date" id="caixaDataFim" (change)="onFiltroChange($event, 'dataFim')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
        </div>
        <div class="lg:col-start-5">
            <button (click)="exportPdf()" class="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd" /></svg>
            Exportar PDF
            </button>
        </div>
    </div>
    
    <div class="mt-6 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Data</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Entrada</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Saída</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          @for (mov of movimentacoes(); track mov.id) {
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ mov.data | date:'dd/MM/yyyy' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ mov.descricao }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-green-600 dark:text-green-400">
                {{ mov.tipo === 'Entrada' ? (mov.valor | currency:'BRL') : '' }}
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-red-600 dark:text-red-400">
                {{ mov.tipo === 'Saída' ? (mov.valor | currency:'BRL') : '' }}
              </td>
            </tr>
          } @empty {
            <tr><td colspan="4" class="text-center p-6 text-sm text-gray-500 dark:text-gray-400">Nenhuma movimentação no período.</td></tr>
          }
        </tbody>
         <tfoot class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <td class="px-6 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200" colspan="2">Totais</td>
              <td class="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 font-mono">{{ totalEntradas() | currency:'BRL' }}</td>
              <td class="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 font-mono">{{ totalSaidas() | currency:'BRL' }}</td>
            </tr>
             <tr>
              <td class="px-6 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200" colspan="3">Saldo do Período</td>
              <td class="px-6 py-3 text-right text-sm font-bold font-mono" [class]="saldoAtual() >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ saldoAtual() | currency:'BRL' }}</td>
            </tr>
          </tfoot>
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioCaixaComponent {
  private financasService = inject(FinancasService);
  private pdfService = inject(RelatoriosPdfService);
  private currencyPipe = inject(CurrencyPipe);

  private movimentacoesOriginais = this.financasService.getMovimentacoes();
  filtros = signal({ dataInicio: '', dataFim: '' });

  movimentacoes = computed(() => {
    const { dataInicio, dataFim } = this.filtros();
    
    return this.movimentacoesOriginais()
      .filter(mov => {
        if (!dataInicio && !dataFim) return true;
        const dataMov = new Date(mov.data + 'T00:00:00');
        const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
        const fim = dataFim ? new Date(dataFim + 'T00:00:00') : null;
        if (inicio && dataMov < inicio) return false;
        if (fim && dataMov > fim) return false;
        return true;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  });

  totalEntradas = computed(() => this.movimentacoes().filter(m => m.tipo === 'Entrada').reduce((acc, m) => acc + m.valor, 0));
  totalSaidas = computed(() => this.movimentacoes().filter(m => m.tipo === 'Saída').reduce((acc, m) => acc + m.valor, 0));
  saldoAtual = computed(() => this.totalEntradas() - this.totalSaidas());
  
  onFiltroChange(event: Event, tipo: 'dataInicio' | 'dataFim') {
    const value = (event.target as HTMLInputElement).value;
    this.filtros.update(f => ({ ...f, [tipo]: value }));
  }

  exportPdf(): void {
    const colunas = ['Data', 'Descrição', 'Entrada', 'Saída'];
    const dados = this.movimentacoes().map(item => [
      new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      item.descricao,
      item.tipo === 'Entrada' ? this.currencyPipe.transform(item.valor, 'BRL') : '',
      item.tipo === 'Saída' ? this.currencyPipe.transform(item.valor, 'BRL') : '',
    ]);

    const totalizadores = [
        ['Total Entradas', '', this.currencyPipe.transform(this.totalEntradas(), 'BRL'), ''],
        ['Total Saídas', '', '', this.currencyPipe.transform(this.totalSaidas(), 'BRL')],
        ['Saldo do Período', '', '', this.currencyPipe.transform(this.saldoAtual(), 'BRL')],
    ];

    this.pdfService.gerarPdf('Relatório de Fluxo de Caixa', colunas, dados, 'relatorio_caixa', totalizadores);
  }
}
