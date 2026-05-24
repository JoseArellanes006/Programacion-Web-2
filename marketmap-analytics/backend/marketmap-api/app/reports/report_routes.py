"""
Rutas de reportes.

Endpoints:
- GET /reports/sales/pdf
- GET /reports/sales/excel
- GET /reports/products/pdf
- GET /reports/products/excel
- GET /reports/orders/pdf
- GET /reports/orders/excel

Estos endpoints están alineados con Angular:
- startDate
- endDate
- category
- orderStatus
- search
"""

from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.core.permissions import can_view_reports
from app.reports.excel_service import (
    build_orders_excel,
    build_products_excel,
    build_sales_excel
)
from app.reports.pdf_service import (
    build_orders_pdf,
    build_products_pdf,
    build_sales_pdf
)
from app.reports.report_service import (
    get_orders_report_data,
    get_products_report_data,
    get_sales_report_data
)


router = APIRouter(
    prefix="/reports",
    tags=["Reports"]
)


def build_file_response(
    content: bytes,
    file_name: str,
    media_type: str
) -> StreamingResponse:
    """
    Construye una respuesta de descarga de archivo.
    """
    return StreamingResponse(
        BytesIO(content),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file_name}"'
        }
    )


@router.get(
    "/sales/pdf",
    dependencies=[Depends(can_view_reports)]
)
async def sales_pdf_endpoint(
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None)
):
    """
    Descarga reporte de ventas en PDF.
    """
    data = await get_sales_report_data(
        start_date=startDate,
        end_date=endDate,
        category=category,
        search=search
    )

    content = build_sales_pdf(data)

    return build_file_response(
        content=content,
        file_name="reporte_ventas.pdf",
        media_type="application/pdf"
    )


@router.get(
    "/sales/excel",
    dependencies=[Depends(can_view_reports)]
)
async def sales_excel_endpoint(
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None),
    category: str | None = Query(default=None),
    search: str | None = Query(default=None)
):
    """
    Descarga reporte de ventas en Excel.
    """
    data = await get_sales_report_data(
        start_date=startDate,
        end_date=endDate,
        category=category,
        search=search
    )

    content = build_sales_excel(data)

    return build_file_response(
        content=content,
        file_name="reporte_ventas.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get(
    "/products/pdf",
    dependencies=[Depends(can_view_reports)]
)
async def products_pdf_endpoint(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status: str | None = Query(default=None)
):
    """
    Descarga reporte de productos en PDF.
    """
    data = await get_products_report_data(
        search=search,
        category=category,
        status=status
    )

    content = build_products_pdf(data)

    return build_file_response(
        content=content,
        file_name="reporte_productos.pdf",
        media_type="application/pdf"
    )


@router.get(
    "/products/excel",
    dependencies=[Depends(can_view_reports)]
)
async def products_excel_endpoint(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status: str | None = Query(default=None)
):
    """
    Descarga reporte de productos en Excel.
    """
    data = await get_products_report_data(
        search=search,
        category=category,
        status=status
    )

    content = build_products_excel(data)

    return build_file_response(
        content=content,
        file_name="reporte_productos.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.get(
    "/orders/pdf",
    dependencies=[Depends(can_view_reports)]
)
async def orders_pdf_endpoint(
    search: str | None = Query(default=None),
    orderStatus: str | None = Query(default=None),
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None)
):
    """
    Descarga reporte de pedidos en PDF.

    Angular envía orderStatus, no status.
    """
    data = await get_orders_report_data(
        search=search,
        order_status=orderStatus,
        start_date=startDate,
        end_date=endDate
    )

    content = build_orders_pdf(data)

    return build_file_response(
        content=content,
        file_name="reporte_pedidos.pdf",
        media_type="application/pdf"
    )


@router.get(
    "/orders/excel",
    dependencies=[Depends(can_view_reports)]
)
async def orders_excel_endpoint(
    search: str | None = Query(default=None),
    orderStatus: str | None = Query(default=None),
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None)
):
    """
    Descarga reporte de pedidos en Excel.

    Angular envía orderStatus, no status.
    """
    data = await get_orders_report_data(
        search=search,
        order_status=orderStatus,
        start_date=startDate,
        end_date=endDate
    )

    content = build_orders_excel(data)

    return build_file_response(
        content=content,
        file_name="reporte_pedidos.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )