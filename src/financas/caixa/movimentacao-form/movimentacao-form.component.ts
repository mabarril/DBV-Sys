import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MovimentacaoCaixa } from '../../inscricao.model';

@Component({
  selector: 'app-movimentacao-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './movimentacao-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MovimentacaoFormComponent implements OnInit {
  // FIX: Explicitly type injected FormBuilder to resolve 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);

  movimentacao = input<MovimentacaoCaixa | null>(null);
  save = output<Omit<MovimentacaoCaixa, 'id'> & { id?: number }>();
  close = output<void>();

  movimentacaoForm!: FormGroup;
  
  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.movimentacaoForm = this.fb.group({
      tipo: [this.movimentacao()?.tipo ?? 'Entrada', Validators.required],
      data: [this.movimentacao()?.data ?? today, Validators.required],
      descricao: [this.movimentacao()?.descricao ?? '', Validators.required],
      valor: [this.movimentacao()?.valor ?? 0, [Validators.required, Validators.min(0.01)]],
    });
  }

  get isEditing(): boolean {
    return !!this.movimentacao();
  }

  onSubmit(): void {
    if (this.movimentacaoForm.valid) {
      const formValue = this.movimentacaoForm.value;
      const data = {
        ...formValue,
        id: this.movimentacao()?.id,
      };
      this.save.emit(data);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
