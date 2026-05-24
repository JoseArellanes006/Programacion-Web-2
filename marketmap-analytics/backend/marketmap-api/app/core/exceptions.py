"""
Excepciones personalizadas del backend.

Este archivo define errores reutilizables para toda la API.

La intención es evitar respuestas inconsistentes y centralizar
los mensajes principales del sistema.
"""


class AppException(Exception):
    """
    Excepción base del sistema.

    Todas las excepciones personalizadas heredan de esta clase.
    """

    def __init__(
        self,
        status_code: int,
        message: str,
        detail: str | None = None
    ):
        self.status_code = status_code
        self.message = message
        self.detail = detail
        super().__init__(message)


class BadRequestException(AppException):
    """
    Error 400.

    Se usa cuando la solicitud tiene datos inválidos.
    """

    def __init__(
        self,
        message: str = "Solicitud inválida.",
        detail: str | None = None
    ):
        super().__init__(
            status_code=400,
            message=message,
            detail=detail
        )


class UnauthorizedException(AppException):
    """
    Error 401.

    Se usa cuando no hay autenticación válida.
    """

    def __init__(
        self,
        message: str = "No autenticado.",
        detail: str | None = None
    ):
        super().__init__(
            status_code=401,
            message=message,
            detail=detail
        )


class ForbiddenException(AppException):
    """
    Error 403.

    Se usa cuando el usuario está autenticado,
    pero no tiene permisos suficientes.
    """

    def __init__(
        self,
        message: str = "No tiene permisos para realizar esta acción.",
        detail: str | None = None
    ):
        super().__init__(
            status_code=403,
            message=message,
            detail=detail
        )


class NotFoundException(AppException):
    """
    Error 404.

    Se usa cuando un recurso no existe.
    """

    def __init__(
        self,
        message: str = "Recurso no encontrado.",
        detail: str | None = None
    ):
        super().__init__(
            status_code=404,
            message=message,
            detail=detail
        )


class ConflictException(AppException):
    """
    Error 409.

    Se usa cuando hay conflicto con el estado actual del sistema.

    Ejemplo:
    - correo ya registrado
    - producto duplicado
    - operación no permitida por estado actual
    """

    def __init__(
        self,
        message: str = "Conflicto con el estado actual del recurso.",
        detail: str | None = None
    ):
        super().__init__(
            status_code=409,
            message=message,
            detail=detail
        )


class UnprocessableEntityException(AppException):
    """
    Error 422.

    Se usa cuando los datos tienen estructura válida,
    pero no cumplen reglas de negocio.
    """

    def __init__(
        self,
        message: str = "No fue posible procesar la información.",
        detail: str | None = None
    ):
        super().__init__(
            status_code=422,
            message=message,
            detail=detail
        )