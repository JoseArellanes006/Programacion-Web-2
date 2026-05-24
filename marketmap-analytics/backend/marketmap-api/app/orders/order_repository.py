"""
Repositorio de pedidos.

Este archivo concentra operaciones directas con MongoDB.
"""

from datetime import datetime, time
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, DESCENDING

from app.core.database import get_collection
from app.orders.order_model import get_current_utc_datetime


ORDERS_COLLECTION = "orders"


def get_orders_collection():
    """
    Devuelve la colección de pedidos.
    """
    return get_collection(ORDERS_COLLECTION)


async def create_order_indexes() -> None:
    """
    Crea índices necesarios para pedidos.
    """
    collection = get_orders_collection()

    await collection.create_index(
        [("folio", ASCENDING)],
        unique=True
    )

    await collection.create_index(
        [("customerId", ASCENDING)]
    )

    await collection.create_index(
        [("customerName", ASCENDING)]
    )

    await collection.create_index(
        [("status", ASCENDING)]
    )

    await collection.create_index(
        [("createdAt", DESCENDING)]
    )


async def insert_order(
    order_document: dict[str, Any]
) -> dict[str, Any]:
    """
    Inserta pedido en MongoDB.
    """
    collection = get_orders_collection()

    result = await collection.insert_one(order_document)

    created_order = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_order is None:
        raise RuntimeError("No fue posible recuperar el pedido creado.")

    return created_order


async def find_order_by_id(
    order_id: str
) -> dict[str, Any] | None:
    """
    Busca pedido por id.
    """
    if not ObjectId.is_valid(order_id):
        return None

    collection = get_orders_collection()

    return await collection.find_one({
        "_id": ObjectId(order_id)
    })


async def list_orders(
    search: str | None = None,
    status: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> list[dict[str, Any]]:
    """
    Lista pedidos con filtros opcionales.

    Permite buscar por:
    - folio
    - nombre de cliente
    - id de pedido si el texto tiene formato ObjectId
    """
    collection = get_orders_collection()

    query: dict[str, Any] = {}

    if search:
        search = search.strip()

        search_conditions: list[dict[str, Any]] = [
            {
                "folio": {
                    "$regex": search,
                    "$options": "i"
                }
            },
            {
                "customerName": {
                    "$regex": search,
                    "$options": "i"
                }
            }
        ]

        if ObjectId.is_valid(search):
            search_conditions.append({
                "_id": ObjectId(search)
            })

        query["$or"] = search_conditions

    if status:
        query["status"] = status

    if start_date or end_date:
        query["createdAt"] = {}

        if start_date:
            query["createdAt"]["$gte"] = datetime.combine(
                start_date.date(),
                time.min,
                tzinfo=start_date.tzinfo
            )

        if end_date:
            query["createdAt"]["$lte"] = datetime.combine(
                end_date.date(),
                time.max,
                tzinfo=end_date.tzinfo
            )

    cursor = collection.find(query).sort("createdAt", -1)

    return await cursor.to_list(length=1000)


async def update_order_by_id(
    order_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Actualiza pedido por id.
    """
    if not ObjectId.is_valid(order_id):
        return None

    collection = get_orders_collection()

    data["updatedAt"] = get_current_utc_datetime()

    await collection.update_one(
        {
            "_id": ObjectId(order_id)
        },
        {
            "$set": data
        }
    )

    return await find_order_by_id(order_id)