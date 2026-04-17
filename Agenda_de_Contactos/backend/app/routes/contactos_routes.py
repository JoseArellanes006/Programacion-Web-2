from fastapi import APIRouter
from app.controllers.contactos_controller import (
    obtener_contactos,
    obtener_contacto_por_id,
    crear_contacto,
    actualizar_contacto,
    eliminar_contacto,
    buscar_contactos
)
from app.models.contacto_model import Contacto, ContactoCreate

"""
Este archivo define las rutas del recurso 'contactos'.

Aquí se publica formalmente el servicio web.

Un APIRouter permite agrupar rutas relacionadas
y luego incluirlas dentro de la aplicación principal.
"""

router = APIRouter(
    prefix="/contactos",
    tags=["Contactos"]
)


@router.get("/", response_model=list[Contacto])
def listar_contactos():
    """
    GET /contactos/

    Devuelve la lista completa de contactos.
    """
    return obtener_contactos()


@router.get("/buscar", response_model=list[Contacto])
def buscar(texto: str):
    """
    GET /contactos/buscar?texto=juan

    Realiza una búsqueda de contactos por:
    - nombre
    - teléfono
    - correo

    El parámetro 'texto' se recibe como query parameter.
    """
    return buscar_contactos(texto)


@router.get("/{contacto_id}", response_model=Contacto)
def obtener_un_contacto(contacto_id: int):
    """
    GET /contactos/{contacto_id}

    Devuelve un contacto específico según su id.
    """
    return obtener_contacto_por_id(contacto_id)


@router.post("/", response_model=Contacto, status_code=201)
def registrar_contacto(datos: ContactoCreate):
    """
    POST /contactos/

    Recibe los datos de un nuevo contacto en el body
    y devuelve el contacto ya creado con su id.
    """
    return crear_contacto(datos)


@router.put("/{contacto_id}", response_model=Contacto)
def editar_contacto(contacto_id: int, datos: ContactoCreate):
    """
    PUT /contactos/{contacto_id}

    Actualiza un contacto existente.
    """
    return actualizar_contacto(contacto_id, datos)


@router.delete("/{contacto_id}")
def borrar_contacto(contacto_id: int):
    """
    DELETE /contactos/{contacto_id}

    Elimina un contacto según su id.
    """
    return eliminar_contacto(contacto_id)