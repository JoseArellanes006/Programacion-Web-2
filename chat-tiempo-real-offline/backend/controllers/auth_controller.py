"""
auth_controller.py

Controlador de autenticación.

Recibe la petición desde la ruta y delega la lógica al servicio.
"""

from models.auth_model import LoginRequest, LoginResponse
from services.auth_service import login_usuario


def login_controller(credenciales: LoginRequest) -> LoginResponse:
    """
    Controlador para iniciar sesión.
    """
    return login_usuario(credenciales)