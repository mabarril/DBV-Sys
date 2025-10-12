import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  desktopSidebarOpen = signal(true);
  mobileSidebarOpen = signal(false);

  toggleDesktopSidebar(): void {
    this.desktopSidebarOpen.update(value => !value);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update(value => !value);
  }
}
