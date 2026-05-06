import { Component, input, output } from '@angular/core';

/*
  ConnectionStatusComponent

  Este componente muestra y controla visualmente el estado de conexión
  del chat.

  Antes solo mostraba si el WebSocket estaba conectado o desconectado.
  Ahora también permite probar modo offline de forma correcta.

  Responsabilidades:
  - Mostrar si el cliente está conectado.
  - Mostrar si está desconectado.
  - Emitir evento para simular desconexión.
  - Emitir evento para reconectar.

  Importante:
  Este componente NO abre ni cierra WebSockets directamente.
  Solo emite eventos al componente padre.

  Flujo:
  ConnectionStatusComponent → ChatComponent → WebSocketService
*/

@Component({
  selector: 'app-connection-status',
  standalone: true,

  template: `
    <section class="status" [class.offline]="!conectado()">

      <div class="text">
        <strong>Estado:</strong>

        {{ conectado()
          ? 'Conectado en tiempo real'
          : 'Modo offline / desconectado' }}
      </div>

      <div class="actions">
        <button
          type="button"
          (click)="desconectar.emit()"
          [disabled]="!conectado()"
        >
          Simular desconexión
        </button>

        <button
          type="button"
          (click)="reconectar.emit()"
          [disabled]="conectado()"
        >
          Reconectar
        </button>
      </div>

    </section>
  `,

  styles: `
    .status {
      margin: 16px 0;
      padding: 14px;
      border-radius: 12px;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .offline {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fecaca;
    }

    .text {
      font-size: 15px;
    }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    button {
      padding: 8px 12px;
      border: none;
      border-radius: 8px;
      background: #111827;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
    }
  `
})
export class ConnectionStatusComponent {

  /*
    Estado de conexión recibido desde ChatComponent.

    true:
    WebSocket conectado.

    false:
    WebSocket desconectado.
  */
  conectado = input<boolean>(false);

  /*
    Evento para solicitar desconexión manual.

    Este evento lo recibe ChatComponent y lo pasa a WebSocketService.
  */
  desconectar = output<void>();

  /*
    Evento para solicitar reconexión manual.

    Este evento lo recibe ChatComponent y lo pasa a WebSocketService.
  */
  reconectar = output<void>();
}