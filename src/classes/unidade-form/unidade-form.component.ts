import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Unidade } from '../classe.model';
import { MembrosService } from '../../membros/membros.service';

@Component({
  selector: 'app-unidade-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './unidade-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnidadeFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private membrosService = inject(MembrosService);

  unidade = input<Unidade | null>(null);
  save = output<Omit<Unidade, 'id'> & { id?: number }>();
  close = output<void>();

  unidadeForm!: FormGroup;
  // FIX: Call the signal to get its value before using array methods.
  conselheiros = computed(() => this.membrosService.getMembros()().filter(m => m.cargo === 'Conselheiro'));

  ngOnInit(): void {
    this.unidadeForm = this.fb.group({
      nome: [this.unidade()?.nome ?? '', Validators.required],
      conselheiroId: [this.unidade()?.conselheiroId ?? null],
    });
  }

  get isEditing(): boolean {
    return !!this.unidade();
  }

  onSubmit(): void {
    if (this.unidadeForm.valid) {
      const formValue = this.unidadeForm.value;
      const unidadeData = {
        ...formValue,
        id: this.unidade()?.id,
      };
      this.save.emit(unidadeData);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
