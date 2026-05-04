import { Component, input } from '@angular/core';

/*
  ConnectionStatusComponent

  Propósito del componente:
  --------------------------
  Este componente tiene una responsabilidad muy específica:
  representar visualmente el estado de conexión del sistema de chat.

  Contexto dentro de la aplicación:
  ---------------------------------
  La aplicación utiliza WebSockets para comunicación en tiempo real.
  Sin embargo, esta conexión puede fallar o perderse.

  Por eso existen dos estados operativos:
  - ONLINE (WebSocket activo → mensajes en tiempo real)
  - OFFLINE (sin conexión → mensajes se almacenan localmente)

  Este componente:
  - NO gestiona la conexión.
  - NO abre ni cierra sockets.
  - SOLO refleja el estado que recibe desde un nivel superior (servicio o página).

  Esto respeta el principio de:
  → Separación de responsabilidades (UI vs lógica de red).
*/

@Component({
  selector: 'app-connection-status',
  standalone: true,

  template: `
    <!--
      Contenedor visual del estado de conexión.

      Se usa binding dinámico de clases:
      - Si NO está conectado → se aplica la clase "offline"
      - Si está conectado → mantiene el estilo por defecto
    -->
    <section class="status" [class.offline]="!conectado()">

      <!--
        Etiqueta descriptiva para el usuario.
      -->
      <strong>Estado:</strong>

      <!--
        Renderizado condicional del mensaje.

        Si conectado() === true:
          → "Conectado en tiempo real"

        Si conectado() === false:
          → "Modo offline / desconectado"
      -->
      {{ conectado()
          ? 'Conectado en tiempo real'
          : 'Modo offline / desconectado' }}
    </section>
  `,

  styles: `
    /*
      Estilo por defecto (estado ONLINE)

      Representa una conexión activa:
      - fondo verde suave → estado correcto
      - texto verde → señal positiva
    */
    .status {
      margin: 16px 0;
      padding: 14px;
      border-radius: 12px;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
    }

    /*
      Estilo alterno (estado OFFLINE)

      Se activa dinámicamente con:
      [class.offline]="!conectado()"

      Representa:
      - pérdida de conexión
      - uso de modo offline
      - almacenamiento temporal de mensajes

      Uso de colores:
      - rojo suave → advertencia
      - contraste visual claro para el usuario
    */
    .offline {
      background: #fee2e2;
      color: #991b1b;
      border-color: #fecaca;
    }
  `
})
export class ConnectionStatusComponent {

  /*
    Input reactivo: estado de conexión

    Características:
    ----------------
    - Es un signal de Angular (input())
    - Proviene del componente padre (ej. ChatComponent)
    - Representa el estado REAL del WebSocket

    Flujo de datos:
    ----------------
    WebSocketService → ChatComponent → ConnectionStatusComponent

    Valor esperado:
    - true  → conexión activa
    - false → desconectado / offline

    Importante:
    Este componente NO modifica este valor.
    Solo lo consume (flujo unidireccional).
  */
  conectado = input<boolean>(false);
}