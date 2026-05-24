/*
  Guard de autenticación.

  Este guard protege rutas que requieren que el usuario haya iniciado sesión.

  Funcionamiento:
  - Si el usuario está autenticado, permite entrar a la ruta.
  - Si el usuario no está autenticado, lo redirige a /auth/login.
  - Conserva la URL original para poder regresar después del login.

  Se usará en rutas como:
  - /dashboard
  - /products
  - /orders
  - /map
  - /reports
  - /users
*/

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/*
  Guard funcional de Angular.
*/
export const authGuard: CanActivateFn = (_route, state) => {
  /*
    AuthService permite saber si existe sesión activa.
  */
  const authService = inject(AuthService);

  /*
    Router permite redirigir al usuario si no tiene acceso.
  */
  const router = inject(Router);

  /*
    Si el usuario está autenticado, se permite el acceso.
  */
  if (authService.isAuthenticated()) {
    return true;
  }

  /*
    Si no está autenticado, se manda al login y se conserva la ruta original.
  */
  return router.createUrlTree(
    ['/auth/login'],
    {
      queryParams: {
        returnUrl: state.url
      }
    }
  );
};