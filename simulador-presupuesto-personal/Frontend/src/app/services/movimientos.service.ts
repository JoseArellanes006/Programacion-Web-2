import { Injectable, computed, inject, signal } from '@angular/core';
import { LocalStorageService } from './local-storage.service';
import { Movimiento, TipoMovimiento } from '../models/movimiento.model';
import { ResumenPresupuesto } from '../models/presupuesto.model';

/*
  Servicio MovimientosService.

  Administra el estado principal de ingresos y gastos.

  Usa Angular Signals para manejar la lista de movimientos
  de forma reactiva.

  También se apoya en LocalStorageService para persistir los datos
  en el navegador.
*/

@Injectable({
  providedIn: 'root'
})
export class MovimientosService {
  /*
    Servicio encargado de leer y escribir información en LocalStorage.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    Signal principal con la lista de movimientos financieros.

    Se inicializa recuperando los datos previamente guardados
    en LocalStorage.
  */
  movimientos = signal<Movimiento[]>(
    this.localStorageService.obtenerMovimientos()
  );

  /*
    Computed que calcula el resumen general del presupuesto.

    Cada vez que cambia la lista de movimientos, este valor se recalcula.
  */
  resumen = computed<ResumenPresupuesto>(() => {
    const movimientos = this.movimientos();

    const totalIngresos = movimientos
      .filter(movimiento => movimiento.tipo === 'ingreso')
      .reduce((total, movimiento) => total + movimiento.monto, 0);

    const totalGastos = movimientos
      .filter(movimiento => movimiento.tipo === 'gasto')
      .reduce((total, movimiento) => total + movimiento.monto, 0);

    const balance = totalIngresos - totalGastos;

    const porcentajeGasto =
      totalIngresos > 0 ? (totalGastos / totalIngresos) * 100 : 0;

    return {
      totalIngresos,
      totalGastos,
      balance,
      porcentajeGasto
    };
  });

  /*
    Agrega un nuevo movimiento financiero.

    El id se genera con Date.now() para obtener un identificador
    simple y único en esta práctica.
  */
  agregarMovimiento(
    tipo: TipoMovimiento,
    concepto: string,
    categoria: string,
    monto: number
  ): void {
    const nuevoMovimiento: Movimiento = {
      id: Date.now(),
      tipo,
      concepto,
      categoria,
      monto,
      fecha: new Date().toLocaleString()
    };

    const nuevaLista = [nuevoMovimiento, ...this.movimientos()];

    this.movimientos.set(nuevaLista);
    this.localStorageService.guardarMovimientos(nuevaLista);
  }

  /*
    Elimina un movimiento a partir de su id.
  */
  eliminarMovimiento(id: number): void {
    const nuevaLista = this.movimientos().filter(
      movimiento => movimiento.id !== id
    );

    this.movimientos.set(nuevaLista);
    this.localStorageService.guardarMovimientos(nuevaLista);
  }

  /*
    Elimina todos los movimientos financieros.
  */
  limpiarMovimientos(): void {
    this.movimientos.set([]);
    this.localStorageService.limpiarMovimientos();
  }
}