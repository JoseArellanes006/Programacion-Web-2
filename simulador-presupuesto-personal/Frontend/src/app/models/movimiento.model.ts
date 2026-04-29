/*
  Modelo Movimiento.

  Representa un ingreso o gasto registrado por el usuario.

  Este modelo es usado por:
  - el formulario para crear movimientos;
  - la lista para mostrarlos;
  - los servicios para guardarlos en LocalStorage;
  - el Web Worker para calcular el presupuesto.
*/

export type TipoMovimiento = 'ingreso' | 'gasto';

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
}