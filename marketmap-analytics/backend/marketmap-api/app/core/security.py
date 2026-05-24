"""
Funciones de seguridad del backend.

Este archivo concentra utilidades relacionadas con:
- cifrado de contraseñas
- verificación de contraseñas
- creación de tokens JWT
- validación de tokens JWT
- extracción de información del usuario autenticado
- validación del estado actual del usuario en MongoDB
"""

from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UnauthorizedException
from app.users.user_model import (
    STATUS_ACTIVE,
    STATUS_BLOCKED,
    STATUS_INACTIVE
)
from app.users.user_repository import find_user_by_id


password_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    """
    Cifra una contraseña usando bcrypt.

    La contraseña original nunca debe guardarse en MongoDB.
    """
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica si una contraseña en texto plano coincide con su hash.
    """
    return password_context.verify(plain_password, hashed_password)


def create_access_token(data: dict[str, Any]) -> str:
    """
    Crea un token JWT de acceso.

    data puede incluir:
    - sub: id del usuario
    - email
    - role
    """
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = data.copy()
    payload.update({
        "type": "access",
        "exp": expires_at
    })

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return token


def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Crea un token JWT de refresco.

    Este token dura más tiempo que el access token.
    """
    expires_at = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )

    payload = data.copy()
    payload.update({
        "type": "refresh",
        "exp": expires_at
    })

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return token


def decode_token(token: str) -> dict[str, Any]:
    """
    Decodifica y valida un token JWT.

    Si el token es inválido o expiró, lanza UnauthorizedException.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )

        return payload

    except JWTError:
        raise UnauthorizedException(
            message="Token inválido o expirado."
        )


async def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme)
) -> dict[str, Any]:
    """
    Obtiene y valida el payload del token enviado en Authorization.

    Header esperado:
    Authorization: Bearer TOKEN

    Además de validar el JWT, esta función consulta MongoDB para verificar:
    - que el usuario todavía exista;
    - que el usuario esté ACTIVE;
    - que no esté BLOCKED;
    - que no esté INACTIVE.

    Esto evita que un usuario bloqueado siga usando el sistema con un token
    emitido antes del bloqueo.
    """
    if credentials is None:
        raise UnauthorizedException(
            message="No se proporcionó token de autenticación."
        )

    token = credentials.credentials
    payload = decode_token(token)

    if payload.get("type") != "access":
        raise UnauthorizedException(
            message="El token proporcionado no es un token de acceso."
        )

    user_id = payload.get("sub")

    if not user_id:
        raise UnauthorizedException(
            message="El token no contiene identificador de usuario."
        )

    user = await find_user_by_id(str(user_id))

    if user is None:
        raise UnauthorizedException(
            message="Usuario no encontrado."
        )

    user_status = user.get("status", STATUS_ACTIVE)

    if user_status == STATUS_BLOCKED:
        raise UnauthorizedException(
            message="La cuenta se encuentra bloqueada."
        )

    if user_status == STATUS_INACTIVE:
        raise UnauthorizedException(
            message="La cuenta se encuentra inactiva."
        )

    if user_status != STATUS_ACTIVE:
        raise UnauthorizedException(
            message="La cuenta no se encuentra activa."
        )

    payload["sub"] = str(user["_id"])
    payload["email"] = user.get("email")
    payload["role"] = user.get("role")
    payload["status"] = user_status

    return payload


def get_current_user_id(
    payload: dict[str, Any] = Depends(get_current_token_payload)
) -> str:
    """
    Obtiene el id del usuario autenticado desde el token.

    El id debe venir en el claim:
    sub
    """
    user_id = payload.get("sub")

    if not user_id:
        raise UnauthorizedException(
            message="El token no contiene identificador de usuario."
        )

    return str(user_id)


def get_current_user_role(
    payload: dict[str, Any] = Depends(get_current_token_payload)
) -> str:
    """
    Obtiene el rol vigente del usuario autenticado.

    Importante:
    El rol se actualiza desde MongoDB dentro de get_current_token_payload.
    Así, si un administrador cambia el rol del usuario, el backend usa
    el rol actual y no solamente el rol viejo guardado en el JWT.
    """
    role = payload.get("role")

    if not role:
        raise UnauthorizedException(
            message="El token no contiene rol de usuario."
        )

    return str(role)