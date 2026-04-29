"""
presupuesto_data.py

Base de datos temporal en memoria.

Para fines didácticos no se usa una base de datos real.
Los datos se conservan solo mientras el servidor FastAPI esté encendido.
"""

from models.movimiento_model import Movimiento
from models.simulacion_model import Simulacion


"""
Movimientos de ejemplo.

Sirven para que el frontend pueda consultar información inicial
si se desea consumir datos desde la API.
"""
movimientos_db: list[Movimiento] = [
    Movimiento(
        id=1,
        tipo="ingreso",
        concepto="Salario mensual",
        categoria="Trabajo",
        monto=12000,
        fecha="2026-04-28 10:00"
    ),
    Movimiento(
        id=2,
        tipo="gasto",
        concepto="Renta",
        categoria="Vivienda",
        monto=3500,
        fecha="2026-04-28 10:05"
    ),
    Movimiento(
        id=3,
        tipo="gasto",
        concepto="Transporte",
        categoria="Movilidad",
        monto=900,
        fecha="2026-04-28 10:10"
    )
]


"""
Historial de simulaciones guardadas en backend.

El frontend también puede guardar historial en LocalStorage.
Este arreglo sirve para demostrar cómo se registraría en backend.
"""
simulaciones_db: list[Simulacion] = []


"""
Categorías sugeridas para movimientos financieros.

Sirven como catálogo de apoyo.
"""
categorias_db: list[str] = [
    "Trabajo",
    "Vivienda",
    "Alimentación",
    "Transporte",
    "Salud",
    "Educación",
    "Entretenimiento",
    "Ahorro",
    "Servicios",
    "Otros"
]