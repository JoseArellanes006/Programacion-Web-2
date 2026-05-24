"""
Rutas de imágenes.

Endpoints:
- POST /images/upload
- POST /images/upload/map

El frontend puede usar estos endpoints para subir imágenes de productos
o imágenes base para el mapa.
"""

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.core.permissions import can_manage_map, can_manage_products
from app.images.image_schema import ImageUploadResponse
from app.images.image_service import upload_map_image, upload_product_image


router = APIRouter(
    prefix="/images",
    tags=["Images"]
)


@router.post(
    "/upload",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(can_manage_products)]
)
async def upload_image_endpoint(
    file: UploadFile = File(...)
):
    """
    Sube una imagen de producto.
    """
    return await upload_product_image(file)


@router.post(
    "/upload/map",
    response_model=ImageUploadResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(can_manage_map)]
)
async def upload_map_image_endpoint(
    file: UploadFile = File(...)
):
    """
    Sube una imagen base para el mapa.
    """
    return await upload_map_image(file)