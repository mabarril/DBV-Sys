import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl, ValidatorFn } from '@angular/forms';
import { Especialidade } from '../especialidade.model';
import { MembrosService } from '../../membros/membros.service';
import { FinancasService } from '../../financas/financas.service';

// Custom validator to require at least one checkbox to be selected
function minSelectedCheckboxes(min = 1): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control instanceof FormArray) {
      const totalSelected = control.controls
        .map(c => c.value)
        .reduce((prev, next) => (next ? prev + 1 : prev), 0);
      return totalSelected >= min ? null : { required: true };
    }
    return null;
  };
}

@Component({
  selector: 'app-conclusao-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './conclusao-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConclusaoFormComponent implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private membrosService = inject(MembrosService);
  private financasService = inject(FinancasService);

  especialidade = input.required<Especialidade>();
  save = output<{ membroIds: number[]; instrutorId: number; dataConclusao: string; }>();
  close = output<void>();

  conclusaoForm!: FormGroup;
  membroSearchTerm = signal('');
  
  private allMembros = this.membrosService.getMembros();
  private inscricoes = this.financasService.getInscricoes();

  private activeMemberIds = computed(() => {
    const currentYear = new Date().getFullYear();
    return new Set(
      this.inscricoes()
        .filter(i => i.ano === currentYear && i.status === 'Ativa')
        .map(i => i.membroId)
    );
  });
  
  membrosAtivos = computed(() => 
    this.allMembros()
      .filter(m => this.activeMemberIds().has(m.id))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  );
  
  instrutores = computed(() => 
    this.allMembros().filter(m => 
      (m.cargo === 'Instrutor' || m.cargo === 'Diretor' || m.cargo === 'Conselheiro') && this.activeMemberIds().has(m.id)
    )
  );
  
  get membrosFormArray(): FormArray {
    return this.conclusaoForm.get('membros') as FormArray;
  }

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.conclusaoForm = this.fb.group({
      membros: this.fb.array([], [minSelectedCheckboxes(1)]),
      instrutorId: [null, Validators.required],
      dataConclusao: [today, Validators.required],
    });

    this.addMemberCheckboxes();
  }

  private addMemberCheckboxes() {
    this.membrosAtivos().forEach(() => this.membrosFormArray.push(this.fb.control(false)));
  }
  
  onSearchMembros(event: Event): void {
    this.membroSearchTerm.set((event.target as HTMLInputElement).value);
  }

  onSubmit(): void {
    if (this.conclusaoForm.valid) {
      const selectedMembroIds = this.conclusaoForm.value.membros
        .map((checked: boolean, i: number) => checked ? this.membrosAtivos()[i].id : null)
        .filter((id: number | null): id is number => id !== null);

      const { instrutorId, dataConclusao } = this.conclusaoForm.value;
      this.save.emit({
        membroIds: selectedMembroIds,
        instrutorId,
        dataConclusao
      });
    }
  }

  onCancel(): void {
    this.close.emit();
  }
}