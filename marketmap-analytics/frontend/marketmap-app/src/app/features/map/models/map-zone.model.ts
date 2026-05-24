/*
  Modelo de zona del mapa interactivo.

  Una zona representa un punto o área seleccionable dentro del mapa comercial.

  Ejemplos:
  - mesa
  - caja
  - terraza
  - mostrador
  - zona de entrega
  - área de atención

  El backend será responsable de:
  - guardar zonas
  - validar estados
  - asociar pedidos a zonas
  - actualizar disponibilidad
*/

import { APP_CONSTANTS } from '../../../core/config/app.constants';

/*
  Estados permitidos para una zona del mapa.
*/
export type MapZoneStatus =
  | typeof APP_CONSTANTS.mapZoneStatus.available
  | typeof APP_CONSTANTS.mapZoneStatus.occupied
  | typeof APP_CONSTANTS.mapZoneStatus.reserved
  | typeof APP_CONSTANTS.mapZoneStatus.inactive;

/*
  Tipo visual u operativo de la zona.
*/
export type MapZoneType =
  | 'TABLE'
  | 'COUNTER'
  | 'DELIVERY'
  | 'TERRACE'
  | 'CASHIER'
  | 'OTHER';

/*
  Modelo principal de zona.
*/
export interface MapZone {
  /*
    Identificador único de la zona.
  */
  id: string;

  /*
    Identificador del layout al que pertenece.
  */
  layoutId: string;

  /*
    Nombre visible de la zona.

    Ejemplo:
    Mesa 1
    Terraza A
    Caja principal
  */
  name: string;

  /*
    Tipo de zona.
  */
  type: MapZoneType;

  /*
    Estado actual de la zona.
  */
  status: MapZoneStatus;

  /*
    Posición horizontal en porcentaje dentro del mapa.

    Ejemplo:
    25 significa 25% desde la izquierda.
  */
  x: number;

  /*
    Posición vertical en porcentaje dentro del mapa.

    Ejemplo:
    40 significa 40% desde arriba.
  */
  y: number;

  /*
    Ancho de la zona en porcentaje.
  */
  width: number;

  /*
    Alto de la zona en porcentaje.
  */
  height: number;

  /*
    Capacidad opcional de la zona.

    Útil para mesas o espacios.
  */
  capacity?: number | null;

  /*
    Pedido asociado a la zona, si existe.
  */
  currentOrderId?: string | null;

  /*
    Folio del pedido asociado, si existe.
  */
  currentOrderFolio?: string | null;

  /*
    Total actual del pedido asociado.
  */
  currentOrderTotal?: number | null;

  /*
    Fecha de creación.
  */
  createdAt?: string | null;

  /*
    Última actualización.
  */
  updatedAt?: string | null;
}

/*
  Solicitud para cambiar estado de zona.
*/
export interface UpdateMapZoneStatusRequest {
  /*
    Nuevo estado de la zona.
  */
  status: MapZoneStatus;
}

/*
  Solicitud para actualizar posición o tamaño de zona.
*/
export interface UpdateMapZonePositionRequest {
  /*
    Nueva posición horizontal.
  */
  x: number;

  /*
    Nueva posición vertical.
  */
  y: number;

  /*
    Nuevo ancho.
  */
  width: number;

  /*
    Nuevo alto.
  */
  height: number;
}