import { Injectable } from '@angular/core';
import { LoginResponse } from '../models/auth.model';
import { Mensaje } from '../models/mensaje.model';

/*
  LocalStorageService

  Este servicio encapsula TODO el acceso a LocalStorage.

  Problema que resuelve:
  - Evita que múltiples componentes manipulen directamente localStorage.
  - Centraliza la persistencia de datos.
  - Permite cambiar la estrategia de almacenamiento en el futuro
    sin modificar toda la aplicación.

  Responsabilidades principales:
  - Persistir sesión del usuario.
  - Guardar historial de mensajes.
  - Manejar mensajes pendientes (modo offline).

  Nota técnica:
  LocalStorage solo almacena strings, por lo que todos los objetos
  deben serializarse (JSON.stringify) y deserializarse (JSON.parse).
*/

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  /*
    Claves internas utilizadas en LocalStorage.

    Se definen como constantes para:
    - evitar errores de escritura (typos);
    - mantener consistencia en toda la aplicación;
    - facilitar mantenimiento.
  */
  private readonly sesionKey = 'chat_sesion';
  private readonly mensajesKey = 'chat_mensajes';
  private readonly pendientesKey = 'chat_mensajes_pendientes';


  /*
    Guarda la sesión del usuario autenticado.

    Proceso:
    1. Recibe un objeto LoginResponse (token + usuario).
    2. Lo convierte a string usando JSON.stringify.
    3. Lo almacena en LocalStorage.

    Uso:
    Permite que el usuario permanezca autenticado incluso
    después de recargar la página.
  */
  guardarSesion(sesion: LoginResponse): void {
    localStorage.setItem(this.sesionKey, JSON.stringify(sesion));
  }


  /*
    Recupera la sesión almacenada.

    Proceso:
    1. Busca el valor en LocalStorage usando la clave.
    2. Si no existe, retorna null (no hay sesión).
    3. Si existe, convierte el string JSON a objeto.

    Importante:
    Siempre se valida que exista el dato antes de hacer JSON.parse
    para evitar errores en tiempo de ejecución.
  */
  obtenerSesion(): LoginResponse | null {
    const sesion = localStorage.getItem(this.sesionKey);

    if (!sesion) {
      return null;
    }

    return JSON.parse(sesion) as LoginResponse;
  }


  /*
    Elimina la sesión del usuario.

    Proceso:
    1. Borra únicamente la clave de sesión.
    2. No afecta mensajes ni datos locales.

    Uso:
    Se ejecuta al cerrar sesión.
  */
  eliminarSesion(): void {
    localStorage.removeItem(this.sesionKey);
  }


  /*
    Guarda el historial completo de mensajes.

    Proceso:
    1. Recibe un arreglo de mensajes.
    2. Se serializa a JSON.
    3. Se guarda en LocalStorage.

    Uso:
    Permite mantener el historial visible incluso después
    de recargar la aplicación.
  */
  guardarMensajes(mensajes: Mensaje[]): void {
    localStorage.setItem(this.mensajesKey, JSON.stringify(mensajes));
  }


  /*
    Recupera el historial de mensajes.

    Proceso:
    1. Obtiene el string almacenado.
    2. Si no existe, retorna arreglo vacío (no hay historial).
    3. Si existe, lo convierte a objeto.

    Decisión de diseño:
    Retornar [] en lugar de null evita validaciones extra en componentes.
  */
  obtenerMensajes(): Mensaje[] {
    const mensajes = localStorage.getItem(this.mensajesKey);

    if (!mensajes) {
      return [];
    }

    return JSON.parse(mensajes) as Mensaje[];
  }


  /*
    Guarda mensajes pendientes (modo offline).

    Contexto:
    Cuando no hay conexión WebSocket, los mensajes no se pueden enviar.
    En lugar de perderlos, se almacenan aquí.

    Proceso:
    1. Recibe lista de mensajes pendientes.
    2. Se serializa a JSON.
    3. Se guarda en LocalStorage.

    Uso:
    Posteriormente estos mensajes se reenvían cuando vuelve la conexión.
  */
  guardarPendientes(mensajes: Mensaje[]): void {
    localStorage.setItem(this.pendientesKey, JSON.stringify(mensajes));
  }


  /*
    Recupera mensajes pendientes.

    Proceso:
    1. Lee LocalStorage.
    2. Si no hay datos, retorna [].
    3. Si hay datos, los parsea.

    Uso:
    Permite reconstruir la cola de mensajes no enviados.
  */
  obtenerPendientes(): Mensaje[] {
    const mensajes = localStorage.getItem(this.pendientesKey);

    if (!mensajes) {
      return [];
    }

    return JSON.parse(mensajes) as Mensaje[];
  }


  /*
    Elimina únicamente la cola de mensajes pendientes.

    Uso:
    Se ejecuta cuando:
    - los mensajes pendientes ya fueron enviados;
    - se quiere limpiar el estado offline.

    Importante:
    No afecta el historial de mensajes ni la sesión.
  */
  limpiarPendientes(): void {
    localStorage.removeItem(this.pendientesKey);
  }


  /*
    Limpieza total del almacenamiento del chat.

    Proceso:
    Elimina:
    - sesión del usuario;
    - historial de mensajes;
    - mensajes pendientes.

    Uso:
    - logout completo;
    - reinicio del sistema;
    - pruebas.

    Precaución:
    Este método borra TODA la información persistente del chat.
  */
  limpiarTodo(): void {
    localStorage.removeItem(this.sesionKey);
    localStorage.removeItem(this.mensajesKey);
    localStorage.removeItem(this.pendientesKey);
  }
}