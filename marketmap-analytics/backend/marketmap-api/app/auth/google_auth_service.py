"""
Servicio de autenticación con Google.

Este archivo valida el idToken emitido por Google Identity Services.

Validaciones realizadas:
- el token existe
- el token pertenece al GOOGLE_CLIENT_ID configurado en .env
- el correo está verificado
- el token contiene correo electrónico

Este servicio NO crea la sesión por sí solo.
Solo valida Google y devuelve los datos del usuario.
La creación/búsqueda del usuario y emisión de JWT se realiza desde auth_service.py.
"""

from typing import Any

from google.auth.transport import requests
from google.oauth2 import id_token

from app.core.config import settings
from app.core.exceptions import UnauthorizedException


async def verify_google_id_token(google_id_token: str) -> dict[str, Any]:
    """
    Verifica un idToken real emitido por Google Identity Services.

    Retorna datos como:
    - sub
    - email
    - name
    - picture
    - email_verified
    """

    if not settings.GOOGLE_CLIENT_ID:
        raise UnauthorizedException(
            message="Google OAuth no está configurado en el backend."
        )

    try:
        google_payload = id_token.verify_oauth2_token(
            google_id_token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

    except ValueError:
        raise UnauthorizedException(
            message="Token de Google inválido."
        )

    email = google_payload.get("email")
    email_verified = google_payload.get("email_verified")

    if not email:
        raise UnauthorizedException(
            message="El token de Google no contiene correo electrónico."
        )

    if email_verified is not True:
        raise UnauthorizedException(
            message="El correo de Google no está verificado."
        )

    return google_payload