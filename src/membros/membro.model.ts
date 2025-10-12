export interface Membro {
  id: number;
  nome: string;
  unidade: 'Falcões' | 'Águias' | 'Tigres' | 'Lobos';
  dataNascimento: string; // YYYY-MM-DD
  cargo: 'Desbravador' | 'Conselheiro' | 'Diretor' | 'Tesoureiro' | 'Instrutor';
}
