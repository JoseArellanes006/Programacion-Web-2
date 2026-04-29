/// <reference lib="webworker" />

/*
  Web Worker para simulación financiera.

  Este archivo se ejecuta en un hilo separado del navegador.

  Su función es realizar cálculos potencialmente pesados sin bloquear
  la interfaz principal de Angular.

  En este proyecto calcula:
  - ahorro mensual actual;
  - ahorro mensual simulado;
  - ahorro proyectado;
  - meses necesarios para alcanzar una meta de ahorro.
*/

type MovimientoWorker = {
  id: number;
  tipo: 'ingreso' | 'gasto';
  concepto: string;
  categoria: string;
  monto: number;
  fecha: string;
};

type SimulacionMensaje = {
  movimientos: MovimientoWorker[];
  metaAhorro: number;
  reduccionGastos: number;
  meses: number;
};

/*
  Escucha los mensajes enviados desde Angular.

  Angular envía:
  - lista de movimientos;
  - meta de ahorro;
  - porcentaje de reducción de gastos;
  - número de meses a proyectar.
*/
addEventListener('message', ({ data }: MessageEvent<SimulacionMensaje>) => {
  const { movimientos, metaAhorro, reduccionGastos, meses } = data;

  /*
    Se calcula el total de ingresos.
  */
  const totalIngresos = movimientos
    .filter(movimiento => movimiento.tipo === 'ingreso')
    .reduce((total, movimiento) => total + movimiento.monto, 0);

  /*
    Se calcula el total de gastos.
  */
  const totalGastos = movimientos
    .filter(movimiento => movimiento.tipo === 'gasto')
    .reduce((total, movimiento) => total + movimiento.monto, 0);

  /*
    Simulación de procesamiento pesado.

    Esto permite demostrar que el cálculo se realiza sin congelar
    la interfaz del navegador.
  */
  for (let progreso = 0; progreso <= 100; progreso++) {
    for (let i = 0; i < 600000; i++) {
      Math.sqrt(i);
    }

    postMessage({
      tipo: 'progreso',
      progreso
    });
  }

  /*
    Ahorro mensual actual:
    ingresos menos gastos.
  */
  const ahorroMensualActual = totalIngresos - totalGastos;

  /*
    Gastos simulados después de aplicar una reducción porcentual.

    Ejemplo:
    Si los gastos son 10000 y la reducción es 20%,
    entonces los gastos simulados serían 8000.
  */
  const gastosSimulados = totalGastos * (1 - reduccionGastos / 100);

  /*
    Ahorro mensual simulado:
    ingresos menos gastos simulados.
  */
  const ahorroMensualSimulado = totalIngresos - gastosSimulados;

  /*
    Ahorro total proyectado durante el número de meses indicado.
  */
  const ahorroProyectado = ahorroMensualSimulado * meses;

  /*
    Meses necesarios para alcanzar la meta.

    Si el ahorro mensual simulado es menor o igual a cero,
    no es posible alcanzar la meta con las condiciones actuales.
  */
  const mesesParaMeta =
    ahorroMensualSimulado > 0
      ? Math.ceil(metaAhorro / ahorroMensualSimulado)
      : null;

  /*
    Se envía el resultado final a Angular.
  */
  postMessage({
    tipo: 'resultado',
    resultado: {
      ahorroMensualActual,
      ahorroMensualSimulado,
      ahorroProyectado,
      mesesParaMeta
    }
  });
});