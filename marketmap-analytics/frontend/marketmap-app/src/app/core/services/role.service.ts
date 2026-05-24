/*
  Servicio para control de roles.

  Este servicio concentra la lógica de permisos del frontend.

  Se apoya en AuthService para conocer:
  - usuario actual
  - rol actual
  - estado de autenticación

  Se usará principalmente en:
  - guards
  - sidebar
  - navbar
  - botones condicionados por rol
*/

import { Injectable, computed, inject } from '@angular/core';

import { APP_CONSTANTS } from '../config/app.constants';
import { AuthRole, AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  /*
    AuthService contiene el usuario actual y su rol.
  */
  private readonly authService = inject(AuthService);

  /*
    Rol actual del usuario autenticado.
  */
  readonly currentRole = computed(() => {
    return this.authService.currentRole();
  });

  /*
    Indica si el usuario actual es administrador.
  */
  readonly isAdmin = computed(() => {
    return this.currentRole() === APP_CONSTANTS.roles.admin;
  });

  /*
    Indica si el usuario actual es gerente.
  */
  readonly isManager = computed(() => {
    return this.currentRole() === APP_CONSTANTS.roles.manager;
  });

  /*
    Indica si el usuario actual es vendedor.
  */
  readonly isSeller = computed(() => {
    return this.currentRole() === APP_CONSTANTS.roles.seller;
  });

  /*
    Indica si el usuario actual es cliente.
  */
  readonly isCustomer = computed(() => {
    return this.currentRole() === APP_CONSTANTS.roles.customer;
  });

  /*
    Verifica si el usuario tiene un rol específico.
  */
  hasRole(role: AuthRole): boolean {
    return this.authService.hasRole(role);
  }

  /*
    Verifica si el usuario tiene alguno de los roles indicados.
  */
  hasAnyRole(roles: AuthRole[]): boolean {
    return this.authService.hasAnyRole(roles);
  }

  /*
    Verifica si el usuario puede acceder a módulos administrativos.

    ADMIN y MANAGER tienen acceso administrativo general.
  */
  canAccessAdminArea(): boolean {
    return this.hasAnyRole([
      APP_CONSTANTS.roles.admin,
      APP_CONSTANTS.roles.manager
    ]);
  }

  /*
    Verifica si el usuario puede administrar usuarios.

    Esta acción queda limitada al administrador.
  */
  canManageUsers(): boolean {
    return this.hasRole(APP_CONSTANTS.roles.admin);
  }

  /*
    Verifica si el usuario puede administrar productos.

    ADMIN, MANAGER y SELLER pueden operar productos.
  */
  canManageProducts(): boolean {
    return this.hasAnyRole([
      APP_CONSTANTS.roles.admin,
      APP_CONSTANTS.roles.manager,
      APP_CONSTANTS.roles.seller
    ]);
  }

  /*
    Verifica si el usuario puede ver reportes.

    ADMIN y MANAGER pueden consultar reportes.
  */
  canViewReports(): boolean {
    return this.hasAnyRole([
      APP_CONSTANTS.roles.admin,
      APP_CONSTANTS.roles.manager
    ]);
  }

  /*
    Verifica si el usuario puede operar ventas o pedidos.

    ADMIN, MANAGER y SELLER pueden operar ventas.
  */
  canManageOrders(): boolean {
    return this.hasAnyRole([
      APP_CONSTANTS.roles.admin,
      APP_CONSTANTS.roles.manager,
      APP_CONSTANTS.roles.seller
    ]);
  }

  /*
    Verifica si el usuario puede administrar o actualizar el mapa.

    Esto coincide con el backend:
    can_manage_map permite ADMIN, MANAGER y SELLER.
  */
  canManageMap(): boolean {
    return this.hasAnyRole([
      APP_CONSTANTS.roles.admin,
      APP_CONSTANTS.roles.manager,
      APP_CONSTANTS.roles.seller
    ]);
  }

  /*
    Verifica si el usuario puede usar el carrito como cliente.
  */
  canUseCart(): boolean {
    return this.hasAnyRole([
      APP_CONSTANTS.roles.customer,
      APP_CONSTANTS.roles.admin,
      APP_CONSTANTS.roles.manager,
      APP_CONSTANTS.roles.seller
    ]);
  }
}