"""
Utilidades de fechas.

Este archivo centraliza operaciones comunes con fechas:
- fecha actual UTC
- inicio de día
- fin de día
- filtros de rango para MongoDB
- conversión segura a ISO string

Se usa en dashboard, reportes, pedidos y futuras estadísticas.
"""

from datetime import datetime, time, timezone


def utc_now() -> datetime:
    """
    Devuelve fecha actual en UTC.
    """
    return datetime.now(timezone.utc)


def start_of_day(value: datetime) -> datetime:
    """
    Devuelve el inicio del día de una fecha.
    """
    return datetime.combine(
        value.date(),
        time.min,
        tzinfo=value.tzinfo or timezone.utc
    )


def end_of_day(value: datetime) -> datetime:
    """
    Devuelve el final del día de una fecha.
    """
    return datetime.combine(
        value.date(),
        time.max,
        tzinfo=value.tzinfo or timezone.utc
    )


def normalize_date_range(
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> tuple[datetime | None, datetime | None]:
    """
    Normaliza un rango de fechas.

    start_date queda al inicio del día.
    end_date queda al final del día.
    """
    normalized_start = start_of_day(start_date) if start_date else None
    normalized_end = end_of_day(end_date) if end_date else None

    return normalized_start, normalized_end


def build_mongo_date_filter(
    field_name: str = "createdAt",
    start_date: datetime | None = None,
    end_date: datetime | None = None
) -> dict:
    """
    Construye un filtro de fecha para MongoDB.

    Ejemplo:
    {
        "createdAt": {
            "$gte": fecha_inicio,
            "$lte": fecha_fin
        }
    }
    """
    normalized_start, normalized_end = normalize_date_range(
        start_date=start_date,
        end_date=end_date
    )

    if not normalized_start and not normalized_end:
        return {}

    date_filter: dict = {}

    if normalized_start:
        date_filter["$gte"] = normalized_start

    if normalized_end:
        date_filter["$lte"] = normalized_end

    return {
        field_name: date_filter
    }


def datetime_to_iso(value: datetime | None) -> str | None:
    """
    Convierte datetime a string ISO.
    """
    if value is None:
        return None

    return value.isoformat()