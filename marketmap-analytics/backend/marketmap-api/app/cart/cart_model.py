"""
Modelo interno del carrito.

Este archivo contiene:
- constantes de estado
- creación de documentos de carrito
- creación de items del carrito
- recálculo de totales
- conversión de documentos MongoDB a respuestas para Angular

Regla importante:
El frontend no calcula precios, stock ni totales.
El backend es la fuente de verdad.
"""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId


CART_STATUS_ACTIVE = "ACTIVE"
CART_STATUS_CHECKED_OUT = "CHECKED_OUT"
CART_STATUS_CANCELLED = "CANCELLED"

CART_STATUSES = [
    CART_STATUS_ACTIVE,
    CART_STATUS_CHECKED_OUT,
    CART_STATUS_CANCELLED
]

TAX_RATE = 0.0


def get_current_utc_datetime() -> datetime:
    """
    Devuelve la fecha actual en UTC.
    """
    return datetime.now(timezone.utc)


def object_id_to_str(value: Any) -> str:
    """
    Convierte ObjectId de MongoDB a string.
    """
    if isinstance(value, ObjectId):
        return str(value)

    return str(value)


def create_cart_document(
    user_id: str,
    items: list[dict[str, Any]] | None = None
) -> dict[str, Any]:
    """
    Crea un documento de carrito listo para MongoDB.
    """
    now = get_current_utc_datetime()

    cart_document: dict[str, Any] = {
        "userId": user_id,
        "items": items or [],
        "totalItems": 0,
        "subtotal": 0,
        "tax": 0,
        "discount": 0,
        "total": 0,
        "status": CART_STATUS_ACTIVE,
        "createdAt": now,
        "updatedAt": now
    }

    return recalculate_cart_document(cart_document)


def create_cart_item_document(
    product_id: str,
    product_name: str,
    category: str | None,
    unit_price: float,
    quantity: int,
    image_url: str | None = None,
    available_stock: int | None = None,
    available: bool = True
) -> dict[str, Any]:
    """
    Crea un item de carrito.

    El id del item se iguala al productId para que el frontend pueda
    actualizar y eliminar usando productId.
    """
    subtotal = float(unit_price) * int(quantity)

    return {
        "id": product_id,
        "productId": product_id,
        "productName": product_name,
        "category": category,
        "unitPrice": float(unit_price),
        "quantity": int(quantity),
        "subtotal": subtotal,
        "imageUrl": image_url,
        "availableStock": available_stock,
        "available": available
    }


def recalculate_cart_document(cart: dict[str, Any]) -> dict[str, Any]:
    """
    Recalcula los totales del carrito.

    Calcula:
    - totalItems
    - subtotal
    - tax
    - discount
    - total
    """
    items = cart.get("items", [])

    total_items = 0
    subtotal = 0.0

    for item in items:
        quantity = int(item.get("quantity", 0))
        unit_price = float(item.get("unitPrice", 0))

        item_subtotal = unit_price * quantity

        item["quantity"] = quantity
        item["unitPrice"] = unit_price
        item["subtotal"] = item_subtotal

        total_items += quantity
        subtotal += item_subtotal

    discount = float(cart.get("discount", 0) or 0)
    tax = subtotal * TAX_RATE
    total = subtotal + tax - discount

    if total < 0:
        total = 0

    cart["totalItems"] = total_items
    cart["subtotal"] = round(subtotal, 2)
    cart["tax"] = round(tax, 2)
    cart["discount"] = round(discount, 2)
    cart["total"] = round(total, 2)

    return cart


def cart_item_document_to_response(
    item: dict[str, Any]
) -> dict[str, Any]:
    """
    Convierte un item del carrito a respuesta para Angular.
    """
    product_id = item.get("productId", "")

    return {
        "id": item.get("id") or product_id,
        "productId": product_id,
        "productName": item.get("productName", ""),
        "category": item.get("category"),
        "unitPrice": item.get("unitPrice", 0),
        "quantity": item.get("quantity", 0),
        "subtotal": item.get("subtotal", 0),
        "imageUrl": item.get("imageUrl"),
        "availableStock": item.get("availableStock"),
        "available": item.get("available", True)
    }


def cart_document_to_response(
    cart: dict[str, Any]
) -> dict[str, Any]:
    """
    Convierte un documento de MongoDB a respuesta para Angular.
    """
    return {
        "id": object_id_to_str(cart.get("_id")),
        "userId": cart.get("userId", ""),
        "items": [
            cart_item_document_to_response(item)
            for item in cart.get("items", [])
        ],
        "totalItems": cart.get("totalItems", 0),
        "subtotal": cart.get("subtotal", 0),
        "tax": cart.get("tax", 0),
        "discount": cart.get("discount", 0),
        "total": cart.get("total", 0),
        "status": cart.get("status", CART_STATUS_ACTIVE),
        "createdAt": cart.get("createdAt"),
        "updatedAt": cart.get("updatedAt")
    }