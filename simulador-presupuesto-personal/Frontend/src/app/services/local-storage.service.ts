import { Injectable } from '@angular/core';
import { Movimiento } from '../models/movimiento.model';
import { HistorialSimulacion } from '../models/simulacion.model';

/*
  Servicio LocalStorageService.

  Centraliza todo el uso de LocalStorage.

  LocalStorage es una API de HTML5 que permite guardar información
  en el navegador de forma persistente.

  En este proyecto se usa para guardar:
  - nombre del usuario;
  - moneda seleccionada;
  - movimientos financieros;
  - historial de simulaciones.

  Esto evita repetir localStorage.setItem y localStorage.getItem
  en todos los componentes.
*/

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  /*
    Claves internas usadas para guardar información.

    Se definen como readonly porque no deben cambiar durante
    la ejecución de la aplicación.
  */
  private readonly usuarioKey = 'presupuesto_usuario';
  private readonly monedaKey = 'presupuesto_moneda';
  private readonly movimientosKey = 'presupuesto_movimientos';
  private readonly historialKey = 'presupuesto_historial_simulaciones';

  /*
    Guarda el nombre del usuario.
  */
  guardarUsuario(nombre: string): void {
    localStorage.setItem(this.usuarioKey, nombre);
  }

  /*
    Recupera el nombre del usuario.

    Si no existe un valor guardado, devuelve una cadena vacía.
  */
  obtenerUsuario(): string {
    return localStorage.getItem(this.usuarioKey) ?? '';
  }

  /*
    Guarda la moneda seleccionada por el usuario.
  */
  guardarMoneda(moneda: string): void {
    localStorage.setItem(this.monedaKey, moneda);
  }

  /*
    Recupera la moneda seleccionada.

    Si no existe una moneda guardada, se usa MXN como valor inicial.
  */
  obtenerMoneda(): string {
    return localStorage.getItem(this.monedaKey) ?? 'MXN';
  }

  /*
    Guarda la lista completa de movimientos.

    Como LocalStorage solo almacena texto, el arreglo se convierte
    a JSON mediante JSON.stringify.
  */
  guardarMovimientos(movimientos: Movimiento[]): void {
    localStorage.setItem(this.movimientosKey, JSON.stringify(movimientos));
  }

  /*
    Recupera los movimientos guardados.

    Si no hay datos, devuelve un arreglo vacío.
  */
  obtenerMovimientos(): Movimiento[] {
    const datos = localStorage.getItem(this.movimientosKey);

    if (!datos) {
      return [];
    }

    return JSON.parse(datos) as Movimiento[];
  }

  /*
    Guarda el historial de simulaciones financieras.
  */
  guardarHistorialSimulaciones(historial: HistorialSimulacion[]): void {
    localStorage.setItem(this.historialKey, JSON.stringify(historial));
  }

  /*
    Recupera el historial de simulaciones.

    Si no existe historial previo, devuelve un arreglo vacío.
  */
  obtenerHistorialSimulaciones(): HistorialSimulacion[] {
    const datos = localStorage.getItem(this.historialKey);

    if (!datos) {
      return [];
    }

    return JSON.parse(datos) as HistorialSimulacion[];
  }

  /*
    Elimina únicamente el historial de simulaciones.

    No borra los movimientos ni la configuración del usuario.
  */
  limpiarHistorialSimulaciones(): void {
    localStorage.removeItem(this.historialKey);
  }

  /*
    Elimina los movimientos financieros guardados.
  */
  limpiarMovimientos(): void {
    localStorage.removeItem(this.movimientosKey);
  }
}