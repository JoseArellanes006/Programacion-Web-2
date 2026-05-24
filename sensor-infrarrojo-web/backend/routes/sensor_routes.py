"""
============================================================
RUTAS DEL SENSOR
============================================================

Este archivo define los endpoints del backend.

Un endpoint es una URL que permite realizar una acción.

En este proyecto se usan los siguientes endpoints:

POST   /api/sensor/eventos
GET    /api/sensor/eventos
GET    /api/sensor/resumen
GET    /api/sensor/grafica/detecciones-por-minuto
GET    /api/sensor/graficas
DELETE /api/sensor/eventos

La ESP32 usa principalmente:

POST /api/sensor/eventos

Angular usa principalmente:

GET /api/sensor/eventos
GET /api/sensor/resumen
GET /api/sensor/graficas
"""

from fastapi import APIRouter

from models.sensor_model import (
    SensorEventoEntrada,
    SensorEventoRespuesta,
    SensorResumen,
    GraficaLineaRespuesta,
    GraficasRespuesta
)

from services.sensor_service import (
    registrar_evento,
    obtener_eventos,
    obtener_resumen,
    obtener_detecciones_por_minuto,
    obtener_graficas,
    limpiar_bitacora
)


"""
============================================================
CREACIÓN DEL ROUTER
============================================================

APIRouter permite agrupar rutas relacionadas.

En este caso, todas las rutas pertenecen al módulo del sensor infrarrojo.
"""

router = APIRouter()


@router.post("/eventos", response_model=SensorEventoRespuesta)
def crear_evento(evento: SensorEventoEntrada):
    """
    ============================================================
    ENDPOINT: POST /api/sensor/eventos
    ============================================================

    Este endpoint recibe datos desde la ESP32.

    La ESP32 envía un JSON como este:

    {
        "unidad": "ESP32-IR-01",
        "sensor": "infrarrojo",
        "estado": 0,
        "detectado": true
    }

    FastAPI valida los datos usando SensorEventoEntrada.

    Después llama al servicio registrar_evento().

    Retorna el evento ya guardado, incluyendo:
    - id
    - fecha
    - hora
    - fecha_hora
    """

    return registrar_evento(evento)


@router.get("/eventos", response_model=list[SensorEventoRespuesta])
def listar_eventos():
    """
    ============================================================
    ENDPOINT: GET /api/sensor/eventos
    ============================================================

    Este endpoint devuelve la bitácora completa.

    Angular lo usa para mostrar la tabla de eventos.

    Retorna una lista de eventos ordenados del más reciente
    al más antiguo.
    """

    return obtener_eventos()


@router.get("/resumen", response_model=SensorResumen)
def consultar_resumen():
    """
    ============================================================
    ENDPOINT: GET /api/sensor/resumen
    ============================================================

    Este endpoint devuelve los totales del sistema.

    Angular lo usa para mostrar tarjetas de resumen.

    Ejemplo de respuesta:

    {
        "total_eventos": 50,
        "total_detectados": 32,
        "total_no_detectados": 18
    }
    """

    return obtener_resumen()


@router.get("/grafica/detecciones-por-minuto", response_model=GraficaLineaRespuesta)
def consultar_detecciones_por_minuto():
    """
    ============================================================
    ENDPOINT: GET /api/sensor/grafica/detecciones-por-minuto
    ============================================================

    Este endpoint devuelve únicamente los datos para la gráfica de línea.

    La gráfica de línea muestra:

    - Eje X: minutos.
    - Eje Y: cantidad de detecciones.

    Sirve para observar subidas y caídas de detecciones
    con respecto al tiempo.
    """

    return obtener_detecciones_por_minuto()


@router.get("/graficas", response_model=GraficasRespuesta)
def consultar_graficas():
    """
    ============================================================
    ENDPOINT: GET /api/sensor/graficas
    ============================================================

    Este endpoint devuelve todos los datos necesarios para las gráficas.

    Angular lo usa para construir:

    - Gráfica de línea.
    - Gráfica de barras.
    - Gráfica de dona.

    La ventaja de este endpoint es que el frontend no tiene que calcular
    demasiado. El backend ya entrega los datos preparados.
    """

    return obtener_graficas()


@router.delete("/eventos")
def eliminar_bitacora():
    """
    ============================================================
    ENDPOINT: DELETE /api/sensor/eventos
    ============================================================

    Este endpoint limpia la bitácora.

    Angular lo usa cuando el usuario presiona el botón:

        Limpiar bitácora

    Retorna un mensaje de confirmación.
    """

    return limpiar_bitacora()