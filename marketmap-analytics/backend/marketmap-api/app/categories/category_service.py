"""
Servicio de categorías.

Contiene lógica de negocio para:
- listar categorías
- crear categorías
- actualizar categorías
- eliminar categorías
"""

from pymongo.errors import DuplicateKeyError

from app.categories.category_model import (
    CATEGORY_STATUSES,
    category_document_to_response,
    create_category_document
)
from app.categories.category_repository import (
    delete_category_by_id,
    find_category_by_id,
    find_category_by_name,
    insert_category,
    list_active_categories,
    list_categories,
    update_category_by_id
)
from app.categories.category_schema import (
    CategoryCreateRequest,
    CategoryResponse,
    CategoryStatusUpdateRequest,
    CategoryUpdateRequest
)
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnprocessableEntityException
)


async def get_categories(
    search: str | None = None,
    status: str | None = None
) -> list[CategoryResponse]:
    """
    Obtiene categorías con filtros.
    """
    if status and status not in CATEGORY_STATUSES:
        raise UnprocessableEntityException(
            message="Estado de categoría inválido."
        )

    categories = await list_categories(
        search=search,
        status=status
    )

    return [
        CategoryResponse(**category_document_to_response(category))
        for category in categories
    ]


async def get_active_categories() -> list[CategoryResponse]:
    """
    Obtiene categorías activas.
    """
    categories = await list_active_categories()

    return [
        CategoryResponse(**category_document_to_response(category))
        for category in categories
    ]


async def get_category(category_id: str) -> CategoryResponse:
    """
    Obtiene categoría por id.
    """
    category = await find_category_by_id(category_id)

    if category is None:
        raise NotFoundException(
            message="Categoría no encontrada."
        )

    return CategoryResponse(**category_document_to_response(category))


async def create_category(
    payload: CategoryCreateRequest
) -> CategoryResponse:
    """
    Crea categoría.
    """
    existing_category = await find_category_by_name(payload.name)

    if existing_category is not None:
        raise ConflictException(
            message="Ya existe una categoría con ese nombre."
        )

    category_document = create_category_document(
        name=payload.name.strip(),
        description=payload.description.strip(),
        status=payload.status
    )

    try:
        created_category = await insert_category(category_document)
    except DuplicateKeyError:
        raise ConflictException(
            message="Ya existe una categoría con ese nombre."
        )

    return CategoryResponse(**category_document_to_response(created_category))


async def update_category(
    category_id: str,
    payload: CategoryUpdateRequest
) -> CategoryResponse:
    """
    Actualiza categoría.
    """
    category = await find_category_by_id(category_id)

    if category is None:
        raise NotFoundException(
            message="Categoría no encontrada."
        )

    existing_category = await find_category_by_name(payload.name)

    if (
        existing_category is not None
        and str(existing_category["_id"]) != category_id
    ):
        raise ConflictException(
            message="Ya existe otra categoría con ese nombre."
        )

    updated_category = await update_category_by_id(
        category_id,
        {
            "name": payload.name.strip(),
            "description": payload.description.strip(),
            "status": payload.status
        }
    )

    if updated_category is None:
        raise NotFoundException(
            message="Categoría no encontrada."
        )

    return CategoryResponse(**category_document_to_response(updated_category))


async def update_category_status(
    category_id: str,
    payload: CategoryStatusUpdateRequest
) -> CategoryResponse:
    """
    Cambia estado de categoría.
    """
    category = await find_category_by_id(category_id)

    if category is None:
        raise NotFoundException(
            message="Categoría no encontrada."
        )

    updated_category = await update_category_by_id(
        category_id,
        {
            "status": payload.status
        }
    )

    if updated_category is None:
        raise NotFoundException(
            message="Categoría no encontrada."
        )

    return CategoryResponse(**category_document_to_response(updated_category))


async def delete_category(category_id: str) -> None:
    """
    Elimina categoría.
    """
    deleted = await delete_category_by_id(category_id)

    if not deleted:
        raise NotFoundException(
            message="Categoría no encontrada."
        )