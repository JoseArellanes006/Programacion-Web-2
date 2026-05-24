/*
  Guard para usuarios invitados.

  Este guard evita que un usuario autenticado vuelva a entrar a páginas
  como login o registro.

  Funcionamiento:
  - Si el usuario NO está autenticado, permite entrar.
  - Si el usuario ya está autenticado, lo redirige según su rol.

  Reglas:
  - ADMIN, MANAGER, SELLER -> /dashboard
  - CUSTOMER -> /catalog

  Importante:
  Las rutas de recuperación de contraseña pueden dejarse públicas sin este guard
  si se desea permitir que cualquier usuario abra un enlace de recuperación.
*/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';

/*
  Guard funcional para rutas públicas de autenticación.
*/
export const guestGuard: CanActivateFn = (route) => {
  /*
    AuthService permite saber si ya existe sesión activa.
  */
  const authService = inject(AuthService);

  /*
    RoleService permite saber el rol actual del usuario autenticado.
  */
  const roleService = inject(RoleService);

  /*
    Router permite redirigir al usuario autenticado.
  */
  const router = inject(Router);

  /*
    Permite explícitamente rutas de recuperación, aunque haya sesión.
    Esto evita bloquear enlaces como:
    /auth/reset-password?token=...
  */
  const currentPath = route.routeConfig?.path ?? '';

  if (
    currentPath === 'forgot-password' ||
    currentPath === 'reset-password'
  ) {
    return true;
  }

  /*
    Si el usuario no está autenticado, puede entrar a login o registro.
  */
  if (!authService.isAuthenticated()) {
    return true;
  }

  /*
    Si ya está autenticado como CUSTOMER,
    no debe mandarse al dashboard.
  */
  if (roleService.hasAnyRole(['CUSTOMER'])) {
    return router.createUrlTree(['/catalog']);
  }

  /*
    Si ya está autenticado como usuario operativo,
    se manda al dashboard.
  */
  if (
    roleService.hasAnyRole(['ADMIN']) ||
    roleService.hasAnyRole(['MANAGER']) ||
    roleService.hasAnyRole(['SELLER'])
  ) {
    return router.createUrlTree(['/dashboard']);
  }

  /*
    Si no se puede determinar el rol, se manda al catálogo.
  */
  return router.createUrlTree(['/catalog']);
};