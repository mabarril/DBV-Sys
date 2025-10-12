import { Injectable, signal } from '@angular/core';
import { Ata } from './ata.model';

const MOCK_ATAS: Ata[] = [
  {
    id: 1,
    titulo: 'Planejamento do Acampamento de Unidades',
    data: '2024-08-01',
    tipo: 'Reunião de Diretoria',
    descricao: 'Reunião para definir a logística, atividades e orçamento para o acampamento de unidades a ser realizado em Setembro. Foi discutido o local, transporte, alimentação e a equipe de apoio. O orçamento preliminar foi aprovado.',
    participantesIds: [2, 3, 6, 8, 10],
    documentos: ['orçamento_acampamento_v1.pdf', 'cronograma_atividades.docx']
  },
  {
    id: 2,
    titulo: 'Reunião de Abertura do Ano',
    data: '2024-02-10',
    tipo: 'Reunião Regular',
    descricao: 'Reunião geral com todos os membros para dar as boas-vindas ao novo ano de atividades. Apresentação da nova diretoria, do calendário de eventos e das metas para o ano. Momento de louvor e dinâmicas de integração.',
    participantesIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    documentos: ['calendario_2024.pdf']
  }
];

@Injectable({
  providedIn: 'root'
})
export class AtasService {
  private atasSignal = signal<Ata[]>(MOCK_ATAS);
  private nextId = MOCK_ATAS.length > 0 ? Math.max(...MOCK_ATAS.map(a => a.id)) + 1 : 1;

  getAtas() {
    return this.atasSignal.asReadonly();
  }

  addAta(ata: Omit<Ata, 'id'>) {
    const newAta: Ata = { ...ata, id: this.nextId++ };
    this.atasSignal.update(atas => [...atas, newAta]);
  }

  updateAta(updatedAta: Ata) {
    this.atasSignal.update(atas => 
      atas.map(a => a.id === updatedAta.id ? updatedAta : a)
    );
  }

  deleteAta(id: number) {
    this.atasSignal.update(atas => atas.filter(a => a.id !== id));
  }
}
