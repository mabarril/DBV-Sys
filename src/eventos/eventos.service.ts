import { Injectable, signal, inject, effect } from '@angular/core';
import { Evento, InscricaoEvento } from './evento.model';
import { FinancasService } from '../financas/financas.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, skip } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventosService {
  private financasService = inject(FinancasService);

  private eventosSignal = signal<Evento[]>([
    { id: 1, tipo: 'Acampamento de Unidades', data: '2024-09-14', local: 'Parque da Represa', valor: 50.00 }
  ]);
  private inscricoesSignal = signal<InscricaoEvento[]>([
    { eventoId: 1, membroId: 1 },
    { eventoId: 1, membroId: 4 }
  ]);
  private nextEventoId = 2;

  constructor() {
    // Generate initial debits for mock data
    this.inscricoesSignal().forEach(inscricao => {
      const evento = this.eventosSignal().find(e => e.id === inscricao.eventoId);
      if (evento) {
        this.financasService.criarDebitoEvento(inscricao.membroId, evento.id, `Inscrição: ${evento.tipo}`, evento.valor);
      }
    });
  }

  getEventos() {
    return this.eventosSignal.asReadonly();
  }

  getInscricoes() {
    return this.inscricoesSignal.asReadonly();
  }

  addEvento(evento: Omit<Evento, 'id'>): void {
    const newEvento: Evento = { ...evento, id: this.nextEventoId++ };
    this.eventosSignal.update(eventos => [...eventos, newEvento]);
  }

  updateEvento(updatedEvento: Evento): void {
    this.eventosSignal.update(eventos =>
      eventos.map(e => e.id === updatedEvento.id ? updatedEvento : e)
    );
  }

  deleteEvento(id: number): void {
    // Note: In a real app, you'd handle financial implications, like existing debits.
    this.eventosSignal.update(eventos => eventos.filter(e => e.id !== id));
    this.inscricoesSignal.update(inscricoes => inscricoes.filter(i => i.eventoId !== id));
  }

  addInscricoes(eventoId: number, membroIds: number[]): void {
    const evento = this.eventosSignal().find(e => e.id === eventoId);
    if (!evento) return;

    const novasInscricoes = membroIds.map(membroId => ({ eventoId, membroId }));
    this.inscricoesSignal.update(inscricoes => [...inscricoes, ...novasInscricoes]);

    // Create financial debits
    novasInscricoes.forEach(inscricao => {
      this.financasService.criarDebitoEvento(inscricao.membroId, eventoId, `Inscrição: ${evento.tipo}`, evento.valor);
    });
  }
}
