/*
  Servicio del mapa interactivo.

  Este servicio NO guarda zonas como base de datos local.
  Su responsabilidad es comunicarse con el backend FastAPI.

  El backend será quien maneje:
  - layouts del mapa
  - imagen base del mapa
  - zonas del mapa
  - estados de disponibilidad
  - relación entre zonas y pedidos
  - persistencia en MongoDB

  Angular solamente:
  - solicita el mapa
  - muestra las zonas
  - sube imagen base del mapa
  - crea zonas sobre el mapa
  - envía acciones del usuario
  - mantiene estado visual con signals
*/

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import {
  InteractiveMapResponse,
  MapLayout,
  MapOccupancySummary
} from '../models/map-layout.model';

import {
  MapZone,
  MapZoneStatus,
  UpdateMapZonePositionRequest,
  UpdateMapZoneStatusRequest
} from '../models/map-zone.model';

export type MapZoneType =
  | 'TABLE'
  | 'COUNTER'
  | 'DELIVERY'
  | 'TERRACE'
  | 'CASHIER'
  | 'OTHER';

export interface CreateMapZoneRequest {
  name: string;
  type: MapZoneType;
  status: MapZoneStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity?: number | null;
  color: string;
  description: string;
  layoutId?: string | null;
  assignedUserId?: string | null;
  assignedUserName?: string | null;
  currentOrderId?: string | null;
  currentOrderFolio?: string | null;
  currentOrderTotal?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MapService {
  /*
    HttpClient permite consumir la API de FastAPI.
  */
  private readonly http = inject(HttpClient);

  /*
    Signal privado con el layout activo.
  */
  private readonly layoutSignal = signal<MapLayout | null>(null);

  /*
    Signal privado con el resumen de ocupación.
  */
  private readonly summarySignal = signal<MapOccupancySummary | null>(null);

  /*
    Signal público de solo lectura para el layout.
  */
  readonly layout = this.layoutSignal.asReadonly();

  /*
    Signal público de solo lectura para el resumen.
  */
  readonly summary = this.summarySignal.asReadonly();

  /*
    Zonas del layout actual.
  */
  readonly zones = computed(() => {
    return this.layoutSignal()?.zones ?? [];
  });

  /*
    Indica si existe un layout cargado.
  */
  readonly hasLayout = computed(() => {
    return this.layoutSignal() !== null;
  });

  /*
    Obtiene el mapa interactivo activo.

    Endpoint esperado:
    GET /maps/active
  */
  getActiveMap(): Observable<InteractiveMapResponse> {
    return this.http
      .get<InteractiveMapResponse>(API_CONFIG.maps.active)
      .pipe(
        tap((response) => {
          this.layoutSignal.set(response.layout);
          this.summarySignal.set(response.summary);
        })
      );
  }

  /*
    Obtiene un layout específico por id.

    Endpoint esperado:
    GET /maps/layouts/{layoutId}
  */
  getLayoutById(layoutId: string): Observable<MapLayout> {
    return this.http
      .get<MapLayout>(API_CONFIG.maps.layoutById(layoutId))
      .pipe(
        tap((layout) => {
          this.layoutSignal.set(layout);
          this.summarySignal.set(this.calculateSummaryFromLayout(layout));
        })
      );
  }

  /*
    Sube y actualiza la imagen base del layout.

    Endpoint esperado:
    POST /maps/layouts/{layoutId}/background

    Body:
    FormData {
      file: File
    }
  */
  updateLayoutBackground(
    layoutId: string,
    file: File
  ): Observable<MapLayout> {
    const formData = new FormData();

    formData.append('file', file);

    return this.http
      .post<MapLayout>(API_CONFIG.maps.updateBackground(layoutId), formData)
      .pipe(
        tap((layout) => {
          this.layoutSignal.set(layout);
          this.summarySignal.set(this.calculateSummaryFromLayout(layout));
        })
      );
  }

  /*
    Crea una nueva zona del mapa.

    Endpoint esperado:
    POST /maps/zones

    Body:
    {
      name,
      type,
      status,
      x,
      y,
      width,
      height,
      capacity,
      color,
      description,
      layoutId
    }
  */
  createZone(payload: CreateMapZoneRequest): Observable<MapZone> {
    return this.http
      .post<MapZone>(API_CONFIG.maps.zones, payload)
      .pipe(
        tap((createdZone) => {
          this.addZoneToCurrentLayout(createdZone);
        })
      );
  }

  /*
    Actualiza el estado de una zona.

    Endpoint esperado:
    PATCH /maps/zones/{zoneId}/status

    Body:
    {
      status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'INACTIVE'
    }
  */
  updateZoneStatus(
    zoneId: string,
    status: MapZoneStatus
  ): Observable<MapZone> {
    const payload: UpdateMapZoneStatusRequest = {
      status
    };

    return this.http
      .patch<MapZone>(API_CONFIG.maps.updateStatus(zoneId), payload)
      .pipe(
        tap((updatedZone) => {
          this.updateZoneInCurrentLayout(updatedZone);
        })
      );
  }

  /*
    Actualiza la posición o tamaño de una zona.

    Endpoint esperado:
    PATCH /maps/zones/{zoneId}/position

    Body:
    {
      x: number,
      y: number,
      width: number,
      height: number
    }
  */
  updateZonePosition(
    zoneId: string,
    position: UpdateMapZonePositionRequest
  ): Observable<MapZone> {
    return this.http
      .patch<MapZone>(API_CONFIG.maps.updatePosition(zoneId), position)
      .pipe(
        tap((updatedZone) => {
          this.updateZoneInCurrentLayout(updatedZone);
        })
      );
  }

  /*
    Libera una zona ocupada o reservada.

    Endpoint esperado:
    PATCH /maps/zones/{zoneId}/release
  */
  releaseZone(zoneId: string): Observable<MapZone> {
    return this.http
      .patch<MapZone>(API_CONFIG.maps.release(zoneId), {})
      .pipe(
        tap((updatedZone) => {
          this.updateZoneInCurrentLayout(updatedZone);
        })
      );
  }

  /*
    Construye una URL pública completa para archivos servidos por FastAPI.

    El backend normalmente devuelve:
    /static/uploads/maps/archivo.png

    El navegador necesita:
    http://127.0.0.1:8000/static/uploads/maps/archivo.png
  */
  buildPublicAssetUrl(url: string | null | undefined): string | null {
    if (!url) {
      return null;
    }

    const cleanUrl = url.trim();

    if (!cleanUrl) {
      return null;
    }

    if (
      cleanUrl.startsWith('http://') ||
      cleanUrl.startsWith('https://')
    ) {
      return cleanUrl;
    }

    if (cleanUrl.startsWith('/')) {
      return `${API_CONFIG.baseUrl}${cleanUrl}`;
    }

    return `${API_CONFIG.baseUrl}/${cleanUrl}`;
  }

  /*
    Agrega una zona recién creada al layout actual.
  */
  private addZoneToCurrentLayout(createdZone: MapZone): void {
    const currentLayout = this.layoutSignal();

    if (!currentLayout) {
      return;
    }

    const updatedLayout: MapLayout = {
      ...currentLayout,
      zones: [
        ...currentLayout.zones,
        createdZone
      ]
    };

    this.layoutSignal.set(updatedLayout);
    this.summarySignal.set(this.calculateSummaryFromLayout(updatedLayout));
  }

  /*
    Actualiza una zona dentro del layout cargado actualmente.
  */
  private updateZoneInCurrentLayout(updatedZone: MapZone): void {
    const currentLayout = this.layoutSignal();

    if (!currentLayout) {
      return;
    }

    const updatedLayout: MapLayout = {
      ...currentLayout,
      zones: currentLayout.zones.map((zone) => {
        if (zone.id === updatedZone.id) {
          return updatedZone;
        }

        return zone;
      })
    };

    this.layoutSignal.set(updatedLayout);
    this.summarySignal.set(this.calculateSummaryFromLayout(updatedLayout));
  }

  /*
    Recalcula resumen de ocupación desde el layout actual.

    Esto ayuda a mantener el resumen actualizado después de cambios
    sin esperar otra consulta completa al backend.
  */
  private calculateSummaryFromLayout(
    layout: MapLayout
  ): MapOccupancySummary {
    const zones = layout.zones;

    return {
      totalZones: zones.length,
      availableZones: zones.filter((zone) => zone.status === 'AVAILABLE').length,
      occupiedZones: zones.filter((zone) => zone.status === 'OCCUPIED').length,
      reservedZones: zones.filter((zone) => zone.status === 'RESERVED').length,
      inactiveZones: zones.filter((zone) => zone.status === 'INACTIVE').length
    };
  }

  /*
    Limpia el estado visual del mapa.

    Útil al cerrar sesión o cambiar de contexto.
  */
  clearMapState(): void {
    this.layoutSignal.set(null);
    this.summarySignal.set(null);
  }
}