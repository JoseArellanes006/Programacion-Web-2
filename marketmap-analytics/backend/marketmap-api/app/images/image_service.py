"""
Servicio de imágenes.

Responsabilidades:
- validar tipo de archivo
- validar tamaño
- validar extensión
- generar nombre único
- guardar archivo en disco
- registrar metadatos en MongoDB
- devolver URL pública al frontend

Este bloque usa almacenamiento local para desarrollo.
En producción podría reemplazarse por S3, Cloud Storage o similar.
"""

from pathlib import Path

from fastapi import UploadFile

from app.common.file_utils import (
    build_public_file_url,
    generate_unique_filename,
    save_bytes_to_file
)
from app.core.exceptions import BadRequestException
from app.images.image_repository import insert_image_metadata
from app.images.image_schema import ImageUploadResponse


PRODUCT_UPLOAD_ROOT = Path("app/static/uploads/products")
PRODUCT_PUBLIC_URL_PREFIX = "/static/uploads/products"

MAP_UPLOAD_ROOT = Path("app/static/uploads/maps")
MAP_PUBLIC_URL_PREFIX = "/static/uploads/maps"

ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
]

ALLOWED_IMAGE_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
]

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def validate_image_content_type(content_type: str | None) -> None:
    """
    Valida el tipo MIME de la imagen.
    """
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise BadRequestException(
            message="Tipo de imagen no permitido.",
            detail="Solo se permiten imágenes JPEG, PNG o WEBP."
        )


def validate_image_extension(filename: str) -> None:
    """
    Valida la extensión del archivo.
    """
    clean_filename = filename.lower().strip()

    if not any(
        clean_filename.endswith(extension)
        for extension in ALLOWED_IMAGE_EXTENSIONS
    ):
        raise BadRequestException(
            message="Extensión de imagen no permitida.",
            detail="Solo se permiten archivos .jpg, .jpeg, .png o .webp."
        )


def validate_image_size(size: int) -> None:
    """
    Valida el tamaño máximo de imagen.
    """
    if size > MAX_IMAGE_SIZE_BYTES:
        raise BadRequestException(
            message="La imagen excede el tamaño máximo permitido.",
            detail="El tamaño máximo permitido es de 5 MB."
        )


async def upload_image_to_local_storage(
    file: UploadFile,
    upload_root: Path,
    public_url_prefix: str
) -> ImageUploadResponse:
    """
    Sube una imagen a una carpeta local y registra metadatos.
    """
    original_filename = file.filename or "image.jpg"

    validate_image_content_type(file.content_type)
    validate_image_extension(original_filename)

    content = await file.read()

    size = len(content)

    validate_image_size(size)

    generated_name = generate_unique_filename(
        original_filename=original_filename,
        default_extension=".jpg"
    )

    save_bytes_to_file(
        content=content,
        directory=upload_root,
        filename=generated_name
    )

    image_url = build_public_file_url(
        public_prefix=public_url_prefix,
        filename=generated_name
    )

    await insert_image_metadata(
        file_name=generated_name,
        original_name=original_filename,
        content_type=file.content_type or "application/octet-stream",
        size=size,
        image_url=image_url
    )

    return ImageUploadResponse(
        fileName=generated_name,
        originalName=original_filename,
        contentType=file.content_type or "application/octet-stream",
        size=size,
        imageUrl=image_url
    )


async def upload_product_image(file: UploadFile) -> ImageUploadResponse:
    """
    Sube una imagen de producto.
    """
    return await upload_image_to_local_storage(
        file=file,
        upload_root=PRODUCT_UPLOAD_ROOT,
        public_url_prefix=PRODUCT_PUBLIC_URL_PREFIX
    )


async def upload_map_image(file: UploadFile) -> ImageUploadResponse:
    """
    Sube una imagen base para el mapa.
    """
    return await upload_image_to_local_storage(
        file=file,
        upload_root=MAP_UPLOAD_ROOT,
        public_url_prefix=MAP_PUBLIC_URL_PREFIX
    )