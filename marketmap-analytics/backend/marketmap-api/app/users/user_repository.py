"""
Repositorio de usuarios.

Este archivo concentra el acceso directo a MongoDB.

Responsabilidades:
- buscar usuarios
- crear usuarios
- actualizar usuarios
- eliminar usuarios
- crear índices necesarios

El repositorio no debe contener lógica de negocio compleja.
Esa lógica queda en user_service.py y auth_service.py.
"""

from datetime import datetime
from typing import Any

from bson import ObjectId
from pymongo import ASCENDING

from app.core.database import get_collection
from app.users.user_model import get_current_utc_datetime


USERS_COLLECTION = "users"


def get_users_collection():
    """
    Devuelve la colección de usuarios.
    """
    return get_collection(USERS_COLLECTION)


async def create_user_indexes() -> None:
    """
    Crea índices necesarios para usuarios.

    El correo debe ser único.

    Importante:
    No se usa índice TTL sobre resetPasswordExpiresAt porque los índices TTL
    eliminan documentos completos. En este caso no queremos eliminar usuarios,
    solo invalidar tokens de recuperación desde la lógica de negocio.
    """
    collection = get_users_collection()

    await collection.create_index(
        [("email", ASCENDING)],
        unique=True
    )

    await collection.create_index(
        [("role", ASCENDING)]
    )

    await collection.create_index(
        [("status", ASCENDING)]
    )

    await collection.create_index(
        [("googleId", ASCENDING)],
        sparse=True
    )

    await collection.create_index(
        [("resetPasswordToken", ASCENDING)],
        sparse=True
    )


async def find_user_by_id(user_id: str) -> dict[str, Any] | None:
    """
    Busca un usuario por id.
    """
    if not ObjectId.is_valid(user_id):
        return None

    collection = get_users_collection()

    return await collection.find_one({
        "_id": ObjectId(user_id)
    })


async def find_user_by_email(email: str) -> dict[str, Any] | None:
    """
    Busca un usuario por correo electrónico.
    """
    collection = get_users_collection()

    return await collection.find_one({
        "email": email.lower().strip()
    })


async def find_user_by_google_id(google_id: str) -> dict[str, Any] | None:
    """
    Busca un usuario por googleId.
    """
    collection = get_users_collection()

    return await collection.find_one({
        "googleId": google_id
    })


async def list_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None
) -> list[dict[str, Any]]:
    """
    Lista usuarios aplicando filtros opcionales.
    """
    collection = get_users_collection()

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
                "email": {
                    "$regex": search,
                    "$options": "i"
                }
            }
        ]

    if role:
        query["role"] = role

    if status:
        query["status"] = status

    cursor = collection.find(query).sort("createdAt", -1)

    return await cursor.to_list(length=500)


async def insert_user(user_document: dict[str, Any]) -> dict[str, Any]:
    """
    Inserta un usuario en MongoDB.
    """
    collection = get_users_collection()

    result = await collection.insert_one(user_document)

    created_user = await collection.find_one({
        "_id": result.inserted_id
    })

    if created_user is None:
        raise RuntimeError("No fue posible recuperar el usuario creado.")

    return created_user


async def update_user_by_id(
    user_id: str,
    data: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Actualiza un usuario por id.
    """
    if not ObjectId.is_valid(user_id):
        return None

    collection = get_users_collection()

    data["updatedAt"] = get_current_utc_datetime()

    await collection.update_one(
        {
            "_id": ObjectId(user_id)
        },
        {
            "$set": data
        }
    )

    return await find_user_by_id(user_id)


async def update_user_last_login(user_id: str) -> dict[str, Any] | None:
    """
    Actualiza la fecha del último acceso.
    """
    return await update_user_by_id(
        user_id,
        {
            "lastLoginAt": get_current_utc_datetime()
        }
    )


async def set_reset_password_token(
    user_id: str,
    token: str,
    expires_at: datetime
) -> dict[str, Any] | None:
    """
    Guarda token de recuperación de contraseña.
    """
    return await update_user_by_id(
        user_id,
        {
            "resetPasswordToken": token,
            "resetPasswordExpiresAt": expires_at
        }
    )


async def find_user_by_reset_token(token: str) -> dict[str, Any] | None:
    """
    Busca usuario por token de recuperación.
    """
    collection = get_users_collection()

    return await collection.find_one({
        "resetPasswordToken": token
    })


async def clear_reset_password_token(user_id: str) -> dict[str, Any] | None:
    """
    Limpia token de recuperación después de cambiar contraseña.
    """
    return await update_user_by_id(
        user_id,
        {
            "resetPasswordToken": None,
            "resetPasswordExpiresAt": None
        }
    )


async def delete_user_by_id(user_id: str) -> bool:
    """
    Elimina un usuario por id.

    Para sistemas con auditoría fuerte, se recomienda baja lógica.
    """
    if not ObjectId.is_valid(user_id):
        return False

    collection = get_users_collection()

    result = await collection.delete_one({
        "_id": ObjectId(user_id)
    })

    return result.deleted_count > 0