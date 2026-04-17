from fastapi import HTTPException
from app.data.contactos_data import contactos_db
from app.models.contacto_model import Contacto, ContactoCreate


def obtener_contactos() -> list[Contacto]:
    """
    Devuelve la lista completa de contactos.

    Esta función representa la lógica de negocio asociada
    a la consulta general de contactos.

    Retorna:
    - una lista de objetos Contacto
    """
    return contactos_db


def obtener_contacto_por_id(contacto_id: int) -> Contacto:
    """
    Busca y devuelve un contacto según su id.

    Parámetros:
    - contacto_id: identificador del contacto a buscar

    Retorna:
    - el contacto encontrado

    Si no existe:
    - lanza una excepción HTTP 404
    """
    for contacto in contactos_db:
        if contacto.id == contacto_id:
            return contacto

    raise HTTPException(
        status_code=404,
        detail="Contacto no encontrado"
    )


def crear_contacto(datos: ContactoCreate) -> Contacto:
    """
    Crea un nuevo contacto y lo agrega a la lista en memoria.

    Parámetros:
    - datos: objeto ContactoCreate recibido desde el cliente

    Proceso:
    1. generar un nuevo id
    2. construir un objeto Contacto completo
    3. guardarlo en la lista
    4. devolver el nuevo contacto

    Retorna:
    - el contacto creado
    """
    nuevo_id = 1 if not contactos_db else contactos_db[-1].id + 1

    nuevo_contacto = Contacto(
        id=nuevo_id,
        nombre=datos.nombre,
        telefono=datos.telefono,
        correo=datos.correo
    )

    contactos_db.append(nuevo_contacto)
    return nuevo_contacto


def actualizar_contacto(contacto_id: int, datos: ContactoCreate) -> Contacto:
    """
    Actualiza un contacto existente.

    Parámetros:
    - contacto_id: id del contacto que se desea actualizar
    - datos: nueva información del contacto

    Proceso:
    1. recorrer la lista
    2. encontrar el contacto por id
    3. reemplazarlo por una nueva versión actualizada

    Retorna:
    - el contacto actualizado

    Si no existe:
    - lanza HTTP 404
    """
    for indice, contacto in enumerate(contactos_db):
        if contacto.id == contacto_id:
            contacto_actualizado = Contacto(
                id=contacto_id,
                nombre=datos.nombre,
                telefono=datos.telefono,
                correo=datos.correo
            )

            contactos_db[indice] = contacto_actualizado
            return contacto_actualizado

    raise HTTPException(
        status_code=404,
        detail="Contacto no encontrado"
    )


def eliminar_contacto(contacto_id: int) -> dict:
    """
    Elimina un contacto de la lista según su id.

    Parámetros:
    - contacto_id: id del contacto a eliminar

    Retorna:
    - un diccionario con mensaje de confirmación
    - el contacto eliminado para fines informativos

    Si no existe:
    - lanza HTTP 404
    """
    for indice, contacto in enumerate(contactos_db):
        if contacto.id == contacto_id:
            eliminado = contactos_db.pop(indice)
            return {
                "mensaje": "Contacto eliminado correctamente",
                "contacto": eliminado
            }

    raise HTTPException(
        status_code=404,
        detail="Contacto no encontrado"
    )


def buscar_contactos(texto: str) -> list[Contacto]:
    """
    Filtra contactos por nombre, teléfono o correo.

    Parámetros:
    - texto: cadena a buscar

    Retorna:
    - una lista con los contactos que coincidan

    Este método sirve para mostrar cómo también podemos
    publicar servicios orientados a búsqueda, no solo CRUD.
    """
    texto_normalizado = texto.strip().lower()

    if not texto_normalizado:
        return contactos_db

    resultados = [
        contacto
        for contacto in contactos_db
        if texto_normalizado in contacto.nombre.lower()
        or texto_normalizado in contacto.telefono.lower()
        or texto_normalizado in contacto.correo.lower()
    ]

    return resultados