"""
main.py

Archivo principal del backend FastAPI.

Aquí se crea la aplicación, se configura CORS y se registran
las rutas del proyecto.

Este backend funciona como API de apoyo para el proyecto Angular:
Simulador de presupuesto personal inteligente.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.presupuesto_routes import router as presupuesto_router


app = FastAPI(
    title="API Simulador de Presupuesto Personal",
    description="Backend para apoyar el simulador de presupuesto personal hecho en Angular.",
    version="1.0.0"
)


"""
Configuración de CORS.

Angular normalmente se ejecuta en:
http://localhost:4200

FastAPI se ejecuta en:
http://127.0.0.1:8000

Sin CORS, el navegador bloquearía las peticiones entre frontend y backend.
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
Registro de rutas.

Todas las rutas del proyecto quedan agrupadas bajo /api.
"""
app.include_router(presupuesto_router)


@app.get("/")
def inicio():
    """
    Ruta básica para verificar que el backend está funcionando.
    """
    return {
        "mensaje": "API del Simulador de Presupuesto Personal funcionando correctamente"
    }