"""
usuarios_data.py

Base de datos simulada de usuarios.

Para fines didácticos se usan usuarios en memoria.
En un sistema real esto vendría de una base de datos.
"""

from models.usuario_model import Usuario


usuarios_db: list[Usuario] = [
    Usuario(
        id=1,
        nombre="Alumno Uno",
        username="alumno",
        password="1234"
    ),
    Usuario(
        id=2,
        nombre="Alumno Dos",
        username="alumno2",
        password="1234"
    ),
    Usuario(
        id=3,
        nombre="Docente",
        username="docente",
        password="admin"
    )
]