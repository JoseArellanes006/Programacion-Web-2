"""
Modelo interno de usuarios.

Este archivo centraliza:
- constantes de roles
- constantes de estados
- creación de documentos para MongoDB
- conversión segura de documentos MongoDB a respuestas para el frontend

Regla importante:
MongoDB puede tener usuarios antiguos con el campo "avatar".
El frontend espera "avatarUrl".
Por eso user_document_to_response convierte ambos casos a "avatarUrl".
"""

from datetime import datetime, timezone
from typing import Any


ROLE_ADMIN = "ADMIN"
ROLE_MANAGER = "MANAGER"
ROLE_SELLER = "SELLER"
ROLE_CUSTOMER = "CUSTOMER"

USER_ROLES = [
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_SELLER,
    ROLE_CUSTOMER
]

STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
STATUS_BLOCKED = "BLOCKED"

USER_STATUSES = [
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    STATUS_BLOCKED
]


def get_current_utc_datetime() -> datetime:
    """
    Devuelve la fecha y hora actual en UTC.
    """
    return datetime.now(timezone.utc)


def create_user_document(
    name: str,
    email: str,
    password_hash: str,
    role: str = ROLE_CUSTOMER,
    status: str = STATUS_ACTIVE,
    avatar_url: str | None = None,
    provider: str = "local",
    google_id: str | None = None
) -> dict[str, Any]:
    """
    Crea un documento de usuario listo para guardar en MongoDB.

    El campo estándar para imagen de perfil será avatarUrl.
    """
    now = get_current_utc_datetime()

    user_document: dict[str, Any] = {
        "name": name,
        "email": email.lower().strip(),
        "passwordHash": password_hash,
        "role": role,
        "status": status,
        "avatarUrl": avatar_url,
        "provider": provider,
        "googleId": google_id,
        "createdAt": now,
        "updatedAt": now,
        "lastLoginAt": None,
        "resetPasswordToken": None,
        "resetPasswordExpiresAt": None
    }

    return user_document


def user_document_to_response(user: dict[str, Any]) -> dict[str, Any]:
    """
    Convierte un documento de MongoDB a una respuesta segura para Angular.

    No expone:
    - passwordHash
    - resetPasswordToken
    - resetPasswordExpiresAt

    También normaliza la imagen del usuario:
    - Si existe avatarUrl, usa avatarUrl.
    - Si no existe avatarUrl pero existe avatar, usa avatar.
    """
    avatar_url = user.get("avatarUrl") or user.get("avatar")

    return {
        "id": str(user.get("_id")),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", ROLE_CUSTOMER),
        "status": user.get("status", STATUS_ACTIVE),
        "avatarUrl": avatar_url,
        "createdAt": user.get("createdAt"),
        "updatedAt": user.get("updatedAt"),
        "lastLoginAt": user.get("lastLoginAt")
    }