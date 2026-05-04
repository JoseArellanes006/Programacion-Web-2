import { Injectable, inject, signal } from '@angular/core';
import { Mensaje } from '../models/mensaje.model';
import { LocalStorageService } from './local-storage.service';
import { OfflineQueueService } from './offline-queue.service';

/*
  WebSocketService

  Este servicio administra toda la comunicación en tiempo real del chat.

  Problema que resuelve:
  - Evita que los componentes trabajen directamente con WebSocket.
  - Centraliza la conexión con el backend.
  - Mantiene el estado de conexión.
  - Guarda mensajes recibidos y enviados.
  - Maneja mensajes pendientes cuando no hay conexión.

  Responsabilidades principales:
  - Abrir la conexión WebSocket.
  - Escuchar mensajes entrantes.
  - Enviar mensajes al servidor.
  - Detectar desconexiones.
  - Guardar historial local.
  - Reenviar mensajes pendientes al reconectar.

  Importante:
  WebSocket permite comunicación bidireccional en tiempo real.
  Esto significa que el cliente puede enviar mensajes al servidor
  y el servidor también puede enviar mensajes al cliente sin que
  el navegador tenga que hacer peticiones HTTP repetidas.
*/

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  /*
    Servicio encargado de guardar y recuperar mensajes desde LocalStorage.

    Se usa para mantener historial local aunque se recargue la página.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    Servicio encargado de administrar la cola de mensajes pendientes.

    Se usa cuando el usuario intenta enviar mensajes sin conexión.
  */
  private offlineQueueService = inject(OfflineQueueService);

  /*
    Referencia interna al WebSocket activo.

    Puede ser:
    - null: no hay conexión creada.
    - WebSocket: existe una conexión creada con el servidor.
  */
  private socket: WebSocket | null = null;

  /*
    URL del endpoint WebSocket del backend FastAPI.

    ws:// indica WebSocket sin cifrado.
    En producción normalmente se usaría wss://.
  */
  private readonly wsUrl = 'ws://127.0.0.1:8000/ws/chat';

  /*
    Signal que indica el estado actual de la conexión.

    true  → conexión WebSocket activa.
    false → desconectado o en modo offline.

    Este valor se usa en la interfaz para mostrar si el usuario
    está conectado en tiempo real o no.
  */
  conectado = signal(false);

  /*
    Signal que almacena el historial de mensajes del chat.

    Se inicializa con los mensajes guardados previamente en LocalStorage.
    Esto permite recuperar el historial al recargar la página.
  */
  mensajes = signal<Mensaje[]>(
    this.localStorageService.obtenerMensajes()
  );

  /*
    Abre la conexión WebSocket con el backend.

    Parámetro:
    - token: identifica la sesión del usuario autenticado.

    Proceso:
    1. Verifica si ya existe una conexión abierta.
    2. Si no existe, crea una nueva conexión WebSocket.
    3. Registra los eventos principales:
       - onopen: conexión abierta.
       - onmessage: mensaje recibido.
       - onclose: conexión cerrada.
       - onerror: error de conexión.
  */
  conectar(token: string): void {
    /*
      Si ya existe una conexión abierta, no se crea otra.

      Esto evita duplicar conexiones WebSocket y recibir mensajes repetidos.
    */
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    /*
      Se crea la conexión WebSocket.

      El token se envía como query parameter para que el backend
      pueda identificar o validar al usuario.
    */
    this.socket = new WebSocket(`${this.wsUrl}?token=${token}`);

    /*
      Evento onopen.

      Se ejecuta cuando la conexión WebSocket se abre correctamente.

      Acciones:
      - marca la aplicación como conectada;
      - intenta reenviar mensajes que quedaron pendientes.
    */
    this.socket.onopen = () => {
      this.conectado.set(true);
      this.reenviarPendientes();
    };

    /*
      Evento onmessage.

      Se ejecuta cada vez que el servidor envía un mensaje al cliente.

      Proceso:
      1. Recibe el mensaje como texto JSON.
      2. Convierte el JSON a objeto Mensaje.
      3. Lo agrega al historial local.
    */
    this.socket.onmessage = (event) => {
      const mensaje = JSON.parse(event.data) as Mensaje;
      this.agregarMensajeLocal(mensaje);
    };

    /*
      Evento onclose.

      Se ejecuta cuando la conexión se cierra.

      Esto puede ocurrir porque:
      - el usuario cerró sesión;
      - el servidor se apagó;
      - se perdió la conexión;
      - el navegador cerró el WebSocket.

      En cualquier caso, se actualiza el estado a desconectado.
    */
    this.socket.onclose = () => {
      this.conectado.set(false);
    };

    /*
      Evento onerror.

      Se ejecuta cuando ocurre un error en la conexión WebSocket.

      No siempre entrega detalles claros del error, pero permite
      marcar el sistema como desconectado.
    */
    this.socket.onerror = () => {
      this.conectado.set(false);
    };
  }

  /*
    Envía un mensaje al servidor mediante WebSocket.

    Proceso:
    1. Verifica si la conexión está abierta.
    2. Si está abierta, envía el mensaje al servidor.
    3. Si no está abierta, guarda el mensaje como pendiente.

    Esto permite que la aplicación no pierda mensajes cuando
    el usuario está sin conexión.
  */
  enviarMensaje(mensaje: Mensaje): void {
    /*
      Caso 1: conexión activa.

      Si el WebSocket está abierto, el mensaje se convierte a JSON
      y se envía directamente al servidor.
    */
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(mensaje));
      return;
    }

    /*
      Caso 2: conexión no disponible.

      Se crea una copia del mensaje con estado "pendiente".
      Esto indica que el mensaje aún no fue enviado al servidor.
    */
    const mensajePendiente: Mensaje = {
      ...mensaje,
      estado: 'pendiente'
    };

    /*
      El mensaje pendiente se guarda en la cola offline.

      Esta cola se conserva en LocalStorage y se reenvía
      cuando la conexión vuelve.
    */
    this.offlineQueueService.agregarPendiente(mensajePendiente);

    /*
      También se agrega al historial local para que el usuario
      vea inmediatamente el mensaje en pantalla, aunque esté pendiente.
    */
    this.agregarMensajeLocal(mensajePendiente);
  }

  /*
    Cierra la conexión WebSocket activa.

    Se usa principalmente cuando el usuario cierra sesión
    o cuando se destruye la página del chat.
  */
  desconectar(): void {
    /*
      Si existe una conexión, se cierra explícitamente.
    */
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    /*
      Se actualiza el estado visual de conexión.
    */
    this.conectado.set(false);
  }

  /*
    Agrega un mensaje al historial local.

    Este método es privado porque solo debe ser usado dentro
    del servicio.

    Proceso:
    1. Verifica si el mensaje ya existe.
    2. Si no existe, lo agrega a la lista.
    3. Actualiza el signal.
    4. Guarda el historial en LocalStorage.

    La verificación por id evita mensajes duplicados.
  */
  private agregarMensajeLocal(mensaje: Mensaje): void {
    /*
      Se revisa si el mensaje ya existe en el historial.

      Esto puede pasar cuando:
      - el usuario manda un mensaje;
      - el servidor lo reenvía;
      - se recuperan mensajes desde almacenamiento local.
    */
    const existe = this.mensajes().some(item => item.id === mensaje.id);

    /*
      Si ya existe, no se agrega nuevamente.
    */
    if (existe) {
      return;
    }

    /*
      Se crea una nueva lista agregando el mensaje al final.

      No se usa push directamente porque con signals es mejor
      crear una nueva referencia para que Angular detecte el cambio.
    */
    const nuevaLista = [...this.mensajes(), mensaje];

    /*
      Se actualiza el signal con la nueva lista.
    */
    this.mensajes.set(nuevaLista);

    /*
      Se persiste el historial en LocalStorage.
    */
    this.localStorageService.guardarMensajes(nuevaLista);
  }

  /*
    Reenvía los mensajes pendientes cuando la conexión vuelve.

    Este método se ejecuta automáticamente dentro de onopen,
    es decir, cuando el WebSocket se conecta correctamente.

    Proceso:
    1. Obtiene mensajes pendientes desde OfflineQueueService.
    2. Si no hay pendientes, termina.
    3. Si hay pendientes, los cambia a estado "enviado".
    4. Los manda al servidor mediante WebSocket.
    5. Limpia la cola de pendientes.
  */
  private reenviarPendientes(): void {
    /*
      Se recuperan los mensajes que quedaron guardados
      mientras no había conexión.
    */
    const pendientes = this.offlineQueueService.obtenerPendientes();

    /*
      Si no hay mensajes pendientes, no se hace nada.
    */
    if (pendientes.length === 0) {
      return;
    }

    /*
      Se recorre cada mensaje pendiente para reenviarlo.
    */
    pendientes.forEach((mensaje) => {
      /*
        Se cambia el estado a "enviado" antes de mandarlo.

        Esto indica que ya se está enviando al servidor.
      */
      const mensajeEnviado: Mensaje = {
        ...mensaje,
        estado: 'enviado'
      };

      /*
        Se envía el mensaje al backend usando la conexión actual.
      */
      this.socket?.send(JSON.stringify(mensajeEnviado));
    });

    /*
      Una vez reenviados, se limpia la cola local de pendientes.

      Esto evita reenviar los mismos mensajes varias veces.
    */
    this.offlineQueueService.limpiarPendientes();
  }
}