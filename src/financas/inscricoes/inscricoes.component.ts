import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { FinancasService } from '../financas.service';
import { MembrosService } from '../../membros/membros.service';
import { ClassesService } from '../../classes/classes.service';
import { Membro } from '../../membros/membro.model';
import { Inscricao, Mensalidade, MensalidadeStatus } from '../inscricao.model';

// Interfaces for the new report feature
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
  selector: 'app-inscricoes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './inscricoes.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscricoesComponent {
  private financasService = inject(FinancasService);
  private membrosService = inject(MembrosService);
  private classesService = inject(ClassesService);

  // Signals for state
  private membros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();
  private mensalidades = this.financasService.getMensalidades();

  // --- Report Signals ---
  classes = this.classesService.getClasses();
  filtrosRelatorio = signal({
    ano: '',
    unidade: '',
    classe: '',
    statusPagamento: ''
  });
  relatorioGerado = signal(false);
  resultadosRelatorio = signal<RelatorioFinanceiroItem[]>([]);
  sumarioRelatorio = signal<SumarioFinanceiro | null>(null);

  // Computed signals for filters
  anosInscricao = computed(() => {
    const anos = this.inscricoes().map(i => i.ano);
    return [...new Set(anos)].sort((a, b) => b - a);
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
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }
  
  private getClassePorIdade(dataNascimento: string): string {
    const idade = this.calculateAge(dataNascimento);
    const classeEncontrada = this.classes().find(c => idade >= c.idadeMinima && idade <= c.idadeMaxima);
    return classeEncontrada?.nome ?? 'N/A';
  }

  private getMensalidadeStatus(mensalidade: Mensalidade): MensalidadeStatus {
    if (mensalidade.status === 'Paga') {
      return 'Paga';
    }
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(`${mensalidade.dataVencimento}T12:00:00`);
    if (vencimento < hoje) {
      return 'Atrasada';
    }
    return 'Pendente';
  }

  onFiltroChange(event: Event, tipo: 'ano' | 'unidade' | 'classe' | 'statusPagamento') {
    const value = (event.target as HTMLSelectElement).value;
    this.filtrosRelatorio.update(f => ({ ...f, [tipo]: value }));
  }

  gerarRelatorio(): void {
    const filtros = this.filtrosRelatorio();
    
    const membrosFinanceiro = this.membros().map(membro => {
        const inscricao = this.inscricoes().find(i => i.membroId === membro.id) ?? null;
        
        const mensalidades = inscricao ? this.mensalidades().filter(m => m.inscricaoId === inscricao.id) : [];
        
        const valorPendente = mensalidades
          .filter(m => m.status !== 'Paga')
          .reduce((acc, m) => acc + m.valor, 0);

        const temAtraso = mensalidades.some(m => this.getMensalidadeStatus(m) === 'Atrasada');

        let statusPagamento: 'em_dia' | 'pendente' | 'atrasado' = 'em_dia';
        if (valorPendente > 0) {
            statusPagamento = temAtraso ? 'atrasado' : 'pendente';
        }
        
        return {
            membro,
            inscricao,
            valorPendente,
            statusPagamento,
        };
    });

    const resultados = membrosFinanceiro
      .filter(item => {
        if (!item.inscricao) return false;

        const classeDoMembro = this.getClassePorIdade(item.membro.dataNascimento);
        const statusPagamento = item.statusPagamento;
        
        const matchAno = !filtros.ano || item.inscricao.ano === Number(filtros.ano);
        const matchUnidade = !filtros.unidade || item.membro.unidade === filtros.unidade;
        const matchClasse = !filtros.classe || classeDoMembro === filtros.classe;
        const matchStatus = !filtros.statusPagamento || statusPagamento === filtros.statusPagamento;

        return matchAno && matchUnidade && matchClasse && matchStatus;
      })
      .map(item => {
        const valorTotal = item.inscricao!.valorTotal;
        const valorPendente = item.valorPendente;
        const valorPago = valorTotal - valorPendente;
        
        let statusAnuidade: 'Em dia' | 'Pendente' | 'Atrasado';
        if (item.statusPagamento === 'em_dia') {
            statusAnuidade = 'Em dia';
        } else if (item.statusPagamento === 'atrasado') {
            statusAnuidade = 'Atrasado';
        } else {
            statusAnuidade = 'Pendente';
        }
        
        return {
          nome: item.membro.nome,
          unidade: item.membro.unidade,
          classe: this.getClassePorIdade(item.membro.dataNascimento),
          statusAnuidade,
          valorPago: valorPago,
          valorPendente: valorPendente
        } as RelatorioFinanceiroItem;
      });
    
    const totalInscritos = resultados.length;
    const totalArrecadado = resultados.reduce((acc, item) => acc + item.valorPago, 0);
    const totalReceber = resultados.reduce((acc, item) => acc + item.valorPendente, 0);

    this.resultadosRelatorio.set(resultados);
    this.sumarioRelatorio.set({ totalInscritos, totalArrecadado, totalReceber });
    this.relatorioGerado.set(true);
  }
}