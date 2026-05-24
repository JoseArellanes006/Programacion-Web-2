/*
  Modelos para construir diálogos dinámicos.

  Un diálogo dinámico permitirá crear formularios reutilizables para:
  - productos
  - usuarios
  - pedidos
  - categorías
  - zonas del mapa
  - filtros de reportes

  En lugar de crear un formulario manual para cada módulo, se define
  una lista de campos y el componente dynamic-dialog se encargará
  de renderizarlos.

  Este archivo no consulta directamente al backend.
  Solamente define la estructura que usarán los componentes y servicios.
*/

/*
  Tipos de campo permitidos dentro del diálogo dinámico.
*/
export type DialogFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'date'
  | 'checkbox'
  | 'file'
  | 'hidden';

/*
  Métodos HTTP que un diálogo podría describir para integraciones futuras.

  No significa que el diálogo deba ejecutar HTTP directamente.
  Se incluye para poder documentar intención o delegarla a servicios.
*/
export type DialogSubmitMethod =
  | 'POST'
  | 'PUT'
  | 'PATCH';

/*
  Opción para campos tipo select.

  Ejemplo:
  {
    label: 'Administrador',
    value: 'ADMIN'
  }
*/
export interface DialogSelectOption {
  /*
    Texto visible para el usuario.
  */
  label: string;

  /*
    Valor real que se enviará al formulario o al backend.
  */
  value: string | number | boolean;
}

/*
  Regla de validación de un campo.

  Este modelo sirve para configurar validaciones de manera genérica.
*/
export interface DialogFieldValidation {
  /*
    Indica si el campo es obligatorio.
  */
  required?: boolean;

  /*
    Longitud mínima para textos.
  */
  minLength?: number;

  /*
    Longitud máxima para textos.
  */
  maxLength?: number;

  /*
    Valor mínimo para campos numéricos.
  */
  min?: number;

  /*
    Valor máximo para campos numéricos.
  */
  max?: number;

  /*
    Expresión regular opcional para validar el campo.
  */
  pattern?: RegExp;

  /*
    Mensaje personalizado para mostrar si la validación falla.
  */
  message?: string;
}

/*
  Regla para mostrar u ocultar un campo según otro campo.

  Ejemplo:
  {
    key: 'imageFile',
    visibleWhen: {
      fieldKey: 'imageSource',
      equals: 'FILE'
    }
  }

  Con eso, imageFile solo se muestra cuando imageSource sea FILE.
*/
export interface DialogFieldVisibilityCondition {
  /*
    Campo del cual depende la visibilidad.
  */
  fieldKey: string;

  /*
    Valor requerido para mostrar el campo.
  */
  equals: unknown;
}

/*
  Configuración de un campo del diálogo dinámico.
*/
export interface DialogField {
  /*
    Nombre interno del campo.

    Debe coincidir con la propiedad del objeto que se quiere crear o editar.

    Ejemplo:
    "name"
    "email"
    "price"
    "stock"
  */
  key: string;

  /*
    Etiqueta visible para el usuario.
  */
  label: string;

  /*
    Tipo de campo.
  */
  type: DialogFieldType;

  /*
    Placeholder opcional.
  */
  placeholder?: string;

  /*
    Valor inicial del campo.
  */
  value?: unknown;

  /*
    Opciones disponibles para campos tipo select.
  */
  options?: DialogSelectOption[];

  /*
    Validaciones del campo.
  */
  validations?: DialogFieldValidation;

  /*
    Define si el campo está deshabilitado.
  */
  disabled?: boolean;

  /*
    Define si el campo debe ocultarse visualmente.
  */
  hidden?: boolean;

  /*
    Texto auxiliar opcional.

    Ejemplo:
    "La contraseña debe tener mínimo 8 caracteres."
  */
  helperText?: string;

  /*
    Define si el campo debe ocupar todo el ancho del formulario.
  */
  fullWidth?: boolean;

  /*
    Define si un campo tipo file acepta múltiples archivos.
  */
  multiple?: boolean;

  /*
    Define los tipos aceptados para campos tipo file.

    Ejemplo:
    "image/*"
    ".pdf,.xlsx"
  */
  accept?: string;

  /*
    Define si el campo debe enviarse al backend.

    Si es false, se usa visualmente pero no se incluye en el payload.
  */
  submit?: boolean;

  /*
    Define una condición para mostrar el campo.

    Sirve para casos como:
    - mostrar imageFile si imageSource es FILE
    - mostrar imageUrl si imageSource es URL
  */
  visibleWhen?: DialogFieldVisibilityCondition;
}

/*
  Configuración general del diálogo dinámico.
*/
export interface DynamicDialogConfig {
  /*
    Título del diálogo.
  */
  title: string;

  /*
    Descripción opcional del diálogo.
  */
  description?: string;

  /*
    Texto del botón principal.

    Ejemplo:
    "Guardar"
    "Crear producto"
    "Actualizar"
  */
  confirmText: string;

  /*
    Texto del botón secundario.
  */
  cancelText?: string;

  /*
    Lista de campos que el diálogo debe mostrar.
  */
  fields: DialogField[];

  /*
    Indica si el botón principal representa una operación delicada.

    Ejemplo:
    eliminar, cancelar, desactivar.
  */
  danger?: boolean;

  /*
    Endpoint asociado de manera descriptiva.

    Recomendación:
    No hacer que el diálogo ejecute HTTP directamente.
    El componente padre o servicio del módulo debe decidir cómo usarlo.
  */
  endpoint?: string;

  /*
    Método HTTP asociado de manera descriptiva.
  */
  method?: DialogSubmitMethod;

  /*
    Permite transformar datos antes de enviarlos.

    Útil cuando el formulario captura nombres amigables pero el backend
    espera otra estructura.

    Ejemplo:
    data => ({
      name: data['name'],
      price: Number(data['price'])
    })
  */
  submitPayloadMapper?: (
    data: Record<string, unknown>
  ) => Record<string, unknown> | FormData;
}

/*
  Resultado que devuelve un diálogo dinámico al cerrarse.
*/
export interface DynamicDialogResult {
  /*
    Indica si el usuario confirmó la acción.
  */
  confirmed: boolean;

  /*
    Datos capturados en el formulario.
  */
  data?: Record<string, unknown>;

  /*
    Payload transformado opcional para backend.

    Puede ser un objeto normal o FormData si hay archivos.
  */
  payload?: Record<string, unknown> | FormData;
}