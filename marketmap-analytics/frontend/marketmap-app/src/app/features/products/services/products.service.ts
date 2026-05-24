/*
  Servicio de productos.

  Este servicio NO almacena productos como base de datos.
  Su responsabilidad es comunicarse con el backend FastAPI.

  El backend será quien maneje:
  - MongoDB
  - creación de productos
  - edición de productos
  - eliminación de productos
  - búsqueda
  - filtros
  - validaciones definitivas
  - carga de imágenes

  Angular solamente consume la API y administra el estado visual.

  Importante:
  Este servicio mantiene una propiedad categories por compatibilidad
  con pantallas como products-catalog.

  Esa propiedad NO contiene categorías estáticas.
  Se calcula a partir de los productos cargados desde backend.

  En products-admin, el formulario de creación usa CategoryService para
  consumir categorías reales desde /categories/active.

  Este servicio también sube imágenes de producto a:
  POST /images/upload
*/

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import { Product } from '../models/product.model';
import { ProductForm } from '../models/product-form.model';

interface ImageUploadResponse {
  fileName: string;
  originalName: string;
  contentType: string;
  size: number;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  /*
    HttpClient permite consumir endpoints del backend FastAPI.
  */
  private readonly http = inject(HttpClient);

  /*
    Signal privado con la lista de productos cargados desde el backend.
  */
  private readonly productsSignal = signal<Product[]>([]);

  /*
    Signal público de solo lectura.
  */
  readonly products = this.productsSignal.asReadonly();

  /*
    Texto de búsqueda usado por las pantallas.
  */
  readonly searchText = signal('');

  /*
    Categoría seleccionada para filtrar visualmente.
  */
  readonly selectedCategory = signal('ALL');

  /*
    Categorías disponibles calculadas desde los productos cargados.

    Se conserva porque products-catalog todavía usa:
    this.productsService.categories

    No contiene valores escritos manualmente.
    Solo toma las categorías de los productos reales recibidos del backend.
  */
  readonly categories = computed(() => {
    const categories = this.productsSignal()
      .map((product) => product.category)
      .filter((category) => {
        return !!category && category.trim().length > 0;
      })
      .map((category) => {
        return category.trim();
      });

    return [
      'ALL',
      ...Array.from(new Set(categories))
    ];
  });

  /*
    Productos filtrados en frontend.

    Esto sirve para filtros visuales inmediatos.
  */
  readonly filteredProducts = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const category = this.selectedCategory();

    return this.productsSignal().filter((product) => {
      const productName = product.name.toLowerCase();
      const productDescription = product.description.toLowerCase();
      const productCategory = product.category.toLowerCase();

      const matchesSearch =
        productName.includes(search) ||
        productDescription.includes(search) ||
        productCategory.includes(search);

      const matchesCategory =
        category === 'ALL' || product.category === category;

      return matchesSearch && matchesCategory;
    });
  });

  /*
    Obtiene todos los productos desde FastAPI.

    Endpoint:
    GET /products
  */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(API_CONFIG.products.base).pipe(
      tap((products) => {
        this.productsSignal.set(
          products.map((product) => this.normalizeProductForView(product))
        );
      })
    );
  }

  /*
    Obtiene productos para catálogo desde FastAPI.

    Endpoint:
    GET /products/catalog
  */
  getCatalogProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(API_CONFIG.products.catalog).pipe(
      tap((products) => {
        this.productsSignal.set(
          products.map((product) => this.normalizeProductForView(product))
        );
      })
    );
  }

  /*
    Busca productos desde FastAPI.

    Endpoint:
    GET /products/search?text=valor
  */
  searchProducts(text: string): Observable<Product[]> {
    const params = new HttpParams().set('text', text);

    return this.http.get<Product[]>(
      API_CONFIG.products.search,
      {
        params
      }
    ).pipe(
      tap((products) => {
        this.productsSignal.set(
          products.map((product) => this.normalizeProductForView(product))
        );
      })
    );
  }

  /*
    Obtiene productos por categoría desde FastAPI.

    Endpoint:
    GET /products/category/{category}
  */
  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http.get<Product[]>(
      API_CONFIG.products.byCategory(category)
    ).pipe(
      tap((products) => {
        this.productsSignal.set(
          products.map((product) => this.normalizeProductForView(product))
        );
      })
    );
  }

  /*
    Sube una imagen de producto al backend.

    Endpoint:
    POST /images/upload

    El campo debe llamarse:
    file
  */
  uploadProductImage(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData();

    formData.append('file', file);

    return this.http.post<ImageUploadResponse>(
      API_CONFIG.images.upload,
      formData
    );
  }

  /*
    Crea un producto en el backend.

    Si el formulario trae imageFile:
    1. sube la imagen;
    2. recibe imageUrl;
    3. crea el producto usando esa imageUrl.

    Si no trae imageFile:
    crea el producto usando imageUrl existente o null.
  */
  createProduct(form: ProductForm): Observable<Product> {
    return this.prepareProductFormWithImage(form).pipe(
      switchMap((preparedForm) => {
        const payload = this.mapFormToPayload(preparedForm);

        return this.http.post<Product>(
          API_CONFIG.products.base,
          payload
        );
      }),
      tap((createdProduct) => {
        const normalizedProduct = this.normalizeProductForView(createdProduct);

        this.productsSignal.update((products) => {
          return [
            normalizedProduct,
            ...products
          ];
        });
      })
    );
  }

  /*
    Actualiza un producto en el backend.

    Si el formulario trae imageFile:
    1. sube la imagen nueva;
    2. recibe imageUrl;
    3. actualiza el producto usando esa nueva imageUrl.

    Si no trae imageFile:
    conserva imageUrl existente.
  */
  updateProduct(productId: string, form: ProductForm): Observable<Product> {
    return this.prepareProductFormWithImage(form).pipe(
      switchMap((preparedForm) => {
        const payload = this.mapFormToPayload(preparedForm);

        return this.http.put<Product>(
          API_CONFIG.products.byId(productId),
          payload
        );
      }),
      tap((updatedProduct) => {
        const normalizedProduct = this.normalizeProductForView(updatedProduct);

        this.productsSignal.update((products) => {
          return products.map((product) => {
            if (product.id === productId) {
              return normalizedProduct;
            }

            return product;
          });
        });
      })
    );
  }

  /*
    Elimina un producto en el backend.

    Endpoint:
    DELETE /products/{productId}
  */
  deleteProduct(productId: string): Observable<void> {
    return this.http.delete<void>(
      API_CONFIG.products.byId(productId)
    ).pipe(
      tap(() => {
        this.productsSignal.update((products) => {
          return products.filter((product) => {
            return product.id !== productId;
          });
        });
      })
    );
  }

  /*
    Cambia el texto de búsqueda local.
  */
  setSearchText(value: string): void {
    this.searchText.set(value);
  }

  /*
    Cambia la categoría seleccionada localmente.
  */
  setSelectedCategory(value: string): void {
    this.selectedCategory.set(value);
  }

  /*
    Convierte un producto existente a modelo de formulario.
  */
  mapProductToForm(product: Product): ProductForm {
    return {
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      stock: product.stock,
      status: product.status,
      featured: product.featured,
      imageFile: null,
      imageUrl: this.stripBackendAssetUrl(product.imageUrl ?? '')
    };
  }

  /*
    Limpia estado local de productos.
  */
  clearProductsState(): void {
    this.productsSignal.set([]);
    this.searchText.set('');
    this.selectedCategory.set('ALL');
  }

  /*
    Prepara el formulario con imagen.

    Si imageFile existe:
    - sube el archivo;
    - usa la imageUrl que responde el backend.

    Si imageFile no existe:
    - conserva la imageUrl actual.
  */
  private prepareProductFormWithImage(
    form: ProductForm
  ): Observable<ProductForm> {
    if (!form.imageFile) {
      return of({
        ...form,
        imageUrl: this.stripBackendAssetUrl(form.imageUrl ?? '')
      });
    }

    return this.uploadProductImage(form.imageFile).pipe(
      switchMap((response) => {
        const preparedForm: ProductForm = {
          ...form,
          imageFile: null,
          imageUrl: response.imageUrl
        };

        return of(preparedForm);
      })
    );
  }

  /*
    Convierte el formulario al payload que espera FastAPI.

    Se elimina imageFile porque el backend de productos recibe imageUrl,
    no archivo binario.

    El archivo se sube antes mediante /images/upload.
  */
  private mapFormToPayload(form: ProductForm): Omit<ProductForm, 'imageFile'> {
    return {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
      price: Number(form.price),
      stock: Number(form.stock),
      status: form.status,
      featured: Boolean(form.featured),
      imageUrl: this.stripBackendAssetUrl(form.imageUrl ?? '') || null
    };
  }

  /*
    Normaliza producto para visualización.

    Si imageUrl viene como:
    /static/uploads/products/archivo.png

    se convierte a:
    http://127.0.0.1:8000/static/uploads/products/archivo.png

    Esto permite que Angular pueda mostrar imágenes guardadas por FastAPI.
  */
  private normalizeProductForView(product: Product): Product {
    return {
      ...product,
      imageUrl: this.buildPublicAssetUrl(product.imageUrl ?? null)
    };
  }

  /*
    Construye URL pública para archivos estáticos del backend.
  */
  private buildPublicAssetUrl(value: string | null): string | null {
    if (!value) {
      return null;
    }

    if (
      value.startsWith('http://') ||
      value.startsWith('https://')
    ) {
      return value;
    }

    if (value.startsWith('/static')) {
      return `${API_CONFIG.baseUrl}${value}`;
    }

    return value;
  }

  /*
    Convierte una URL absoluta del backend a ruta relativa.

    Esto evita guardar en MongoDB:
    http://127.0.0.1:8000/static/uploads/products/archivo.png

    y permite guardar:
    /static/uploads/products/archivo.png
  */
  private stripBackendAssetUrl(value: string): string {
    if (!value) {
      return '';
    }

    if (value.startsWith(API_CONFIG.baseUrl)) {
      return value.replace(API_CONFIG.baseUrl, '');
    }

    return value;
  }
}