import { Component, inject } from '@angular/core';
import { CafeteriasService } from '../../services/cafeterias';

/*
  Este componente captura el texto de búsqueda del usuario.
  No hace peticiones por su cuenta; solamente actualiza el estado
  del servicio para que la lista filtrada se recalcule automáticamente.
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
    }

    .label {
      font-size: 0.92rem;
      font-weight: 600;
      color: #4a3528;
    }

    .input {
      width: 100%;
      border: 1px solid #d8c3b3;
      border-radius: 14px;
      padding: 14px 16px;
      font-size: 1rem;
      background: #fff;
      color: #2f1f14;
      box-sizing: border-box;
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
    }

    .input:focus {
      outline: none;
      border-color: #9e6f4c;
      box-shadow: 0 0 0 4px rgba(158, 111, 76, 0.15);
    }

    .input:active {
      transform: scale(0.995);
    }
  `]
})
export class BuscadorCafeteriasComponent {
  service = inject(CafeteriasService);

  /*
    Captura el valor del input y lo envía al servicio.
    De esta forma la búsqueda se actualiza en tiempo real.
  */
  onBuscar(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.service.actualizarBusqueda(input.value);
  }
}