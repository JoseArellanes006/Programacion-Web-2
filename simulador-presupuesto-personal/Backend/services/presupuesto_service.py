"""
presupuesto_service.py

Contiene la lógica de negocio del backend.

Aquí se administran:
- movimientos;
- categorías sugeridas;
- simulaciones;
- resumen general del presupuesto.
"""

from datetime import datetime
from fastapi import HTTPException

from data.presupuesto_data import (
    movimientos_db,
    simulaciones_db,
    categorias_db
)

from models.movimiento_model import Movimiento, MovimientoCreate
from models.simulacion_model import Simulacion, SimulacionCreate


def obtener_movimientos() -> list[Movimiento]:
    """
    Devuelve todos los movimientos registrados.
    """
    return movimientos_db


def registrar_movimiento(movimiento_create: MovimientoCreate) -> Movimiento:
    """
    Registra un nuevo ingreso o gasto.

    El backend genera:
    - id;
    - fecha.
    """

    nuevo_movimiento = Movimiento(
        id=len(movimientos_db) + 1,
        tipo=movimiento_create.tipo,
        concepto=movimiento_create.concepto,
        categoria=movimiento_create.categoria,
        monto=movimiento_create.monto,
        fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )

    movimientos_db.append(nuevo_movimiento)

    return nuevo_movimiento


def eliminar_movimiento(movimiento_id: int) -> dict:
    """
    Elimina un movimiento por su id.

    Si el movimiento no existe, lanza error 404.
    """

    for movimiento in movimientos_db:
        if movimiento.id == movimiento_id:
            movimientos_db.remove(movimiento)
            return {
                "mensaje": "Movimiento eliminado correctamente"
            }

    raise HTTPException(
        status_code=404,
        detail="No se encontró un movimiento con el id proporcionado"
    )


def limpiar_movimientos() -> dict:
    """
    Elimina todos los movimientos registrados en memoria.
    """

    movimientos_db.clear()

    return {
        "mensaje": "Movimientos eliminados correctamente"
    }


def obtener_categorias() -> list[str]:
    """
    Devuelve las categorías sugeridas.
    """

    return categorias_db


def obtener_resumen() -> dict:
    """
    Calcula el resumen general del presupuesto.

    Devuelve:
    - total de ingresos;
    - total de gastos;
    - balance;
    - porcentaje de gasto.
    """

    total_ingresos = sum(
        movimiento.monto
        for movimiento in movimientos_db
        if movimiento.tipo == "ingreso"
    )

    total_gastos = sum(
        movimiento.monto
        for movimiento in movimientos_db
        if movimiento.tipo == "gasto"
    )

    balance = total_ingresos - total_gastos

    porcentaje_gasto = (
        (total_gastos / total_ingresos) * 100
        if total_ingresos > 0
        else 0
    )

    return {
        "total_ingresos": total_ingresos,
        "total_gastos": total_gastos,
        "balance": balance,
        "porcentaje_gasto": porcentaje_gasto
    }


def registrar_simulacion(simulacion_create: SimulacionCreate) -> Simulacion:
    """
    Registra una simulación financiera enviada por el frontend.

    El backend agrega:
    - id;
    - fecha.
    """

    nueva_simulacion = Simulacion(
        id=len(simulaciones_db) + 1,
        fecha=datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        meta_ahorro=simulacion_create.meta_ahorro,
        reduccion_gastos=simulacion_create.reduccion_gastos,
        meses=simulacion_create.meses,
        ahorro_proyectado=simulacion_create.ahorro_proyectado,
        meses_para_meta=simulacion_create.meses_para_meta
    )

    simulaciones_db.append(nueva_simulacion)

    return nueva_simulacion


def obtener_simulaciones() -> list[Simulacion]:
    """
    Devuelve todas las simulaciones registradas.
    """

    return simulaciones_db


def limpiar_simulaciones() -> dict:
    """
    Elimina todo el historial de simulaciones del backend.
    """

    simulaciones_db.clear()

    return {
        "mensaje": "Historial de simulaciones eliminado correctamente"
    }