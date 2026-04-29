"""
presupuesto_controller.py

Controlador del presupuesto.

Esta capa conecta las rutas con los servicios.

Su objetivo es mantener los endpoints limpios y evitar que las rutas
contengan directamente la lógica de negocio.
"""

from models.movimiento_model import Movimiento, MovimientoCreate
from models.simulacion_model import Simulacion, SimulacionCreate

from services.presupuesto_service import (
    obtener_movimientos,
    registrar_movimiento,
    eliminar_movimiento,
    limpiar_movimientos,
    obtener_categorias,
    obtener_resumen,
    registrar_simulacion,
    obtener_simulaciones,
    limpiar_simulaciones
)


def listar_movimientos_controller() -> list[Movimiento]:
    """
    Controlador para listar movimientos.
    """
    return obtener_movimientos()


def registrar_movimiento_controller(
    movimiento: MovimientoCreate
) -> Movimiento:
    """
    Controlador para registrar un movimiento.
    """
    return registrar_movimiento(movimiento)


def eliminar_movimiento_controller(movimiento_id: int) -> dict:
    """
    Controlador para eliminar un movimiento.
    """
    return eliminar_movimiento(movimiento_id)


def limpiar_movimientos_controller() -> dict:
    """
    Controlador para limpiar todos los movimientos.
    """
    return limpiar_movimientos()


def listar_categorias_controller() -> list[str]:
    """
    Controlador para listar categorías sugeridas.
    """
    return obtener_categorias()


def obtener_resumen_controller() -> dict:
    """
    Controlador para obtener el resumen financiero.
    """
    return obtener_resumen()


def registrar_simulacion_controller(
    simulacion: SimulacionCreate
) -> Simulacion:
    """
    Controlador para registrar una simulación financiera.
    """
    return registrar_simulacion(simulacion)


def listar_simulaciones_controller() -> list[Simulacion]:
    """
    Controlador para listar simulaciones.
    """
    return obtener_simulaciones()


def limpiar_simulaciones_controller() -> dict:
    """
    Controlador para limpiar el historial de simulaciones.
    """
    return limpiar_simulaciones()