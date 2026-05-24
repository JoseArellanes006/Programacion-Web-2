"""
Archivo principal de la API FastAPI.

Este archivo inicializa la aplicación backend de MarketMap Analytics.

Responsabilidades principales:
- Crear la instancia de FastAPI.
- Configurar CORS para permitir comunicación con Angular.
- Registrar manejadores globales de errores.
- Conectar y desconectar MongoDB.
- Crear índices necesarios en MongoDB.
- Registrar routers del sistema.
- Servir archivos estáticos.
- Definir endpoints base de verificación.

Routers registrados:
- auth
- users
- products
- categories
- images
- cart
- orders
- maps
- dashboard
- reports
- websockets
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.auth.auth_routes import router as auth_router
from app.cart.cart_repository import create_cart_indexes
from app.cart.cart_routes import router as cart_router
from app.categories.category_repository import create_category_indexes
from app.categories.category_routes import router as categories_router
from app.core.config import settings
from app.core.database import close_database_connection, connect_to_database
from app.core.exceptions import AppException
from app.dashboard.dashboard_routes import router as dashboard_router
from app.images.image_repository import create_image_indexes
from app.images.image_routes import router as images_router
from app.maps.map_repository import create_map_indexes
from app.maps.map_routes import router as maps_router
from app.orders.order_repository import create_order_indexes
from app.orders.order_routes import router as orders_router
from app.products.product_repository import create_product_indexes
from app.products.product_routes import router as products_router
from app.reports.report_routes import router as reports_router
from app.users.user_repository import create_user_indexes
from app.users.user_routes import router as users_router
from app.websockets.websocket_routes import router as websocket_router


STATIC_DIRECTORY = Path("app/static")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Controla el ciclo de vida de la aplicación.

    Antes de iniciar:
    - se abre conexión con MongoDB.
    - se crean índices necesarios en usuarios.
    - se crean índices necesarios en productos.
    - se crean índices necesarios en categorías.
    - se crean índices necesarios en imágenes.
    - se crean índices necesarios en carritos.
    - se crean índices necesarios en pedidos.
    - se crean índices necesarios en zonas del mapa.

    Al finalizar:
    - se cierra conexión con MongoDB.
    """
    await connect_to_database()
    await create_user_indexes()
    await create_product_indexes()
    await create_category_indexes()
    await create_image_indexes()
    await create_cart_indexes()
    await create_order_indexes()
    await create_map_indexes()

    yield

    await close_database_connection()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.PROJECT_DESCRIPTION,
    version=settings.PROJECT_VERSION,
    lifespan=lifespan
)


"""
Asegura que exista el directorio de archivos estáticos.

Aquí se guardarán archivos subidos como imágenes de productos.
"""
STATIC_DIRECTORY.mkdir(
    parents=True,
    exist_ok=True
)


"""
Configuración CORS.

Esto permite que Angular pueda consumir la API durante desarrollo.
"""
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """
    Maneja errores personalizados del sistema.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "detail": exc.detail
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Maneja errores no controlados.

    En producción no se debe exponer información sensible del error.
    """
    if settings.DEBUG:
        detail = str(exc)
    else:
        detail = "Error interno del servidor."

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Ocurrió un error inesperado.",
            "detail": detail
        }
    )


"""
Archivos estáticos.

Esto permite acceder a imágenes subidas mediante rutas como:

http://127.0.0.1:8000/static/uploads/products/archivo.png
"""
app.mount(
    "/static",
    StaticFiles(directory=str(STATIC_DIRECTORY)),
    name="static"
)


"""
Registro de routers.

Angular consume rutas sin prefijo /api, por ejemplo:
- /auth/login
- /products
- /cart
- /orders
- /maps/active
- /reports/sales/pdf
"""
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(products_router)
app.include_router(categories_router)
app.include_router(images_router)
app.include_router(cart_router)
app.include_router(orders_router)
app.include_router(maps_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(websocket_router)


@app.get("/")
async def root():
    """
    Endpoint base para verificar que la API está activa.
    """
    return {
        "success": True,
        "message": "MarketMap Analytics API funcionando correctamente.",
        "project": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }


@app.get("/health")
async def health_check():
    """
    Endpoint de verificación de salud del backend.
    """
    return {
        "success": True,
        "message": "Backend activo.",
        "environment": settings.ENVIRONMENT
    }