"""
usuario_model.py

Modelo de usuario del sistema.

Representa a un usuario registrado que puede iniciar sesión
y participar en el chat.
"""

from pydantic import BaseModel


class Usuario(BaseModel):
    id: int
    nombre: str
    username: str
    password: str