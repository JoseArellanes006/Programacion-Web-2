import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cafeteria } from '../models/cafeteria.model';

/*
  Este servicio concentra la lógica principal del catálogo de cafeterías.

  Sus responsabilidades son:
  - comunicarse con el backend FastAPI
  - almacenar la lista original recibida del servidor
  - manejar el estado de búsqueda y filtrado
  - exponer una lista derivada ya filtrada para la interfaz
  - manejar estados auxiliares como carga y error

  La idea de centralizar esta lógica aquí es mantener los componentes
  más limpios y enfocados únicamente en la vista y la interacción.
*/
@Injectable({
  providedIn: 'root'
})
export class CafeteriasService {
  /*
    HttpClient permite realizar peticiones HTTP al backend.
    Se inyecta con inject() porque estamos trabajando con Angular moderno.
  */
  private http = inject(HttpClient);

  /*
    URL base del backend.

    IMPORTANTE:
    - No debe apuntar a localhost ni a 127.0.0.1 si quieres probar
      desde un celular.
    - Debe apuntar a la IP local de la computadora donde corre FastAPI.

    Ejemplo:
    http://192.168.7.76:8000/cafeterias

    Si tu IP cambia, también deberás actualizar esta ruta.
  */
  private apiUrl = 'http://192.168.7.76:8000/cafeterias';

  /*
    Signal privada que almacena la lista original tal como llega del backend.

    Se mantiene privada para que la modificación de datos esté controlada
    desde este mismo servicio.
  */
  private cafeteriasOriginales = signal<Cafeteria[]>([]);

  /*
    Texto ingresado por el usuario en el buscador.
    Se usa para aplicar filtrado reactivo en tiempo real.
  */
  textoBusqueda = signal<string>('');

  /*
    Categoría seleccionada por el usuario.
    También participa en el filtrado reactivo.
  */
  categoriaSeleccionada = signal<string>('');

  /*
    Estado que indica si actualmente se está realizando una petición
    al backend. Esto permite mostrar mensajes de carga en la interfaz.
  */
  cargando = signal<boolean>(false);

  /*
    Mensaje de error para mostrar en pantalla en caso de que falle
    la comunicación con el backend.
  */
  error = signal<string>('');

  /*
    computed() genera una lista derivada automáticamente.

    Esta lista no se llena manualmente; se recalcula sola cuando cambia:
    - la lista original
    - el texto de búsqueda
    - la categoría seleccionada

    Gracias a esto, la vista siempre muestra los datos correctos sin tener
    que escribir lógica adicional en los componentes.
  */
  cafeteriasFiltradas = computed(() => {
    const lista = this.cafeteriasOriginales();
    const texto = this.textoBusqueda().trim().toLowerCase();
    const categoria = this.categoriaSeleccionada().trim().toLowerCase();

    return lista.filter(cafeteria => {
      /*
        Se busca coincidencia de texto en varios campos para que
        la búsqueda sea más útil para el usuario.
      */
      const coincideTexto =
        texto === '' ||
        cafeteria.nombre.toLowerCase().includes(texto) ||
        cafeteria.ubicacion.toLowerCase().includes(texto) ||
        cafeteria.descripcion.toLowerCase().includes(texto);

      /*
        Se compara la categoría seleccionada con la categoría de la cafetería.
        Si no hay categoría seleccionada, todas pasan este filtro.
      */
      const coincideCategoria =
        categoria === '' ||
        cafeteria.categoria.toLowerCase() === categoria;

      return coincideTexto && coincideCategoria;
    });
  });

  /*
    Obtiene la lista completa de cafeterías desde el backend.

    Flujo:
    1. Activa el estado de carga
    2. Limpia errores previos
    3. Hace la petición HTTP
    4. Guarda los datos si todo sale bien
    5. Si falla, muestra mensaje de error
  */
  obtenerCafeterias(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<Cafeteria[]>(this.apiUrl).subscribe({
      next: (respuesta) => {
        this.cafeteriasOriginales.set(respuesta);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar las cafeterías.');
        this.cargando.set(false);
      }
    });
  }

  /*
    Obtiene una cafetería específica por su identificador.

    Este método no modifica directamente los signals del listado general,
    porque está pensado para la vista de detalle, donde se consulta
    una sola cafetería.
  */
  obtenerCafeteriaPorId(id: number) {
    return this.http.get<Cafeteria>(`${this.apiUrl}/${id}`);
  }

  /*
    Actualiza el texto de búsqueda.

    Al cambiar este signal, Angular recalcula automáticamente
    cafeteriasFiltradas.
  */
  actualizarBusqueda(texto: string): void {
    this.textoBusqueda.set(texto);
  }

  /*
    Actualiza la categoría seleccionada.

    Al cambiar este signal, Angular recalcula automáticamente
    cafeteriasFiltradas.
  */
  actualizarCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
  }

  /*
    Restablece los filtros al estado inicial.

    Este método es útil si después quieres añadir un botón
    como "Limpiar filtros" o "Mostrar todo".
  */
  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.categoriaSeleccionada.set('');
  }
}