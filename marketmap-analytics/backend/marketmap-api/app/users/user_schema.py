"""
Schemas de usuarios.

Los schemas definen la forma de entrada y salida de datos para FastAPI.

Aquí se separa:
- creación de usuario
- actualización de usuario
- cambio de rol
- cambio de estado
- respuesta segura al frontend

Nunca se expone passwordHash en respuestas.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


"""
Roles permitidos para los usuarios del sistema.

Importante:
Los valores se escriben directamente como strings dentro de Literal
para evitar el aviso de Pylance:

Variable not allowed in type expression
"""
UserRole = Literal[
    "ADMIN",
    "MANAGER",
    "SELLER",
    "CUSTOMER"
]


"""
Estados permitidos para los usuarios del sistema.
"""
UserStatus = Literal[
    "ACTIVE",
    "INACTIVE",
    "BLOCKED"
]


class UserResponse(BaseModel):
    """
    Respuesta segura de usuario.

    Este schema se usa para devolver información al frontend.

    No incluye:
    - passwordHash
    - resetPasswordToken
    - resetPasswordExpiresAt
    """

    id: str
    name: str
    email: EmailStr
    role: UserRole
    status: UserStatus
    avatarUrl: str | None = None
    createdAt: datetime | None = None
    updatedAt: datetime | None = None
    lastLoginAt: datetime | None = None


class UserCreateRequest(BaseModel):
    """
    Solicitud para crear usuario desde administración.
    """

    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = "CUSTOMER"
    status: UserStatus = "ACTIVE"


class UserUpdateRequest(BaseModel):
    """
    Solicitud para actualizar datos generales de usuario.
    """

    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    role: UserRole
    status: UserStatus


class UserRoleUpdateRequest(BaseModel):
    """
    Solicitud para cambiar rol.
    """

    role: UserRole


class UserStatusUpdateRequest(BaseModel):
    """
    Solicitud para cambiar estado.
    """

    status: UserStatus


class UserFilters(BaseModel):
    """
    Filtros internos para consultar usuarios.

    Este schema es útil para mantener tipado interno,
    aunque los filtros también pueden recibirse directamente
    como query params en las rutas.
    """

    search: str | None = None
    role: str | None = None
    status: str | None = None