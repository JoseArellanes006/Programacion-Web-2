"""
Configuración de base de datos MongoDB.

Este archivo administra la conexión global con MongoDB usando Motor,
que es el driver asíncrono para trabajar con FastAPI.

Responsabilidades:
- abrir conexión a MongoDB
- cerrar conexión
- obtener la base de datos activa
- obtener colecciones específicas

La conexión puede apuntar a:
- MongoDB local
- MongoDB Atlas

La URI real se lee desde el archivo .env.
"""

from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings


mongo_client: Optional[AsyncIOMotorClient] = None
database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_database() -> None:
    """
    Abre conexión con MongoDB.

    Esta función se ejecuta al iniciar FastAPI.

    Usa la configuración definida en:
    - settings.MONGODB_URI
    - settings.MONGODB_DATABASE

    Si estás usando MongoDB Atlas, la URI debe venir desde .env
    con formato mongodb+srv://...
    """
    global mongo_client
    global database

    mongo_client = AsyncIOMotorClient(
        settings.MONGODB_URI,
        serverSelectionTimeoutMS=10000
    )

    database = mongo_client[settings.MONGODB_DATABASE]

    await database.command("ping")

    print("Conexión a MongoDB establecida correctamente.")
    print(f"Base de datos activa: {settings.MONGODB_DATABASE}")


async def close_database_connection() -> None:
    """
    Cierra la conexión con MongoDB.

    Esta función se ejecuta al apagar FastAPI.
    """
    global mongo_client

    if mongo_client is not None:
        mongo_client.close()
        print("Conexión a MongoDB cerrada correctamente.")


def get_database() -> AsyncIOMotorDatabase:
    """
    Devuelve la base de datos activa.

    Si la conexión no existe, lanza un error.
    """
    if database is None:
        raise RuntimeError("La base de datos no está inicializada.")

    return database


def get_collection(collection_name: str):
    """
    Devuelve una colección específica de MongoDB.

    Ejemplo:
    users_collection = get_collection("users")
    """
    db = get_database()

    return db[collection_name]