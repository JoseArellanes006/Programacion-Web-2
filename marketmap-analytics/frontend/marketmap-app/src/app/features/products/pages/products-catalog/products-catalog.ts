/*
  Página de catálogo de productos.

  Esta pantalla muestra productos disponibles para navegación y compra.

  Funciones:
  - muestra tarjetas de productos
  - permite buscar
  - permite filtrar por categoría
  - agrega productos al carrito usando CartService
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { NotificationService } from '../../../../core/services/notification.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

import { CartService } from '../../../cart/services/cart.service';
import { Product } from '../../models/product.model';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-products-catalog',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    CurrencyFormatPipe
  ],
  templateUrl: './products-catalog.html',
  styleUrl: './products-catalog.scss'
})
export class ProductsCatalog implements OnInit {
  /*
    Servicio de productos.
  */
  private readonly productsService = inject(ProductsService);

  /*
    Servicio de carrito.
  */
  private readonly cartService = inject(CartService);

  /*
    Servicio de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga.
  */
  protected readonly loading = signal(false);

  /*
    Estado para evitar múltiples agregados simultáneos.
  */
  protected readonly addingProductId = signal<string | null>(null);

  /*
    Texto de búsqueda.
  */
  protected readonly searchText = this.productsService.searchText;

  /*
    Categoría seleccionada.
  */
  protected readonly selectedCategory = this.productsService.selectedCategory;

  /*
    Categorías disponibles.
  */
  protected readonly categories = this.productsService.categories;

  /*
    Productos filtrados visibles en catálogo.

    El backend /products/catalog ya devuelve productos ACTIVE.
    Esta condición se conserva para proteger la vista.
  */
  protected readonly products = computed(() => {
    return this.productsService.filteredProducts().filter((product) => {
      return product.status === 'ACTIVE' || product.status === 'OUT_OF_STOCK';
    });
  });

  /*
    Productos destacados.
  */
  protected readonly featuredProducts = computed(() => {
    return this.products().filter((product) => product.featured);
  });

  /*
    Carga inicial del catálogo.
  */
  ngOnInit(): void {
    this.loadCatalog();
  }

  /*
    Consulta catálogo desde backend.
  */
  protected loadCatalog(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    this.productsService.getCatalogProducts().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible cargar el catálogo.'
        );
      }
    });
  }

  /*
    Cambia texto de búsqueda.
  */
  protected updateSearchText(value: string): void {
    this.productsService.setSearchText(value);
  }

  /*
    Cambia categoría.
  */
  protected updateCategory(value: string): void {
    this.productsService.setSelectedCategory(value);
  }

  /*
    Agrega producto al carrito.
  */
  protected addToCart(product: Product): void {
    if (this.isProductUnavailable(product)) {
      this.notificationService.warning(
        'Producto no disponible',
        'Este producto no tiene existencias disponibles.'
      );

      return;
    }

    if (this.addingProductId()) {
      return;
    }

    this.addingProductId.set(product.id);

    this.cartService.addItem(product.id, 1).subscribe({
      next: () => {
        this.addingProductId.set(null);

        this.notificationService.success(
          'Producto agregado',
          `${product.name} fue agregado al carrito.`
        );
      },
      error: () => {
        this.addingProductId.set(null);

        this.notificationService.error(
          'Error',
          'No fue posible agregar el producto al carrito.'
        );
      }
    });
  }

  /*
    Verifica si un producto no puede comprarse.
  */
  protected isProductUnavailable(product: Product): boolean {
    return product.status !== 'ACTIVE' || product.stock <= 0;
  }

  /*
    Verifica si un producto específico se está agregando.
  */
  protected isAdding(product: Product): boolean {
    return this.addingProductId() === product.id;
  }

  /*
    Devuelve URL de imagen o null.
  */
  protected getImageUrl(product: Product): string | null {
    return product.imageUrl?.trim() || null;
  }
}