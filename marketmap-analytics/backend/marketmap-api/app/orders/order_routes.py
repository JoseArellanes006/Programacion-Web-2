"""
Rutas de pedidos.

Endpoints:
- GET /orders
- GET /orders/by-date
- GET /orders/{order_id}
- PATCH /orders/{order_id}/status
- PATCH /orders/{order_id}/cancel
"""

from fastapi import APIRouter, Depends, Query

from app.core.permissions import can_manage_orders
from app.orders.order_schema import (
    OrderResponse,
    UpdateOrderStatusRequest
)
from app.orders.order_service import (
    cancel_order,
    get_order,
    get_orders,
    update_order_status
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"]
)


@router.get(
    "",
    response_model=list[OrderResponse],
    dependencies=[Depends(can_manage_orders)]
)
async def list_orders_endpoint(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None)
):
    """
    Lista pedidos con filtros opcionales.

    El frontend Angular envía:
    - search
    - status
    - startDate en formato YYYY-MM-DD
    - endDate en formato YYYY-MM-DD
    """
    return await get_orders(
        search=search,
        status=status,
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/by-date",
    response_model=list[OrderResponse],
    dependencies=[Depends(can_manage_orders)]
)
async def orders_by_date_endpoint(
    startDate: str | None = Query(default=None),
    endDate: str | None = Query(default=None),
    status: str | None = Query(default=None)
):
    """
    Lista pedidos por rango de fechas.

    Este endpoint existe para coincidir con API_CONFIG.orders.byDate
    del frontend Angular.
    """
    return await get_orders(
        status=status,
        start_date=startDate,
        end_date=endDate
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    dependencies=[Depends(can_manage_orders)]
)
async def get_order_endpoint(order_id: str):
    """
    Obtiene un pedido por id.
    """
    return await get_order(order_id)


@router.patch(
    "/{order_id}/status",
    response_model=OrderResponse,
    dependencies=[Depends(can_manage_orders)]
)
async def update_order_status_endpoint(
    order_id: str,
    payload: UpdateOrderStatusRequest
):
    """
    Cambia el estado de un pedido.
    """
    return await update_order_status(
        order_id=order_id,
        payload=payload
    )


@router.patch(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    dependencies=[Depends(can_manage_orders)]
)
async def cancel_order_endpoint(order_id: str):
    """
    Cancela un pedido.
    """
    return await cancel_order(order_id)