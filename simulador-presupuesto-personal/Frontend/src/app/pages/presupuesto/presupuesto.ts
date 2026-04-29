import { Component, OnInit, inject, signal } from '@angular/core';

import { ConfiguracionLocalComponent } from '../../components/configuracion-local/configuracion-local';
import { FormularioMovimientoComponent } from '../../components/formulario-movimiento/formulario-movimiento';
import { ResumenPresupuestoComponent } from '../../components/resumen-presupuesto/resumen-presupuesto';
import { ListaMovimientosComponent } from '../../components/lista-movimientos/lista-movimientos';
import { SimuladorFinancieroComponent } from '../../components/simulador-financiero/simulador-financiero';
import { HistorialSimulacionesComponent } from '../../components/historial-simulaciones/historial-simulaciones';

import { LocalStorageService } from '../../services/local-storage.service';
import { MovimientosService } from '../../services/movimientos.service';
import { SimulacionesService } from '../../services/simulaciones.service';

import { TipoMovimiento } from '../../models/movimiento.model';
import {
  HistorialSimulacion,
  ResultadoSimulacion,
  SimulacionConfig
} from '../../models/simulacion.model';

/*
  PresupuestoComponent

  Esta es la página principal del proyecto.

  Su responsabilidad es integrar todos los módulos visuales y coordinar
  la lógica general de la aplicación.

  En esta página se conectan los dos temas principales:

  1. LocalStorage
     Se utiliza para recuperar y guardar la configuración del usuario,
     como su nombre, la moneda seleccionada y el historial de simulaciones.

  2. Web Workers
     Se utiliza para ejecutar la simulación financiera en segundo plano,
     evitando que la interfaz se congele mientras se realizan los cálculos.

  Este componente funciona como contenedor principal:
  - recibe eventos de los componentes hijos;
  - llama a los servicios correspondientes;
  - administra el estado general de la página;
  - crea y controla el Web Worker.
*/

@Component({
  selector: 'app-presupuesto',
  standalone: true,

  /*
    imports contiene los componentes standalone que serán usados
    dentro del template de esta página.

    Al usar Angular standalone, no se necesita un módulo tradicional
    como AppModule.
  */
  imports: [
    ConfiguracionLocalComponent,
    FormularioMovimientoComponent,
    ResumenPresupuestoComponent,
    ListaMovimientosComponent,
    SimuladorFinancieroComponent,
    HistorialSimulacionesComponent
  ],

  template: `
    <main class="page">
      <header class="hero">
        <h1>Simulador de presupuesto personal inteligente</h1>

        <p>
          Proyecto Angular que aplica características avanzadas de HTML5:
          LocalStorage para persistencia local y Web Workers para cálculos
          financieros en segundo plano.
        </p>
      </header>

      <section class="grid">
        <app-configuracion-local
          [usuario]="usuario()"
          [moneda]="moneda()"
          (cambiarUsuario)="usuario.set($event)"
          (cambiarMoneda)="moneda.set($event)"
          (guardarConfiguracion)="guardarConfiguracion()"
        />

        <app-formulario-movimiento
          (agregarMovimiento)="agregarMovimiento($event)"
        />
      </section>

      <app-resumen-presupuesto
        [resumen]="movimientosService.resumen()"
        [moneda]="moneda()"
      />

      <app-lista-movimientos
        [movimientos]="movimientosService.movimientos()"
        [moneda]="moneda()"
        (eliminarMovimiento)="movimientosService.eliminarMovimiento($event)"
        (limpiarMovimientos)="movimientosService.limpiarMovimientos()"
      />

      <section class="grid">
        <app-simulador-financiero
          [progreso]="progreso()"
          [calculando]="calculando()"
          [movimientosDisponibles]="movimientosService.movimientos().length"
          [resultado]="resultadoSimulacion()"
          [moneda]="moneda()"
          (ejecutarSimulacion)="ejecutarSimulacion($event)"
        />

        <app-historial-simulaciones
          [historial]="simulacionesService.historial()"
          [moneda]="moneda()"
          (limpiarHistorial)="simulacionesService.limpiarHistorial()"
        />
      </section>
    </main>
  `,

  styles: `
    .page {
      min-height: 100vh;
      padding: 32px;
      background: #f4f6f8;
      font-family: Arial, sans-serif;
      color: #1f2937;
    }

    .hero {
      max-width: 1150px;
      margin: 0 auto 24px;
      padding: 32px;
      background: #111827;
      color: white;
      border-radius: 22px;
      text-align: center;
    }

    .hero h1 {
      margin: 0 0 12px;
      font-size: 38px;
    }

    .hero p {
      margin: 0;
      color: #d1d5db;
      font-size: 18px;
      line-height: 1.5;
    }

    .grid {
      max-width: 1150px;
      margin: 24px auto;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }

    app-resumen-presupuesto,
    app-lista-movimientos {
      display: block;
      max-width: 1150px;
      margin: 24px auto;
    }

    @media (max-width: 900px) {
      .grid {
        grid-template-columns: 1fr;
      }

      .page {
        padding: 18px;
      }
    }
  `
})
export class PresupuestoComponent implements OnInit {
  /*
    LocalStorageService se declara como privado porque solo se usa
    dentro de esta clase.

    Su función es guardar y recuperar datos persistentes del navegador.
  */
  private localStorageService = inject(LocalStorageService);

  /*
    MovimientosService se deja público porque el template necesita acceder
    directamente a sus signals:

    - movimientosService.movimientos()
    - movimientosService.resumen()

    Este servicio administra ingresos, gastos y el resumen del presupuesto.
  */
  movimientosService = inject(MovimientosService);

  /*
    SimulacionesService también se deja público porque el template necesita
    mostrar el historial de simulaciones.

    Este historial se mantiene en LocalStorage.
  */
  simulacionesService = inject(SimulacionesService);

  /*
    Signal que almacena el nombre del usuario.

    Este dato se recupera desde LocalStorage al cargar la página
    y puede modificarse desde el componente de configuración.
  */
  usuario = signal('');

  /*
    Signal que almacena la moneda seleccionada.

    El valor inicial es MXN, pero si ya existe una moneda guardada
    en LocalStorage, se reemplaza durante ngOnInit.
  */
  moneda = signal('MXN');

  /*
    Signal que representa el porcentaje de avance del Web Worker.

    Se actualiza conforme el worker envía mensajes de progreso.
  */
  progreso = signal(0);

  /*
    Signal que indica si actualmente hay una simulación ejecutándose.

    Sirve para deshabilitar botones y evitar ejecutar varias simulaciones
    al mismo tiempo.
  */
  calculando = signal(false);

  /*
    Signal que almacena el resultado final de la simulación financiera.

    Mientras no exista resultado, su valor es null.
  */
  resultadoSimulacion = signal<ResultadoSimulacion | null>(null);

  /*
    ngOnInit se ejecuta una vez cuando Angular crea el componente.

    Aquí se recuperan los datos persistidos en LocalStorage:
    - nombre del usuario;
    - moneda seleccionada.

    Esto demuestra que LocalStorage conserva información aunque
    la página se recargue.
  */
  ngOnInit(): void {
    this.usuario.set(this.localStorageService.obtenerUsuario());
    this.moneda.set(this.localStorageService.obtenerMoneda());
  }

  /*
    Guarda la configuración general del usuario.

    Este método se ejecuta cuando el componente hijo
    ConfiguracionLocalComponent emite el evento guardarConfiguracion.

    Los datos se almacenan en LocalStorage mediante el servicio,
    no directamente desde el componente visual.
  */
  guardarConfiguracion(): void {
    this.localStorageService.guardarUsuario(this.usuario());
    this.localStorageService.guardarMoneda(this.moneda());
  }

  /*
    Recibe un movimiento emitido por FormularioMovimientoComponent.

    El formulario solo captura y valida los datos.
    La página principal recibe el evento y delega el guardado
    a MovimientosService.

    MovimientosService se encarga de:
    - agregar el movimiento a la lista;
    - actualizar los signals;
    - guardar la nueva lista en LocalStorage.
  */
  agregarMovimiento(evento: {
    tipo: TipoMovimiento;
    concepto: string;
    categoria: string;
    monto: number;
  }): void {
    this.movimientosService.agregarMovimiento(
      evento.tipo,
      evento.concepto,
      evento.categoria,
      evento.monto
    );
  }

  /*
    Ejecuta una simulación financiera usando un Web Worker.

    Este método se activa cuando SimuladorFinancieroComponent emite
    el evento ejecutarSimulacion.

    Se usa Web Worker porque la simulación puede incluir cálculos
    intensivos. Al mover esos cálculos a otro hilo, la interfaz
    permanece disponible y no se congela.
  */
  ejecutarSimulacion(config: SimulacionConfig): void {
    /*
      Si ya hay una simulación en proceso, se detiene el método.

      Esto evita crear varios workers al mismo tiempo por clics repetidos.
    */
    if (this.calculando()) {
      return;
    }

    /*
      Se prepara el estado visual antes de iniciar el cálculo.

      - calculando: activa el estado de carga.
      - progreso: reinicia la barra de avance.
      - resultadoSimulacion: limpia el resultado anterior.
    */
    this.calculando.set(true);
    this.progreso.set(0);
    this.resultadoSimulacion.set(null);

    /*
      Creación del Web Worker.

      La ruta se calcula desde este archivo:
      src/app/pages/presupuesto/presupuesto.ts

      Para llegar al worker:
      - se sube a pages;
      - se sube a app;
      - se entra a workers.

      El parámetro { type: 'module' } permite usar el worker como módulo
      moderno compatible con Angular.
    */
    const worker = new Worker(
      new URL('../../workers/simulacion-presupuesto.worker', import.meta.url),
      { type: 'module' }
    );

    /*
      Envío de datos al Web Worker.

      postMessage permite mandar información desde el hilo principal
      hacia el worker.

      Se envían:
      - todos los movimientos registrados;
      - la meta de ahorro;
      - el porcentaje de reducción de gastos;
      - los meses de proyección.
    */
    worker.postMessage({
      movimientos: this.movimientosService.movimientos(),
      metaAhorro: config.metaAhorro,
      reduccionGastos: config.reduccionGastos,
      meses: config.meses
    });

    /*
      Recepción de mensajes enviados por el Web Worker.

      El worker puede responder con dos tipos de mensajes:

      1. progreso:
         Actualiza la barra de avance.

      2. resultado:
         Entrega el resultado final de la simulación.
    */
    worker.onmessage = ({ data }) => {
      /*
        Si el worker reporta progreso, se actualiza el signal progreso.

        Al ser un signal, Angular actualiza la vista automáticamente.
      */
      if (data.tipo === 'progreso') {
        this.progreso.set(data.progreso);
      }

      /*
        Si el worker reporta resultado, se finaliza el proceso.

        En este bloque:
        - se guarda el resultado en pantalla;
        - se desactiva el estado de carga;
        - se guarda la simulación en historial;
        - se termina el worker para liberar recursos.
      */
      if (data.tipo === 'resultado') {
        this.resultadoSimulacion.set(data.resultado);
        this.calculando.set(false);

        this.guardarSimulacionEnHistorial(config, data.resultado);

        worker.terminate();
      }
    };
  }

  /*
    Guarda el resultado de una simulación en el historial local.

    Este método es privado porque solo debe ser usado dentro
    de PresupuestoComponent.

    El historial permite mostrar al usuario simulaciones anteriores
    y se conserva mediante LocalStorage a través de SimulacionesService.
  */
  private guardarSimulacionEnHistorial(
    config: SimulacionConfig,
    resultado: ResultadoSimulacion
  ): void {
    /*
      Se construye un objeto con la información relevante
      de la simulación realizada.
    */
    const nuevoRegistro: HistorialSimulacion = {
      fecha: new Date().toLocaleString(),
      metaAhorro: config.metaAhorro,
      reduccionGastos: config.reduccionGastos,
      meses: config.meses,
      ahorroProyectado: resultado.ahorroProyectado,
      mesesParaMeta: resultado.mesesParaMeta
    };

    /*
      Se envía el nuevo registro al servicio de simulaciones.

      Ese servicio actualiza el signal del historial y lo guarda
      en LocalStorage.
    */
    this.simulacionesService.agregarSimulacion(nuevoRegistro);
  }
}