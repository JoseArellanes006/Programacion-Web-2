"""
Modelo interno de categorías.

Las categorías sirven para clasificar productos.

El frontend puede usarlas para:
- selects
- filtros
- agrupación visual
- administración de productos
"""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId


CATEGORY_STATUS_ACTIVE = "ACTIVE"
CATEGORY_STATUS_INACTIVE = "INACTIVE"

CATEGORY_STATUSES = [
    CATEGORY_STATUS_ACTIVE,
    CATEGORY_STATUS_INACTIVE
]


def get_current_utc_datetime() -> datetime:
    """
    Devuelve la fecha actual en UTC.
    """
    return datetime.now(timezone.utc)


def object_id_to_str(value: Any) -> str:
    """
    Convierte ObjectId a string.
    """
    if isinstance(value, ObjectId):
        return str(value)

    return str(value)


def category_document_to_response(category: dict[str, Any]) -> dict[str, Any]:
    """
    Convierte documento de MongoDB a respuesta para Angular.
    """
    return {
        "id": object_id_to_str(category.get("_id")),
        "name": category.get("name", ""),
        "description": category.get("description", ""),
        "status": category.get("status", CATEGORY_STATUS_ACTIVE),
        "createdAt": category.get("createdAt"),
        "updatedAt": category.get("updatedAt")
    }


def create_category_document(
    name: str,
    description: str = "",
    status: str = CATEGORY_STATUS_ACTIVE
) -> dict[str, Any]:
    """
    Crea documento base de categoría.
    """
    now = get_current_utc_datetime()

    return {
        "name": name,
        "nameNormalized": name.lower().strip(),
        "description": description,
        "status": status,
        "createdAt": now,
        "updatedAt": now
    }