from fastapi import APIRouter
from app.models.cafeteria_model import Cafeteria
from app.controllers.cafeterias_controller import (
    obtener_cafeterias_controller,
    obtener_cafeteria_por_id_controller,
    filtrar_cafeterias_por_categoria_controller,
    buscar_cafeterias_por_texto_controller
)

"""
Las rutas definen los endpoints públicos de la API.

Aquí solo se especifica:
- qué URL se expone
- qué método HTTP se usa
- qué función del controlador responde

La lógica no debe vivir aquí, sino en el controlador y/o servicio.
"""

router = APIRouter(
    prefix="/cafeterias",
    tags=["Cafeterías"]
)


@router.get("/", response_model=list[Cafeteria])
def obtener_cafeterias():
    """
    Endpoint: GET /cafeterias/

    Devuelve el catálogo completo de cafeterías.
    """
    return obtener_cafeterias_controller()


@router.get("/{cafeteria_id}", response_model=Cafeteria)
def obtener_cafeteria_por_id(cafeteria_id: int):
    """
    Endpoint: GET /cafeterias/{cafeteria_id}

    Devuelve una cafetería específica según su identificador.
    """
    return obtener_cafeteria_por_id_controller(cafeteria_id)


@router.get("/categoria/{categoria}", response_model=list[Cafeteria])
def filtrar_por_categoria(categoria: str):
    """
    Endpoint: GET /cafeterias/categoria/{categoria}

    Permite obtener cafeterías de una categoría específica.
    Ejemplo:
    /cafeterias/categoria/artesanal
    """
    return filtrar_cafeterias_por_categoria_controller(categoria)


@router.get("/buscar/{texto}", response_model=list[Cafeteria])
def buscar_por_texto(texto: str):
    """
    Endpoint: GET /cafeterias/buscar/{texto}

    Busca cafeterías a partir de un texto.
    Ejemplo:
    /cafeterias/buscar/centro
    """
    return buscar_cafeterias_por_texto_controller(texto)