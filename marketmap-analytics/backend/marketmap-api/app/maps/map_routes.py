"""
Rutas del mapa interactivo.

Endpoints:
- GET /maps/active
- GET /maps/layouts/{layout_id}
- POST /maps/layouts/{layout_id}/background
- GET /maps/zones
- GET /maps/zones/{zone_id}
- POST /maps/zones
- PUT /maps/zones/{zone_id}
- PATCH /maps/zones/{zone_id}/position
- PATCH /maps/zones/{zone_id}/status
- PATCH /maps/zones/{zone_id}/assign
- PATCH /maps/zones/{zone_id}/release
- PATCH /maps/zones/{zone_id}/sales
- DELETE /maps/zones/{zone_id}
"""

from fastapi import APIRouter, Depends, File, Query, UploadFile, status

from app.core.permissions import (
    can_manage_map,
    require_authenticated_user
)
from app.images.image_service import upload_map_image
from app.maps.map_schema import (
    InteractiveMapResponse,
    MapLayoutResponse,
    MapZoneAssignmentRequest,
    MapZoneCreateRequest,
    MapZonePositionUpdateRequest,
    MapZoneResponse,
    MapZoneSalesUpdateRequest,
    MapZoneStatusUpdateRequest,
    MapZoneUpdateRequest
)
from app.maps.map_service import (
    assign_map_zone,
    create_map_zone,
    delete_map_zone,
    get_active_map,
    get_map_layout,
    get_map_zone,
    get_map_zones,
    release_map_zone,
    update_map_layout_background_image,
    update_map_zone,
    update_map_zone_position,
    update_map_zone_sales,
    update_map_zone_status
)


router = APIRouter(
    prefix="/maps",
    tags=["Maps"]
)


@router.get(
    "/active",
    response_model=InteractiveMapResponse,
    dependencies=[Depends(require_authenticated_user)]
)
async def active_map_endpoint():
    """
    Obtiene el mapa activo completo.
    """
    return await get_active_map()


@router.get(
    "/layouts/{layout_id}",
    response_model=MapLayoutResponse,
    dependencies=[Depends(require_authenticated_user)]
)
async def get_map_layout_endpoint(layout_id: str):
    """
    Obtiene un layout por id.
    """
    return await get_map_layout(layout_id)


@router.post(
    "/layouts/{layout_id}/background",
    response_model=MapLayoutResponse,
    dependencies=[Depends(can_manage_map)]
)
async def upload_map_layout_background_endpoint(
    layout_id: str,
    file: UploadFile = File(...)
):
    """
    Sube imagen base del mapa y actualiza el layout.
    """
    uploaded_image = await upload_map_image(file)

    return await update_map_layout_background_image(
        layout_id=layout_id,
        background_image_url=uploaded_image.imageUrl
    )


@router.get(
    "/zones",
    response_model=list[MapZoneResponse],
    dependencies=[Depends(require_authenticated_user)]
)
async def list_map_zones_endpoint(
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    type: str | None = Query(default=None),
    assignedUserId: str | None = Query(default=None),
    layoutId: str | None = Query(default=None)
):
    """
    Lista zonas del mapa con filtros opcionales.
    """
    return await get_map_zones(
        search=search,
        status=status,
        zone_type=type,
        assigned_user_id=assignedUserId,
        layout_id=layoutId
    )


@router.get(
    "/zones/{zone_id}",
    response_model=MapZoneResponse,
    dependencies=[Depends(require_authenticated_user)]
)
async def get_map_zone_endpoint(zone_id: str):
    """
    Obtiene una zona por id.
    """
    return await get_map_zone(zone_id)


@router.post(
    "/zones",
    response_model=MapZoneResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(can_manage_map)]
)
async def create_map_zone_endpoint(payload: MapZoneCreateRequest):
    """
    Crea una zona del mapa.
    """
    return await create_map_zone(payload)


@router.put(
    "/zones/{zone_id}",
    response_model=MapZoneResponse,
    dependencies=[Depends(can_manage_map)]
)
async def update_map_zone_endpoint(
    zone_id: str,
    payload: MapZoneUpdateRequest
):
    """
    Actualiza una zona del mapa.
    """
    return await update_map_zone(
        zone_id=zone_id,
        payload=payload
    )


@router.patch(
    "/zones/{zone_id}/position",
    response_model=MapZoneResponse,
    dependencies=[Depends(can_manage_map)]
)
async def update_map_zone_position_endpoint(
    zone_id: str,
    payload: MapZonePositionUpdateRequest
):
    """
    Actualiza posición y tamaño visual de una zona.
    """
    return await update_map_zone_position(
        zone_id=zone_id,
        payload=payload
    )


@router.patch(
    "/zones/{zone_id}/status",
    response_model=MapZoneResponse,
    dependencies=[Depends(can_manage_map)]
)
async def update_map_zone_status_endpoint(
    zone_id: str,
    payload: MapZoneStatusUpdateRequest
):
    """
    Cambia estado de una zona.
    """
    return await update_map_zone_status(
        zone_id=zone_id,
        payload=payload
    )


@router.patch(
    "/zones/{zone_id}/assign",
    response_model=MapZoneResponse,
    dependencies=[Depends(can_manage_map)]
)
async def assign_map_zone_endpoint(
    zone_id: str,
    payload: MapZoneAssignmentRequest
):
    """
    Asigna o desasigna una zona.
    """
    return await assign_map_zone(
        zone_id=zone_id,
        payload=payload
    )


@router.patch(
    "/zones/{zone_id}/release",
    response_model=MapZoneResponse,
    dependencies=[Depends(can_manage_map)]
)
async def release_map_zone_endpoint(zone_id: str):
    """
    Libera una zona.
    """
    return await release_map_zone(zone_id)


@router.patch(
    "/zones/{zone_id}/sales",
    response_model=MapZoneResponse,
    dependencies=[Depends(can_manage_map)]
)
async def update_map_zone_sales_endpoint(
    zone_id: str,
    payload: MapZoneSalesUpdateRequest
):
    """
    Actualiza métricas comerciales de una zona.
    """
    return await update_map_zone_sales(
        zone_id=zone_id,
        payload=payload
    )


@router.delete(
    "/zones/{zone_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(can_manage_map)]
)
async def delete_map_zone_endpoint(zone_id: str):
    """
    Elimina una zona del mapa.
    """
    await delete_map_zone(zone_id)
    return None