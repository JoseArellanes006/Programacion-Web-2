/*
  Modelo de layout del mapa.

  Un layout representa la distribución visual de una sucursal, cafetería,
  tienda o espacio comercial.

  El backend será responsable de:
  - guardar layouts
  - definir layout activo
  - asociar zonas a layouts
  - almacenar imagen base del mapa si existe
*/

import { MapZone } from './map-zone.model';

/*
  Modelo principal del layout del mapa.
*/
export interface MapLayout {
  /*
    Identificador único del layout.
  */
  id: string;

  /*
    Nombre visible del layout.

    Ejemplo:
    Planta baja
    Cafetería principal
    Terraza
  */
  name: string;

  /*
    Descripción opcional.
  */
  description?: string | null;

  /*
    URL de imagen base del mapa.

    Puede ser un plano, imagen del local o representación visual.
  */
  backgroundImageUrl?: string | null;

  /*
    Indica si este layout está activo.
  */
  active: boolean;

  /*
    Ancho de referencia del mapa.
  */
  width: number;

  /*
    Alto de referencia del mapa.
  */
  height: number;

  /*
    Zonas pertenecientes al layout.
  */
  zones: MapZone[];

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
  Resumen de ocupación del mapa.

  Estos datos deben calcularse en backend.
*/
export interface MapOccupancySummary {
  /*
    Total de zonas.
  */
  totalZones: number;

  /*
    Zonas disponibles.
  */
  availableZones: number;

  /*
    Zonas ocupadas.
  */
  occupiedZones: number;

  /*
    Zonas reservadas.
  */
  reservedZones: number;

  /*
    Zonas inactivas.
  */
  inactiveZones: number;
}

/*
  Respuesta completa esperada para la pantalla del mapa.
*/
export interface InteractiveMapResponse {
  /*
    Layout activo.

    Puede venir null si todavía no existe un layout activo.
  */
  layout: MapLayout | null;

  /*
    Resumen de ocupación.
  */
  summary: MapOccupancySummary;
}