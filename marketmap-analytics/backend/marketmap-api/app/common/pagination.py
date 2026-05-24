"""
Utilidades de paginación.

Este archivo centraliza funciones y schemas para paginar resultados.

Aunque varios endpoints actuales devuelven listas completas,
esta utilidad permite evolucionar después hacia consultas paginadas
sin repetir lógica en cada módulo.
"""

from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, Field


T = TypeVar("T")


class PaginationParams(BaseModel):
    """
    Parámetros básicos de paginación.
    """

    page: int = Field(default=1, ge=1)
    pageSize: int = Field(default=10, ge=1, le=100)


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Respuesta paginada genérica.
    """

    items: list[T]
    page: int
    pageSize: int
    totalItems: int
    totalPages: int
    hasNextPage: bool
    hasPreviousPage: bool


def calculate_skip(
    page: int,
    page_size: int
) -> int:
    """
    Calcula cuántos documentos debe saltar MongoDB.

    Ejemplo:
    page = 1, page_size = 10 -> skip = 0
    page = 2, page_size = 10 -> skip = 10
    """
    safe_page = max(page, 1)
    safe_page_size = max(page_size, 1)

    return (safe_page - 1) * safe_page_size


def calculate_total_pages(
    total_items: int,
    page_size: int
) -> int:
    """
    Calcula el total de páginas.
    """
    if total_items <= 0:
        return 0

    return ceil(total_items / page_size)


def build_paginated_response(
    items: list[T],
    page: int,
    page_size: int,
    total_items: int
) -> PaginatedResponse[T]:
    """
    Construye una respuesta paginada.
    """
    total_pages = calculate_total_pages(
        total_items=total_items,
        page_size=page_size
    )

    return PaginatedResponse[T](
        items=items,
        page=page,
        pageSize=page_size,
        totalItems=total_items,
        totalPages=total_pages,
        hasNextPage=page < total_pages,
        hasPreviousPage=page > 1
    )