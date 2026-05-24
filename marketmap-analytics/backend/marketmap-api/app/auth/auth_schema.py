"""
Schemas de autenticación.

Aquí se definen las entradas y respuestas del módulo auth.

Endpoints relacionados:
- registro
- login
- login con Google
- recuperación de contraseña
- cambio de contraseña
- sesión actual
"""

from pydantic import BaseModel, EmailStr, Field

from app.users.user_schema import UserResponse, UserRole


class RegisterRequest(BaseModel):
    """
    Solicitud de registro público.
    """

    name: str = Field(min_length=3, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole | None = None


class LoginRequest(BaseModel):
    """
    Solicitud de inicio de sesión.
    """

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class GoogleLoginRequest(BaseModel):
    """
    Solicitud de login con Google.

    idToken:
    Es el credential emitido por Google Identity Services en Angular.
    """

    idToken: str = Field(min_length=10)


class ForgotPasswordRequest(BaseModel):
    """
    Solicitud para recuperación de contraseña.
    """

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """
    Solicitud para restablecer contraseña.
    """

    token: str = Field(min_length=10)
    newPassword: str = Field(min_length=8, max_length=128)


class AuthSessionResponse(BaseModel):
    """
    Respuesta de autenticación compatible con Angular.

    El frontend espera:
    - accessToken
    - refreshToken
    - user
    """

    accessToken: str
    refreshToken: str
    user: UserResponse


class ForgotPasswordResponse(BaseModel):
    """
    Respuesta para recuperación de contraseña.

    En producción:
    - no se devuelve resetToken
    - no se devuelve resetUrl
    - el enlace se envía por correo

    En desarrollo:
    - se devuelve resetToken y resetUrl para facilitar pruebas locales
    """

    message: str
    resetToken: str | None = None
    resetUrl: str | None = None


class ResetPasswordResponse(BaseModel):
    """
    Respuesta para restablecimiento de contraseña.
    """

    message: str