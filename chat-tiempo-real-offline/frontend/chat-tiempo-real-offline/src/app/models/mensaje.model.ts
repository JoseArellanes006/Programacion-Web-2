/*
  Modelo Mensaje.

  Representa un mensaje dentro del chat.

  estado:
  - enviado: el mensaje llegó correctamente al servidor.
  - pendiente: el mensaje se guardó localmente porque no había conexión.
*/

export type EstadoMensaje = 'enviado' | 'pendiente';

export interface Mensaje {
  id: string;
  usuarioId: number;
  usuarioNombre: string;
  texto: string;
  fecha: string;
  estado: EstadoMensaje;
}