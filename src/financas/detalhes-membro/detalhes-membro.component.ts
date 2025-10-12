import { Component, ChangeDetectionStrategy, input, output, computed } from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Membro } from '../../membros/membro.model';
import { Inscricao, Mensalidade, MensalidadeStatus, Debito } from '../inscricao.model';

@Component({
  selector: 'app-detalhes-membro',
  standalone: true,
  imports: [DatePipe, CurrencyPipe],
  templateUrl: './detalhes-membro.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetalhesMembroComponent {
  membro = input.required<Membro>();
  inscricao = input<Inscricao | null>();
  mensalidades = input.required<Mensalidade[]>();
  debitos = input.required<Debito[]>();

  pagarMensalidade = output<number>();
  pagarDebito = output<number>();
  close = output<void>();

  getMensalidadeStatus(mensalidade: Mensalidade): MensalidadeStatus {
    if (mensalidade.status === 'Paga') {
      return 'Paga';
    }
    
    // Use T12:00:00 to avoid timezone issues where the date might shift to the previous day
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normalize today's date
    const vencimento = new Date(`${mensalidade.dataVencimento}T12:00:00`);

    if (vencimento < hoje) {
      return 'Atrasada';
    }
    
    return 'Pendente';
  }
}