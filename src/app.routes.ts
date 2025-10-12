import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(c => c.HomeComponent),
    children: [
      { 
        path: 'dashboard', 
        loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DashboardComponent) 
      },
      { 
        path: 'membros', 
        loadComponent: () => import('./membros/membros.component').then(c => c.MembrosComponent) 
      },
      { 
        path: 'classes', 
        loadComponent: () => import('./classes/classes.component').then(c => c.ClassesComponent) 
      },
      { 
        path: 'especialidades', 
        loadComponent: () => import('./especialidades/especialidades.component').then(c => c.EspecialidadesComponent) 
      },
      { 
        path: 'eventos', 
        loadComponent: () => import('./eventos/eventos.component').then(c => c.EventosComponent) 
      },
      { 
        path: 'financas', 
        loadComponent: () => import('./financas/financas.component').then(c => c.FinancasComponent) 
      },
      { 
        path: '', 
        redirectTo: 'dashboard', 
        pathMatch: 'full' 
      },
    ]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];