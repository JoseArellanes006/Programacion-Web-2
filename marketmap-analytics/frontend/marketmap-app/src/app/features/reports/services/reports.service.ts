/*
  Servicio de reportes.

  Este servicio NO genera reportes localmente con datos simulados.
  Su responsabilidad es comunicarse con FastAPI y descargar archivos.

  El backend será quien maneje:
  - consulta de información real en MongoDB
  - filtros por fecha, categoría, estado o búsqueda
  - generación de PDF
  - generación de Excel
  - nombres y contenido real de los archivos

  Angular solamente:
  - envía filtros
  - recibe un Blob
  - descarga el archivo en el navegador
*/

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import {
  ReportFilter,
  ReportFormat,
  ReportType
} from '../models/report-filter.model';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  /*
    HttpClient permite solicitar archivos al backend.
  */
  private readonly http = inject(HttpClient);

  /*
    Genera y descarga un reporte según los filtros seleccionados.

    Este método decide el endpoint correcto según:
    - tipo de reporte
    - formato solicitado
  */
  downloadReport(filter: ReportFilter): Observable<Blob> {
    const endpoint = this.getReportEndpoint(
      filter.reportType,
      filter.format
    );

    const params = this.createParams(filter);

    return this.http.get(endpoint, {
      params,
      responseType: 'blob'
    }).pipe(
      tap((blob) => {
        const fileName = this.createFileName(
          filter.reportType,
          filter.format
        );

        this.downloadBlob(blob, fileName);
      })
    );
  }

  /*
    Obtiene el endpoint correspondiente al tipo y formato de reporte.

    Endpoints esperados:
    GET /reports/sales/pdf
    GET /reports/sales/excel
    GET /reports/products/pdf
    GET /reports/products/excel
    GET /reports/orders/pdf
    GET /reports/orders/excel
  */
  private getReportEndpoint(
    reportType: ReportType,
    format: ReportFormat
  ): string {
    if (reportType === 'SALES' && format === 'PDF') {
      return API_CONFIG.reports.salesPdf;
    }

    if (reportType === 'SALES' && format === 'EXCEL') {
      return API_CONFIG.reports.salesExcel;
    }

    if (reportType === 'PRODUCTS' && format === 'PDF') {
      return API_CONFIG.reports.productsPdf;
    }

    if (reportType === 'PRODUCTS' && format === 'EXCEL') {
      return API_CONFIG.reports.productsExcel;
    }

    if (reportType === 'ORDERS' && format === 'PDF') {
      return API_CONFIG.reports.ordersPdf;
    }

    return API_CONFIG.reports.ordersExcel;
  }

  /*
    Convierte los filtros del formulario a HttpParams.

    Solo se envían los filtros que tengan valor real.
  */
  private createParams(filter: ReportFilter): HttpParams {
    let params = new HttpParams();

    if (filter.startDate?.trim()) {
      params = params.set('startDate', filter.startDate.trim());
    }

    if (filter.endDate?.trim()) {
      params = params.set('endDate', filter.endDate.trim());
    }

    if (filter.category?.trim()) {
      params = params.set('category', filter.category.trim());
    }

    if (filter.orderStatus && filter.orderStatus !== 'ALL') {
      params = params.set('orderStatus', filter.orderStatus);
    }

    if (filter.search?.trim()) {
      params = params.set('search', filter.search.trim());
    }

    return params;
  }

  /*
    Crea un nombre de archivo entendible para el usuario.
  */
  private createFileName(
    reportType: ReportType,
    format: ReportFormat
  ): string {
    const reportName = this.getReportName(reportType);
    const extension = format === 'PDF' ? 'pdf' : 'xlsx';
    const date = new Date().toISOString().slice(0, 10);

    return `${reportName}_${date}.${extension}`;
  }

  /*
    Devuelve el nombre base del reporte.
  */
  private getReportName(reportType: ReportType): string {
    if (reportType === 'SALES') {
      return 'reporte_ventas';
    }

    if (reportType === 'PRODUCTS') {
      return 'reporte_productos';
    }

    return 'reporte_pedidos';
  }

  /*
    Descarga un Blob como archivo en el navegador.

    Esta función solo se ejecuta en el cliente.
  */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();

    URL.revokeObjectURL(url);
  }
}