import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './relatorios.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelatoriosComponent {}
