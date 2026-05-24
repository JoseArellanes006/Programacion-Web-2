"""
Servicio de WebSockets.

Este archivo contiene funciones de negocio para construir y enviar
notificaciones en tiempo real.

Puede ser usado desde otros módulos:
- pedidos
- carrito
- productos
- mapa
- dashboard
"""

from datetime import datetime, timezone
from typing import Any

from app.websockets.websocket_manager import websocket_manager


def build_websocket_message(
    event: str,
    data: dict[str, Any] | None = None
) -> dict[str, Any]:
    """
    Construye un mensaje estándar para WebSocket.

    Estructura:
    {
        "event": "ORDER_CREATED",
        "data": {},
        "sentAt": "..."
    }
    """
    return {
        "event": event,
        "data": data or {},
        "sentAt": datetime.now(timezone.utc).isoformat()
    }


async def notify_user(
    user_id: str,
    event: str,
    data: dict[str, Any] | None = None
) -> bool:
    """
    Notifica a un usuario específico.
    """
    message = build_websocket_message(
        event=event,
        data=data
    )

    return await websocket_manager.send_to_user(
        user_id=user_id,
        message=message
    )


async def notify_all(
    event: str,
    data: dict[str, Any] | None = None
) -> int:
    """
    Notifica a todos los usuarios conectados.
    """
    message = build_websocket_message(
        event=event,
        data=data
    )

    return await websocket_manager.broadcast(message)


async def notify_role(
    role: str,
    event: str,
    data: dict[str, Any] | None = None
) -> int:
    """
    Notifica a todos los usuarios conectados con cierto rol.
    """
    message = build_websocket_message(
        event=event,
        data=data
    )

    return await websocket_manager.broadcast_by_role(
        role=role,
        message=message
    )


async def notify_order_created(
    order_id: str,
    total: float
) -> int:
    """
    Notifica que se creó un pedido.
    """
    return await notify_all(
        event="ORDER_CREATED",
        data={
            "orderId": order_id,
            "total": total
        }
    )


async def notify_product_stock_changed(
    product_id: str,
    stock: int,
    status: str
) -> int:
    """
    Notifica cambio de stock en producto.
    """
    return await notify_all(
        event="PRODUCT_STOCK_CHANGED",
        data={
            "productId": product_id,
            "stock": stock,
            "status": status
        }
    )


async def notify_map_zone_updated(
    zone_id: str,
    status: str
) -> int:
    """
    Notifica cambio en una zona del mapa.
    """
    return await notify_all(
        event="MAP_ZONE_UPDATED",
        data={
            "zoneId": zone_id,
            "status": status
        }
    )