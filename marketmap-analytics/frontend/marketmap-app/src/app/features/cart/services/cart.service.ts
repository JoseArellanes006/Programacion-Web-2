/*
  Servicio de carrito de compras.

  Este servicio NO guarda el carrito como base de datos local.
  Su responsabilidad es comunicarse con el backend FastAPI.

  El backend será quien maneje:
  - persistencia del carrito
  - validación de stock
  - validación de precios
  - cálculo de subtotales
  - cálculo de impuestos
  - generación de pedido al checkout

  Angular solamente:
  - solicita el carrito
  - manda acciones del usuario
  - actualiza signals con la respuesta del backend
*/

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import {
  AddCartItemRequest,
  Cart,
  CheckoutRequest,
  CheckoutResponse,
  PaymentMethod,
  UpdateCartItemRequest
} from '../models/cart.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  /*
    HttpClient permite consumir la API de FastAPI.
  */
  private readonly http = inject(HttpClient);

  /*
    Signal privado con el carrito actual.
  */
  private readonly cartSignal = signal<Cart | null>(null);

  /*
    Signal público de solo lectura.
  */
  readonly cart = this.cartSignal.asReadonly();

  /*
    Items actuales del carrito.
  */
  readonly items = computed(() => {
    return this.cartSignal()?.items ?? [];
  });

  /*
    Total de productos considerando cantidades.
  */
  readonly totalItems = computed(() => {
    return this.cartSignal()?.totalItems ?? 0;
  });

  /*
    Subtotal actual.
  */
  readonly subtotal = computed(() => {
    return this.cartSignal()?.subtotal ?? 0;
  });

  /*
    Impuestos actuales.
  */
  readonly tax = computed(() => {
    return this.cartSignal()?.tax ?? 0;
  });

  /*
    Descuento actual.
  */
  readonly discount = computed(() => {
    return this.cartSignal()?.discount ?? 0;
  });

  /*
    Total final actual.
  */
  readonly total = computed(() => {
    return this.cartSignal()?.total ?? 0;
  });

  /*
    Indica si el carrito está vacío.
  */
  readonly isEmpty = computed(() => {
    return this.items().length === 0;
  });

  /*
    Indica si todos los productos del carrito están disponibles.
  */
  readonly allItemsAvailable = computed(() => {
    return this.items().every((item) => item.available);
  });

  /*
    Indica si hay algún producto no disponible.
  */
  readonly hasUnavailableItems = computed(() => {
    return this.items().some((item) => !item.available);
  });

  /*
    Obtiene el carrito actual del usuario autenticado.

    Endpoint:
    GET /cart
  */
  getCart(): Observable<Cart> {
    return this.http.get<Cart>(API_CONFIG.cart.base).pipe(
      tap((cart) => {
        this.cartSignal.set(cart);
      })
    );
  }

  /*
    Agrega un producto al carrito.

    Endpoint:
    POST /cart/items
  */
  addItem(productId: string, quantity = 1): Observable<Cart> {
    const payload: AddCartItemRequest = {
      productId,
      quantity
    };

    return this.http.post<Cart>(API_CONFIG.cart.items, payload).pipe(
      tap((cart) => {
        this.cartSignal.set(cart);
      })
    );
  }

  /*
    Actualiza la cantidad de un producto del carrito.

    Endpoint:
    PUT /cart/items/{productId}
  */
  updateItemQuantity(productId: string, quantity: number): Observable<Cart> {
    const payload: UpdateCartItemRequest = {
      quantity
    };

    return this.http
      .put<Cart>(
        API_CONFIG.cart.itemById(productId),
        payload
      )
      .pipe(
        tap((cart) => {
          this.cartSignal.set(cart);
        })
      );
  }

  /*
    Elimina un producto del carrito.

    Endpoint:
    DELETE /cart/items/{productId}
  */
  removeItem(productId: string): Observable<Cart> {
    return this.http.delete<Cart>(
      API_CONFIG.cart.itemById(productId)
    ).pipe(
      tap((cart) => {
        this.cartSignal.set(cart);
      })
    );
  }

  /*
    Limpia todo el carrito.

    Endpoint:
    DELETE /cart/clear
  */
  clearCart(): Observable<Cart> {
    return this.http.delete<Cart>(API_CONFIG.cart.clear).pipe(
      tap((cart) => {
        this.cartSignal.set(cart);
      })
    );
  }

  /*
    Confirma la compra y genera un pedido.

    Endpoint:
    POST /cart/checkout

    Body:
    {
      paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'ONLINE'
    }
  */
  checkout(paymentMethod: PaymentMethod): Observable<CheckoutResponse> {
    const payload: CheckoutRequest = {
      paymentMethod
    };

    return this.http.post<CheckoutResponse>(
      API_CONFIG.cart.checkout,
      payload
    ).pipe(
      tap(() => {
        this.cartSignal.set(null);
      })
    );
  }

  /*
    Limpia el estado visual del carrito.

    Útil al cerrar sesión.
  */
  clearCartState(): void {
    this.cartSignal.set(null);
  }
}