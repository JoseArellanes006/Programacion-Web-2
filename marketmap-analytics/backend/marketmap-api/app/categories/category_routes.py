"""
Rutas de categorías.

Endpoints:
- GET /categories
- GET /categories/active
- GET /categories/{category_id}
- POST /categories
- PUT /categories/{category_id}
- PATCH /categories/{category_id}/status
- DELETE /categories/{category_id}
"""

from fastapi import APIRouter, Depends, Query, status

from app.categories.category_schema import (
    CategoryCreateRequest,
    CategoryResponse,
    CategoryStatusUpdateRequest,
    CategoryUpdateRequest
)
from app.categories.category_service import (
    create_category,
    delete_category,
    get_active_categories,
    get_categories,
    get_category,
    update_category,
    update_category_status
)
from app.core.permissions import (
    can_manage_products,
    require_authenticated_user
)


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.get(
    "",
    response_model=list[CategoryResponse],
    dependencies=[Depends(require_authenticated_user)]
)
async def list_categories_endpoint(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None)
):
    """
    Lista categorías.
    """
    return await get_categories(
        search=search,
        status=status
    )


@router.get(
    "/active",
    response_model=list[CategoryResponse],
    dependencies=[Depends(require_authenticated_user)]
)
async def active_categories_endpoint():
    """
    Lista categorías activas.
    """
    return await get_active_categories()


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(require_authenticated_user)]
)
async def get_category_endpoint(category_id: str):
    """
    Obtiene categoría por id.
    """
    return await get_category(category_id)


@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(can_manage_products)]
)
async def create_category_endpoint(payload: CategoryCreateRequest):
    """
    Crea categoría.
    """
    return await create_category(payload)


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    dependencies=[Depends(can_manage_products)]
)
async def update_category_endpoint(
    category_id: str,
    payload: CategoryUpdateRequest
):
    """
    Actualiza categoría.
    """
    return await update_category(
        category_id=category_id,
        payload=payload
    )


@router.patch(
    "/{category_id}/status",
    response_model=CategoryResponse,
    dependencies=[Depends(can_manage_products)]
)
async def update_category_status_endpoint(
    category_id: str,
    payload: CategoryStatusUpdateRequest
):
    """
    Cambia estado de categoría.
    """
    return await update_category_status(
        category_id=category_id,
        payload=payload
    )


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(can_manage_products)]
)
async def delete_category_endpoint(category_id: str):
    """
    Elimina categoría.
    """
    await delete_category(category_id)
    return None