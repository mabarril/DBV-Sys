import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AtasService } from './atas.service';
import { MembrosService } from '../membros/membros.service';
import { AtaFormComponent } from './ata-form/ata-form.component';
import { Ata } from './ata.model';

@Component({
  selector: 'app-atas',
  standalone: true,
  imports: [DatePipe, AtaFormComponent],
  templateUrl: './atas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtasComponent {
  private atasService = inject(AtasService);
  private membrosService = inject(MembrosService);

  private atas = this.atasService.getAtas();
  private membros = this.membrosService.getMembros();

  isModalOpen = signal(false);
  editingAta = signal<Ata | null>(null);

  filteredAtas = computed(() => {
    return this.atas()
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  });

  private membrosMap = computed(() => {
    const map = new Map<number, string>();
    this.membros().forEach(m => map.set(m.id, m.nome));
    return map;
  });

  getMembroNome(id: number): string {
    return this.membrosMap().get(id) ?? 'Membro desconhecido';
  }

  openModal(ata: Ata | null): void {
    this.editingAta.set(ata);
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.editingAta.set(null);
  }

  handleSave(data: Omit<Ata, 'id'> & { id?: number }): void {
    if (data.id) {
      this.atasService.updateAta(data as Ata);
    } else {
      this.atasService.addAta(data);
    }
    this.closeModal();
  }

  handleDelete(ata: Ata): void {
    if (confirm(`Tem certeza que deseja excluir a ata "${ata.titulo}"?`)) {
      this.atasService.deleteAta(ata.id);
    }
  }
}