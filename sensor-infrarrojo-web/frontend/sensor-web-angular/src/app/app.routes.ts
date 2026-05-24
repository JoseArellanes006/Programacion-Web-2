import { Routes } from '@angular/router';

import { DashboardSensorComponent } from './pages/dashboard-sensor/dashboard-sensor';

/*
  ============================================================
  RUTAS DE LA APLICACIÓN
  ============================================================

  Este archivo indica qué componente se debe cargar según la URL.

  En este proyecto solamente tenemos una pantalla principal:

  - DashboardSensorComponent

  Por eso, cuando el usuario entra a:

  http://localhost:4200/

  Angular muestra directamente el dashboard del sensor.
*/

export const routes: Routes = [
  /*
    Ruta principal.

    path: ''
    Significa que esta ruta corresponde a la página inicial.
  */
  {
    path: '',
    component: DashboardSensorComponent
  },

  /*
    Ruta comodín.

    path: '**'
    Captura cualquier ruta inexistente.

    Si el usuario escribe una URL incorrecta, Angular lo redirige
    nuevamente al dashboard principal.
  */
  {
    path: '**',
    redirectTo: ''
  }
];