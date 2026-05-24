"""
Rutas del dashboard.

Endpoints:
- GET /dashboard/summary
- GET /dashboard/kpis
- GET /dashboard/sales-summary
- GET /dashboard/top-products
- GET /dashboard/sales-by-category
- GET /dashboard/sales-by-zone
"""

from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.core.permissions import can_view_reports
from app.dashboard.dashboard_schema import (
    DashboardKpiResponse,
    DashboardSummaryResponse,
    SalesByCategoryResponse,
    SalesByZoneResponse,
    SalesSummaryItemResponse,
    TopProductResponse
)
from app.dashboard.dashboard_service import (
    get_dashboard_kpis,
    get_dashboard_summary,
    get_sales_by_category,
    get_sales_by_zone,
    get_sales_summary,
    get_top_products
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
    dependencies=[Depends(can_view_reports)]
)
async def dashboard_summary_endpoint(
    startDate: datetime | None = Query(default=None),
    endDate: datetime | None = Query(default=None)
):
    """
    Devuelve toda la información principal del dashboard.

    Esta respuesta está adaptada al frontend Angular:
    - kpis como lista
    - salesChart
    - categoryChart
    - zoneChart
    - topProducts
    - recentOrders
    """
    return await get_dashboard_summary(
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/kpis",
    response_model=DashboardKpiResponse,
    dependencies=[Depends(can_view_reports)]
)
async def dashboard_kpis_endpoint(
    startDate: datetime | None = Query(default=None),
    endDate: datetime | None = Query(default=None)
):
    """
    Devuelve KPI's principales en formato numérico.
    """
    return await get_dashboard_kpis(
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/sales-summary",
    response_model=list[SalesSummaryItemResponse],
    dependencies=[Depends(can_view_reports)]
)
async def sales_summary_endpoint(
    startDate: datetime | None = Query(default=None),
    endDate: datetime | None = Query(default=None)
):
    """
    Devuelve ventas agrupadas por fecha.
    """
    return await get_sales_summary(
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/top-products",
    response_model=list[TopProductResponse],
    dependencies=[Depends(can_view_reports)]
)
async def top_products_endpoint(
    limit: int = Query(default=10, ge=1, le=50),
    startDate: datetime | None = Query(default=None),
    endDate: datetime | None = Query(default=None)
):
    """
    Devuelve productos más vendidos en formato detallado.
    """
    return await get_top_products(
        limit=limit,
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/sales-by-category",
    response_model=list[SalesByCategoryResponse],
    dependencies=[Depends(can_view_reports)]
)
async def sales_by_category_endpoint(
    startDate: datetime | None = Query(default=None),
    endDate: datetime | None = Query(default=None)
):
    """
    Devuelve ventas agrupadas por categoría.
    """
    return await get_sales_by_category(
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/sales-by-zone",
    response_model=list[SalesByZoneResponse],
    dependencies=[Depends(can_view_reports)]
)
async def sales_by_zone_endpoint():
    """
    Devuelve ventas agrupadas por zona.
    """
    return await get_sales_by_zone()