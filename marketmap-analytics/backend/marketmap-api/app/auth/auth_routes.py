"""
Rutas de autenticación.

Este archivo expone los endpoints públicos y privados relacionados
con autenticación.

Endpoints:
- POST /auth/register
- POST /auth/login
- POST /auth/google
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me
"""

from fastapi import APIRouter, Depends, status

from app.auth.auth_schema import (
    AuthSessionResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GoogleLoginRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    ResetPasswordResponse
)
from app.auth.auth_service import (
    forgot_password,
    get_current_user,
    login_user,
    login_with_google,
    register_user,
    reset_password
)
from app.core.security import get_current_user_id
from app.users.user_schema import UserResponse


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post(
    "/register",
    response_model=AuthSessionResponse,
    status_code=status.HTTP_201_CREATED
)
async def register_endpoint(payload: RegisterRequest):
    """
    Registra un nuevo usuario.
    """
    return await register_user(payload)


@router.post(
    "/login",
    response_model=AuthSessionResponse
)
async def login_endpoint(payload: LoginRequest):
    """
    Inicia sesión con correo y contraseña.
    """
    return await login_user(payload)


@router.post(
    "/google",
    response_model=AuthSessionResponse
)
async def google_login_endpoint(payload: GoogleLoginRequest):
    """
    Inicia sesión con Google.

    Recibe el idToken generado por Google Identity Services desde Angular.
    """
    return await login_with_google(payload)


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse
)
async def forgot_password_endpoint(payload: ForgotPasswordRequest):
    """
    Solicita recuperación de contraseña.
    """
    return await forgot_password(payload)


@router.post(
    "/reset-password",
    response_model=ResetPasswordResponse
)
async def reset_password_endpoint(payload: ResetPasswordRequest):
    """
    Restablece contraseña usando token.
    """
    return await reset_password(payload)


@router.get(
    "/me",
    response_model=UserResponse
)
async def me_endpoint(
    user_id: str = Depends(get_current_user_id)
):
    """
    Devuelve el usuario autenticado actual.
    """
    return await get_current_user(user_id)