import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/*
  ============================================================
  COMPONENTE PRINCIPAL DE LA APLICACIÓN
  ============================================================

  App es el componente raíz.

  Su función principal es cargar el sistema de rutas mediante:

  <router-outlet></router-outlet>

  En este proyecto, el router-outlet mostrará el DashboardSensorComponent.
*/

@Component({
  selector: 'app-root',

  /*
    En Angular moderno los componentes pueden ser standalone.

    Este componente importa RouterOutlet porque su HTML usa:

    <router-outlet></router-outlet>
  */
  imports: [RouterOutlet],

  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  /*
    Signal con el título de la aplicación.

    Aunque no es obligatorio usarlo en este proyecto, se conserva porque
    Angular 21 trabaja muy bien con signals y es útil para mostrar a los
    alumnos el manejo moderno de estado.
  */
  protected readonly title = signal('sensor-web-angular');
}