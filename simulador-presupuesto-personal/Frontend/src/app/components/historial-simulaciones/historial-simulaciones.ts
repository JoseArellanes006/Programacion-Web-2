import { Component, input, output } from '@angular/core';
import { HistorialSimulacion } from '../../models/simulacion.model';

/*
  Componente HistorialSimulacionesComponent.

  Muestra las simulaciones guardadas en LocalStorage.

  Permite comprobar que la información permanece aun cuando
  el usuario recarga el navegador.
*/

@Component({
  selector: 'app-historial-simulaciones',
  standalone: true,
  template: `
    <section class="card">
      <div class="header">
        <div>
          <h2>Historial de simulaciones</h2>
          <p>Resultados almacenados con LocalStorage.</p>
        </div>

        <button
          [disabled]="historial().length === 0"
          (click)="limpiarHistorial.emit()"
        >
          Limpiar historial
        </button>
      </div>

      @if (historial().length === 0) {
        <p class="empty">Todavía no hay simulaciones registradas.</p>
      }

      @if (historial().length > 0) {
        <ul>
          @for (item of historial(); track item.fecha) {
            <li>
              <strong>{{ item.fecha }}</strong>
              <span>Meta: {{ moneda() }} {{ item.metaAhorro }}</span>
              <span>Reducción de gastos: {{ item.reduccionGastos }}%</span>
              <span>Meses proyectados: {{ item.meses }}</span>
              <span>Ahorro proyectado: {{ moneda() }} {{ item.ahorroProyectado }}</span>
              <span>
                Meses para meta:
                {{ item.mesesParaMeta ?? 'No alcanzable' }}
              </span>
            </li>
          }
        </ul>
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

    .header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
    }

    h2 {
      margin: 0;
      color: #111827;
    }

    p {
      color: #4b5563;
    }

    button {
      padding: 10px 14px;
      border: none;
      border-radius: 10px;
      background: #374151;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    ul {
      list-style: none;
      padding-left: 0;
      margin: 0;
    }

    li {
      padding: 14px;
      margin-bottom: 12px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }

    strong,
    span {
      display: block;
      margin-bottom: 5px;
    }

    span {
      color: #4b5563;
    }

    .empty {
      padding: 14px;
      background: #f9fafb;
      border-radius: 10px;
      color: #6b7280;
    }
  `
})
export class HistorialSimulacionesComponent {
  /*
    Historial recibido desde SimulacionesService.
  */
  historial = input<HistorialSimulacion[]>([]);

  /*
    Moneda seleccionada por el usuario.
  */
  moneda = input<string>('MXN');

  /*
    Evento para limpiar el historial.
  */
  limpiarHistorial = output<void>();
}