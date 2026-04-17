import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contacto, ContactoCreate } from '../models/contacto';

/**
 * ==========================================================
 * SERVICIO DE CONTACTOS
 * ==========================================================
 *
 * Este servicio tiene dos responsabilidades principales:
 *
 * 1. Consumir el backend FastAPI mediante HttpClient
 * 2. Mantener el estado reactivo del frontend con signals
 *
 * Esto lo vuelve ideal para explicar en clase la relación entre:
 *
 * - publicación de servicios web (backend)
 * - consumo de servicios web (frontend)
 * - estado reactivo en Angular
 *
 * El backend publica rutas como:
 * - GET /contactos/
 * - POST /contactos/
 * - PUT /contactos/{id}
 * - DELETE /contactos/{id}
 *
 * Y este servicio se encarga de consumirlas.
 */
@Injectable({
  providedIn: 'root'
})
export class ContactosService {

  /**
   * ----------------------------------------------------------
   * HttpClient
   * ----------------------------------------------------------
   *
   * HttpClient es la herramienta de Angular para realizar
   * peticiones HTTP a un backend.
   *
   * Gracias a esta dependencia podemos hacer:
   * - GET para consultar
   * - POST para crear
   * - PUT para actualizar
   * - DELETE para eliminar
   */
  private http = inject(HttpClient);

  /**
   * ----------------------------------------------------------
   * URL base del backend
   * ----------------------------------------------------------
   *
   * Aquí definimos la ruta base del recurso contactos.
   *
   * Como FastAPI está corriendo en:
   * http://127.0.0.1:8000
   *
   * Y las rutas están publicadas bajo:
   * /contactos
   *
   * Entonces esta será la base para todas las peticiones.
   */
  private readonly apiUrl = 'http://127.0.0.1:8000/contactos';

  /**
   * ----------------------------------------------------------
   * Signal principal del estado
   * ----------------------------------------------------------
   *
   * Este signal guarda la lista de contactos cargados desde el backend.
   *
   * Aquí está el estado fuente principal de la aplicación.
   *
   * ¿Qué significa que sea un signal?
   * Que Angular puede reaccionar automáticamente cuando cambie.
   *
   * Por ejemplo:
   * - si llegan contactos del backend
   * - si agregamos uno nuevo
   * - si eliminamos uno
   *
   * entonces la vista se actualizará sola.
   */
  private contactosSignal = signal<Contacto[]>([]);

  /**
   * Exponemos el signal de contactos como solo lectura.
   *
   * Esto permite que otros componentes consulten los datos,
   * pero evita que los modifiquen directamente.
   *
   * Es una buena práctica porque centraliza los cambios
   * dentro del servicio.
   */
  contactos = this.contactosSignal.asReadonly();

  /**
   * ----------------------------------------------------------
   * Signal para búsqueda
   * ----------------------------------------------------------
   *
   * Este signal guarda el texto que el usuario escribe
   * en el buscador.
   *
   * No representa una lista de datos, sino un criterio
   * de filtrado.
   */
  private textoBusquedaSignal = signal<string>('');

  /**
   * Exposición de solo lectura del texto de búsqueda.
   */
  textoBusqueda = this.textoBusquedaSignal.asReadonly();

  /**
   * ----------------------------------------------------------
   * Signal de carga
   * ----------------------------------------------------------
   *
   * Sirve para indicar si en este momento el frontend
   * está esperando respuesta del backend.
   *
   * Esto permite mostrar mensajes como:
   * "Cargando contactos..."
   */
  private cargandoSignal = signal<boolean>(false);
  cargando = this.cargandoSignal.asReadonly();

  /**
   * ----------------------------------------------------------
   * Signal de error
   * ----------------------------------------------------------
   *
   * Si ocurre un problema en una petición HTTP,
   * aquí guardamos un mensaje de error.
   *
   * Así los componentes pueden mostrarlo en pantalla.
   */
  private errorSignal = signal<string>('');
  error = this.errorSignal.asReadonly();

  /**
   * ----------------------------------------------------------
   * Computed: contactosFiltrados
   * ----------------------------------------------------------
   *
   * computed representa un valor DERIVADO.
   *
   * No guarda un estado independiente; en lugar de eso,
   * calcula un resultado a partir de otros signals.
   *
   * En este caso depende de:
   * - contactosSignal
   * - textoBusquedaSignal
   *
   * Cada vez que cambie la lista de contactos
   * o cambie el texto de búsqueda,
   * Angular recalculará automáticamente esta lista filtrada.
   *
   * Esta es una idea muy importante para explicar:
   *
   * - signal = estado base
   * - computed = estado derivado
   */
  contactosFiltrados = computed(() => {
    const texto = this.textoBusquedaSignal().trim().toLowerCase();

    /**
     * Si no hay texto de búsqueda,
     * devolvemos toda la lista sin filtrar.
     */
    if (!texto) {
      return this.contactosSignal();
    }

    /**
     * Si sí hay texto, filtramos por:
     * - nombre
     * - teléfono
     * - correo
     */
    return this.contactosSignal().filter(contacto =>
      contacto.nombre.toLowerCase().includes(texto) ||
      contacto.telefono.toLowerCase().includes(texto) ||
      contacto.correo.toLowerCase().includes(texto)
    );
  });

  /**
   * ----------------------------------------------------------
   * Computed: totalContactos
   * ----------------------------------------------------------
   *
   * Este valor derivado calcula cuántos contactos
   * hay actualmente cargados.
   *
   * También se actualiza automáticamente cuando cambia
   * la lista principal.
   */
  totalContactos = computed(() => this.contactosSignal().length);

  /**
   * ----------------------------------------------------------
   * cargarContactos()
   * ----------------------------------------------------------
   *
   * Hace la carga inicial de contactos desde el backend.
   *
   * Flujo:
   * 1. activamos estado de carga
   * 2. limpiamos errores previos
   * 3. hacemos GET al backend
   * 4. si todo sale bien, guardamos la respuesta
   * 5. si falla, guardamos mensaje de error
   */
  cargarContactos(): void {
    this.cargandoSignal.set(true);
    this.errorSignal.set('');

    this.http.get<Contacto[]>(`${this.apiUrl}/`).subscribe({
      next: (respuesta) => {
        /**
         * Si la petición fue exitosa,
         * reemplazamos completamente la lista local
         * con la que devolvió el backend.
         */
        this.contactosSignal.set(respuesta);
        this.cargandoSignal.set(false);
      },
      error: () => {
        /**
         * Si ocurre un error, almacenamos un mensaje
         * para que el componente lo pueda mostrar.
         */
        this.errorSignal.set('No se pudieron cargar los contactos desde el servidor.');
        this.cargandoSignal.set(false);
      }
    });
  }

  /**
   * ----------------------------------------------------------
   * actualizarTextoBusqueda()
   * ----------------------------------------------------------
   *
   * Cambia el valor del signal de búsqueda.
   *
   * En cuanto cambia este signal,
   * el computed contactosFiltrados se recalcula solo.
   */
  actualizarTextoBusqueda(texto: string): void {
    this.textoBusquedaSignal.set(texto);
  }

  /**
   * ----------------------------------------------------------
   * agregar()
   * ----------------------------------------------------------
   *
   * Crea un nuevo contacto en el backend.
   *
   * Recibe un ContactoCreate, no un Contacto completo,
   * porque al crear todavía no existe id.
   *
   * Muy importante:
   * aquí el frontend NO genera el id.
   * El backend es quien recibe los datos, crea el registro
   * y devuelve un Contacto completo ya con su id.
   *
   * Si la operación es exitosa:
   * - el backend responde con el nuevo contacto
   * - lo agregamos al signal local
   * - la vista se actualiza automáticamente
   */
  agregar(datos: ContactoCreate): void {
    this.errorSignal.set('');

    this.http.post<Contacto>(`${this.apiUrl}/`, datos).subscribe({
      next: (contactoCreado) => {
        /**
         * update() toma el valor actual del signal
         * y devuelve uno nuevo.
         *
         * Aquí construimos una nueva lista agregando
         * el contacto devuelto por el backend.
         */
        this.contactosSignal.update(listaActual => [...listaActual, contactoCreado]);
      },
      error: () => {
        this.errorSignal.set('No se pudo guardar el contacto.');
      }
    });
  }

  /**
   * ----------------------------------------------------------
   * actualizar()
   * ----------------------------------------------------------
   *
   * Actualiza un contacto existente en el backend.
   *
   * El id viaja en la URL:
   * PUT /contactos/{id}
   *
   * Los demás datos viajan en el body.
   *
   * Si el backend responde correctamente,
   * reemplazamos en el signal local el contacto anterior
   * por el contacto actualizado.
   */
  actualizar(id: number, datos: ContactoCreate): void {
    this.errorSignal.set('');

    this.http.put<Contacto>(`${this.apiUrl}/${id}`, datos).subscribe({
      next: (contactoActualizado) => {
        this.contactosSignal.update(listaActual =>
          listaActual.map(contacto =>
            contacto.id === id ? contactoActualizado : contacto
          )
        );
      },
      error: () => {
        this.errorSignal.set('No se pudo actualizar el contacto.');
      }
    });
  }

  /**
   * ----------------------------------------------------------
   * eliminar()
   * ----------------------------------------------------------
   *
   * Elimina un contacto en el backend.
   *
   * Si el backend confirma la eliminación,
   * entonces quitamos ese contacto del estado local.
   */
  eliminar(id: number): void {
    this.errorSignal.set('');

    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => {
        this.contactosSignal.update(listaActual =>
          listaActual.filter(contacto => contacto.id !== id)
        );
      },
      error: () => {
        this.errorSignal.set('No se pudo eliminar el contacto.');
      }
    });
  }

  /**
   * ----------------------------------------------------------
   * obtenerPorId()
   * ----------------------------------------------------------
   *
   * Busca un contacto dentro del estado local ya cargado.
   *
   * Este método NO consulta al backend;
   * simplemente revisa la lista que ya existe en memoria
   * dentro del frontend.
   *
   * Puede servir después para:
   * - edición
   * - detalle
   * - selección de un contacto
   */
  obtenerPorId(id: number): Contacto | undefined {
    return this.contactosSignal().find(contacto => contacto.id === id);
  }
}