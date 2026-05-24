"""
============================================================
MODELOS DEL SENSOR
============================================================

Este archivo contiene los modelos de datos usados por FastAPI.

Los modelos sirven para:

1. Validar los datos que llegan al backend.
2. Definir la estructura de las respuestas.
3. Documentar automáticamente la API.
4. Evitar recibir información incompleta o incorrecta.

FastAPI usa Pydantic para trabajar con estos modelos.

En este proyecto hay modelos para:
- Datos enviados por la ESP32.
- Datos guardados en la bitácora.
- Resumen de eventos.
- Datos para gráficas.
"""

from pydantic import BaseModel, Field


class SensorEventoEntrada(BaseModel):
    """
    ============================================================
    MODELO: SensorEventoEntrada
    ============================================================

    Representa los datos que envía la ESP32 al backend.

    Ejemplo de JSON recibido:

    {
        "unidad": "ESP32-IR-01",
        "sensor": "infrarrojo",
        "estado": 0,
        "detectado": true
    }

    Campos:

    unidad:
    Identifica la ESP32 que envió el dato.

    sensor:
    Nombre o tipo del sensor.

    estado:
    Valor digital leído por la ESP32.
    Puede ser 0 o 1.

    detectado:
    Valor booleano.
    true  = hubo detección.
    false = no hubo detección.
    """

    unidad: str = Field(min_length=3, max_length=80)
    sensor: str = Field(min_length=3, max_length=80)
    estado: int
    detectado: bool


class SensorEventoRespuesta(BaseModel):
    """
    ============================================================
    MODELO: SensorEventoRespuesta
    ============================================================

    Representa un evento ya registrado en la bitácora.

    A diferencia de SensorEventoEntrada, aquí el backend agrega:

    id:
    Identificador único del evento.

    fecha:
    Fecha en que se recibió el evento.

    hora:
    Hora en que se recibió el evento.

    fecha_hora:
    Fecha y hora completas en un solo campo.

    Este modelo se usa cuando Angular consulta la bitácora.
    """

    id: int
    unidad: str
    sensor: str
    estado: int
    detectado: bool
    fecha: str
    hora: str
    fecha_hora: str


class SensorResumen(BaseModel):
    """
    ============================================================
    MODELO: SensorResumen
    ============================================================

    Representa los totales principales del sistema.

    total_eventos:
    Cantidad total de registros guardados.

    total_detectados:
    Cantidad de eventos donde detectado = true.

    total_no_detectados:
    Cantidad de eventos donde detectado = false.
    """

    total_eventos: int
    total_detectados: int
    total_no_detectados: int


class GraficaLineaRespuesta(BaseModel):
    """
    ============================================================
    MODELO: GraficaLineaRespuesta
    ============================================================

    Representa los datos para una gráfica de línea.

    labels:
    Etiquetas del eje X.
    En este proyecto son los minutos.

    data:
    Valores del eje Y.
    En este proyecto son las detecciones por minuto.

    Ejemplo:

    {
        "labels": ["10:30", "10:31", "10:32"],
        "data": [4, 2, 7]
    }
    """

    labels: list[str]
    data: list[int]


class GraficaEstadosRespuesta(BaseModel):
    """
    ============================================================
    MODELO: GraficaEstadosRespuesta
    ============================================================

    Representa datos para gráficas de barras o dona.

    En este proyecto se usa para comparar:

    - Detectado
    - No detectado

    Ejemplo:

    {
        "labels": ["Detectado", "No detectado"],
        "data": [30, 12]
    }
    """

    labels: list[str]
    data: list[int]


class GraficasRespuesta(BaseModel):
    """
    ============================================================
    MODELO: GraficasRespuesta
    ============================================================

    Agrupa todos los datos necesarios para las gráficas del frontend.

    Incluye:

    linea_detecciones_por_minuto:
    Datos para la gráfica de línea.

    barras_estado_sensor:
    Datos para la gráfica de barras.

    dona_estado_sensor:
    Datos para la gráfica circular tipo dona.
    """

    linea_detecciones_por_minuto: GraficaLineaRespuesta
    barras_estado_sensor: GraficaEstadosRespuesta
    dona_estado_sensor: GraficaEstadosRespuesta