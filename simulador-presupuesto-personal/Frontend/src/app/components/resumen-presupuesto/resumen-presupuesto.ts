import { Component, input } from '@angular/core';
import { ResumenPresupuesto } from '../../models/presupuesto.model';

/*
  Componente ResumenPresupuestoComponent.

  Muestra el estado general del presupuesto:
  - ingresos;
  - gastos;
  - balance;
  - porcentaje de gasto.

  Recibe la información calculada desde MovimientosService.
*/

@Component({
  selector: 'app-resumen-presupuesto',
  standalone: true,
  template: `
    <section class="card">
      <h2>Resumen del presupuesto</h2>

      <div class="summary-grid">
        <article>
          <span>Total ingresos</span>
          <strong>{{ moneda() }} {{ resumen().totalIngresos }}</strong>
        </article>

        <article>
          <span>Total gastos</span>
          <strong>{{ moneda() }} {{ resumen().totalGastos }}</strong>
        </article>

        <article>
          <span>Balance</span>
          <strong [class.negative]="resumen().balance < 0">
            {{ moneda() }} {{ resumen().balance }}
          </strong>
        </article>

        <article>
          <span>Porcentaje de gasto</span>
          <strong>{{ resumen().porcentajeGasto.toFixed(2) }}%</strong>
        </article>
      </div>
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

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
    }

    article {
      padding: 18px;
      background: #f9fafb;
      border-radius: 14px;
      border: 1px solid #e5e7eb;
    }

    span {
      display: block;
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 8px;
    }

    strong {
      color: #111827;
      font-size: 20px;
    }

    .negative {
      color: #b91c1c;
    }

    @media (max-width: 900px) {
      .summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 600px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }
  `
})
export class ResumenPresupuestoComponent {
  /*
    Resumen financiero recibido desde la página principal.
  */
  resumen = input.required<ResumenPresupuesto>();

  /*
    Moneda seleccionada por el usuario.
  */
  moneda = input<string>('MXN');
}