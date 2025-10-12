export interface Evento {
  id: number;
  tipo: string; // e.g., Acampamento, Passeio, Reunião Especial
  data: string; // YYYY-MM-DD
  local: string;
  valor: number;
}

export interface InscricaoEvento {
  eventoId: number;
  membroId: number;
}
