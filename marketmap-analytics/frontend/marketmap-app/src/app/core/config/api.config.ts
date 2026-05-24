/*
  Archivo central de rutas del backend.

  Este archivo evita escribir URLs manualmente en cada servicio.
  En lugar de poner directamente:
  http://127.0.0.1:8000/products

  Se usará:
  API_CONFIG.products.base

  Ventajas:
  - Centraliza las rutas del backend.
  - Facilita cambiar la URL base.
  - Evita errores por escribir rutas repetidas.
  - Mantiene los servicios más limpios.

  La URL base se toma desde environment.apiUrl.
*/

import { environment } from '../../../environments/environment';

const API_BASE_URL = environment.apiUrl;

/*
  API_CONFIG contiene todas las rutas principales que Angular usará
  para comunicarse con FastAPI.

  La propiedad "as const" permite que TypeScript trate esta configuración
  como valores constantes de solo lectura.
*/
export const API_CONFIG = {
  /*
    URL base del backend.
  */
  baseUrl: API_BASE_URL,

  /*
    URL base del WebSocket.
  */
  wsUrl: environment.wsUrl,

  /*
    Endpoints relacionados con autenticación.
  */
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    google: `${API_BASE_URL}/auth/google`,
    forgotPassword: `${API_BASE_URL}/auth/forgot-password`,
    resetPassword: `${API_BASE_URL}/auth/reset-password`,
    me: `${API_BASE_URL}/auth/me`
  },

  /*
    Endpoints de usuarios.
  */
  users: {
    base: `${API_BASE_URL}/users`,
    byId: (id: string) => `${API_BASE_URL}/users/${id}`,
    updateRole: (id: string) => `${API_BASE_URL}/users/${id}/role`,
    updateStatus: (id: string) => `${API_BASE_URL}/users/${id}/status`
  },

  /*
    Endpoints de productos.

    Backend actual:
    - GET /products
    - GET /products/catalog
    - GET /products/search?text=...
    - GET /products/category/{category}
    - GET /products/{product_id}
    - POST /products
    - PUT /products/{product_id}
    - PATCH /products/{product_id}/status
    - DELETE /products/{product_id}
  */
  products: {
    base: `${API_BASE_URL}/products`,
    catalog: `${API_BASE_URL}/products/catalog`,
    search: `${API_BASE_URL}/products/search`,
    byId: (id: string) => `${API_BASE_URL}/products/${id}`,
    byCategory: (category: string) => `${API_BASE_URL}/products/category/${encodeURIComponent(category)}`,
    updateStatus: (id: string) => `${API_BASE_URL}/products/${id}/status`
  },

  /*
    Endpoints de categorías.

    Backend actual:
    - GET /categories
    - GET /categories/active
    - GET /categories/{category_id}
    - POST /categories
    - PUT /categories/{category_id}
    - PATCH /categories/{category_id}/status
    - DELETE /categories/{category_id}

    El backend trabaja con status:
    - ACTIVE
    - INACTIVE
  */
  categories: {
    base: `${API_BASE_URL}/categories`,
    active: `${API_BASE_URL}/categories/active`,
    byId: (id: string) => `${API_BASE_URL}/categories/${id}`,
    updateStatus: (id: string) => `${API_BASE_URL}/categories/${id}/status`
  },

  /*
    Endpoints del carrito de compras.

    Backend actual:
    - GET /cart
    - POST /cart/items
    - PUT /cart/items/{product_id}
    - DELETE /cart/items/{product_id}
    - DELETE /cart/clear
    - POST /cart/checkout
  */
  cart: {
    base: `${API_BASE_URL}/cart`,
    items: `${API_BASE_URL}/cart/items`,
    itemById: (productId: string) => `${API_BASE_URL}/cart/items/${productId}`,
    clear: `${API_BASE_URL}/cart/clear`,
    checkout: `${API_BASE_URL}/cart/checkout`
  },

  /*
    Endpoints de pedidos o ventas.

    Backend actual:
    - GET /orders
    - GET /orders/by-date
    - GET /orders/{order_id}
    - PATCH /orders/{order_id}/status
    - PATCH /orders/{order_id}/cancel
  */
  orders: {
    base: `${API_BASE_URL}/orders`,
    byId: (id: string) => `${API_BASE_URL}/orders/${id}`,
    byDate: `${API_BASE_URL}/orders/by-date`,
    updateStatus: (id: string) => `${API_BASE_URL}/orders/${id}/status`,
    cancel: (id: string) => `${API_BASE_URL}/orders/${id}/cancel`
  },

  /*
    Endpoints para carga de imágenes.

    Backend esperado:
    - POST /images/upload
    - POST /images/upload/map

    Nota:
    - upload se usa para imágenes generales o de productos.
    - uploadMap queda disponible si se desea subir imagen del mapa
      desde un servicio de imágenes.
    - La pantalla del mapa usa principalmente:
      POST /maps/layouts/{layout_id}/background
      porque ese endpoint sube la imagen y actualiza directamente
      el backgroundImageUrl del layout.
  */
  images: {
    upload: `${API_BASE_URL}/images/upload`,
    uploadMap: `${API_BASE_URL}/images/upload/map`
  },

  /*
    Endpoints del mapa interactivo.

    Backend esperado:
    - GET /maps/active
    - GET /maps/layouts/{layout_id}
    - POST /maps/layouts/{layout_id}/background
    - GET /maps/zones
    - GET /maps/zones/{zone_id}
    - POST /maps/zones
    - PUT /maps/zones/{zone_id}
    - PATCH /maps/zones/{zone_id}/position
    - PATCH /maps/zones/{zone_id}/status
    - PATCH /maps/zones/{zone_id}/assign
    - PATCH /maps/zones/{zone_id}/release
    - PATCH /maps/zones/{zone_id}/sales
    - DELETE /maps/zones/{zone_id}

    Este bloque permite:
    - cargar el mapa activo;
    - subir imagen base del mapa;
    - crear zonas sobre la imagen;
    - actualizar posición, estado, asignación y ventas;
    - liberar o eliminar zonas.
  */
  maps: {
    base: `${API_BASE_URL}/maps`,
    active: `${API_BASE_URL}/maps/active`,
    layouts: `${API_BASE_URL}/maps/layouts`,
    layoutById: (id: string) => `${API_BASE_URL}/maps/layouts/${id}`,
    updateBackground: (id: string) => `${API_BASE_URL}/maps/layouts/${id}/background`,
    zones: `${API_BASE_URL}/maps/zones`,
    zoneById: (id: string) => `${API_BASE_URL}/maps/zones/${id}`,
    updatePosition: (id: string) => `${API_BASE_URL}/maps/zones/${id}/position`,
    updateStatus: (id: string) => `${API_BASE_URL}/maps/zones/${id}/status`,
    assign: (id: string) => `${API_BASE_URL}/maps/zones/${id}/assign`,
    release: (id: string) => `${API_BASE_URL}/maps/zones/${id}/release`,
    sales: (id: string) => `${API_BASE_URL}/maps/zones/${id}/sales`
  },

  /*
    Endpoints del dashboard.
  */
  dashboard: {
    summary: `${API_BASE_URL}/dashboard/summary`,
    kpis: `${API_BASE_URL}/dashboard/kpis`,
    salesSummary: `${API_BASE_URL}/dashboard/sales-summary`,
    topProducts: `${API_BASE_URL}/dashboard/top-products`,
    salesByCategory: `${API_BASE_URL}/dashboard/sales-by-category`,
    salesByZone: `${API_BASE_URL}/dashboard/sales-by-zone`
  },

  /*
    Endpoints para reportes.

    Backend actual:
    - GET /reports/sales/pdf
    - GET /reports/sales/excel
    - GET /reports/products/pdf
    - GET /reports/products/excel
    - GET /reports/orders/pdf
    - GET /reports/orders/excel
  */
  reports: {
    salesPdf: `${API_BASE_URL}/reports/sales/pdf`,
    salesExcel: `${API_BASE_URL}/reports/sales/excel`,
    productsPdf: `${API_BASE_URL}/reports/products/pdf`,
    productsExcel: `${API_BASE_URL}/reports/products/excel`,
    ordersPdf: `${API_BASE_URL}/reports/orders/pdf`,
    ordersExcel: `${API_BASE_URL}/reports/orders/excel`
  }
} as const;