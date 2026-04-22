from fastapi import HTTPException
from app.models.cafeteria_model import Cafeteria
from app.services.cafeterias_service import CafeteriasService

"""
El controlador recibe la petición desde la ruta y decide qué hacer con ella.

Aquí se llama al servicio y también se manejan errores lógicos, por ejemplo:
- cafetería no encontrada
- búsqueda sin resultados, si se desea tratar como error o como lista vacía

En este caso:
- si no se encuentra una cafetería por id, se devuelve 404
- si un filtro o búsqueda no encuentra resultados, se devuelve lista vacía
"""


def obtener_cafeterias_controller() -> list[Cafeteria]:
    """
    Devuelve todas las cafeterías registradas.
    """
    return CafeteriasService.obtener_todas()


def obtener_cafeteria_por_id_controller(cafeteria_id: int) -> Cafeteria:
    """
    Busca una cafetería por ID.
    Si no existe, lanza una excepción HTTP 404.
    """
    cafeteria = CafeteriasService.obtener_por_id(cafeteria_id)

    if cafeteria is None:
        raise HTTPException(
            status_code=404,
            detail=f"No se encontró una cafetería con el id {cafeteria_id}"
        )

    return cafeteria


def filtrar_cafeterias_por_categoria_controller(categoria: str) -> list[Cafeteria]:
    """
    Filtra las cafeterías por categoría.
    Si no hay resultados, simplemente devuelve una lista vacía.
    """
    return CafeteriasService.filtrar_por_categoria(categoria)


def buscar_cafeterias_por_texto_controller(texto: str) -> list[Cafeteria]:
    """
    Busca cafeterías por texto.
    Si no hay coincidencias, devuelve lista vacía.
    """
    return CafeteriasService.buscar_por_texto(texto)