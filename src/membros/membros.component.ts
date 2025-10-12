import { Component, ChangeDetectionStrategy, signal, inject, computed } from '@angular/core';
import { MembrosService } from './membros.service';
import { Membro } from './membro.model';
import { MembroFormComponent } from './membro-form/membro-form.component';
import { FinancasService } from '../financas/financas.service';

@Component({
  selector: 'app-membros',
  standalone: true,
  imports: [MembroFormComponent],
  templateUrl: './membros.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembrosComponent {
  private membrosService = inject(MembrosService);
  private financasService = inject(FinancasService);
  
  membros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();
  searchTerm = signal('');
  isModalOpen = signal(false);
  editingMembro = signal<Membro | null>(null);

  private activeMemberIds = computed(() => {
    const currentYear = new Date().getFullYear();
    return new Set(
      this.inscricoes()
        .filter(i => i.ano === currentYear && i.status === 'Ativa')
        .map(i => i.membroId)
    );
  });

  isMembroAtivo(membroId: number): boolean {
    return this.activeMemberIds().has(membroId);
  }

  filteredMembros = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    if (!term) {
      return this.membros();
    }
    return this.membros().filter(membro => 
      membro.nome.toLowerCase().includes(term) ||
      membro.unidade.toLowerCase().includes(term) ||
      membro.cargo.toLowerCase().includes(term)
    );
  });

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

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
