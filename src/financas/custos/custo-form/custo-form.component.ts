import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Custo, CategoriaCusto } from '../../inscricao.model';

@Component({
  selector: 'app-custo-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './custo-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustoFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);

  custo = input<Custo | null>(null);
  save = output<Omit<Custo, 'id'> & { id?: number }>();
  close = output<void>();

  custoForm!: FormGroup;
  categorias: CategoriaCusto[] = ['Alimentação', 'Transporte', 'Material de Escritório', 'Eventos', 'Outros'];
  
  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.custoForm = this.fb.group({
      data: [this.custo()?.data ?? today, Validators.required],
      descricao: [this.custo()?.descricao ?? '', Validators.required],
      categoria: [this.custo()?.categoria ?? 'Outros', Validators.required],
      valor: [this.custo()?.valor ?? 0, [Validators.required, Validators.min(0.01)]],
    });
  }

  get isEditing(): boolean {
    return !!this.custo();
  }

  onSubmit(): void {
    if (this.custoForm.valid) {
      const formValue = this.custoForm.value;
      const data = {
        ...formValue,
        id: this.custo()?.id,
      };
      this.save.emit(data);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}