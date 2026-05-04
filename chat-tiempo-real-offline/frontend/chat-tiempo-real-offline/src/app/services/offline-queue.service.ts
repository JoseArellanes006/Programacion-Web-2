import { Injectable, inject, signal } from '@angular/core';
import { Mensaje } from '../models/mensaje.model';
import { LocalStorageService } from './local-storage.service';

/*
  OfflineQueueService

  Este servicio implementa una cola de mensajes en modo offline.

  Problema que resuelve:
  En aplicaciones en tiempo real (como chat con WebSockets),
  si el usuario pierde conexión:
  - los mensajes no pueden enviarse al servidor;
  - existe riesgo de pérdida de información.

  Solución:
  - Se guarda cada mensaje no enviado en una cola local.
  - Esta cola se persiste en LocalStorage.
  - Cuando la conexión se restablece, los mensajes pueden reenviarse.

  Patrón aplicado:
  "Offline-first" o "queue-based retry".

  Responsabilidades:
  - Mantener una lista reactiva de mensajes pendientes.
  - Sincronizar esa lista con LocalStorage.
  - Proveer acceso controlado a la cola.
*/

@Injectable({
  providedIn: 'root'
})
export class OfflineQueueService {

  /*
    Servicio encargado de persistencia en navegador.

    Se utiliza para:
    - guardar la cola en LocalStorage;
    - restaurar la cola al recargar la aplicación.
  */
  private localStorageService = inject(LocalStorageService);


  /*
    Signal reactivo que contiene la cola de mensajes pendientes.

    Inicialización:
    - Se carga desde LocalStorage al iniciar el servicio.
    - Esto permite que los mensajes pendientes sobrevivan
      a recargas de página.

    Ventaja:
    - Cualquier componente que dependa de esta signal se actualiza automáticamente.
  */
  pendientes = signal<Mensaje[]>(
    this.localStorageService.obtenerPendientes()
  );


  /*
    Agrega un nuevo mensaje a la cola de pendientes.

    Flujo:
    1. Se recibe un mensaje que no pudo enviarse (por falta de conexión).
    2. Se inserta al inicio de la lista (estrategia LIFO para visibilidad inmediata).
    3. Se actualiza la signal (estado reactivo).
    4. Se persiste en LocalStorage.

    Nota de diseño:
    Se agrega al inicio para que los mensajes más recientes
    sean los primeros visibles en UI si se muestran.

    Importante:
    Este método NO envía el mensaje, solo lo almacena.
  */
  agregarPendiente(mensaje: Mensaje): void {
    const nuevaLista = [mensaje, ...this.pendientes()];

    this.pendientes.set(nuevaLista);
    this.localStorageService.guardarPendientes(nuevaLista);
  }


  /*
    Devuelve la lista actual de mensajes pendientes.

    Uso:
    - Permite a otros servicios (por ejemplo WebSocketService)
      obtener la cola para intentar reenviarla.

    Nota:
    No se expone directamente la signal, sino su valor,
    para evitar modificaciones externas no controladas.
  */
  obtenerPendientes(): Mensaje[] {
    return this.pendientes();
  }


  /*
    Limpia completamente la cola de mensajes pendientes.

    Flujo:
    1. Se vacía la signal (estado en memoria).
    2. Se elimina la persistencia en LocalStorage.

    Uso típico:
    - Después de reenviar exitosamente todos los mensajes;
    - En un logout completo;
    - En reinicio de estado de la aplicación.

    Precaución:
    Una vez ejecutado, los mensajes no enviados se pierden definitivamente.
  */
  limpiarPendientes(): void {
    this.pendientes.set([]);
    this.localStorageService.limpiarPendientes();
  }
}