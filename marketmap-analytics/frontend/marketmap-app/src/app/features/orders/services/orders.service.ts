/*
  Servicio de pedidos y ventas.

  Este servicio NO guarda pedidos como base de datos local.
  Su responsabilidad es comunicarse con el backend FastAPI.
*/

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import {
  Order,
  OrderFilters,
  OrderStatus,
  PaymentMethod,
  UpdateOrderStatusRequest
} from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly http = inject(HttpClient);

  private readonly ordersSignal = signal<Order[]>([]);

  readonly orders = this.ordersSignal.asReadonly();

  readonly searchText = signal('');
  readonly selectedStatus = signal<OrderStatus | 'ALL'>('ALL');
  readonly startDate = signal('');
  readonly endDate = signal('');

  readonly filteredOrders = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const status = this.selectedStatus();
    const startDate = this.startDate();
    const endDate = this.endDate();

    return this.ordersSignal().filter((order) => {
      const matchesSearch =
        !search ||
        order.folio.toLowerCase().includes(search) ||
        order.customerName.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search);

      const matchesStatus =
        status === 'ALL' || order.status === status;

      const orderDate = order.createdAt.slice(0, 10);

      const matchesStartDate =
        !startDate || orderDate >= startDate;

      const matchesEndDate =
        !endDate || orderDate <= endDate;

      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  });

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(API_CONFIG.orders.base).pipe(
      map((orders) => this.normalizeOrders(orders)),
      tap((orders) => {
        this.ordersSignal.set(orders);
      })
    );
  }

  getOrdersByFilters(filters: OrderFilters): Observable<Order[]> {
    let params = new HttpParams();

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }

    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    return this.http.get<Order[]>(
      API_CONFIG.orders.base,
      {
        params
      }
    ).pipe(
      map((orders) => this.normalizeOrders(orders)),
      tap((orders) => {
        this.ordersSignal.set(orders);
      })
    );
  }

  getOrderById(orderId: string): Observable<Order> {
    return this.http.get<Order>(
      API_CONFIG.orders.byId(orderId)
    ).pipe(
      map((order) => this.normalizeOrder(order))
    );
  }

  updateOrderStatus(
    orderId: string,
    status: OrderStatus
  ): Observable<Order> {
    const payload: UpdateOrderStatusRequest = {
      status
    };

    return this.http.patch<Order>(
      API_CONFIG.orders.updateStatus(orderId),
      payload
    ).pipe(
      map((order) => this.normalizeOrder(order)),
      tap((updatedOrder) => {
        this.ordersSignal.update((orders) => {
          return orders.map((order) => {
            if (order.id === orderId) {
              return updatedOrder;
            }

            return order;
          });
        });
      })
    );
  }

  cancelOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(
      API_CONFIG.orders.cancel(orderId),
      {}
    ).pipe(
      map((order) => this.normalizeOrder(order)),
      tap((updatedOrder) => {
        this.ordersSignal.update((orders) => {
          return orders.map((order) => {
            if (order.id === orderId) {
              return updatedOrder;
            }

            return order;
          });
        });
      })
    );
  }

  setSearchText(value: string): void {
    this.searchText.set(value);
  }

  setSelectedStatus(value: OrderStatus | 'ALL'): void {
    this.selectedStatus.set(value);
  }

  setStartDate(value: string): void {
    this.startDate.set(value);
  }

  setEndDate(value: string): void {
    this.endDate.set(value);
  }

  clearFilters(): void {
    this.searchText.set('');
    this.selectedStatus.set('ALL');
    this.startDate.set('');
    this.endDate.set('');
  }

  clearOrdersState(): void {
    this.ordersSignal.set([]);
    this.clearFilters();
  }

  private normalizeOrders(orders: Order[]): Order[] {
    if (!Array.isArray(orders)) {
      return [];
    }

    return orders.map((order) => this.normalizeOrder(order));
  }

  private normalizeOrder(order: Order): Order {
    return {
      ...order,
      paymentMethodLabel: this.getPaymentMethodLabel(order.paymentMethod)
    };
  }

  private getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
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