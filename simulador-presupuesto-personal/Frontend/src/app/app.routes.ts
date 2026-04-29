import { Routes } from '@angular/router';
import { PresupuestoComponent } from './pages/presupuesto/presupuesto';

/*
  app.routes.ts

  Define las rutas principales de la aplicación.

  En este proyecto solo existe una vista principal:
  el simulador de presupuesto.
*/

export const routes: Routes = [
  {
    path: '',
    component: PresupuestoComponent
  }
];