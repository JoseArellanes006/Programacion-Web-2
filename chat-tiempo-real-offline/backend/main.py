"""
main.py

Archivo principal del backend FastAPI.

Aquí se crea la aplicación, se configura CORS, se registran
las rutas REST y se habilita el endpoint WebSocket del chat.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth_routes import router as auth_router
from routes.chat_routes import router as chat_router

app = FastAPI(
    title="API Chat en Tiempo Real Offline",
    description="Backend para login, historial de mensajes y chat en tiempo real con WebSockets.",
    version="1.0.0"
)

"""
CORS permite que Angular pueda comunicarse con FastAPI.

Angular:
http://localhost:4200

FastAPI:
http://127.0.0.1:8000
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

"""
Se registran las rutas REST.

auth_router:
- POST /api/login

chat_router:
- GET /api/mensajes
- WebSocket /ws/chat
"""
app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/")
def inicio():
    """
    Ruta básica para comprobar que el backend está activo.
    """
    return {
        "mensaje": "Backend del chat funcionando correctamente"
    }