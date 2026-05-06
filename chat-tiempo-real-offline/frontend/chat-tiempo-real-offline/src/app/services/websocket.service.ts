import { Injectable, inject, signal } from '@angular/core';
import { Mensaje } from '../models/mensaje.model';
import { LocalStorageService } from './local-storage.service';
import { OfflineQueueService } from './offline-queue.service';

/*
  WebSocketService

  Este servicio administra toda la comunicación en tiempo real del chat.

  Responsabilidades principales:
  - Abrir conexión WebSocket con el backend.
  - Mantener el estado de conexión.
  - Enviar mensajes al servidor.
  - Recibir mensajes enviados por el servidor.
  - Guardar historial local.
  - Guardar mensajes pendientes cuando no hay conexión.
  - Reenviar mensajes pendientes al reconectar.
  - Permitir simular desconexión por cliente.

  Punto importante:
  Apagar el backend desconecta a TODOS los usuarios.
  Por eso, para pruebas didácticas de modo offline, este servicio incluye
  desconexión manual por cliente.

  Así se puede probar:
  - alumno desconectado;
  - alumno2 conectado;
  - mensajes pendientes solo en alumno;
  - reconexión posterior solo de alumno.
*/

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  /*
    Servicio para guardar historial de mensajes en LocalStorage.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    Servicio para administrar mensajes pendientes en modo offline.
  */
  private offlineQueueService = inject(OfflineQueueService);

  /*
    Referencia interna al WebSocket activo.

    Puede ser:
    - null: no hay conexión creada;
    - WebSocket: existe una conexión creada.
  */
  private socket: WebSocket | null = null;

  /*
    Último token usado para conectar.

    Se guarda para poder reconectar manualmente sin pedir otra vez
    las credenciales del usuario.
  */
  private ultimoToken: string | null = null;

  /*
    URL del endpoint WebSocket en FastAPI.

    Debe coincidir con el backend:
    ws://127.0.0.1:8000/ws/chat
  */
  private readonly wsUrl = 'ws://127.0.0.1:8000/ws/chat';

  /*
    Signal que indica si el WebSocket está conectado.

    true:
    El cliente está conectado al backend y recibe mensajes en tiempo real.

    false:
    El cliente está desconectado o en modo offline.
  */
  conectado = signal(false);

  /*
    Signal que indica si el usuario activó una desconexión manual.

    Esto sirve para simular modo offline solo en ese cliente,
    sin apagar el backend y sin afectar a otros usuarios.
  */
  modoOfflineManual = signal(false);

  /*
    Signal con el historial de mensajes.

    Se inicializa con lo guardado en LocalStorage para conservar
    mensajes después de recargar la página.
  */
  mensajes = signal<Mensaje[]>(
    this.localStorageService.obtenerMensajes()
  );

  /*
    Abre la conexión WebSocket con el backend.

    Parámetro:
    token:
    Token generado durante el login. Se envía al backend para validar
    la conexión.

    Flujo:
    1. Guarda el token para futuras reconexiones.
    2. Desactiva el modo offline manual.
    3. Evita abrir conexiones duplicadas.
    4. Crea el WebSocket.
    5. Configura los eventos principales.
  */
  conectar(token: string): void {
    /*
      Se conserva el token para poder reconectar después.
    */
    this.ultimoToken = token;

    /*
      Si el usuario pidió reconectar, se desactiva el modo offline manual.
    */
    this.modoOfflineManual.set(false);

    /*
      Evita crear otra conexión si ya hay una conexión abierta.

      Esto previene:
      - mensajes duplicados;
      - múltiples conexiones del mismo cliente;
      - consumo innecesario de recursos.
    */
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    /*
      Se crea la conexión WebSocket.

      El token se manda como query parameter:
      /ws/chat?token=...
    */
    this.socket = new WebSocket(`${this.wsUrl}?token=${token}`);

    /*
      onopen

      Se ejecuta cuando el WebSocket se conecta correctamente.

      Acciones:
      - marca el cliente como conectado;
      - intenta reenviar mensajes pendientes.
    */
    this.socket.onopen = () => {
      this.conectado.set(true);
      this.reenviarPendientes();
    };

    /*
      onmessage

      Se ejecuta cuando el backend envía un mensaje.

      El backend envía texto en formato JSON.
      Aquí se convierte a objeto Mensaje y se agrega al historial local.
    */
    this.socket.onmessage = (event) => {
      const mensaje = JSON.parse(event.data) as Mensaje;
      this.agregarMensajeLocal(mensaje);
    };

    /*
      onclose

      Se ejecuta cuando la conexión se cierra.

      Puede ocurrir por:
      - cierre manual;
      - pérdida de conexión;
      - apagado del backend;
      - cierre de sesión.

      Aquí solo se marca como desconectado.
    */
    this.socket.onclose = () => {
      this.conectado.set(false);
    };

    /*
      onerror

      Se ejecuta si ocurre un error en la conexión.

      WebSocket no siempre entrega detalles específicos del error,
      pero sí permite actualizar el estado visual.
    */
    this.socket.onerror = () => {
      this.conectado.set(false);
    };
  }

  /*
    Envía un mensaje.

    Flujo:
    1. Si el modo offline manual está activo, guarda el mensaje como pendiente.
    2. Si el WebSocket está abierto, envía el mensaje al backend.
    3. Si el WebSocket no está abierto, guarda el mensaje como pendiente.

    Esto permite que el usuario pueda seguir escribiendo aunque
    esté desconectado.
  */
  enviarMensaje(mensaje: Mensaje): void {

    /*
      Caso 1:
      El usuario activó modo offline manual desde la interfaz.

      En este caso NO se intenta enviar al backend aunque el backend exista.
      Esto permite probar offline solo en un cliente.
    */
    if (this.modoOfflineManual()) {
      const mensajePendiente: Mensaje = {
        ...mensaje,
        estado: 'pendiente'
      };

      this.offlineQueueService.agregarPendiente(mensajePendiente);
      this.agregarMensajeLocal(mensajePendiente);
      return;
    }

    /*
      Caso 2:
      WebSocket conectado.

      El mensaje se manda al backend.
      El backend lo reenviará a todos los clientes conectados.
    */
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(mensaje));
      return;
    }

    /*
      Caso 3:
      No hay conexión disponible.

      El mensaje se guarda como pendiente.
    */
    const mensajePendiente: Mensaje = {
      ...mensaje,
      estado: 'pendiente'
    };

    this.offlineQueueService.agregarPendiente(mensajePendiente);
    this.agregarMensajeLocal(mensajePendiente);
  }

  /*
    Cierra la conexión WebSocket.

    Este método se usa para:
    - logout;
    - salida de la página;
    - desconexión manual;
    - limpieza de recursos.
  */
  desconectar(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.conectado.set(false);
  }

  /*
    Desconexión manual para pruebas offline.

    Este método simula que SOLO este cliente perdió conexión.

    No apaga el backend.
    No afecta a otros usuarios.
    No afecta otros navegadores o pestañas.

    Después de ejecutar esto:
    - los mensajes enviados por este cliente quedan como pendientes;
    - otros usuarios pueden seguir conectados normalmente.
  */
  desconectarManual(): void {
    this.modoOfflineManual.set(true);
    this.desconectar();
  }

  /*
    Reconexión manual.

    Usa el último token guardado para abrir otra vez el WebSocket.

    Al reconectar:
    - se desactiva el modo offline manual;
    - se abre el WebSocket;
    - al ejecutarse onopen, se reenvían los pendientes.
  */
  reconectarManual(): void {
    if (!this.ultimoToken) {
      return;
    }

    this.conectar(this.ultimoToken);
  }

  /*
    Agrega un mensaje al historial local.

    Proceso:
    1. Verifica si el mensaje ya existe.
    2. Si no existe, lo agrega al final de la lista.
    3. Si ya existe, actualiza sus datos.
    4. Actualiza la signal.
    5. Guarda el historial en LocalStorage.

    La verificación por id evita duplicados cuando:
    - el mensaje se muestra localmente;
    - luego vuelve desde el backend por broadcast.

    Corrección importante:
    Si un mensaje estaba como "pendiente" y después vuelve desde el backend
    como "enviado", no debe ignorarse. Debe actualizarse.
  */
  private agregarMensajeLocal(mensaje: Mensaje): void {
    const mensajesActuales = this.mensajes();

    const existe = mensajesActuales.some(item => item.id === mensaje.id);

    let nuevaLista: Mensaje[];

    if (existe) {
      nuevaLista = mensajesActuales.map(item =>
        item.id === mensaje.id
          ? {
              ...item,
              ...mensaje,
              estado: mensaje.estado
            }
          : item
      );
    } else {
      nuevaLista = [...mensajesActuales, mensaje];
    }

    this.mensajes.set(nuevaLista);
    this.localStorageService.guardarMensajes(nuevaLista);
  }

  /*
    Reenvía mensajes pendientes cuando la conexión vuelve.

    Este método se ejecuta automáticamente en onopen.

    Flujo:
    1. Obtiene la cola de pendientes.
    2. Si está vacía, termina.
    3. Recorre los mensajes en orden.
    4. Cambia estado a "enviado".
    5. Envía cada mensaje al backend.
    6. Limpia la cola de pendientes.

    Importante:
    El orden depende de cómo se guardan los pendientes.
    Por eso OfflineQueueService ahora agrega al final.
  */
  private reenviarPendientes(): void {
    const pendientes = this.offlineQueueService.obtenerPendientes();

    if (pendientes.length === 0) {
      return;
    }

    pendientes.forEach((mensaje) => {
      const mensajeEnviado: Mensaje = {
        ...mensaje,
        estado: 'enviado'
      };

      this.socket?.send(JSON.stringify(mensajeEnviado));
    });

    this.offlineQueueService.limpiarPendientes();
  }
}