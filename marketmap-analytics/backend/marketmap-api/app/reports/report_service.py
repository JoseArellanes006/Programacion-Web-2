"""
Servicio de reportes.

Este archivo obtiene los datos reales que después serán convertidos
a PDF o Excel.

Los reportes principales son:
- ventas
- productos
- pedidos

Este servicio está alineado con el frontend Angular, que envía filtros como:
- startDate
- endDate
- category
- orderStatus
- search

Correcciones importantes:
- La fecha final se interpreta como fin del día.
- La búsqueda también puede revisar detalles de productos en pedidos.
- Los filtros no dependen únicamente del repositorio.
"""

from datetime import datetime, time, timezone
from typing import Any

from app.core.exceptions import UnprocessableEntityException
from app.orders.order_model import (
    ORDER_STATUSES,
    ORDER_STATUS_CANCELLED,
    ORDER_STATUS_DELIVERED,
    ORDER_STATUS_PAID,
    ORDER_STATUS_PENDING,
    order_document_to_response
)
from app.orders.order_repository import list_orders
from app.products.product_service import get_products


def parse_report_datetime_filter(
    value: str | None,
    *,
    end_of_day: bool = False
) -> datetime | None:
    """
    Convierte fecha enviada por Angular a datetime.

    Angular envía normalmente:
    - YYYY-MM-DD

    También se acepta:
    - YYYY-MM-DDTHH:mm:ss
    - ISO con Z

    Punto importante:
    Cuando se recibe una fecha final como YYYY-MM-DD, debe interpretarse
    como el final de ese día, no como las 00:00:00.

    Ejemplo:
    endDate=2026-05-24 debe convertirse a:
    2026-05-24 23:59:59.999999 UTC

    Si no se hace esto, los pedidos creados durante ese día quedan fuera.
    """
    if value is None:
        return None

    cleaned_value = value.strip()

    if not cleaned_value:
        return None

    try:
        if len(cleaned_value) == 10:
            parsed_date = datetime.fromisoformat(cleaned_value).date()

            if end_of_day:
                return datetime.combine(
                    parsed_date,
                    time.max,
                    tzinfo=timezone.utc
                )

            return datetime.combine(
                parsed_date,
                time.min,
                tzinfo=timezone.utc
            )

        normalized_value = cleaned_value.replace("Z", "+00:00")
        parsed_value = datetime.fromisoformat(normalized_value)

        if parsed_value.tzinfo is None:
            parsed_value = parsed_value.replace(tzinfo=timezone.utc)

        return parsed_value

    except ValueError:
        raise UnprocessableEntityException(
            message="Formato de fecha inválido."
        )


def normalize_order_status(order_status: str | None) -> str | None:
    """
    Normaliza el filtro de estado enviado desde Angular.

    Angular envía:
    - ALL
    - PENDING
    - PAID
    - CANCELLED
    - DELIVERED

    MongoDB debe recibir None cuando el filtro sea ALL.
    """
    if not order_status:
        return None

    normalized_status = order_status.strip().upper()

    if normalized_status == "ALL":
        return None

    if normalized_status not in ORDER_STATUSES:
        raise UnprocessableEntityException(
            message="Estado de pedido inválido."
        )

    return normalized_status


def normalize_text_filter(value: str | None) -> str | None:
    """
    Limpia filtros de texto.
    """
    if value is None:
        return None

    cleaned_value = value.strip()

    if not cleaned_value:
        return None

    if cleaned_value.upper() == "ALL":
        return None

    return cleaned_value


def normalize_status_filter(value: str | None) -> str | None:
    """
    Limpia filtros de estado genéricos.

    Se usa principalmente para productos.
    """
    if value is None:
        return None

    cleaned_value = value.strip().upper()

    if not cleaned_value or cleaned_value == "ALL":
        return None

    return cleaned_value


def text_contains(value: Any, search: str) -> bool:
    """
    Verifica si un valor contiene el texto buscado.
    """
    return search.lower() in str(value or "").lower()


def order_matches_search(
    order: dict[str, Any],
    search: str | None
) -> bool:
    """
    Verifica si un pedido coincide con una búsqueda.

    Se revisa:
    - id
    - folio
    - customerName
    - customerId
    - método de pago
    - estado
    - producto dentro de detalles
    - categoría dentro de detalles
    """
    if not search:
        return True

    searchable_order_fields = [
        order.get("_id"),
        order.get("folio"),
        order.get("customerName"),
        order.get("customerId"),
        order.get("paymentMethod"),
        order.get("status")
    ]

    for value in searchable_order_fields:
        if text_contains(value, search):
            return True

    for detail in order.get("details", []):
        searchable_detail_fields = [
            detail.get("productId"),
            detail.get("productName"),
            detail.get("category"),
            detail.get("unitPrice"),
            detail.get("quantity"),
            detail.get("subtotal")
        ]

        for value in searchable_detail_fields:
            if text_contains(value, search):
                return True

    return False


def order_matches_category(
    order: dict[str, Any],
    category: str | None
) -> bool:
    """
    Verifica si un pedido contiene al menos un producto de la categoría indicada.
    """
    if not category:
        return True

    normalized_category = category.strip().lower()

    for detail in order.get("details", []):
        detail_category = str(detail.get("category", "")).strip().lower()

        if detail_category == normalized_category:
            return True

    return False


def filter_order_details_by_category(
    details: list[dict[str, Any]],
    category: str | None
) -> list[dict[str, Any]]:
    """
    Filtra detalles de pedido por categoría.

    Si no hay categoría, devuelve todos los detalles.
    """
    if not category:
        return details

    normalized_category = category.strip().lower()

    return [
        detail
        for detail in details
        if str(detail.get("category", "")).strip().lower() == normalized_category
    ]


def build_sales_kpis(
    orders: list[dict[str, Any]],
    category: str | None = None
) -> dict[str, Any]:
    """
    Calcula KPI de ventas usando pedidos reales.

    Para ventas se consideran pedidos:
    - PAID
    - DELIVERED

    Los pedidos PENDING y CANCELLED se contabilizan como estados,
    pero no suman ventas efectivas.
    """
    total_sales = 0.0
    total_orders_with_sales = 0
    total_products = 0

    pending_orders = 0
    paid_orders = 0
    cancelled_orders = 0
    delivered_orders = 0

    customer_ids: set[str] = set()

    for order in orders:
        status = order.get("status", ORDER_STATUS_PENDING)

        if status == ORDER_STATUS_PENDING:
            pending_orders += 1

        if status == ORDER_STATUS_PAID:
            paid_orders += 1

        if status == ORDER_STATUS_CANCELLED:
            cancelled_orders += 1

        if status == ORDER_STATUS_DELIVERED:
            delivered_orders += 1

        customer_id = order.get("customerId")

        if customer_id:
            customer_ids.add(str(customer_id))

        if status not in [ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED]:
            continue

        details = filter_order_details_by_category(
            details=order.get("details", []),
            category=category
        )

        if not details:
            continue

        order_sales = 0.0
        order_products = 0

        for detail in details:
            subtotal = float(detail.get("subtotal", 0) or 0)
            quantity = int(detail.get("quantity", 0) or 0)

            order_sales += subtotal
            order_products += quantity

        total_sales += order_sales
        total_products += order_products
        total_orders_with_sales += 1

    average_ticket = 0.0

    if total_orders_with_sales > 0:
        average_ticket = total_sales / total_orders_with_sales

    return {
        "totalSales": round(total_sales, 2),
        "totalOrders": len(orders),
        "totalProducts": total_products,
        "totalCustomers": len(customer_ids),
        "averageTicket": round(average_ticket, 2),
        "pendingOrders": pending_orders,
        "paidOrders": paid_orders,
        "cancelledOrders": cancelled_orders,
        "deliveredOrders": delivered_orders
    }


def build_sales_summary(
    orders: list[dict[str, Any]],
    category: str | None = None
) -> list[dict[str, Any]]:
    """
    Agrupa ventas por fecha.
    """
    grouped: dict[str, dict[str, Any]] = {}

    for order in orders:
        status = order.get("status", ORDER_STATUS_PENDING)

        if status not in [ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED]:
            continue

        created_at = order.get("createdAt")

        if isinstance(created_at, datetime):
            date_key = created_at.date().isoformat()
        else:
            date_key = str(created_at)[:10]

        details = filter_order_details_by_category(
            details=order.get("details", []),
            category=category
        )

        if not details:
            continue

        if date_key not in grouped:
            grouped[date_key] = {
                "date": date_key,
                "totalSales": 0.0,
                "totalOrders": 0
            }

        total_sales = sum(
            float(detail.get("subtotal", 0) or 0)
            for detail in details
        )

        grouped[date_key]["totalSales"] += total_sales
        grouped[date_key]["totalOrders"] += 1

    result = list(grouped.values())

    for item in result:
        item["totalSales"] = round(item["totalSales"], 2)

    return sorted(
        result,
        key=lambda item: item["date"]
    )


def build_top_products(
    orders: list[dict[str, Any]],
    category: str | None = None,
    limit: int = 20
) -> list[dict[str, Any]]:
    """
    Calcula productos más vendidos a partir de los detalles de pedidos.
    """
    grouped: dict[str, dict[str, Any]] = {}

    for order in orders:
        status = order.get("status", ORDER_STATUS_PENDING)

        if status not in [ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED]:
            continue

        details = filter_order_details_by_category(
            details=order.get("details", []),
            category=category
        )

        for detail in details:
            product_id = detail.get("productId", "")

            if not product_id:
                continue

            if product_id not in grouped:
                grouped[product_id] = {
                    "productId": product_id,
                    "productName": detail.get("productName", ""),
                    "category": detail.get("category"),
                    "totalQuantity": 0,
                    "totalSales": 0.0
                }

            grouped[product_id]["totalQuantity"] += int(
                detail.get("quantity", 0) or 0
            )
            grouped[product_id]["totalSales"] += float(
                detail.get("subtotal", 0) or 0
            )

    result = list(grouped.values())

    for item in result:
        item["totalSales"] = round(item["totalSales"], 2)

    return sorted(
        result,
        key=lambda item: item["totalSales"],
        reverse=True
    )[:limit]


def build_sales_by_category(
    orders: list[dict[str, Any]],
    category: str | None = None
) -> list[dict[str, Any]]:
    """
    Calcula ventas por categoría.
    """
    grouped: dict[str, dict[str, Any]] = {}

    for order in orders:
        status = order.get("status", ORDER_STATUS_PENDING)

        if status not in [ORDER_STATUS_PAID, ORDER_STATUS_DELIVERED]:
            continue

        details = filter_order_details_by_category(
            details=order.get("details", []),
            category=category
        )

        for detail in details:
            detail_category = detail.get("category") or "Sin categoría"

            if detail_category not in grouped:
                grouped[detail_category] = {
                    "category": detail_category,
                    "totalSales": 0.0,
                    "totalQuantity": 0
                }

            grouped[detail_category]["totalSales"] += float(
                detail.get("subtotal", 0) or 0
            )
            grouped[detail_category]["totalQuantity"] += int(
                detail.get("quantity", 0) or 0
            )

    result = list(grouped.values())

    for item in result:
        item["totalSales"] = round(item["totalSales"], 2)

    return sorted(
        result,
        key=lambda item: item["totalSales"],
        reverse=True
    )


async def get_sales_report_data(
    start_date: str | None = None,
    end_date: str | None = None,
    category: str | None = None,
    search: str | None = None
) -> dict[str, Any]:
    """
    Obtiene datos para reporte de ventas.

    Este reporte se construye desde pedidos reales, para poder aplicar
    filtros de fecha, categoría y búsqueda.
    """
    parsed_start_date = parse_report_datetime_filter(
        start_date,
        end_of_day=False
    )

    parsed_end_date = parse_report_datetime_filter(
        end_date,
        end_of_day=True
    )

    normalized_category = normalize_text_filter(category)
    normalized_search = normalize_text_filter(search)

    orders = await list_orders(
        search=None,
        status=None,
        start_date=parsed_start_date,
        end_date=parsed_end_date
    )

    if normalized_search:
        orders = [
            order
            for order in orders
            if order_matches_search(order, normalized_search)
        ]

    if normalized_category:
        orders = [
            order
            for order in orders
            if order_matches_category(order, normalized_category)
        ]

    return {
        "title": "Reporte de ventas",
        "filters": {
            "startDate": start_date,
            "endDate": end_date,
            "category": normalized_category,
            "search": normalized_search
        },
        "kpis": build_sales_kpis(
            orders=orders,
            category=normalized_category
        ),
        "salesSummary": build_sales_summary(
            orders=orders,
            category=normalized_category
        ),
        "topProducts": build_top_products(
            orders=orders,
            category=normalized_category,
            limit=20
        ),
        "salesByCategory": build_sales_by_category(
            orders=orders,
            category=normalized_category
        )
    }


async def get_products_report_data(
    search: str | None = None,
    category: str | None = None,
    status: str | None = None
) -> dict[str, Any]:
    """
    Obtiene datos para reporte de productos.
    """
    normalized_search = normalize_text_filter(search)
    normalized_category = normalize_text_filter(category)
    normalized_status = normalize_status_filter(status)

    products = await get_products(
        search=normalized_search,
        category=normalized_category,
        status=normalized_status,
        featured=None
    )

    return {
        "title": "Reporte de productos",
        "filters": {
            "search": normalized_search,
            "category": normalized_category,
            "status": normalized_status
        },
        "products": [
            product.model_dump()
            for product in products
        ]
    }


async def get_orders_report_data(
    search: str | None = None,
    order_status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
) -> dict[str, Any]:
    """
    Obtiene datos para reporte de pedidos.
    """
    normalized_search = normalize_text_filter(search)
    normalized_order_status = normalize_order_status(order_status)

    parsed_start_date = parse_report_datetime_filter(
        start_date,
        end_of_day=False
    )

    parsed_end_date = parse_report_datetime_filter(
        end_date,
        end_of_day=True
    )

    orders = await list_orders(
        search=None,
        status=normalized_order_status,
        start_date=parsed_start_date,
        end_date=parsed_end_date
    )

    if normalized_search:
        orders = [
            order
            for order in orders
            if order_matches_search(order, normalized_search)
        ]

    return {
        "title": "Reporte de pedidos",
        "filters": {
            "search": normalized_search,
            "orderStatus": normalized_order_status or "ALL",
            "startDate": start_date,
            "endDate": end_date
        },
        "orders": [
            order_document_to_response(order)
            for order in orders
        ]
    }