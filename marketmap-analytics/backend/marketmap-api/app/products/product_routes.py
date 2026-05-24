"""
Rutas de productos.

Endpoints:
- GET /products
- GET /products/catalog
- GET /products/search
- GET /products/category/{category}
- GET /products/{product_id}
- POST /products
- PUT /products/{product_id}
- PATCH /products/{product_id}/status
- DELETE /products/{product_id}
"""

from fastapi import APIRouter, Depends, Query, status

from app.core.permissions import (
    can_manage_products,
    require_authenticated_user
)
from app.products.product_schema import (
    ProductCreateRequest,
    ProductResponse,
    ProductStatusUpdateRequest,
    ProductUpdateRequest
)
from app.products.product_service import (
    create_product,
    delete_product,
    get_catalog_products,
    get_product,
    get_products,
    get_products_by_category,
    search_products,
    update_product,
    update_product_status
)


router = APIRouter(
    prefix="/products",
    tags=["Products"]
)


@router.get(
    "",
    response_model=list[ProductResponse],
    dependencies=[Depends(can_manage_products)]
)
async def list_products_endpoint(
    search: str | None = Query(default=None),
    category: str | None = Query(default=None),
    status: str | None = Query(default=None),
    featured: bool | None = Query(default=None)
):
    """
    Lista productos para administración.
    """
    return await get_products(
        search=search,
        category=category,
        status=status,
        featured=featured
    )


@router.get(
    "/catalog",
    response_model=list[ProductResponse],
    dependencies=[Depends(require_authenticated_user)]
)
async def catalog_products_endpoint():
    """
    Lista productos visibles en catálogo.
    """
    return await get_catalog_products()


@router.get(
    "/search",
    response_model=list[ProductResponse],
    dependencies=[Depends(require_authenticated_user)]
)
async def search_products_endpoint(
    text: str = Query(min_length=1)
):
    """
    Busca productos por texto.
    """
    return await search_products(text)


@router.get(
    "/category/{category}",
    response_model=list[ProductResponse],
    dependencies=[Depends(require_authenticated_user)]
)
async def products_by_category_endpoint(category: str):
    """
    Lista productos por categoría.
    """
    return await get_products_by_category(category)


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(require_authenticated_user)]
)
async def get_product_endpoint(product_id: str):
    """
    Obtiene un producto por id.
    """
    return await get_product(product_id)


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(can_manage_products)]
)
async def create_product_endpoint(payload: ProductCreateRequest):
    """
    Crea un producto.
    """
    return await create_product(payload)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    dependencies=[Depends(can_manage_products)]
)
async def update_product_endpoint(
    product_id: str,
    payload: ProductUpdateRequest
):
    """
    Actualiza un producto.
    """
    return await update_product(
        product_id=product_id,
        payload=payload
    )


@router.patch(
    "/{product_id}/status",
    response_model=ProductResponse,
    dependencies=[Depends(can_manage_products)]
)
async def update_product_status_endpoint(
    product_id: str,
    payload: ProductStatusUpdateRequest
):
    """
    Cambia el estado de un producto.
    """
    return await update_product_status(
        product_id=product_id,
        payload=payload
    )


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(can_manage_products)]
)
async def delete_product_endpoint(product_id: str):
    """
    Elimina un producto.
    """
    await delete_product(product_id)
    return None