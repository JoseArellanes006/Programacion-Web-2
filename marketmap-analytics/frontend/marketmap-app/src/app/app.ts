/*
  Componente raíz de la aplicación.

  Este componente carga la estructura inicial del sistema y contiene
  el RouterOutlet, donde Angular mostrará las páginas según la ruta activa.
*/

import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_CONSTANTS } from './core/config/app.constants';

@Component({
  /*
    Selector principal usado en index.html.
  */
  selector: 'app-root',

  /*
    Se importa RouterOutlet porque el HTML usa <router-outlet />.
  */
  imports: [RouterOutlet],

  /*
    Archivo HTML asociado al componente raíz.
  */
  templateUrl: './app.html',

  /*
    Archivo SCSS asociado al componente raíz.
  */
  styleUrl: './app.scss'
})
export class App {
  /*
    Nombre visible del sistema.

    Se toma desde APP_CONSTANTS para no escribir el nombre de la aplicación
    directamente dentro del componente.
  */
  protected readonly appName = signal(APP_CONSTANTS.appName);

  /*
    Subtítulo descriptivo del sistema.
  */
  protected readonly appSubtitle = signal(APP_CONSTANTS.appSubtitle);
}