"""
Repositorio del mapa interactivo.

Este archivo concentra las operaciones directas con MongoDB para:
- layouts del mapa
- zonas del mapa
"""

from typing import Any

from bson import ObjectId
from pymongo import ASCENDING

from app.core.database import get_collection
from app.maps.map_model import (
    MAP_LAYOUT_DEFAULT_ID,
    create_default_map_layout_document,
    get_current_utc_datetime
)


MAP_LAYOUTS_COLLECTION = "map_layouts"
MAP_ZONES_COLLECTION = "map_zones"


def get_map_layouts_collection():
    """
    Devuelve la colección de layouts del mapa.
    """
    return get_collection(MAP_LAYOUTS_COLLECTION)


def get_map_zones_collection():
    """
    Devuelve la colección de zonas del mapa.
    """
    return get_collection(MAP_ZONES_COLLECTION)


async def create_map_indexes() -> None:
    """
    Crea índices necesarios para el mapa.
    """
    layouts_collection = get_map_layouts_collection()
    zones_collection = get_map_zones_collection()

    await layouts_collection.create_index(
        [("layoutId", ASCENDING)],
        unique=True
    )

    await layouts_collection.create_index(
        [("active", ASCENDING)]
    )

    await zones_collection.create_index(
        [("nameNormalized", ASCENDING)],
        unique=True
    )

    await zones_collection.create_index(
        [("layoutId", ASCENDING)]
    )

    await zones_collection.create_index(
        [("status", ASCENDING)]
    )

    await zones_collection.create_index(
        [("type", ASCENDING)]
    )

    await zones_collection.create_index(
        [("assignedUserId", ASCENDING)]
    )


async def find_map_layout_by_id(
    layout_id: str
) -> dict[str, Any] | None:
    """
    Busca layout por layoutId.
    """
    collection = get_map_layouts_collection()

    return await collection.find_one({
        "layoutId": layout_id
    })


async def get_or_create_default_map_layout() -> dict[str, Any]:
    """
    Obtiene el layout por defecto.

    Si no existe, lo crea.
    """
    existing_layout = await find_map_layout_by_id(MAP_LAYOUT_DEFAULT_ID)

    if existing_layout is not None:
        return existing_layout

    collection = get_map_layouts_collection()

    layout_document = create_default_map_layout_document()

    result = await collection.insert_one(layout_document)

    created_layout = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_layout is None:
        raise RuntimeError("No fue posible recuperar el layout creado.")

    return created_layout


async def update_map_layout_background(
    layout_id: str,
    background_image_url: str
) -> dict[str, Any] | None:
    """
    Actualiza la imagen base del layout.
    """
    collection = get_map_layouts_collection()

    await collection.update_one(
        {
            "layoutId": layout_id
        },
        {
            "$set": {
                "backgroundImageUrl": background_image_url,
                "updatedAt": get_current_utc_datetime()
            }
        }
    )

    return await find_map_layout_by_id(layout_id)


async def find_map_zone_by_id(
    zone_id: str
) -> dict[str, Any] | None:
    """
    Busca una zona por id.
    """
    if not ObjectId.is_valid(zone_id):
        return None

    collection = get_map_zones_collection()

    return await collection.find_one({
        "_id": ObjectId(zone_id)
    })


async def find_map_zone_by_name(
    name: str
) -> dict[str, Any] | None:
    """
    Busca una zona por nombre normalizado.
    """
    collection = get_map_zones_collection()

    return await collection.find_one({
        "nameNormalized": name.lower().strip()
    })


async def list_map_zones(
    search: str | None = None,
    status: str | None = None,
    zone_type: str | None = None,
    assigned_user_id: str | None = None,
    layout_id: str | None = None
) -> list[dict[str, Any]]:
    """
    Lista zonas del mapa con filtros opcionales.
    """
    collection = get_map_zones_collection()

    query: dict[str, Any] = {}

    if layout_id:
        query["layoutId"] = layout_id

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
                "assignedUserName": {
                    "$regex": search,
                    "$options": "i"
                }
            },
            {
                "currentOrderFolio": {
                    "$regex": search,
                    "$options": "i"
                }
            }
        ]

    if status:
        query["status"] = status

    if zone_type:
        query["type"] = zone_type

    if assigned_user_id:
        query["assignedUserId"] = assigned_user_id

    cursor = collection.find(query).sort("name", 1)

    return await cursor.to_list(length=1000)


async def list_default_layout_zones() -> list[dict[str, Any]]:
    """
    Lista zonas del layout por defecto.
    """
    return await list_map_zones(
        layout_id=MAP_LAYOUT_DEFAULT_ID
    )


async def insert_map_zone(
    zone_document: dict[str, Any]
) -> dict[str, Any]:
    """
    Inserta una zona en MongoDB.
    """
    collection = get_map_zones_collection()

    if not zone_document.get("layoutId"):
        zone_document["layoutId"] = MAP_LAYOUT_DEFAULT_ID

    result = await collection.insert_one(zone_document)

    created_zone = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_zone is None:
        raise RuntimeError("No fue posible recuperar la zona creada.")

    return created_zone


async def update_map_zone_by_id(
    zone_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Actualiza una zona por id.
    """
    if not ObjectId.is_valid(zone_id):
        return None

    collection = get_map_zones_collection()

    data["updatedAt"] = get_current_utc_datetime()

    if "name" in data:
        data["nameNormalized"] = data["name"].lower().strip()

    await collection.update_one(
        {
            "_id": ObjectId(zone_id)
        },
        {
            "$set": data
        }
    )

    return await find_map_zone_by_id(zone_id)


async def delete_map_zone_by_id(zone_id: str) -> bool:
    """
    Elimina una zona por id.
    """
    if not ObjectId.is_valid(zone_id):
        return False

    collection = get_map_zones_collection()

    result = await collection.delete_one({
        "_id": ObjectId(zone_id)
    })

    return result.deleted_count > 0