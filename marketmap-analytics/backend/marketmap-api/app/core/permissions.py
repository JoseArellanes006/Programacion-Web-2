"""
Permisos y roles del sistema.

Este archivo contiene utilidades para proteger endpoints según rol.

Roles esperados:
- ADMIN
- MANAGER
- SELLER
- CUSTOMER

La verificación se realiza a partir del token JWT.
El token debe contener el claim:
role
"""

from collections.abc import Callable
from typing import Any

from fastapi import Depends

from app.core.exceptions import ForbiddenException
from app.core.security import get_current_token_payload


ROLE_ADMIN = "ADMIN"
ROLE_MANAGER = "MANAGER"
ROLE_SELLER = "SELLER"
ROLE_CUSTOMER = "CUSTOMER"


def require_roles(
    allowed_roles: list[str]
) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Crea una dependencia para exigir uno o varios roles.

    Ejemplo de uso en un endpoint:

    @router.get("/users")
    async def get_users(
        payload: dict = Depends(require_roles(["ADMIN"]))
    ):
        return ...

    Si el usuario no tiene el rol requerido, se lanza error 403.
    """

    def role_checker(
        payload: dict[str, Any] = Depends(get_current_token_payload)
    ) -> dict[str, Any]:
        user_role = payload.get("role")

        if user_role not in allowed_roles:
            raise ForbiddenException(
                message="No tiene permisos suficientes para realizar esta acción.",
                detail=f"Roles permitidos: {', '.join(allowed_roles)}"
            )

        return payload

    return role_checker


def require_admin(
    payload: dict[str, Any] = Depends(require_roles([ROLE_ADMIN]))
) -> dict[str, Any]:
    """
    Permite acceso únicamente a ADMIN.
    """
    return payload


def require_admin_or_manager(
    payload: dict[str, Any] = Depends(
        require_roles([
            ROLE_ADMIN,
            ROLE_MANAGER
        ])
    )
) -> dict[str, Any]:
    """
    Permite acceso a ADMIN y MANAGER.
    """
    return payload


def require_admin_manager_or_seller(
    payload: dict[str, Any] = Depends(
        require_roles([
            ROLE_ADMIN,
            ROLE_MANAGER,
            ROLE_SELLER
        ])
    )
) -> dict[str, Any]:
    """
    Permite acceso a ADMIN, MANAGER y SELLER.
    """
    return payload


def require_authenticated_user(
    payload: dict[str, Any] = Depends(get_current_token_payload)
) -> dict[str, Any]:
    """
    Permite acceso a cualquier usuario autenticado.
    """
    return payload


def can_manage_users(
    payload: dict[str, Any] = Depends(require_admin)
) -> dict[str, Any]:
    """
    Permiso para administración de usuarios.

    Por seguridad, solo ADMIN debe poder crear, editar, bloquear
    o eliminar usuarios.
    """
    return payload


def can_manage_products(
    payload: dict[str, Any] = Depends(require_admin_manager_or_seller)
) -> dict[str, Any]:
    """
    Permiso para administrar productos.
    """
    return payload


def can_manage_orders(
    payload: dict[str, Any] = Depends(require_admin_manager_or_seller)
) -> dict[str, Any]:
    """
    Permiso para administrar pedidos y ventas.
    """
    return payload


def can_view_reports(
    payload: dict[str, Any] = Depends(require_admin_or_manager)
) -> dict[str, Any]:
    """
    Permiso para consultar y descargar reportes.
    """
    return payload


def can_manage_map(
    payload: dict[str, Any] = Depends(require_admin_manager_or_seller)
) -> dict[str, Any]:
    """
    Permiso para consultar y actualizar el mapa interactivo.
    """
    return payload