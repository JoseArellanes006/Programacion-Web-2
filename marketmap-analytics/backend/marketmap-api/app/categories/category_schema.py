"""
Schemas de categorías.

Se usan strings directos en Literal para evitar avisos de Pylance.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


CategoryStatus = Literal[
    "ACTIVE",
    "INACTIVE"
]


class CategoryResponse(BaseModel):
    """
    Respuesta de categoría.
    """

    id: str
    name: str
    description: str = ""
    status: CategoryStatus
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class CategoryCreateRequest(BaseModel):
    """
    Solicitud para crear categoría.
    """

    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=500)
    status: CategoryStatus = "ACTIVE"


class CategoryUpdateRequest(BaseModel):
    """
    Solicitud para actualizar categoría.
    """

    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=500)
    status: CategoryStatus = "ACTIVE"


class CategoryStatusUpdateRequest(BaseModel):
    """
    Solicitud para cambiar estado de categoría.
    """

    status: CategoryStatus