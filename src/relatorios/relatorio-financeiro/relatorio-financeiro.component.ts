import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RelatorioInscricoesComponent } from './relatorio-inscricoes.component';
import { RelatorioCaixaComponent } from './relatorio-caixa.component';
import { RelatorioCustosComponent } from './relatorio-custos.component';
import { RelatorioPatrimonioComponent } from './relatorio-patrimonio.component';

@Component({
  selector: 'app-relatorio-financeiro',
  standalone: true,
  imports: [
    RelatorioInscricoesComponent,
    RelatorioCaixaComponent,
    RelatorioCustosComponent,
    RelatorioPatrimonioComponent
  ],
  templateUrl: './relatorio-financeiro.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatorioFinanceiroComponent {}
