/*
  Modelos para gráficas.

  Estos modelos permiten manejar datos de forma estándar para los componentes
  de gráficas del sistema.

  Se usan para representar información proveniente del backend FastAPI,
  por ejemplo:
  - ventas por día
  - ventas por categoría
  - ventas por zona del mapa
  - pedidos por estado
  - productos más vendidos

  El backend debe devolver objetos compatibles con ChartPanelData.
*/

/*
  Tipos de gráfica que podrá manejar el componente chart-panel.

  Aunque actualmente el componente renderiza barras simples,
  se deja preparado para futuras integraciones con librerías como:
  - Chart.js
  - ngx-charts
  - ECharts
*/
export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'area';

/*
  Punto individual de una gráfica.

  Ejemplo:
  {
    label: 'Café americano',
    value: 120
  }
*/
export interface ChartDataPoint {
  /*
    Etiqueta visible en la gráfica.
  */
  label: string;

  /*
    Valor numérico representado.
  */
  value: number;
}

/*
  Serie de datos para gráficas comparativas.

  Ejemplo:
  Ventas por mes:
  - Serie 1: 2025
  - Serie 2: 2026
*/
export interface ChartSeries {
  /*
    Nombre de la serie.
  */
  name: string;

  /*
    Datos de la serie.
  */
  data: ChartDataPoint[];
}

/*
  Configuración general para una gráfica.
*/
export interface ChartConfig {
  /*
    Título de la gráfica.
  */
  title: string;

  /*
    Subtítulo opcional.
  */
  subtitle?: string | null;

  /*
    Tipo de gráfica.
  */
  type: ChartType;

  /*
    Indica si se debe mostrar leyenda.
  */
  showLegend?: boolean;

  /*
    Indica si se deben mostrar etiquetas de valores.
  */
  showValues?: boolean;

  /*
    Nombre del eje X.
  */
  xAxisLabel?: string;

  /*
    Nombre del eje Y.
  */
  yAxisLabel?: string;
}

/*
  Modelo completo de datos para el panel de gráfica.

  Esta estructura queda alineada con el backend:

  {
    config: {
      title: string,
      subtitle?: string,
      type: 'bar'
    },
    data: [
      {
        label: string,
        value: number
      }
    ]
  }
*/
export interface ChartPanelData {
  /*
    Configuración visual y descriptiva de la gráfica.
  */
  config: ChartConfig;

  /*
    Datos simples para la gráfica.
  */
  data: ChartDataPoint[];

  /*
    Series múltiples para gráficas comparativas.

    Actualmente no se renderizan en ChartPanel,
    pero se conserva para crecimiento posterior.
  */
  series?: ChartSeries[];
}