import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/*
  Auth Guard (CanActivateFn)

  Este guard se ejecuta automáticamente antes de permitir
  el acceso a una ruta protegida.

  Problema que resuelve:
  - Evita que usuarios no autenticados accedan a páginas privadas.
  - Centraliza la lógica de autorización (no repetir validaciones en cada componente).

  Flujo general:
  1. Angular intenta navegar a una ruta protegida.
  2. Se ejecuta este guard.
  3. El guard decide:
     - true  → permite el acceso
     - false o UrlTree → bloquea y redirige
*/

export const authGuard: CanActivateFn = () => {

  /*
    Inyección de dependencias.

    inject() es la forma moderna en Angular standalone para acceder
    a servicios sin usar constructor.

    - AuthService: contiene la lógica de autenticación (estado de sesión).
    - Router: permite redirigir al usuario si no cumple condiciones.
  */
  const authService = inject(AuthService);
  const router = inject(Router);

  /*
    Validación principal del guard.

    Se consulta si el usuario está autenticado.
    Normalmente esto implica:
    - verificar token;
    - verificar sesión en LocalStorage;
    - validar estado interno del servicio.
  */
  if (authService.autenticado()) {

    /*
      Caso válido:

      Si el usuario tiene sesión activa:
      - se permite el acceso a la ruta solicitada.

      Retornar true indica a Angular que continúe la navegación.
    */
    return true;
  }

  /*
    Caso no autorizado:

    Si el usuario NO está autenticado:
    - no se permite entrar a la ruta protegida;
    - se redirige al login.

    createUrlTree NO navega inmediatamente, sino que:
    - le indica al router que redirija como parte del flujo de navegación.

    Esto es importante porque:
    - evita efectos secundarios inesperados;
    - mantiene el control dentro del sistema de rutas de Angular.
  */
  return router.createUrlTree(['/login']);
};