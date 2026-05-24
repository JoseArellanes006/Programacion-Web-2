"""
Utilidades de autenticación.

Este archivo contiene funciones auxiliares para:
- normalizar correos
- validar fortaleza de contraseña
- crear respuestas de sesión
- construir payloads para tokens JWT
"""

import re

from app.core.config import settings
from app.core.exceptions import UnprocessableEntityException
from app.core.security import create_access_token, create_refresh_token
from app.users.user_model import user_document_to_response
from app.users.user_schema import UserResponse


def normalize_email(email: str) -> str:
    """
    Normaliza un correo electrónico.

    Se usa para evitar duplicados por mayúsculas o espacios.
    """
    return email.lower().strip()


def validate_password_strength(password: str) -> None:
    """
    Valida reglas mínimas de contraseña.

    Las reglas se toman desde settings para mantener consistencia entre:
    - frontend
    - backend
    - registro
    - restablecimiento de contraseña

    Reglas disponibles:
    - longitud mínima
    - mayúscula
    - minúscula
    - número
    - carácter especial
    """
    errors: list[str] = []

    if len(password) < settings.PASSWORD_MIN_LENGTH:
        errors.append(
            f"La contraseña debe tener al menos {settings.PASSWORD_MIN_LENGTH} caracteres."
        )

    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
        errors.append(
            "La contraseña debe incluir al menos una letra mayúscula."
        )

    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
        errors.append(
            "La contraseña debe incluir al menos una letra minúscula."
        )

    if settings.PASSWORD_REQUIRE_NUMBER and not re.search(r"[0-9]", password):
        errors.append(
            "La contraseña debe incluir al menos un número."
        )

    if (
        settings.PASSWORD_REQUIRE_SPECIAL_CHARACTER
        and not re.search(r"[^A-Za-z0-9]", password)
    ):
        errors.append(
            "La contraseña debe incluir al menos un carácter especial."
        )

    if errors:
        raise UnprocessableEntityException(
            message=errors[0],
            detail=" ".join(errors)
        )


def create_token_payload(user: dict) -> dict:
    """
    Crea el payload base para JWT.

    Claims principales:
    - sub: id del usuario
    - email
    - role
    """
    return {
        "sub": str(user["_id"]),
        "email": user.get("email"),
        "role": user.get("role")
    }


def create_auth_session_response(user: dict) -> dict:
    """
    Crea la respuesta completa de autenticación.

    Incluye:
    - accessToken
    - refreshToken
    - user
    """
    token_payload = create_token_payload(user)

    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    return {
        "accessToken": access_token,
        "refreshToken": refresh_token,
        "user": UserResponse(**user_document_to_response(user))
    }