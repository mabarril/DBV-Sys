import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';
import { Membro } from '../../membros/membro.model';

@Component({
  selector: 'app-inscricao-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './inscricao-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscricaoFormComponent implements OnInit {
  // FIX: Explicitly type injected FormBuilder to resolve 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);

  membro = input.required<Membro>();
  save = output<{ membroId: number; ano: number; valorTotal: number }>();
  close = output<void>();

  inscricaoForm!: FormGroup;

  ngOnInit(): void {
    const currentYear = new Date().getFullYear();
    this.inscricaoForm = this.fb.group({
      ano: [currentYear, [Validators.required, Validators.min(2000)]],
      valorTotal: [100.00, [Validators.required, Validators.min(0.01)]],
    });
  }

  onSubmit(): void {
    if (this.inscricaoForm.valid) {
      const { ano, valorTotal } = this.inscricaoForm.value;
      this.save.emit({
        membroId: this.membro().id,
        ano,
        valorTotal
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
