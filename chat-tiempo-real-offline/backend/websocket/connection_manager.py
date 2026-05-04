"""
connection_manager.py

Administrador de conexiones WebSocket.

Mantiene la lista de clientes conectados y permite enviar
mensajes a todos en tiempo real.
"""

from fastapi import WebSocket


class ConnectionManager:
    """
    Clase encargada de administrar las conexiones activas.

    active_connections:
    Lista de WebSockets actualmente conectados.
    """

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Acepta una nueva conexión WebSocket y la guarda
        en la lista de conexiones activas.
        """

        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        """
        Elimina una conexión WebSocket cuando el usuario se desconecta.
        """

        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        """
        Envía un mensaje a todos los clientes conectados.

        Esto permite que todos los usuarios vean el mensaje
        en tiempo real.
        """

        for connection in self.active_connections:
            await connection.send_text(message)