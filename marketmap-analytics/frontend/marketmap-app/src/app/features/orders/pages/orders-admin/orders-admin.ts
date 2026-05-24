/*
  Página administrativa de pedidos y ventas.

  Esta pantalla permite:
  - consultar pedidos
  - buscar por folio, cliente o id
  - filtrar por estado
  - filtrar por fechas
  - ver resumen del pedido
  - cambiar estado
  - cancelar pedido

  Toda operación se comunica con FastAPI mediante OrdersService.
*/

import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { DynamicTable } from '../../../../shared/components/dynamic-table/dynamic-table';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

import {
  TableActionEvent,
  TableColumn
} from '../../../../shared/models/table-column.model';

import { NotificationService } from '../../../../core/services/notification.service';

import { Order, OrderStatus, PaymentMethod } from '../../models/order.model';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-orders-admin',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    DynamicTable,
    ConfirmDialog,
    CurrencyFormatPipe
  ],
  templateUrl: './orders-admin.html',
  styleUrl: './orders-admin.scss'
})
export class OrdersAdmin implements OnInit {
  /*
    Servicio de pedidos.
  */
  protected readonly ordersService = inject(OrdersService);

  /*
    Servicio de notificaciones globales.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga.
  */
  protected readonly loading = signal(false);

  /*
    Estado de proceso para acciones.
  */
  protected readonly processing = signal(false);

  /*
    Mensaje de error visual.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Pedido seleccionado para acciones.
  */
  protected readonly selectedOrder = signal<Order | null>(null);

  /*
    Controla diálogo de cancelación.
  */
  protected readonly cancelConfirmOpen = signal(false);

  /*
    Controla el panel de detalle.
  */
  protected readonly detailOpen = signal(false);

  /*
    Pedidos filtrados desde el servicio.
  */
  protected readonly orders = computed(() => {
    return this.ordersService.filteredOrders();
  });

  /*
    Filtros conectados al servicio.
  */
  protected readonly searchText = this.ordersService.searchText;
  protected readonly selectedStatus = this.ordersService.selectedStatus;
  protected readonly startDate = this.ordersService.startDate;
  protected readonly endDate = this.ordersService.endDate;

  /*
    Opciones de estado para el filtro.
  */
  protected readonly statusOptions: Array<{
    label: string;
    value: OrderStatus | 'ALL';
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
    Columnas de la tabla de pedidos.
  */
  protected readonly columns: TableColumn<Order>[] = [
    {
      key: 'folio',
      label: 'Folio',
      type: 'text',
      sortable: true
    },
    {
      key: 'customerName',
      label: 'Cliente / Zona',
      type: 'text'
    },
    {
      key: 'totalItems',
      label: 'Productos',
      type: 'number',
      align: 'right',
      hideOnMobile: true
    },
    {
      key: 'total',
      label: 'Total',
      type: 'currency',
      align: 'right'
    },
    {
      key: 'paymentMethodLabel',
      label: 'Pago',
      type: 'text',
      align: 'center',
      hideOnMobile: true
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      align: 'center'
    },
    {
      key: 'createdAt',
      label: 'Fecha',
      type: 'date',
      hideOnMobile: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      align: 'center',
      actions: [
        {
          key: 'view',
          label: 'Ver'
        },
        {
          key: 'markPaid',
          label: 'Pagar',
          visible: (order) => {
            return order.status === 'PENDING';
          }
        },
        {
          key: 'deliver',
          label: 'Entregar',
          visible: (order) => {
            return order.status === 'PAID';
          }
        },
        {
          key: 'cancel',
          label: 'Cancelar',
          danger: true,
          visible: (order) => {
            return order.status === 'PENDING' || order.status === 'PAID';
          }
        }
      ]
    }
  ];

  /*
    Carga inicial de pedidos.
  */
  ngOnInit(): void {
    this.loadOrders();
  }

  /*
    Obtiene pedidos desde backend.
  */
  protected loadOrders(): void {
    if (this.loading() || this.processing()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.ordersService.getOrders().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible cargar los pedidos.'
        );
      }
    });
  }

  /*
    Consulta pedidos con filtros enviados al backend.
  */
  protected searchWithBackendFilters(): void {
    if (this.loading() || this.processing()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.ordersService.getOrdersByFilters({
      search: this.searchText(),
      status: this.selectedStatus(),
      startDate: this.startDate(),
      endDate: this.endDate()
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible aplicar los filtros.'
        );
      }
    });
  }

  /*
    Actualiza texto de búsqueda local.
  */
  protected updateSearchText(value: string): void {
    this.ordersService.setSearchText(value);
  }

  /*
    Actualiza estado seleccionado local.
  */
  protected updateStatus(value: OrderStatus | 'ALL'): void {
    this.ordersService.setSelectedStatus(value);
  }

  /*
    Actualiza fecha inicial.
  */
  protected updateStartDate(value: string): void {
    this.ordersService.setStartDate(value);
  }

  /*
    Actualiza fecha final.
  */
  protected updateEndDate(value: string): void {
    this.ordersService.setEndDate(value);
  }

  /*
    Convierte el string YYYY-MM-DD guardado en el servicio a Date,
    para que Angular Material Datepicker pueda mostrarlo correctamente.
  */
  protected getDatePickerValue(value: string): Date | null {
    if (!value) {
      return null;
    }

    const parts = value.split('-');

    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day)
    ) {
      return null;
    }

    return new Date(year, month - 1, day);
  }

  /*
    Convierte la fecha seleccionada en el calendario a string YYYY-MM-DD.

    Este formato es el que se envía a FastAPI.
  */
  protected formatDateValue(value: Date | null): string {
    if (!value) {
      return '';
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /*
    Limpia filtros y recarga pedidos.
  */
  protected clearFilters(): void {
    this.ordersService.clearFilters();
    this.loadOrders();
  }

  /*
    Recibe acciones de la tabla.
  */
  protected handleTableAction(event: TableActionEvent<Order>): void {
    if (this.processing()) {
      return;
    }

    if (event.action === 'view') {
      this.openDetail(event.row);
      return;
    }

    if (event.action === 'markPaid') {
      this.updateStatusInBackend(event.row, 'PAID');
      return;
    }

    if (event.action === 'deliver') {
      this.updateStatusInBackend(event.row, 'DELIVERED');
      return;
    }

    if (event.action === 'cancel') {
      this.openCancelConfirm(event.row);
    }
  }

  /*
    Abre panel de detalle.
  */
  protected openDetail(order: Order): void {
    this.selectedOrder.set(order);
    this.detailOpen.set(true);
  }

  /*
    Cierra panel de detalle.
  */
  protected closeDetail(): void {
    this.detailOpen.set(false);
    this.selectedOrder.set(null);
  }

  /*
    Abre confirmación de cancelación.
  */
  protected openCancelConfirm(order: Order): void {
    this.selectedOrder.set(order);
    this.cancelConfirmOpen.set(true);
  }

  /*
    Cierra confirmación de cancelación.
  */
  protected closeCancelConfirm(): void {
    this.cancelConfirmOpen.set(false);
    this.selectedOrder.set(null);
  }

  /*
    Actualiza estado en backend.
  */
  private updateStatusInBackend(order: Order, status: OrderStatus): void {
    if (this.processing()) {
      return;
    }

    this.processing.set(true);

    this.ordersService.updateOrderStatus(order.id, status).subscribe({
      next: () => {
        this.processing.set(false);

        this.notificationService.success(
          'Pedido actualizado',
          'El estado del pedido fue actualizado correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar el estado del pedido.'
        );
      }
    });
  }

  /*
    Confirma cancelación de pedido.
  */
  protected confirmCancelOrder(): void {
    const order = this.selectedOrder();

    if (!order || this.processing()) {
      return;
    }

    this.processing.set(true);

    this.ordersService.cancelOrder(order.id).subscribe({
      next: () => {
        this.processing.set(false);
        this.closeCancelConfirm();

        this.notificationService.success(
          'Pedido cancelado',
          'El pedido fue cancelado correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible cancelar el pedido.'
        );
      }
    });
  }

  /*
    Devuelve etiqueta visual de estado.
  */
  protected getStatusLabel(status: OrderStatus): string {
    const option = this.statusOptions.find((item) => item.value === status);

    return option?.label ?? status;
  }

  /*
    Devuelve etiqueta visual del método de pago.

    Se conserva como respaldo por si algún pedido llega sin
    paymentMethodLabel desde OrdersService.
  */
  protected getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
    const labels: Record<PaymentMethod, string> = {
      CASH: 'Efectivo',
      CARD: 'Tarjeta',
      TRANSFER: 'Transferencia',
      ONLINE: 'En línea',
      NOT_DEFINED: 'No definido'
    };

    return labels[paymentMethod] ?? 'No definido';
  }
}