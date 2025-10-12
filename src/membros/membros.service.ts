import { Injectable, signal } from '@angular/core';
import { Membro } from './membro.model';

const MOCK_MEMBROS: Omit<Membro, 'id'>[] = [
  { nome: 'João da Silva', unidade: 'Falcões', dataNascimento: '2010-05-15', cargo: 'Desbravador' },
  { nome: 'Maria Oliveira', unidade: 'Águias', dataNascimento: '1990-08-20', cargo: 'Diretor' },
  { nome: 'Carlos Pereira', unidade: 'Tigres', dataNascimento: '1995-02-10', cargo: 'Conselheiro' },
  { nome: 'Ana Costa', unidade: 'Falcões', dataNascimento: '2011-11-30', cargo: 'Desbravador' },
  { nome: 'Pedro Martins', unidade: 'Lobos', dataNascimento: '2009-07-22', cargo: 'Desbravador' },
  { nome: 'Sofia Ferreira', unidade: 'Águias', dataNascimento: '1998-03-12', cargo: 'Conselheiro' },
  { nome: 'Lucas Rodrigues', unidade: 'Tigres', dataNascimento: '2012-01-05', cargo: 'Desbravador' },
  { nome: 'Beatriz Almeida', unidade: 'Lobos', dataNascimento: '1992-09-18', cargo: 'Tesoureiro' },
  { nome: 'Miguel Santos', unidade: 'Falcões', dataNascimento: '2010-06-25', cargo: 'Desbravador' },
  { nome: 'Laura Gonçalves', unidade: 'Águias', dataNascimento: '1996-12-01', cargo: 'Instrutor' },
];

@Injectable({
  providedIn: 'root',
})
export class MembrosService {
  private membrosSignal = signal<Membro[]>(MOCK_MEMBROS.map((m, i) => ({ ...m, id: i + 1 })));

  getMembros() {
    return this.membrosSignal.asReadonly();
  }

  addMembro(membro: Omit<Membro, 'id'>) {
    const newId = this.membrosSignal().length > 0 ? Math.max(...this.membrosSignal().map(m => m.id)) + 1 : 1;
    const newMembro: Membro = { ...membro, id: newId };
    this.membrosSignal.update(membros => [...membros, newMembro]);
  }

  updateMembro(updatedMembro: Membro) {
    this.membrosSignal.update(membros => 
      membros.map(m => m.id === updatedMembro.id ? updatedMembro : m)
    );
  }

  deleteMembro(id: number) {
    this.membrosSignal.update(membros => membros.filter(m => m.id !== id));
  }
}
