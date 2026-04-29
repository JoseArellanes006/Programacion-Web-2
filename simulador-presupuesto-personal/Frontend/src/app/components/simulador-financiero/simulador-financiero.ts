import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ResultadoSimulacion } from '../../models/simulacion.model';

/*
  Componente SimuladorFinancieroComponent.

  Permite configurar una simulación:
  - meta de ahorro;
  - reducción porcentual de gastos;
  - meses de proyección.

  El cálculo no se hace aquí.
  Este componente solo envía los datos hacia la página principal,
  donde se ejecuta el Web Worker.
*/

@Component({
  selector: 'app-simulador-financiero',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Simulador financiero</h2>

      <p>
        Este módulo usa un Web Worker para calcular proyecciones sin bloquear
        la interfaz del navegador.
      </p>

      <label>Meta de ahorro</label>
      <input
        type="number"
        min="0"
        [ngModel]="metaAhorro()"
        (ngModelChange)="metaAhorro.set($event)"
      />

      <label>Reducción de gastos (%)</label>
      <input
        type="number"
        min="0"
        max="100"
        [ngModel]="reduccionGastos()"
        (ngModelChange)="reduccionGastos.set($event)"
      />

      <label>Meses de proyección</label>
      <input
        type="number"
        min="1"
        [ngModel]="meses()"
        (ngModelChange)="meses.set($event)"
      />

      <button
        (click)="simular()"
        [disabled]="calculando() || movimientosDisponibles() === 0"
      >
        {{ calculando() ? 'Simulando...' : 'Ejecutar simulación' }}
      </button>

      <div class="progress">
        <div class="bar" [style.width.%]="progreso()"></div>
      </div>

      <p class="info">
        Progreso: <strong>{{ progreso() }}%</strong>
      </p>

      @if (resultado()) {
        <div class="result">
          <h3>Resultado</h3>

          <p>
            Ahorro mensual actual:
            <strong>{{ moneda() }} {{ resultado()?.ahorroMensualActual }}</strong>
          </p>

          <p>
            Ahorro mensual simulado:
            <strong>{{ moneda() }} {{ resultado()?.ahorroMensualSimulado }}</strong>
          </p>

          <p>
            Ahorro proyectado:
            <strong>{{ moneda() }} {{ resultado()?.ahorroProyectado }}</strong>
          </p>

          <p>
            Meses para alcanzar la meta:
            <strong>
              {{ resultado()?.mesesParaMeta ?? 'No alcanzable con este escenario' }}
            </strong>
          </p>
        </div>
      }
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

    input {
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

    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .progress {
      width: 100%;
      height: 18px;
      background: #e5e7eb;
      border-radius: 999px;
      overflow: hidden;
      margin-top: 18px;
    }

    .bar {
      height: 100%;
      background: #16a34a;
      transition: width 0.2s ease;
    }

    .info {
      margin-top: 12px;
    }

    .result {
      margin-top: 18px;
      padding: 16px;
      background: #eff6ff;
      border-radius: 12px;
      border: 1px solid #bfdbfe;
    }

    .result h3 {
      margin-top: 0;
      color: #1e3a8a;
    }
  `
})
export class SimuladorFinancieroComponent {
  /*
    Configuración local de la simulación.
  */
  metaAhorro = signal(10000);
  reduccionGastos = signal(10);
  meses = signal(6);

  /*
    Datos recibidos desde la página principal.
  */
  progreso = input<number>(0);
  calculando = input<boolean>(false);
  movimientosDisponibles = input<number>(0);
  resultado = input<ResultadoSimulacion | null>(null);
  moneda = input<string>('MXN');

  /*
    Evento que solicita ejecutar una simulación.
  */
  ejecutarSimulacion = output<{
    metaAhorro: number;
    reduccionGastos: number;
    meses: number;
  }>();

  /*
    Emite la configuración de simulación hacia la página principal.
  */
  simular(): void {
    this.ejecutarSimulacion.emit({
      metaAhorro: Number(this.metaAhorro()),
      reduccionGastos: Number(this.reduccionGastos()),
      meses: Number(this.meses())
    });
  }
}