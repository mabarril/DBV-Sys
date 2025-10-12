import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FinancasService } from '../financas/financas.service';
import { EventosService } from '../eventos/eventos.service';
import { ClassesService } from '../classes/classes.service';
import { EspecialidadesService } from '../especialidades/especialidades.service';
import { Evento } from '../eventos/evento.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private financasService = inject(FinancasService);
  private eventosService = inject(EventosService);
  private classesService = inject(ClassesService);
  private especialidadesService = inject(EspecialidadesService);

  private inscricoes = this.financasService.getInscricoes();
  private eventos = this.eventosService.getEventos();
  private classes = this.classesService.getClasses();
  private conclusoesEspecialidades = this.especialidadesService.getConclusoes();

  membrosAtivosCount = computed(() => {
    const currentYear = new Date().getFullYear();
    const activeMemberIds = new Set(
      this.inscricoes()
        .filter(i => i.ano === currentYear && i.status === 'Ativa')
        .map(i => i.membroId)
    );
    return activeMemberIds.size;
  });

  proximoEvento = computed<Evento | null>(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Normalize to the start of the day

    const futurosEventos = this.eventos()
      // The date is YYYY-MM-DD. Adding T00:00:00 helps prevent timezone issues
      .filter(evento => new Date(evento.data + 'T00:00:00') >= hoje) 
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

    return futurosEventos.length > 0 ? futurosEventos[0] : null;
  });

  totalUnidades = computed(() => {
    return this.classes().reduce((total, classe) => total + classe.unidades.length, 0);
  });

  totalEspecialidadesConcluidas = computed(() => {
    return this.conclusoesEspecialidades().length;
  });
}