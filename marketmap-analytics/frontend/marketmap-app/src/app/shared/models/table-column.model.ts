/*
  Modelos para construir tablas dinámicas.

  La tabla dinámica usará esta configuración para saber:
  - qué columnas mostrar
  - qué etiqueta tendrá cada columna
  - qué tipo de dato contiene
  - si permite ordenar o filtrar
  - si debe mostrarse como texto, moneda, fecha, imagen, estado, booleano o acciones
*/

/*
  Tipos permitidos para una columna de tabla.
*/
export type TableColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'image'
  | 'status'
  | 'boolean'
  | 'actions';

/*
  Alineación permitida dentro de una celda.
*/
export type TableColumnAlign =
  | 'left'
  | 'center'
  | 'right';

/*
  Dirección de ordenamiento.
*/
export type TableSortDirection =
  | 'asc'
  | 'desc';

/*
  Configuración de una acción dentro de la tabla.

  Ejemplos de acciones:
  - editar
  - eliminar
  - ver detalle
  - exportar
  - cambiar estado
*/
export interface TableAction<T = unknown> {
  /*
    Identificador interno de la acción.

    Ejemplo:
    "edit"
    "delete"
    "view"
  */
  key: string;

  /*
    Texto visible para el usuario.
  */
  label: string;

  /*
    Nombre opcional de ícono de Angular Material.

    Ejemplos:
    - edit
    - delete
    - visibility
    - cancel
    - check_circle
  */
  icon?: string;

  /*
    Tooltip opcional.

    Si no se define, se usa label.
  */
  tooltip?: string;

  /*
    Define si la acción es peligrosa.

    Ejemplo:
    eliminar un producto puede marcarse como danger.
  */
  danger?: boolean;

  /*
    Define si la acción debe mostrarse como botón principal.
  */
  primary?: boolean;

  /*
    Función opcional para decidir si una acción debe mostrarse
    en una fila específica.

    Ejemplo:
    mostrar "Cancelar pedido" solo si el pedido está pendiente.
  */
  visible?: (row: T) => boolean;

  /*
    Función opcional para decidir si la acción está deshabilitada.
  */
  disabled?: (row: T) => boolean;
}

/*
  Configuración de una columna de tabla dinámica.
*/
export interface TableColumn<T = unknown> {
  /*
    Nombre del campo dentro del objeto.

    Ejemplo:
    Si el producto tiene:
    {
      name: 'Café americano',
      price: 45
    }

    entonces el key puede ser:
    "name" o "price"
  */
  key: keyof T | string;

  /*
    Etiqueta visible en el encabezado de la tabla.
  */
  label: string;

  /*
    Tipo de dato que mostrará la columna.
  */
  type: TableColumnType;

  /*
    Define si la columna permite ordenar.
  */
  sortable?: boolean;

  /*
    Define si la columna permite filtrar.
  */
  filterable?: boolean;

  /*
    Define si la columna debe ocultarse en pantallas pequeñas.
  */
  hideOnMobile?: boolean;

  /*
    Ancho opcional de la columna.

    Ejemplo:
    "120px"
    "20%"
  */
  width?: string;

  /*
    Alineación del contenido de la columna.
  */
  align?: TableColumnAlign;

  /*
    Acciones disponibles cuando la columna es de tipo "actions".
  */
  actions?: TableAction<T>[];

  /*
    Función opcional para transformar el valor antes de mostrarlo.

    Ejemplo:
    convertir "ACTIVE" a "Activo".
  */
  formatter?: (value: unknown, row: T) => string;
}

/*
  Evento emitido por la tabla dinámica cuando el usuario ejecuta una acción.

  Ejemplo:
  Al hacer clic en "Editar", la tabla puede emitir:
  {
    action: 'edit',
    row: productoSeleccionado
  }
*/
export interface TableActionEvent<T = unknown> {
  action: string;
  row: T;
}

/*
  Estado de paginación de una tabla.
*/
export interface TablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
}