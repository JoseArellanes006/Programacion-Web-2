import { Component, OnInit, inject } from '@angular/core';
import { BuscadorCafeteriasComponent } from '../../components/buscador-cafeterias/buscador-cafeterias';
import { CafeteriasListComponent } from '../../components/cafeterias-list/cafeterias-list';
import { FiltroCategoriaComponent } from '../../components/filtro-categoria/filtro-categoria';
import { CafeteriasService } from '../../services/cafeterias';

/*
  Esta es la página principal del catálogo.
  Su responsabilidad es:
  - cargar los datos al iniciar
  - mostrar encabezado
  - integrar buscador, filtro y lista
*/
@Component({
  selector: 'app-cafeterias',
  standalone: true,
  imports: [
    BuscadorCafeteriasComponent,
    FiltroCategoriaComponent,
    CafeteriasListComponent
  ],
  template: `
    <section class="catalogo-page">
      <header class="hero">
        <p class="eyebrow">Catálogo móvil</p>
        <h1>Explora cafeterías</h1>
        <p class="hero-text">
          Encuentra cafeterías por nombre, ubicación o categoría en una interfaz
          pensada para dispositivos móviles.
        </p>
      </header>

      <div class="controles">
        <app-buscador-cafeterias />
        <app-filtro-categoria />
      </div>

      <app-cafeterias-list />
    </section>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100dvh;
      background: linear-gradient(180deg, #f6f1eb 0%, #fffaf5 100%);
    }

    .catalogo-page {
      width: min(100%, 720px);
      margin: 0 auto;
      padding: 16px;
      box-sizing: border-box;
    }

    .hero {
      padding: 12px 4px 20px 4px;
    }

    .eyebrow {
      margin: 0 0 6px 0;
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #8b5e3c;
      font-weight: 700;
    }

    h1 {
      margin: 0 0 10px 0;
      font-size: 2rem;
      line-height: 1.1;
      color: #2f1f14;
    }

    .hero-text {
      margin: 0;
      color: #5f4b3e;
      line-height: 1.5;
      font-size: 0.98rem;
    }

    .controles {
      display: grid;
      gap: 12px;
      margin-bottom: 18px;
    }

    @media (min-width: 768px) {
      .catalogo-page {
        padding: 24px;
      }

      h1 {
        font-size: 2.4rem;
      }

      .controles {
        grid-template-columns: 1fr 220px;
        align-items: end;
      }
    }
  `]
})
export class CafeteriasComponent implements OnInit {
  private cafeteriasService = inject(CafeteriasService);

  /*
    Al entrar a la página, se realiza la carga inicial de cafeterías.
  */
  ngOnInit(): void {
    this.cafeteriasService.obtenerCafeterias();
  }
}