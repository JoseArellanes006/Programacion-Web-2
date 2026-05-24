/*
  Archivo principal de rutas de la aplicación.

  En este punto ya existen:
  - rutas públicas de autenticación
  - dashboard
  - categorías
  - productos
  - catálogo
  - carrito de compras
  - pedidos y ventas
  - mapa interactivo
  - reportes
  - administración de usuarios
  - layout público para auth
  - layout privado para el panel principal

  Ajuste importante:
  - CUSTOMER no debe entrar al dashboard.
  - CUSTOMER debe trabajar principalmente con catálogo y carrito.
  - ADMIN, MANAGER y SELLER sí pueden entrar al dashboard.
*/

import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

import { APP_CONSTANTS } from './core/config/app.constants';

import { AuthLayout } from './layout/auth-layout/auth-layout';
import { MainLayout } from './layout/main-layout/main-layout';

/*
  Arreglo principal de rutas del sistema.
*/
export const routes: Routes = [
  /*
    Ruta inicial.

    Cuando el usuario entra a:
    http://localhost:4200

    Angular lo redirige automáticamente a:
    http://localhost:4200/auth/login
  */
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login'
  },

  /*
    Rutas públicas de autenticación.

    Todas estas rutas usan AuthLayout como contenedor visual.
    Dentro de AuthLayout se renderizan las páginas hijas mediante <router-outlet />.
  */
  {
    path: 'auth',
    component: AuthLayout,

    /*
      guestGuard evita que un usuario ya autenticado vuelva a entrar
      a login, registro o recuperación de contraseña.
    */
    canActivate: [guestGuard],

    children: [
      /*
        Página de inicio de sesión.
      */
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login')
            .then((m) => m.Login)
      },

      /*
        Página de registro.
      */
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/pages/register/register')
            .then((m) => m.Register)
      },

      /*
        Página para solicitar recuperación de contraseña.
      */
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/pages/forgot-password/forgot-password')
            .then((m) => m.ForgotPassword)
      },

      /*
        Página para restablecer contraseña usando token.
      */
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/pages/reset-password/reset-password')
            .then((m) => m.ResetPassword)
      },

      /*
        Si el usuario entra a:
        /auth

        Angular lo redirige a:
        /auth/login
      */
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login'
      }
    ]
  },

  /*
    Rutas internas del sistema.

    Estas rutas usan MainLayout como contenedor visual.

    MainLayout contiene:
    - sidebar
    - navbar
    - router-outlet interno para páginas privadas
  */
  {
    path: '',
    component: MainLayout,

    /*
      authGuard protege las rutas internas.

      Si no hay sesión activa, el usuario será redirigido a:
      /auth/login
    */
    canActivate: [authGuard],

    children: [
      /*
        Dashboard principal.

        Importante:
        CUSTOMER no debe entrar al dashboard.

        Acceso permitido para:
        - administrador
        - gerente
        - vendedor
      */
      {
        path: 'dashboard',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin,
            APP_CONSTANTS.roles.manager,
            APP_CONSTANTS.roles.seller
          ]
        },
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard/dashboard')
            .then((m) => m.Dashboard)
      },

      /*
        Administración de categorías.

        Esta pantalla permite:
        - crear categorías
        - editar categorías
        - activar/desactivar categorías
        - eliminar categorías

        Acceso permitido para:
        - administrador
        - gerente
        - vendedor

        Esto coincide con el backend, porque las rutas de categorías usan:
        can_manage_products
      */
      {
        path: 'categories',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin,
            APP_CONSTANTS.roles.manager,
            APP_CONSTANTS.roles.seller
          ]
        },
        loadComponent: () =>
          import('./features/categories/pages/categories-admin/categories-admin')
            .then((m) => m.CategoriesAdmin)
      },

      /*
        Administración de productos.

        Esta ruta queda limitada a roles administrativos u operativos.
      */
      {
        path: 'products',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin,
            APP_CONSTANTS.roles.manager,
            APP_CONSTANTS.roles.seller
          ]
        },
        loadComponent: () =>
          import('./features/products/pages/products-admin/products-admin')
            .then((m) => m.ProductsAdmin)
      },

      /*
        Catálogo de productos.

        Esta ruta forma parte del flujo autenticado.

        Puede ser usado por:
        - cliente
        - administrador
        - gerente
        - vendedor
      */
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/products/pages/products-catalog/products-catalog')
            .then((m) => m.ProductsCatalog)
      },

      /*
        Carrito de compras.

        Puede ser usado por clientes y también por usuarios internos
        si el sistema permite ventas desde mostrador.
      */
      {
        path: 'cart',
        loadComponent: () =>
          import('./features/cart/pages/cart/cart')
            .then((m) => m.CartPage)
      },

      /*
        Pedidos y ventas.

        Acceso permitido para:
        - administrador
        - gerente
        - vendedor
      */
      {
        path: 'orders',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin,
            APP_CONSTANTS.roles.manager,
            APP_CONSTANTS.roles.seller
          ]
        },
        loadComponent: () =>
          import('./features/orders/pages/orders-admin/orders-admin')
            .then((m) => m.OrdersAdmin)
      },

      /*
        Mapa interactivo.

        Acceso permitido para:
        - administrador
        - gerente
        - vendedor
      */
      {
        path: 'map',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin,
            APP_CONSTANTS.roles.manager,
            APP_CONSTANTS.roles.seller
          ]
        },
        loadComponent: () =>
          import('./features/map/pages/interactive-map/interactive-map')
            .then((m) => m.InteractiveMap)
      },

      /*
        Reportes PDF y Excel.

        Acceso permitido para:
        - administrador
        - gerente
      */
      {
        path: 'reports',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin,
            APP_CONSTANTS.roles.manager
          ]
        },
        loadComponent: () =>
          import('./features/reports/pages/reports/reports')
            .then((m) => m.Reports)
      },

      /*
        Administración de usuarios.

        Ruta restringida al administrador.
      */
      {
        path: 'users',
        canActivate: [roleGuard],
        data: {
          roles: [
            APP_CONSTANTS.roles.admin
          ]
        },
        loadComponent: () =>
          import('./features/users/pages/users-admin/users-admin')
            .then((m) => m.UsersAdmin)
      },

      /*
        Si el usuario entra al layout privado sin ruta específica,
        se redirige a catálogo.

        Esto evita mandar a CUSTOMER al dashboard.
      */
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'catalog'
      }
    ]
  },

  /*
    Ruta comodín.

    Cualquier ruta no encontrada se redirige al login.
  */
  {
    path: '**',
    redirectTo: 'auth/login'
  }
];