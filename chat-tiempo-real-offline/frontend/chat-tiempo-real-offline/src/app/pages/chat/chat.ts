import { Component, OnDestroy, OnInit, inject } from '@angular/core';

import { AuthService } from '../../services/auth.service';
import { WebSocketService } from '../../services/websocket.service';

import { ChatHeaderComponent } from '../../components/chat-header/chat-header';
import { ConnectionStatusComponent } from '../../components/connection-status/connection-status';
import { MessageListComponent } from '../../components/message-list/message-list';
import { MessageInputComponent } from '../../components/message-input/message-input';

import { Mensaje } from '../../models/mensaje.model';

/*
  ChatComponent

  Página principal protegida del chat.

  Responsabilidades:
  - Obtener la sesión del usuario.
  - Conectar al WebSocket.
  - Mostrar estado de conexión.
  - Mostrar mensajes.
  - Enviar mensajes.
  - Simular desconexión por cliente.
  - Reconectar manualmente.
  - Cerrar sesión.

  Esta página coordina componentes y servicios, pero no contiene
  la lógica interna del WebSocket.
*/

@Component({
  selector: 'app-chat',
  standalone: true,

  imports: [
    ChatHeaderComponent,
    ConnectionStatusComponent,
    MessageListComponent,
    MessageInputComponent
  ],

  template: `
    <main class="page">

      <app-chat-header
        [usuario]="authService.usuarioActual()"
        (cerrarSesion)="cerrarSesion()"
      />

      <app-connection-status
        [conectado]="webSocketService.conectado()"
        (desconectar)="webSocketService.desconectarManual()"
        (reconectar)="webSocketService.reconectarManual()"
      />

      <app-message-list
        [mensajes]="webSocketService.mensajes()"
      />

      <app-message-input
        (enviarMensaje)="enviarMensaje($event)"
      />

    </main>
  `,

  styles: `
    .page {
      max-width: 920px;
      margin: 0 auto;
      padding: 28px;
      min-height: 100vh;
      background: #f4f6f8;
      font-family: Arial, sans-serif;
    }
  `
})
export class ChatComponent implements OnInit, OnDestroy {

  /*
    Servicio de autenticación.

    Se usa para:
    - obtener usuario actual;
    - obtener token;
    - cerrar sesión.
  */
  authService = inject(AuthService);

  /*
    Servicio WebSocket.

    Se usa para:
    - conectar al chat;
    - enviar mensajes;
    - mostrar historial;
    - simular desconexión;
    - reconectar.
  */
  webSocketService = inject(WebSocketService);

  /*
    Al iniciar la página, se obtiene el token guardado
    durante el login y se abre la conexión WebSocket.
  */
  ngOnInit(): void {
    const token = this.authService.obtenerToken();

    if (token) {
      this.webSocketService.conectar(token);
    }
  }

  /*
    Envía un nuevo mensaje.

    Este método recibe el texto emitido por MessageInputComponent.
  */
  enviarMensaje(texto: string): void {
    const usuario = this.authService.usuarioActual();

    if (!usuario) {
      return;
    }

    /*
      Se construye el mensaje con los datos del usuario actual.

      estado inicia como "enviado", pero si no hay conexión,
      WebSocketService lo cambiará a "pendiente".
    */
    const mensaje: Mensaje = {
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      texto,
      fecha: new Date().toLocaleString(),
      estado: 'enviado'
    };

    this.webSocketService.enviarMensaje(mensaje);
  }

  /*
    Cierra sesión.

    Primero desconecta el WebSocket y después elimina
    la sesión del usuario.
  */
  cerrarSesion(): void {
    this.webSocketService.desconectar();
    this.authService.logout();
  }

  /*
    Al destruir la página se cierra el WebSocket.

    Esto evita dejar conexiones abiertas si el usuario abandona
    la vista del chat.
  */
  ngOnDestroy(): void {
    this.webSocketService.desconectar();
  }
}