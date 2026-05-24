"""
Servicio del mapa interactivo.

Contiene la lógica de negocio para:
- obtener mapa activo
- obtener layout por id
- actualizar imagen base del layout
- listar zonas
- crear zonas
- actualizar zonas
- actualizar posición
- cambiar estado
- asignar responsable o pedido
- liberar zonas
- actualizar datos comerciales
- eliminar zonas
"""

from pymongo.errors import DuplicateKeyError

from app.core.exceptions import (
    ConflictException,
    NotFoundException,
    UnprocessableEntityException
)
from app.maps.map_model import (
    MAP_LAYOUT_DEFAULT_ID,
    MAP_ZONE_STATUS_AVAILABLE,
    MAP_ZONE_STATUSES,
    MAP_ZONE_TYPES,
    create_map_occupancy_summary,
    create_map_zone_document,
    map_layout_document_to_response,
    map_zone_document_to_response
)
from app.maps.map_repository import (
    delete_map_zone_by_id,
    find_map_zone_by_id,
    find_map_zone_by_name,
    get_or_create_default_map_layout,
    insert_map_zone,
    list_default_layout_zones,
    list_map_zones,
    update_map_layout_background,
    update_map_zone_by_id
)
from app.maps.map_schema import (
    InteractiveMapResponse,
    MapLayoutResponse,
    MapOccupancySummaryResponse,
    MapZoneAssignmentRequest,
    MapZoneCreateRequest,
    MapZonePositionUpdateRequest,
    MapZoneResponse,
    MapZoneSalesUpdateRequest,
    MapZoneStatusUpdateRequest,
    MapZoneUpdateRequest
)


async def get_active_map() -> InteractiveMapResponse:
    """
    Obtiene el mapa activo completo.
    """
    layout_document = await get_or_create_default_map_layout()
    zones = await list_default_layout_zones()

    zone_responses = [
        map_zone_document_to_response(zone)
        for zone in zones
    ]

    layout = map_layout_document_to_response(
        layout=layout_document,
        zones=zone_responses
    )

    summary = create_map_occupancy_summary(zone_responses)

    return InteractiveMapResponse(
        layout=MapLayoutResponse(**layout),
        summary=MapOccupancySummaryResponse(**summary)
    )


async def get_map_layout(layout_id: str) -> MapLayoutResponse:
    """
    Obtiene un layout por id.

    En la versión actual solo existe el layout lógico por defecto.
    """
    if layout_id != MAP_LAYOUT_DEFAULT_ID:
        raise NotFoundException(
            message="Layout del mapa no encontrado."
        )

    active_map = await get_active_map()

    return active_map.layout


async def update_map_layout_background_image(
    layout_id: str,
    background_image_url: str
) -> MapLayoutResponse:
    """
    Actualiza la imagen base del layout del mapa.
    """
    if layout_id != MAP_LAYOUT_DEFAULT_ID:
        raise NotFoundException(
            message="Layout del mapa no encontrado."
        )

    await get_or_create_default_map_layout()

    updated_layout = await update_map_layout_background(
        layout_id=layout_id,
        background_image_url=background_image_url
    )

    if updated_layout is None:
        raise NotFoundException(
            message="Layout del mapa no encontrado."
        )

    zones = await list_default_layout_zones()

    zone_responses = [
        map_zone_document_to_response(zone)
        for zone in zones
    ]

    layout = map_layout_document_to_response(
        layout=updated_layout,
        zones=zone_responses
    )

    return MapLayoutResponse(**layout)


async def get_map_zones(
    search: str | None = None,
    status: str | None = None,
    zone_type: str | None = None,
    assigned_user_id: str | None = None,
    layout_id: str | None = None
) -> list[MapZoneResponse]:
    """
    Obtiene zonas del mapa con filtros opcionales.
    """
    if status and status not in MAP_ZONE_STATUSES:
        raise UnprocessableEntityException(
            message="Estado de zona inválido."
        )

    if zone_type and zone_type not in MAP_ZONE_TYPES:
        raise UnprocessableEntityException(
            message="Tipo de zona inválido."
        )

    zones = await list_map_zones(
        search=search,
        status=status,
        zone_type=zone_type,
        assigned_user_id=assigned_user_id,
        layout_id=layout_id
    )

    return [
        MapZoneResponse(**map_zone_document_to_response(zone))
        for zone in zones
    ]


async def get_map_zone(zone_id: str) -> MapZoneResponse:
    """
    Obtiene una zona del mapa por id.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(zone))


async def create_map_zone(
    payload: MapZoneCreateRequest
) -> MapZoneResponse:
    """
    Crea una nueva zona del mapa.
    """
    existing_zone = await find_map_zone_by_name(payload.name)

    if existing_zone is not None:
        raise ConflictException(
            message="Ya existe una zona con ese nombre."
        )

    zone_document = create_map_zone_document(
        name=payload.name.strip(),
        zone_type=payload.type,
        status=payload.status,
        x=payload.x,
        y=payload.y,
        width=payload.width,
        height=payload.height,
        color=payload.color,
        description=payload.description.strip(),
        layout_id=payload.layoutId or MAP_LAYOUT_DEFAULT_ID,
        capacity=payload.capacity,
        assigned_user_id=payload.assignedUserId,
        assigned_user_name=payload.assignedUserName,
        current_order_id=payload.currentOrderId,
        current_order_folio=payload.currentOrderFolio,
        current_order_total=payload.currentOrderTotal
    )

    try:
        created_zone = await insert_map_zone(zone_document)
    except DuplicateKeyError:
        raise ConflictException(
            message="Ya existe una zona con ese nombre."
        )

    return MapZoneResponse(**map_zone_document_to_response(created_zone))


async def update_map_zone(
    zone_id: str,
    payload: MapZoneUpdateRequest
) -> MapZoneResponse:
    """
    Actualiza una zona del mapa.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    existing_zone = await find_map_zone_by_name(payload.name)

    if (
        existing_zone is not None
        and str(existing_zone["_id"]) != zone_id
    ):
        raise ConflictException(
            message="Ya existe otra zona con ese nombre."
        )

    updated_zone = await update_map_zone_by_id(
        zone_id,
        {
            "layoutId": payload.layoutId or zone.get("layoutId", MAP_LAYOUT_DEFAULT_ID),
            "name": payload.name.strip(),
            "type": payload.type,
            "status": payload.status,
            "x": payload.x,
            "y": payload.y,
            "width": payload.width,
            "height": payload.height,
            "capacity": payload.capacity,
            "color": payload.color,
            "description": payload.description.strip(),
            "assignedUserId": payload.assignedUserId,
            "assignedUserName": payload.assignedUserName,
            "currentOrderId": payload.currentOrderId,
            "currentOrderFolio": payload.currentOrderFolio,
            "currentOrderTotal": payload.currentOrderTotal
        }
    )

    if updated_zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(updated_zone))


async def update_map_zone_position(
    zone_id: str,
    payload: MapZonePositionUpdateRequest
) -> MapZoneResponse:
    """
    Actualiza posición y tamaño visual de una zona.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    updated_zone = await update_map_zone_by_id(
        zone_id,
        {
            "x": payload.x,
            "y": payload.y,
            "width": payload.width,
            "height": payload.height
        }
    )

    if updated_zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(updated_zone))


async def update_map_zone_status(
    zone_id: str,
    payload: MapZoneStatusUpdateRequest
) -> MapZoneResponse:
    """
    Cambia únicamente el estado de una zona.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    updated_zone = await update_map_zone_by_id(
        zone_id,
        {
            "status": payload.status
        }
    )

    if updated_zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(updated_zone))


async def assign_map_zone(
    zone_id: str,
    payload: MapZoneAssignmentRequest
) -> MapZoneResponse:
    """
    Asigna o desasigna una zona a un usuario, responsable o pedido.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    updated_zone = await update_map_zone_by_id(
        zone_id,
        {
            "assignedUserId": payload.assignedUserId,
            "assignedUserName": payload.assignedUserName,
            "currentOrderId": payload.currentOrderId,
            "currentOrderFolio": payload.currentOrderFolio,
            "currentOrderTotal": payload.currentOrderTotal
        }
    )

    if updated_zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(updated_zone))


async def release_map_zone(zone_id: str) -> MapZoneResponse:
    """
    Libera una zona ocupada o reservada.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    updated_zone = await update_map_zone_by_id(
        zone_id,
        {
            "status": MAP_ZONE_STATUS_AVAILABLE,
            "currentOrderId": None,
            "currentOrderFolio": None,
            "currentOrderTotal": None
        }
    )

    if updated_zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(updated_zone))


async def update_map_zone_sales(
    zone_id: str,
    payload: MapZoneSalesUpdateRequest
) -> MapZoneResponse:
    """
    Actualiza datos comerciales agregados de una zona.
    """
    zone = await find_map_zone_by_id(zone_id)

    if zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    updated_zone = await update_map_zone_by_id(
        zone_id,
        {
            "totalSales": payload.totalSales,
            "totalOrders": payload.totalOrders
        }
    )

    if updated_zone is None:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )

    return MapZoneResponse(**map_zone_document_to_response(updated_zone))


async def delete_map_zone(zone_id: str) -> None:
    """
    Elimina una zona del mapa.
    """
    deleted = await delete_map_zone_by_id(zone_id)

    if not deleted:
        raise NotFoundException(
            message="Zona del mapa no encontrada."
        )