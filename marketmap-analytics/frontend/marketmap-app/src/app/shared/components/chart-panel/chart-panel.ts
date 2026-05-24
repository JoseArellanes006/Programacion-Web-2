/*
  Componente de panel de gráfica.

  Este componente muestra datos de forma visual sin depender todavía
  de una librería externa de gráficas.

  Recibe datos desde componentes como Dashboard y los representa
  mediante barras simples.

  Está preparado para trabajar con datos provenientes del backend,
  validando que:
  - chart exista
  - chart.data sea un arreglo
  - cada punto tenga label válido
  - cada punto tenga value numérico
  - los valores negativos no rompan la visualización

  Más adelante puede reemplazarse internamente por:
  - Chart.js
  - ngx-charts
  - ECharts

  Por ahora mantiene una implementación ligera, estable y compilable.
*/

import { Component, Input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  ChartDataPoint,
  ChartPanelData,
  ChartType
} from '../../models/chart-data.model';

@Component({
  selector: 'app-chart-panel',
  imports: [
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './chart-panel.html',
  styleUrl: './chart-panel.scss'
})
export class ChartPanel {
  /*
    Datos completos de la gráfica.

    Puede venir como null mientras el dashboard carga información
    desde el backend.
  */
  @Input() chart: ChartPanelData | null = null;

  /*
    Mensaje mostrado cuando no hay datos.
  */
  @Input() emptyMessage = 'No hay datos disponibles para graficar.';

  /*
    Título seguro de la gráfica.
  */
  protected get title(): string {
    const title = this.chart?.config?.title;

    if (!title || title.trim().length === 0) {
      return 'Gráfica';
    }

    return title.trim();
  }

  /*
    Subtítulo seguro de la gráfica.
  */
  protected get subtitle(): string | null {
    const subtitle = this.chart?.config?.subtitle;

    if (!subtitle || subtitle.trim().length === 0) {
      return null;
    }

    return subtitle.trim();
  }

  /*
    Tipo de gráfica.

    Aunque internamente se renderiza como barras simples,
    este campo permite mostrar el tipo conceptual recibido desde backend.
  */
  protected get chartType(): ChartType | null {
    const type = this.chart?.config?.type;

    if (!type) {
      return null;
    }

    return type;
  }

  /*
    Datos normalizados de la gráfica.

    Esta validación evita errores cuando el backend devuelve:
    - null
    - undefined
    - objeto en vez de arreglo
    - valores no numéricos
    - labels vacíos
    - valores negativos
  */
  protected get data(): ChartDataPoint[] {
    const rawData = this.chart?.data;

    if (!Array.isArray(rawData)) {
      return [];
    }

    return rawData
      .filter((item) => {
        return (
          item !== null &&
          typeof item === 'object' &&
          typeof item.label === 'string' &&
          item.label.trim().length > 0 &&
          typeof item.value === 'number' &&
          Number.isFinite(item.value)
        );
      })
      .map((item) => {
        return {
          label: item.label.trim(),
          value: item.value < 0 ? 0 : item.value
        };
      });
  }

  /*
    Indica si existen datos válidos para mostrar.
  */
  protected get hasData(): boolean {
    return this.data.length > 0;
  }

  /*
    Calcula el valor máximo para proporcionalidad visual de las barras.
  */
  protected get maxValue(): number {
    const values = this.data.map((item) => item.value);

    if (values.length === 0) {
      return 1;
    }

    return Math.max(...values, 1);
  }

  /*
    Calcula el ancho porcentual de una barra.
  */
  protected getBarWidth(value: number): string {
    if (!Number.isFinite(value) || value <= 0) {
      return '0%';
    }

    const percentage = (value / this.maxValue) * 100;

    return `${Math.min(percentage, 100)}%`;
  }

  /*
    Formatea el valor numérico de una gráfica.
  */
  protected formatValue(value: number): string {
    return new Intl.NumberFormat('es-MX').format(value);
  }

  /*
    track para @for.

    Evita que Angular dependa únicamente del label si en algún momento
    el backend devuelve etiquetas repetidas.
  */
  protected trackDataPoint(index: number, item: ChartDataPoint): string {
    return `${item.label}-${index}`;
  }
}