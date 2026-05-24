/*
  Página de administración de productos.

  Esta pantalla permite:
  - listar productos
  - buscar productos
  - filtrar por categoría
  - crear productos
  - editar productos
  - eliminar productos
  - cargar imagen desde archivo
  - usar URL de imagen externa

  Usa:
  - Angular Material para controles visuales
  - DynamicTable para tabla
  - DynamicDialog para formulario
  - ConfirmDialog para confirmación

  Importante:
  Las categorías ya no son estáticas.
  Ahora se consumen desde el módulo real de categorías:
  GET /categories/active

  Para imagen de producto:
  - FILE: el usuario carga archivo desde su computadora.
  - URL: el usuario pega una URL externa.
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { DynamicDialog } from '../../../../shared/components/dynamic-dialog/dynamic-dialog';
import { DynamicTable } from '../../../../shared/components/dynamic-table/dynamic-table';

import {
  DialogField,
  DynamicDialogConfig,
  DynamicDialogResult
} from '../../../../shared/models/dialog-field.model';

import {
  TableActionEvent,
  TableColumn
} from '../../../../shared/models/table-column.model';

import { NotificationService } from '../../../../core/services/notification.service';

import { CategoryService } from '../../../categories/services/category.service';

import { Product, ProductStatus } from '../../models/product.model';
import { ProductForm } from '../../models/product-form.model';
import { ProductsService } from '../../services/products.service';

type ProductImageSource = 'FILE' | 'URL';

@Component({
  selector: 'app-products-admin',
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    DynamicTable,
    DynamicDialog,
    ConfirmDialog
  ],
  templateUrl: './products-admin.html',
  styleUrl: './products-admin.scss'
})
export class ProductsAdmin implements OnInit {
  /*
    Servicio de productos.
  */
  private readonly productsService = inject(ProductsService);

  /*
    Servicio de categorías.
  */
  private readonly categoryService = inject(CategoryService);

  /*
    Servicio global de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga general.
  */
  protected readonly loading = signal(false);

  /*
    Controla apertura del diálogo dinámico.
  */
  protected readonly dialogOpen = signal(false);

  /*
    Controla apertura del diálogo de confirmación.
  */
  protected readonly confirmOpen = signal(false);

  /*
    Producto seleccionado para edición o eliminación.
  */
  protected readonly selectedProduct = signal<Product | null>(null);

  /*
    Configuración actual del diálogo.
  */
  protected readonly dialogConfig = signal<DynamicDialogConfig | null>(null);

  /*
    Texto de búsqueda conectado al servicio.
  */
  protected readonly searchText = this.productsService.searchText;

  /*
    Categoría seleccionada conectada al servicio.
  */
  protected readonly selectedCategory = this.productsService.selectedCategory;

  /*
    Categorías disponibles para filtros.
  */
  protected readonly categories = computed(() => {
    const activeCategories = this.categoryService.activeCategories();

    return [
      'ALL',
      ...activeCategories.map((category) => category.name)
    ];
  });

  /*
    Productos filtrados.
  */
  protected readonly products = computed(() => {
    return this.productsService.filteredProducts();
  });

  /*
    Columnas de la tabla de administración.
  */
  protected readonly columns: TableColumn<Product>[] = [
    {
      key: 'imageUrl',
      label: 'Imagen',
      type: 'image',
      width: '80px',
      hideOnMobile: true
    },
    {
      key: 'name',
      label: 'Producto',
      type: 'text',
      sortable: true
    },
    {
      key: 'category',
      label: 'Categoría',
      type: 'text',
      hideOnMobile: true
    },
    {
      key: 'price',
      label: 'Precio',
      type: 'currency',
      align: 'right'
    },
    {
      key: 'stock',
      label: 'Stock',
      type: 'number',
      align: 'right'
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'status',
      align: 'center'
    },
    {
      key: 'featured',
      label: 'Destacado',
      type: 'boolean',
      align: 'center',
      hideOnMobile: true
    },
    {
      key: 'actions',
      label: 'Acciones',
      type: 'actions',
      align: 'center',
      actions: [
        {
          key: 'edit',
          label: 'Editar'
        },
        {
          key: 'delete',
          label: 'Eliminar',
          danger: true
        }
      ]
    }
  ];

  /*
    Carga inicial de productos y categorías.
  */
  ngOnInit(): void {
    this.loadProducts();
  }

  /*
    Carga productos y categorías desde backend.
  */
  protected loadProducts(): void {
    if (this.loading()) {
      return;
    }

    this.loading.set(true);

    forkJoin({
      products: this.productsService.getProducts(),
      categories: this.categoryService.getActiveCategories()
    }).subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible cargar productos o categorías.'
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
    Cambia categoría seleccionada.
  */
  protected updateCategory(value: string): void {
    this.productsService.setSelectedCategory(value);
  }

  /*
    Abre diálogo para crear producto.
  */
  protected openCreateDialog(): void {
    this.selectedProduct.set(null);

    if (this.categoryService.activeCategories().length === 0) {
      this.notificationService.warning(
        'Sin categorías',
        'Primero registre al menos una categoría activa antes de crear productos.'
      );

      return;
    }

    this.dialogConfig.set({
      title: 'Crear producto',
      description: 'Capture la información del nuevo producto.',
      confirmText: 'Guardar producto',
      cancelText: 'Cancelar',
      fields: this.createProductFields()
    });

    this.dialogOpen.set(true);
  }

  /*
    Abre diálogo para editar producto.
  */
  protected openEditDialog(product: Product): void {
    this.selectedProduct.set(product);

    const form = this.productsService.mapProductToForm(product);

    this.dialogConfig.set({
      title: 'Editar producto',
      description: 'Actualice la información del producto seleccionado.',
      confirmText: 'Actualizar producto',
      cancelText: 'Cancelar',
      fields: this.createProductFields(form)
    });

    this.dialogOpen.set(true);
  }

  /*
    Abre confirmación de eliminación.
  */
  protected openDeleteDialog(product: Product): void {
    this.selectedProduct.set(product);
    this.confirmOpen.set(true);
  }

  /*
    Cierra diálogo dinámico.
  */
  protected closeDialog(): void {
    this.dialogOpen.set(false);
    this.dialogConfig.set(null);
    this.selectedProduct.set(null);
  }

  /*
    Cierra diálogo de confirmación.
  */
  protected closeConfirmDialog(): void {
    this.confirmOpen.set(false);
    this.selectedProduct.set(null);
  }

  /*
    Maneja confirmación del diálogo dinámico.
  */
  protected handleDialogConfirm(result: DynamicDialogResult): void {
    if (!result.confirmed || !result.data) {
      return;
    }

    const form = this.mapDialogDataToProductForm(result.data);
    const product = this.selectedProduct();

    if (product) {
      this.updateProduct(product.id, form);
      return;
    }

    this.createProduct(form);
  }

  /*
    Crea producto.
  */
  private createProduct(form: ProductForm): void {
    this.loading.set(true);

    this.productsService.createProduct(form).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeDialog();

        this.notificationService.success(
          'Producto creado',
          'El producto fue registrado correctamente.'
        );
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible crear el producto.'
        );
      }
    });
  }

  /*
    Actualiza producto.
  */
  private updateProduct(productId: string, form: ProductForm): void {
    this.loading.set(true);

    this.productsService.updateProduct(productId, form).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeDialog();

        this.notificationService.success(
          'Producto actualizado',
          'Los cambios fueron guardados correctamente.'
        );
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar el producto.'
        );
      }
    });
  }

  /*
    Elimina el producto seleccionado.
  */
  protected confirmDelete(): void {
    const product = this.selectedProduct();

    if (!product) {
      return;
    }

    this.loading.set(true);

    this.productsService.deleteProduct(product.id).subscribe({
      next: () => {
        this.loading.set(false);
        this.closeConfirmDialog();

        this.notificationService.success(
          'Producto eliminado',
          'El producto fue eliminado correctamente.'
        );
      },
      error: () => {
        this.loading.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible eliminar el producto.'
        );
      }
    });
  }

  /*
    Recibe acciones emitidas por la tabla dinámica.
  */
  protected handleTableAction(event: TableActionEvent<Product>): void {
    if (event.action === 'edit') {
      this.openEditDialog(event.row);
      return;
    }

    if (event.action === 'delete') {
      this.openDeleteDialog(event.row);
    }
  }

  /*
    Crea campos dinámicos para el formulario de producto.
  */
  private createProductFields(form?: ProductForm): DialogField[] {
    const categoryOptions = this.createCategoryOptions(form?.category);
    const imageSource = this.resolveInitialImageSource(form);

    return [
      {
        key: 'name',
        label: 'Nombre del producto',
        type: 'text',
        placeholder: 'Ej. Café americano',
        value: form?.name ?? '',
        validations: {
          required: true,
          minLength: 3
        },
        fullWidth: true
      },
      {
        key: 'description',
        label: 'Descripción',
        type: 'textarea',
        placeholder: 'Descripción breve del producto',
        value: form?.description ?? '',
        validations: {
          required: true,
          minLength: 5
        },
        fullWidth: true
      },
      {
        key: 'category',
        label: 'Categoría',
        type: 'select',
        placeholder: 'Seleccione una opción',
        value: form?.category ?? '',
        options: categoryOptions,
        validations: {
          required: true
        }
      },
      {
        key: 'price',
        label: 'Precio',
        type: 'number',
        value: form?.price ?? 0,
        validations: {
          required: true,
          min: 0
        }
      },
      {
        key: 'stock',
        label: 'Stock',
        type: 'number',
        value: form?.stock ?? 0,
        validations: {
          required: true,
          min: 0
        }
      },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        value: form?.status ?? 'ACTIVE',
        options: [
          {
            label: 'Activo',
            value: 'ACTIVE'
          },
          {
            label: 'Inactivo',
            value: 'INACTIVE'
          },
          {
            label: 'Sin stock',
            value: 'OUT_OF_STOCK'
          }
        ],
        validations: {
          required: true
        }
      },
      {
        key: 'featured',
        label: 'Producto destacado',
        type: 'checkbox',
        placeholder: 'Marcar como destacado',
        value: form?.featured ?? false,
        fullWidth: true
      },
      {
        key: 'imageSource',
        label: 'Forma de imagen',
        type: 'select',
        placeholder: 'Seleccione una opción',
        value: form ? imageSource : '',
        options: [
          {
            label: 'Cargar archivo desde mi computadora',
            value: 'FILE'
          },
          {
            label: 'Usar URL de imagen',
            value: 'URL'
          }
        ],
        validations: {
          required: true
        },
        fullWidth: true
      },
      {
        key: 'imageFile',
        label: 'Imagen del producto',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp',
        helperText: form?.imageUrl
          ? 'Seleccione una imagen nueva solo si desea reemplazar la actual. Formatos permitidos: JPG, PNG o WEBP. Tamaño máximo: 5 MB.'
          : 'Seleccione una imagen JPG, PNG o WEBP. Tamaño máximo: 5 MB.',
        fullWidth: true,
        visibleWhen: {
          fieldKey: 'imageSource',
          equals: 'FILE'
        }
      },
      {
        key: 'imageUrl',
        label: 'URL de imagen',
        type: 'text',
        placeholder: 'https://...',
        value: form?.imageUrl ?? '',
        helperText: 'Pegue la URL de una imagen externa.',
        fullWidth: true,
        visibleWhen: {
          fieldKey: 'imageSource',
          equals: 'URL'
        }
      }
    ];
  }

  /*
    Determina la forma inicial de imagen.

    Solo se usa en modo edición.
    En modo creación se deja vacío para que el usuario elija manualmente.
  */
  private resolveInitialImageSource(form?: ProductForm): ProductImageSource {
    if (!form?.imageUrl) {
      return 'FILE';
    }

    if (
      form.imageUrl.startsWith('http://') ||
      form.imageUrl.startsWith('https://')
    ) {
      return 'URL';
    }

    return 'FILE';
  }

  /*
    Crea opciones para el select de categorías.
  */
  private createCategoryOptions(currentCategory?: string): {
    label: string;
    value: string;
  }[] {
    const categoryNames = this.categoryService.activeCategories()
      .map((category) => category.name)
      .filter((categoryName) => !!categoryName)
      .map((categoryName) => categoryName.trim())
      .filter((categoryName) => categoryName.length > 0);

    const uniqueCategoryNames = Array.from(new Set(categoryNames));

    if (
      currentCategory &&
      !uniqueCategoryNames.includes(currentCategory)
    ) {
      uniqueCategoryNames.push(currentCategory);
    }

    return uniqueCategoryNames.map((categoryName) => {
      return {
        label: categoryName,
        value: categoryName
      };
    });
  }

  /*
    Convierte los datos del diálogo al modelo ProductForm.
  */
  private mapDialogDataToProductForm(data: Record<string, unknown>): ProductForm {
    const imageSource = String(data['imageSource'] ?? '') as ProductImageSource;

    const imageFile = imageSource === 'FILE' && data['imageFile'] instanceof File
      ? data['imageFile']
      : null;

    const imageUrl = imageSource === 'URL'
      ? String(data['imageUrl'] ?? '').trim() || null
      : null;

    return {
      name: String(data['name'] ?? '').trim(),
      description: String(data['description'] ?? '').trim(),
      category: String(data['category'] ?? '').trim(),
      price: Number(data['price'] ?? 0),
      stock: Number(data['stock'] ?? 0),
      status: String(data['status'] ?? 'ACTIVE') as ProductStatus,
      featured: Boolean(data['featured']),
      imageFile,
      imageUrl
    };
  }
}