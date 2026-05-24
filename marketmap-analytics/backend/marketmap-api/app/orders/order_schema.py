"""
Schemas de pedidos.

Estos schemas son compatibles con el frontend Angular.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


OrderStatus = Literal[
    "PENDING",
    "PAID",
    "CANCELLED",
    "DELIVERED"
]

PaymentMethod = Literal[
    "CASH",
    "CARD",
    "TRANSFER",
    "ONLINE",
    "NOT_DEFINED"
]


class OrderDetailResponse(BaseModel):
    """
    Detalle de producto vendido.
    """

    id: str
    productId: str
    productName: str
    category: str | None = None
    unitPrice: float
    quantity: int
    subtotal: float
    imageUrl: str | None = None


class OrderResponse(BaseModel):
    """
    Respuesta de pedido.
    """

    id: str
    folio: str
    customerId: str | None = None
    customerName: str
    status: OrderStatus
    paymentMethod: PaymentMethod
    details: list[OrderDetailResponse]
    totalItems: int
    subtotal: float
    tax: float
    discount: float
    total: float
    createdAt: datetime
    updatedAt: datetime | None = None


class UpdateOrderStatusRequest(BaseModel):
    """
    Solicitud para actualizar estado de pedido.
    """

    status: OrderStatus