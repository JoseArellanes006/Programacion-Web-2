import { Injectable, inject, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { HistorialSimulacion } from '../models/simulacion.model';

/*
  Servicio SimulacionesService.

  Administra el historial de simulaciones financieras.

  El historial se guarda en LocalStorage para que no se pierda
  al recargar la página.
*/

@Injectable({
  providedIn: 'root'
})
export class SimulacionesService {
  /*
    Servicio que centraliza el acceso a LocalStorage.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    Signal con el historial de simulaciones guardadas.
  */
  historial = signal<HistorialSimulacion[]>(
    this.localStorageService.obtenerHistorialSimulaciones()
  );

  /*
    Agrega una nueva simulación al historial.
  */
  agregarSimulacion(simulacion: HistorialSimulacion): void {
    const nuevoHistorial = [simulacion, ...this.historial()];

    this.historial.set(nuevoHistorial);
    this.localStorageService.guardarHistorialSimulaciones(nuevoHistorial);
  }

  /*
    Limpia el historial de simulaciones.
  */
  limpiarHistorial(): void {
    this.historial.set([]);
    this.localStorageService.limpiarHistorialSimulaciones();
  }
}