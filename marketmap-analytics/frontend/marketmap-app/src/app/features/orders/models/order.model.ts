/*
  Modelo principal de pedido.

  Este archivo representa una venta o pedido generado dentro del sistema.

  El backend será responsable de:
  - crear pedidos desde el carrito
  - validar stock
  - calcular importes
  - guardar la venta
  - cambiar estados
  - generar reportes
*/

import { OrderDetail } from './order-detail.model';

/*
  Estado general del pedido.
*/
export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'DELIVERED';

/*
  Método de pago utilizado en la venta.
*/
export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER'
  | 'ONLINE'
  | 'NOT_DEFINED';

/*
  Modelo principal del pedido.
*/
export interface Order {
  id: string;
  folio: string;
  customerId?: string | null;
  customerName: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;

  /*
    Etiqueta visual calculada en frontend.

    Ejemplo:
    CASH -> Efectivo
    NOT_DEFINED -> No definido
  */
  paymentMethodLabel?: string;

  details: OrderDetail[];
  totalItems: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: string;
  updatedAt?: string | null;
}

/*
  Solicitud para actualizar estado de pedido.
*/
export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

/*
  Filtros usados para consultar pedidos.
*/
export interface OrderFilters {
  search?: string;
  status?: OrderStatus | 'ALL';
  startDate?: string;
  endDate?: string;
}