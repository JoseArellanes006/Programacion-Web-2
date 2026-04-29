"""
simulacion_model.py

Define los modelos relacionados con las simulaciones financieras.

Una simulación permite calcular escenarios como:
- ahorro proyectado;
- reducción de gastos;
- meses necesarios para alcanzar una meta.
"""

from pydantic import BaseModel, Field


class SimulacionCreate(BaseModel):
    """
    Modelo usado cuando el frontend envía una simulación realizada.

    Representa los datos principales que se desean conservar
    en el backend.
    """

    meta_ahorro: float = Field(ge=0)
    reduccion_gastos: float = Field(ge=0, le=100)
    meses: int = Field(gt=0)
    ahorro_proyectado: float
    meses_para_meta: int | None


class Simulacion(BaseModel):
    """
    Modelo completo de una simulación ya registrada.

    Incluye id y fecha generados por el backend.
    """

    id: int
    fecha: str
    meta_ahorro: float
    reduccion_gastos: float
    meses: int
    ahorro_proyectado: float
    meses_para_meta: int | None