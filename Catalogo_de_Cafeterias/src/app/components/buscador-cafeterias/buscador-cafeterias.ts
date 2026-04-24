import { Component, inject } from '@angular/core';
import { CafeteriasService } from '../../services/cafeterias';

/*
  Este componente representa el buscador principal del catálogo.

  Su propósito es permitir que el usuario escriba texto para filtrar
  cafeterías por nombre, ubicación o descripción.

  Desde el punto de vista didáctico, aquí se refuerzan varios conceptos:

  1. Interacción móvil:
     El usuario toca el campo, escribe y recibe respuesta inmediata.

  2. Retroalimentación visual:
     El input cambia visualmente cuando recibe foco o cuando se presiona.

  3. UX móvil:
     El campo ocupa todo el ancho disponible, tiene buen padding y
     una altura cómoda para uso táctil.

  4. Transiciones:
     Se usan transiciones suaves en borde, sombra y escala para dar
     sensación de respuesta fluida.
*/
@Component({
  selector: 'app-buscador-cafeterias',
  standalone: true,
  template: `
    <div class="campo-busqueda">
      <label for="busqueda" class="label">Buscar cafetería</label>

      <input
        id="busqueda"
        type="text"
        class="input"
        placeholder="Ej. Centro, artesanal, café de especialidad..."
        [value]="service.textoBusqueda()"
        (input)="onBuscar($event)"
      />
    </div>
  `,
  styles: [`
    .campo-busqueda {
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

    .input {
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

    .input:focus {
      outline: none;
      border-color: #9e6f4c;
      box-shadow: 0 0 0 4px rgba(158, 111, 76, 0.15);
      background-color: #fffdfb;
    }

    .input:active {
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
export class BuscadorCafeteriasComponent {
  service = inject(CafeteriasService);

  /*
    Este método captura el valor escrito por el usuario y lo envía al servicio.

    La ventaja de hacerlo así es que:
    - el componente solo se encarga de la entrada visual
    - la lógica de filtrado vive centralizada en el servicio
    - la lista se actualiza en tiempo real gracias a signals/computed
  */
  onBuscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.service.actualizarBusqueda(input.value);
  }
}