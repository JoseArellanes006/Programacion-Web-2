"""
mensajes_data.py

Base de datos temporal de mensajes.

Los mensajes se conservan mientras el servidor está encendido.
Si uvicorn se reinicia, esta lista vuelve a iniciar vacía.
"""

from models.mensaje_model import Mensaje


mensajes_db: list[Mensaje] = []