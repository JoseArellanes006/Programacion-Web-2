import { Component, input } from '@angular/core';
import { Mensaje } from '../../models/mensaje.model';

/*
  MessageListComponent

  Responsabilidad:
  Renderizar la lista de mensajes del chat de forma visual.

  Este componente es PRESENTACIONAL:
  - No modifica estado.
  - No hace llamadas a servicios.
  - No contiene lógica de negocio.

  Únicamente recibe datos (mensajes) y los representa en pantalla.

  Conceptos importantes que demuestra:
  - Uso de Angular Signals como entrada (input()).
  - Renderizado dinámico con @for.
  - Renderizado condicional con @if.
  - Diferenciación visual basada en estado (mensaje pendiente vs enviado).

  Contexto funcional:
  Los mensajes pueden tener distintos estados:
  - "enviado" → ya fue confirmado por el servidor (WebSocket).
  - "pendiente" → aún no se envía (modo offline o reconexión).

  Este componente refleja visualmente ese estado.
*/

@Component({
  selector: 'app-message-list',
  standalone: true,
  template: `
    <section class="messages">

      <!--
        Estado vacío:
        Se muestra cuando no hay mensajes en el sistema.

        Esto evita una interfaz "rota" o sin contexto para el usuario.
      -->
      @if (mensajes().length === 0) {
        <p class="empty">Todavía no hay mensajes.</p>
      }

      <!--
        Iteración de mensajes:

        @for es la sintaxis moderna de Angular para renderizar listas.

        track mensaje.id:
        - Mejora el rendimiento.
        - Evita recrear elementos innecesariamente.
        - Permite a Angular identificar cada mensaje de forma única.
      -->
      @for (mensaje of mensajes(); track mensaje.id) {

        <!--
          Cada mensaje se renderiza como un bloque independiente.

          class.pending:
          - Se aplica dinámicamente si el mensaje aún no se ha enviado.
          - Permite cambiar estilo visual según estado.
        -->
        <article
          class="message"
          [class.pending]="mensaje.estado === 'pendiente'"
          [class.sent]="mensaje.estado === 'enviado'"
        >

          <!--
            Metadatos del mensaje:
            - nombre del usuario que envió el mensaje
            - fecha/hora del mensaje

            Se separan visualmente del contenido.
          -->
          <div class="meta">
            <strong>{{ mensaje.usuarioNombre }}</strong>
            <span>{{ mensaje.fecha }}</span>
          </div>

          <!--
            Contenido principal del mensaje.
          -->
          <p>{{ mensaje.texto }}</p>

          <!--
            Indicador de estado pendiente:

            Solo aparece si el mensaje aún no ha sido enviado al servidor.

            Esto es clave para UX en aplicaciones con:
            - WebSockets
            - modo offline
            - reconexión automática
          -->
          @if (mensaje.estado === 'pendiente') {
            <small class="pending-text">Mensaje pendiente por enviar</small>
          }

          <!--
            Indicador de estado enviado:

            Aparece cuando el mensaje ya fue confirmado por el servidor.

            Es importante porque permite comprobar visualmente que un mensaje
            pendiente fue reenviado y aceptado por el backend.
          -->
          @if (mensaje.estado === 'enviado') {
            <small class="sent-text">Mensaje enviado</small>
          }

        </article>
      }
    </section>
  `,
  styles: `
    /*
      Contenedor principal de mensajes.

      Decisiones:
      - Altura mínima → asegura espacio visual.
      - Altura máxima + scroll → evita crecimiento infinito.
      - overflow-y → permite desplazamiento vertical.
    */
    .messages {
      min-height: 360px;
      max-height: 460px;
      overflow-y: auto;
      padding: 18px;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 18px;
    }

    /*
      Estado cuando no hay mensajes.

      Se centra visualmente para indicar claramente ausencia de datos.
    */
    .empty {
      color: #6b7280;
      text-align: center;
    }

    /*
      Estilo base de cada mensaje.

      Diseño tipo tarjeta para mejor legibilidad.
    */
    .message {
      padding: 14px;
      margin-bottom: 12px;
      background: #f9fafb;
      border-radius: 14px;
      border: 1px solid #e5e7eb;
    }

    /*
      Estilo especial para mensajes pendientes.

      Intención:
      - Diferenciar visualmente mensajes no enviados.
      - Advertir al usuario del estado.

      Color amarillo → asociado a advertencia (no error).
    */
    .pending {
      background: #fffbeb;
      border-color: #facc15;
    }

    /*
      Estilo especial para mensajes enviados.

      Mantiene un estilo neutro, pero permite diferenciar
      visualmente mensajes confirmados si después se quiere ampliar.
    */
    .sent {
      background: #f9fafb;
      border-color: #e5e7eb;
    }

    /*
      Contenedor de metadatos.

      Se usa flex para:
      - separar nombre y fecha
      - mantener alineación limpia
    */
    .meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      color: #374151;
      font-size: 14px;
    }

    /*
      Texto principal del mensaje.
    */
    p {
      margin: 8px 0 0;
      color: #111827;
    }

    /*
      Indicador de mensaje pendiente.

      Se destaca con:
      - color más oscuro
      - mayor peso tipográfico
    */
    .pending-text {
      display: block;
      margin-top: 8px;
      color: #92400e;
      font-weight: 700;
    }

    /*
      Indicador de mensaje enviado.

      Se usa verde para indicar confirmación correcta.
    */
    .sent-text {
      display: block;
      margin-top: 8px;
      color: #166534;
      font-weight: 700;
    }
  `
})
export class MessageListComponent {

  /*
    Input reactivo con Angular Signals.

    Características:
    - Recibe la lista de mensajes desde el componente padre (chat).
    - Es reactivo: cualquier cambio se refleja automáticamente en la vista.
    - No se modifica aquí (inmutabilidad del flujo de datos).

    Tipo:
    Arreglo de objetos Mensaje.
  */
  mensajes = input<Mensaje[]>([]);
}