/*
  Modelo ResumenPresupuesto.

  Representa el resultado general del presupuesto actual.

  Se calcula a partir de los movimientos registrados:
  - ingresos;
  - gastos;
  - balance disponible;
  - porcentaje de gasto sobre ingreso.
*/

export interface ResumenPresupuesto {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  porcentajeGasto: number;
}