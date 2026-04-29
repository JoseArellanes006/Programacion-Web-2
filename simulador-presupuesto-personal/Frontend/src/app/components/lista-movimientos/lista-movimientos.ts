import { Component, input, output } from '@angular/core';
import { Movimiento } from '../../models/movimiento.model';

/*
  Componente ListaMovimientosComponent.

  Muestra todos los movimientos registrados por el usuario.

  También permite eliminar un movimiento específico o limpiar
  la lista completa.
*/

@Component({
  selector: 'app-lista-movimientos',
  standalone: true,
  template: `
    <section class="card">
      <div class="header">
        <div>
          <h2>Movimientos registrados</h2>
          <p>Ingresos y gastos guardados localmente.</p>
        </div>

        <button
          class="danger"
          [disabled]="movimientos().length === 0"
          (click)="limpiarMovimientos.emit()"
        >
          Limpiar todo
        </button>
      </div>

      @if (movimientos().length === 0) {
        <p class="empty">Todavía no hay movimientos registrados.</p>
      }

      @if (movimientos().length > 0) {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Categoría</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              @for (movimiento of movimientos(); track movimiento.id) {
                <tr>
                  <td>
                    <span [class.ingreso]="movimiento.tipo === 'ingreso'"
                          [class.gasto]="movimiento.tipo === 'gasto'">
                      {{ movimiento.tipo }}
                    </span>
                  </td>

                  <td>{{ movimiento.concepto }}</td>
                  <td>{{ movimiento.categoria }}</td>
                  <td>{{ moneda() }} {{ movimiento.monto }}</td>
                  <td>{{ movimiento.fecha }}</td>

                  <td>
                    <button class="delete" (click)="eliminarMovimiento.emit(movimiento.id)">
                      Eliminar
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
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
      margin-bottom: 0;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th,
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
    }

    th {
      background: #f3f4f6;
      color: #111827;
    }

    span {
      padding: 6px 10px;
      border-radius: 999px;
      font-weight: 700;
      text-transform: capitalize;
    }

    .ingreso {
      background: #dcfce7;
      color: #166534;
    }

    .gasto {
      background: #fee2e2;
      color: #991b1b;
    }

    button {
      padding: 9px 12px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
    }

    .delete,
    .danger {
      background: #b91c1c;
      color: white;
    }

    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }

    .empty {
      padding: 14px;
      background: #f9fafb;
      border-radius: 10px;
      color: #6b7280;
    }
  `
})
export class ListaMovimientosComponent {
  /*
    Lista de movimientos recibida desde la página principal.
  */
  movimientos = input<Movimiento[]>([]);

  /*
    Moneda seleccionada.
  */
  moneda = input<string>('MXN');

  /*
    Evento para eliminar un movimiento específico.
  */
  eliminarMovimiento = output<number>();

  /*
    Evento para limpiar todos los movimientos.
  */
  limpiarMovimientos = output<void>();
}