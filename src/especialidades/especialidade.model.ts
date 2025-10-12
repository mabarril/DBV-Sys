export type AreaEspecialidade = 'Natureza' | 'Artes Manuais' | 'Habilidades Domésticas' | 'Atividades Recreativas' | 'Saúde e Ciência' | 'Atividades Missionárias';

export interface Especialidade {
  id: number;
  nome: string;
  area: AreaEspecialidade;
  imageUrl: string;
}

export interface ConclusaoEspecialidade {
  membroId: number;
  especialidadeId: number;
  dataConclusao: string; // YYYY-MM-DD
  instrutorId: number;
}
