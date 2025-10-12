import { Injectable, signal } from '@angular/core';
import { Inscricao, Mensalidade, Debito } from './inscricao.model';

@Injectable({
  providedIn: 'root'
})
export class FinancasService {
  private inscricoesSignal = signal<Inscricao[]>([]);
  private mensalidadesSignal = signal<Mensalidade[]>([]);
  private debitosSignal = signal<Debito[]>([]);
  private nextInscricaoId = 1;
  private nextMensalidadeId = 1;
  private nextDebitoId = 1;

  getInscricoes() {
    return this.inscricoesSignal.asReadonly();
  }

  getMensalidades() {
    return this.mensalidadesSignal.asReadonly();
  }

  getDebitos() {
    return this.debitosSignal.asReadonly();
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
    this.mensalidadesSignal.update(mensalidades =>
      mensalidades.map(m =>
        m.id === mensalidadeId ? { ...m, status: 'Paga' } : m
      )
    );
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
    this.debitosSignal.update(debitos =>
      debitos.map(d =>
        d.id === debitoId ? { ...d, status: 'Pago' } : d
      )
    );
  }
}
