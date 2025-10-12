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

export type TipoMovimentacao = 'Entrada' | 'Saída';

export interface MovimentacaoCaixa {
  id: number;
  tipo: TipoMovimentacao;
  data: string; // YYYY-MM-DD
  descricao: string;
  valor: number;
}

export type CategoriaCusto = 'Alimentação' | 'Transporte' | 'Material de Escritório' | 'Eventos' | 'Outros';

export interface Custo {
  id: number;
  data: string; // YYYY-MM-DD
  descricao: string;
  categoria: CategoriaCusto;
  valor: number;
}

export interface Patrimonio {
  id: number;
  nome: string;
  descricao: string;
  dataAquisicao: string; // YYYY-MM-DD
  valorAquisicao: number;
  localizacao: string;
}