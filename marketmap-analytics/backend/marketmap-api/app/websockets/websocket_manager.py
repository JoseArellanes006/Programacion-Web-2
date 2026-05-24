"""
Administrador de conexiones WebSocket.

Este archivo maneja las conexiones activas del backend.

Permite:
- conectar usuarios
- desconectar usuarios
- enviar mensajes a un usuario específico
- enviar mensajes a todos los usuarios
- enviar mensajes por rol
- consultar conexiones activas

La autenticación real del WebSocket se puede fortalecer después usando
tokens JWT enviados como query param.
"""

from fastapi import WebSocket


class WebSocketManager:
    """
    Controla conexiones WebSocket activas.
    """

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.user_roles: dict[str, str] = {}

    async def connect(
        self,
        user_id: str,
        role: str,
        websocket: WebSocket
    ) -> None:
        """
        Acepta y registra una conexión.
        """
        await websocket.accept()

        self.active_connections[user_id] = websocket
        self.user_roles[user_id] = role

    def disconnect(
        self,
        user_id: str
    ) -> None:
        """
        Elimina una conexión activa.
        """
        self.active_connections.pop(user_id, None)
        self.user_roles.pop(user_id, None)

    async def send_to_user(
        self,
        user_id: str,
        message: dict
    ) -> bool:
        """
        Envía mensaje a un usuario específico.

        Devuelve True si se envió.
        Devuelve False si el usuario no está conectado.
        """
        websocket = self.active_connections.get(user_id)

        if websocket is None:
            return False

        await websocket.send_json(message)

        return True

    async def broadcast(
        self,
        message: dict
    ) -> int:
        """
        Envía mensaje a todos los usuarios conectados.

        Devuelve la cantidad de conexiones notificadas.
        """
        notified = 0

        disconnected_users: list[str] = []

        for user_id, websocket in self.active_connections.items():
            try:
                await websocket.send_json(message)
                notified += 1
            except Exception:
                disconnected_users.append(user_id)

        for user_id in disconnected_users:
            self.disconnect(user_id)

        return notified

    async def broadcast_by_role(
        self,
        role: str,
        message: dict
    ) -> int:
        """
        Envía mensaje a usuarios conectados con un rol específico.
        """
        notified = 0

        disconnected_users: list[str] = []

        for user_id, websocket in self.active_connections.items():
            user_role = self.user_roles.get(user_id)

            if user_role != role:
                continue

            try:
                await websocket.send_json(message)
                notified += 1
            except Exception:
                disconnected_users.append(user_id)

        for user_id in disconnected_users:
            self.disconnect(user_id)

        return notified

    def get_connected_users_count(self) -> int:
        """
        Devuelve número de usuarios conectados.
        """
        return len(self.active_connections)

    def get_connected_users(self) -> list[dict[str, str]]:
        """
        Devuelve lista de usuarios conectados.
        """
        return [
            {
                "userId": user_id,
                "role": self.user_roles.get(user_id, "")
            }
            for user_id in self.active_connections.keys()
        ]


websocket_manager = WebSocketManager()