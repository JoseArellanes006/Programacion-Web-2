import { Routes } from '@angular/router';
import { CafeteriasComponent } from './pages/cafeterias/cafeterias';
import { DetalleCafeteriaComponent } from './pages/detalle-cafeteria/detalle-cafeteria';

/*
  Aquí se definen las rutas principales del frontend.

  Rutas del proyecto:
  - /cafeterias           -> catálogo principal
  - /cafeterias/:id       -> detalle de cafetería
*/
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'cafeterias',
    pathMatch: 'full'
  },
  {
    path: 'cafeterias',
    component: CafeteriasComponent
  },
  {
    path: 'cafeterias/:id',
    component: DetalleCafeteriaComponent
  },
  {
    path: '**',
    redirectTo: 'cafeterias'
  }
];