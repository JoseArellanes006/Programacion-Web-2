import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/*
  Este es el componente raíz de la aplicación.

  Su única responsabilidad aquí es servir como contenedor principal
  y mostrar las páginas según la ruta activa.
*/
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <main class="app-shell">
      <router-outlet />
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }

    .app-shell {
      min-height: 100vh;
      background: #f6f1eb;
    }
  `]
})
export class App {}