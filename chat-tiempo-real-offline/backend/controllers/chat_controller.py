"""
chat_controller.py

Controlador del chat.

Sirve como capa intermedia entre las rutas y el servicio.
"""

from models.mensaje_model import Mensaje
from services.chat_service import obtener_mensajes, guardar_mensaje


def listar_mensajes_controller() -> list[Mensaje]:
    """
    Controlador para listar historial de mensajes.
    """
    return obtener_mensajes()


def guardar_mensaje_controller(mensaje: Mensaje) -> Mensaje:
    """
    Controlador para guardar un mensaje.
    """
    return guardar_mensaje(mensaje)