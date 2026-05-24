/*
  Modelo principal del dashboard.

  Este archivo define la estructura de datos que usará la pantalla
  de dashboard para mostrar:
  - KPI's
  - gráficas
  - productos más vendidos
  - pedidos recientes

  Esta estructura está alineada con la respuesta del backend FastAPI:

  GET /dashboard/summary

  Respuesta esperada:
  - generatedAt
  - kpis
  - salesChart
  - categoryChart
  - zoneChart
  - topProducts
  - recentOrders
*/

import { ChartPanelData } from '../../../shared/models/chart-data.model';
import { Kpi } from '../../../shared/models/kpi.model';

/*
  Producto más vendido.

  Se usa para mostrar una tabla corta dentro del dashboard.

  Debe coincidir con DashboardTopProductResponse del backend:
  - name
  - category
  - unitsSold
  - revenue
*/
export interface TopProduct {
  /*
    Nombre del producto.
  */
  name: string;

  /*
    Categoría del producto.
  */
  category: string;

  /*
    Unidades vendidas.
  */
  unitsSold: number;

  /*
    Ingreso generado por ese producto.
  */
  revenue: number;
}

/*
  Pedido reciente.

  Se usa para mostrar actividad reciente en el dashboard.

  Debe coincidir con DashboardRecentOrderResponse del backend:
  - id
  - customerName
  - total
  - status
  - createdAt
*/
export interface RecentOrder {
  /*
    Identificador del pedido.
  */
  id: string;

  /*
    Nombre del cliente.
  */
  customerName: string;

  /*
    Total del pedido.
  */
  total: number;

  /*
    Estado del pedido.
  */
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'DELIVERED' | string;

  /*
    Fecha de creación del pedido.
  */
  createdAt: string | null;
}

/*
  Modelo completo del dashboard.

  Agrupa toda la información necesaria para pintar la página.
*/
export interface DashboardSummary {
  /*
    Fecha y hora de generación de la respuesta.
  */
  generatedAt: string;

  /*
    KPI's principales.

    En el backend ya vienen como lista de tarjetas visuales,
    no como objeto numérico.
  */
  kpis: Kpi[];

  /*
    Gráfica de ventas por día.
  */
  salesChart: ChartPanelData | null;

  /*
    Gráfica de ventas por categoría.
  */
  categoryChart: ChartPanelData | null;

  /*
    Gráfica de ventas por zona o área del mapa.
  */
  zoneChart: ChartPanelData | null;

  /*
    Productos más vendidos.
  */
  topProducts: TopProduct[];

  /*
    Pedidos recientes.
  */
  recentOrders: RecentOrder[];
}