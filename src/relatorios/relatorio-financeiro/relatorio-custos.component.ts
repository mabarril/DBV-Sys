import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FinancasService } from '../../financas/financas.service';
import { CategoriaCusto } from '../../financas/inscricao.model';
import { RelatoriosPdfService } from '../relatorios-pdf.service';

@Component({
  selector: 'app-relatorio-custos',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Relatório de Custos</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div>
          <label for="custoDataInicio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
          <input type="date" id="custoDataInicio" (change)="onFiltroChange($event, 'dataInicio')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
        </div>
        <div>
          <label for="custoDataFim" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Final</label>
          <input type="date" id="custoDataFim" (change)="onFiltroChange($event, 'dataFim')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
        </div>
        <div class="sm:col-span-2 lg:col-span-1">
          <label for="custoCategoria" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoria</label>
          <select id="custoCategoria" (change)="onFiltroChange($event, 'categoria')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
            <option value="">Todas</option>
            @for (cat of categorias; track cat) {
              <option [value]="cat">{{cat}}</option>
            }
          </select>
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
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Categoria</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor</th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                @for (custo of custos(); track custo.id) {
                <tr>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ custo.data | date:'dd/MM/yyyy' }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{{ custo.descricao }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ custo.categoria }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-red-600 dark:text-red-400">{{ custo.valor | currency:'BRL' }}</td>
                </tr>
                } @empty {
                    <tr><td colspan="4" class="text-center p-6 text-sm text-gray-500 dark:text-gray-400">Nenhum custo no período.</td></tr>
                }
            </tbody>
            <tfoot class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <td class="px-6 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200" colspan="3">Total de Custos</td>
                    <td class="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 font-mono">{{ totalCustos() | currency:'BRL' }}</td>
                </tr>
            </tfoot>
        </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioCustosComponent {
  private financasService = inject(FinancasService);
  private pdfService = inject(RelatoriosPdfService);
  private currencyPipe = inject(CurrencyPipe);

  private allCustos = this.financasService.getCustos();
  categorias: CategoriaCusto[] = ['Alimentação', 'Transporte', 'Material de Escritório', 'Eventos', 'Outros'];
  filtros = signal({ dataInicio: '', dataFim: '', categoria: '' });

  custos = computed(() => {
    const { dataInicio, dataFim, categoria } = this.filtros();
    return this.allCustos()
      .filter(custo => {
        const matchCategoria = !categoria || custo.categoria === categoria;
        const dataCusto = new Date(custo.data + 'T00:00:00');
        const inicio = dataInicio ? new Date(dataInicio + 'T00:00:00') : null;
        const fim = dataFim ? new Date(dataFim + 'T00:00:00') : null;
        let matchData = true;
        if (inicio && dataCusto < inicio) matchData = false;
        if (fim && dataCusto > fim) matchData = false;
        return matchCategoria && matchData;
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  });

  totalCustos = computed(() => this.custos().reduce((acc, custo) => acc + custo.valor, 0));
  
  onFiltroChange(event: Event, tipo: 'dataInicio' | 'dataFim' | 'categoria') {
    const value = (event.target as HTMLInputElement).value;
    this.filtros.update(f => ({ ...f, [tipo]: value }));
  }

  exportPdf(): void {
    const colunas = ['Data', 'Descrição', 'Categoria', 'Valor'];
    const dados = this.custos().map(item => [
      new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR'),
      item.descricao,
      item.categoria,
      this.currencyPipe.transform(item.valor, 'BRL')
    ]);
    const totalizadores = [
      ['Total de Custos', '', '', this.currencyPipe.transform(this.totalCustos(), 'BRL')]
    ];
    this.pdfService.gerarPdf('Relatório de Custos', colunas, dados, 'relatorio_custos', totalizadores);
  }
}
