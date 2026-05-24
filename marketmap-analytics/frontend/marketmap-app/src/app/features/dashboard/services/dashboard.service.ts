/*
  Servicio del dashboard.

  Este servicio NO almacena datos simulados ni funciona como base de datos.

  Su responsabilidad es comunicarse con el backend FastAPI para obtener
  la información resumida que se mostrará en la pantalla principal.

  El backend es responsable de:
  - consultar MongoDB
  - calcular KPI's
  - calcular ventas por día
  - calcular ventas por categoría
  - calcular ventas por zona
  - obtener productos más vendidos
  - obtener pedidos recientes

  Angular consume la API, normaliza la respuesta y administra el estado visual.
*/

import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';
import {
  DashboardSummary,
  RecentOrder,
  TopProduct
} from '../models/dashboard-summary.model';

import { ChartPanelData } from '../../../shared/models/chart-data.model';
import { Kpi } from '../../../shared/models/kpi.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  /*
    HttpClient permite consumir endpoints del backend FastAPI.
  */
  private readonly http = inject(HttpClient);

  /*
    Signal privado con la información más reciente del dashboard.
  */
  private readonly dashboardSummarySignal = signal<DashboardSummary | null>(null);

  /*
    Signal público de solo lectura.

    Permite que los componentes consulten el último estado cargado
    sin modificarlo directamente.
  */
  readonly dashboardSummary = this.dashboardSummarySignal.asReadonly();

  /*
    Obtiene el resumen completo del dashboard desde FastAPI.

    Endpoint:
    GET /dashboard/summary
  */
  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http
      .get<DashboardSummary>(API_CONFIG.dashboard.summary)
      .pipe(
        map((summary) => this.normalizeDashboardSummary(summary)),
        tap((summary) => {
          this.dashboardSummarySignal.set(summary);
        })
      );
  }

  /*
    Normaliza la respuesta recibida desde FastAPI.

    Esto evita errores cuando:
    - kpis no viene como arreglo
    - topProducts no viene como arreglo
    - recentOrders no viene como arreglo
    - una gráfica viene incompleta
  */
  private normalizeDashboardSummary(summary: DashboardSummary): DashboardSummary {
    return {
      generatedAt: this.normalizeGeneratedAt(summary?.generatedAt),

      kpis: this.normalizeKpis(summary?.kpis),

      salesChart: this.normalizeChart(
        summary?.salesChart,
        'Ventas por día',
        'Ingresos agrupados por fecha'
      ),

      categoryChart: this.normalizeChart(
        summary?.categoryChart,
        'Ventas por categoría',
        'Ingresos agrupados por categoría'
      ),

      zoneChart: this.normalizeChart(
        summary?.zoneChart,
        'Ventas por zona',
        'Actividad comercial por zona'
      ),

      topProducts: this.normalizeTopProducts(summary?.topProducts),

      recentOrders: this.normalizeRecentOrders(summary?.recentOrders)
    };
  }

  /*
    Normaliza fecha de generación.
  */
  private normalizeGeneratedAt(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return new Date().toISOString();
    }

    return value;
  }

  /*
    Normaliza KPI's.
  */
  private normalizeKpis(value: Kpi[] | null | undefined): Kpi[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value;
  }

  /*
    Normaliza una gráfica.
  */
  private normalizeChart(
    chart: ChartPanelData | null | undefined,
    fallbackTitle: string,
    fallbackSubtitle: string
  ): ChartPanelData {
    const data = Array.isArray(chart?.data)
      ? chart.data
      : [];

    return {
      config: {
        title: chart?.config?.title || fallbackTitle,
        subtitle: chart?.config?.subtitle || fallbackSubtitle,
        type: chart?.config?.type || 'bar'
      },
      data
    };
  }

  /*
    Normaliza productos más vendidos.
  */
  private normalizeTopProducts(
    value: TopProduct[] | null | undefined
  ): TopProduct[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => {
      return {
        name: item?.name || 'Sin nombre',
        category: item?.category || 'Sin categoría',
        unitsSold: Number(item?.unitsSold ?? 0),
        revenue: Number(item?.revenue ?? 0)
      };
    });
  }

  /*
    Normaliza pedidos recientes.
  */
  private normalizeRecentOrders(
    value: RecentOrder[] | null | undefined
  ): RecentOrder[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.map((item) => {
      return {
        id: item?.id || 'Sin ID',
        customerName: item?.customerName || 'Cliente no registrado',
        total: Number(item?.total ?? 0),
        status: item?.status || 'PENDING',
        createdAt: item?.createdAt ?? null
      };
    });
  }

  /*
    Limpia la información actual del dashboard.

    Esto puede ser útil al cerrar sesión o al cambiar de contexto
    si más adelante el sistema maneja sucursales, negocios o tenants.
  */
  clearDashboardSummary(): void {
    this.dashboardSummarySignal.set(null);
  }
}