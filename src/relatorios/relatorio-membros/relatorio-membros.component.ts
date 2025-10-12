import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { MembrosService } from '../../membros/membros.service';
import { Membro } from '../../membros/membro.model';
import { FinancasService } from '../../financas/financas.service';
import { ClassesService } from '../../classes/classes.service';
import { EspecialidadesService } from '../../especialidades/especialidades.service';
import { RelatoriosPdfService } from '../relatorios-pdf.service';

@Component({
  selector: 'app-relatorio-membros',
  standalone: true,
  imports: [],
  templateUrl: './relatorio-membros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioMembrosComponent {
  private membrosService = inject(MembrosService);
  private financasService = inject(FinancasService);
  private classesService = inject(ClassesService);
  private especialidadesService = inject(EspecialidadesService);
  private pdfService = inject(RelatoriosPdfService);
  
  private membros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();
  private classes = this.classesService.getClasses();
  private conclusoes = this.especialidadesService.getConclusoes();
  private especialidades = this.especialidadesService.getEspecialidades();

  searchTerm = signal('');
  showOnlyActive = signal(false);
  unidadeFiltro = signal('');
  cargoFiltro = signal('');
  
  unidades: Membro['unidade'][] = ['Águias', 'Falcões', 'Lobos', 'Tigres'];
  cargos: Membro['cargo'][] = ['Desbravador', 'Conselheiro', 'Diretor', 'Tesoureiro', 'Instrutor'];

  private activeMemberIds = computed(() => {
    const currentYear = new Date().getFullYear();
    return new Set(
      this.inscricoes()
        .filter(i => i.ano === currentYear && i.status === 'Ativa')
        .map(i => i.membroId)
    );
  });

  private filteredMembros = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const onlyActive = this.showOnlyActive();
    const unidade = this.unidadeFiltro();
    const cargo = this.cargoFiltro();
    const activeIds = this.activeMemberIds();
    
    return this.membros().filter(membro => {
      const matchActive = !onlyActive || activeIds.has(membro.id);
      const matchUnidade = !unidade || membro.unidade === unidade;
      const matchCargo = !cargo || membro.cargo === cargo;
      const matchTerm = !term || 
        membro.nome.toLowerCase().includes(term) ||
        membro.cargo.toLowerCase().includes(term);

      return matchActive && matchUnidade && matchCargo && matchTerm;
    });
  });

  enrichedFilteredMembros = computed(() => {
    const especialidadesMap = new Map(this.especialidades().map(e => [e.id, e.nome]));
    
    return this.filteredMembros().map(membro => {
      const idade = this.calculateAge(membro.dataNascimento);
      const classe = this.classes().find(c => idade >= c.idadeMinima && idade <= c.idadeMaxima)?.nome ?? 'N/A';
      
      const conclusoesMembro = this.conclusoes()
        .filter(c => c.membroId === membro.id)
        .map(c => especialidadesMap.get(c.especialidadeId) ?? 'Desconhecida')
        .join(', ');

      return {
        ...membro,
        classe,
        especialidadesConcluidas: conclusoesMembro || 'Nenhuma'
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  });

  isMembroAtivo(membroId: number): boolean {
    return this.activeMemberIds().has(membroId);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  toggleShowOnlyActive(event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.showOnlyActive.set(isChecked);
  }
  
  onUnidadeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.unidadeFiltro.set(value);
  }

  onCargoChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.cargoFiltro.set(value);
  }

  calculateAge(dateString: string): number {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  }

  exportPdf(): void {
    const colunas = ['Nome', 'Unidade', 'Classe', 'Cargo', 'Idade', 'Status'];
    const dados = this.enrichedFilteredMembros().map(m => [
      m.nome,
      m.unidade,
      m.classe,
      m.cargo,
      this.calculateAge(m.dataNascimento).toString(),
      this.isMembroAtivo(m.id) ? 'Ativo' : 'Inativo'
    ]);
    const totalizadores = [
        [{ content: `Total de Membros: ${dados.length}`, colSpan: 6, styles: { halign: 'right' } }]
    ];
    
    this.pdfService.gerarPdf('Relatório de Membros', colunas, dados, 'relatorio_membros', totalizadores);
  }
}