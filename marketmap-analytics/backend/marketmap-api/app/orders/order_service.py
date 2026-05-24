"""
Servicio de pedidos.

Contiene la lógica de negocio relacionada con pedidos y ventas.
"""

from datetime import datetime, timezone

from app.core.exceptions import (
    BadRequestException,
    NotFoundException,
    UnprocessableEntityException
)
from app.orders.order_model import (
    ORDER_STATUS_CANCELLED,
    ORDER_STATUS_DELIVERED,
    ORDER_STATUS_PAID,
    ORDER_STATUS_PENDING,
    ORDER_STATUSES,
    PAYMENT_METHODS,
    PAYMENT_METHOD_NOT_DEFINED,
    create_order_document,
    order_document_to_response
)
from app.orders.order_repository import (
    find_order_by_id,
    insert_order,
    list_orders,
    update_order_by_id
)
from app.orders.order_schema import (
    OrderResponse,
    UpdateOrderStatusRequest
)
from app.products.product_repository import increment_product_stock
from app.users.user_repository import find_user_by_id


def parse_datetime_filter(value: str | None) -> datetime | None:
    """
    Convierte un filtro de fecha recibido como string a datetime.

    Angular envía normalmente:
    - YYYY-MM-DD

    También se acepta:
    - YYYY-MM-DDTHH:mm:ss
    - ISO con Z
    """
    if not value:
        return None

    cleaned_value = value.strip()

    if not cleaned_value:
        return None

    try:
        if len(cleaned_value) == 10:
            return datetime.fromisoformat(cleaned_value).replace(
                tzinfo=timezone.utc
            )

        normalized_value = cleaned_value.replace("Z", "+00:00")
        parsed_value = datetime.fromisoformat(normalized_value)

        if parsed_value.tzinfo is None:
            parsed_value = parsed_value.replace(tzinfo=timezone.utc)

        return parsed_value
    except ValueError:
        raise UnprocessableEntityException(
            message="Formato de fecha inválido."
        )


async def create_order_from_cart(
    user_id: str,
    cart: dict,
    payment_method: str
) -> OrderResponse:
    """
    Crea pedido a partir de un carrito.

    Esta función es usada por el checkout del carrito.

    Ahora exige método de pago válido para evitar pedidos con
    paymentMethod = NOT_DEFINED.
    """
    if payment_method not in PAYMENT_METHODS:
        raise UnprocessableEntityException(
            message="Método de pago inválido."
        )

    if payment_method == PAYMENT_METHOD_NOT_DEFINED:
        raise BadRequestException(
            message="Debe seleccionar un método de pago para generar el pedido."
        )

    user = await find_user_by_id(user_id)

    if user is None:
        customer_name = "Cliente"
    else:
        customer_name = user.get("name", "Cliente")

    order_document = create_order_document(
        user_id=user_id,
        customer_name=customer_name,
        cart=cart,
        payment_method=payment_method
    )

    created_order = await insert_order(order_document)

    return OrderResponse(**order_document_to_response(created_order))


async def get_orders(
    search: str | None = None,
    status: str | None = None,
    start_date: str | None = None,
    end_date: str | None = None
) -> list[OrderResponse]:
    """
    Obtiene pedidos con filtros opcionales.
    """
    if status and status not in ORDER_STATUSES:
        raise UnprocessableEntityException(
            message="Estado de pedido inválido."
        )

    parsed_start_date = parse_datetime_filter(start_date)
    parsed_end_date = parse_datetime_filter(end_date)

    orders = await list_orders(
        search=search,
        status=status,
        start_date=parsed_start_date,
        end_date=parsed_end_date
    )

    return [
        OrderResponse(**order_document_to_response(order))
        for order in orders
    ]


async def get_order(order_id: str) -> OrderResponse:
    """
    Obtiene pedido por id.
    """
    order = await find_order_by_id(order_id)

    if order is None:
        raise NotFoundException(
            message="Pedido no encontrado."
        )

    return OrderResponse(**order_document_to_response(order))


def validate_order_status_transition(
    current_status: str,
    next_status: str
) -> None:
    """
    Valida cambios permitidos de estado.

    Flujo recomendado:
    PENDING -> PAID
    PAID -> DELIVERED
    PENDING -> CANCELLED
    PAID -> CANCELLED

    CANCELLED y DELIVERED son estados finales.
    """
    if current_status == next_status:
        return

    if current_status == ORDER_STATUS_CANCELLED:
        raise BadRequestException(
            message="No se puede modificar un pedido cancelado."
        )

    if current_status == ORDER_STATUS_DELIVERED:
        raise BadRequestException(
            message="No se puede modificar un pedido entregado."
        )

    allowed_transitions = {
        ORDER_STATUS_PENDING: [
            ORDER_STATUS_PAID,
            ORDER_STATUS_CANCELLED
        ],
        ORDER_STATUS_PAID: [
            ORDER_STATUS_DELIVERED,
            ORDER_STATUS_CANCELLED
        ]
    }

    allowed_next_statuses = allowed_transitions.get(current_status, [])

    if next_status not in allowed_next_statuses:
        raise BadRequestException(
            message="Cambio de estado no permitido."
        )


async def restore_order_stock(order: dict) -> None:
    """
    Restaura el stock de los productos de un pedido.

    Se ejecuta cuando un pedido se cancela.
    """
    for detail in order.get("details", []):
        product_id = detail.get("productId", "")
        quantity = int(detail.get("quantity", 0))

        if not product_id or quantity <= 0:
            continue

        await increment_product_stock(
            product_id=product_id,
            quantity=quantity
        )


async def update_order_status(
    order_id: str,
    payload: UpdateOrderStatusRequest
) -> OrderResponse:
    """
    Actualiza estado de un pedido.
    """
    if payload.status not in ORDER_STATUSES:
        raise UnprocessableEntityException(
            message="Estado de pedido inválido."
        )

    order = await find_order_by_id(order_id)

    if order is None:
        raise NotFoundException(
            message="Pedido no encontrado."
        )

    current_status = order.get("status", ORDER_STATUS_PENDING)

    validate_order_status_transition(
        current_status=current_status,
        next_status=payload.status
    )

    if (
        payload.status == ORDER_STATUS_PAID
        and order.get("paymentMethod") == PAYMENT_METHOD_NOT_DEFINED
    ):
        raise BadRequestException(
            message="No se puede marcar como pagado un pedido sin método de pago."
        )

    if payload.status == ORDER_STATUS_CANCELLED:
        await restore_order_stock(order)

    updated_order = await update_order_by_id(
        order_id,
        {
            "status": payload.status
        }
    )

    if updated_order is None:
        raise NotFoundException(
            message="Pedido no encontrado."
        )

    return OrderResponse(**order_document_to_response(updated_order))


async def cancel_order(order_id: str) -> OrderResponse:
    """
    Cancela un pedido.

    Al cancelar:
    - valida que el pedido pueda cancelarse
    - restaura stock de los productos
    - marca el pedido como CANCELLED
    """
    return await update_order_status(
        order_id=order_id,
        payload=UpdateOrderStatusRequest(
            status=ORDER_STATUS_CANCELLED
        )
    )