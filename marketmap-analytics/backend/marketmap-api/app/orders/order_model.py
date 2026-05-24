"""
Modelo interno de pedidos.

Un pedido representa una venta formal generada desde el carrito.
"""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId


ORDER_STATUS_PENDING = "PENDING"
ORDER_STATUS_PAID = "PAID"
ORDER_STATUS_CANCELLED = "CANCELLED"
ORDER_STATUS_DELIVERED = "DELIVERED"

ORDER_STATUSES = [
    ORDER_STATUS_PENDING,
    ORDER_STATUS_PAID,
    ORDER_STATUS_CANCELLED,
    ORDER_STATUS_DELIVERED
]

PAYMENT_METHOD_CASH = "CASH"
PAYMENT_METHOD_CARD = "CARD"
PAYMENT_METHOD_TRANSFER = "TRANSFER"
PAYMENT_METHOD_ONLINE = "ONLINE"
PAYMENT_METHOD_NOT_DEFINED = "NOT_DEFINED"

PAYMENT_METHODS = [
    PAYMENT_METHOD_CASH,
    PAYMENT_METHOD_CARD,
    PAYMENT_METHOD_TRANSFER,
    PAYMENT_METHOD_ONLINE,
    PAYMENT_METHOD_NOT_DEFINED
]


def get_current_utc_datetime() -> datetime:
    """
    Devuelve fecha actual UTC.
    """
    return datetime.now(timezone.utc)


def object_id_to_str(value: Any) -> str:
    """
    Convierte ObjectId a string.
    """
    if isinstance(value, ObjectId):
        return str(value)

    return str(value)


def generate_order_folio() -> str:
    """
    Genera un folio simple para pedido.

    Ejemplo:
    ORD-20260519-ABC123
    """
    now = get_current_utc_datetime()
    random_part = ObjectId().binary.hex()[-6:].upper()

    return f"ORD-{now.strftime('%Y%m%d')}-{random_part}"


def order_detail_from_cart_item(
    item: dict[str, Any]
) -> dict[str, Any]:
    """
    Convierte un item de carrito a detalle de pedido.
    """
    product_id = item.get("productId", "")

    return {
        "id": product_id,
        "productId": product_id,
        "productName": item.get("productName", ""),
        "category": item.get("category"),
        "unitPrice": float(item.get("unitPrice", 0)),
        "quantity": int(item.get("quantity", 0)),
        "subtotal": float(item.get("subtotal", 0)),
        "imageUrl": item.get("imageUrl")
    }


def create_order_document(
    user_id: str,
    customer_name: str,
    cart: dict[str, Any],
    payment_method: str = PAYMENT_METHOD_NOT_DEFINED
) -> dict[str, Any]:
    """
    Crea documento de pedido a partir del carrito.
    """
    now = get_current_utc_datetime()

    details = [
        order_detail_from_cart_item(item)
        for item in cart.get("items", [])
    ]

    return {
        "folio": generate_order_folio(),
        "customerId": user_id,
        "customerName": customer_name,
        "status": ORDER_STATUS_PENDING,
        "paymentMethod": payment_method,
        "details": details,
        "totalItems": int(cart.get("totalItems", 0)),
        "subtotal": float(cart.get("subtotal", 0)),
        "tax": float(cart.get("tax", 0)),
        "discount": float(cart.get("discount", 0)),
        "total": float(cart.get("total", 0)),
        "createdAt": now,
        "updatedAt": now
    }


def order_detail_document_to_response(
    detail: dict[str, Any]
) -> dict[str, Any]:
    """
    Convierte detalle de pedido a respuesta para Angular.
    """
    product_id = detail.get("productId", "")

    return {
        "id": detail.get("id") or product_id,
        "productId": product_id,
        "productName": detail.get("productName", ""),
        "category": detail.get("category"),
        "unitPrice": detail.get("unitPrice", 0),
        "quantity": detail.get("quantity", 0),
        "subtotal": detail.get("subtotal", 0),
        "imageUrl": detail.get("imageUrl")
    }


def order_document_to_response(order: dict[str, Any]) -> dict[str, Any]:
    """
    Convierte documento MongoDB a respuesta para Angular.
    """
    return {
        "id": object_id_to_str(order.get("_id")),
        "folio": order.get("folio", ""),
        "customerId": order.get("customerId"),
        "customerName": order.get("customerName", ""),
        "status": order.get("status", ORDER_STATUS_PENDING),
        "paymentMethod": order.get("paymentMethod", PAYMENT_METHOD_NOT_DEFINED),
        "details": [
            order_detail_document_to_response(detail)
            for detail in order.get("details", [])
        ],
        "totalItems": order.get("totalItems", 0),
        "subtotal": order.get("subtotal", 0),
        "tax": order.get("tax", 0),
        "discount": order.get("discount", 0),
        "total": order.get("total", 0),
        "createdAt": order.get("createdAt"),
        "updatedAt": order.get("updatedAt")
    }