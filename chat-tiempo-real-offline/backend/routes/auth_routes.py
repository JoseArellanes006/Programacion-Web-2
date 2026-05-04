"""
auth_routes.py

Rutas REST relacionadas con autenticación.
"""

from fastapi import APIRouter
from models.auth_model import LoginRequest, LoginResponse
from controllers.auth_controller import login_controller


router = APIRouter(
    prefix="/api",
    tags=["Autenticación"]
)


@router.post("/login", response_model=LoginResponse)
def login(credenciales: LoginRequest):
    """
    Endpoint usado por Angular para iniciar sesión.

    URL:
    POST http://127.0.0.1:8000/api/login

    Body:
    {
      "username": "alumno",
      "password": "1234"
    }
    """

    return login_controller(credenciales)