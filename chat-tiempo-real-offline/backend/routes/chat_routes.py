"""
chat_routes.py

Rutas del chat.

Incluye:
- endpoint REST para consultar historial;
- endpoint WebSocket para comunicación en tiempo real.
"""

import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from websocket.connection_manager import ConnectionManager
from models.mensaje_model import Mensaje
from controllers.chat_controller import (
    listar_mensajes_controller,
    guardar_mensaje_controller
)
from services.auth_service import obtener_usuario_por_token


router = APIRouter(
    tags=["Chat"]
)

manager = ConnectionManager()


@router.get("/api/mensajes", response_model=list[Mensaje])
def listar_mensajes():
    """
    Devuelve el historial de mensajes guardados en backend.

    URL:
    GET http://127.0.0.1:8000/api/mensajes
    """

    return listar_mensajes_controller()


@router.websocket("/ws/chat")
async def websocket_chat(
    websocket: WebSocket,
    token: str = Query(...)
):
    """
    Endpoint WebSocket del chat.

    Angular se conecta a:
    ws://127.0.0.1:8000/ws/chat?token=TOKEN

    Flujo:
    1. Valida token.
    2. Acepta conexión.
    3. Recibe mensajes.
    4. Guarda mensajes.
    5. Reenvía cada mensaje a todos los clientes conectados.
    """

    try:
        obtener_usuario_por_token(token)
    except Exception:
        await websocket.close(code=1008)
        return

    await manager.connect(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            mensaje_dict = json.loads(data)
            mensaje = Mensaje(**mensaje_dict)

            mensaje_guardado = guardar_mensaje_controller(mensaje)

            await manager.broadcast(mensaje_guardado.model_dump_json())

    except WebSocketDisconnect:
        manager.disconnect(websocket)