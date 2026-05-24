/*
  Archivo de constantes globales de la aplicación.

  Aquí se colocan valores fijos que serán reutilizados en varias partes
  del frontend.

  Ejemplos:
  - nombre del sistema
  - roles
  - estados de pedidos
  - reglas de contraseña
  - claves de localStorage
  - configuraciones de imágenes
  - paginación
*/

export const APP_CONSTANTS = {
  /*
    Nombre principal del sistema.
  */
  appName: 'MarketMap Analytics',

  /*
    Subtítulo formal del sistema.
    Puede mostrarse en login, dashboard o pantalla inicial.
  */
  appSubtitle: 'Sistema Web de Gestión Comercial con Mapa Interactivo y Análisis de Ventas',

  /*
    Claves utilizadas para guardar información en localStorage.

    Se centralizan aquí para evitar escribir textos repetidos en varios servicios.
  */
  storageKeys: {
    accessToken: 'marketmap_access_token',
    refreshToken: 'marketmap_refresh_token',
    currentUser: 'marketmap_current_user',
    cart: 'marketmap_cart'
  },

  /*
    Roles generales del sistema.

    ADMIN:
    Usuario con acceso total.

    MANAGER:
    Usuario con acceso a administración operativa, dashboard y reportes.

    SELLER:
    Usuario encargado de ventas, pedidos y productos según permisos.

    CUSTOMER:
    Usuario cliente que puede navegar el catálogo y usar carrito.
  */
  roles: {
    admin: 'ADMIN',
    manager: 'MANAGER',
    seller: 'SELLER',
    customer: 'CUSTOMER'
  },

  /*
    Estados posibles de un pedido o venta.
  */
  orderStatus: {
    pending: 'PENDING',
    paid: 'PAID',
    cancelled: 'CANCELLED',
    delivered: 'DELIVERED'
  },

  /*
    Estados posibles de una zona del mapa interactivo.

    Por ejemplo, si el sistema se usa para una cafetería:
    - AVAILABLE: mesa libre
    - OCCUPIED: mesa ocupada
    - RESERVED: mesa reservada
    - INACTIVE: zona no disponible
  */
  mapZoneStatus: {
    available: 'AVAILABLE',
    occupied: 'OCCUPIED',
    reserved: 'RESERVED',
    inactive: 'INACTIVE'
  },

  /*
    Configuración general para paginación.

    Se usará en tablas dinámicas para definir:
    - página inicial
    - número de registros por página
    - opciones de tamaño de página
  */
  pagination: {
    defaultPage: 1,
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50]
  },

  /*
    Configuración para carga de imágenes.

    allowedTypes:
    Define los formatos permitidos.

    maxSizeMb:
    Define el tamaño máximo permitido en megabytes.
  */
  images: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeMb: 5
  },

  /*
    Reglas mínimas para validar contraseñas en el frontend.

    Estas reglas deben coincidir con el backend.
  */
  passwordRules: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialCharacter: true
  }
} as const;