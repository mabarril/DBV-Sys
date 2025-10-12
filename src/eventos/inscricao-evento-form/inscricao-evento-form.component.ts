import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Evento, InscricaoEvento } from '../evento.model';
import { MembrosService } from '../../membros/membros.service';
import { EventosService } from '../eventos.service';
import { Membro } from '../../membros/membro.model';

interface MembroDisponivel {
  membro: Membro;
  inscrito: boolean;
}

@Component({
  selector: 'app-inscricao-evento-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './inscricao-evento-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscricaoEventoFormComponent implements OnInit {
  // FIX: Explicitly type injected FormBuilder to resolve 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);
  private membrosService = inject(MembrosService);
  private eventosService = inject(EventosService);

  evento = input.required<Evento>();
  save = output<number[]>();
  close = output<void>();

  inscricaoForm!: FormGroup;
  membroSearchTerm = signal('');
  
  private allMembros = this.membrosService.getMembros();
  private inscricoes = this.eventosService.getInscricoes();

  membrosDisponiveis = computed<MembroDisponivel[]>(() => {
    const inscritosIds = new Set(
      this.inscricoes()
        .filter(i => i.eventoId === this.evento().id)
        .map(i => i.membroId)
    );
    
    return this.allMembros()
      .map(membro => ({
        membro,
        inscrito: inscritosIds.has(membro.id)
      }))
      .sort((a, b) => a.membro.nome.localeCompare(b.membro.nome));
  });
  
  get membrosFormArray(): FormArray {
    return this.inscricaoForm.get('membros') as FormArray;
  }

  ngOnInit(): void {
    this.inscricaoForm = this.fb.group({
      membros: this.fb.array([]),
    });

    this.addMemberCheckboxes();
  }

  private addMemberCheckboxes(): void {
    this.membrosDisponiveis().forEach(() => this.membrosFormArray.push(this.fb.control(false)));
  }

  onSearchMembros(event: Event): void {
    this.membroSearchTerm.set((event.target as HTMLInputElement).value);
  }

  onSubmit(): void {
    if (this.inscricaoForm.valid) {
      const selectedMembroIds = this.inscricaoForm.value.membros
        .map((checked: boolean, i: number) => {
            const membroDisponivel = this.membrosDisponiveis()[i];
            // Only return ID if checked AND not already inscribed
            return checked && !membroDisponivel.inscrito ? membroDisponivel.membro.id : null
        })
        .filter((id: number | null): id is number => id !== null);

      this.save.emit(selectedMembroIds);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}