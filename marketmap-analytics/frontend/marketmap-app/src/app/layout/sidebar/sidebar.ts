/*
  Sidebar del sistema.

  Este componente representa el menú lateral principal de navegación.

  Responsabilidades:
  - Mostrar accesos a módulos principales.
  - Ocultar o mostrar opciones según el rol del usuario.
  - Mantener una estructura visual consistente para la zona interna.
  - Usar íconos de Angular Material para una navegación más clara.
*/

import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

import { APP_CONSTANTS } from '../../core/config/app.constants';
import { AuthRole } from '../../core/services/auth.service';
import { RoleService } from '../../core/services/role.service';

/*
  Modelo interno para las opciones del menú lateral.
*/
interface SidebarItem {
  /*
    Texto visible de la opción.
  */
  label: string;

  /*
    Ruta a la que navegará.
  */
  route: string;

  /*
    Ícono de Angular Material.
  */
  icon: string;

  /*
    Roles autorizados para ver la opción.

    Si no se define, cualquier usuario autenticado puede verla.
  */
  roles?: AuthRole[];
}

@Component({
  /*
    Selector usado por MainLayout.
  */
  selector: 'app-sidebar',

  /*
    Importa directivas de router e íconos de Angular Material.
  */
  imports: [
    RouterLink,
    RouterLinkActive,
    MatIconModule
  ],

  /*
    Archivo HTML.
  */
  templateUrl: './sidebar.html',

  /*
    Archivo SCSS.
  */
  styleUrl: './sidebar.scss'
})
export class Sidebar {
  /*
    RoleService permite consultar permisos del usuario actual.
  */
  private readonly roleService = inject(RoleService);

  /*
    Nombre corto visible en el sidebar.
  */
  protected readonly appName = APP_CONSTANTS.appName;

  /*
    Opciones completas de navegación.

    Cada elemento representa una ruta principal del sistema.
  */
  private readonly navItems: SidebarItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      roles: [
        APP_CONSTANTS.roles.admin,
        APP_CONSTANTS.roles.manager,
        APP_CONSTANTS.roles.seller
      ]
    },
    {
      label: 'Categorías',
      route: '/categories',
      icon: 'category',
      roles: [
        APP_CONSTANTS.roles.admin,
        APP_CONSTANTS.roles.manager,
        APP_CONSTANTS.roles.seller
      ]
    },
    {
      label: 'Productos',
      route: '/products',
      icon: 'inventory_2',
      roles: [
        APP_CONSTANTS.roles.admin,
        APP_CONSTANTS.roles.manager,
        APP_CONSTANTS.roles.seller
      ]
    },
    {
      label: 'Catálogo',
      route: '/catalog',
      icon: 'storefront'
    },
    {
      label: 'Carrito',
      route: '/cart',
      icon: 'shopping_cart'
    },
    {
      label: 'Pedidos',
      route: '/orders',
      icon: 'receipt_long',
      roles: [
        APP_CONSTANTS.roles.admin,
        APP_CONSTANTS.roles.manager,
        APP_CONSTANTS.roles.seller
      ]
    },
    {
      label: 'Mapa',
      route: '/map',
      icon: 'map',
      roles: [
        APP_CONSTANTS.roles.admin,
        APP_CONSTANTS.roles.manager,
        APP_CONSTANTS.roles.seller
      ]
    },
    {
      label: 'Reportes',
      route: '/reports',
      icon: 'bar_chart',
      roles: [
        APP_CONSTANTS.roles.admin,
        APP_CONSTANTS.roles.manager
      ]
    },
    {
      label: 'Usuarios',
      route: '/users',
      icon: 'group',
      roles: [
        APP_CONSTANTS.roles.admin
      ]
    }
  ];

  /*
    Opciones visibles según el rol actual.

    Si una opción no define roles, se muestra.
    Si define roles, se valida con RoleService.
  */
  protected readonly visibleNavItems = computed(() => {
    return this.navItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }

      return this.roleService.hasAnyRole(item.roles);
    });
  });
}