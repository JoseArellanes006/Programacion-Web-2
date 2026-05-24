/*
  Modelo de categoría.

  Este modelo está alineado con el backend FastAPI.

  El backend no usa active: boolean.
  Usa status: ACTIVE | INACTIVE.
*/

export type CategoryStatus = 'ACTIVE' | 'INACTIVE';

export interface Category {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  status: CategoryStatus;
}

export interface UpdateCategoryRequest {
  name: string;
  description: string;
  status: CategoryStatus;
}

export interface UpdateCategoryStatusRequest {
  status: CategoryStatus;
}