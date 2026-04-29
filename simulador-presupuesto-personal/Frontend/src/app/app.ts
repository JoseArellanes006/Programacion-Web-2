import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/*
  Componente raíz de la aplicación.

  Este componente es el punto de entrada visual de Angular.

  Su única responsabilidad es servir como contenedor
  para las rutas definidas en app.routes.ts.

  No contiene lógica de negocio ni UI compleja.
*/

@Component({
  selector: 'app-root',

  /*
    RouterOutlet permite que Angular renderice dinámicamente
    el componente asociado a la ruta activa.

    En este caso:
    - path '' → PresupuestoComponent
  */
  imports: [RouterOutlet],

  /*
    El template solo contiene el router-outlet.

    Aquí Angular inyectará la página correspondiente.
  */
  template: `
    <router-outlet />
  `,

  styles: ``
})
export class App {
  /*
    Ejemplo simple de signal.

    No es crítico para la aplicación, pero sirve como referencia
    de cómo manejar estado reactivo en Angular moderno.
  */
  protected readonly title = signal('simulador-presupuesto-personal');
}