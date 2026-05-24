/*
  Componente de tarjeta KPI.

  Sirve para mostrar indicadores clave del dashboard.

  Ejemplos:
  - Ventas totales
  - Pedidos
  - Ticket promedio
  - Productos
  - Clientes
  - Pendientes

  Este componente está actualizado para trabajar con Angular Material:
  - usa mat-card como contenedor
  - usa mat-icon para mostrar íconos reales

  También queda alineado con el backend FastAPI, que devuelve:
  - title
  - value
  - subtitle
  - icon
  - tone
*/

import { Component, Input } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import {
  Kpi,
  KpiTone,
  KpiTrend,
  KpiVariant
} from '../../models/kpi.model';

@Component({
  selector: 'app-kpi-card',
  imports: [
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss'
})
export class KpiCard {
  /*
    Información del KPI que se mostrará.
  */
  @Input() kpi: Kpi | null = null;

  /*
    Título seguro del KPI.
  */
  protected get title(): string {
    return this.kpi?.title?.trim() || 'Indicador';
  }

  /*
    Valor seguro del KPI.
  */
  protected get value(): string | number {
    const value = this.kpi?.value;

    if (value === null || value === undefined || value === '') {
      return 0;
    }

    return value;
  }

  /*
    Texto secundario seguro.

    Prioridad:
    1. subtitle recibido desde backend
    2. description usado por la versión anterior
    3. change usado por compatibilidad
    4. "Sin cambio"
  */
  protected get subtitle(): string {
    const subtitle = this.kpi?.subtitle?.trim();

    if (subtitle) {
      return subtitle;
    }

    const description = this.kpi?.description?.trim();

    if (description) {
      return description;
    }

    const change = this.kpi?.change?.trim();

    if (change) {
      return change;
    }

    return 'Sin cambio';
  }

  /*
    Ícono seguro de Angular Material.

    Si el backend no manda ícono, se usa uno genérico.
  */
  protected get icon(): string {
    return this.kpi?.icon?.trim() || 'analytics';
  }

  /*
    Tendencia del KPI.

    Se conserva para compatibilidad con la versión anterior.
  */
  protected get trend(): KpiTrend {
    return this.kpi?.trend ?? 'neutral';
  }

  /*
    Porcentaje de cambio.

    Se conserva para compatibilidad.
  */
  protected get changePercentage(): number | null {
    const value = this.kpi?.changePercentage;

    if (value === null || value === undefined || !Number.isFinite(value)) {
      return null;
    }

    return value;
  }

  /*
    Indica si se debe mostrar el bloque de tendencia.

    Si el backend no manda trend ni changePercentage, no se muestra footer.
  */
  protected get showFooter(): boolean {
    return Boolean(this.kpi?.trend) || this.changePercentage !== null;
  }

  /*
    Devuelve clase CSS según tono o variante.

    Prioridad:
    1. tone recibido desde backend
    2. variant de la versión anterior
    3. primary por defecto
  */
  protected get toneClass(): string {
    const tone = this.normalizeTone(
      this.kpi?.tone ?? this.kpi?.variant ?? 'primary'
    );

    return `kpi-card--${tone}`;
  }

  /*
    Devuelve clase CSS según tendencia.
  */
  protected get trendClass(): string {
    return `kpi-card__trend--${this.trend}`;
  }

  /*
    Devuelve texto visual de tendencia.
  */
  protected get trendText(): string {
    if (this.trend === 'up') {
      return 'En aumento';
    }

    if (this.trend === 'down') {
      return 'En descenso';
    }

    return 'Sin cambio';
  }

  /*
    Devuelve el porcentaje de cambio formateado.
  */
  protected get changeText(): string {
    const value = this.changePercentage;

    if (value === null) {
      return '';
    }

    const sign = value > 0 ? '+' : value < 0 ? '-' : '';

    return `${sign}${Math.abs(value)}%`;
  }

  /*
    Normaliza el tono para evitar clases CSS inválidas.
  */
  private normalizeTone(
    value: KpiTone | KpiVariant | string | null | undefined
  ): KpiTone {
    const allowedTones: KpiTone[] = [
      'primary',
      'success',
      'warning',
      'danger',
      'info',
      'neutral'
    ];

    if (!value) {
      return 'primary';
    }

    if (allowedTones.includes(value as KpiTone)) {
      return value as KpiTone;
    }

    return 'primary';
  }
}