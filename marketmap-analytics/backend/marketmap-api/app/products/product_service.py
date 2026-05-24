"""
Servicio de productos.

Este archivo contiene la lógica de negocio para productos.

Responsabilidades:
- validar datos
- consultar productos
- crear productos
- actualizar productos
- eliminar productos
- preparar respuestas para Angular
"""

from pymongo.errors import DuplicateKeyError

from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnprocessableEntityException
)
from app.products.product_model import (
    PRODUCT_STATUSES,
    create_product_document,
    normalize_product_status,
    product_document_to_response
)
from app.products.product_repository import (
    delete_product_by_id,
    find_product_by_id,
    find_product_by_name,
    insert_product,
    list_catalog_products,
    list_products,
    update_product_by_id
)
from app.products.product_schema import (
    ProductCreateRequest,
    ProductResponse,
    ProductStatusUpdateRequest,
    ProductUpdateRequest
)


async def get_products(
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    featured: bool | None = None
) -> list[ProductResponse]:
    """
    Obtiene productos con filtros opcionales.
    """
    if status and status not in PRODUCT_STATUSES:
        raise UnprocessableEntityException(
            message="Estado de producto inválido."
        )

    products = await list_products(
        search=search,
        category=category,
        status=status,
        featured=featured
    )

    return [
        ProductResponse(**product_document_to_response(product))
        for product in products
    ]


async def get_catalog_products() -> list[ProductResponse]:
    """
    Obtiene productos visibles en catálogo.
    """
    products = await list_catalog_products()

    return [
        ProductResponse(**product_document_to_response(product))
        for product in products
    ]


async def search_products(text: str) -> list[ProductResponse]:
    """
    Busca productos por texto.
    """
    products = await list_products(search=text)

    return [
        ProductResponse(**product_document_to_response(product))
        for product in products
    ]


async def get_products_by_category(category: str) -> list[ProductResponse]:
    """
    Obtiene productos por categoría.
    """
    products = await list_products(category=category)

    return [
        ProductResponse(**product_document_to_response(product))
        for product in products
    ]


async def get_product(product_id: str) -> ProductResponse:
    """
    Obtiene un producto por id.
    """
    product = await find_product_by_id(product_id)

    if product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    return ProductResponse(**product_document_to_response(product))


async def create_product(payload: ProductCreateRequest) -> ProductResponse:
    """
    Crea un producto.
    """
    existing_product = await find_product_by_name(payload.name)

    if existing_product is not None:
        raise ConflictException(
            message="Ya existe un producto con ese nombre."
        )

    product_document = create_product_document(
        name=payload.name.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        price=payload.price,
        stock=payload.stock,
        image_url=payload.imageUrl,
        status=payload.status,
        featured=payload.featured
    )

    try:
        created_product = await insert_product(product_document)
    except DuplicateKeyError:
        raise ConflictException(
            message="Ya existe un producto con ese nombre."
        )

    return ProductResponse(**product_document_to_response(created_product))


async def update_product(
    product_id: str,
    payload: ProductUpdateRequest
) -> ProductResponse:
    """
    Actualiza un producto.
    """
    product = await find_product_by_id(product_id)

    if product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    existing_product = await find_product_by_name(payload.name)

    if (
        existing_product is not None
        and str(existing_product["_id"]) != product_id
    ):
        raise ConflictException(
            message="Ya existe otro producto con ese nombre."
        )

    normalized_status = normalize_product_status(
        stock=payload.stock,
        status=payload.status
    )

    updated_product = await update_product_by_id(
        product_id,
        {
            "name": payload.name.strip(),
            "description": payload.description.strip(),
            "category": payload.category.strip(),
            "price": payload.price,
            "stock": payload.stock,
            "imageUrl": payload.imageUrl,
            "status": normalized_status,
            "featured": payload.featured
        }
    )

    if updated_product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    return ProductResponse(**product_document_to_response(updated_product))


async def update_product_status(
    product_id: str,
    payload: ProductStatusUpdateRequest
) -> ProductResponse:
    """
    Actualiza únicamente el estado de un producto.
    """
    product = await find_product_by_id(product_id)

    if product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    updated_product = await update_product_by_id(
        product_id,
        {
            "status": payload.status
        }
    )

    if updated_product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    return ProductResponse(**product_document_to_response(updated_product))


async def delete_product(product_id: str) -> None:
    """
    Elimina un producto.
    """
    deleted = await delete_product_by_id(product_id)

    if not deleted:
        raise NotFoundException(
            message="Producto no encontrado."
        )