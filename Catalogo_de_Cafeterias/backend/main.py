from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.cafeterias_routes import router as cafeterias_router

"""
Punto de entrada del backend.

Responsabilidades:
- Crear la aplicación FastAPI
- Configurar CORS para permitir comunicación con Angular
- Registrar las rutas del sistema
"""

# Instancia principal de la aplicación
app = FastAPI(
    title="API de Catálogo de Cafeterías",
    description="Backend para consultar cafeterías desde un frontend Angular.",
    version="1.0.0"
)

"""
Configuración de CORS para entorno LOCAL.

En este modo:
- permitimos el frontend local clásico
- permitimos también acceso desde la red local
- esto facilita pruebas desde otra computadora o celular
  dentro de la misma red

En desarrollo, para evitar bloqueos innecesarios,
se permite cualquier origen.
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Registro de rutas
app.include_router(cafeterias_router)


@app.get("/")
def inicio():
    """
    Ruta raíz para verificar que el backend funciona correctamente.
    """
    return {
        "mensaje": "Backend del catálogo de cafeterías funcionando correctamente"
    }