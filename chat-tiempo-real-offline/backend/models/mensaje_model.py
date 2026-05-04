"""
mensaje_model.py

Modelo del mensaje del chat.

Debe coincidir con la estructura usada en Angular.
"""

from typing import Literal
from pydantic import BaseModel


class Mensaje(BaseModel):
    id: str
    usuarioId: int
    usuarioNombre: str
    texto: str
    fecha: str
    estado: Literal["enviado", "pendiente"]