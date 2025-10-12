export type InscricaoStatus = 'Ativa' | 'Vencida';
export type MensalidadeStatus = 'Paga' | 'Pendente' | 'Atrasada';

export interface Inscricao {
  id: number;
  membroId: number;
  ano: number;
  valorTotal: number;
  dataInicio: string; // YYYY-MM-DD
  dataFim: string; // YYYY-MM-DD
  status: InscricaoStatus;
}

export interface Mensalidade {
  id: number;
  inscricaoId: number;
  valor: number;
  dataVencimento: string; // YYYY-MM-DD
  status: MensalidadeStatus;
}

export type DebitoStatus = 'Pendente' | 'Pago';

export interface Debito {
  id: number;
  membroId: number;
  eventoId?: number; // Optional link to the event
  descricao: string;
  valor: number;
  data: string; // YYYY-MM-DD
  status: DebitoStatus;
}
