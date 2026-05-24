"""
Utilidades para archivos.

Este archivo contiene funciones comunes para:
- crear carpetas
- generar nombres únicos
- obtener extensiones
- guardar archivos en disco
- borrar archivos locales
- construir URLs públicas

Se usa principalmente para imágenes, pero puede reutilizarse en reportes
o cualquier carga de archivos.
"""

from pathlib import Path
from uuid import uuid4


def ensure_directory_exists(directory: Path | str) -> Path:
    """
    Crea un directorio si no existe y devuelve su Path.
    """
    path = Path(directory)

    path.mkdir(
        parents=True,
        exist_ok=True
    )

    return path


def get_file_extension(filename: str) -> str:
    """
    Obtiene la extensión de un archivo.

    Si no hay extensión, devuelve string vacío.
    """
    return Path(filename).suffix.lower()


def generate_unique_filename(
    original_filename: str,
    default_extension: str = ""
) -> str:
    """
    Genera un nombre único conservando extensión.

    Ejemplo:
    producto.png -> 9f2a...c1.png
    """
    extension = get_file_extension(original_filename)

    if not extension:
        extension = default_extension

    return f"{uuid4().hex}{extension}"


def save_bytes_to_file(
    content: bytes,
    directory: Path | str,
    filename: str
) -> Path:
    """
    Guarda bytes en disco.
    """
    target_directory = ensure_directory_exists(directory)
    file_path = target_directory / filename

    file_path.write_bytes(content)

    return file_path


def delete_file_if_exists(file_path: Path | str) -> bool:
    """
    Elimina un archivo si existe.

    Devuelve True si se eliminó.
    Devuelve False si no existía.
    """
    path = Path(file_path)

    if not path.exists():
        return False

    if not path.is_file():
        return False

    path.unlink()

    return True


def build_public_file_url(
    public_prefix: str,
    filename: str
) -> str:
    """
    Construye una URL pública relativa.

    Ejemplo:
    public_prefix = /static/uploads/products
    filename = producto.png

    Resultado:
    /static/uploads/products/producto.png
    """
    clean_prefix = public_prefix.rstrip("/")
    clean_filename = filename.lstrip("/")

    return f"{clean_prefix}/{clean_filename}"