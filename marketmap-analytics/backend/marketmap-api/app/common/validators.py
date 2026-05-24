"""
Validadores comunes.

Este archivo contiene funciones reutilizables de validación para:
- correos
- textos
- ObjectId de MongoDB
- números positivos
- estados permitidos
- extensiones y tipos de archivo

La idea es no repetir validaciones simples en cada servicio.
"""

import re
from typing import Any

from bson import ObjectId

from app.core.exceptions import BadRequestException, UnprocessableEntityException


EMAIL_PATTERN = re.compile(
    r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
)


def validate_object_id(
    value: str,
    field_name: str = "id"
) -> None:
    """
    Valida que un string sea un ObjectId válido de MongoDB.
    """
    if not ObjectId.is_valid(value):
        raise BadRequestException(
            message=f"{field_name} inválido.",
            detail="El identificador no tiene formato válido de MongoDB."
        )


def validate_email(value: str) -> None:
    """
    Valida formato básico de correo electrónico.
    """
    if not EMAIL_PATTERN.match(value):
        raise UnprocessableEntityException(
            message="Correo electrónico inválido."
        )


def validate_non_empty_text(
    value: str,
    field_name: str,
    min_length: int = 1,
    max_length: int | None = None
) -> None:
    """
    Valida que un texto no esté vacío y respete longitud.
    """
    clean_value = value.strip()

    if len(clean_value) < min_length:
        raise UnprocessableEntityException(
            message=f"{field_name} debe tener al menos {min_length} caracteres."
        )

    if max_length is not None and len(clean_value) > max_length:
        raise UnprocessableEntityException(
            message=f"{field_name} no debe superar {max_length} caracteres."
        )


def validate_positive_number(
    value: int | float,
    field_name: str
) -> None:
    """
    Valida que un número sea mayor o igual a cero.
    """
    if value < 0:
        raise UnprocessableEntityException(
            message=f"{field_name} no puede ser negativo."
        )


def validate_allowed_value(
    value: Any,
    allowed_values: list[Any],
    field_name: str
) -> None:
    """
    Valida que un valor esté dentro de una lista permitida.
    """
    if value not in allowed_values:
        allowed_text = ", ".join(str(item) for item in allowed_values)

        raise UnprocessableEntityException(
            message=f"{field_name} inválido.",
            detail=f"Valores permitidos: {allowed_text}"
        )


def validate_file_extension(
    filename: str,
    allowed_extensions: list[str]
) -> None:
    """
    Valida extensión de archivo.

    Ejemplo:
    allowed_extensions = [".jpg", ".png", ".webp"]
    """
    clean_filename = filename.lower().strip()

    if not any(clean_filename.endswith(ext.lower()) for ext in allowed_extensions):
        raise UnprocessableEntityException(
            message="Extensión de archivo no permitida.",
            detail=f"Extensiones permitidas: {', '.join(allowed_extensions)}"
        )


def validate_file_size(
    size: int,
    max_size: int
) -> None:
    """
    Valida tamaño máximo de archivo.
    """
    if size > max_size:
        raise UnprocessableEntityException(
            message="El archivo supera el tamaño máximo permitido.",
            detail=f"Tamaño máximo permitido: {max_size} bytes."
        )