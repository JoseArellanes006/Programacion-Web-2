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

  Esta es la página principal del chat.

  Es una ruta protegida, por lo tanto solo debe mostrarse cuando el usuario
  ya inició sesión correctamente.

  Responsabilidades principales:
  - obtener la sesión del usuario autenticado;
  - abrir la conexión WebSocket;
  - mostrar el estado de conexión;
  - mostrar los mensajes recibidos;
  - enviar nuevos mensajes;
  - cerrar sesión;
  - desconectar el WebSocket al salir de la página.

  Este componente no maneja directamente LocalStorage ni la lógica interna
  del WebSocket. Para eso utiliza servicios especializados:

  - AuthService:
    administra sesión, usuario actual y cierre de sesión.

  - WebSocketService:
    administra conexión en tiempo real, envío, recepción y almacenamiento
    local de mensajes.
*/

@Component({
  selector: 'app-chat',
  standalone: true,

  /*
    Componentes visuales usados por la página.

    Cada componente tiene una responsabilidad específica:
    - ChatHeaderComponent: muestra usuario y botón de salida.
    - ConnectionStatusComponent: muestra si el chat está conectado.
    - MessageListComponent: muestra el historial de mensajes.
    - MessageInputComponent: captura el texto a enviar.
  */
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
    AuthService se deja público porque el template necesita acceder
    al usuario actual mediante:

    authService.usuarioActual()

    Este servicio también se usa para cerrar sesión.
  */
  authService = inject(AuthService);

  /*
    WebSocketService se deja público porque el template necesita acceder a:

    webSocketService.conectado()
    webSocketService.mensajes()

    Además, esta página lo usa para:
    - conectar al chat;
    - enviar mensajes;
    - desconectarse.
  */
  webSocketService = inject(WebSocketService);

  /*
    ngOnInit se ejecuta automáticamente cuando Angular crea esta página.

    En este punto ya se supone que el usuario está autenticado,
    porque la ruta /chat está protegida por AuthGuard.

    Flujo:
    1. Se obtiene el token guardado en la sesión.
    2. Si existe token, se abre la conexión WebSocket.
    3. El token se envía al backend para identificar o validar al usuario.
  */
  ngOnInit(): void {
    const token = this.authService.obtenerToken();

    if (token) {
      this.webSocketService.conectar(token);
    }
  }

  /*
    Envía un mensaje escrito por el usuario.

    Este método se ejecuta cuando MessageInputComponent emite
    el evento enviarMensaje.

    Flujo:
    1. Se obtiene el usuario autenticado.
    2. Si no hay usuario, se cancela el proceso.
    3. Se construye un objeto Mensaje.
    4. Se envía al WebSocketService.
  */
  enviarMensaje(texto: string): void {
    /*
      Se obtiene el usuario actual desde AuthService.

      Esto permite asociar el mensaje con:
      - id del usuario;
      - nombre del usuario.
    */
    const usuario = this.authService.usuarioActual();

    /*
      Validación de seguridad.

      Si por algún motivo no existe usuario autenticado,
      no se debe crear ni enviar el mensaje.
    */
    if (!usuario) {
      return;
    }

    /*
      Construcción del mensaje.

      id:
      Se genera en el frontend con crypto.randomUUID()
      para identificar el mensaje de forma única.

      usuarioId y usuarioNombre:
      Permiten saber quién envió el mensaje.

      texto:
      Es el contenido capturado desde el input.

      fecha:
      Se genera en el momento del envío.

      estado:
      Inicia como "enviado". Si el WebSocket no está disponible,
      WebSocketService puede convertirlo en "pendiente".
    */
    const mensaje: Mensaje = {
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      usuarioNombre: usuario.nombre,
      texto,
      fecha: new Date().toLocaleString(),
      estado: 'enviado'
    };

    /*
      Se delega el envío al WebSocketService.

      El componente no decide si el mensaje se manda al servidor
      o se guarda como pendiente. Esa responsabilidad pertenece
      al servicio.
    */
    this.webSocketService.enviarMensaje(mensaje);
  }

  /*
    Cierra la sesión del usuario.

    Flujo:
    1. Se cierra la conexión WebSocket.
    2. Se elimina la sesión desde AuthService.
    3. AuthService redirige al usuario a /login.
  */
  cerrarSesion(): void {
    this.webSocketService.desconectar();
    this.authService.logout();
  }

  /*
    ngOnDestroy se ejecuta cuando el usuario abandona esta página
    o Angular destruye el componente.

    Es importante cerrar la conexión WebSocket para evitar:
    - conexiones abiertas innecesarias;
    - consumo de recursos;
    - mensajes duplicados;
    - comportamiento inesperado al volver a entrar al chat.
  */
  ngOnDestroy(): void {
    this.webSocketService.desconectar();
  }
}