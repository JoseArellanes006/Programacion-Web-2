/*
  Página principal del dashboard.

  Esta pantalla muestra una visión general del estado comercial del sistema.

  Incluye:
  - KPI's principales
  - gráficas
  - productos más vendidos
  - pedidos recientes

  Consume información real desde FastAPI mediante DashboardService.
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ChartPanel } from '../../../../shared/components/chart-panel/chart-panel';
import { DynamicTable } from '../../../../shared/components/dynamic-table/dynamic-table';
import { KpiCard } from '../../../../shared/components/kpi-card/kpi-card';

import { TableActionEvent, TableColumn } from '../../../../shared/models/table-column.model';

import {
  DashboardSummary,
  RecentOrder,
  TopProduct
} from '../../models/dashboard-summary.model';

import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    KpiCard,
    ChartPanel,
    DynamicTable
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  /*
    Servicio encargado de obtener la información del dashboard.
  */
  private readonly dashboardService = inject(DashboardService);

  /*
    Estado de carga de la pantalla.
  */
  protected readonly loading = signal(false);

  /*
    Mensaje de error en caso de que falle la carga.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Información completa del dashboard.
  */
  protected readonly summary = signal<DashboardSummary | null>(null);

  /*
    KPI's principales.

    El backend ya los devuelve como arreglo.
  */
  protected readonly kpis = computed(() => {
    const kpis = this.summary()?.kpis;

    if (!Array.isArray(kpis)) {
      return [];
    }

    return kpis;
  });

  /*
    Gráfica de ventas por día.
  */
  protected readonly salesChart = computed(() => {
    return this.summary()?.salesChart ?? null;
  });

  /*
    Gráfica de ventas por categoría.
  */
  protected readonly categoryChart = computed(() => {
    return this.summary()?.categoryChart ?? null;
  });

  /*
    Gráfica de ventas por zona del mapa interactivo.
  */
  protected readonly zoneChart = computed(() => {
    return this.summary()?.zoneChart ?? null;
  });

  /*
    Productos más vendidos.
  */
  protected readonly topProducts = computed(() => {
    const topProducts = this.summary()?.topProducts;

    if (!Array.isArray(topProducts)) {
      return [];
    }

    return topProducts;
  });

  /*
    Pedidos recientes.
  */
  protected readonly recentOrders = computed(() => {
    const recentOrders = this.summary()?.recentOrders;

    if (!Array.isArray(recentOrders)) {
      return [];
    }

    return recentOrders;
  });

  /*
    Fecha de última actualización.
  */
  protected readonly generatedAt = computed(() => {
    const value = this.summary()?.generatedAt;

    if (!value) {
      return null;
    }

    return new Date(value).toLocaleString('es-MX');
  });

  /*
    Columnas para la tabla de productos más vendidos.
  */
  protected readonly topProductColumns: TableColumn<TopProduct>[] = [
    {
      key: 'name',
      label: 'Producto',
      type: 'text',
      sortable: true
    },
    {
      key: 'category',
      label: 'Categoría',
      type: 'text',
      hideOnMobile: true
    },
    {
      key: 'unitsSold',
      label: 'Unidades',
      type: 'number',
      align: 'right'
    },
    {
      key: 'revenue',
      label: 'Ingresos',
      type: 'currency',
      align: 'right'
    }
  ];

  /*
    Columnas para la tabla de pedidos recientes.
  */
  protected readonly recentOrderColumns: TableColumn<RecentOrder>[] = [
    {
      key: 'id',
      label: 'Pedido',
      type: 'text'
    },
    {
      key: 'customerName',
      label: 'Cliente / Zona',
      type: 'text'
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      align: 'right'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      align: 'center'
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      type: 'date',
      hideOnMobile: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      align: 'center',
      actions: [
        {
          key: 'view',
          label: 'Ver'
        }
      ]
    }
  ];

  /*
    Al iniciar la pantalla se carga el resumen del dashboard.
  */
  ngOnInit(): void {
    this.loadDashboard();
  }

  /*
    Carga la información del dashboard.
  */
  protected loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.dashboardService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.summary.set(null);
        this.errorMessage.set('No fue posible cargar la información del dashboard.');
        this.loading.set(false);
      }
    });
  }

  /*
    Recibe acciones emitidas por la tabla de pedidos recientes.
  */
  protected handleOrderAction(event: TableActionEvent<RecentOrder>): void {
    console.log('Acción de pedido:', event);
  }
}