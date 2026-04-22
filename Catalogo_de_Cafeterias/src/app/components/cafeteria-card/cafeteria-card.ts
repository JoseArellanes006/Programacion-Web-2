import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Cafeteria } from '../../models/cafeteria.model';

/*
  Esta tarjeta representa una cafetería dentro del catálogo.

  Muestra información resumida y permite navegar a la vista de detalle.
  Visualmente está pensada para una experiencia móvil:
  - tarjeta grande
  - imagen destacada
  - pulsación con transición
*/
@Component({
  selector: 'app-cafeteria-card',
  standalone: true,
  template: `
    <article class="card" (click)="irADetalle()" tabindex="0">
      <div class="imagen-wrapper">
        <img
          class="imagen"
          [src]="cafeteria.imagen"
          [alt]="'Imagen de ' + cafeteria.nombre"
        />
        <span class="badge">{{ cafeteria.categoria }}</span>
      </div>

      <div class="contenido">
        <div class="encabezado">
          <h2 class="titulo">{{ cafeteria.nombre }}</h2>
          <span class="rating">★ {{ cafeteria.calificacion }}</span>
        </div>

        <p class="ubicacion">{{ cafeteria.ubicacion }}</p>

        <p class="descripcion">
          {{ cafeteria.descripcion }}
        </p>

        <div class="pie">
          <span class="horario">{{ cafeteria.horario }}</span>
          <button class="boton" type="button" (click)="irADetalle($event)">
            Ver detalle
          </button>
        </div>
      </div>
    </article>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border-radius: 22px;
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(67, 44, 25, 0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
      cursor: pointer;
    }

    .card:active {
      transform: scale(0.985);
      box-shadow: 0 6px 16px rgba(67, 44, 25, 0.10);
    }

    .imagen-wrapper {
      position: relative;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background: #f1e6dc;
    }

    .imagen {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .badge {
      position: absolute;
      left: 12px;
      bottom: 12px;
      background: rgba(47, 31, 20, 0.82);
      color: #fff;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 0.82rem;
      font-weight: 600;
      backdrop-filter: blur(4px);
    }

    .contenido {
      padding: 16px;
    }

    .encabezado {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: start;
      margin-bottom: 6px;
    }

    .titulo {
      margin: 0;
      font-size: 1.2rem;
      line-height: 1.2;
      color: #2f1f14;
      flex: 1;
    }

    .rating {
      white-space: nowrap;
      font-size: 0.92rem;
      font-weight: 700;
      color: #9a6a2b;
    }

    .ubicacion {
      margin: 0 0 10px 0;
      color: #6f594a;
      font-size: 0.95rem;
    }

    .descripcion {
      margin: 0 0 14px 0;
      color: #4f3d32;
      line-height: 1.5;
      font-size: 0.95rem;
    }

    .pie {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .horario {
      color: #7a6454;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .boton {
      border: none;
      background: #6f4a2f;
      color: #fff;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 0.92rem;
      font-weight: 600;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .boton:active {
      transform: scale(0.97);
      background: #5b3c25;
    }
  `]
})
export class CafeteriaCardComponent {
  @Input({ required: true }) cafeteria!: Cafeteria;

  private router = inject(Router);

  /*
    Navega a la pantalla de detalle.
    Recibe event opcional para evitar que el botón interno dispare dos veces
    la misma navegación al propagarse el click hacia la tarjeta.
  */
  irADetalle(event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/cafeterias', this.cafeteria.id]);
  }
}