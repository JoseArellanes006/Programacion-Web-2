/*
  Servicio global para WebSockets.

  Este servicio centraliza la comunicación en tiempo real entre Angular
  y FastAPI.

  Se usará para:
  - notificaciones administrativas
  - actualización de pedidos
  - actualización de dashboard
  - cambios en zonas del mapa
  - eventos de ventas

  En este bloque se deja preparado el servicio, aunque el backend WebSocket
  se implementará más adelante.
*/

import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { API_CONFIG } from '../config/api.config';
import { TokenService } from './token.service';

/*
  Estados posibles de conexión WebSocket.
*/
export type WebSocketStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR';

/*
  Mensaje recibido o enviado por WebSocket.
*/
export interface WebSocketMessage<T = unknown> {
  /*
    Tipo de evento.

    Ejemplos:
    - ORDER_CREATED
    - ORDER_UPDATED
    - DASHBOARD_REFRESH
    - MAP_ZONE_UPDATED
  */
  type: string;

  /*
    Contenido del mensaje.
  */
  payload?: T;

  /*
    Fecha opcional del evento.
  */
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  /*
    TokenService se usa para obtener el token y enviarlo opcionalmente
    como query param al WebSocket.
  */
  private readonly tokenService = inject(TokenService);

  /*
    PLATFORM_ID permite evitar que WebSocket se use fuera del navegador.
  */
  private readonly platformId = inject(PLATFORM_ID);

  /*
    Indica si Angular está ejecutándose en navegador.
  */
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /*
    Instancia interna del WebSocket.
  */
  private socket: WebSocket | null = null;

  /*
    Signal privado con el estado de conexión.
  */
  private readonly statusSignal = signal<WebSocketStatus>('DISCONNECTED');

  /*
    Signal privado con el último mensaje recibido.
  */
  private readonly lastMessageSignal = signal<WebSocketMessage | null>(null);

  /*
    Estado de conexión expuesto como signal de solo lectura.
  */
  readonly status = this.statusSignal.asReadonly();

  /*
    Último mensaje recibido expuesto como signal de solo lectura.
  */
  readonly lastMessage = this.lastMessageSignal.asReadonly();

  /*
    Indica si el WebSocket está conectado.
  */
  readonly isConnected = computed(() => {
    return this.statusSignal() === 'CONNECTED';
  });

  /*
    Inicia la conexión WebSocket.

    Si ya existe una conexión abierta o en proceso, no crea otra.
  */
  connect(): void {
    if (!this.isBrowser) {
      return;
    }

    if (
      this.socket &&
      (this.statusSignal() === 'CONNECTED' ||
        this.statusSignal() === 'CONNECTING')
    ) {
      return;
    }

    this.statusSignal.set('CONNECTING');

    /*
      Obtiene el token actual.

      Más adelante, el backend podrá leer este token para autenticar
      la conexión WebSocket.
    */
    const token = this.tokenService.getAccessToken();

    /*
      Construye la URL final.

      Si existe token, lo agrega como query param:
      ws://127.0.0.1:8000/ws/notifications?token=...
    */
    const wsUrl = token
      ? `${API_CONFIG.wsUrl}?token=${encodeURIComponent(token)}`
      : API_CONFIG.wsUrl;

    try {
      this.socket = new WebSocket(wsUrl);

      /*
        Evento cuando la conexión abre correctamente.
      */
      this.socket.onopen = () => {
        this.statusSignal.set('CONNECTED');
      };

      /*
        Evento cuando llega un mensaje desde el backend.
      */
      this.socket.onmessage = (event) => {
        const message = this.parseMessage(event.data);
        this.lastMessageSignal.set(message);
      };

      /*
        Evento cuando ocurre un error en la conexión.
      */
      this.socket.onerror = () => {
        this.statusSignal.set('ERROR');
      };

      /*
        Evento cuando la conexión se cierra.
      */
      this.socket.onclose = () => {
        this.statusSignal.set('DISCONNECTED');
        this.socket = null;
      };
    } catch {
      this.statusSignal.set('ERROR');
      this.socket = null;
    }
  }

  /*
    Envía un mensaje al backend por WebSocket.

    Si el socket no está conectado, no envía nada.
  */
  send<T = unknown>(message: WebSocketMessage<T>): void {
    if (!this.socket || this.statusSignal() !== 'CONNECTED') {
      return;
    }

    this.socket.send(JSON.stringify(message));
  }

  /*
    Cierra la conexión WebSocket.
  */
  disconnect(): void {
    if (!this.socket) {
      this.statusSignal.set('DISCONNECTED');
      return;
    }

    this.socket.close();
    this.socket = null;
    this.statusSignal.set('DISCONNECTED');
  }

  /*
    Convierte el mensaje recibido en un objeto.

    Si el backend envía texto simple o JSON inválido, se devuelve un mensaje
    genérico de tipo RAW_MESSAGE.
  */
  private parseMessage(data: string): WebSocketMessage {
    try {
      return JSON.parse(data) as WebSocketMessage;
    } catch {
      return {
        type: 'RAW_MESSAGE',
        payload: data,
        timestamp: new Date().toISOString()
      };
    }
  }
}