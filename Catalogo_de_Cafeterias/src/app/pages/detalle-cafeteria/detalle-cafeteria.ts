import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CafeteriasService } from '../../services/cafeterias';
import { Cafeteria } from '../../models/cafeteria.model';

/*
  Esta página representa la vista de detalle de una cafetería.

  Su propósito es mostrar información más completa de la tarjeta que el usuario
  seleccionó en el catálogo principal.

  Desde el punto de vista didáctico, este componente es importante porque permite
  demostrar varios conceptos del tema:

  1. Interacción móvil:
     El usuario toca una tarjeta en la vista principal y navega al detalle.

  2. Transición entre vistas:
     Aunque Angular cambia de ruta, aquí reforzamos visualmente esa transición
     con animaciones de entrada para que el cambio no se perciba brusco.

  3. Retroalimentación visual:
     Se muestran estados de carga y error, para que el usuario entienda qué
     está ocurriendo mientras se consulta el backend.

  4. UX móvil:
     La información se presenta con jerarquía clara, buen espaciado y controles
     cómodos para volver a la pantalla anterior.
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
          <div class="loader"></div>
          <span>Cargando detalle de la cafetería...</span>
        </div>
      }

      @if (error()) {
        <div class="estado estado-error">
          {{ error() }}
        </div>
      }

      @if (!cargando() && !error() && cafeteria()) {
        <article class="detalle-card">
          <div class="imagen-wrapper">
            <img
              class="imagen"
              [src]="cafeteria()!.imagen"
              [alt]="'Imagen de ' + cafeteria()!.nombre"
            />
            <span class="badge">{{ cafeteria()!.categoria }}</span>
          </div>

          <div class="contenido">
            <div class="titulo-row">
              <h1>{{ cafeteria()!.nombre }}</h1>
              <span class="rating">★ {{ cafeteria()!.calificacion }}</span>
            </div>

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

            <div class="bloque-info bloque-destacado">
              <h2>Experiencia móvil</h2>
              <p>
                Esta vista ejemplifica cómo una pantalla de detalle puede organizar
                la información de forma clara, táctil y visualmente agradable en dispositivos móviles.
              </p>
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
      animation: fadePage 0.35s ease;
    }

    .volver {
      border: none;
      background: #e7d4c2;
      color: #4d3220;
      padding: 12px 16px;
      border-radius: 12px;
      font-weight: 700;
      margin-bottom: 16px;
      min-height: 44px;
      transition:
        transform 0.2s ease,
        background 0.2s ease,
        box-shadow 0.2s ease;
    }

    .volver:hover {
      box-shadow: 0 6px 14px rgba(77, 50, 32, 0.12);
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
      animation: cardEntrance 0.45s ease;
    }

    .imagen-wrapper {
      position: relative;
      overflow: hidden;
      background: #f1e6dc;
      aspect-ratio: 16 / 10;
    }

    .imagen {
      width: 100%;
      display: block;
      height: 100%;
      object-fit: cover;
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
      padding: 18px;
    }

    .titulo-row {
      display: flex;
      justify-content: space-between;
      align-items: start;
      gap: 12px;
      margin-bottom: 10px;
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

    .descripcion {
      margin: 0 0 18px 0;
      color: #4f3d32;
      line-height: 1.65;
      font-size: 1rem;
    }

    .bloque-info {
      padding: 14px 0;
      border-top: 1px solid #efdfd0;
      animation: fadeSlideIn 0.35s ease;
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

    .bloque-destacado {
      background: #fff8f2;
      border-radius: 14px;
      padding: 14px;
      margin-top: 10px;
      border: 1px solid #f0dfcf;
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

    .loader {
      width: 18px;
      height: 18px;
      border: 3px solid rgba(122, 85, 56, 0.2);
      border-top-color: #7a5538;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @media (min-width: 768px) {
      .detalle-page {
        padding: 24px;
      }

      .contenido {
        padding: 22px;
      }

      h1 {
        font-size: 2.2rem;
      }
    }

    @keyframes fadePage {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes cardEntrance {
      from {
        opacity: 0;
        transform: translateY(14px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
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

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `]
})
export class DetalleCafeteriaComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cafeteriasService = inject(CafeteriasService);

  /*
    Signal que almacena la cafetería recuperada del backend.

    Se usa signal para que la interfaz reaccione automáticamente
    cuando llegue la respuesta.
  */
  cafeteria = signal<Cafeteria | null>(null);

  /*
    Estado local de carga para esta pantalla.
  */
  cargando = signal<boolean>(false);

  /*
    Estado local de error para esta pantalla.
  */
  error = signal<string>('');

  /*
    Cuando la página se carga, se obtiene el ID desde la URL
    y se consulta el backend para traer la cafetería correspondiente.
  */
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    /*
      Validación básica:
      si el parámetro no existe o no es numérico, se muestra un error.
    */
    if (!id || Number.isNaN(id)) {
      this.error.set('El identificador de la cafetería no es válido.');
      return;
    }

    this.cargarDetalle(id);
  }

  /*
    Este método consulta el backend para obtener los datos
    completos de la cafetería seleccionada.

    Aquí se actualizan los estados de:
    - carga
    - error
    - cafetería actual
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

    Esto forma parte de la navegación principal de la aplicación
    y refuerza la experiencia de interacción entre vistas.
  */
  regresar(): void {
    this.router.navigate(['/cafeterias']);
  }
}