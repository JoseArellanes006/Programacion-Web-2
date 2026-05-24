"""
Rutas del carrito.

Endpoints:
- GET /cart
- POST /cart/items
- PUT /cart/items/{product_id}
- DELETE /cart/items/{product_id}
- DELETE /cart/clear
- POST /cart/checkout
"""

from fastapi import APIRouter, Depends

from app.cart.cart_schema import (
    AddCartItemRequest,
    CartResponse,
    CheckoutRequest,
    CheckoutResponse,
    UpdateCartItemRequest
)
from app.cart.cart_service import (
    add_item_to_cart,
    checkout_cart,
    clear_cart,
    get_cart,
    remove_cart_item,
    update_cart_item
)
from app.core.permissions import require_authenticated_user


router = APIRouter(
    prefix="/cart",
    tags=["Cart"]
)


def get_user_id_from_payload(payload: dict) -> str:
    """
    Obtiene el id del usuario desde el payload JWT.

    Se aceptan varias claves para mantener compatibilidad:
    - sub
    - userId
    - id
    """
    return str(
        payload.get("sub")
        or payload.get("userId")
        or payload.get("id")
        or ""
    )


@router.get(
    "",
    response_model=CartResponse
)
async def get_cart_endpoint(
    payload: dict = Depends(require_authenticated_user)
):
    """
    Obtiene el carrito activo del usuario autenticado.
    """
    user_id = get_user_id_from_payload(payload)

    return await get_cart(user_id)


@router.post(
    "/items",
    response_model=CartResponse
)
async def add_cart_item_endpoint(
    request: AddCartItemRequest,
    payload: dict = Depends(require_authenticated_user)
):
    """
    Agrega un producto al carrito.
    """
    user_id = get_user_id_from_payload(payload)

    return await add_item_to_cart(
        user_id=user_id,
        payload=request
    )


@router.put(
    "/items/{product_id}",
    response_model=CartResponse
)
async def update_cart_item_endpoint(
    product_id: str,
    request: UpdateCartItemRequest,
    payload: dict = Depends(require_authenticated_user)
):
    """
    Actualiza la cantidad de un producto del carrito.
    """
    user_id = get_user_id_from_payload(payload)

    return await update_cart_item(
        user_id=user_id,
        product_id=product_id,
        payload=request
    )


@router.delete(
    "/items/{product_id}",
    response_model=CartResponse
)
async def remove_cart_item_endpoint(
    product_id: str,
    payload: dict = Depends(require_authenticated_user)
):
    """
    Elimina un producto del carrito.
    """
    user_id = get_user_id_from_payload(payload)

    return await remove_cart_item(
        user_id=user_id,
        product_id=product_id
    )


@router.delete(
    "/clear",
    response_model=CartResponse
)
async def clear_cart_endpoint(
    payload: dict = Depends(require_authenticated_user)
):
    """
    Limpia el carrito activo.
    """
    user_id = get_user_id_from_payload(payload)

    return await clear_cart(user_id)


@router.post(
    "/checkout",
    response_model=CheckoutResponse
)
async def checkout_cart_endpoint(
    request: CheckoutRequest,
    payload: dict = Depends(require_authenticated_user)
):
    """
    Confirma la compra y genera un pedido.

    Requiere método de pago.
    """
    user_id = get_user_id_from_payload(payload)

    return await checkout_cart(
        user_id=user_id,
        payload=request
    )