import { Component, inject } from '@angular/core';
import { CafeteriasService } from '../../services/cafeterias';
import { CafeteriaCardComponent } from '../cafeteria-card/cafeteria-card';

/*
  Este componente muestra:
  - mensaje de carga
  - mensaje de error
  - mensaje cuando no hay resultados
  - lista de tarjetas

  Observa que aquí no se hacen peticiones.
  Todo el estado ya viene resuelto desde el servicio.
*/
@Component({
  selector: 'app-cafeterias-list',
  standalone: true,
  imports: [CafeteriaCardComponent],
  template: `
    <section class="lista-wrapper">
      @if (service.cargando()) {
        <div class="estado estado-cargando">
          Cargando cafeterías...
        </div>
      }

      @if (!service.cargando() && service.error()) {
        <div class="estado estado-error">
          {{ service.error() }}
        </div>
      }

      @if (!service.cargando() && !service.error() && service.cafeteriasFiltradas().length === 0) {
        <div class="estado estado-vacio">
          No se encontraron cafeterías con los filtros actuales.
        </div>
      }

      @if (!service.cargando() && !service.error() && service.cafeteriasFiltradas().length > 0) {
        <div class="lista">
          @for (cafeteria of service.cafeteriasFiltradas(); track cafeteria.id) {
            <app-cafeteria-card [cafeteria]="cafeteria" />
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .lista-wrapper {
      display: block;
    }

    .lista {
      display: grid;
      gap: 16px;
    }

    .estado {
      border-radius: 16px;
      padding: 18px;
      font-size: 0.98rem;
      line-height: 1.5;
    }

    .estado-cargando {
      background: #fff7ef;
      color: #7a5538;
      border: 1px solid #edd7c6;
    }

    .estado-error {
      background: #fff2f2;
      color: #8d2d2d;
      border: 1px solid #f0c7c7;
    }

    .estado-vacio {
      background: #f7f7f7;
      color: #4e4e4e;
      border: 1px solid #e0e0e0;
    }
  `]
})
export class CafeteriasListComponent {
  service = inject(CafeteriasService);
}