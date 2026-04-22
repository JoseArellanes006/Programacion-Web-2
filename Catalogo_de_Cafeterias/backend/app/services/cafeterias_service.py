from app.data.cafeterias_data import cafeterias_db
from app.models.cafeteria_model import Cafeteria


class CafeteriasService:
    """
    Esta clase concentra la lógica del negocio.

    Su responsabilidad es trabajar con los datos:
    - listar cafeterías
    - buscar por id
    - filtrar por categoría
    - buscar por texto

    La ventaja de separar esta capa es que después puedes cambiar la fuente de datos
    (por ejemplo, una base de datos real) sin modificar las rutas ni los controladores.
    """

    @staticmethod
    def obtener_todas() -> list[Cafeteria]:
        """
        Devuelve la lista completa de cafeterías.
        """
        return cafeterias_db

    @staticmethod
    def obtener_por_id(cafeteria_id: int) -> Cafeteria | None:
        """
        Busca una cafetería por su ID.
        Si existe, la devuelve.
        Si no existe, devuelve None.
        """
        for cafeteria in cafeterias_db:
            if cafeteria.id == cafeteria_id:
                return cafeteria
        return None

    @staticmethod
    def filtrar_por_categoria(categoria: str) -> list[Cafeteria]:
        """
        Filtra cafeterías por categoría.

        La comparación se hace en minúsculas para evitar problemas por mayúsculas
        o minúsculas enviadas desde el frontend.
        """
        categoria = categoria.strip().lower()

        return [
            cafeteria
            for cafeteria in cafeterias_db
            if cafeteria.categoria.strip().lower() == categoria
        ]

    @staticmethod
    def buscar_por_texto(texto: str) -> list[Cafeteria]:
        """
        Realiza una búsqueda simple por texto dentro de varios campos:
        - nombre
        - descripción
        - ubicación
        - categoría

        Esto permite que el frontend use un solo endpoint de búsqueda general.
        """
        texto = texto.strip().lower()

        return [
            cafeteria
            for cafeteria in cafeterias_db
            if texto in cafeteria.nombre.lower()
            or texto in cafeteria.descripcion.lower()
            or texto in cafeteria.ubicacion.lower()
            or texto in cafeteria.categoria.lower()
        ]