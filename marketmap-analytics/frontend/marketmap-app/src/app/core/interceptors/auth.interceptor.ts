/*
  Interceptor de autenticación.

  Este interceptor se ejecuta en cada petición HTTP saliente.

  Responsabilidad principal:
  - Leer el access token desde TokenService.
  - Agregarlo al header Authorization.
  - Enviar la petición al backend con el token incluido.

  Ejemplo de header generado:

  Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
*/

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenService } from '../services/token.service';

/*
  Interceptor funcional de Angular.

  req:
  Petición HTTP original.

  next:
  Continúa la cadena de interceptores y envía la petición.
*/
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  /*
    TokenService obtiene el access token guardado en localStorage.
  */
  const tokenService = inject(TokenService);

  /*
    Obtiene el token actual.
  */
  const accessToken = tokenService.getAccessToken();

  /*
    Si no hay token, la petición se envía sin modificar.

    Esto es importante para endpoints públicos como:
    - login
    - registro
    - recuperación de contraseña
  */
  if (!accessToken) {
    return next(req);
  }

  /*
    Las peticiones HTTP son inmutables.
    Por eso se clona la petición y se agregan los headers necesarios.
  */
  const authRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  /*
    Envía la petición modificada.
  */
  return next(authRequest);
};