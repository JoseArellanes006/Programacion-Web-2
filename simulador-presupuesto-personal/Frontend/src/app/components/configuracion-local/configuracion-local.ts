import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/*
  Componente ConfiguracionLocalComponent.

  Permite capturar configuración básica del usuario:
  - nombre;
  - moneda.

  Estos datos se guardan posteriormente en LocalStorage
  desde la página principal.
*/

@Component({
  selector: 'app-configuracion-local',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Configuración local</h2>

      <p>
        Esta sección guarda preferencias del usuario en LocalStorage,
        una característica avanzada de HTML5.
      </p>

      <label>Nombre del usuario</label>
      <input
        type="text"
        [ngModel]="usuario()"
        (ngModelChange)="cambiarUsuario.emit($event)"
        placeholder="Ejemplo: José María"
      />

      <label>Moneda</label>
      <select
        [ngModel]="moneda()"
        (ngModelChange)="cambiarMoneda.emit($event)"
      >
        <option value="MXN">MXN - Peso mexicano</option>
        <option value="USD">USD - Dólar</option>
        <option value="EUR">EUR - Euro</option>
      </select>

      <button (click)="guardarConfiguracion.emit()">
        Guardar configuración
      </button>

      <p class="info">
        Usuario actual:
        <strong>{{ usuario() || 'Sin usuario guardado' }}</strong>
      </p>

      <p class="info">
        Moneda seleccionada:
        <strong>{{ moneda() }}</strong>
      </p>
    </section>
  `,
  styles: `
    .card {
      padding: 24px;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #d1d5db;
    }

    h2 {
      margin-top: 0;
      color: #111827;
    }

    p {
      color: #4b5563;
    }

    label {
      display: block;
      margin-top: 16px;
      margin-bottom: 6px;
      font-weight: 700;
    }

    input,
    select {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #9ca3af;
      font-size: 16px;
    }

    button {
      margin-top: 18px;
      padding: 12px 18px;
      border: none;
      border-radius: 10px;
      background: #1d4ed8;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    .info {
      margin-top: 14px;
      color: #374151;
    }
  `
})
export class ConfiguracionLocalComponent {
  /*
    Nombre actual recibido desde la página principal.
  */
  usuario = input<string>('');

  /*
    Moneda actual recibida desde la página principal.
  */
  moneda = input<string>('MXN');

  /*
    Emite el nuevo nombre hacia la página principal.
  */
  cambiarUsuario = output<string>();

  /*
    Emite la nueva moneda hacia la página principal.
  */
  cambiarMoneda = output<string>();

  /*
    Solicita guardar la configuración en LocalStorage.
  */
  guardarConfiguracion = output<void>();
}