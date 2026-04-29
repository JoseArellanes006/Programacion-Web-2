/*
  Modelos relacionados con la simulación financiera.

  SimulacionConfig:
  Representa los datos que el usuario introduce para simular
  un escenario financiero.

  ResultadoSimulacion:
  Representa el resultado calculado por el Web Worker.

  HistorialSimulacion:
  Representa una simulación guardada en LocalStorage.
*/

export interface SimulacionConfig {
  metaAhorro: number;
  reduccionGastos: number;
  meses: number;
}

export interface ResultadoSimulacion {
  ahorroMensualActual: number;
  ahorroMensualSimulado: number;
  ahorroProyectado: number;
  mesesParaMeta: number | null;
}

export interface HistorialSimulacion {
  fecha: string;
  metaAhorro: number;
  reduccionGastos: number;
  meses: number;
  ahorroProyectado: number;
  mesesParaMeta: number | null;
}