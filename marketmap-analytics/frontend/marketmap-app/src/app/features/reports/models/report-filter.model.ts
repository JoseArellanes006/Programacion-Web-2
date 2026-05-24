/*
  Modelo de filtros para reportes.

  Este archivo define la información que el frontend enviará al backend
  para generar reportes PDF o Excel.

  Importante:
  Angular NO genera los datos reales del reporte.
  Angular solamente manda filtros y descarga el archivo generado por FastAPI.

  El backend será responsable de:
  - consultar MongoDB
  - aplicar filtros reales
  - generar PDF
  - generar Excel
  - devolver el archivo al navegador
*/

/*
  Tipos de reporte disponibles.
*/
export type ReportType =
  | 'SALES'
  | 'PRODUCTS'
  | 'ORDERS';

/*
  Formatos de exportación disponibles.
*/
export type ReportFormat =
  | 'PDF'
  | 'EXCEL';

/*
  Estado opcional para reportes de pedidos.
*/
export type ReportOrderStatus =
  | 'ALL'
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'DELIVERED';

/*
  Filtros generales para generación de reportes.
*/
export interface ReportFilter {
  /*
    Tipo de reporte solicitado.
  */
  reportType: ReportType;

  /*
    Formato solicitado.
  */
  format: ReportFormat;

  /*
    Fecha inicial en formato YYYY-MM-DD.
  */
  startDate?: string;

  /*
    Fecha final en formato YYYY-MM-DD.
  */
  endDate?: string;

  /*
    Categoría opcional para productos o ventas.
  */
  category?: string;

  /*
    Estado opcional para pedidos.
  */
  orderStatus?: ReportOrderStatus;

  /*
    Texto opcional de búsqueda.
  */
  search?: string;
}

/*
  Opción visual para seleccionar tipo de reporte.
*/
export interface ReportTypeOption {
  /*
    Etiqueta visible.
  */
  label: string;

  /*
    Valor interno.
  */
  value: ReportType;

  /*
    Descripción breve para la interfaz.
  */
  description: string;

  /*
    Ícono de Angular Material.
  */
  icon: string;
}

/*
  Opción visual para seleccionar formato.
*/
export interface ReportFormatOption {
  /*
    Etiqueta visible.
  */
  label: string;

  /*
    Valor interno.
  */
  value: ReportFormat;

  /*
    Extensión del archivo.
  */
  extension: 'pdf' | 'xlsx';

  /*
    Ícono de Angular Material.
  */
  icon: string;
}