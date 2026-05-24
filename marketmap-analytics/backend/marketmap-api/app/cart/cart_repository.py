"""
Repositorio del carrito.

Este archivo concentra operaciones directas con MongoDB.
"""

from typing import Any

from bson import ObjectId
from pymongo import ASCENDING

from app.cart.cart_model import (
    CART_STATUS_ACTIVE,
    get_current_utc_datetime
)
from app.core.database import get_collection


CARTS_COLLECTION = "carts"


def get_carts_collection():
    """
    Devuelve la colección de carritos.
    """
    return get_collection(CARTS_COLLECTION)


async def create_cart_indexes() -> None:
    """
    Crea índices necesarios para carritos.

    Se crea un índice único parcial para evitar que un mismo usuario tenga
    más de un carrito ACTIVE al mismo tiempo.
    """
    collection = get_carts_collection()

    await collection.create_index(
        [("userId", ASCENDING), ("status", ASCENDING)]
    )

    await collection.create_index(
        [("userId", ASCENDING), ("status", ASCENDING)],
        unique=True,
        partialFilterExpression={
            "status": CART_STATUS_ACTIVE
        },
        name="unique_active_cart_per_user"
    )

    await collection.create_index(
        [("updatedAt", ASCENDING)]
    )


async def find_active_cart_by_user_id(
    user_id: str
) -> dict[str, Any] | None:
    """
    Busca el carrito activo de un usuario.
    """
    collection = get_carts_collection()

    return await collection.find_one({
        "userId": user_id,
        "status": CART_STATUS_ACTIVE
    })


async def find_cart_by_id(cart_id: str) -> dict[str, Any] | None:
    """
    Busca carrito por id.
    """
    if not ObjectId.is_valid(cart_id):
        return None

    collection = get_carts_collection()

    return await collection.find_one({
        "_id": ObjectId(cart_id)
    })


async def insert_cart(cart_document: dict[str, Any]) -> dict[str, Any]:
    """
    Inserta carrito en MongoDB.
    """
    collection = get_carts_collection()

    result = await collection.insert_one(cart_document)

    created_cart = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_cart is None:
        raise RuntimeError("No fue posible recuperar el carrito creado.")

    return created_cart


async def update_cart_by_id(
    cart_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Actualiza carrito por id.
    """
    if not ObjectId.is_valid(cart_id):
        return None

    collection = get_carts_collection()

    data["updatedAt"] = get_current_utc_datetime()

    await collection.update_one(
        {
            "_id": ObjectId(cart_id)
        },
        {
            "$set": data
        }
    )

    return await find_cart_by_id(cart_id)


async def delete_cart_by_id(cart_id: str) -> bool:
    """
    Elimina carrito por id.
    """
    if not ObjectId.is_valid(cart_id):
        return False

    collection = get_carts_collection()

    result = await collection.delete_one({
        "_id": ObjectId(cart_id)
    })

    return result.deleted_count > 0