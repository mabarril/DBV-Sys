import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Patrimonio } from '../../inscricao.model';

@Component({
  selector: 'app-patrimonio-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './patrimonio-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatrimonioFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);

  patrimonio = input<Patrimonio | null>(null);
  save = output<Omit<Patrimonio, 'id'> & { id?: number }>();
  close = output<void>();

  patrimonioForm!: FormGroup;
  
  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.patrimonioForm = this.fb.group({
      nome: [this.patrimonio()?.nome ?? '', Validators.required],
      descricao: [this.patrimonio()?.descricao ?? ''],
      dataAquisicao: [this.patrimonio()?.dataAquisicao ?? today, Validators.required],
      valorAquisicao: [this.patrimonio()?.valorAquisicao ?? 0, [Validators.required, Validators.min(0)]],
      localizacao: [this.patrimonio()?.localizacao ?? 'Sede', Validators.required],
    });
  }

  get isEditing(): boolean {
    return !!this.patrimonio();
  }

  onSubmit(): void {
    if (this.patrimonioForm.valid) {
      const formValue = this.patrimonioForm.value;
      const data = {
        ...formValue,
        id: this.patrimonio()?.id,
      };
      this.save.emit(data);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}