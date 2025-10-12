import { Component, ChangeDetectionStrategy, input, output, LOCALE_ID, inject } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import { Evento } from '../evento.model';
import { Membro } from '../../membros/membro.model';
import localePt from '@angular/common/locales/pt';

registerLocaleData(localePt);

@Component({
  selector: 'app-autorizacao-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './autorizacao-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }]
})
export class AutorizacaoModalComponent {
  membro = input.required<Membro>();
  evento = input.required<Evento>();
  close = output<void>();

  hoje = new Date();

  print(): void {
    const printContent = document.getElementById('printable-area');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      
      // Temporarily hide the rest of the app and print only the modal content
      const modalParent = printContent.closest('.fixed');
      let originalParentStyle = '';
      if(modalParent) {
          originalParentStyle = modalParent.getAttribute('style') || '';
          modalParent.setAttribute('style', 'position: static;'); // Avoid fixed position for printing
      }
      
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;

      // Restore original styles and state if needed
      // This is a simple approach; a more robust solution might use a dedicated print stylesheet
       if(modalParent) {
         modalParent.setAttribute('style', originalParentStyle);
       }
       // Re-bootstrap or re-render might be needed in complex apps, but for this case it's ok.
       // A quick reload is a simple way to restore state after printing if issues arise.
       location.reload(); 
    }
  }
}
