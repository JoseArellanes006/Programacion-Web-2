"""
chat_service.py

Contiene la lógica relacionada con los mensajes del chat.

Funciones principales:
- guardar mensajes;
- listar historial;
- marcar mensajes como enviados.
"""

from models.mensaje_model import Mensaje
from data.mensajes_data import mensajes_db


def guardar_mensaje(mensaje: Mensaje) -> Mensaje:
    """
    Guarda un mensaje en memoria.

    Si el mensaje venía como pendiente desde Angular,
    el backend lo registra como enviado.
    """

    mensaje_guardado = Mensaje(
        id=mensaje.id,
        usuarioId=mensaje.usuarioId,
        usuarioNombre=mensaje.usuarioNombre,
        texto=mensaje.texto,
        fecha=mensaje.fecha,
        estado="enviado"
    )

    existe = any(item.id == mensaje_guardado.id for item in mensajes_db)

    if not existe:
        mensajes_db.append(mensaje_guardado)

    return mensaje_guardado


def obtener_mensajes() -> list[Mensaje]:
    """
    Devuelve el historial de mensajes guardados en el backend.
    """
    return mensajes_db