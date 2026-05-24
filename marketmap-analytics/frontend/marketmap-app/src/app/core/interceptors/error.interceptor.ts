/*
  Interceptor global de errores HTTP.

  Este interceptor se ejecuta cuando una petición HTTP falla.

  Responsabilidades:
  - Detectar errores 401.
  - Cerrar sesión si el token ya no es válido.
  - Redirigir al login cuando corresponda.
  - Evitar tratar endpoints públicos de auth como sesión expirada.
  - Mostrar notificaciones generales de error.
*/

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

/*
  Interceptor funcional para manejar errores HTTP.
*/
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  /*
    AuthService permite cerrar sesión si el token expira o no es válido.
  */
  const authService = inject(AuthService);

  /*
    NotificationService permite mostrar mensajes globales al usuario.
  */
  const notificationService = inject(NotificationService);

  /*
    Router permite redirigir al usuario.
  */
  const router = inject(Router);

  /*
    Endpoints públicos de autenticación.

    Si estos fallan con 401, no se debe tratar como sesión expirada.
    El componente correspondiente debe mostrar su propio mensaje.
  */
  const publicAuthEndpoints = [
    API_CONFIG.auth.login,
    API_CONFIG.auth.register,
    API_CONFIG.auth.google,
    API_CONFIG.auth.forgotPassword,
    API_CONFIG.auth.resetPassword
  ];

  const isPublicAuthRequest = publicAuthEndpoints.some((url) => {
    return req.url.startsWith(url);
  });

  /*
    Se envía la petición normalmente y se capturan errores si ocurren.
  */
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      /*
        Error 401: no autorizado.

        Si ocurre en endpoints públicos, se deja que el componente maneje
        el error. Por ejemplo:
        - credenciales incorrectas en login
        - token inválido en reset-password
        - Google login inválido
      */
      if (error.status === 401 && isPublicAuthRequest) {
        return throwError(() => error);
      }

      /*
        Error 401 en rutas privadas:
        - token expirado
        - token inválido
        - usuario sin credenciales válidas
      */
      if (error.status === 401) {
        authService.logout();

        notificationService.warning(
          'Sesión finalizada',
          'Tu sesión expiró o no es válida. Inicia sesión nuevamente.'
        );

        router.navigate(['/auth/login']);
      }

      /*
        Error 403: prohibido.

        El usuario puede estar autenticado, pero no tiene permisos
        suficientes para realizar la acción.
      */
      if (error.status === 403) {
        notificationService.error(
          'Acceso denegado',
          'No tienes permisos para realizar esta acción.'
        );
      }

      /*
        Error 0: normalmente indica que Angular no pudo comunicarse
        con el backend.

        Causas comunes:
        - FastAPI no está levantado
        - CORS mal configurado
        - URL incorrecta
        - pérdida de conexión
      */
      if (error.status === 0) {
        notificationService.error(
          'Error de conexión',
          'No fue posible comunicarse con el servidor.'
        );
      }

      /*
        Errores del servidor.
      */
      if (error.status >= 500) {
        notificationService.error(
          'Error del servidor',
          'Ocurrió un problema interno en el backend.'
        );
      }

      /*
        Se reenvía el error para que el componente o servicio que hizo
        la petición también pueda manejarlo si lo necesita.
      */
      return throwError(() => error);
    })
  );
};