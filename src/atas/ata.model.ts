export type TipoAta = 'Reunião de Diretoria' | 'Comissão Disciplinar' | 'Reunião Regular' | 'Outro';

export interface Ata {
  id: number;
  titulo: string;
  data: string; // YYYY-MM-DD
  tipo: TipoAta;
  descricao: string;
  participantesIds: number[];
  documentos: string[]; // Array of filenames
}
