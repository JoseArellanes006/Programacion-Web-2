from pydantic import BaseModel, Field


class Cafeteria(BaseModel):
    """
    Modelo principal de una cafetería.

    Este modelo define la forma exacta que tendrá cada cafetería dentro del backend
    y también la forma en que se enviará al frontend como respuesta JSON.

    Usar Pydantic permite:
    - validar tipos de datos
    - documentar automáticamente la API en /docs
    - mantener una estructura consistente
    """

    id: int = Field(..., description="Identificador único de la cafetería")
    nombre: str = Field(..., min_length=2, description="Nombre comercial de la cafetería")
    descripcion: str = Field(..., min_length=10, description="Descripción breve de la cafetería")
    ubicacion: str = Field(..., min_length=3, description="Ubicación o zona donde se encuentra")
    categoria: str = Field(..., description="Tipo de cafetería, por ejemplo: artesanal, coworking, temática")
    horario: str = Field(..., description="Horario de atención")
    imagen: str = Field(..., description="URL de la imagen principal")
    calificacion: float = Field(..., ge=0, le=5, description="Calificación promedio de 0 a 5")