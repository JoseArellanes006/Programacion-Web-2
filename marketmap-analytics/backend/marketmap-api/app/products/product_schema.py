"""
Schemas de productos.

Los schemas definen la forma de entrada y salida para FastAPI.

Aquí se separa:
- creación de producto
- actualización de producto
- respuesta segura al frontend
- filtros de productos

Se usan strings directos dentro de Literal para evitar avisos de Pylance.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ProductStatus = Literal[
    "ACTIVE",
    "INACTIVE",
    "OUT_OF_STOCK"
]


class ProductResponse(BaseModel):
    """
    Respuesta de producto enviada al frontend.
    """

    id: str
    name: str
    description: str
    category: str
    price: float
    stock: int
    imageUrl: str | None = None
    status: ProductStatus
    featured: bool
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class ProductCreateRequest(BaseModel):
    """
    Solicitud para crear producto.
    """

    name: str = Field(min_length=2, max_length=150)
    description: str = Field(default="", max_length=1000)
    category: str = Field(min_length=2, max_length=100)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    imageUrl: str | None = None
    status: ProductStatus = "ACTIVE"
    featured: bool = False


class ProductUpdateRequest(BaseModel):
    """
    Solicitud para actualizar producto.
    """

    name: str = Field(min_length=2, max_length=150)
    description: str = Field(default="", max_length=1000)
    category: str = Field(min_length=2, max_length=100)
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    imageUrl: str | None = None
    status: ProductStatus = "ACTIVE"
    featured: bool = False


class ProductStatusUpdateRequest(BaseModel):
    """
    Solicitud para actualizar únicamente el estado del producto.
    """

    status: ProductStatus


class ProductFilters(BaseModel):
    """
    Filtros internos de productos.
    """

    search: str | None = None
    category: str | None = None
    status: str | None = None
    featured: bool | None = None