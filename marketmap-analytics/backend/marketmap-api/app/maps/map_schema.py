"""
Schemas del mapa interactivo.

Estos schemas definen la estructura de entrada y salida para:
- layout activo
- imagen base del layout
- zonas del mapa
- resumen de ocupación
- cambios de estado
- actualización de posición
- asignación de zona
- liberación de zona
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


MapZoneStatus = Literal[
    "AVAILABLE",
    "OCCUPIED",
    "RESERVED",
    "INACTIVE"
]


MapZoneType = Literal[
    "TABLE",
    "COUNTER",
    "DELIVERY",
    "TERRACE",
    "CASHIER",
    "OTHER"
]


class MapZoneResponse(BaseModel):
    """
    Respuesta de una zona del mapa.

    Esta estructura está alineada con el modelo MapZone de Angular.
    """

    id: str
    layoutId: str
    name: str
    type: MapZoneType
    status: MapZoneStatus
    x: float
    y: float
    width: float
    height: float
    capacity: int | None = None
    color: str | None = None
    description: str = ""
    assignedUserId: str | None = None
    assignedUserName: str | None = None
    currentOrderId: str | None = None
    currentOrderFolio: str | None = None
    currentOrderTotal: float | None = None
    totalSales: float = 0
    totalOrders: int = 0
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class MapLayoutResponse(BaseModel):
    """
    Layout activo del mapa.

    Angular espera que el layout contenga directamente sus zonas.
    """

    id: str
    name: str
    description: str | None = None
    backgroundImageUrl: str | None = None
    active: bool
    width: float
    height: float
    zones: list[MapZoneResponse]
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class MapOccupancySummaryResponse(BaseModel):
    """
    Resumen de ocupación del mapa.
    """

    totalZones: int
    availableZones: int
    occupiedZones: int
    reservedZones: int
    inactiveZones: int


class InteractiveMapResponse(BaseModel):
    """
    Respuesta completa para la pantalla del mapa interactivo.
    """

    layout: MapLayoutResponse
    summary: MapOccupancySummaryResponse


class MapZoneCreateRequest(BaseModel):
    """
    Solicitud para crear una zona del mapa.
    """

    name: str = Field(min_length=2, max_length=120)
    type: MapZoneType = "OTHER"
    status: MapZoneStatus = "AVAILABLE"
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    width: float = Field(gt=0, le=100)
    height: float = Field(gt=0, le=100)
    capacity: int | None = Field(default=None, ge=1)
    color: str = Field(default="#3B82F6", min_length=4, max_length=20)
    description: str = Field(default="", max_length=500)
    layoutId: str | None = None
    assignedUserId: str | None = None
    assignedUserName: str | None = None
    currentOrderId: str | None = None
    currentOrderFolio: str | None = None
    currentOrderTotal: float | None = Field(default=None, ge=0)


class MapZoneUpdateRequest(BaseModel):
    """
    Solicitud para actualizar una zona del mapa.
    """

    name: str = Field(min_length=2, max_length=120)
    type: MapZoneType
    status: MapZoneStatus
    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    width: float = Field(gt=0, le=100)
    height: float = Field(gt=0, le=100)
    capacity: int | None = Field(default=None, ge=1)
    color: str = Field(min_length=4, max_length=20)
    description: str = Field(default="", max_length=500)
    layoutId: str | None = None
    assignedUserId: str | None = None
    assignedUserName: str | None = None
    currentOrderId: str | None = None
    currentOrderFolio: str | None = None
    currentOrderTotal: float | None = Field(default=None, ge=0)


class MapZonePositionUpdateRequest(BaseModel):
    """
    Solicitud para actualizar únicamente posición y tamaño visual.
    """

    x: float = Field(ge=0, le=100)
    y: float = Field(ge=0, le=100)
    width: float = Field(gt=0, le=100)
    height: float = Field(gt=0, le=100)


class MapZoneStatusUpdateRequest(BaseModel):
    """
    Solicitud para actualizar únicamente el estado de una zona.
    """

    status: MapZoneStatus


class MapZoneAssignmentRequest(BaseModel):
    """
    Solicitud para asignar una zona a un usuario, responsable o pedido.
    """

    assignedUserId: str | None = None
    assignedUserName: str | None = None
    currentOrderId: str | None = None
    currentOrderFolio: str | None = None
    currentOrderTotal: float | None = Field(default=None, ge=0)


class MapZoneSalesUpdateRequest(BaseModel):
    """
    Solicitud para actualizar datos comerciales de una zona.
    """

    totalSales: float = Field(ge=0)
    totalOrders: int = Field(ge=0)