"""
============================================================
ARCHIVO PRINCIPAL DEL BACKEND
============================================================

Este archivo crea la aplicación FastAPI.

Responsabilidades principales:

1. Crear la instancia principal de FastAPI.
2. Configurar CORS para permitir peticiones desde Angular.
3. Registrar las rutas del módulo del sensor.
4. Crear una ruta inicial de prueba.

Flujo general:

ESP32  →  POST /api/sensor/eventos
Angular → GET  /api/sensor/eventos
Angular → GET  /api/sensor/resumen
Angular → GET  /api/sensor/graficas

FastAPI funciona como intermediario entre:
- El hardware, que envía datos.
- La aplicación web, que consulta y muestra datos.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.sensor_routes import router as sensor_router


"""
============================================================
CREACIÓN DE LA APLICACIÓN FASTAPI
============================================================

app representa el servidor web.

Aquí se define:
- Título de la API.
- Descripción.
- Versión.

Estos datos aparecen en la documentación automática de FastAPI,
disponible en:

http://localhost:8000/docs
"""

app = FastAPI(
    title="API Sensor Infrarrojo ESP32",
    description="Backend para recibir eventos de un sensor infrarrojo conectado a una ESP32.",
    version="1.0.0"
)


"""
============================================================
CONFIGURACIÓN DE CORS
============================================================

CORS significa Cross-Origin Resource Sharing.

Es una política de seguridad del navegador.

Angular corre normalmente en:

http://localhost:4200

FastAPI corre normalmente en:

http://localhost:8000

Como son puertos diferentes, el navegador considera que son orígenes distintos.

Por eso se debe permitir que Angular pueda hacer peticiones al backend.

IMPORTANTE:
La ESP32 no necesita CORS, porque CORS aplica principalmente a navegadores.
Pero Angular sí lo necesita.
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
============================================================
REGISTRO DE RUTAS
============================================================

Aquí se conecta el archivo de rutas del sensor con la aplicación principal.

Todas las rutas del sensor comenzarán con:

/api/sensor

Ejemplo:

/api/sensor/eventos
/api/sensor/resumen
/api/sensor/graficas
"""

app.include_router(
    sensor_router,
    prefix="/api/sensor",
    tags=["Sensor infrarrojo"]
)


"""
============================================================
RUTA DE PRUEBA
============================================================

Esta ruta sirve para verificar rápidamente si el backend está funcionando.

Se puede abrir en el navegador:

http://localhost:8000/
"""

@app.get("/")
def inicio():
    return {
        "mensaje": "API del sistema de monitoreo de sensor infrarrojo funcionando correctamente."
    }