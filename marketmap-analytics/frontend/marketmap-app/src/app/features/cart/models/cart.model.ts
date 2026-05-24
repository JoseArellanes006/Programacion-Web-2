/*
  Modelos del carrito de compras.

  Estos modelos representan la información que Angular recibe
  y envía al backend FastAPI.
*/

import { CartItem } from './cart-item.model';

/*
  Estado del carrito.
*/
export type CartStatus =
  | 'ACTIVE'
  | 'CHECKED_OUT'
  | 'CANCELLED';

/*
  Método de pago seleccionado al confirmar compra.
*/
export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER'
  | 'ONLINE';

/*
  Modelo principal del carrito.
*/
export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: CartStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/*
  Solicitud para agregar producto al carrito.
*/
export interface AddCartItemRequest {
  productId: string;
  quantity: number;
}

/*
  Solicitud para actualizar cantidad.
*/
export interface UpdateCartItemRequest {
  quantity: number;
}

/*
  Solicitud para confirmar compra.
*/
export interface CheckoutRequest {
  paymentMethod: PaymentMethod;
}

/*
  Respuesta después del checkout.
*/
export interface CheckoutResponse {
  orderId: string;
  message: string;
  total: number;
}