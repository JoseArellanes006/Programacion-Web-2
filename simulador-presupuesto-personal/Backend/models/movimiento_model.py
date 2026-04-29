"""
movimiento_model.py

Define los modelos relacionados con los movimientos financieros.

Un movimiento representa un ingreso o un gasto dentro del presupuesto.
"""

from pydantic import BaseModel, Field
from typing import Literal


class MovimientoCreate(BaseModel):
    """
    Modelo usado cuando el frontend envía un nuevo movimiento.

    No incluye id porque el backend lo genera.
    No incluye fecha porque el backend la asigna al registrar el movimiento.
    """

    tipo: Literal["ingreso", "gasto"]
    concepto: str = Field(min_length=1)
    categoria: str = Field(min_length=1)
    monto: float = Field(gt=0)


class Movimiento(BaseModel):
    """
    Modelo completo de un movimiento ya registrado.

    Incluye id y fecha generados por el backend.
    """

    id: int
    tipo: Literal["ingreso", "gasto"]
    concepto: str
    categoria: str
    monto: float
    fecha: str