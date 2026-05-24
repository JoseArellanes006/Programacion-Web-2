"""
Servicio de usuarios.

Este archivo contiene la lógica de negocio para administración de usuarios.

Responsabilidades:
- listar usuarios
- crear usuarios
- actualizar usuarios
- cambiar rol
- cambiar estado
- eliminar usuarios
- validar conflictos de correo

El acceso directo a MongoDB se realiza desde user_repository.py.
"""

from pymongo.errors import DuplicateKeyError

from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnprocessableEntityException
)
from app.core.security import hash_password
from app.users.user_model import (
    USER_ROLES,
    USER_STATUSES,
    create_user_document,
    user_document_to_response
)
from app.users.user_repository import (
    delete_user_by_id,
    find_user_by_email,
    find_user_by_id,
    insert_user,
    list_users,
    update_user_by_id
)
from app.users.user_schema import (
    UserCreateRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
    UserUpdateRequest
)


async def get_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None
) -> list[UserResponse]:
    """
    Obtiene usuarios usando filtros opcionales.
    """
    if role and role not in USER_ROLES:
        raise UnprocessableEntityException(
            message="Rol inválido."
        )

    if status and status not in USER_STATUSES:
        raise UnprocessableEntityException(
            message="Estado inválido."
        )

    users = await list_users(
        search=search,
        role=role,
        status=status
    )

    return [
        UserResponse(**user_document_to_response(user))
        for user in users
    ]


async def get_user(user_id: str) -> UserResponse:
    """
    Obtiene un usuario por id.
    """
    user = await find_user_by_id(user_id)

    if user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    return UserResponse(**user_document_to_response(user))


async def create_user(payload: UserCreateRequest) -> UserResponse:
    """
    Crea un usuario desde el panel administrativo.
    """
    existing_user = await find_user_by_email(str(payload.email))

    if existing_user is not None:
        raise ConflictException(
            message="El correo electrónico ya está registrado."
        )

    password_hash = hash_password(payload.password)

    user_document = create_user_document(
        name=payload.name.strip(),
        email=str(payload.email).lower().strip(),
        password_hash=password_hash,
        role=payload.role,
        status=payload.status
    )

    try:
        created_user = await insert_user(user_document)
    except DuplicateKeyError:
        raise ConflictException(
            message="El correo electrónico ya está registrado."
        )

    return UserResponse(**user_document_to_response(created_user))


async def update_user(
    user_id: str,
    payload: UserUpdateRequest
) -> UserResponse:
    """
    Actualiza datos administrativos de un usuario.
    """
    user = await find_user_by_id(user_id)

    if user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    normalized_email = str(payload.email).lower().strip()

    existing_email_user = await find_user_by_email(normalized_email)

    if (
        existing_email_user is not None
        and str(existing_email_user["_id"]) != user_id
    ):
        raise ConflictException(
            message="El correo electrónico ya está registrado por otro usuario."
        )

    updated_user = await update_user_by_id(
        user_id,
        {
            "name": payload.name.strip(),
            "email": normalized_email,
            "role": payload.role,
            "status": payload.status
        }
    )

    if updated_user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    return UserResponse(**user_document_to_response(updated_user))


async def update_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest
) -> UserResponse:
    """
    Cambia únicamente el rol de un usuario.
    """
    user = await find_user_by_id(user_id)

    if user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    updated_user = await update_user_by_id(
        user_id,
        {
            "role": payload.role
        }
    )

    if updated_user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    return UserResponse(**user_document_to_response(updated_user))


async def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest
) -> UserResponse:
    """
    Cambia únicamente el estado de un usuario.
    """
    user = await find_user_by_id(user_id)

    if user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    updated_user = await update_user_by_id(
        user_id,
        {
            "status": payload.status
        }
    )

    if updated_user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    return UserResponse(**user_document_to_response(updated_user))


async def delete_user(user_id: str) -> None:
    """
    Elimina un usuario.
    """
    deleted = await delete_user_by_id(user_id)

    if not deleted:
        raise NotFoundException(
            message="Usuario no encontrado."
        )