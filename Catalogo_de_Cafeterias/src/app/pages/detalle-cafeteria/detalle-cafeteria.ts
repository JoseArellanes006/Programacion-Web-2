import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CafeteriasService } from '../../services/cafeterias';
import { Cafeteria } from '../../models/cafeteria.model';

/*
  Esta página muestra la información completa de una cafetería.
  Se obtiene el ID desde la URL y luego se consulta el backend.
*/
@Component({
  selector: 'app-detalle-cafeteria',
  standalone: true,
  template: `
    <section class="detalle-page">
      <button class="volver" type="button" (click)="regresar()">
        Regresar
      </button>

      @if (cargando()) {
        <div class="estado estado-cargando">
          Cargando detalle de la cafetería...
        </div>
      }

      @if (error()) {
        <div class="estado estado-error">
          {{ error() }}
        </div>
      }

      @if (!cargando() && !error() && cafeteria()) {
        <article class="detalle-card">
          <img
            class="imagen"
            [src]="cafeteria()!.imagen"
            [alt]="'Imagen de ' + cafeteria()!.nombre"
          />

          <div class="contenido">
            <div class="titulo-row">
              <h1>{{ cafeteria()!.nombre }}</h1>
              <span class="rating">★ {{ cafeteria()!.calificacion }}</span>
            </div>

            <p class="categoria">{{ cafeteria()!.categoria }}</p>

            <p class="descripcion">
              {{ cafeteria()!.descripcion }}
            </p>

            <div class="bloque-info">
              <h2>Ubicación</h2>
              <p>{{ cafeteria()!.ubicacion }}</p>
            </div>

            <div class="bloque-info">
              <h2>Horario</h2>
              <p>{{ cafeteria()!.horario }}</p>
            </div>
          </div>
        </article>
      }
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background: linear-gradient(180deg, #f6f1eb 0%, #fffaf5 100%);
    }

    .detalle-page {
      width: min(100%, 760px);
      margin: 0 auto;
      padding: 16px;
      box-sizing: border-box;
    }

    .volver {
      border: none;
      background: #e7d4c2;
      color: #4d3220;
      padding: 12px 16px;
      border-radius: 12px;
      font-weight: 700;
      margin-bottom: 16px;
      transition: transform 0.2s ease, background 0.2s ease;
    }

    .volver:active {
      transform: scale(0.97);
      background: #dcc3ae;
    }

    .detalle-card {
      background: #fff;
      border-radius: 22px;
      overflow: hidden;
      box-shadow: 0 10px 24px rgba(67, 44, 25, 0.08);
    }

    .imagen {
      width: 100%;
      display: block;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      background: #f1e6dc;
    }

    .contenido {
      padding: 18px;
    }

    .titulo-row {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
      margin-bottom: 6px;
    }

    h1 {
      margin: 0;
      font-size: 1.8rem;
      line-height: 1.1;
      color: #2f1f14;
    }

    .rating {
      white-space: nowrap;
      font-size: 0.95rem;
      font-weight: 700;
      color: #9a6a2b;
    }

    .categoria {
      display: inline-block;
      margin: 0 0 14px 0;
      background: #f3e7dc;
      color: #6d472d;
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 0.88rem;
      font-weight: 600;
    }

    .descripcion {
      margin: 0 0 18px 0;
      color: #4f3d32;
      line-height: 1.65;
      font-size: 1rem;
    }

    .bloque-info {
      padding: 14px 0;
      border-top: 1px solid #efdfd0;
    }

    .bloque-info h2 {
      margin: 0 0 6px 0;
      font-size: 1rem;
      color: #4d3220;
    }

    .bloque-info p {
      margin: 0;
      color: #6c5648;
      line-height: 1.5;
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
  `]
})
export class DetalleCafeteriaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cafeteriasService = inject(CafeteriasService);

  // Signal para almacenar la cafetería actual.
  cafeteria = signal<Cafeteria | null>(null);

  // Estado de carga local de la página de detalle.
  cargando = signal<boolean>(false);

  // Error local del detalle.
  error = signal<string>('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    // Validación básica del parámetro.
    if (!id || Number.isNaN(id)) {
      this.error.set('El identificador de la cafetería no es válido.');
      return;
    }

    this.cargarDetalle(id);
  }

  /*
    Realiza la consulta al backend para traer una cafetería concreta.
  */
  private cargarDetalle(id: number): void {
    this.cargando.set(true);
    this.error.set('');

    this.cafeteriasService.obtenerCafeteriaPorId(id).subscribe({
      next: (respuesta) => {
        this.cafeteria.set(respuesta);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar el detalle de la cafetería.');
        this.cargando.set(false);
      }
    });
  }

  /*
    Regresa a la página principal del catálogo.
  */
  regresar(): void {
    this.router.navigate(['/cafeterias']);
  }
}