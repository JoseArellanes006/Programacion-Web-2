import { Injectable, inject, signal } from '@angular/core';
import { Mensaje } from '../models/mensaje.model';
import { LocalStorageService } from './local-storage.service';

/*
  OfflineQueueService

  Este servicio implementa una cola de mensajes en modo offline.

  Problema que resuelve:
  En aplicaciones en tiempo real, como un chat con WebSockets,
  puede ocurrir que el usuario pierda conexión temporalmente.

  En ese caso:
  - el mensaje no puede enviarse al servidor;
  - no debe perderse;
  - debe almacenarse localmente;
  - debe reenviarse cuando vuelva la conexión.

  Este servicio se encarga exclusivamente de administrar esa cola.

  Responsabilidades:
  - Mantener una lista reactiva de mensajes pendientes.
  - Guardar esa lista en LocalStorage.
  - Recuperar mensajes pendientes al recargar la página.
  - Limpiar la cola cuando los mensajes ya fueron reenviados.

  Importante:
  Este servicio NO abre WebSockets.
  Este servicio NO envía mensajes al backend.
  Solo administra los mensajes pendientes.
*/

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {

  /*
    Servicio encargado de leer y escribir datos en LocalStorage.

    Se usa para que la cola de pendientes no se pierda si:
    - el usuario recarga la página;
    - el navegador se cierra;
    - la conexión se pierde temporalmente.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    Signal que almacena los mensajes pendientes.

    Inicialización:
    Al cargar el servicio, se recuperan los mensajes pendientes
    previamente guardados en LocalStorage.

    Esto permite continuar el reenvío aunque la página se haya recargado.
  */
  pendientes = signal<Mensaje[]>(
    this.localStorageService.obtenerPendientes()
  );

  /*
    Agrega un mensaje a la cola de pendientes.

    Flujo:
    1. Recibe un mensaje que no pudo enviarse.
    2. Lo agrega al FINAL de la cola.
    3. Actualiza la signal.
    4. Guarda la cola actualizada en LocalStorage.

    Decisión importante:
    Se agrega al final usando:

      [...this.pendientes(), mensaje]

    Esto mantiene el orden real de envío.

    Ejemplo:
    Si el usuario escribió:
    1. Hola
    2. ¿Cómo estás?
    3. Nos vemos

    Se reenviarán en ese mismo orden.

    Antes, si se usaba:

      [mensaje, ...this.pendientes()]

    la cola quedaba invertida y se reenviaba primero el último mensaje.
  */
  agregarPendiente(mensaje: Mensaje): void {
    const nuevaLista = [...this.pendientes(), mensaje];

    this.pendientes.set(nuevaLista);
    this.localStorageService.guardarPendientes(nuevaLista);
  }

  /*
    Devuelve los mensajes pendientes actuales.

    Uso:
    WebSocketService llama este método cuando recupera conexión
    para saber qué mensajes debe reenviar.

    Se devuelve el valor actual de la signal, no la signal completa.
  */
  obtenerPendientes(): Mensaje[] {
    return this.pendientes();
  }

  /*
    Limpia la cola de mensajes pendientes.

    Flujo:
    1. Vacía la signal en memoria.
    2. Elimina la cola guardada en LocalStorage.

    Uso típico:
    Se ejecuta cuando WebSocketService ya reenvió todos los mensajes
    pendientes correctamente.
  */
  limpiarPendientes(): void {
    this.pendientes.set([]);
    this.localStorageService.limpiarPendientes();
  }
}