import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { EventosService } from './eventos.service';
import { MembrosService } from '../membros/membros.service';
import { Evento } from './evento.model';
import { Membro } from '../membros/membro.model';

import { EventoFormComponent } from './evento-form/evento-form.component';
import { InscricaoEventoFormComponent } from './inscricao-evento-form/inscricao-evento-form.component';
import { AutorizacaoModalComponent } from './autorizacao-modal/autorizacao-modal.component';

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [
    DatePipe, 
    CurrencyPipe, 
    EventoFormComponent, 
    InscricaoEventoFormComponent,
    AutorizacaoModalComponent
  ],
  templateUrl: './eventos.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventosComponent {
  private eventosService = inject(EventosService);
  private membrosService = inject(MembrosService);

  eventos = this.eventosService.getEventos();
  private inscricoes = this.eventosService.getInscricoes();
  private membros = this.membrosService.getMembros();
  
  isEventoModalOpen = signal(false);
  editingEvento = signal<Evento | null>(null);

  isInscricaoModalOpen = signal(false);
  isAutorizacaoModalOpen = signal(false);
  activeEvento = signal<Evento | null>(null);
  activeMembro = signal<Membro | null>(null);

  private membrosMap = computed(() => {
    const map = new Map<number, Membro>();
    this.membros().forEach(m => map.set(m.id, m));
    return map;
  });

  getInscritos(eventoId: number): Membro[] {
    const inscritosIds = this.inscricoes()
      .filter(i => i.eventoId === eventoId)
      .map(i => i.membroId);
    
    return inscritosIds
      .map(id => this.membrosMap().get(id))
      .filter((m): m is Membro => !!m)
      .sort((a,b) => a.nome.localeCompare(b.nome));
  }
  
  isMenorDeIdade(dataNascimento: string): boolean {
    if (!dataNascimento) return false;
    const today = new Date();
    const birthDate = new Date(dataNascimento);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age < 18;
  }

  // Evento Modal
  openEventoModal(evento: Evento | null): void {
    this.editingEvento.set(evento);
    this.isEventoModalOpen.set(true);
  }

  closeEventoModal(): void {
    this.isEventoModalOpen.set(false);
    this.editingEvento.set(null);
  }

  handleSaveEvento(data: Omit<Evento, 'id'> & { id?: number }): void {
    if (data.id) {
      this.eventosService.updateEvento(data as Evento);
    } else {
      this.eventosService.addEvento(data);
    }
    this.closeEventoModal();
  }

  handleDeleteEvento(id: number): void {
    if (confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.')) {
      this.eventosService.deleteEvento(id);
      this.closeEventoModal();
    }
  }

  // Inscrição Modal
  openInscricaoModal(evento: Evento): void {
    this.activeEvento.set(evento);
    this.isInscricaoModalOpen.set(true);
  }

  closeInscricaoModal(): void {
    this.isInscricaoModalOpen.set(false);
    this.activeEvento.set(null);
  }

  handleSaveInscricoes(membroIds: number[]): void {
    const eventoId = this.activeEvento()?.id;
    if (eventoId && membroIds.length > 0) {
      this.eventosService.addInscricoes(eventoId, membroIds);
    }
    this.closeInscricaoModal();
  }

  // Autorização Modal
  openAutorizacaoModal(membro: Membro, evento: Evento): void {
    this.activeMembro.set(membro);
    this.activeEvento.set(evento);
    this.isAutorizacaoModalOpen.set(true);
  }

  closeAutorizacaoModal(): void {
    this.isAutorizacaoModalOpen.set(false);
    this.activeMembro.set(null);
    this.activeEvento.set(null);
  }
}
