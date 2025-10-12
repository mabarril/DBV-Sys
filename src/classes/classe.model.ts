export type NomeClasse = 'Amigo' | 'Companheiro' | 'Pesquisador' | 'Pioneiro' | 'Excursionista' | 'Guia';

export interface Unidade {
  id: number;
  nome: string;
  conselheiroId: number | null;
}

export interface Classe {
  nome: NomeClasse;
  unidades: Unidade[];
  idadeMinima: number;
  idadeMaxima: number;
  cor: string; // Tailwind color class
}