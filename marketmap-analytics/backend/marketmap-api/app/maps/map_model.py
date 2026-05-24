"""
Modelo interno del mapa interactivo.

El mapa interactivo representa zonas, espacios, mesas, locales,
puntos de venta o áreas comerciales dentro del sistema.

Este modelo queda alineado con Angular, que espera:
- layout activo
- imagen base del layout
- zonas dentro del layout
- resumen de ocupación
- estados de zona
- posición visual en porcentaje
- pedido asociado opcional
"""

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId


MAP_LAYOUT_DEFAULT_ID = "default-layout"
MAP_LAYOUT_DEFAULT_NAME = "Mapa principal"
MAP_LAYOUT_DEFAULT_DESCRIPTION = "Distribución principal del establecimiento."

MAP_ZONE_STATUS_AVAILABLE = "AVAILABLE"
MAP_ZONE_STATUS_OCCUPIED = "OCCUPIED"
MAP_ZONE_STATUS_RESERVED = "RESERVED"
MAP_ZONE_STATUS_INACTIVE = "INACTIVE"

MAP_ZONE_STATUSES = [
    MAP_ZONE_STATUS_AVAILABLE,
    MAP_ZONE_STATUS_OCCUPIED,
    MAP_ZONE_STATUS_RESERVED,
    MAP_ZONE_STATUS_INACTIVE
]


MAP_ZONE_TYPE_TABLE = "TABLE"
MAP_ZONE_TYPE_COUNTER = "COUNTER"
MAP_ZONE_TYPE_DELIVERY = "DELIVERY"
MAP_ZONE_TYPE_TERRACE = "TERRACE"
MAP_ZONE_TYPE_CASHIER = "CASHIER"
MAP_ZONE_TYPE_OTHER = "OTHER"

MAP_ZONE_TYPES = [
    MAP_ZONE_TYPE_TABLE,
    MAP_ZONE_TYPE_COUNTER,
    MAP_ZONE_TYPE_DELIVERY,
    MAP_ZONE_TYPE_TERRACE,
    MAP_ZONE_TYPE_CASHIER,
    MAP_ZONE_TYPE_OTHER
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


def create_default_map_layout_document() -> dict[str, Any]:
    """
    Crea documento base para el layout principal del mapa.
    """
    now = get_current_utc_datetime()

    return {
        "layoutId": MAP_LAYOUT_DEFAULT_ID,
        "name": MAP_LAYOUT_DEFAULT_NAME,
        "description": MAP_LAYOUT_DEFAULT_DESCRIPTION,
        "backgroundImageUrl": None,
        "active": True,
        "width": 100,
        "height": 100,
        "createdAt": now,
        "updatedAt": now
    }


def create_map_zone_document(
    name: str,
    zone_type: str,
    status: str,
    x: float,
    y: float,
    width: float,
    height: float,
    color: str = "#3B82F6",
    description: str = "",
    layout_id: str = MAP_LAYOUT_DEFAULT_ID,
    capacity: int | None = None,
    assigned_user_id: str | None = None,
    assigned_user_name: str | None = None,
    current_order_id: str | None = None,
    current_order_folio: str | None = None,
    current_order_total: float | None = None
) -> dict[str, Any]:
    """
    Crea documento base de una zona del mapa.
    """
    now = get_current_utc_datetime()

    return {
        "layoutId": layout_id,
        "name": name,
        "nameNormalized": name.lower().strip(),
        "type": zone_type,
        "status": status,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
        "capacity": capacity,
        "color": color,
        "description": description,
        "assignedUserId": assigned_user_id,
        "assignedUserName": assigned_user_name,
        "currentOrderId": current_order_id,
        "currentOrderFolio": current_order_folio,
        "currentOrderTotal": current_order_total,
        "totalSales": 0,
        "totalOrders": 0,
        "createdAt": now,
        "updatedAt": now
    }


def map_zone_document_to_response(zone: dict[str, Any]) -> dict[str, Any]:
    """
    Convierte documento de MongoDB a respuesta para Angular.
    """
    zone_id = object_id_to_str(zone.get("_id"))

    return {
        "id": zone_id,
        "layoutId": zone.get("layoutId", MAP_LAYOUT_DEFAULT_ID),
        "name": zone.get("name", ""),
        "type": zone.get("type", MAP_ZONE_TYPE_OTHER),
        "status": zone.get("status", MAP_ZONE_STATUS_AVAILABLE),
        "x": zone.get("x", 0),
        "y": zone.get("y", 0),
        "width": zone.get("width", 10),
        "height": zone.get("height", 10),
        "capacity": zone.get("capacity"),
        "color": zone.get("color", "#3B82F6"),
        "description": zone.get("description", ""),
        "assignedUserId": zone.get("assignedUserId"),
        "assignedUserName": zone.get("assignedUserName"),
        "currentOrderId": zone.get("currentOrderId"),
        "currentOrderFolio": zone.get("currentOrderFolio"),
        "currentOrderTotal": zone.get("currentOrderTotal"),
        "totalSales": zone.get("totalSales", 0),
        "totalOrders": zone.get("totalOrders", 0),
        "createdAt": zone.get("createdAt"),
        "updatedAt": zone.get("updatedAt")
    }


def map_layout_document_to_response(
    layout: dict[str, Any],
    zones: list[dict[str, Any]]
) -> dict[str, Any]:
    """
    Convierte documento de layout a respuesta para Angular.
    """
    return {
        "id": layout.get("layoutId", MAP_LAYOUT_DEFAULT_ID),
        "name": layout.get("name", MAP_LAYOUT_DEFAULT_NAME),
        "description": layout.get("description", MAP_LAYOUT_DEFAULT_DESCRIPTION),
        "backgroundImageUrl": layout.get("backgroundImageUrl"),
        "active": layout.get("active", True),
        "width": layout.get("width", 100),
        "height": layout.get("height", 100),
        "zones": zones,
        "createdAt": layout.get("createdAt"),
        "updatedAt": layout.get("updatedAt")
    }


def create_map_occupancy_summary(
    zones: list[dict[str, Any]]
) -> dict[str, int]:
    """
    Calcula resumen de ocupación del mapa.
    """
    total_zones = len(zones)

    available_zones = len([
        zone
        for zone in zones
        if zone.get("status") == MAP_ZONE_STATUS_AVAILABLE
    ])

    occupied_zones = len([
        zone
        for zone in zones
        if zone.get("status") == MAP_ZONE_STATUS_OCCUPIED
    ])

    reserved_zones = len([
        zone
        for zone in zones
        if zone.get("status") == MAP_ZONE_STATUS_RESERVED
    ])

    inactive_zones = len([
        zone
        for zone in zones
        if zone.get("status") == MAP_ZONE_STATUS_INACTIVE
    ])

    return {
        "totalZones": total_zones,
        "availableZones": available_zones,
        "occupiedZones": occupied_zones,
        "reservedZones": reserved_zones,
        "inactiveZones": inactive_zones
    }