import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Especialidade, AreaEspecialidade } from '../especialidade.model';

@Component({
  selector: 'app-especialidade-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './especialidade-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EspecialidadeFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);

  especialidade = input<Especialidade | null>(null);
  save = output<Omit<Especialidade, 'id'> & { id?: number }>();
  close = output<void>();

  especialidadeForm!: FormGroup;
  areaOptions: AreaEspecialidade[] = ['Natureza', 'Artes Manuais', 'Habilidades Domésticas', 'Atividades Recreativas', 'Saúde e Ciência', 'Atividades Missionárias'];
  
  ngOnInit(): void {
    this.especialidadeForm = this.fb.group({
      nome: [this.especialidade()?.nome ?? '', Validators.required],
      area: [this.especialidade()?.area ?? 'Natureza', Validators.required],
      imageUrl: [this.especialidade()?.imageUrl ?? 'https://loremflickr.com/100/100/patch', Validators.required],
    });
  }

  get isEditing(): boolean {
    return !!this.especialidade();
  }

  onSubmit(): void {
    if (this.especialidadeForm.valid) {
      const formValue = this.especialidadeForm.value;
      const data = {
        ...formValue,
        id: this.especialidade()?.id,
      };
      this.save.emit(data);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
