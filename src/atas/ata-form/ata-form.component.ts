// FIX: Import 'signal' from '@angular/core' to resolve 'Cannot find name' error.
import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Ata, TipoAta } from '../ata.model';
import { MembrosService } from '../../membros/membros.service';

@Component({
  selector: 'app-ata-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './ata-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtaFormComponent implements OnInit {
  // FIX: Explicitly type injected FormBuilder to resolve property access errors on 'unknown' type.
  private fb: FormBuilder = inject(FormBuilder);
  private membrosService = inject(MembrosService);

  ata = input<Ata | null>(null);
  save = output<Omit<Ata, 'id'> & { id?: number }>();
  close = output<void>();

  ataForm!: FormGroup;
  tiposAta: TipoAta[] = ['Reunião de Diretoria', 'Comissão Disciplinar', 'Reunião Regular', 'Outro'];
  
  membros = computed(() => this.membrosService.getMembros()().sort((a,b) => a.nome.localeCompare(b.nome)));
  anexos = signal<string[]>([]);
  participanteSearchTerm = signal('');
  
  get isEditing(): boolean {
    return !!this.ata();
  }
  
  get participantesFormArray(): FormArray {
    return this.ataForm.get('participantes') as FormArray;
  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.ataForm = this.fb.group({
      titulo: [this.ata()?.titulo ?? '', Validators.required],
      data: [this.ata()?.data ?? today, Validators.required],
      tipo: [this.ata()?.tipo ?? 'Reunião Regular', Validators.required],
      descricao: [this.ata()?.descricao ?? '', Validators.required],
      participantes: this.fb.array([])
    });

    this.anexos.set(this.ata()?.documentos ?? []);
    this.createParticipantesCheckboxes();
  }

  private createParticipantesCheckboxes(): void {
    const participantesIds = new Set(this.ata()?.participantesIds ?? []);
    this.membros().forEach(membro => {
      const isChecked = participantesIds.has(membro.id);
      this.participantesFormArray.push(this.fb.control(isChecked));
    });
  }
  
  onSearchParticipantes(event: Event): void {
    this.participanteSearchTerm.set((event.target as HTMLInputElement).value);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
        const fileNames = Array.from(input.files).map(file => file.name);
        this.anexos.update(docs => [...new Set([...docs, ...fileNames])]);
    }
  }

  removeAnexo(fileName: string): void {
    this.anexos.update(docs => docs.filter(doc => doc !== fileName));
  }

  onSubmit(): void {
    if (this.ataForm.valid) {
      const selectedParticipantesIds = this.ataForm.value.participantes
        .map((checked: boolean, i: number) => checked ? this.membros()[i].id : null)
        .filter((id: number | null): id is number => id !== null);

      const formValue = this.ataForm.value;
      const data = {
        id: this.ata()?.id,
        titulo: formValue.titulo,
        data: formValue.data,
        tipo: formValue.tipo,
        descricao: formValue.descricao,
        participantesIds: selectedParticipantesIds,
        documentos: this.anexos()
      };
      this.save.emit(data);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}