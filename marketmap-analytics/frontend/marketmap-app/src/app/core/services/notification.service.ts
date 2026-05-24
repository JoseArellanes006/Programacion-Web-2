/*
  Servicio global de notificaciones.

  Este servicio administra mensajes visuales dentro del frontend.

  Por ahora no depende de Angular Material ni de librerías externas.
  Usa signals para almacenar notificaciones activas.

  Más adelante, un componente de notificaciones puede leer este servicio
  y mostrar mensajes tipo toast, alertas o banners.
*/

import { Injectable, signal } from '@angular/core';

/*
  Tipos de notificación permitidos.
*/
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/*
  Modelo de una notificación.
*/
export interface AppNotification {
  /*
    Identificador único de la notificación.
  */
  id: string;

  /*
    Tipo visual de notificación.
  */
  type: NotificationType;

  /*
    Título principal.
  */
  title: string;

  /*
    Mensaje descriptivo.
  */
  message?: string;

  /*
    Duración en milisegundos.

    Si se define en 0, la notificación no se cierra automáticamente.
  */
  durationMs?: number;

  /*
    Fecha de creación.
  */
  createdAt: Date;
}

/*
  Datos necesarios para crear una notificación.
*/
export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message?: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  /*
    Signal privado con las notificaciones activas.
  */
  private readonly notificationsSignal = signal<AppNotification[]>([]);

  /*
    Signal público de solo lectura.
  */
  readonly notifications = this.notificationsSignal.asReadonly();

  /*
    Crea una notificación genérica.
  */
  notify(payload: CreateNotificationPayload): void {
    const notification: AppNotification = {
      id: crypto.randomUUID(),
      type: payload.type,
      title: payload.title,
      message: payload.message,
      durationMs: payload.durationMs ?? 4000,
      createdAt: new Date()
    };

    this.notificationsSignal.update((notifications) => [
      notification,
      ...notifications
    ]);

    /*
      Si durationMs es mayor a cero, se elimina automáticamente después
      del tiempo indicado.
    */
    if (notification.durationMs && notification.durationMs > 0) {
      window.setTimeout(() => {
        this.remove(notification.id);
      }, notification.durationMs);
    }
  }

  /*
    Notificación de éxito.
  */
  success(title: string, message?: string, durationMs?: number): void {
    this.notify({
      type: 'success',
      title,
      message,
      durationMs
    });
  }

  /*
    Notificación de error.
  */
  error(title: string, message?: string, durationMs?: number): void {
    this.notify({
      type: 'error',
      title,
      message,
      durationMs
    });
  }

  /*
    Notificación de advertencia.
  */
  warning(title: string, message?: string, durationMs?: number): void {
    this.notify({
      type: 'warning',
      title,
      message,
      durationMs
    });
  }

  /*
    Notificación informativa.
  */
  info(title: string, message?: string, durationMs?: number): void {
    this.notify({
      type: 'info',
      title,
      message,
      durationMs
    });
  }

  /*
    Elimina una notificación por id.
  */
  remove(id: string): void {
    this.notificationsSignal.update((notifications) => {
      return notifications.filter((notification) => notification.id !== id);
    });
  }

  /*
    Limpia todas las notificaciones.
  */
  clear(): void {
    this.notificationsSignal.set([]);
  }
}