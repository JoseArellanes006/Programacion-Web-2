"""
Rutas de usuarios.

Este archivo expone endpoints administrativos para usuarios.

Endpoints:
- GET /users
- GET /users/{user_id}
- POST /users
- PUT /users/{user_id}
- PATCH /users/{user_id}/role
- PATCH /users/{user_id}/status
- DELETE /users/{user_id}

Todos estos endpoints están pensados para el panel de administración.
"""

from fastapi import APIRouter, Depends, Query, status

from app.core.permissions import can_manage_users
from app.users.user_schema import (
    UserCreateRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
    UserUpdateRequest
)
from app.users.user_service import (
    create_user,
    delete_user,
    get_user,
    get_users,
    update_user,
    update_user_role,
    update_user_status
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get(
    "",
    response_model=list[UserResponse],
    dependencies=[Depends(can_manage_users)]
)
async def list_users_endpoint(
    search: str | None = Query(default=None),
    role: str | None = Query(default=None),
    status: str | None = Query(default=None)
):
    """
    Lista usuarios con filtros opcionales.
    """
    return await get_users(
        search=search,
        role=role,
        status=status
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(can_manage_users)]
)
async def get_user_endpoint(user_id: str):
    """
    Obtiene un usuario por id.
    """
    return await get_user(user_id)


@router.post(
    "",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(can_manage_users)]
)
async def create_user_endpoint(payload: UserCreateRequest):
    """
    Crea un usuario.
    """
    return await create_user(payload)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    dependencies=[Depends(can_manage_users)]
)
async def update_user_endpoint(
    user_id: str,
    payload: UserUpdateRequest
):
    """
    Actualiza un usuario.
    """
    return await update_user(
        user_id=user_id,
        payload=payload
    )


@router.patch(
    "/{user_id}/role",
    response_model=UserResponse,
    dependencies=[Depends(can_manage_users)]
)
async def update_user_role_endpoint(
    user_id: str,
    payload: UserRoleUpdateRequest
):
    """
    Cambia el rol de un usuario.
    """
    return await update_user_role(
        user_id=user_id,
        payload=payload
    )


@router.patch(
    "/{user_id}/status",
    response_model=UserResponse,
    dependencies=[Depends(can_manage_users)]
)
async def update_user_status_endpoint(
    user_id: str,
    payload: UserStatusUpdateRequest
):
    """
    Cambia el estado de un usuario.
    """
    return await update_user_status(
        user_id=user_id,
        payload=payload
    )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(can_manage_users)]
)
async def delete_user_endpoint(user_id: str):
    """
    Elimina un usuario.
    """
    await delete_user(user_id)
    return None