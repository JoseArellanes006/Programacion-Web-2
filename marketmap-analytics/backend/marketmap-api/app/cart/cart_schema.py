"""
Schemas del carrito.

Estos schemas son compatibles con el frontend Angular:
- Cart
- CartItem
- AddCartItemRequest
- UpdateCartItemRequest
- CheckoutRequest
- CheckoutResponse
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


CartStatus = Literal[
    "ACTIVE",
    "CHECKED_OUT",
    "CANCELLED"
]

PaymentMethod = Literal[
    "CASH",
    "CARD",
    "TRANSFER",
    "ONLINE"
]


class CartItemResponse(BaseModel):
    """
    Item del carrito.
    """

    id: str
    productId: str
    productName: str
    category: str | None = None
    unitPrice: float
    quantity: int
    subtotal: float
    imageUrl: str | None = None
    availableStock: int | None = None
    available: bool = True


class CartResponse(BaseModel):
    """
    Respuesta completa del carrito.
    """

    id: str
    userId: str
    items: list[CartItemResponse]
    totalItems: int
    subtotal: float
    tax: float
    discount: float
    total: float
    status: CartStatus
    createdAt: datetime | None = None
    updatedAt: datetime | None = None


class AddCartItemRequest(BaseModel):
    """
    Solicitud para agregar producto al carrito.
    """

    productId: str
    quantity: int = Field(ge=1)


class UpdateCartItemRequest(BaseModel):
    """
    Solicitud para actualizar cantidad de un producto del carrito.
    """

    quantity: int = Field(ge=1)


class CheckoutRequest(BaseModel):
    """
    Solicitud para confirmar compra.

    El método de pago ahora es obligatorio para evitar pedidos
    con paymentMethod = NOT_DEFINED.
    """

    paymentMethod: PaymentMethod


class CheckoutResponse(BaseModel):
    """
    Respuesta después de convertir carrito en pedido.
    """

    orderId: str
    message: str
    total: float