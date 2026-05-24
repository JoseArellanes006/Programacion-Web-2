/*
  ============================================================
  COMPONENTE: DASHBOARD DEL SENSOR
  ============================================================

  Este componente representa la pantalla principal del sistema.

  Responsabilidades:

  1. Consultar la bitácora desde el backend.
  2. Consultar el resumen de eventos.
  3. Consultar los datos para las gráficas.
  4. Mostrar tarjetas de resumen.
  5. Mostrar gráficas con Chart.js.
  6. Mostrar una tabla con Angular Material.
  7. Actualizar automáticamente la información cada 3 segundos.

  Este componente es standalone, por lo que importa directamente
  los módulos que necesita.
*/

import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';


/*
  ============================================================
  IMPORTACIONES DE ANGULAR MATERIAL
  ============================================================

  Angular Material se usa para construir la interfaz visual.

  En este componente usamos:

  - Toolbar
  - Cards
  - Buttons
  - Tables
  - Icons
  - Chips
  - Spinner
*/

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


/*
  ============================================================
  IMPORTACIONES DE CHART.JS
  ============================================================

  Chart.js permite crear gráficas.

  registerables contiene los elementos necesarios para que Chart.js
  pueda usar diferentes tipos de gráficas:

  - line
  - bar
  - doughnut
*/

import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables
} from 'chart.js';


/*
  ============================================================
  MODELOS Y SERVICIO
  ============================================================
*/

import {
  SensorEvento,
  SensorResumen,
  SensorGraficas
} from '../../models/sensor-evento.model';

import { SensorService } from '../../services/sensor';


/*
  ============================================================
  REGISTRO DE CHART.JS
  ============================================================

  Antes de usar Chart.js, registramos los componentes disponibles.

  Si no se hace esto, Chart.js puede marcar errores al intentar crear
  gráficas.
*/

Chart.register(...registerables);


@Component({
  selector: 'app-dashboard-sensor',
  standalone: true,

  /*
    ============================================================
    MÓDULOS IMPORTADOS POR EL COMPONENTE
    ============================================================

    Como este componente es standalone, debe importar aquí todo lo que usa
    en su HTML.
  */

  imports: [
    CommonModule,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],

  templateUrl: './dashboard-sensor.html',
  styleUrl: './dashboard-sensor.scss'
})
export class DashboardSensorComponent implements AfterViewInit, OnDestroy {

  /*
    ============================================================
    INYECCIÓN DEL SERVICIO
    ============================================================

    SensorService contiene los métodos para comunicarse con FastAPI.
  */

  private sensorService = inject(SensorService);


  /*
    ============================================================
    REFERENCIAS A LOS CANVAS
    ============================================================

    Las gráficas de Chart.js se dibujan sobre elementos <canvas>.

    @ViewChild permite obtener una referencia desde TypeScript
    hacia esos elementos del HTML.

    En el HTML aparecen así:

        <canvas #graficaLinea></canvas>
        <canvas #graficaBarras></canvas>
        <canvas #graficaDona></canvas>
  */

  @ViewChild('graficaLinea') graficaLineaRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficaBarras') graficaBarrasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficaDona') graficaDonaRef!: ElementRef<HTMLCanvasElement>;


  /*
    ============================================================
    SIGNALS
    ============================================================

    Los signals permiten manejar estado reactivo en Angular moderno.

    Cuando cambia el valor de un signal, Angular actualiza automáticamente
    la parte del HTML donde se usa.

    eventos:
    Guarda la bitácora.

    resumen:
    Guarda los totales principales.

    cargando:
    Indica si la aplicación está cargando datos.

    error:
    Guarda mensajes de error.
  */

  eventos = signal<SensorEvento[]>([]);

  resumen = signal<SensorResumen>({
    total_eventos: 0,
    total_detectados: 0,
    total_no_detectados: 0
  });

  cargando = signal<boolean>(false);
  error = signal<string>('');


  /*
    ============================================================
    COLUMNAS DE LA TABLA
    ============================================================

    Angular Material necesita saber qué columnas se mostrarán.

    Estos nombres deben coincidir con los matColumnDef del HTML.
  */

  columnasTabla: string[] = [
    'id',
    'fecha',
    'hora',
    'unidad',
    'sensor',
    'estado'
  ];


  /*
    ============================================================
    COMPUTED: porcentajeDeteccion
    ============================================================

    computed calcula un valor a partir de otros signals.

    Aquí se calcula el porcentaje de detecciones:

        total_detectados / total_eventos * 100

    Si no hay eventos, se retorna 0 para evitar división entre cero.
  */

  porcentajeDeteccion = computed(() => {
    const datosResumen = this.resumen();

    if (datosResumen.total_eventos === 0) {
      return 0;
    }

    return Math.round(
      (datosResumen.total_detectados / datosResumen.total_eventos) * 100
    );
  });


  /*
    ============================================================
    VARIABLES PARA LAS GRÁFICAS
    ============================================================

    Guardamos las instancias de Chart.js para poder destruirlas
    antes de volver a dibujarlas.

    Esto es importante porque el dashboard se actualiza cada 3 segundos.
    Si no destruimos la gráfica anterior, se pueden duplicar gráficas
    o generar errores.
  */

  private graficaLinea?: Chart;
  private graficaBarras?: Chart;
  private graficaDona?: Chart;


  /*
    ============================================================
    INTERVALO DE ACTUALIZACIÓN
    ============================================================

    Esta variable guarda el setInterval que actualiza los datos
    automáticamente.
  */

  private intervaloActualizacion?: ReturnType<typeof setInterval>;


  /*
    ============================================================
    CICLO DE VIDA: ngAfterViewInit()
    ============================================================

    Este método se ejecuta después de que Angular ya creó la vista HTML.

    Es importante usarlo porque las gráficas necesitan que los canvas
    ya existan en pantalla.

    Aquí:
    - Se cargan los datos por primera vez.
    - Se configura actualización automática cada 3 segundos.
  */

  ngAfterViewInit(): void {
    this.cargarDatos();

    this.intervaloActualizacion = setInterval(() => {
      this.cargarDatos();
    }, 3000);
  }


  /*
    ============================================================
    CICLO DE VIDA: ngOnDestroy()
    ============================================================

    Este método se ejecuta cuando el componente se destruye.

    Aquí limpiamos:
    - El intervalo de actualización.
    - Las gráficas de Chart.js.

    Esto evita consumo innecesario de memoria.
  */

  ngOnDestroy(): void {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
    }

    this.destruirGraficas();
  }


  /*
    ============================================================
    MÉTODO: cargarDatos()
    ============================================================

    Este método consulta al backend para obtener:

    1. Bitácora de eventos.
    2. Resumen.
    3. Datos de las gráficas.

    Cada llamada usa subscribe porque HttpClient devuelve Observables.

    En esta versión didáctica se hacen tres peticiones separadas para que
    los alumnos puedan identificar claramente qué endpoint se usa para
    cada parte del dashboard.
  */

  cargarDatos(): void {
    this.cargando.set(true);
    this.error.set('');

    /*
      Consulta de la bitácora.
    */
    this.sensorService.obtenerEventos().subscribe({
      next: (eventos) => {
        this.eventos.set(eventos);
      },
      error: () => {
        this.error.set('No se pudo cargar la bitácora de eventos.');
      }
    });

    /*
      Consulta del resumen.
    */
    this.sensorService.obtenerResumen().subscribe({
      next: (resumen) => {
        this.resumen.set(resumen);
      },
      error: () => {
        this.error.set('No se pudo cargar el resumen del sensor.');
      }
    });

    /*
      Consulta de los datos para las gráficas.
    */
    this.sensorService.obtenerGraficas().subscribe({
      next: (graficas) => {
        this.renderizarGraficas(graficas);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las gráficas.');
        this.cargando.set(false);
      }
    });
  }


  /*
    ============================================================
    MÉTODO: limpiarBitacora()
    ============================================================

    Este método elimina todos los eventos registrados.

    Antes de borrar, se pide confirmación al usuario.

    Después de limpiar la bitácora, se vuelven a cargar los datos.
  */

  limpiarBitacora(): void {
    const confirmar = confirm('¿Seguro que deseas limpiar toda la bitácora?');

    if (!confirmar) {
      return;
    }

    this.sensorService.limpiarBitacora().subscribe({
      next: () => {
        this.cargarDatos();
      },
      error: () => {
        this.error.set('No se pudo limpiar la bitácora.');
      }
    });
  }


  /*
    ============================================================
    MÉTODO: renderizarGraficas()
    ============================================================

    Este método recibe todos los datos de gráficas y llama a los métodos
    específicos para dibujar cada una.

    Gráficas:
    - Línea.
    - Barras.
    - Dona.
  */

  private renderizarGraficas(graficas: SensorGraficas): void {
    this.renderizarGraficaLinea(graficas);
    this.renderizarGraficaBarras(graficas);
    this.renderizarGraficaDona(graficas);
  }


  /*
    ============================================================
    MÉTODO: renderizarGraficaLinea()
    ============================================================

    Esta es la gráfica principal del proyecto.

    Muestra cuántas detecciones ocurrieron por minuto.

    Eje X:
    - Minutos.

    Eje Y:
    - Cantidad de detecciones.

    Esta gráfica permite ver subidas y caídas en la detección
    con respecto al tiempo.
  */

  private renderizarGraficaLinea(graficas: SensorGraficas): void {
    if (!this.graficaLineaRef) {
      return;
    }

    /*
      Si ya existe una gráfica anterior, se destruye antes de crear una nueva.
    */
    if (this.graficaLinea) {
      this.graficaLinea.destroy();
    }

    const labels = graficas.linea_detecciones_por_minuto.labels;
    const data = graficas.linea_detecciones_por_minuto.data;

    const config: ChartConfiguration = {
      type: 'line' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Detecciones por minuto',
            data,
            tension: 0.35,
            fill: false,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Detecciones por minuto'
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Minuto'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            },
            title: {
              display: true,
              text: 'Cantidad de detecciones'
            }
          }
        }
      }
    };

    this.graficaLinea = new Chart(
      this.graficaLineaRef.nativeElement,
      config
    );
  }


  /*
    ============================================================
    MÉTODO: renderizarGraficaBarras()
    ============================================================

    Esta gráfica compara:

    - Detectado.
    - No detectado.

    Sirve para observar cuántos eventos pertenecen a cada estado.
  */

  private renderizarGraficaBarras(graficas: SensorGraficas): void {
    if (!this.graficaBarrasRef) {
      return;
    }

    if (this.graficaBarras) {
      this.graficaBarras.destroy();
    }

    const labels = graficas.barras_estado_sensor.labels;
    const data = graficas.barras_estado_sensor.data;

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Eventos registrados',
            data,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true
          },
          title: {
            display: true,
            text: 'Detectado vs No detectado'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    };

    this.graficaBarras = new Chart(
      this.graficaBarrasRef.nativeElement,
      config
    );
  }


  /*
    ============================================================
    MÉTODO: renderizarGraficaDona()
    ============================================================

    Esta gráfica muestra la distribución porcentual visual
    de los estados del sensor.

    Usa los mismos datos que la gráfica de barras,
    pero con otra representación visual.
  */

  private renderizarGraficaDona(graficas: SensorGraficas): void {
    if (!this.graficaDonaRef) {
      return;
    }

    if (this.graficaDona) {
      this.graficaDona.destroy();
    }

    const labels = graficas.dona_estado_sensor.labels;
    const data = graficas.dona_estado_sensor.data;

    const config: ChartConfiguration = {
      type: 'doughnut' as ChartType,
      data: {
        labels,
        datasets: [
          {
            label: 'Porcentaje de estados',
            data
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: true,
            text: 'Distribución de estados'
          }
        }
      }
    };

    this.graficaDona = new Chart(
      this.graficaDonaRef.nativeElement,
      config
    );
  }


  /*
    ============================================================
    MÉTODO: destruirGraficas()
    ============================================================

    Destruye las gráficas existentes.

    Se usa cuando el componente se elimina de pantalla.
  */

  private destruirGraficas(): void {
    if (this.graficaLinea) {
      this.graficaLinea.destroy();
    }

    if (this.graficaBarras) {
      this.graficaBarras.destroy();
    }

    if (this.graficaDona) {
      this.graficaDona.destroy();
    }
  }
}