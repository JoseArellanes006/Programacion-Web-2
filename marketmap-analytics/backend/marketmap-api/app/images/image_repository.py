"""
Repositorio de imágenes.

En este bloque el repositorio registra metadatos de imágenes en MongoDB.

El archivo físico se guarda en:
app/static/uploads/products

MongoDB guarda:
- nombre generado
- nombre original
- tipo de contenido
- tamaño
- URL pública
- fecha de creación
"""

from typing import Any

from pymongo import ASCENDING

from app.core.database import get_collection
from app.products.product_model import get_current_utc_datetime


IMAGES_COLLECTION = "images"


def get_images_collection():
    """
    Devuelve la colección de imágenes.
    """
    return get_collection(IMAGES_COLLECTION)


async def create_image_indexes() -> None:
    """
    Crea índices necesarios para imágenes.
    """
    collection = get_images_collection()

    await collection.create_index(
        [("fileName", ASCENDING)],
        unique=True
    )

    await collection.create_index(
        [("imageUrl", ASCENDING)]
    )

    await collection.create_index(
        [("createdAt", ASCENDING)]
    )


async def insert_image_metadata(
    file_name: str,
    original_name: str,
    content_type: str,
    size: int,
    image_url: str
) -> dict[str, Any]:
    """
    Guarda metadatos de imagen en MongoDB.
    """
    collection = get_images_collection()

    document = {
        "fileName": file_name,
        "originalName": original_name,
        "contentType": content_type,
        "size": size,
        "imageUrl": image_url,
        "createdAt": get_current_utc_datetime()
    }

    result = await collection.insert_one(document)

    document["_id"] = result.inserted_id

    return document