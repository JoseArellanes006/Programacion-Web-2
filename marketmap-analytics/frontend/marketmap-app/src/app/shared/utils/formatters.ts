/*
  Utilidades de formato.

  Este archivo contiene funciones puras para transformar datos antes
  de mostrarlos al usuario.

  Se usan en componentes, servicios o tablas dinámicas cuando no sea necesario
  crear un pipe específico.
*/

/*
  Formatea un número como moneda.

  Ejemplo:
  formatCurrency(150)
  Resultado:
  "$150.00"
*/
export function formatCurrency(
  value: number | string | null | undefined,
  currency: string = 'MXN',
  locale: string = 'es-MX'
): string {
  if (value === null || value === undefined || value === '') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(0);
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(numericValue);
}

/*
  Formatea una fecha a texto.

  Ejemplo:
  formatDate('2026-05-19')
  Resultado:
  "19/05/2026"
*/
export function formatDate(
  value: Date | string | null | undefined,
  locale: string = 'es-MX',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
): string {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/*
  Convierte un texto a formato de título simple.

  Ejemplo:
  "café americano"
  Resultado:
  "Café Americano"
*/
export function toTitleCase(value: string): string {
  if (!value) {
    return '';
  }

  return value
    .toLowerCase()
    .split(' ')
    .filter((word) => word.trim().length > 0)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/*
  Recorta un texto si supera cierta longitud.

  Ejemplo:
  truncateText('Producto con descripción muy larga', 10)
  Resultado:
  "Producto c..."
*/
export function truncateText(value: string, maxLength: number = 50): string {
  if (!value) {
    return '';
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

/*
  Convierte un estado técnico a un texto más legible.

  Ejemplo:
  "PENDING"
  Resultado:
  "Pendiente"
*/
export function formatStatus(status: string): string {
  const normalizedStatus = status?.toUpperCase();

  const statusMap: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    PENDING: 'Pendiente',
    PAID: 'Pagado',
    CANCELLED: 'Cancelado',
    DELIVERED: 'Entregado',
    AVAILABLE: 'Disponible',
    OCCUPIED: 'Ocupado',
    RESERVED: 'Reservado',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    SELLER: 'Vendedor',
    CUSTOMER: 'Cliente'
  };

  return statusMap[normalizedStatus] ?? toTitleCase(status);
}

/*
  Genera un texto de fecha y hora corto.

  Se puede usar en tablas o tarjetas de actividad reciente.
*/
export function formatDateTime(
  value: Date | string | null | undefined,
  locale: string = 'es-MX'
): string {
  return formatDate(value, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/*
  Convierte bytes a una unidad legible.

  Se usará para mostrar tamaño de archivos subidos.
*/
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const sizeBase = 1024;
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(sizeBase));
  const formattedSize = bytes / Math.pow(sizeBase, unitIndex);

  return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
}