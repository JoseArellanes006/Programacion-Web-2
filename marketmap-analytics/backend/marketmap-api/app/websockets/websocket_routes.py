"""
Rutas WebSocket y endpoints auxiliares.

Endpoint WebSocket:
- WS /ws/{user_id}

Endpoints HTTP auxiliares:
- GET /ws/status
- POST /ws/broadcast

El WebSocket recibe user_id y role como parámetros.
Ejemplo:
ws://127.0.0.1:8000/ws/USER_ID?role=ADMIN

En una versión más estricta, se puede validar JWT en query params.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.common.response_schema import ActionResponse
from app.websockets.websocket_manager import websocket_manager
from app.websockets.websocket_service import notify_all


router = APIRouter(
    prefix="/ws",
    tags=["WebSockets"]
)


@router.websocket("/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    role: str = "CUSTOMER"
):
    """
    Conecta un cliente WebSocket.

    El cliente puede enviar mensajes tipo texto.
    El servidor responderá con un evento ECHO.
    """
    await websocket_manager.connect(
        user_id=user_id,
        role=role,
        websocket=websocket
    )

    try:
        await websocket.send_json({
            "event": "CONNECTED",
            "data": {
                "userId": user_id,
                "role": role
            }
        })

        while True:
            message = await websocket.receive_text()

            await websocket.send_json({
                "event": "ECHO",
                "data": {
                    "message": message
                }
            })

    except WebSocketDisconnect:
        websocket_manager.disconnect(user_id)

    except Exception:
        websocket_manager.disconnect(user_id)


@router.get(
    "/status",
    response_model=dict
)
async def websocket_status_endpoint():
    """
    Devuelve estado actual de conexiones WebSocket.
    """
    return {
        "success": True,
        "connectedUsers": websocket_manager.get_connected_users_count(),
        "users": websocket_manager.get_connected_users()
    }


@router.post(
    "/broadcast",
    response_model=ActionResponse
)
async def broadcast_endpoint(
    event: str,
    message: str
):
    """
    Envía un mensaje de prueba a todos los clientes conectados.

    Ejemplo:
    POST /ws/broadcast?event=SYSTEM_MESSAGE&message=Hola
    """
    notified = await notify_all(
        event=event,
        data={
            "message": message
        }
    )

    return ActionResponse(
        success=True,
        message="Mensaje enviado por WebSocket.",
        metadata={
            "notified": notified
        }
    )