/*
  Página de carrito de compras.

  Esta pantalla permite:
  - consultar productos agregados
  - modificar cantidades
  - eliminar productos
  - limpiar carrito
  - seleccionar método de pago
  - confirmar compra

  Toda operación se envía al backend mediante CartService.
*/

import { Component, OnInit, inject, signal } from '@angular/core';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

import { NotificationService } from '../../../../core/services/notification.service';

import { CartItem } from '../../models/cart-item.model';
import { PaymentMethod } from '../../models/cart.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [
    ConfirmDialog,
    CurrencyFormatPipe
  ],
  templateUrl: './cart.html',
  styleUrl: './cart.scss'
})
export class CartPage implements OnInit {
  /*
    Servicio del carrito.
  */
  protected readonly cartService = inject(CartService);

  /*
    Servicio global de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga general.
  */
  protected readonly loading = signal(false);

  /*
    Estado de proceso para acciones como checkout.
  */
  protected readonly processing = signal(false);

  /*
    Mensaje de error visual.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Controla el diálogo para limpiar carrito.
  */
  protected readonly clearConfirmOpen = signal(false);

  /*
    Controla el diálogo para checkout.
  */
  protected readonly checkoutConfirmOpen = signal(false);

  /*
    Método de pago seleccionado.

    Inicia en null para que NO exista método preseleccionado.
  */
  protected readonly selectedPaymentMethod = signal<PaymentMethod | null>(null);

  /*
    Opciones de pago disponibles.

    Estas opciones no seleccionan nada por defecto.
    Solo se marca una opción cuando el usuario hace clic.
  */
  protected readonly paymentMethods: Array<{
    label: string;
    value: PaymentMethod;
    description: string;
  }> = [
    {
      label: 'Efectivo',
      value: 'CASH',
      description: 'Pago en efectivo al recibir o en caja.'
    },
    {
      label: 'Tarjeta',
      value: 'CARD',
      description: 'Pago con tarjeta bancaria.'
    },
    {
      label: 'Transferencia',
      value: 'TRANSFER',
      description: 'Pago por transferencia bancaria.'
    },
    {
      label: 'Pago en línea',
      value: 'ONLINE',
      description: 'Pago mediante plataforma digital.'
    }
  ];

  /*
    Carga inicial del carrito.
  */
  ngOnInit(): void {
    this.loadCart();
  }

  /*
    Obtiene el carrito actual desde FastAPI.
  */
  protected loadCart(): void {
    if (this.loading() || this.processing()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.cartService.getCart().subscribe({
      next: (cart) => {
        this.loading.set(false);

        /*
          Si el carrito está vacío, también se limpia el método de pago.
          Esto evita que quede un método seleccionado de una compra anterior.
        */
        if (!cart.items || cart.items.length === 0) {
          this.selectedPaymentMethod.set(null);
        }
      },
      error: () => {
        this.loading.set(false);

        this.errorMessage.set(
          'No fue posible cargar el carrito de compras.'
        );
      }
    });
  }

  /*
    Cambia el método de pago seleccionado.
  */
  protected selectPaymentMethod(paymentMethod: PaymentMethod): void {
    if (this.processing()) {
      return;
    }

    this.selectedPaymentMethod.set(paymentMethod);
  }

  /*
    Devuelve el texto del método de pago seleccionado.
  */
  protected getSelectedPaymentLabel(): string {
    const selected = this.selectedPaymentMethod();

    if (!selected) {
      return 'Sin método de pago seleccionado';
    }

    const option = this.paymentMethods.find((item) => {
      return item.value === selected;
    });

    return option?.label ?? selected;
  }

  /*
    Determina si la compra puede confirmarse.

    Debe estar bloqueada cuando:
    - hay proceso activo
    - el carrito está vacío
    - hay productos no disponibles
    - no se ha elegido método de pago
  */
  protected isCheckoutDisabled(): boolean {
    return (
      this.processing() ||
      this.cartService.isEmpty() ||
      this.cartService.hasUnavailableItems() ||
      !this.selectedPaymentMethod()
    );
  }

  /*
    Incrementa la cantidad de un producto.
  */
  protected increaseQuantity(item: CartItem): void {
    if (this.isIncreaseDisabled(item)) {
      return;
    }

    const nextQuantity = item.quantity + 1;

    this.updateQuantity(item, nextQuantity);
  }

  /*
    Disminuye la cantidad de un producto.

    Si llega a 1, no baja más.
  */
  protected decreaseQuantity(item: CartItem): void {
    const nextQuantity = item.quantity - 1;

    if (nextQuantity < 1 || this.processing()) {
      return;
    }

    this.updateQuantity(item, nextQuantity);
  }

  /*
    Actualiza cantidad en backend.
  */
  private updateQuantity(item: CartItem, quantity: number): void {
    this.processing.set(true);

    this.cartService.updateItemQuantity(item.productId, quantity).subscribe({
      next: () => {
        this.processing.set(false);
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar la cantidad.'
        );
      }
    });
  }

  /*
    Elimina un producto del carrito.
  */
  protected removeItem(item: CartItem): void {
    if (this.processing()) {
      return;
    }

    this.processing.set(true);

    this.cartService.removeItem(item.productId).subscribe({
      next: (cart) => {
        this.processing.set(false);

        if (!cart.items || cart.items.length === 0) {
          this.selectedPaymentMethod.set(null);
        }

        this.notificationService.success(
          'Producto eliminado',
          'El producto fue retirado del carrito.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible eliminar el producto del carrito.'
        );
      }
    });
  }

  /*
    Abre confirmación para limpiar carrito.
  */
  protected openClearConfirm(): void {
    if (this.processing() || this.cartService.isEmpty()) {
      return;
    }

    this.clearConfirmOpen.set(true);
  }

  /*
    Cierra confirmación para limpiar carrito.
  */
  protected closeClearConfirm(): void {
    this.clearConfirmOpen.set(false);
  }

  /*
    Limpia carrito desde backend.
  */
  protected confirmClearCart(): void {
    if (this.processing()) {
      return;
    }

    this.processing.set(true);

    this.cartService.clearCart().subscribe({
      next: () => {
        this.processing.set(false);
        this.closeClearConfirm();
        this.selectedPaymentMethod.set(null);

        this.notificationService.success(
          'Carrito limpio',
          'Se eliminaron todos los productos del carrito.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible limpiar el carrito.'
        );
      }
    });
  }

  /*
    Abre confirmación para finalizar compra.
  */
  protected openCheckoutConfirm(): void {
    if (this.processing() || this.cartService.isEmpty()) {
      return;
    }

    if (this.cartService.hasUnavailableItems()) {
      this.notificationService.warning(
        'Carrito no disponible',
        'Hay productos que ya no están disponibles. Elimínelos antes de confirmar la compra.'
      );

      return;
    }

    if (!this.selectedPaymentMethod()) {
      this.notificationService.warning(
        'Método de pago requerido',
        'Seleccione un método de pago antes de confirmar la compra.'
      );

      return;
    }

    this.checkoutConfirmOpen.set(true);
  }

  /*
    Cierra confirmación de compra.
  */
  protected closeCheckoutConfirm(): void {
    this.checkoutConfirmOpen.set(false);
  }

  /*
    Confirma compra y genera pedido.
  */
  protected confirmCheckout(): void {
    if (this.processing()) {
      return;
    }

    const paymentMethod = this.selectedPaymentMethod();

    if (!paymentMethod) {
      this.notificationService.warning(
        'Método de pago requerido',
        'Seleccione un método de pago antes de confirmar la compra.'
      );

      return;
    }

    this.processing.set(true);

    this.cartService.checkout(paymentMethod).subscribe({
      next: (response) => {
        this.processing.set(false);
        this.closeCheckoutConfirm();
        this.selectedPaymentMethod.set(null);

        this.notificationService.success(
          'Compra confirmada',
          `${response.message} Pedido generado: ${response.orderId}.`
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible confirmar la compra.'
        );
      }
    });
  }

  /*
    Verifica si un botón de aumento debe deshabilitarse.

    Si backend envía availableStock, se respeta.
  */
  protected isIncreaseDisabled(item: CartItem): boolean {
    if (this.processing()) {
      return true;
    }

    if (!item.available) {
      return true;
    }

    if (item.availableStock === undefined || item.availableStock === null) {
      return false;
    }

    return item.quantity >= item.availableStock;
  }
}