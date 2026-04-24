import { Component, inject } from '@angular/core';
import { CafeteriasService } from '../../services/cafeterias';

/*
  Este componente permite seleccionar una categoría para filtrar
  las cafeterías visibles en el catálogo.

  Desde la perspectiva de clase, muestra:
  - interacción táctil simple
  - retroalimentación de foco y presión
  - diseño funcional para pantallas móviles
*/
@Component({
  selector: 'app-filtro-categoria',
  standalone: true,
  template: `
    <div class="campo-filtro">
      <label for="categoria" class="label">Categoría</label>

      <select
        id="categoria"
        class="select"
        [value]="service.categoriaSeleccionada()"
        (change)="onFiltrar($event)"
      >
        <option value="">Todas</option>
        <option value="artesanal">Artesanal</option>
        <option value="tematica">Temática</option>
        <option value="coworking">Coworking</option>
        <option value="especialidad">Especialidad</option>
        <option value="postres">Postres</option>
      </select>
    </div>
  `,
  styles: [`
    .campo-filtro {
      display: flex;
      flex-direction: column;
      gap: 6px;
      animation: fadeSlideIn 0.35s ease;
    }

    .label {
      font-size: 0.92rem;
      font-weight: 600;
      color: #4a3528;
    }

    .select {
      width: 100%;
      min-height: 50px;
      border: 1px solid #d8c3b3;
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 1rem;
      background: #fff;
      color: #2f1f14;
      box-sizing: border-box;
      transition:
        border-color 0.25s ease,
        box-shadow 0.25s ease,
        transform 0.2s ease,
        background-color 0.25s ease;
    }

    .select:focus {
      outline: none;
      border-color: #9e6f4c;
      box-shadow: 0 0 0 4px rgba(158, 111, 76, 0.15);
      background-color: #fffdfb;
    }

    .select:active {
      transform: scale(0.995);
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
  `]
})
export class FiltroCategoriaComponent {
  service = inject(CafeteriasService);

  /*
    Actualiza la categoría seleccionada en el servicio.
    Al hacerlo, la lista se recalcula automáticamente.
  */
  onFiltrar(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.service.actualizarCategoria(select.value);
  }
}