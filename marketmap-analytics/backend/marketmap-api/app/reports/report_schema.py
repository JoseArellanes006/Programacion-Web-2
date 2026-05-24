"""
Schemas de reportes.

Define filtros y respuestas auxiliares para reportes.

Nota:
Los endpoints reales de descarga devuelven StreamingResponse,
por lo tanto estos schemas sirven como estructura auxiliar y documentación
interna del módulo.
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel


ReportFormat = Literal[
    "PDF",
    "EXCEL"
]

ReportType = Literal[
    "SALES",
    "PRODUCTS",
    "ORDERS"
]

ReportOrderStatus = Literal[
    "ALL",
    "PENDING",
    "PAID",
    "CANCELLED",
    "DELIVERED"
]


class ReportFilter(BaseModel):
    """
    Filtros generales para reportes.
    """

    startDate: datetime | None = None
    endDate: datetime | None = None
    category: str | None = None
    orderStatus: ReportOrderStatus | None = "ALL"
    search: str | None = None


class ReportFileResponse(BaseModel):
    """
    Respuesta descriptiva de reporte.

    Los endpoints de descarga devuelven archivos binarios.
    Este schema solamente documenta la estructura esperada si en algún momento
    se requiere devolver metadatos del archivo.
    """

    fileName: str
    contentType: str