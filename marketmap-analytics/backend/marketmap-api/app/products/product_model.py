"""
Modelo interno de productos.

Este archivo contiene constantes y funciones auxiliares para transformar
documentos de MongoDB a respuestas limpias para el frontend.

El frontend espera productos con esta estructura general:
- id
- name
- description
- category
- price
- stock
- imageUrl
- status
- featured
- createdAt
- updatedAt
"""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId


PRODUCT_STATUS_ACTIVE = "ACTIVE"
PRODUCT_STATUS_INACTIVE = "INACTIVE"
PRODUCT_STATUS_OUT_OF_STOCK = "OUT_OF_STOCK"

PRODUCT_STATUSES = [
    PRODUCT_STATUS_ACTIVE,
    PRODUCT_STATUS_INACTIVE,
    PRODUCT_STATUS_OUT_OF_STOCK
]


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


def normalize_product_status(stock: int, status: str) -> str:
    """
    Normaliza el estado del producto.

    Si el stock es 0, se marca como OUT_OF_STOCK.
    Si tiene stock, conserva el estado indicado.
    """
    if stock <= 0:
        return PRODUCT_STATUS_OUT_OF_STOCK

    if status == PRODUCT_STATUS_OUT_OF_STOCK:
        return PRODUCT_STATUS_ACTIVE

    return status


def product_document_to_response(product: dict[str, Any]) -> dict[str, Any]:
    """
    Convierte un documento de MongoDB a respuesta segura para Angular.
    """
    return {
        "id": object_id_to_str(product.get("_id")),
        "name": product.get("name", ""),
        "description": product.get("description", ""),
        "category": product.get("category", ""),
        "price": product.get("price", 0),
        "stock": product.get("stock", 0),
        "imageUrl": product.get("imageUrl"),
        "status": product.get("status", PRODUCT_STATUS_ACTIVE),
        "featured": product.get("featured", False),
        "createdAt": product.get("createdAt"),
        "updatedAt": product.get("updatedAt")
    }


def create_product_document(
    name: str,
    description: str,
    category: str,
    price: float,
    stock: int,
    image_url: str | None = None,
    status: str = PRODUCT_STATUS_ACTIVE,
    featured: bool = False
) -> dict[str, Any]:
    """
    Crea la estructura base de un producto para MongoDB.
    """
    now = get_current_utc_datetime()

    normalized_status = normalize_product_status(
        stock=stock,
        status=status
    )

    return {
        "name": name,
        "description": description,
        "category": category,
        "price": price,
        "stock": stock,
        "imageUrl": image_url,
        "status": normalized_status,
        "featured": featured,
        "createdAt": now,
        "updatedAt": now
    }