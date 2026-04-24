import { Component, inject } from '@angular/core';
import { CafeteriasService } from '../../services/cafeterias';
import { CafeteriaCardComponent } from '../cafeteria-card/cafeteria-card';

/*
  Este componente muestra la parte dinámica del catálogo.

  Su función es representar visualmente el estado actual de la información:

  - carga en progreso
  - error
  - lista vacía
  - lista con resultados

  Aquí se refuerzan temas de la unidad como:
  - retroalimentación visual
  - experiencia de usuario
  - transición entre estados de interfaz
*/
@Component({
  selector: 'app-cafeterias-list',
  standalone: true,
  imports: [CafeteriaCardComponent],
  template: `
    <section class="lista-wrapper">
      @if (service.cargando()) {
        <div class="estado estado-cargando">
          <div class="loader"></div>
          <span>Cargando cafeterías...</span>
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
      animation: fadeIn 0.35s ease;
    }

    .estado {
      border-radius: 16px;
      padding: 18px;
      font-size: 0.98rem;
      line-height: 1.5;
      animation: fadeSlideIn 0.3s ease;
    }

    .estado-cargando {
      background: #fff7ef;
      color: #7a5538;
      border: 1px solid #edd7c6;
      display: flex;
      align-items: center;
      gap: 12px;
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

    .loader {
      width: 18px;
      height: 18px;
      border: 3px solid rgba(122, 85, 56, 0.2);
      border-top-color: #7a5538;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @keyframes fadeSlideIn {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0.4;
      }
      to {
        opacity: 1;
      }
    }
  `]
})
export class CafeteriasListComponent {
  service = inject(CafeteriasService);
}