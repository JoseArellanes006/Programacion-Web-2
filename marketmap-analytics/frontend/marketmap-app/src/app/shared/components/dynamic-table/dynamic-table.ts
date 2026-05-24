/*
  Componente de tabla dinámica.

  Este componente permite mostrar datos tabulares sin crear una tabla nueva
  para cada módulo.

  Se podrá usar en:
  - productos
  - usuarios
  - pedidos
  - ventas
  - reportes
  - categorías
  - zonas del mapa

  La tabla recibe:
  - columnas configurables
  - datos
  - estado de carga
  - mensaje cuando no hay datos
  - acciones por fila

  Este componente no consulta directamente al backend.
  El componente padre debe obtener la información mediante su servicio.
*/

import { Component, EventEmitter, Input, Output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import {
  TableAction,
  TableActionEvent,
  TableColumn,
  TableSortDirection
} from '../../models/table-column.model';

import {
  formatCurrency,
  formatDate,
  formatStatus
} from '../../utils/formatters';

@Component({
  /*
    Selector para usar la tabla en otros componentes.
  */
  selector: 'app-dynamic-table',

  /*
    Componente standalone.
  */
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],

  /*
    Archivo HTML de la tabla.
  */
  templateUrl: './dynamic-table.html',

  /*
    Archivo SCSS de la tabla.
  */
  styleUrl: './dynamic-table.scss'
})
export class DynamicTable<T = Record<string, unknown>> {
  /*
    Columnas internas normalizadas.
  */
  private internalColumns: TableColumn<T>[] = [];

  /*
    Datos internos normalizados.
  */
  private internalData: T[] = [];

  /*
    Columna actualmente ordenada.
  */
  protected sortKey: keyof T | string | null = null;

  /*
    Dirección actual del ordenamiento.
  */
  protected sortDirection: TableSortDirection = 'asc';

  /*
    Columnas que se mostrarán en la tabla.

    Cada columna define:
    - key
    - label
    - type
    - acciones
    - alineación
    - formato
  */
  @Input()
  set columns(value: TableColumn<T>[] | null | undefined) {
    this.internalColumns = Array.isArray(value) ? value : [];
  }

  get columns(): TableColumn<T>[] {
    return this.internalColumns;
  }

  /*
    Datos que se renderizarán en la tabla.
  */
  @Input()
  set data(value: T[] | null | undefined) {
    this.internalData = Array.isArray(value) ? value : [];
  }

  get data(): T[] {
    return this.internalData;
  }

  /*
    Indica si la tabla está cargando información.
  */
  @Input() loading = false;

  /*
    Mensaje que se mostrará cuando no existan registros.
  */
  @Input() emptyMessage = 'No hay registros para mostrar.';

  /*
    Evento emitido cuando el usuario ejecuta una acción de la tabla.

    Ejemplo:
    - editar
    - eliminar
    - ver detalle
  */
  @Output() tableAction = new EventEmitter<TableActionEvent<T>>();

  /*
    Datos visibles de la tabla.

    Si hay ordenamiento activo, se devuelve una copia ordenada.
  */
  protected get rows(): T[] {
    if (!this.sortKey) {
      return this.data;
    }

    const sortableColumn = this.columns.find((column) => {
      return String(column.key) === String(this.sortKey);
    });

    if (!sortableColumn || !sortableColumn.sortable) {
      return this.data;
    }

    return [...this.data].sort((leftRow, rightRow) => {
      const leftValue = this.getCellValue(leftRow, this.sortKey as string);
      const rightValue = this.getCellValue(rightRow, this.sortKey as string);

      const result = this.compareValues(leftValue, rightValue);

      return this.sortDirection === 'asc' ? result : result * -1;
    });
  }

  /*
    Indica si hay columnas configuradas.
  */
  protected get hasColumns(): boolean {
    return this.columns.length > 0;
  }

  /*
    Indica si hay filas para mostrar.
  */
  protected get hasRows(): boolean {
    return this.rows.length > 0;
  }

  /*
    Obtiene el valor de una celda.

    Como la tabla es genérica, no conoce previamente las propiedades
    del objeto. Por eso se usa Record<string, unknown>.
  */
  protected getCellValue(row: T, key: keyof T | string): unknown {
    const record = row as Record<string, unknown>;
    return record[String(key)];
  }

  /*
    Formatea el valor de una celda dependiendo del tipo de columna.
  */
  protected formatCellValue(row: T, column: TableColumn<T>): string {
    const value = this.getCellValue(row, column.key);

    /*
      Si la columna tiene un formatter personalizado, se usa primero.
    */
    if (column.formatter) {
      return column.formatter(value, row);
    }

    /*
      Si el valor está vacío, se muestra un guion.
    */
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    /*
      Formato según tipo de columna.
    */
    switch (column.type) {
      case 'currency':
        return formatCurrency(value as number | string);

      case 'date':
        return formatDate(value as Date | string);

      case 'status':
        return formatStatus(String(value));

      case 'boolean':
        return value ? 'Sí' : 'No';

      case 'number':
        return this.formatNumber(value);

      default:
        return String(value);
    }
  }

  /*
    Formatea un número.
  */
  private formatNumber(value: unknown): string {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return '-';
    }

    return new Intl.NumberFormat('es-MX').format(numericValue);
  }

  /*
    Determina si una acción debe mostrarse en una fila.

    Si la acción no define visible, se muestra por defecto.
  */
  protected isActionVisible(action: TableAction<T>, row: T): boolean {
    if (!action.visible) {
      return true;
    }

    return action.visible(row);
  }

  /*
    Determina si una acción debe estar deshabilitada.
  */
  protected isActionDisabled(action: TableAction<T>, row: T): boolean {
    if (!action.disabled) {
      return false;
    }

    return action.disabled(row);
  }

  /*
    Emite la acción seleccionada por el usuario.
  */
  protected emitAction(action: TableAction<T>, row: T): void {
    if (this.isActionDisabled(action, row)) {
      return;
    }

    this.tableAction.emit({
      action: action.key,
      row
    });
  }

  /*
    Genera una clase CSS para la alineación de columna.
  */
  protected getColumnAlignClass(column: TableColumn<T>): string {
    return `dynamic-table__cell--${column.align ?? 'left'}`;
  }

  /*
    Genera una clase CSS para ocultar columnas en móvil.
  */
  protected getResponsiveClass(column: TableColumn<T>): string {
    return column.hideOnMobile ? 'dynamic-table__cell--hide-mobile' : '';
  }

  /*
    Genera clases completas para celdas y encabezados.
  */
  protected getColumnClasses(column: TableColumn<T>): string {
    return `${this.getColumnAlignClass(column)} ${this.getResponsiveClass(column)}`;
  }

  /*
    Devuelve clase visual para un estado.
  */
  protected getStatusClass(row: T, column: TableColumn<T>): string {
    const value = String(this.getCellValue(row, column.key) ?? '').toUpperCase();

    return `dynamic-table__status dynamic-table__status--${value.toLowerCase()}`;
  }

  /*
    Devuelve ruta segura para imágenes.
  */
  protected getImageSource(row: T, column: TableColumn<T>): string {
    const value = this.getCellValue(row, column.key);

    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }

    return 'assets/images/placeholder-product.png';
  }

  /*
    Devuelve texto alternativo para imágenes.
  */
  protected getImageAlt(row: T, column: TableColumn<T>): string {
    const value = this.formatCellValue(row, column);

    if (value && value !== '-') {
      return value;
    }

    return column.label;
  }

  /*
    Determina el ícono de una acción.
  */
  protected getActionIcon(action: TableAction<T>): string {
    if (action.icon && action.icon.trim().length > 0) {
      return action.icon.trim();
    }

    if (action.key === 'view') {
      return 'visibility';
    }

    if (action.key === 'edit') {
      return 'edit';
    }

    if (action.key === 'delete') {
      return 'delete';
    }

    return 'touch_app';
  }

  /*
    Devuelve tooltip de una acción.
  */
  protected getActionTooltip(action: TableAction<T>): string {
    return action.tooltip || action.label;
  }

  /*
    Ordena por columna si la columna lo permite.
  */
  protected toggleSort(column: TableColumn<T>): void {
    if (!column.sortable || column.type === 'actions' || column.type === 'image') {
      return;
    }

    if (String(this.sortKey) === String(column.key)) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      return;
    }

    this.sortKey = column.key;
    this.sortDirection = 'asc';
  }

  /*
    Devuelve ícono de ordenamiento.
  */
  protected getSortIcon(column: TableColumn<T>): string {
    if (!column.sortable || column.type === 'actions' || column.type === 'image') {
      return '';
    }

    if (String(this.sortKey) !== String(column.key)) {
      return 'unfold_more';
    }

    return this.sortDirection === 'asc'
      ? 'keyboard_arrow_up'
      : 'keyboard_arrow_down';
  }

  /*
    Compara valores para ordenamiento.
  */
  private compareValues(left: unknown, right: unknown): number {
    if (left === null || left === undefined) {
      return 1;
    }

    if (right === null || right === undefined) {
      return -1;
    }

    const leftNumber = Number(left);
    const rightNumber = Number(right);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    const leftDate = new Date(String(left)).getTime();
    const rightDate = new Date(String(right)).getTime();

    if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
      return leftDate - rightDate;
    }

    return String(left).localeCompare(String(right), 'es-MX', {
      sensitivity: 'base'
    });
  }

  /*
    track para filas.
  */
  protected trackRow(index: number): number {
    return index;
  }

  /*
    track para columnas.
  */
  protected trackColumn(index: number, column: TableColumn<T>): string {
    return `${String(column.key)}-${index}`;
  }
}