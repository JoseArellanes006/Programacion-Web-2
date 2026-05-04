"""
auth_model.py

Modelos relacionados con autenticación.

LoginRequest:
Datos que envía Angular al iniciar sesión.

LoginResponse:
Datos que devuelve el backend cuando el login es correcto.
"""

from pydantic import BaseModel
from models.usuario_model import Usuario


class LoginRequest(BaseModel):
    username: str
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    username: str


class LoginResponse(BaseModel):
    token: str
    usuario: UsuarioResponse