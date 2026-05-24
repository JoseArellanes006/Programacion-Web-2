"""
Schemas del dashboard.

Este archivo define las respuestas que se enviarán al frontend Angular
para mostrar indicadores, resúmenes, tablas y gráficas.

El dashboard toma información real desde MongoDB:
- pedidos
- productos
- usuarios
- zonas del mapa

Importante:
El endpoint /dashboard/summary devuelve una estructura adaptada al frontend:
- kpis como lista de tarjetas
- salesChart como panel de gráfica
- categoryChart como panel de gráfica
- zoneChart como panel de gráfica
- topProducts como tabla
- recentOrders como tabla
"""

from datetime import datetime

from pydantic import BaseModel


class DashboardKpiResponse(BaseModel):
    """
    Indicadores principales del sistema en formato numérico.

    Este schema se usa para:
    GET /dashboard/kpis
    """

    totalSales: float
    totalOrders: int
    totalProducts: int
    totalCustomers: int
    averageTicket: float
    pendingOrders: int
    paidOrders: int
    cancelledOrders: int
    deliveredOrders: int


class DashboardKpiCardResponse(BaseModel):
    """
    KPI adaptado para tarjetas visuales en Angular.
    """

    title: str
    value: str | int | float
    subtitle: str | None = None
    icon: str | None = None
    tone: str | None = None


class SalesSummaryItemResponse(BaseModel):
    """
    Resumen de ventas agrupado por fecha.
    """

    date: str
    totalSales: float
    totalOrders: int


class TopProductResponse(BaseModel):
    """
    Producto más vendido en formato detallado para endpoint individual.
    """

    productId: str
    productName: str
    category: str
    totalQuantity: int
    totalSales: float


class DashboardTopProductResponse(BaseModel):
    """
    Producto más vendido adaptado para la tabla del frontend.

    El frontend usa columnas:
    - name
    - category
    - unitsSold
    - revenue
    """

    name: str
    category: str
    unitsSold: int
    revenue: float


class DashboardRecentOrderResponse(BaseModel):
    """
    Pedido reciente adaptado para la tabla del frontend.

    El frontend usa columnas:
    - id
    - customerName
    - total
    - status
    - createdAt
    """

    id: str
    customerName: str
    total: float
    status: str
    createdAt: datetime | None = None


class SalesByCategoryResponse(BaseModel):
    """
    Ventas agrupadas por categoría.
    """

    category: str
    totalSales: float
    totalQuantity: int


class SalesByZoneResponse(BaseModel):
    """
    Ventas agrupadas por zona del mapa.
    """

    zoneId: str | None = None
    zoneName: str
    totalSales: float
    totalOrders: int


class ChartConfigResponse(BaseModel):
    """
    Configuración visual de un panel de gráfica.
    """

    title: str
    subtitle: str | None = None
    type: str = "bar"


class ChartDataPointResponse(BaseModel):
    """
    Punto individual de datos para una gráfica.
    """

    label: str
    value: float


class ChartPanelResponse(BaseModel):
    """
    Estructura compatible con ChartPanel de Angular.
    """

    config: ChartConfigResponse
    data: list[ChartDataPointResponse]


class DashboardSummaryResponse(BaseModel):
    """
    Respuesta general del dashboard.

    Esta estructura está adaptada para el frontend Angular actual.
    """

    generatedAt: datetime
    kpis: list[DashboardKpiCardResponse]
    salesChart: ChartPanelResponse
    categoryChart: ChartPanelResponse
    zoneChart: ChartPanelResponse
    topProducts: list[DashboardTopProductResponse]
    recentOrders: list[DashboardRecentOrderResponse]