"""
presupuesto_routes.py

Define los endpoints disponibles para el frontend.

Prefijo general:
http://127.0.0.1:8000/api
"""

from fastapi import APIRouter

from models.movimiento_model import Movimiento, MovimientoCreate
from models.simulacion_model import Simulacion, SimulacionCreate

from controllers.presupuesto_controller import (
    listar_movimientos_controller,
    registrar_movimiento_controller,
    eliminar_movimiento_controller,
    limpiar_movimientos_controller,
    listar_categorias_controller,
    obtener_resumen_controller,
    registrar_simulacion_controller,
    listar_simulaciones_controller,
    limpiar_simulaciones_controller
)


router = APIRouter(
    prefix="/api",
    tags=["Presupuesto personal"]
)


@router.get("/movimientos", response_model=list[Movimiento])
def listar_movimientos():
    """
    Devuelve todos los movimientos financieros.

    GET:
    http://127.0.0.1:8000/api/movimientos
    """
    return listar_movimientos_controller()


@router.post("/movimientos", response_model=Movimiento)
def crear_movimiento(movimiento: MovimientoCreate):
    """
    Registra un nuevo movimiento financiero.

    POST:
    http://127.0.0.1:8000/api/movimientos
    """
    return registrar_movimiento_controller(movimiento)


@router.delete("/movimientos/{movimiento_id}")
def borrar_movimiento(movimiento_id: int):
    """
    Elimina un movimiento por id.

    DELETE:
    http://127.0.0.1:8000/api/movimientos/1
    """
    return eliminar_movimiento_controller(movimiento_id)


@router.delete("/movimientos")
def borrar_todos_los_movimientos():
    """
    Elimina todos los movimientos registrados en el backend.

    DELETE:
    http://127.0.0.1:8000/api/movimientos
    """
    return limpiar_movimientos_controller()


@router.get("/categorias", response_model=list[str])
def listar_categorias():
    """
    Devuelve categorías sugeridas para clasificar movimientos.

    GET:
    http://127.0.0.1:8000/api/categorias
    """
    return listar_categorias_controller()


@router.get("/resumen")
def obtener_resumen():
    """
    Devuelve el resumen financiero calculado en backend.

    GET:
    http://127.0.0.1:8000/api/resumen
    """
    return obtener_resumen_controller()


@router.post("/simulaciones", response_model=Simulacion)
def crear_simulacion(simulacion: SimulacionCreate):
    """
    Registra una simulación financiera.

    POST:
    http://127.0.0.1:8000/api/simulaciones
    """
    return registrar_simulacion_controller(simulacion)


@router.get("/simulaciones", response_model=list[Simulacion])
def listar_simulaciones():
    """
    Devuelve el historial de simulaciones registrado en backend.

    GET:
    http://127.0.0.1:8000/api/simulaciones
    """
    return listar_simulaciones_controller()


@router.delete("/simulaciones")
def borrar_simulaciones():
    """
    Elimina el historial de simulaciones del backend.

    DELETE:
    http://127.0.0.1:8000/api/simulaciones
    """
    return limpiar_simulaciones_controller()