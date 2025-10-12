import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { MembrosService } from './membros.service';
import { Membro } from './membro.model';
import { MembroFormComponent } from './membro-form/membro-form.component';
import { FinancasService } from '../financas/financas.service';
import { Inscricao, Mensalidade, Debito } from '../financas/inscricao.model';
import { InscricaoFormComponent } from '../financas/inscricao-form/inscricao-form.component';
import { DetalhesMembroComponent } from '../financas/detalhes-membro/detalhes-membro.component';

// A view model to combine data for financial details
interface MembroFinanceiro {
  membro: Membro;
  inscricao: Inscricao | null;
  mensalidades: Mensalidade[];
  debitos: Debito[];
}

@Component({
  selector: 'app-membros',
  standalone: true,
  imports: [MembroFormComponent, InscricaoFormComponent, DetalhesMembroComponent, CurrencyPipe, DatePipe],
  templateUrl: './membros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembrosComponent {
  private membrosService = inject(MembrosService);
  private financasService = inject(FinancasService);
  
  membros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();
  private mensalidades = this.financasService.getMensalidades();
  private debitos = this.financasService.getDebitos();

  searchTerm = signal('');
  showOnlyActive = signal(false);
  unidadeFiltro = signal('');
  
  // Arrays for filter dropdowns
  unidades: Membro['unidade'][] = ['Águias', 'Falcões', 'Lobos', 'Tigres'];

  // Member form modal state
  isModalOpen = signal(false);
  editingMembro = signal<Membro | null>(null);

  // Inscription modals state
  isGerarInscricaoModalOpen = signal(false);
  isDetalhesModalOpen = signal(false);
  membroSelecionado = signal<Membro | null>(null);
  detalhesSelecionado = signal<{ membro: Membro; inscricao: Inscricao | null; mensalidades: Mensalidade[]; debitos: Debito[] } | null>(null);

  private activeMemberIds = computed(() => {
    const currentYear = new Date().getFullYear();
    return new Set(
      this.inscricoes()
        .filter(i => i.ano === currentYear && i.status === 'Ativa')
        .map(i => i.membroId)
    );
  });

  filteredMembros = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const onlyActive = this.showOnlyActive();
    const unidade = this.unidadeFiltro();
    const activeIds = this.activeMemberIds();
    
    const members = this.membros();

    const filtered = members.filter(membro => {
      const matchActive = !onlyActive || activeIds.has(membro.id);
      const matchUnidade = !unidade || membro.unidade === unidade;
      const matchTerm = !term || 
        membro.nome.toLowerCase().includes(term) ||
        membro.cargo.toLowerCase().includes(term);

      return matchActive && matchUnidade && matchTerm;
    });
    
    // Sorting logic
    return filtered.sort((a, b) => {
      const aIsActive = activeIds.has(a.id);
      const bIsActive = activeIds.has(b.id);
      
      // Active members first
      if (aIsActive !== bIsActive) {
        return aIsActive ? -1 : 1;
      }
      
      // Then, alphabetically by name
      return a.nome.localeCompare(b.nome);
    });
  });

  private membrosFinanceiro = computed<MembroFinanceiro[]>(() => {
    return this.membros()
      .map(membro => {
      const inscricao = this.inscricoes().find(i => i.membroId === membro.id && i.ano === new Date().getFullYear()) ?? null;
      const mensalidades = inscricao ? this.mensalidades().filter(m => m.inscricaoId === inscricao.id) : [];
      const debitos = this.debitos().filter(d => d.membroId === membro.id);
      
      return {
        membro,
        inscricao,
        mensalidades,
        debitos,
      };
    });
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

  // --- Member Form Modal Logic ---
  openAddModal(): void {
    this.editingMembro.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(membro: Membro): void {
    this.editingMembro.set(membro);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  handleSave(membroData: Omit<Membro, 'id'> & { id?: number }): void {
    if (membroData.id) {
      this.membrosService.updateMembro(membroData as Membro);
    } else {
      this.membrosService.addMembro(membroData);
    }
    this.closeModal();
  }

  handleDelete(membro: Membro): void {
    if (confirm(`Tem certeza que deseja excluir ${membro.nome}?`)) {
      this.membrosService.deleteMembro(membro.id);
    }
  }

  // --- Inscription and Details Modals Logic ---
  openGerarInscricaoModal(membro: Membro): void {
    this.membroSelecionado.set(membro);
    this.isGerarInscricaoModalOpen.set(true);
  }

  closeGerarInscricaoModal(): void {
    this.isGerarInscricaoModalOpen.set(false);
    this.membroSelecionado.set(null);
  }

  handleGerarInscricao(data: { membroId: number; ano: number; valorTotal: number }): void {
    this.financasService.criarInscricao(data.membroId, data.ano, data.valorTotal);
    this.closeGerarInscricaoModal();
  }

  openDetalhesModal(membro: Membro): void {
    const item = this.membrosFinanceiro().find(mf => mf.membro.id === membro.id);
    if (item) {
      this.detalhesSelecionado.set({
        membro: item.membro,
        inscricao: item.inscricao,
        mensalidades: item.mensalidades,
        debitos: item.debitos
      });
      this.isDetalhesModalOpen.set(true);
    }
  }

  closeDetalhesModal(): void {
    this.isDetalhesModalOpen.set(false);
    this.detalhesSelecionado.set(null);
  }

  handlePagarMensalidade(mensalidadeId: number): void {
    this.financasService.pagarMensalidade(mensalidadeId);
    this.refreshDetalhesModalData();
  }

  handlePagarDebito(debitoId: number): void {
    this.financasService.pagarDebito(debitoId);
    this.refreshDetalhesModalData();
  }

  private refreshDetalhesModalData(): void {
     const detalhes = this.detalhesSelecionado();
    if (detalhes) {
        const updatedMembroFinanceiro = this.membrosFinanceiro().find(mf => mf.membro.id === detalhes.membro.id);
        if (updatedMembroFinanceiro) {
             this.detalhesSelecionado.set({
                membro: updatedMembroFinanceiro.membro,
                inscricao: updatedMembroFinanceiro.inscricao,
                mensalidades: updatedMembroFinanceiro.mensalidades,
                debitos: updatedMembroFinanceiro.debitos
             });
        } else {
          this.closeDetalhesModal();
        }
    }
  }

  // --- Helper Methods ---
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

  getInitials(name: string): string {
    if (!name) return '';
    const nameParts = name.split(' ');
    const firstName = nameParts[0] ?? '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getAvatarColor(name: string): string {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 
      'bg-indigo-500', 'bg-pink-500', 'bg-yellow-600', 'bg-teal-500'
    ];
    if (!name) return 'bg-gray-500';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % colors.length);
    return colors[index];
  }
}