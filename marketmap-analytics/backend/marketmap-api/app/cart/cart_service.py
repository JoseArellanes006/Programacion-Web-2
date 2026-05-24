"""
Servicio del carrito.

Contiene la lógica de negocio del carrito:
- obtener carrito activo
- agregar producto
- actualizar cantidad
- eliminar producto
- limpiar carrito
- checkout

Regla principal:
El frontend envía productId. El backend valida producto, stock, precio,
método de pago y recalcula todos los totales.
"""

from typing import Any

from app.cart.cart_model import (
    CART_STATUS_CHECKED_OUT,
    cart_document_to_response,
    create_cart_document,
    create_cart_item_document,
    recalculate_cart_document
)
from app.cart.cart_repository import (
    find_active_cart_by_user_id,
    insert_cart,
    update_cart_by_id
)
from app.cart.cart_schema import (
    AddCartItemRequest,
    CartResponse,
    CheckoutRequest,
    CheckoutResponse,
    UpdateCartItemRequest
)
from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    UnprocessableEntityException
)
from app.orders.order_service import create_order_from_cart
from app.products.product_repository import (
    decrement_product_stock,
    find_product_by_id
)


PRODUCT_STATUS_ACTIVE = "ACTIVE"


async def get_or_create_active_cart(user_id: str) -> dict[str, Any]:
    """
    Obtiene el carrito activo del usuario.

    Si no existe, crea uno vacío.
    """
    cart = await find_active_cart_by_user_id(user_id)

    if cart is not None:
        return cart

    cart_document = create_cart_document(
        user_id=user_id,
        items=[]
    )

    return await insert_cart(cart_document)


def is_product_available_for_quantity(
    product: dict[str, Any],
    quantity: int
) -> bool:
    """
    Verifica si un producto está disponible para la cantidad solicitada.
    """
    if product.get("status") != PRODUCT_STATUS_ACTIVE:
        return False

    stock = int(product.get("stock", 0))

    return stock >= quantity


async def sync_cart_with_products(cart: dict[str, Any]) -> dict[str, Any]:
    """
    Sincroniza el carrito con el estado actual de productos.

    Actualiza:
    - nombre
    - categoría
    - precio actual
    - imagen
    - stock disponible
    - disponibilidad
    """
    items = cart.get("items", [])
    synced_items: list[dict[str, Any]] = []

    for item in items:
        product_id = item.get("productId", "")
        quantity = int(item.get("quantity", 0))

        product = await find_product_by_id(product_id)

        if product is None:
            item["available"] = False
            item["availableStock"] = 0
            synced_items.append(item)
            continue

        stock = int(product.get("stock", 0))
        available = is_product_available_for_quantity(
            product=product,
            quantity=quantity
        )

        item["id"] = product_id
        item["productId"] = product_id
        item["productName"] = product.get("name", item.get("productName", ""))
        item["category"] = product.get("category")
        item["unitPrice"] = float(product.get("price", item.get("unitPrice", 0)))
        item["imageUrl"] = product.get("imageUrl")
        item["availableStock"] = stock
        item["available"] = available

        synced_items.append(item)

    cart["items"] = synced_items
    cart = recalculate_cart_document(cart)

    updated_cart = await update_cart_by_id(
        str(cart["_id"]),
        {
            "items": cart["items"],
            "totalItems": cart["totalItems"],
            "subtotal": cart["subtotal"],
            "tax": cart["tax"],
            "discount": cart["discount"],
            "total": cart["total"]
        }
    )

    if updated_cart is None:
        raise BadRequestException(
            message="No fue posible sincronizar el carrito."
        )

    return updated_cart


async def get_cart(user_id: str) -> CartResponse:
    """
    Devuelve carrito activo del usuario.
    """
    cart = await get_or_create_active_cart(user_id)

    synced_cart = await sync_cart_with_products(cart)

    return CartResponse(**cart_document_to_response(synced_cart))


async def add_item_to_cart(
    user_id: str,
    payload: AddCartItemRequest
) -> CartResponse:
    """
    Agrega producto al carrito.

    Si el producto ya existe en el carrito, aumenta su cantidad.
    """
    product = await find_product_by_id(payload.productId)

    if product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    if product.get("status") != PRODUCT_STATUS_ACTIVE:
        raise UnprocessableEntityException(
            message="El producto no está disponible."
        )

    stock = int(product.get("stock", 0))

    if payload.quantity > stock:
        raise UnprocessableEntityException(
            message="No hay stock suficiente para agregar el producto."
        )

    cart = await get_or_create_active_cart(user_id)

    items = cart.get("items", [])

    existing_item = next(
        (
            item
            for item in items
            if item.get("productId") == payload.productId
        ),
        None
    )

    if existing_item:
        new_quantity = int(existing_item.get("quantity", 0)) + payload.quantity

        if new_quantity > stock:
            raise UnprocessableEntityException(
                message="No hay stock suficiente para esa cantidad."
            )

        existing_item["id"] = payload.productId
        existing_item["quantity"] = new_quantity
        existing_item["productName"] = product.get("name", "")
        existing_item["category"] = product.get("category")
        existing_item["unitPrice"] = float(product.get("price", 0))
        existing_item["imageUrl"] = product.get("imageUrl")
        existing_item["availableStock"] = stock
        existing_item["available"] = True
    else:
        item = create_cart_item_document(
            product_id=str(product["_id"]),
            product_name=product.get("name", ""),
            category=product.get("category"),
            unit_price=float(product.get("price", 0)),
            quantity=payload.quantity,
            image_url=product.get("imageUrl"),
            available_stock=stock,
            available=True
        )

        items.append(item)

    cart["items"] = items
    cart = recalculate_cart_document(cart)

    updated_cart = await update_cart_by_id(
        str(cart["_id"]),
        {
            "items": cart["items"],
            "totalItems": cart["totalItems"],
            "subtotal": cart["subtotal"],
            "tax": cart["tax"],
            "discount": cart["discount"],
            "total": cart["total"]
        }
    )

    if updated_cart is None:
        raise BadRequestException(
            message="No fue posible actualizar el carrito."
        )

    return CartResponse(**cart_document_to_response(updated_cart))


async def update_cart_item(
    user_id: str,
    product_id: str,
    payload: UpdateCartItemRequest
) -> CartResponse:
    """
    Actualiza cantidad de un producto del carrito usando productId.
    """
    cart = await get_or_create_active_cart(user_id)

    items = cart.get("items", [])

    item = next(
        (
            cart_item
            for cart_item in items
            if cart_item.get("productId") == product_id
        ),
        None
    )

    if item is None:
        raise NotFoundException(
            message="Producto no encontrado en el carrito."
        )

    product = await find_product_by_id(product_id)

    if product is None:
        raise NotFoundException(
            message="Producto no encontrado."
        )

    if product.get("status") != PRODUCT_STATUS_ACTIVE:
        raise UnprocessableEntityException(
            message="El producto no está disponible."
        )

    stock = int(product.get("stock", 0))

    if payload.quantity > stock:
        raise UnprocessableEntityException(
            message="No hay stock suficiente para esa cantidad."
        )

    item["id"] = product_id
    item["quantity"] = payload.quantity
    item["productName"] = product.get("name", "")
    item["category"] = product.get("category")
    item["unitPrice"] = float(product.get("price", 0))
    item["imageUrl"] = product.get("imageUrl")
    item["availableStock"] = stock
    item["available"] = True

    cart["items"] = items
    cart = recalculate_cart_document(cart)

    updated_cart = await update_cart_by_id(
        str(cart["_id"]),
        {
            "items": cart["items"],
            "totalItems": cart["totalItems"],
            "subtotal": cart["subtotal"],
            "tax": cart["tax"],
            "discount": cart["discount"],
            "total": cart["total"]
        }
    )

    if updated_cart is None:
        raise BadRequestException(
            message="No fue posible actualizar el carrito."
        )

    return CartResponse(**cart_document_to_response(updated_cart))


async def remove_cart_item(
    user_id: str,
    product_id: str
) -> CartResponse:
    """
    Elimina un producto del carrito usando productId.
    """
    cart = await get_or_create_active_cart(user_id)

    items = cart.get("items", [])

    new_items = [
        item
        for item in items
        if item.get("productId") != product_id
    ]

    if len(new_items) == len(items):
        raise NotFoundException(
            message="Producto no encontrado en el carrito."
        )

    cart["items"] = new_items
    cart = recalculate_cart_document(cart)

    updated_cart = await update_cart_by_id(
        str(cart["_id"]),
        {
            "items": cart["items"],
            "totalItems": cart["totalItems"],
            "subtotal": cart["subtotal"],
            "tax": cart["tax"],
            "discount": cart["discount"],
            "total": cart["total"]
        }
    )

    if updated_cart is None:
        raise BadRequestException(
            message="No fue posible actualizar el carrito."
        )

    return CartResponse(**cart_document_to_response(updated_cart))


async def clear_cart(user_id: str) -> CartResponse:
    """
    Vacía el carrito activo.
    """
    cart = await get_or_create_active_cart(user_id)

    cart["items"] = []
    cart = recalculate_cart_document(cart)

    updated_cart = await update_cart_by_id(
        str(cart["_id"]),
        {
            "items": [],
            "totalItems": 0,
            "subtotal": 0,
            "tax": 0,
            "discount": 0,
            "total": 0
        }
    )

    if updated_cart is None:
        raise BadRequestException(
            message="No fue posible limpiar el carrito."
        )

    return CartResponse(**cart_document_to_response(updated_cart))


async def checkout_cart(
    user_id: str,
    payload: CheckoutRequest
) -> CheckoutResponse:
    """
    Convierte el carrito activo en pedido.

    Reglas:
    - el carrito no debe estar vacío
    - debe existir método de pago
    - cada producto debe existir
    - cada producto debe estar ACTIVE
    - debe haber stock suficiente
    - se descuenta stock
    - se crea pedido con paymentMethod
    - el carrito se marca como CHECKED_OUT
    """
    cart = await get_or_create_active_cart(user_id)
    cart = await sync_cart_with_products(cart)

    items = cart.get("items", [])

    if not items:
        raise BadRequestException(
            message="El carrito está vacío."
        )

    for item in items:
        if not item.get("available", False):
            raise UnprocessableEntityException(
                message=f"El producto {item.get('productName', '')} no está disponible para compra."
            )

    for item in items:
        product_id = item.get("productId", "")
        quantity = int(item.get("quantity", 0))

        updated_product = await decrement_product_stock(
            product_id=product_id,
            quantity=quantity
        )

        if updated_product is None:
            raise UnprocessableEntityException(
                message=f"No hay stock suficiente para {item.get('productName', '')}."
            )

    order = await create_order_from_cart(
        user_id=user_id,
        cart=cart,
        payment_method=payload.paymentMethod
    )

    await update_cart_by_id(
        str(cart["_id"]),
        {
            "status": CART_STATUS_CHECKED_OUT
        }
    )

    return CheckoutResponse(
        orderId=order.id,
        message="Pedido generado correctamente.",
        total=order.total
    )