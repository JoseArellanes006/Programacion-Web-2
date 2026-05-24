/*
  Modelo genérico para respuestas del backend.

  Este modelo permite estandarizar la forma en que Angular interpreta
  las respuestas enviadas por FastAPI.

  La idea es que el backend pueda responder de forma consistente con:
  - success: indica si la operación fue correcta
  - message: mensaje general de la respuesta
  - data: información devuelta por el backend
  - errors: lista opcional de errores
*/

export interface ApiResponse<T> {
  /*
    Indica si la operación fue exitosa.

    Ejemplo:
    true  -> producto creado correctamente
    false -> error al crear producto
  */
  success: boolean;

  /*
    Mensaje descriptivo de la operación.

    Ejemplo:
    "Producto creado correctamente"
    "Credenciales inválidas"
  */
  message: string;

  /*
    Información principal devuelta por el backend.

    T permite que este modelo sea reutilizable.

    Ejemplo:
    ApiResponse<Product>
    ApiResponse<User>
    ApiResponse<Order[]>
  */
  data: T;

  /*
    Lista opcional de errores.

    Puede usarse para mostrar errores de validación,
    problemas del servidor o respuestas detalladas.
  */
  errors?: string[];
}

/*
  Modelo para respuestas paginadas.

  Se usará cuando el backend devuelva listas grandes de registros,
  por ejemplo:
  - productos
  - usuarios
  - pedidos
  - ventas
*/
export interface PaginatedResponse<T> {
  /*
    Lista de registros de la página actual.
  */
  items: T[];

  /*
    Total de registros existentes en la base de datos
    considerando los filtros aplicados.
  */
  totalItems: number;

  /*
    Página actual.
  */
  currentPage: number;

  /*
    Cantidad de registros por página.
  */
  pageSize: number;

  /*
    Total de páginas disponibles.
  */
  totalPages: number;

  /*
    Indica si existe una página siguiente.
  */
  hasNextPage: boolean;

  /*
    Indica si existe una página anterior.
  */
  hasPreviousPage: boolean;
}