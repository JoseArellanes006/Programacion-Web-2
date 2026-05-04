import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

/*
  MessageInputComponent

  Responsabilidad:
  - Capturar el texto que el usuario escribe.
  - Validarlo mínimamente.
  - Emitir el mensaje hacia un componente superior (ChatComponent).

  Este componente NO se comunica directamente con WebSocket
  ni con el backend. Solo maneja entrada de datos.
*/

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="input-box">

      <!-- Input de texto controlado mediante signal -->
      <input
        type="text"
        [ngModel]="texto()"
        (ngModelChange)="texto.set($event)"
        placeholder="Escribe un mensaje..."
        (keyup.enter)="enviar()"
      />

      <!-- Botón para enviar mensaje manualmente -->
      <button (click)="enviar()">
        Enviar
      </button>

    </section>
  `,
  styles: `
    .input-box {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    input {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: 1px solid #9ca3af;
      font-size: 16px;
    }

    button {
      padding: 14px 18px;
      border: none;
      border-radius: 12px;
      background: #1d4ed8;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
  `
})
export class MessageInputComponent {

  /*
    Signal que mantiene el estado del input.

    Representa el texto actual que el usuario está escribiendo.
  */
  texto = signal('');

  /*
    Evento de salida hacia el componente padre.

    Se emite cuando el usuario envía un mensaje válido.
  */
  enviarMensaje = output<string>();


  /*
    Lógica de envío del mensaje.

    Flujo:
    1. Obtiene el texto actual
    2. Elimina espacios innecesarios
    3. Valida que no esté vacío
    4. Emite el mensaje
    5. Limpia el input
  */
  enviar(): void {
    const valor = this.texto().trim();

    if (!valor) {
      return;
    }

    this.enviarMensaje.emit(valor);

    this.texto.set('');
  }
}