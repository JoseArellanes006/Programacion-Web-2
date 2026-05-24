"""
============================================================
SERVICIO DEL SENSOR
============================================================

Este archivo contiene la lógica principal del backend.

Responsabilidades:

1. Leer eventos desde un archivo JSON.
2. Guardar eventos en el archivo JSON.
3. Registrar nuevos eventos enviados por la ESP32.
4. Calcular resumen de eventos.
5. Preparar datos para las gráficas.
6. Limpiar la bitácora.

¿Por qué separar esta lógica en un servicio?

Porque las rutas no deberían tener toda la lógica interna.

Las rutas reciben peticiones HTTP.
Los servicios procesan los datos.

Esta separación hace que el código sea más ordenado y más fácil de explicar.
"""

import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

from models.sensor_model import SensorEventoEntrada


"""
============================================================
RUTA DEL ARCHIVO JSON
============================================================

DATA_DIR:
Carpeta donde se guardará la bitácora.

DATA_FILE:
Archivo donde se almacenarán los eventos.

En este proyecto se usa JSON para evitar una base de datos y mantener
el proyecto sencillo para clase.
"""

DATA_DIR = Path("data")
DATA_FILE = DATA_DIR / "eventos_sensor.json"


def inicializar_archivo() -> None:
    """
    ============================================================
    FUNCIÓN: inicializar_archivo()
    ============================================================

    Esta función verifica que exista:

    - La carpeta data.
    - El archivo eventos_sensor.json.

    Si no existen, los crea automáticamente.

    Esto evita errores cuando se ejecuta el backend por primera vez.
    """

    DATA_DIR.mkdir(exist_ok=True)

    if not DATA_FILE.exists():
        with open(DATA_FILE, "w", encoding="utf-8") as archivo:
            json.dump([], archivo, indent=4, ensure_ascii=False)


def leer_eventos() -> list[dict]:
    """
    ============================================================
    FUNCIÓN: leer_eventos()
    ============================================================

    Lee todos los eventos guardados en eventos_sensor.json.

    Retorna:
    - Una lista de diccionarios.

    Si el archivo está vacío o tiene un error de formato,
    retorna una lista vacía.

    Esto permite que el sistema no se detenga si el archivo JSON
    todavía no contiene datos.
    """

    inicializar_archivo()

    with open(DATA_FILE, "r", encoding="utf-8") as archivo:
        try:
            datos = json.load(archivo)

            if isinstance(datos, list):
                return datos

            return []

        except json.JSONDecodeError:
            return []


def guardar_eventos(eventos: list[dict]) -> None:
    """
    ============================================================
    FUNCIÓN: guardar_eventos()
    ============================================================

    Guarda la lista completa de eventos en el archivo JSON.

    Recibe:
    - eventos: lista de diccionarios con todos los registros.

    Cada vez que se registra un nuevo evento:
    1. Se leen los eventos actuales.
    2. Se agrega el nuevo evento.
    3. Se guarda nuevamente la lista completa.
    """

    inicializar_archivo()

    with open(DATA_FILE, "w", encoding="utf-8") as archivo:
        json.dump(eventos, archivo, indent=4, ensure_ascii=False)


def registrar_evento(evento: SensorEventoEntrada) -> dict:
    """
    ============================================================
    FUNCIÓN: registrar_evento()
    ============================================================

    Registra un nuevo evento enviado por la ESP32.

    Recibe:
    - evento: datos validados por el modelo SensorEventoEntrada.

    Proceso:
    1. Lee los eventos existentes.
    2. Obtiene la fecha y hora actual del servidor.
    3. Crea un nuevo evento con id, fecha y hora.
    4. Agrega el evento a la lista.
    5. Guarda la lista actualizada.
    6. Retorna el evento registrado.

    IMPORTANTE:
    La fecha y hora se generan en el backend, no en la ESP32.

    Esto simplifica el programa de la ESP32 y centraliza el tiempo
    en el servidor.
    """

    eventos = leer_eventos()

    ahora = datetime.now()

    nuevo_evento = {
        "id": len(eventos) + 1,
        "unidad": evento.unidad,
        "sensor": evento.sensor,
        "estado": evento.estado,
        "detectado": evento.detectado,
        "fecha": ahora.strftime("%Y-%m-%d"),
        "hora": ahora.strftime("%H:%M:%S"),
        "fecha_hora": ahora.strftime("%Y-%m-%d %H:%M:%S")
    }

    eventos.append(nuevo_evento)
    guardar_eventos(eventos)

    return nuevo_evento


def obtener_eventos() -> list[dict]:
    """
    ============================================================
    FUNCIÓN: obtener_eventos()
    ============================================================

    Devuelve la bitácora completa de eventos.

    Los eventos se devuelven ordenados del más reciente al más antiguo.

    Esto es útil para Angular, porque normalmente se quiere ver primero
    el último evento recibido.
    """

    eventos = leer_eventos()

    eventos_ordenados = sorted(
        eventos,
        key=lambda evento: evento.get("id", 0),
        reverse=True
    )

    return eventos_ordenados


def obtener_resumen() -> dict:
    """
    ============================================================
    FUNCIÓN: obtener_resumen()
    ============================================================

    Calcula los totales principales:

    - Total de eventos.
    - Total de detecciones.
    - Total de no detecciones.

    Estos datos se muestran en tarjetas dentro del frontend.
    """

    eventos = leer_eventos()

    total_eventos = len(eventos)
    total_detectados = sum(
        1 for evento in eventos
        if evento.get("detectado") is True
    )
    total_no_detectados = sum(
        1 for evento in eventos
        if evento.get("detectado") is False
    )

    return {
        "total_eventos": total_eventos,
        "total_detectados": total_detectados,
        "total_no_detectados": total_no_detectados
    }


def obtener_detecciones_por_minuto() -> dict:
    """
    ============================================================
    FUNCIÓN: obtener_detecciones_por_minuto()
    ============================================================

    Prepara los datos para la gráfica de línea.

    Objetivo de la gráfica:
    Mostrar cuántas detecciones ocurrieron en cada minuto.

    Eje X:
    Minuto, por ejemplo:

        10:30
        10:31
        10:32

    Eje Y:
    Cantidad de detecciones registradas en ese minuto.

    IMPORTANTE:
    Solo se cuentan eventos donde:

        detectado = True

    Los eventos donde detectado = False no aumentan la gráfica de línea,
    porque no representan una detección real.

    Ejemplo de salida:

    {
        "labels": ["10:30", "10:31", "10:32"],
        "data": [3, 1, 5]
    }
    """

    eventos = leer_eventos()

    detecciones_por_minuto = defaultdict(int)

    for evento in eventos:
        if evento.get("detectado") is True:
            fecha_hora = evento.get("fecha_hora", "")

            try:
                fecha_evento = datetime.strptime(
                    fecha_hora,
                    "%Y-%m-%d %H:%M:%S"
                )

                minuto = fecha_evento.strftime("%H:%M")

                detecciones_por_minuto[minuto] += 1

            except ValueError:
                continue

    labels = sorted(detecciones_por_minuto.keys())
    data = [detecciones_por_minuto[minuto] for minuto in labels]

    return {
        "labels": labels,
        "data": data
    }


def obtener_grafica_estados() -> dict:
    """
    ============================================================
    FUNCIÓN: obtener_grafica_estados()
    ============================================================

    Prepara los datos para las gráficas de barras y dona.

    Ambas gráficas usan la misma información:

    - Detectado
    - No detectado

    Ejemplo:

    {
        "labels": ["Detectado", "No detectado"],
        "data": [25, 10]
    }
    """

    resumen = obtener_resumen()

    return {
        "labels": ["Detectado", "No detectado"],
        "data": [
            resumen["total_detectados"],
            resumen["total_no_detectados"]
        ]
    }


def obtener_graficas() -> dict:
    """
    ============================================================
    FUNCIÓN: obtener_graficas()
    ============================================================

    Agrupa los datos de todas las gráficas en una sola respuesta.

    Esto permite que Angular haga una sola petición al backend para
    obtener toda la información gráfica.

    Incluye:
    - Gráfica de línea.
    - Gráfica de barras.
    - Gráfica de dona.
    """

    grafica_linea = obtener_detecciones_por_minuto()
    grafica_estados = obtener_grafica_estados()

    return {
        "linea_detecciones_por_minuto": grafica_linea,
        "barras_estado_sensor": grafica_estados,
        "dona_estado_sensor": grafica_estados
    }


def limpiar_bitacora() -> dict:
    """
    ============================================================
    FUNCIÓN: limpiar_bitacora()
    ============================================================

    Elimina todos los registros de la bitácora.

    En realidad no borra el archivo.
    Solamente lo deja como una lista vacía:

        []

    Esto permite reiniciar la práctica sin eliminar la estructura
    del proyecto.
    """

    guardar_eventos([])

    return {
        "mensaje": "Bitácora limpiada correctamente."
    }