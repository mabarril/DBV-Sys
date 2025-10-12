import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Evento } from '../evento.model';

@Component({
  selector: 'app-evento-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './evento-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventoFormComponent implements OnInit {
  // FIX: Explicitly type injected FormBuilder to resolve 'unknown' type error.
  private fb: FormBuilder = inject(FormBuilder);

  evento = input<Evento | null>(null);
  save = output<Omit<Evento, 'id'> & { id?: number }>();
  delete = output<number>();
  close = output<void>();

  eventoForm!: FormGroup;
  
  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.eventoForm = this.fb.group({
      tipo: [this.evento()?.tipo ?? '', Validators.required],
      data: [this.evento()?.data ?? today, Validators.required],
      local: [this.evento()?.local ?? '', Validators.required],
      valor: [this.evento()?.valor ?? 0, [Validators.required, Validators.min(0)]],
    });
  }

  get isEditing(): boolean {
    return !!this.evento();
  }

  onSubmit(): void {
    if (this.eventoForm.valid) {
      const formValue = this.eventoForm.value;
      const data = {
        ...formValue,
        id: this.evento()?.id,
      };
      this.save.emit(data);
    }
  }

  onDelete(): void {
    if(this.evento()?.id) {
      this.delete.emit(this.evento()!.id);
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}
