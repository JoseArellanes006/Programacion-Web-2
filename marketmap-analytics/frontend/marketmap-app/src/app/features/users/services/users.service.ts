/*
  Servicio de administración de usuarios.

  Este servicio NO guarda usuarios como base de datos local.
  Su responsabilidad es comunicarse con el backend FastAPI.

  El backend será quien maneje:
  - persistencia en MongoDB
  - validación de correo único
  - cifrado de contraseñas
  - roles
  - estados
  - permisos administrativos
  - auditoría o bitácora de cambios

  Angular solamente:
  - solicita usuarios
  - envía acciones administrativas
  - mantiene estado visual con signals
*/

import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../../../core/config/api.config';

import {
  CreateUserAdminRequest,
  UpdateUserAdminRequest,
  UpdateUserRoleRequest,
  UpdateUserStatusRequest,
  UserAdmin,
  UserAdminFilters,
  UserAdminRole,
  UserAdminStatus
} from '../models/user-admin.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  /*
    HttpClient permite consumir la API de FastAPI.
  */
  private readonly http = inject(HttpClient);

  /*
    Signal privado con los usuarios cargados desde backend.
  */
  private readonly usersSignal = signal<UserAdmin[]>([]);

  /*
    Signal público de solo lectura.
  */
  readonly users = this.usersSignal.asReadonly();

  /*
    Texto de búsqueda usado en la interfaz.
  */
  readonly searchText = signal('');

  /*
    Rol seleccionado para filtrar.
  */
  readonly selectedRole = signal<UserAdminRole | 'ALL'>('ALL');

  /*
    Estado seleccionado para filtrar.
  */
  readonly selectedStatus = signal<UserAdminStatus | 'ALL'>('ALL');

  /*
    Usuarios filtrados visualmente a partir de los datos ya cargados.

    Esto no sustituye los filtros del backend.
    Solo permite respuesta inmediata en pantalla.
  */
  readonly filteredUsers = computed(() => {
    const search = this.searchText().trim().toLowerCase();
    const role = this.selectedRole();
    const status = this.selectedStatus();

    return this.usersSignal().filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.id.toLowerCase().includes(search);

      const matchesRole =
        role === 'ALL' || user.role === role;

      const matchesStatus =
        status === 'ALL' || user.status === status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  });

  /*
    Obtiene todos los usuarios desde FastAPI.

    Endpoint esperado:
    GET /users
  */
  getUsers(): Observable<UserAdmin[]> {
    return this.http.get<UserAdmin[]>(API_CONFIG.users.base).pipe(
      tap((users) => {
        this.usersSignal.set(users);
      })
    );
  }

  /*
    Obtiene usuarios usando filtros enviados al backend.

    Endpoint esperado:
    GET /users?search=&role=&status=
  */
  getUsersByFilters(filters: UserAdminFilters): Observable<UserAdmin[]> {
    let params = new HttpParams();

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    if (filters.role && filters.role !== 'ALL') {
      params = params.set('role', filters.role);
    }

    if (filters.status && filters.status !== 'ALL') {
      params = params.set('status', filters.status);
    }

    return this.http.get<UserAdmin[]>(API_CONFIG.users.base, { params }).pipe(
      tap((users) => {
        this.usersSignal.set(users);
      })
    );
  }

  /*
    Obtiene un usuario por id.

    Endpoint esperado:
    GET /users/{userId}
  */
  getUserById(userId: string): Observable<UserAdmin> {
    return this.http.get<UserAdmin>(`${API_CONFIG.users.base}/${userId}`);
  }

  /*
    Crea un usuario desde el panel administrativo.

    Endpoint esperado:
    POST /users
  */
  createUser(payload: CreateUserAdminRequest): Observable<UserAdmin> {
    return this.http.post<UserAdmin>(API_CONFIG.users.base, payload).pipe(
      tap((createdUser) => {
        this.usersSignal.update((users) => [
          createdUser,
          ...users
        ]);
      })
    );
  }

  /*
    Actualiza datos generales de un usuario.

    Endpoint esperado:
    PUT /users/{userId}
  */
  updateUser(
    userId: string,
    payload: UpdateUserAdminRequest
  ): Observable<UserAdmin> {
    return this.http
      .put<UserAdmin>(`${API_CONFIG.users.base}/${userId}`, payload)
      .pipe(
        tap((updatedUser) => {
          this.updateUserInState(updatedUser);
        })
      );
  }

  /*
    Cambia únicamente el rol de un usuario.

    Endpoint esperado:
    PATCH /users/{userId}/role
  */
  updateUserRole(
    userId: string,
    role: UserAdminRole
  ): Observable<UserAdmin> {
    const payload: UpdateUserRoleRequest = {
      role
    };

    return this.http
      .patch<UserAdmin>(`${API_CONFIG.users.base}/${userId}/role`, payload)
      .pipe(
        tap((updatedUser) => {
          this.updateUserInState(updatedUser);
        })
      );
  }

  /*
    Cambia únicamente el estado de un usuario.

    Endpoint esperado:
    PATCH /users/{userId}/status
  */
  updateUserStatus(
    userId: string,
    status: UserAdminStatus
  ): Observable<UserAdmin> {
    const payload: UpdateUserStatusRequest = {
      status
    };

    return this.http
      .patch<UserAdmin>(`${API_CONFIG.users.base}/${userId}/status`, payload)
      .pipe(
        tap((updatedUser) => {
          this.updateUserInState(updatedUser);
        })
      );
  }

  /*
    Elimina un usuario.

    Endpoint esperado:
    DELETE /users/{userId}

    Recomendación de backend:
    Si el sistema requiere auditoría, conviene hacer baja lógica
    en lugar de eliminación física.
  */
  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${API_CONFIG.users.base}/${userId}`).pipe(
      tap(() => {
        this.usersSignal.update((users) => {
          return users.filter((user) => user.id !== userId);
        });
      })
    );
  }

  /*
    Cambia texto de búsqueda local.
  */
  setSearchText(value: string): void {
    this.searchText.set(value);
  }

  /*
    Cambia rol seleccionado local.
  */
  setSelectedRole(value: UserAdminRole | 'ALL'): void {
    this.selectedRole.set(value);
  }

  /*
    Cambia estado seleccionado local.
  */
  setSelectedStatus(value: UserAdminStatus | 'ALL'): void {
    this.selectedStatus.set(value);
  }

  /*
    Limpia filtros locales.
  */
  clearFilters(): void {
    this.searchText.set('');
    this.selectedRole.set('ALL');
    this.selectedStatus.set('ALL');
  }

  /*
    Convierte un usuario existente al modelo de actualización.
  */
  mapUserToUpdateRequest(user: UserAdmin): UpdateUserAdminRequest {
    return {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    };
  }

  /*
    Actualiza un usuario dentro del estado actual.
  */
  private updateUserInState(updatedUser: UserAdmin): void {
    this.usersSignal.update((users) => {
      return users.map((user) => {
        if (user.id === updatedUser.id) {
          return updatedUser;
        }

        return user;
      });
    });
  }

  /*
    Limpia el estado visual de usuarios.
  */
  clearUsersState(): void {
    this.usersSignal.set([]);
    this.clearFilters();
  }
}