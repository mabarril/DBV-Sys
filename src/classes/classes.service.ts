import { Injectable, signal } from '@angular/core';
import { Classe, NomeClasse, Unidade } from './classe.model';

const MOCK_CLASSES: Classe[] = [
  {
    nome: 'Amigo',
    idadeMinima: 10,
    idadeMaxima: 10,
    cor: 'bg-blue-500',
    unidades: [
      { id: 1, nome: 'Unidade Amizade', conselheiroId: 3 },
    ]
  },
  {
    nome: 'Companheiro',
    idadeMinima: 11,
    idadeMaxima: 11,
    cor: 'bg-red-500',
    unidades: [
      { id: 2, nome: 'Unidade Companheirismo', conselheiroId: 6 },
    ]
  },
  {
    nome: 'Pesquisador',
    idadeMinima: 12,
    idadeMaxima: 12,
    cor: 'bg-green-500',
    unidades: []
  },
  {
    nome: 'Pioneiro',
    idadeMinima: 13,
    idadeMaxima: 13,
    cor: 'bg-gray-500',
    unidades: []
  },
  {
    nome: 'Excursionista',
    idadeMinima: 14,
    idadeMaxima: 14,
    cor: 'bg-yellow-500',
    unidades: []
  },
  {
    nome: 'Guia',
    idadeMinima: 15,
    idadeMaxima: 15,
    cor: 'bg-purple-500',
    unidades: []
  }
];

@Injectable({
  providedIn: 'root'
})
export class ClassesService {
  private classesSignal = signal<Classe[]>(MOCK_CLASSES);

  getClasses() {
    return this.classesSignal.asReadonly();
  }

  addUnidade(classeNome: NomeClasse, unidade: Omit<Unidade, 'id'>) {
    this.classesSignal.update(classes => {
      return classes.map(c => {
        if (c.nome === classeNome) {
          const allUnidadeIds = classes.flatMap(cl => cl.unidades.map(u => u.id));
          const newId = allUnidadeIds.length > 0 ? Math.max(...allUnidadeIds) + 1 : 1;
          const newUnidade: Unidade = { ...unidade, id: newId };
          return { ...c, unidades: [...c.unidades, newUnidade] };
        }
        return c;
      });
    });
  }

  updateUnidade(classeNome: NomeClasse, updatedUnidade: Unidade) {
    this.classesSignal.update(classes => {
      return classes.map(c => {
        if (c.nome === classeNome) {
          const updatedUnidades = c.unidades.map(u => u.id === updatedUnidade.id ? updatedUnidade : u);
          return { ...c, unidades: updatedUnidades };
        }
        return c;
      });
    });
  }

  deleteUnidade(classeNome: NomeClasse, unidadeId: number) {
    this.classesSignal.update(classes => {
      return classes.map(c => {
        if (c.nome === classeNome) {
          const filteredUnidades = c.unidades.filter(u => u.id !== unidadeId);
          return { ...c, unidades: filteredUnidades };
        }
        return c;
      });
    });
  }
}