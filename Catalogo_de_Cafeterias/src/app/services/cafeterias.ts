import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cafeteria } from '../models/cafeteria.model';

/*
  Este servicio centraliza la lógica principal del catálogo.

  Aquí se maneja:
  - la comunicación con el backend
  - la lista original de cafeterías
  - el texto de búsqueda
  - el filtro por categoría
  - los estados de carga y error

  La intención es que los componentes visuales sean más simples
  y que la lógica de datos viva en un solo lugar.
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

    Angular consume directamente el backend FastAPI en local.
  */
  private apiUrl = 'http://127.0.0.1:8000/api/cafeterias';

  /*
    Signal privada que guarda la lista original recibida del backend.
    Se mantiene privada para controlar mejor su modificación.
  */
  private cafeteriasOriginales = signal<Cafeteria[]>([]);

  /*
    Texto ingresado en el buscador.
    Se usa para filtrar la lista de forma reactiva.
  */
  textoBusqueda = signal<string>('');

  /*
    Categoría actualmente seleccionada en el filtro.
  */
  categoriaSeleccionada = signal<string>('');

  /*
    Estado que indica si se está realizando una petición al backend.
    Sirve para mostrar mensajes o indicadores de carga en la interfaz.
  */
  cargando = signal<boolean>(false);

  /*
    Mensaje de error en caso de que falle la petición.
  */
  error = signal<string>('');

  /*
    Lista derivada que se recalcula automáticamente cuando cambia:
    - la lista original
    - el texto de búsqueda
    - la categoría seleccionada
  */
  cafeteriasFiltradas = computed(() => {
    const lista = this.cafeteriasOriginales();
    const texto = this.textoBusqueda().trim().toLowerCase();
    const categoria = this.categoriaSeleccionada().trim().toLowerCase();

    return lista.filter(cafeteria => {
      const coincideTexto =
        texto === '' ||
        cafeteria.nombre.toLowerCase().includes(texto) ||
        cafeteria.ubicacion.toLowerCase().includes(texto) ||
        cafeteria.descripcion.toLowerCase().includes(texto);

      const coincideCategoria =
        categoria === '' ||
        cafeteria.categoria.toLowerCase() === categoria;

      return coincideTexto && coincideCategoria;
    });
  });

  /*
    Carga todas las cafeterías desde el backend.
  */
  obtenerCafeterias(): void {
    this.cargando.set(true);
    this.error.set('');

    this.http.get<Cafeteria[]>(this.apiUrl).subscribe({
      next: (respuesta) => {
        this.cafeteriasOriginales.set(respuesta);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error(err);
        this.error.set('No fue posible cargar las cafeterías.');
        this.cargando.set(false);
      }
    });
  }

  /*
    Obtiene una cafetería específica según su ID.
  */
  obtenerCafeteriaPorId(id: number) {
    return this.http.get<Cafeteria>(`${this.apiUrl}/${id}`);
  }

  /*
    Actualiza el texto de búsqueda.
  */
  actualizarBusqueda(texto: string): void {
    this.textoBusqueda.set(texto);
  }

  /*
    Actualiza la categoría seleccionada.
  */
  actualizarCategoria(categoria: string): void {
    this.categoriaSeleccionada.set(categoria);
  }

  /*
    Limpia búsqueda y filtro de categoría.
  */
  limpiarFiltros(): void {
    this.textoBusqueda.set('');
    this.categoriaSeleccionada.set('');
  }
}