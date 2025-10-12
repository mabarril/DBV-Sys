import { Injectable, signal, inject } from '@angular/core';
import { Inscricao, Mensalidade, Debito, MovimentacaoCaixa, Custo, Patrimonio } from './inscricao.model';
import { MembrosService } from '../membros/membros.service';

@Injectable({
  providedIn: 'root'
})
export class FinancasService {
  private membrosService = inject(MembrosService);

  private inscricoesSignal = signal<Inscricao[]>([]);
  private mensalidadesSignal = signal<Mensalidade[]>([]);
  private debitosSignal = signal<Debito[]>([]);
  private movimentacoesCaixaSignal = signal<MovimentacaoCaixa[]>([
    { id: 1, tipo: 'Entrada', data: '2024-07-01', descricao: 'Doação para compra de barraca', valor: 250 },
    { id: 2, tipo: 'Saída', data: '2024-07-05', descricao: 'Compra de material de primeiros socorros', valor: 75.50 },
    { id: 3, tipo: 'Entrada', data: '2024-07-10', descricao: 'Venda de camisetas do clube', valor: 320 },
    { id: 4, tipo: 'Saída', data: '2024-07-15', descricao: 'Pagamento de transporte para evento', valor: 150 },
  ]);
  private custosSignal = signal<Custo[]>([
    { id: 1, data: '2024-07-15', descricao: 'Lanches para reunião', categoria: 'Alimentação', valor: 85.50 },
    { id: 2, data: '2024-07-20', descricao: 'Combustível para van - Evento Regional', categoria: 'Transporte', valor: 200.00 },
    { id: 3, data: '2024-07-22', descricao: 'Inscrição no Campori', categoria: 'Eventos', valor: 1200.00 },
  ]);
  private patrimonioSignal = signal<Patrimonio[]>([
    { id: 1, nome: 'Barraca Iglú 6 pessoas', descricao: 'Barraca semi-nova, marca Mor', dataAquisicao: '2023-03-10', valorAquisicao: 450.00, localizacao: 'Sede' },
    { id: 2, nome: 'Kit de Primeiros Socorros', descricao: 'Completo, revisado em 2024', dataAquisicao: '2022-08-01', valorAquisicao: 120.00, localizacao: 'Almoxarifado' },
    { id: 3, nome: 'Fogareiro Portátil', descricao: '2 bocas, marca Nautika', dataAquisicao: '2023-05-20', valorAquisicao: 250.00, localizacao: 'Sede' },
  ]);

  private nextInscricaoId = 1;
  private nextMensalidadeId = 1;
  private nextDebitoId = 1;
  private nextMovimentacaoId = 5;
  private nextCustoId = 4;
  private nextPatrimonioId = 4;

  getInscricoes() {
    return this.inscricoesSignal.asReadonly();
  }

  getMensalidades() {
    return this.mensalidadesSignal.asReadonly();
  }

  getDebitos() {
    return this.debitosSignal.asReadonly();
  }

  getMovimentacoes() {
    return this.movimentacoesCaixaSignal.asReadonly();
  }

  getCustos() {
    return this.custosSignal.asReadonly();
  }

  getPatrimonio() {
    return this.patrimonioSignal.asReadonly();
  }

  criarInscricao(membroId: number, ano: number, valorTotal: number): void {
    const dataInicio = new Date(ano, 0, 15); // Start on Jan 15 of the year
    const novaInscricao: Inscricao = {
      id: this.nextInscricaoId++,
      membroId,
      ano,
      valorTotal,
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: new Date(ano + 1, 0, 14).toISOString().split('T')[0],
      status: 'Ativa'
    };

    this.inscricoesSignal.update(i => [...i, novaInscricao]);

    const valorMensalidade = valorTotal / 10;
    const novasMensalidades: Mensalidade[] = [];
    for (let i = 0; i < 10; i++) {
      const dataVencimento = new Date(dataInicio);
      dataVencimento.setMonth(dataVencimento.getMonth() + i);
      
      novasMensalidades.push({
        id: this.nextMensalidadeId++,
        inscricaoId: novaInscricao.id,
        valor: valorMensalidade,
        dataVencimento: dataVencimento.toISOString().split('T')[0],
        status: 'Pendente'
      });
    }

    this.mensalidadesSignal.update(m => [...m, ...novasMensalidades]);
  }

  pagarMensalidade(mensalidadeId: number): void {
    const mensalidade = this.mensalidadesSignal().find(m => m.id === mensalidadeId);
    if (!mensalidade || mensalidade.status === 'Paga') {
      return;
    }

    const inscricao = this.inscricoesSignal().find(i => i.id === mensalidade.inscricaoId);
    if (!inscricao) {
      return;
    }

    const membro = this.membrosService.getMembros()().find(m => m.id === inscricao.membroId);

    // Update mensalidade status
    this.mensalidadesSignal.update(mensalidades =>
      mensalidades.map(m =>
        m.id === mensalidadeId ? { ...m, status: 'Paga' } : m
      )
    );

    // Add cash flow entry
    this.addMovimentacao({
      tipo: 'Entrada',
      data: new Date().toISOString().split('T')[0],
      descricao: `Pagamento mensalidade - ${membro?.nome ?? 'Membro desconhecido'}`,
      valor: mensalidade.valor
    });
  }

  criarDebitoEvento(membroId: number, eventoId: number, descricao: string, valor: number): void {
    const debitosAtuais = this.debitosSignal();
    const debitoExiste = debitosAtuais.some(d => d.membroId === membroId && d.eventoId === eventoId);

    if (debitoExiste) {
      console.warn(`Débito para o evento ${eventoId} e membro ${membroId} já existe.`);
      return;
    }
    
    const novoDebito: Debito = {
      id: this.nextDebitoId++,
      membroId,
      eventoId,
      descricao,
      valor,
      data: new Date().toISOString().split('T')[0],
      status: 'Pendente'
    };
    this.debitosSignal.update(d => [...d, novoDebito]);
  }

  pagarDebito(debitoId: number): void {
    const debito = this.debitosSignal().find(d => d.id === debitoId);
    if (!debito || debito.status === 'Pago') {
      return;
    }

    const membro = this.membrosService.getMembros()().find(m => m.id === debito.membroId);

    // Update debito status
    this.debitosSignal.update(debitos =>
      debitos.map(d =>
        d.id === debitoId ? { ...d, status: 'Pago' } : d
      )
    );

    // Add cash flow entry
    this.addMovimentacao({
      tipo: 'Entrada',
      data: new Date().toISOString().split('T')[0],
      descricao: `Pagamento: ${debito.descricao} - ${membro?.nome ?? 'Membro desconhecido'}`,
      valor: debito.valor
    });
  }

  // --- Caixa Methods ---
  addMovimentacao(movimentacao: Omit<MovimentacaoCaixa, 'id'>) {
    const newMovimentacao: MovimentacaoCaixa = { ...movimentacao, id: this.nextMovimentacaoId++ };
    this.movimentacoesCaixaSignal.update(movs => [...movs, newMovimentacao]);
  }

  updateMovimentacao(updatedMovimentacao: MovimentacaoCaixa) {
    this.movimentacoesCaixaSignal.update(movs => 
      movs.map(m => m.id === updatedMovimentacao.id ? updatedMovimentacao : m)
    );
  }

  deleteMovimentacao(id: number) {
    this.movimentacoesCaixaSignal.update(movs => movs.filter(m => m.id !== id));
  }

  // --- Custos Methods ---
  addCusto(custo: Omit<Custo, 'id'>) {
    const newCusto: Custo = { ...custo, id: this.nextCustoId++ };
    this.custosSignal.update(c => [...c, newCusto]);
  }

  updateCusto(updatedCusto: Custo) {
    this.custosSignal.update(c => c.map(custo => custo.id === updatedCusto.id ? updatedCusto : custo));
  }

  deleteCusto(id: number) {
    this.custosSignal.update(c => c.filter(custo => custo.id !== id));
  }

  // --- Patrimonio Methods ---
  addPatrimonio(item: Omit<Patrimonio, 'id'>) {
    const newItem: Patrimonio = { ...item, id: this.nextPatrimonioId++ };
    this.patrimonioSignal.update(p => [...p, newItem]);
  }

  updatePatrimonio(updatedItem: Patrimonio) {
    this.patrimonioSignal.update(p => p.map(item => item.id === updatedItem.id ? updatedItem : item));
  }

  deletePatrimonio(id: number) {
    this.patrimonioSignal.update(p => p.filter(item => item.id !== id));
  }
}
