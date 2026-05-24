"""
Repositorio de categorías.

Este archivo concentra operaciones directas con MongoDB.
"""

from typing import Any

from bson import ObjectId
from pymongo import ASCENDING

from app.categories.category_model import get_current_utc_datetime
from app.core.database import get_collection


CATEGORIES_COLLECTION = "categories"


def get_categories_collection():
    """
    Devuelve la colección de categorías.
    """
    return get_collection(CATEGORIES_COLLECTION)


async def create_category_indexes() -> None:
    """
    Crea índices necesarios para categorías.
    """
    collection = get_categories_collection()

    await collection.create_index(
        [("nameNormalized", ASCENDING)],
        unique=True
    )

    await collection.create_index(
        [("status", ASCENDING)]
    )


async def find_category_by_id(category_id: str) -> dict[str, Any] | None:
    """
    Busca categoría por id.
    """
    if not ObjectId.is_valid(category_id):
        return None

    collection = get_categories_collection()

    return await collection.find_one({
        "_id": ObjectId(category_id)
    })


async def find_category_by_name(name: str) -> dict[str, Any] | None:
    """
    Busca categoría por nombre normalizado.
    """
    collection = get_categories_collection()

    return await collection.find_one({
        "nameNormalized": name.lower().strip()
    })


async def list_categories(
    search: str | None = None,
    status: str | None = None
) -> list[dict[str, Any]]:
    """
    Lista categorías con filtros opcionales.
    """
    collection = get_categories_collection()

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
            }
        ]

    if status:
        query["status"] = status

    cursor = collection.find(query).sort("name", 1)

    return await cursor.to_list(length=500)


async def list_active_categories() -> list[dict[str, Any]]:
    """
    Lista categorías activas.
    """
    collection = get_categories_collection()

    cursor = collection.find({
        "status": "ACTIVE"
    }).sort("name", 1)

    return await cursor.to_list(length=500)


async def insert_category(
    category_document: dict[str, Any]
) -> dict[str, Any]:
    """
    Inserta categoría.
    """
    collection = get_categories_collection()

    result = await collection.insert_one(category_document)

    created_category = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_category is None:
        raise RuntimeError("No fue posible recuperar la categoría creada.")

    return created_category


async def update_category_by_id(
    category_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Actualiza categoría.
    """
    if not ObjectId.is_valid(category_id):
        return None

    collection = get_categories_collection()

    data["updatedAt"] = get_current_utc_datetime()

    if "name" in data:
        data["nameNormalized"] = data["name"].lower().strip()

    await collection.update_one(
        {
            "_id": ObjectId(category_id)
        },
        {
            "$set": data
        }
    )

    return await find_category_by_id(category_id)


async def delete_category_by_id(category_id: str) -> bool:
    """
    Elimina categoría.
    """
    if not ObjectId.is_valid(category_id):
        return False

    collection = get_categories_collection()

    result = await collection.delete_one({
        "_id": ObjectId(category_id)
    })

    return result.deleted_count > 0