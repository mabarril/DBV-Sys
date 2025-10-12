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
        path: 'atas', 
        loadComponent: () => import('./atas/atas.component').then(c => c.AtasComponent) 
      },
      { 
        path: 'eventos', 
        loadComponent: () => import('./eventos/eventos.component').then(c => c.EventosComponent) 
      },
      { 
        path: 'financas', 
        loadComponent: () => import('./financas/financas.component').then(c => c.FinancasComponent),
        children: [
          {
            path: 'inscricoes',
            loadComponent: () => import('./financas/inscricoes/inscricoes.component').then(c => c.InscricoesComponent)
          },
          {
            path: 'caixa',
            loadComponent: () => import('./financas/caixa/caixa.component').then(c => c.CaixaComponent)
          },
          {
            path: 'custos',
            loadComponent: () => import('./financas/custos/custos.component').then(c => c.CustosComponent)
          },
          {
            path: 'patrimonio',
            loadComponent: () => import('./financas/patrimonio/patrimonio.component').then(c => c.PatrimonioComponent)
          },
          {
            path: '',
            redirectTo: 'inscricoes',
            pathMatch: 'full'
          }
        ]
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