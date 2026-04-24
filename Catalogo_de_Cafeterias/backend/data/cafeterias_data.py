from models.cafeteria_model import Cafeteria

"""
Este archivo simula una base de datos.

Por ahora se usa una lista en memoria para que el proyecto sea simple de explicar
y fácil de ejecutar en clase, sin depender todavía de una base de datos real.

Cada elemento de la lista es una instancia del modelo Cafeteria.
"""

cafeterias_db: list[Cafeteria] = [
    Cafeteria(
        id=1,
        nombre="Café Horizonte",
        descripcion="Cafetería de especialidad con ambiente tranquilo, ideal para leer o trabajar con una bebida caliente.",
        ubicacion="Centro",
        categoria="especialidad",
        horario="08:00 - 21:00",
        imagen="https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=80",
        calificacion=4.8
    ),
    Cafeteria(
        id=2,
        nombre="La Taza Artesanal",
        descripcion="Espacio acogedor con panes horneados, café artesanal y atención enfocada en una experiencia relajada.",
        ubicacion="Colonia Reforma",
        categoria="artesanal",
        horario="07:30 - 20:00",
        imagen="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
        calificacion=4.7
    ),
    Cafeteria(
        id=3,
        nombre="Bean & Work",
        descripcion="Cafetería tipo coworking con enchufes, internet estable y áreas cómodas para estudio o trabajo remoto.",
        ubicacion="Zona Universitaria",
        categoria="coworking",
        horario="08:00 - 22:00",
        imagen="https://images.unsplash.com/photo-1521017432531-fbd92d768814?auto=format&fit=crop&w=1200&q=80",
        calificacion=4.6
    ),
    Cafeteria(
        id=4,
        nombre="Café Luna",
        descripcion="Lugar temático con decoración distintiva, bebidas creativas y postres pensados para una experiencia visual.",
        ubicacion="Centro Histórico",
        categoria="tematica",
        horario="09:00 - 22:30",
        imagen="https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80",
        calificacion=4.5
    ),
    Cafeteria(
        id=5,
        nombre="Dulce Espresso",
        descripcion="Cafetería enfocada en bebidas frías, café clásico y una selección amplia de postres y repostería.",
        ubicacion="Colonia Jardín",
        categoria="postres",
        horario="10:00 - 21:30",
        imagen="https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
        calificacion=4.4
    ),
    Cafeteria(
        id=6,
        nombre="Origen Café",
        descripcion="Cafetería con selección de granos de distintas regiones, métodos filtrados y enfoque en calidad de extracción.",
        ubicacion="Zona Norte",
        categoria="especialidad",
        horario="08:00 - 20:30",
        imagen="https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1200&q=80",
        calificacion=4.9
    )
]