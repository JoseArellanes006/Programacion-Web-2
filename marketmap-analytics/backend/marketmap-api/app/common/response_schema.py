"""
Schemas comunes de respuesta.

Este archivo define estructuras generales que pueden reutilizarse
en distintos módulos del backend.

Sirve para mantener respuestas consistentes en endpoints donde no se
devuelve directamente un modelo específico.
"""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class MessageResponse(BaseModel):
    """
    Respuesta simple con mensaje.

    Ejemplo:
    {
        "success": true,
        "message": "Operación realizada correctamente."
    }
    """

    success: bool = True
    message: str


class ErrorResponse(BaseModel):
    """
    Respuesta estándar para errores controlados.

    El manejo global de errores en main.py ya usa una estructura similar.
    Este schema puede servir para documentación o respuestas manuales.
    """

    success: bool = False
    message: str
    detail: str | None = None


class DataResponse(BaseModel, Generic[T]):
    """
    Respuesta genérica con datos.

    Puede usarse cuando se quiera envolver una respuesta dentro de data.
    """

    success: bool = True
    message: str
    data: T


class ListResponse(BaseModel, Generic[T]):
    """
    Respuesta genérica para listas.
    """

    success: bool = True
    message: str
    items: list[T]
    total: int


class ActionResponse(BaseModel):
    """
    Respuesta para acciones sin modelo complejo.

    Ejemplo:
    - limpiar carrito
    - enviar notificación
    - sincronizar información
    """

    success: bool = True
    message: str
    metadata: dict[str, Any] | None = None