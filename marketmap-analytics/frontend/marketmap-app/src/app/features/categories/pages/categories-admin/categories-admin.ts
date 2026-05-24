/*
  Pantalla de administración de categorías.

  Esta pantalla está alineada con el backend real.

  El backend maneja:
  - status: ACTIVE
  - status: INACTIVE

  No usa active: boolean.
*/

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { NotificationService } from '../../../../core/services/notification.service';

import {
  Category,
  CategoryStatus,
  CreateCategoryRequest,
  UpdateCategoryRequest
} from '../../models/category.model';

import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-categories-admin',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './categories-admin.html',
  styleUrl: './categories-admin.scss'
})
export class CategoriesAdmin implements OnInit {
  /*
    Servicio de categorías.
  */
  protected readonly categoryService = inject(CategoryService);

  /*
    Servicio de notificaciones.
  */
  private readonly notificationService = inject(NotificationService);

  /*
    Estado de carga inicial.
  */
  protected readonly loading = signal(false);

  /*
    Estado de procesamiento de acciones.
  */
  protected readonly processing = signal(false);

  /*
    Mensaje de error visual.
  */
  protected readonly errorMessage = signal<string | null>(null);

  /*
    Texto de búsqueda.
  */
  protected readonly searchText = signal('');

  /*
    Filtro por estado.
  */
  protected readonly statusFilter = signal<'ALL' | CategoryStatus>('ALL');

  /*
    Categoría que se está editando.
  */
  protected readonly editingCategory = signal<Category | null>(null);

  /*
    Campos del formulario.
  */
  protected readonly formName = signal('');
  protected readonly formDescription = signal('');
  protected readonly formStatus = signal<CategoryStatus>('ACTIVE');

  /*
    Datos base del servicio.
  */
  protected readonly categories = this.categoryService.categories;
  protected readonly totalCategories = this.categoryService.totalCategories;
  protected readonly totalActiveCategories = this.categoryService.totalActiveCategories;
  protected readonly totalInactiveCategories = this.categoryService.totalInactiveCategories;

  /*
    Categorías filtradas por texto y estado.
  */
  protected readonly filteredCategories = computed(() => {
    const text = this.normalizeText(this.searchText());
    const status = this.statusFilter();

    return this.categories().filter((category) => {
      const categoryText = this.normalizeText(
        `${category.name} ${category.description}`
      );

      const matchesText = !text || categoryText.includes(text);

      const matchesStatus =
        status === 'ALL' ||
        category.status === status;

      return matchesText && matchesStatus;
    });
  });

  /*
    Indica si el formulario está editando.
  */
  protected readonly isEditing = computed(() => {
    return this.editingCategory() !== null;
  });

  /*
    Carga inicial.
  */
  ngOnInit(): void {
    this.loadCategories();
  }

  /*
    Carga categorías desde backend.
  */
  protected loadCategories(): void {
    if (this.loading() || this.processing()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.categoryService.getCategories().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set(
          'No fue posible cargar las categorías.'
        );
      }
    });
  }

  /*
    Guarda categoría.

    Si hay una categoría en edición, actualiza.
    Si no hay categoría en edición, crea.
  */
  protected saveCategory(): void {
    if (this.processing()) {
      return;
    }

    const cleanName = this.formName().trim();
    const cleanDescription = this.formDescription().trim();

    if (cleanName.length < 2) {
      this.notificationService.warning(
        'Nombre requerido',
        'La categoría debe tener un nombre de al menos 2 caracteres.'
      );

      return;
    }

    const editing = this.editingCategory();

    if (editing) {
      this.updateCategory(
        editing.id,
        {
          name: cleanName,
          description: cleanDescription,
          status: this.formStatus()
        }
      );

      return;
    }

    this.createCategory({
      name: cleanName,
      description: cleanDescription,
      status: this.formStatus()
    });
  }

  /*
    Crea categoría.
  */
  private createCategory(payload: CreateCategoryRequest): void {
    this.processing.set(true);
    this.errorMessage.set(null);

    this.categoryService.createCategory(payload).subscribe({
      next: () => {
        this.processing.set(false);
        this.resetForm();

        this.notificationService.success(
          'Categoría creada',
          'La categoría fue registrada correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible crear la categoría.'
        );
      }
    });
  }

  /*
    Actualiza categoría.
  */
  private updateCategory(
    categoryId: string,
    payload: UpdateCategoryRequest
  ): void {
    this.processing.set(true);
    this.errorMessage.set(null);

    this.categoryService.updateCategory(
      categoryId,
      payload
    ).subscribe({
      next: () => {
        this.processing.set(false);
        this.resetForm();

        this.notificationService.success(
          'Categoría actualizada',
          'La categoría fue actualizada correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible actualizar la categoría.'
        );
      }
    });
  }

  /*
    Coloca categoría en modo edición.
  */
  protected editCategory(category: Category): void {
    if (this.processing()) {
      return;
    }

    this.editingCategory.set(category);
    this.formName.set(category.name);
    this.formDescription.set(category.description ?? '');
    this.formStatus.set(category.status);
  }

  /*
    Activa o desactiva una categoría.
  */
  protected toggleCategoryStatus(category: Category): void {
    if (this.processing()) {
      return;
    }

    const nextStatus: CategoryStatus =
      category.status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    this.processing.set(true);
    this.errorMessage.set(null);

    this.categoryService.updateCategoryStatus(
      category.id,
      nextStatus
    ).subscribe({
      next: () => {
        this.processing.set(false);

        this.notificationService.success(
          'Estado actualizado',
          nextStatus === 'ACTIVE'
            ? 'La categoría fue activada correctamente.'
            : 'La categoría fue desactivada correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible cambiar el estado de la categoría.'
        );
      }
    });
  }

  /*
    Elimina categoría.
  */
  protected deleteCategory(category: Category): void {
    if (this.processing()) {
      return;
    }

    const confirmed = window.confirm(
      `¿Desea eliminar la categoría "${category.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.processing.set(true);
    this.errorMessage.set(null);

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.processing.set(false);

        const editing = this.editingCategory();

        if (editing?.id === category.id) {
          this.resetForm();
        }

        this.notificationService.success(
          'Categoría eliminada',
          'La categoría fue eliminada correctamente.'
        );
      },
      error: () => {
        this.processing.set(false);

        this.notificationService.error(
          'Error',
          'No fue posible eliminar la categoría.'
        );
      }
    });
  }

  /*
    Limpia formulario.
  */
  protected resetForm(): void {
    this.editingCategory.set(null);
    this.formName.set('');
    this.formDescription.set('');
    this.formStatus.set('ACTIVE');
  }

  /*
    Limpia filtros.
  */
  protected clearFilters(): void {
    this.searchText.set('');
    this.statusFilter.set('ALL');
  }

  /*
    Devuelve etiqueta de estado.
  */
  protected getStatusLabel(category: Category): string {
    return category.status === 'ACTIVE' ? 'Activa' : 'Inactiva';
  }

  /*
    Devuelve ícono de estado.
  */
  protected getStatusIcon(category: Category): string {
    return category.status === 'ACTIVE' ? 'check_circle' : 'block';
  }

  /*
    Indica si una categoría está activa.
  */
  protected isCategoryActive(category: Category): boolean {
    return category.status === 'ACTIVE';
  }

  /*
    Normaliza texto para búsquedas.
  */
  private normalizeText(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}