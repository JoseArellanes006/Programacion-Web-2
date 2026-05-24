"""
Configuración global del backend.

Este archivo centraliza las variables de entorno del sistema.

La información sensible NO debe escribirse directamente en el código.
Debe venir desde el archivo .env.

Aquí se configuran:
- nombre del proyecto
- entorno
- MongoDB
- Google OAuth
- JWT
- CORS
- seguridad
- recuperación de contraseña
- correo SMTP
- reglas de contraseña
"""

import json

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Clase principal de configuración.

    Pydantic Settings lee automáticamente el archivo .env
    y convierte los valores al tipo correspondiente.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "MarketMap Analytics"
    PROJECT_DESCRIPTION: str = "Sistema Web de Gestión Comercial con Mapa Interactivo y Análisis de Ventas"
    PROJECT_VERSION: str = "1.0.0"

    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    API_PREFIX: str = "/api"

    FRONTEND_URL: str = Field(
        default="http://localhost:4200",
        description="URL base del frontend Angular"
    )

    MONGODB_URI: str = Field(
        default="mongodb://localhost:27017",
        description="URI de conexión a MongoDB"
    )

    MONGODB_DATABASE: str = Field(
        default="marketmap_analytics",
        description="Nombre de la base de datos"
    )

    GOOGLE_CLIENT_ID: str = Field(
        default="",
        description="Client ID de Google OAuth para validar inicio de sesión con Google"
    )

    JWT_SECRET_KEY: str = Field(
        default="change_this_secret_key",
        description="Clave secreta para firmar tokens JWT"
    )

    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    PASSWORD_MIN_LENGTH: int = 8
    PASSWORD_REQUIRE_UPPERCASE: bool = True
    PASSWORD_REQUIRE_LOWERCASE: bool = True
    PASSWORD_REQUIRE_NUMBER: bool = True
    PASSWORD_REQUIRE_SPECIAL_CHARACTER: bool = True

    RESET_PASSWORD_EXPIRE_MINUTES: int = 30

    SMTP_HOST: str = Field(
        default="",
        description="Servidor SMTP"
    )

    SMTP_PORT: int = Field(
        default=587,
        description="Puerto SMTP"
    )

    SMTP_USERNAME: str = Field(
        default="",
        description="Usuario SMTP"
    )

    SMTP_PASSWORD: str = Field(
        default="",
        description="Contraseña SMTP o contraseña de aplicación"
    )

    SMTP_FROM_EMAIL: str = Field(
        default="",
        description="Correo remitente"
    )

    SMTP_FROM_NAME: str = Field(
        default="MarketMap Analytics",
        description="Nombre del remitente"
    )

    SMTP_USE_TLS: bool = Field(
        default=True,
        description="Indica si se usa STARTTLS"
    )

    CORS_ORIGINS: list[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:4201",
        "http://127.0.0.1:4201"
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        """
        Permite leer CORS_ORIGINS desde .env de dos formas:

        1. Como arreglo JSON:
           CORS_ORIGINS=["http://localhost:4200","http://127.0.0.1:4200"]

        2. Como texto separado por comas:
           CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:4200
        """

        if value is None:
            return [
                "http://localhost:4200",
                "http://127.0.0.1:4200",
                "http://localhost:4201",
                "http://127.0.0.1:4201"
            ]

        if isinstance(value, list):
            return value

        if isinstance(value, str):
            clean_value = value.strip()

            if not clean_value:
                return [
                    "http://localhost:4200",
                    "http://127.0.0.1:4200",
                    "http://localhost:4201",
                    "http://127.0.0.1:4201"
                ]

            if clean_value.startswith("["):
                try:
                    parsed_value = json.loads(clean_value)

                    if isinstance(parsed_value, list):
                        return [
                            str(origin).strip()
                            for origin in parsed_value
                            if str(origin).strip()
                        ]
                except json.JSONDecodeError:
                    pass

            return [
                origin.strip()
                for origin in clean_value.split(",")
                if origin.strip()
            ]

        return value


settings = Settings()