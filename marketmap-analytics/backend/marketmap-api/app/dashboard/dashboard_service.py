"""
Servicio del dashboard.

Este archivo concentra la lógica para calcular:
- KPI's generales
- ventas por fecha
- productos más vendidos
- ventas por categoría
- ventas por zona
- pedidos recientes

No usa datos simulados.
Todo se obtiene desde MongoDB.

El endpoint principal /dashboard/summary devuelve una estructura adaptada
al frontend Angular actual.
"""

from datetime import datetime, time, timezone

from app.core.database import get_collection
from app.dashboard.dashboard_schema import (
    ChartConfigResponse,
    ChartDataPointResponse,
    ChartPanelResponse,
    DashboardKpiCardResponse,
    DashboardKpiResponse,
    DashboardRecentOrderResponse,
    DashboardSummaryResponse,
    DashboardTopProductResponse,
    SalesByCategoryResponse,
    SalesByZoneResponse,
    SalesSummaryItemResponse,
    TopProductResponse
)


ORDERS_COLLECTION = "orders"
PRODUCTS_COLLECTION = "products"
USERS_COLLECTION = "users"
MAP_ZONES_COLLECTION = "map_zones"


def normalize_start_date(start_date: datetime | None) -> datetime | None:
    """
    Normaliza fecha inicial al inicio del día.
    """
    if start_date is None:
        return None

    return datetime.combine(
        start_date.date(),
        time.min,
        tzinfo=start_date.tzinfo or timezone.utc
    )


def normalize_end_date(end_date: datetime | None) -> datetime | None:
    """
    Normaliza fecha final al final del día.
    """
    if end_date is None:
        return None

    return datetime.combine(
        end_date.date(),
        time.max,
        tzinfo=end_date.tzinfo or timezone.utc
    )


def build_date_match(
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> dict:
    """
    Construye filtro por rango de fechas.
    """
    query: dict = {}

    normalized_start = normalize_start_date(start_date)
    normalized_end = normalize_end_date(end_date)

    if normalized_start or normalized_end:
        query["createdAt"] = {}

        if normalized_start:
            query["createdAt"]["$gte"] = normalized_start

        if normalized_end:
            query["createdAt"]["$lte"] = normalized_end

    return query


def format_currency(value: float) -> str:
    """
    Formatea moneda para tarjetas KPI del frontend.
    """
    return f"${value:,.2f}"


def build_dashboard_kpi_cards(
    kpis: DashboardKpiResponse
) -> list[DashboardKpiCardResponse]:
    """
    Convierte KPI's numéricos en tarjetas visuales para Angular.
    """
    return [
        DashboardKpiCardResponse(
            title="Ventas totales",
            value=format_currency(kpis.totalSales),
            subtitle="Ingresos registrados",
            icon="payments",
            tone="primary"
        ),
        DashboardKpiCardResponse(
            title="Pedidos",
            value=kpis.totalOrders,
            subtitle="Pedidos no cancelados",
            icon="receipt_long",
            tone="info"
        ),
        DashboardKpiCardResponse(
            title="Ticket promedio",
            value=format_currency(kpis.averageTicket),
            subtitle="Promedio por pedido",
            icon="trending_up",
            tone="success"
        ),
        DashboardKpiCardResponse(
            title="Productos",
            value=kpis.totalProducts,
            subtitle="Productos registrados",
            icon="inventory_2",
            tone="neutral"
        ),
        DashboardKpiCardResponse(
            title="Clientes",
            value=kpis.totalCustomers,
            subtitle="Usuarios tipo cliente",
            icon="group",
            tone="neutral"
        ),
        DashboardKpiCardResponse(
            title="Pendientes",
            value=kpis.pendingOrders,
            subtitle="Pedidos pendientes",
            icon="pending_actions",
            tone="warning"
        )
    ]


def build_sales_chart(
    sales_summary: list[SalesSummaryItemResponse]
) -> ChartPanelResponse:
    """
    Construye gráfica de ventas por día.
    """
    return ChartPanelResponse(
        config=ChartConfigResponse(
            title="Ventas por día",
            subtitle="Ingresos agrupados por fecha",
            type="bar"
        ),
        data=[
            ChartDataPointResponse(
                label=item.date,
                value=float(item.totalSales)
            )
            for item in sales_summary
        ]
    )


def build_category_chart(
    sales_by_category: list[SalesByCategoryResponse]
) -> ChartPanelResponse:
    """
    Construye gráfica de ventas por categoría.
    """
    return ChartPanelResponse(
        config=ChartConfigResponse(
            title="Ventas por categoría",
            subtitle="Ingresos agrupados por categoría",
            type="bar"
        ),
        data=[
            ChartDataPointResponse(
                label=item.category,
                value=float(item.totalSales)
            )
            for item in sales_by_category
        ]
    )


def build_zone_chart(
    sales_by_zone: list[SalesByZoneResponse]
) -> ChartPanelResponse:
    """
    Construye gráfica de ventas por zona.
    """
    return ChartPanelResponse(
        config=ChartConfigResponse(
            title="Ventas por zona",
            subtitle="Actividad comercial por zona",
            type="bar"
        ),
        data=[
            ChartDataPointResponse(
                label=item.zoneName,
                value=float(item.totalSales)
            )
            for item in sales_by_zone
        ]
    )


def build_dashboard_top_products(
    top_products: list[TopProductResponse]
) -> list[DashboardTopProductResponse]:
    """
    Adapta productos más vendidos al modelo de tabla del frontend.
    """
    return [
        DashboardTopProductResponse(
            name=item.productName,
            category=item.category,
            unitsSold=item.totalQuantity,
            revenue=item.totalSales
        )
        for item in top_products
    ]


async def get_dashboard_kpis(
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> DashboardKpiResponse:
    """
    Calcula KPI's principales del dashboard.
    """
    orders_collection = get_collection(ORDERS_COLLECTION)
    products_collection = get_collection(PRODUCTS_COLLECTION)
    users_collection = get_collection(USERS_COLLECTION)

    date_query = build_date_match(
        start_date=start_date,
        end_date=end_date
    )

    sales_pipeline = [
        {
            "$match": {
                **date_query,
                "status": {
                    "$ne": "CANCELLED"
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "totalSales": {
                    "$sum": "$total"
                },
                "totalOrders": {
                    "$sum": 1
                }
            }
        }
    ]

    sales_result = await orders_collection.aggregate(
        sales_pipeline
    ).to_list(length=1)

    if sales_result:
        total_sales = float(sales_result[0].get("totalSales", 0))
        total_orders = int(sales_result[0].get("totalOrders", 0))
    else:
        total_sales = 0
        total_orders = 0

    average_ticket = total_sales / total_orders if total_orders > 0 else 0

    total_products = await products_collection.count_documents({})

    total_customers = await users_collection.count_documents({
        "role": "CUSTOMER"
    })

    pending_orders = await orders_collection.count_documents({
        **date_query,
        "status": "PENDING"
    })

    paid_orders = await orders_collection.count_documents({
        **date_query,
        "status": "PAID"
    })

    cancelled_orders = await orders_collection.count_documents({
        **date_query,
        "status": "CANCELLED"
    })

    delivered_orders = await orders_collection.count_documents({
        **date_query,
        "status": "DELIVERED"
    })

    return DashboardKpiResponse(
        totalSales=total_sales,
        totalOrders=total_orders,
        totalProducts=total_products,
        totalCustomers=total_customers,
        averageTicket=average_ticket,
        pendingOrders=pending_orders,
        paidOrders=paid_orders,
        cancelledOrders=cancelled_orders,
        deliveredOrders=delivered_orders
    )


async def get_sales_summary(
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> list[SalesSummaryItemResponse]:
    """
    Obtiene ventas agrupadas por día.
    """
    orders_collection = get_collection(ORDERS_COLLECTION)

    date_query = build_date_match(
        start_date=start_date,
        end_date=end_date
    )

    pipeline = [
        {
            "$match": {
                **date_query,
                "status": {
                    "$ne": "CANCELLED"
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt"
                    }
                },
                "totalSales": {
                    "$sum": "$total"
                },
                "totalOrders": {
                    "$sum": 1
                }
            }
        },
        {
            "$sort": {
                "_id": 1
            }
        }
    ]

    result = await orders_collection.aggregate(
        pipeline
    ).to_list(length=365)

    return [
        SalesSummaryItemResponse(
            date=item["_id"],
            totalSales=float(item.get("totalSales", 0)),
            totalOrders=int(item.get("totalOrders", 0))
        )
        for item in result
    ]


async def get_top_products(
    limit: int = 10,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> list[TopProductResponse]:
    """
    Obtiene productos más vendidos.
    """
    orders_collection = get_collection(ORDERS_COLLECTION)

    date_query = build_date_match(
        start_date=start_date,
        end_date=end_date
    )

    pipeline = [
        {
            "$match": {
                **date_query,
                "status": {
                    "$ne": "CANCELLED"
                }
            }
        },
        {
            "$unwind": "$details"
        },
        {
            "$group": {
                "_id": "$details.productId",
                "productName": {
                    "$first": "$details.productName"
                },
                "category": {
                    "$first": "$details.category"
                },
                "totalQuantity": {
                    "$sum": "$details.quantity"
                },
                "totalSales": {
                    "$sum": "$details.subtotal"
                }
            }
        },
        {
            "$sort": {
                "totalQuantity": -1,
                "totalSales": -1
            }
        },
        {
            "$limit": limit
        }
    ]

    result = await orders_collection.aggregate(
        pipeline
    ).to_list(length=limit)

    return [
        TopProductResponse(
            productId=str(item.get("_id", "")),
            productName=item.get("productName") or "Sin nombre",
            category=item.get("category") or "Sin categoría",
            totalQuantity=int(item.get("totalQuantity", 0)),
            totalSales=float(item.get("totalSales", 0))
        )
        for item in result
    ]


async def get_sales_by_category(
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> list[SalesByCategoryResponse]:
    """
    Obtiene ventas agrupadas por categoría.
    """
    orders_collection = get_collection(ORDERS_COLLECTION)

    date_query = build_date_match(
        start_date=start_date,
        end_date=end_date
    )

    pipeline = [
        {
            "$match": {
                **date_query,
                "status": {
                    "$ne": "CANCELLED"
                }
            }
        },
        {
            "$unwind": "$details"
        },
        {
            "$group": {
                "_id": "$details.category",
                "totalSales": {
                    "$sum": "$details.subtotal"
                },
                "totalQuantity": {
                    "$sum": "$details.quantity"
                }
            }
        },
        {
            "$sort": {
                "totalSales": -1
            }
        }
    ]

    result = await orders_collection.aggregate(
        pipeline
    ).to_list(length=100)

    return [
        SalesByCategoryResponse(
            category=item.get("_id") or "Sin categoría",
            totalSales=float(item.get("totalSales", 0)),
            totalQuantity=int(item.get("totalQuantity", 0))
        )
        for item in result
    ]


async def get_sales_by_zone() -> list[SalesByZoneResponse]:
    """
    Obtiene ventas agrupadas por zona del mapa.

    Actualmente toma desde map_zones:
    - totalSales
    - totalOrders

    Cuando las órdenes estén relacionadas directamente con zonas,
    este método puede migrar a una agregación desde orders.
    """
    zones_collection = get_collection(MAP_ZONES_COLLECTION)

    cursor = zones_collection.find({}).sort("totalSales", -1)

    zones = await cursor.to_list(length=1000)

    return [
        SalesByZoneResponse(
            zoneId=str(zone.get("_id")),
            zoneName=zone.get("name") or "Sin zona",
            totalSales=float(zone.get("totalSales", 0)),
            totalOrders=int(zone.get("totalOrders", 0))
        )
        for zone in zones
    ]


async def get_recent_orders(
    limit: int = 10,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> list[DashboardRecentOrderResponse]:
    """
    Obtiene pedidos recientes para la tabla del dashboard.
    """
    orders_collection = get_collection(ORDERS_COLLECTION)

    date_query = build_date_match(
        start_date=start_date,
        end_date=end_date
    )

    cursor = orders_collection.find(
        date_query
    ).sort(
        "createdAt",
        -1
    ).limit(limit)

    orders = await cursor.to_list(length=limit)

    recent_orders: list[DashboardRecentOrderResponse] = []

    for order in orders:
        customer_name = (
            order.get("customerName")
            or order.get("userName")
            or order.get("clientName")
            or order.get("zoneName")
            or "Cliente no registrado"
        )

        recent_orders.append(
            DashboardRecentOrderResponse(
                id=str(order.get("_id")),
                customerName=customer_name,
                total=float(order.get("total", 0)),
                status=order.get("status", "PENDING"),
                createdAt=order.get("createdAt")
            )
        )

    return recent_orders


async def get_dashboard_summary(
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> DashboardSummaryResponse:
    """
    Obtiene toda la información principal del dashboard.

    Esta función adapta los datos reales de MongoDB a la estructura
    que consume actualmente Angular.
    """
    kpis = await get_dashboard_kpis(
        start_date=start_date,
        end_date=end_date
    )

    sales_summary = await get_sales_summary(
        start_date=start_date,
        end_date=end_date
    )

    top_products = await get_top_products(
        limit=10,
        start_date=start_date,
        end_date=end_date
    )

    sales_by_category = await get_sales_by_category(
        start_date=start_date,
        end_date=end_date
    )

    sales_by_zone = await get_sales_by_zone()

    recent_orders = await get_recent_orders(
        limit=10,
        start_date=start_date,
        end_date=end_date
    )

    return DashboardSummaryResponse(
        generatedAt=datetime.now(timezone.utc),
        kpis=build_dashboard_kpi_cards(kpis),
        salesChart=build_sales_chart(sales_summary),
        categoryChart=build_category_chart(sales_by_category),
        zoneChart=build_zone_chart(sales_by_zone),
        topProducts=build_dashboard_top_products(top_products),
        recentOrders=recent_orders
    )