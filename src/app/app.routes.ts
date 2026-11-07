import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'inicio' },
  { path: 'inicio', loadComponent: () => import('./pages/inicio').then((m) => m.InicioPage) },
  { path: 'decimos', loadComponent: () => import('./pages/decimos').then((m) => m.DecimosPage) },
  { path: 'decimos/:id', loadComponent: () => import('./pages/detalle').then((m) => m.DetallePage) },
  { path: 'personas', loadComponent: () => import('./pages/personas').then((m) => m.PersonasPage) },
  { path: 'resumen', loadComponent: () => import('./pages/resumen').then((m) => m.ResumenPage) },
  { path: 'informe', loadComponent: () => import('./pages/informe').then((m) => m.InformePage) },
  { path: 'ajustes', loadComponent: () => import('./pages/ajustes').then((m) => m.AjustesPage) },
  { path: '**', redirectTo: 'inicio' },
];
