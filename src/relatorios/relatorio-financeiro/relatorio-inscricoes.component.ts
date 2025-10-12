import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { FinancasService } from '../../financas/financas.service';
import { MembrosService } from '../../membros/membros.service';
import { ClassesService } from '../../classes/classes.service';
import { Membro } from '../../membros/membro.model';
import { Inscricao, Mensalidade, MensalidadeStatus } from '../../financas/inscricao.model';
import { RelatoriosPdfService } from '../relatorios-pdf.service';

interface RelatorioFinanceiroItem {
  nome: string;
  unidade: Membro['unidade'];
  classe: string;
  statusAnuidade: 'Em dia' | 'Pendente' | 'Atrasado';
  valorPago: number;
  valorPendente: number;
}

interface SumarioFinanceiro {
  totalInscritos: number;
  totalArrecadado: number;
  totalReceber: number;
}

@Component({
  selector: 'app-relatorio-inscricoes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Relatório Financeiro de Inscrições</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
      <div>
        <label for="filtroAno" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Ano</label>
        <select id="filtroAno" (change)="onFiltroChange($event, 'ano')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
          <option value="">Todos</option>
          @for(ano of anosInscricao(); track ano) {
            <option [value]="ano">{{ ano }}</option>
          }
        </select>
      </div>
      <div>
        <label for="filtroUnidade" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Unidade</label>
        <select id="filtroUnidade" (change)="onFiltroChange($event, 'unidade')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
          <option value="">Todas</option>
          @for(unidade of unidades(); track unidade) {
            <option [value]="unidade">{{ unidade }}</option>
          }
        </select>
      </div>
      <div>
        <label for="filtroClasse" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Classe</label>
        <select id="filtroClasse" (change)="onFiltroChange($event, 'classe')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
          <option value="">Todas</option>
           @for(classe of classes(); track classe.nome) {
            <option [value]="classe.nome">{{ classe.nome }}</option>
          }
        </select>
      </div>
      <div>
        <label for="filtroStatus" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Pag.</label>
        <select id="filtroStatus" (change)="onFiltroChange($event, 'statusPagamento')" class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm">
          <option value="">Todos</option>
          <option value="em_dia">Em dia</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
        </select>
      </div>
      <div class="lg:col-span-1">
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Membro</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Unidade</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Classe</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status Anuidade</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Pago</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Pendente</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          @for (item of resultadosRelatorio(); track item.nome) {
            <tr>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{{ item.nome }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ item.unidade }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{{ item.classe }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm">
                 @switch (item.statusAnuidade) {
                  @case ('Em dia') {<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Em dia</span>}
                  @case ('Pendente') {<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pendente</span>}
                  @case ('Atrasado') {<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Atrasado</span>}
                }
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-green-600 dark:text-green-400">{{ item.valorPago | currency:'BRL' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-red-600 dark:text-red-400">{{ item.valorPendente | currency:'BRL' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="text-center p-6 text-sm text-gray-500 dark:text-gray-400">Nenhum registro encontrado.</td></tr>
          }
        </tbody>
        @if (sumarioRelatorio(); as sumario) {
          <tfoot class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <td class="px-6 py-3 text-left text-sm font-bold text-gray-700 dark:text-gray-200" colspan="4">Total ({{ sumario.totalInscritos }} inscritos)</td>
               <td class="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 font-mono">{{ sumario.totalArrecadado | currency:'BRL' }}</td>
               <td class="px-6 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-200 font-mono">{{ sumario.totalReceber | currency:'BRL' }}</td>
            </tr>
          </tfoot>
        }
      </table>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioInscricoesComponent {
  private financasService = inject(FinancasService);
  private membrosService = inject(MembrosService);
  private classesService = inject(ClassesService);
  private pdfService = inject(RelatoriosPdfService);
  private currencyPipe = inject(CurrencyPipe);

  private membros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();
  private mensalidades = this.financasService.getMensalidades();
  classes = this.classesService.getClasses();

  filtrosRelatorio = signal({ ano: '', unidade: '', classe: '', statusPagamento: '' });
  
  anosInscricao = computed(() => {
    const anos = this.inscricoes().map(i => i.ano);
    return [...new Set(anos)].sort((a: number, b: number) => b - a);
  });

  unidades = computed(() => {
    const unidades = this.membros().map(m => m.unidade);
    return [...new Set(unidades)].sort();
  });
  
  private calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return age;
  }
  
  private getClassePorIdade(dataNascimento: string): string {
    const idade = this.calculateAge(dataNascimento);
    return this.classes().find(c => idade >= c.idadeMinima && idade <= c.idadeMaxima)?.nome ?? 'N/A';
  }

  private getMensalidadeStatus(mensalidade: Mensalidade): MensalidadeStatus {
    if (mensalidade.status === 'Paga') return 'Paga';
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(`${mensalidade.dataVencimento}T12:00:00`);
    return vencimento < hoje ? 'Atrasada' : 'Pendente';
  }
  
  resultadosRelatorio = computed<RelatorioFinanceiroItem[]>(() => {
    const filtros = this.filtrosRelatorio();
    
    return this.membros()
      .map(membro => {
        const inscricao = this.inscricoes().find(i => i.membroId === membro.id && (!filtros.ano || i.ano === Number(filtros.ano))) ?? null;
        if (!inscricao) return null;

        const mensalidades = this.mensalidades().filter(m => m.inscricaoId === inscricao.id);
        const valorPendente = mensalidades.filter(m => m.status !== 'Paga').reduce((acc, m) => acc + m.valor, 0);
        const temAtraso = mensalidades.some(m => this.getMensalidadeStatus(m) === 'Atrasada');

        let statusPagamento: 'em_dia' | 'pendente' | 'atrasado' = 'em_dia';
        if (valorPendente > 0) statusPagamento = temAtraso ? 'atrasado' : 'pendente';
        
        const classeDoMembro = this.getClassePorIdade(membro.dataNascimento);

        if (filtros.unidade && membro.unidade !== filtros.unidade) return null;
        if (filtros.classe && classeDoMembro !== filtros.classe) return null;
        if (filtros.statusPagamento && statusPagamento !== filtros.statusPagamento) return null;

        return {
          nome: membro.nome,
          unidade: membro.unidade,
          classe: classeDoMembro,
          statusAnuidade: statusPagamento === 'em_dia' ? 'Em dia' : (statusPagamento === 'atrasado' ? 'Atrasado' : 'Pendente'),
          valorPago: inscricao.valorTotal - valorPendente,
          valorPendente: valorPendente
        } as RelatorioFinanceiroItem;
      })
      .filter((item): item is RelatorioFinanceiroItem => item !== null)
      .sort((a,b) => a.nome.localeCompare(b.nome));
  });

  sumarioRelatorio = computed<SumarioFinanceiro | null>(() => {
    const resultados = this.resultadosRelatorio();
    if(resultados.length === 0) return null;

    return {
      totalInscritos: resultados.length,
      totalArrecadado: resultados.reduce((acc, item) => acc + item.valorPago, 0),
      totalReceber: resultados.reduce((acc, item) => acc + item.valorPendente, 0),
    };
  });

  onFiltroChange(event: Event, tipo: 'ano' | 'unidade' | 'classe' | 'statusPagamento') {
    const value = (event.target as HTMLSelectElement).value;
    this.filtrosRelatorio.update(f => ({ ...f, [tipo]: value }));
  }
  
  exportPdf(): void {
    const colunas = ['Membro', 'Unidade', 'Classe', 'Status', 'Valor Pago', 'Valor Pendente'];
    const dados = this.resultadosRelatorio().map(item => [
      item.nome,
      item.unidade,
      item.classe,
      item.statusAnuidade,
      this.currencyPipe.transform(item.valorPago, 'BRL'),
      this.currencyPipe.transform(item.valorPendente, 'BRL'),
    ]);
    
    const sumario = this.sumarioRelatorio();
    const totalizadores = sumario ? [
        ['Total Inscritos', sumario.totalInscritos.toString(), '', '', '', ''],
        ['Total Arrecadado', '', '', '', this.currencyPipe.transform(sumario.totalArrecadado, 'BRL'), ''],
        ['Total a Receber', '', '', '', '', this.currencyPipe.transform(sumario.totalReceber, 'BRL')],
    ] : [];

    this.pdfService.gerarPdf('Relatório Financeiro de Inscrições', colunas, dados, 'relatorio_inscricoes', totalizadores);
  }
}
