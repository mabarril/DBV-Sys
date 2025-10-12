import { Injectable, signal } from '@angular/core';
import { Especialidade, AreaEspecialidade, ConclusaoEspecialidade } from './especialidade.model';

const MOCK_ESPECIALIDADES: Especialidade[] = [
  { id: 1, nome: 'Nós e Amarras', area: 'Atividades Recreativas', imageUrl: 'https://loremflickr.com/100/100/knot' },
  { id: 2, nome: 'Primeiros Socorros', area: 'Saúde e Ciência', imageUrl: 'https://loremflickr.com/100/100/first-aid' },
  { id: 3, nome: 'Acampamento I', area: 'Natureza', imageUrl: 'https://loremflickr.com/100/100/camping' },
  { id: 4, nome: 'Culinária', area: 'Habilidades Domésticas', imageUrl: 'https://loremflickr.com/100/100/cooking' },
  { id: 5, nome: 'Arte de Contar Histórias Cristãs', area: 'Atividades Missionárias', imageUrl: 'https://loremflickr.com/100/100/storybook' },
  { id: 6, nome: 'Pintura em Tela', area: 'Artes Manuais', imageUrl: 'https://loremflickr.com/100/100/painting' },
  { id: 7, nome: 'Orientação', area: 'Natureza', imageUrl: 'https://loremflickr.com/100/100/compass' },
  { id: 8, nome: 'Ordem Unida', area: 'Atividades Recreativas', imageUrl: 'https://loremflickr.com/100/100/marching' },
];

const MOCK_CONCLUSOES: ConclusaoEspecialidade[] = [
  { membroId: 1, especialidadeId: 3, dataConclusao: '2023-10-20', instrutorId: 3 },
  { membroId: 4, especialidadeId: 3, dataConclusao: '2023-10-20', instrutorId: 3 },
  { membroId: 1, especialidadeId: 1, dataConclusao: '2024-02-15', instrutorId: 6 },
  { membroId: 2, especialidadeId: 2, dataConclusao: '2024-05-01', instrutorId: 10 },
];


@Injectable({
  providedIn: 'root'
})
export class EspecialidadesService {
  private especialidadesSignal = signal<Especialidade[]>(MOCK_ESPECIALIDADES);
  private conclusoesSignal = signal<ConclusaoEspecialidade[]>(MOCK_CONCLUSOES);

  getEspecialidades() {
    return this.especialidadesSignal.asReadonly();
  }

  getConclusoes() {
    return this.conclusoesSignal.asReadonly();
  }

  addEspecialidade(especialidade: Omit<Especialidade, 'id'>) {
    const newId = this.especialidadesSignal().length > 0 ? Math.max(...this.especialidadesSignal().map(e => e.id)) + 1 : 1;
    const newEspecialidade: Especialidade = { ...especialidade, id: newId };
    this.especialidadesSignal.update(especialidades => [...especialidades, newEspecialidade]);
  }

  updateEspecialidade(updatedEspecialidade: Especialidade) {
    this.especialidadesSignal.update(especialidades =>
      especialidades.map(e => e.id === updatedEspecialidade.id ? updatedEspecialidade : e)
    );
  }

  deleteEspecialidade(id: number) {
    this.especialidadesSignal.update(especialidades => especialidades.filter(e => e.id !== id));
    this.conclusoesSignal.update(conclusoes => conclusoes.filter(c => c.especialidadeId !== id));
  }

  addConclusao(conclusao: ConclusaoEspecialidade) {
     this.conclusoesSignal.update(conclusoes => [...conclusoes, conclusao]);
  }
}