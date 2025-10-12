import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Membro } from '../membro.model';

@Component({
  selector: 'app-membro-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './membro-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembroFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);

  membro = input<Membro | null>(null);
  save = output<Omit<Membro, 'id'> & { id?: number }>();
  close = output<void>();

  membroForm!: FormGroup;
  unidades: Membro['unidade'][] = ['Águias', 'Falcões', 'Lobos', 'Tigres'];
  cargoOptions: Membro['cargo'][] = ['Desbravador', 'Conselheiro', 'Diretor', 'Tesoureiro', 'Instrutor'];
  
  ngOnInit(): void {
    this.membroForm = this.fb.group({
      nome: [this.membro()?.nome ?? '', Validators.required],
      unidade: [this.membro()?.unidade ?? 'Falcões', Validators.required],
      dataNascimento: [this.membro()?.dataNascimento ?? '', Validators.required],
      cargo: [this.membro()?.cargo ?? 'Desbravador', Validators.required],
    });
  }

  get isEditing(): boolean {
    return !!this.membro();
  }

  onSubmit(): void {
    if (this.membroForm.valid) {
      const formValue = this.membroForm.value;
      const memberData = {
        ...formValue,
        id: this.membro()?.id,
      };
      this.save.emit(memberData);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
