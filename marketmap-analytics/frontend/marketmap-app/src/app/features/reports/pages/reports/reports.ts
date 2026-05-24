/*
  Página de reportes.

  Esta pantalla permite solicitar reportes PDF o Excel al backend.

  Corrección importante:
  El datepicker ya no usa funciones dentro del HTML para construir Date.
  Antes se hacía algo como:

  [ngModel]="getDatePickerValue(startDate())"

  Eso podía congelar la vista porque Angular evaluaba la función muchas veces
  y se generaba un nuevo objeto Date en cada ciclo.

  Ahora se usan signals Date | null:
  - startDatePickerValue
  - endDatePickerValue

  Y aparte se conservan strings YYYY-MM-DD:
  - startDate
  - endDate

  Así Angular Material Datepicker trabaja con Date reales,
  mientras el backend recibe strings limpios.
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { NotificationService } from '../../../../core/services/notification.service';

import { CategoryService } from '../../../categories/services/category.service';

import {
  ReportFilter,
  ReportFormat,
  ReportFormatOption,
  ReportOrderStatus,
  ReportType,
  ReportTypeOption
} from '../../models/report-filter.model';

import { ReportsService } from '../../services/reports.service';

@Component({
  selector: 'app-reports',
  imports: [
    FormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports implements OnInit {
  /*
    Servicio de reportes.
  */
  private readonly reportsService = inject(ReportsService);

  /*
    Servicio de categorías.

    Se usa para no capturar categorías manualmente.
    Las opciones vienen desde /categories/active.
  */
  private readonly categoryService = inject(CategoryService);

  /*
    Servicio de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga inicial.
  */
  protected readonly loading = signal(false);

  /*
    Estado de descarga.
  */
  protected readonly downloading = signal(false);

  /*
    Mensaje de error visual.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Tipo de reporte seleccionado.
  */
  protected readonly reportType = signal<ReportType>('SALES');

  /*
    Formato seleccionado.
  */
  protected readonly format = signal<ReportFormat>('PDF');

  /*
    Valor real enviado al backend.
    Formato:
    YYYY-MM-DD
  */
  protected readonly startDate = signal('');

  /*
    Valor visual usado por Angular Material Datepicker.
  */
  protected readonly startDatePickerValue = signal<Date | null>(null);

  /*
    Valor real enviado al backend.
    Formato:
    YYYY-MM-DD
  */
  protected readonly endDate = signal('');

  /*
    Valor visual usado por Angular Material Datepicker.
  */
  protected readonly endDatePickerValue = signal<Date | null>(null);

  /*
    Categoría opcional.

    Se mantiene como string porque el backend filtra por nombre de categoría.
  */
  protected readonly category = signal('');

  /*
    Estado de pedido opcional.
  */
  protected readonly orderStatus = signal<ReportOrderStatus>('ALL');

  /*
    Texto de búsqueda opcional.
  */
  protected readonly search = signal('');

  /*
    Categorías activas para el select.

    Se agrega una opción vacía en el HTML para representar:
    "Todas las categorías".
  */
  protected readonly categoryOptions = computed(() => {
    return this.categoryService.activeCategories();
  });

  /*
    Indica si el reporte seleccionado usa categorías.
  */
  protected readonly usesCategoryFilter = computed(() => {
    return this.reportType() === 'SALES' || this.reportType() === 'PRODUCTS';
  });

  /*
    Texto explicativo para la búsqueda según el tipo de reporte.
  */
  protected readonly searchPlaceholder = computed(() => {
    if (this.reportType() === 'SALES') {
      return 'Buscar por cliente, folio, producto o categoría';
    }

    if (this.reportType() === 'PRODUCTS') {
      return 'Buscar por nombre, descripción o categoría';
    }

    return 'Buscar por folio, cliente, producto o estado';
  });

  /*
    Opciones de tipo de reporte.
  */
  protected readonly reportTypeOptions: ReportTypeOption[] = [
    {
      label: 'Ventas',
      value: 'SALES',
      description: 'Reporte financiero de ventas por periodo.',
      icon: 'payments'
    },
    {
      label: 'Productos',
      value: 'PRODUCTS',
      description: 'Reporte de productos, precios, categorías e inventario.',
      icon: 'inventory_2'
    },
    {
      label: 'Pedidos',
      value: 'ORDERS',
      description: 'Reporte operativo de pedidos y estados.',
      icon: 'receipt_long'
    }
  ];

  /*
    Opciones de formato.
  */
  protected readonly formatOptions: ReportFormatOption[] = [
    {
      label: 'PDF',
      value: 'PDF',
      extension: 'pdf',
      icon: 'picture_as_pdf'
    },
    {
      label: 'Excel',
      value: 'EXCEL',
      extension: 'xlsx',
      icon: 'table_chart'
    }
  ];

  /*
    Opciones de estado para reportes de pedidos.
  */
  protected readonly orderStatusOptions: Array<{
    label: string;
    value: ReportOrderStatus;
  }> = [
    {
      label: 'Todos',
      value: 'ALL'
    },
    {
      label: 'Pendiente',
      value: 'PENDING'
    },
    {
      label: 'Pagado',
      value: 'PAID'
    },
    {
      label: 'Cancelado',
      value: 'CANCELLED'
    },
    {
      label: 'Entregado',
      value: 'DELIVERED'
    }
  ];

  /*
    Carga inicial.
  */
  ngOnInit(): void {
    this.loadInitialData();
  }

  /*
    Carga datos necesarios para el formulario.
  */
  protected loadInitialData(): void {
    if (this.loading() || this.downloading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    forkJoin({
      categories: this.categoryService.getActiveCategories()
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.warning(
          'Categorías no disponibles',
          'No fue posible cargar las categorías activas para los filtros.'
        );
      }
    });
  }

  /*
    Cambia tipo de reporte.
  */
  protected updateReportType(value: ReportType): void {
    this.reportType.set(value);

    if (value !== 'ORDERS') {
      this.orderStatus.set('ALL');
    }

    if (value === 'ORDERS') {
      this.category.set('');
    }

    this.errorMessage.set(null);
  }

  /*
    Cambia formato.
  */
  protected updateFormat(value: ReportFormat): void {
    this.format.set(value);
  }

  /*
    Actualiza fecha inicial desde Angular Material Datepicker.
  */
  protected updateStartDate(value: Date | null): void {
    this.startDatePickerValue.set(value);
    this.startDate.set(this.formatDateValue(value));
    this.errorMessage.set(null);
  }

  /*
    Actualiza fecha final desde Angular Material Datepicker.
  */
  protected updateEndDate(value: Date | null): void {
    this.endDatePickerValue.set(value);
    this.endDate.set(this.formatDateValue(value));
    this.errorMessage.set(null);
  }

  /*
    Convierte Date a string YYYY-MM-DD.
  */
  private formatDateValue(value: Date | null): string {
    if (!value) {
      return '';
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /*
    Genera y descarga el reporte.
  */
  protected downloadReport(): void {
    if (this.downloading() || this.loading()) {
      return;
    }

    this.errorMessage.set(null);

    const validationError = this.validateFilters();

    if (validationError) {
      this.errorMessage.set(validationError);

      this.notificationService.warning(
        'Validación',
        validationError
      );

      return;
    }

    const filter: ReportFilter = {
      reportType: this.reportType(),
      format: this.format(),
      startDate: this.startDate() || undefined,
      endDate: this.endDate() || undefined,
      category: this.usesCategoryFilter()
        ? this.category().trim() || undefined
        : undefined,
      orderStatus: this.orderStatus(),
      search: this.search().trim() || undefined
    };

    this.downloading.set(true);

    this.reportsService.downloadReport(filter).subscribe({
      next: () => {
        this.downloading.set(false);

        this.notificationService.success(
          'Reporte descargado',
          'El archivo fue generado y descargado correctamente.'
        );
      },
      error: () => {
        this.downloading.set(false);

        this.errorMessage.set(
          'No fue posible generar el reporte solicitado.'
        );

        this.notificationService.error(
          'Error',
          'No fue posible generar el reporte solicitado.'
        );
      }
    });
  }

  /*
    Limpia todos los filtros del formulario.
  */
  protected clearFilters(): void {
    if (this.downloading()) {
      return;
    }

    this.reportType.set('SALES');
    this.format.set('PDF');

    this.startDate.set('');
    this.startDatePickerValue.set(null);

    this.endDate.set('');
    this.endDatePickerValue.set(null);

    this.category.set('');
    this.orderStatus.set('ALL');
    this.search.set('');
    this.errorMessage.set(null);
  }

  /*
    Valida filtros básicos antes de solicitar el reporte.
  */
  private validateFilters(): string | null {
    const start = this.startDate();
    const end = this.endDate();

    if (start && end && start > end) {
      return 'La fecha inicial no puede ser mayor que la fecha final.';
    }

    return null;
  }
}