"""
Schemas de imágenes.

Este módulo define la respuesta que recibe Angular después de subir
una imagen al backend.
"""

from pydantic import BaseModel


class ImageUploadResponse(BaseModel):
    """
    Respuesta de carga de imagen.
    """

    fileName: str
    originalName: str
    contentType: str
    size: int
    imageUrl: str