"""
Servicio de autenticación.

Este archivo contiene la lógica de negocio para:
- registro
- login
- login con Google
- obtención de usuario actual
- recuperación de contraseña
- restablecimiento de contraseña

La persistencia se realiza mediante user_repository.py.
"""

from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from urllib.parse import quote

from pymongo.errors import DuplicateKeyError

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
from app.auth.auth_utils import (
    create_auth_session_response,
    normalize_email,
    validate_password_strength
)
from app.auth.google_auth_service import verify_google_id_token
from app.core.config import settings
from app.core.email_service import send_password_reset_email
from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnauthorizedException
)
from app.core.security import hash_password, verify_password
from app.users.user_model import (
    ROLE_CUSTOMER,
    STATUS_ACTIVE,
    STATUS_BLOCKED,
    STATUS_INACTIVE,
    create_user_document,
    get_current_utc_datetime,
    user_document_to_response
)
from app.users.user_repository import (
    find_user_by_email,
    find_user_by_id,
    find_user_by_google_id,
    find_user_by_reset_token,
    insert_user,
    set_reset_password_token,
    update_user_by_id,
    update_user_last_login
)
from app.users.user_schema import UserResponse


def validate_user_account_status(user: dict) -> None:
    """
    Valida si una cuenta puede autenticarse o seguir usando el sistema.

    Estados permitidos:
    - ACTIVE

    Estados bloqueados:
    - BLOCKED
    - INACTIVE
    """
    status = user.get("status", STATUS_ACTIVE)

    if status == STATUS_BLOCKED:
        raise UnauthorizedException(
            message="La cuenta se encuentra bloqueada."
        )

    if status == STATUS_INACTIVE:
        raise UnauthorizedException(
            message="La cuenta se encuentra inactiva."
        )

    if status != STATUS_ACTIVE:
        raise UnauthorizedException(
            message="La cuenta no se encuentra activa."
        )


async def register_user(payload: RegisterRequest) -> AuthSessionResponse:
    """
    Registra un usuario nuevo.

    Regla de seguridad:
    El registro público siempre crea usuarios CUSTOMER.

    Los roles ADMIN, MANAGER y SELLER deben asignarse desde el módulo
    administrativo de usuarios, usando endpoints protegidos.
    """
    normalized_email = normalize_email(str(payload.email))

    validate_password_strength(payload.password)

    existing_user = await find_user_by_email(normalized_email)

    if existing_user is not None:
        raise ConflictException(
            message="El correo electrónico ya está registrado."
        )

    password_hash = hash_password(payload.password)

    user_document = create_user_document(
        name=payload.name.strip(),
        email=normalized_email,
        password_hash=password_hash,
        role=ROLE_CUSTOMER,
        status=STATUS_ACTIVE
    )

    try:
        created_user = await insert_user(user_document)
    except DuplicateKeyError:
        raise ConflictException(
            message="El correo electrónico ya está registrado."
        )

    session = create_auth_session_response(created_user)

    return AuthSessionResponse(**session)


async def login_user(payload: LoginRequest) -> AuthSessionResponse:
    """
    Inicia sesión con correo y contraseña.
    """
    normalized_email = normalize_email(str(payload.email))

    user = await find_user_by_email(normalized_email)

    if user is None:
        raise UnauthorizedException(
            message="Correo o contraseña incorrectos."
        )

    validate_user_account_status(user)

    password_hash = user.get("passwordHash")

    if not password_hash:
        raise UnauthorizedException(
            message="Esta cuenta no tiene contraseña local configurada."
        )

    is_valid_password = verify_password(
        payload.password,
        password_hash
    )

    if not is_valid_password:
        raise UnauthorizedException(
            message="Correo o contraseña incorrectos."
        )

    updated_user = await update_user_last_login(str(user["_id"]))

    if updated_user is None:
        updated_user = user

    session = create_auth_session_response(updated_user)

    return AuthSessionResponse(**session)


async def login_with_google(
    payload: GoogleLoginRequest
) -> AuthSessionResponse:
    """
    Inicia sesión usando Google.

    Si el usuario no existe, se crea automáticamente como CUSTOMER.
    """
    google_data = await verify_google_id_token(payload.idToken)

    google_id = google_data.get("sub")
    email = normalize_email(str(google_data.get("email")))
    name = google_data.get("name") or email
    picture = google_data.get("picture")

    if not google_id:
        raise UnauthorizedException(
            message="El token de Google no contiene identificador válido."
        )

    user = await find_user_by_google_id(google_id)

    if user is None:
        user = await find_user_by_email(email)

    if user is None:
        user_document = create_user_document(
            name=name,
            email=email,
            password_hash="",
            role=ROLE_CUSTOMER,
            status=STATUS_ACTIVE,
            avatar_url=picture,
            provider="google",
            google_id=google_id
        )

        try:
            user = await insert_user(user_document)
        except DuplicateKeyError:
            user = await find_user_by_email(email)

            if user is None:
                raise ConflictException(
                    message="No fue posible crear el usuario con Google."
                )
    else:
        validate_user_account_status(user)

        avatar_url = user.get("avatarUrl") or user.get("avatar") or picture

        update_data = {
            "googleId": google_id,
            "provider": "google",
            "avatarUrl": avatar_url,
            "avatar": avatar_url
        }

        updated_user = await update_user_by_id(
            str(user["_id"]),
            update_data
        )

        if updated_user is not None:
            user = updated_user

    validate_user_account_status(user)

    updated_user = await update_user_last_login(str(user["_id"]))

    if updated_user is None:
        updated_user = user

    session = create_auth_session_response(updated_user)

    return AuthSessionResponse(**session)


async def get_current_user(user_id: str) -> UserResponse:
    """
    Obtiene el usuario autenticado actual.

    Aunque el token ya haya sido validado por security.py, esta función
    también valida el estado para evitar devolver sesión actual de usuarios
    inactivos o bloqueados.
    """
    user = await find_user_by_id(user_id)

    if user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    validate_user_account_status(user)

    return UserResponse(**user_document_to_response(user))


def build_reset_password_url(reset_token: str) -> str:
    """
    Construye el enlace que abrirá Angular para restablecer contraseña.
    """
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    encoded_token = quote(reset_token)

    return f"{frontend_url}/auth/reset-password?token={encoded_token}"


async def forgot_password(
    payload: ForgotPasswordRequest
) -> ForgotPasswordResponse:
    """
    Genera un token de recuperación de contraseña y envía el enlace por correo.

    Para evitar enumeración de usuarios, siempre devuelve un mensaje genérico.
    """
    normalized_email = normalize_email(str(payload.email))

    user = await find_user_by_email(normalized_email)

    generic_message = "Si el correo existe, se enviaron instrucciones de recuperación."

    if user is None:
        return ForgotPasswordResponse(
            message=generic_message,
            resetToken=None,
            resetUrl=None
        )

    if user.get("status") == STATUS_BLOCKED:
        return ForgotPasswordResponse(
            message=generic_message,
            resetToken=None,
            resetUrl=None
        )

    if user.get("status") == STATUS_INACTIVE:
        return ForgotPasswordResponse(
            message=generic_message,
            resetToken=None,
            resetUrl=None
        )

    reset_token = token_urlsafe(32)
    reset_url = build_reset_password_url(reset_token)

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.RESET_PASSWORD_EXPIRE_MINUTES
    )

    await set_reset_password_token(
        user_id=str(user["_id"]),
        token=reset_token,
        expires_at=expires_at
    )

    if settings.ENVIRONMENT == "development":
        return ForgotPasswordResponse(
            message=generic_message,
            resetToken=reset_token,
            resetUrl=reset_url
        )

    await send_password_reset_email(
        to_email=normalized_email,
        user_name=user.get("name", "usuario"),
        reset_url=reset_url
    )

    return ForgotPasswordResponse(
        message=generic_message,
        resetToken=None,
        resetUrl=None
    )


async def reset_password(
    payload: ResetPasswordRequest
) -> ResetPasswordResponse:
    """
    Restablece contraseña usando token de recuperación.
    """
    validate_password_strength(payload.newPassword)

    user = await find_user_by_reset_token(payload.token)

    if user is None:
        raise UnauthorizedException(
            message="Token de recuperación inválido."
        )

    validate_user_account_status(user)

    expires_at = user.get("resetPasswordExpiresAt")

    if expires_at is None:
        raise UnauthorizedException(
            message="Token de recuperación inválido."
        )

    now = get_current_utc_datetime()

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < now:
        raise UnauthorizedException(
            message="El token de recuperación expiró."
        )

    new_password_hash = hash_password(payload.newPassword)

    updated_user = await update_user_by_id(
        str(user["_id"]),
        {
            "passwordHash": new_password_hash,
            "provider": "local",
            "resetPasswordToken": None,
            "resetPasswordExpiresAt": None
        }
    )

    if updated_user is None:
        raise NotFoundException(
            message="Usuario no encontrado."
        )

    return ResetPasswordResponse(
        message="La contraseña fue actualizada correctamente."
    )