"""
auth_service.py

Contiene la lógica de autenticación.

Valida usuario y contraseña contra la lista simulada de usuarios.
"""

from fastapi import HTTPException
from data.usuarios_data import usuarios_db
from models.auth_model import LoginRequest, LoginResponse, UsuarioResponse


def login_usuario(credenciales: LoginRequest) -> LoginResponse:
    """
    Valida las credenciales enviadas por Angular.

    Si son correctas:
    - genera un token didáctico;
    - devuelve los datos del usuario.

    Si son incorrectas:
    - lanza error HTTP 401.
    """

    for usuario in usuarios_db:
        if (
            usuario.username == credenciales.username
            and usuario.password == credenciales.password
        ):
            token = f"token-{usuario.id}-{usuario.username}"

            return LoginResponse(
                token=token,
                usuario=UsuarioResponse(
                    id=usuario.id,
                    nombre=usuario.nombre,
                    username=usuario.username
                )
            )

    raise HTTPException(
        status_code=401,
        detail="Usuario o contraseña incorrectos"
    )


def obtener_usuario_por_token(token: str) -> UsuarioResponse:
    """
    Obtiene el usuario a partir de un token simple.

    Este método es didáctico.

    En producción se usaría JWT u otro mecanismo seguro.
    """

    for usuario in usuarios_db:
        token_esperado = f"token-{usuario.id}-{usuario.username}"

        if token == token_esperado:
            return UsuarioResponse(
                id=usuario.id,
                nombre=usuario.nombre,
                username=usuario.username
            )

    raise HTTPException(
        status_code=401,
        detail="Token inválido"
    )