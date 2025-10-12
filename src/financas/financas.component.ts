import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { FinancasService } from './financas.service';
import { MembrosService } from '../membros/membros.service';
import { ClassesService } from '../classes/classes.service';
import { Membro } from '../membros/membro.model';
import { Inscricao, Mensalidade, Debito } from './inscricao.model';

import { InscricaoFormComponent } from './inscricao-form/inscricao-form.component';
import { DetalhesMembroComponent } from './detalhes-membro/detalhes-membro.component';

// A view model to combine data for the template
interface MembroFinanceiro {
  membro: Membro;
  inscricao: Inscricao | null;
  mensalidades: Mensalidade[];
  debitos: Debito[];
  saldoDevedor: number;
}

// Interfaces for the new report feature
interface RelatorioFinanceiroItem {
  nome: string;
  unidade: Membro['unidade'];
  classe: string;
  statusAnuidade: 'Em dia' | 'Com pendências';
  valorPago: number;
  valorPendente: number;
}

interface SumarioFinanceiro {
  totalInscritos: number;
  totalArrecadado: number;
  totalReceber: number;
}

@Component({
  selector: 'app-financas',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, InscricaoFormComponent, DetalhesMembroComponent],
  templateUrl: './financas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancasComponent {
  private financasService = inject(FinancasService);
  private membrosService = inject(MembrosService);
  private classesService = inject(ClassesService);

  // Signals for state
  private membros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();
  private mensalidades = this.financasService.getMensalidades();
  private debitos = this.financasService.getDebitos();

  isGerarInscricaoModalOpen = signal(false);
  isDetalhesModalOpen = signal(false);
  membroSelecionado = signal<Membro | null>(null);
  detalhesSelecionado = signal<{ membro: Membro; inscricao: Inscricao | null; mensalidades: Mensalidade[]; debitos: Debito[] } | null>(null);

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

  // Computed signal for the main data view
  membrosFinanceiro = computed<MembroFinanceiro[]>(() => {
    return this.membros()
      .map(membro => {
      const inscricao = this.inscricoes().find(i => i.membroId === membro.id && i.ano === new Date().getFullYear()) ?? null;
      const mensalidades = inscricao ? this.mensalidades().filter(m => m.inscricaoId === inscricao.id) : [];
      const debitos = this.debitos().filter(d => d.membroId === membro.id);
      
      const saldoDevedorMensalidades = mensalidades
        .filter(m => m.status !== 'Paga')
        .reduce((acc, m) => acc + m.valor, 0);
      
      const saldoDevedorDebitos = debitos
        .filter(d => d.status !== 'Pago')
        .reduce((acc, d) => acc + d.valor, 0);

      return {
        membro,
        inscricao,
        mensalidades,
        debitos,
        saldoDevedor: saldoDevedorMensalidades + saldoDevedorDebitos,
      };
    });
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

  onFiltroChange(event: Event, tipo: 'ano' | 'unidade' | 'classe' | 'statusPagamento') {
    const value = (event.target as HTMLSelectElement).value;
    this.filtrosRelatorio.update(f => ({ ...f, [tipo]: value }));
  }

  gerarRelatorio(): void {
    const filtros = this.filtrosRelatorio();
    
    const resultados = this.membrosFinanceiro()
      .filter(item => {
        if (!item.inscricao) return false;

        const classeDoMembro = this.getClassePorIdade(item.membro.dataNascimento);
        const statusPagamento = item.saldoDevedor > 0 ? 'pendente' : 'em_dia';
        
        const matchAno = !filtros.ano || item.inscricao.ano === Number(filtros.ano);
        const matchUnidade = !filtros.unidade || item.membro.unidade === filtros.unidade;
        const matchClasse = !filtros.classe || classeDoMembro === filtros.classe;
        const matchStatus = !filtros.statusPagamento || statusPagamento === filtros.statusPagamento;

        return matchAno && matchUnidade && matchClasse && matchStatus;
      })
      .map(item => {
        const valorTotal = item.inscricao!.valorTotal;
        const valorPendente = item.saldoDevedor;
        const valorPago = valorTotal - valorPendente;
        
        return {
          nome: item.membro.nome,
          unidade: item.membro.unidade,
          classe: this.getClassePorIdade(item.membro.dataNascimento),
          statusAnuidade: item.saldoDevedor > 0 ? 'Com pendências' : 'Em dia',
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

  // Methods to handle UI events
  openGerarInscricaoModal(membro: Membro): void {
    this.membroSelecionado.set(membro);
    this.isGerarInscricaoModalOpen.set(true);
  }

  closeGerarInscricaoModal(): void {
    this.isGerarInscricaoModalOpen.set(false);
    this.membroSelecionado.set(null);
  }

  handleGerarInscricao(data: { membroId: number; ano: number; valorTotal: number }): void {
    this.financasService.criarInscricao(data.membroId, data.ano, data.valorTotal);
    this.closeGerarInscricaoModal();
  }

  openDetalhesModal(item: MembroFinanceiro): void {
    this.detalhesSelecionado.set({
      membro: item.membro,
      inscricao: item.inscricao,
      mensalidades: item.mensalidades,
      debitos: item.debitos
    });
    this.isDetalhesModalOpen.set(true);
  }

  closeDetalhesModal(): void {
    this.isDetalhesModalOpen.set(false);
    this.detalhesSelecionado.set(null);
  }

  handlePagarMensalidade(mensalidadeId: number): void {
    this.financasService.pagarMensalidade(mensalidadeId);
    this.refreshDetalhesModalData();
  }

  handlePagarDebito(debitoId: number): void {
    this.financasService.pagarDebito(debitoId);
    this.refreshDetalhesModalData();
  }

  private refreshDetalhesModalData(): void {
     const detalhes = this.detalhesSelecionado();
    if (detalhes) {
        const updatedMembroFinanceiro = this.membrosFinanceiro().find(mf => mf.membro.id === detalhes.membro.id);
        if (updatedMembroFinanceiro) {
             this.detalhesSelecionado.set({
                membro: updatedMembroFinanceiro.membro,
                inscricao: updatedMembroFinanceiro.inscricao,
                mensalidades: updatedMembroFinanceiro.mensalidades,
                debitos: updatedMembroFinanceiro.debitos
             });
        } else {
          this.closeDetalhesModal();
        }
    }
  }
}