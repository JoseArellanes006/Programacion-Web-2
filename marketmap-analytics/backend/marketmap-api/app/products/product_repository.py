"""
Repositorio de productos.

Este archivo concentra el acceso directo a MongoDB para productos.

Responsabilidades:
- crear índices
- listar productos
- buscar productos
- crear productos
- actualizar productos
- descontar stock
- restaurar stock
- eliminar productos
"""

from typing import Any

from bson import ObjectId
from pymongo import ASCENDING, TEXT

from app.core.database import get_collection
from app.products.product_model import (
    PRODUCT_STATUS_ACTIVE,
    PRODUCT_STATUS_OUT_OF_STOCK,
    get_current_utc_datetime
)


PRODUCTS_COLLECTION = "products"


def get_products_collection():
    """
    Devuelve la colección de productos.
    """
    return get_collection(PRODUCTS_COLLECTION)


async def create_product_indexes() -> None:
    """
    Crea índices necesarios para productos.
    """
    collection = get_products_collection()

    await collection.create_index(
        [("name", TEXT), ("description", TEXT), ("category", TEXT)]
    )

    await collection.create_index(
        [("nameNormalized", ASCENDING)],
        unique=True,
        sparse=True
    )

    await collection.create_index(
        [("category", ASCENDING)]
    )

    await collection.create_index(
        [("status", ASCENDING)]
    )

    await collection.create_index(
        [("featured", ASCENDING)]
    )


async def find_product_by_id(product_id: str) -> dict[str, Any] | None:
    """
    Busca un producto por id.
    """
    if not ObjectId.is_valid(product_id):
        return None

    collection = get_products_collection()

    return await collection.find_one({
        "_id": ObjectId(product_id)
    })


async def find_product_by_name(name: str) -> dict[str, Any] | None:
    """
    Busca producto por nombre exacto normalizado.
    """
    collection = get_products_collection()

    return await collection.find_one({
        "nameNormalized": name.lower().strip()
    })


async def list_products(
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    featured: bool | None = None
) -> list[dict[str, Any]]:
    """
    Lista productos con filtros opcionales.
    """
    collection = get_products_collection()

    query: dict[str, Any] = {}

    if search:
        query["$or"] = [
            {
                "name": {
                    "$regex": search,
                    "$options": "i"
                }
            },
            {
                "description": {
                    "$regex": search,
                    "$options": "i"
                }
            },
            {
                "category": {
                    "$regex": search,
                    "$options": "i"
                }
            }
        ]

    if category:
        query["category"] = category

    if status:
        query["status"] = status

    if featured is not None:
        query["featured"] = featured

    cursor = collection.find(query).sort("createdAt", -1)

    return await cursor.to_list(length=1000)


async def list_catalog_products() -> list[dict[str, Any]]:
    """
    Lista productos visibles en catálogo.

    Solo devuelve productos activos.
    """
    collection = get_products_collection()

    cursor = collection.find({
        "status": PRODUCT_STATUS_ACTIVE
    }).sort("createdAt", -1)

    return await cursor.to_list(length=1000)


async def insert_product(product_document: dict[str, Any]) -> dict[str, Any]:
    """
    Inserta un producto en MongoDB.
    """
    collection = get_products_collection()

    product_document["nameNormalized"] = product_document["name"].lower().strip()

    result = await collection.insert_one(product_document)

    created_product = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_product is None:
        raise RuntimeError("No fue posible recuperar el producto creado.")

    return created_product


async def update_product_by_id(
    product_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Actualiza un producto por id.
    """
    if not ObjectId.is_valid(product_id):
        return None

    collection = get_products_collection()

    data["updatedAt"] = get_current_utc_datetime()

    if "name" in data:
        data["nameNormalized"] = data["name"].lower().strip()

    await collection.update_one(
        {
            "_id": ObjectId(product_id)
        },
        {
            "$set": data
        }
    )

    return await find_product_by_id(product_id)


async def decrement_product_stock(
    product_id: str,
    quantity: int
) -> dict[str, Any] | None:
    """
    Descuenta stock de forma condicionada.

    Solo descuenta si:
    - el producto existe
    - el producto está ACTIVE
    - el stock actual es suficiente

    Esto reduce el riesgo de vender más unidades de las disponibles.
    """
    if not ObjectId.is_valid(product_id):
        return None

    if quantity <= 0:
        return None

    collection = get_products_collection()

    result = await collection.update_one(
        {
            "_id": ObjectId(product_id),
            "status": PRODUCT_STATUS_ACTIVE,
            "stock": {
                "$gte": quantity
            }
        },
        {
            "$inc": {
                "stock": -quantity
            },
            "$set": {
                "updatedAt": get_current_utc_datetime()
            }
        }
    )

    if result.modified_count == 0:
        return None

    updated_product = await find_product_by_id(product_id)

    if updated_product is None:
        return None

    if int(updated_product.get("stock", 0)) <= 0:
        updated_product = await update_product_by_id(
            product_id,
            {
                "status": PRODUCT_STATUS_OUT_OF_STOCK
            }
        )

    return updated_product


async def increment_product_stock(
    product_id: str,
    quantity: int
) -> dict[str, Any] | None:
    """
    Restaura stock de un producto.

    Se usa principalmente cuando un pedido se cancela.

    Regla:
    - si el producto estaba OUT_OF_STOCK y al restaurar queda con stock mayor a 0,
      se vuelve a marcar como ACTIVE.
    - si el producto estaba INACTIVE, no se fuerza a ACTIVE desde aquí.
    """
    if not ObjectId.is_valid(product_id):
        return None

    if quantity <= 0:
        return None

    collection = get_products_collection()

    result = await collection.update_one(
        {
            "_id": ObjectId(product_id)
        },
        {
            "$inc": {
                "stock": quantity
            },
            "$set": {
                "updatedAt": get_current_utc_datetime()
            }
        }
    )

    if result.modified_count == 0:
        return None

    updated_product = await find_product_by_id(product_id)

    if updated_product is None:
        return None

    current_status = updated_product.get("status")
    current_stock = int(updated_product.get("stock", 0))

    if current_status == PRODUCT_STATUS_OUT_OF_STOCK and current_stock > 0:
        updated_product = await update_product_by_id(
            product_id,
            {
                "status": PRODUCT_STATUS_ACTIVE
            }
        )

    return updated_product


async def delete_product_by_id(product_id: str) -> bool:
    """
    Elimina un producto por id.
    """
    if not ObjectId.is_valid(product_id):
        return False

    collection = get_products_collection()

    result = await collection.delete_one({
        "_id": ObjectId(product_id)
    })

    return result.deleted_count > 0