from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.cafeterias_routes import router as cafeterias_router

"""
Este archivo es el punto de entrada del backend.

Su función principal es:
1. Crear la aplicación FastAPI
2. Configurar CORS para permitir la comunicación con el frontend
3. Registrar las rutas del módulo de cafeterías
"""

# Se crea la instancia principal de FastAPI.
# Esta instancia representa toda la aplicación backend.
app = FastAPI(
    title="API de Catálogo de Cafeterías",
    description="Backend para consultar cafeterías desde un frontend Angular con enfoque móvil.",
    version="1.0.0"
)

"""
Configuración de CORS.

¿Por qué es necesaria?
Porque el frontend Angular y el backend FastAPI normalmente corren en
puertos distintos, por ejemplo:

- Frontend Angular: http://localhost:4200
- Backend FastAPI:  http://127.0.0.1:8000

Aunque estén en la misma computadora, el navegador los considera
orígenes distintos y bloquea la comunicación si no se autoriza.

Además, si quieres probar desde celular en la misma red local,
normalmente accederás con la IP de tu computadora, por ejemplo:
http://192.168.1.10:4200

Por eso, en desarrollo conviene permitir todos los orígenes con ["*"].
Esto facilita pruebas locales, en red y desde distintos dispositivos.

Importante:
En producción, lo recomendable es NO dejar ["*"], sino especificar
solo los dominios permitidos.
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite peticiones desde cualquier origen durante desarrollo
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP: GET, POST, PUT, DELETE, etc.
    allow_headers=["*"]   # Permite todos los encabezados
)

# Aquí se registran las rutas del módulo de cafeterías.
# Todo lo definido en cafeterias_routes.py quedará incorporado a la app principal.
app.include_router(cafeterias_router)


@app.get("/")
def inicio():
    """
    Ruta raíz del backend.

    Se usa como prueba rápida para verificar que el servidor está funcionando.
    Si esta ruta responde, significa que FastAPI se levantó correctamente.
    """
    return {
        "mensaje": "Backend del catálogo de cafeterías funcionando correctamente"
    }