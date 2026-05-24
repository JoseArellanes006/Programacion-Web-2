/*
  Servicio de categorías.

  Este servicio está alineado con el backend real.

  Backend:
  - GET /categories
  - GET /categories/active
  - GET /categories/{category_id}
  - POST /categories
  - PUT /categories/{category_id}
  - PATCH /categories/{category_id}/status
  - DELETE /categories/{category_id}

  El backend trabaja con status:
  - ACTIVE
  - INACTIVE
*/

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import {
  Category,
  CategoryStatus,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  UpdateCategoryStatusRequest
} from '../models/category.model';

type CategoryListResponse =
  | Category[]
  | {
      data?: Category[];
      items?: Category[];
      categories?: Category[];
    };

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  /*
    HttpClient permite realizar peticiones HTTP al backend.
  */
  private readonly http = inject(HttpClient);

  /*
    Estado interno de categorías.
  */
  private readonly categoriesSignal = signal<Category[]>([]);

  /*
    Estado público de solo lectura.
  */
  readonly categories = this.categoriesSignal.asReadonly();

  /*
    Categorías activas.
  */
  readonly activeCategories = computed(() => {
    return this.categoriesSignal().filter((category) => {
      return category.status === 'ACTIVE';
    });
  });

  /*
    Total de categorías.
  */
  readonly totalCategories = computed(() => {
    return this.categoriesSignal().length;
  });

  /*
    Total de categorías activas.
  */
  readonly totalActiveCategories = computed(() => {
    return this.categoriesSignal().filter((category) => {
      return category.status === 'ACTIVE';
    }).length;
  });

  /*
    Total de categorías inactivas.
  */
  readonly totalInactiveCategories = computed(() => {
    return this.categoriesSignal().filter((category) => {
      return category.status === 'INACTIVE';
    }).length;
  });

  /*
    Obtiene todas las categorías.

    Endpoint:
    GET /categories
  */
  getCategories(): Observable<CategoryListResponse> {
    return this.http
      .get<CategoryListResponse>(API_CONFIG.categories.base)
      .pipe(
        tap((response) => {
          this.categoriesSignal.set(
            this.normalizeCategoryListResponse(response)
          );
        })
      );
  }

  /*
    Obtiene solo categorías activas.

    Endpoint:
    GET /categories/active
  */
  getActiveCategories(): Observable<CategoryListResponse> {
    return this.http
      .get<CategoryListResponse>(API_CONFIG.categories.active)
      .pipe(
        tap((response) => {
          this.categoriesSignal.set(
            this.normalizeCategoryListResponse(response)
          );
        })
      );
  }

  /*
    Obtiene una categoría por id.

    Endpoint:
    GET /categories/{categoryId}
  */
  getCategoryById(categoryId: string): Observable<Category> {
    return this.http.get<Category>(
      API_CONFIG.categories.byId(categoryId)
    );
  }

  /*
    Crea una categoría.

    Endpoint:
    POST /categories
  */
  createCategory(
    payload: CreateCategoryRequest
  ): Observable<Category> {
    return this.http
      .post<Category>(
        API_CONFIG.categories.base,
        payload
      )
      .pipe(
        tap((createdCategory) => {
          this.categoriesSignal.update((currentCategories) => {
            return [
              createdCategory,
              ...currentCategories
            ];
          });
        })
      );
  }

  /*
    Actualiza una categoría.

    Endpoint:
    PUT /categories/{categoryId}
  */
  updateCategory(
    categoryId: string,
    payload: UpdateCategoryRequest
  ): Observable<Category> {
    return this.http
      .put<Category>(
        API_CONFIG.categories.byId(categoryId),
        payload
      )
      .pipe(
        tap((updatedCategory) => {
          this.updateCategoryInState(updatedCategory);
        })
      );
  }

  /*
    Cambia estado de categoría.

    Endpoint:
    PATCH /categories/{categoryId}/status
  */
  updateCategoryStatus(
    categoryId: string,
    status: CategoryStatus
  ): Observable<Category> {
    const payload: UpdateCategoryStatusRequest = {
      status
    };

    return this.http
      .patch<Category>(
        API_CONFIG.categories.updateStatus(categoryId),
        payload
      )
      .pipe(
        tap((updatedCategory) => {
          this.updateCategoryInState(updatedCategory);
        })
      );
  }

  /*
    Elimina una categoría.

    Endpoint:
    DELETE /categories/{categoryId}
  */
  deleteCategory(categoryId: string): Observable<void> {
    return this.http
      .delete<void>(API_CONFIG.categories.byId(categoryId))
      .pipe(
        tap(() => {
          this.categoriesSignal.update((currentCategories) => {
            return currentCategories.filter((category) => {
              return category.id !== categoryId;
            });
          });
        })
      );
  }

  /*
    Limpia el estado local.
  */
  clearCategoryState(): void {
    this.categoriesSignal.set([]);
  }

  /*
    Actualiza una categoría dentro del signal local.
  */
  private updateCategoryInState(updatedCategory: Category): void {
    this.categoriesSignal.update((currentCategories) => {
      return currentCategories.map((category) => {
        if (category.id === updatedCategory.id) {
          return updatedCategory;
        }

        return category;
      });
    });
  }

  /*
    Normaliza respuestas del backend.

    Tu backend actualmente responde list[CategoryResponse],
    pero este método también soporta respuestas envueltas.
  */
  private normalizeCategoryListResponse(
    response: CategoryListResponse
  ): Category[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (Array.isArray(response.items)) {
      return response.items;
    }

    if (Array.isArray(response.categories)) {
      return response.categories;
    }

    return [];
  }
}