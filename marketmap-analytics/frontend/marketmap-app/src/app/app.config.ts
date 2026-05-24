/*
  Configuración global de la aplicación Angular.

  En aplicaciones standalone, este archivo concentra providers globales
  como rutas, cliente HTTP, manejo de errores, interceptors y configuración
  general de la aplicación.

  Esta versión está configurada para Angular moderno sin Zone.js.

  Importante:
  No se usa provideZoneChangeDetection(), porque ese provider requiere Zone.js.
  Si se mantiene esa configuración y no se importa Zone.js, Angular muestra:

  NG0908: In this configuration Angular requires Zone.js

  En Angular 21, zoneless es el comportamiento por defecto para nuevas
  aplicaciones. Por eso aquí no agregamos Zone.js ni provideZoneChangeDetection.
*/

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners
} from '@angular/core';

import { provideRouter } from '@angular/router';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

/*
  appConfig contiene los servicios globales que estarán disponibles
  en toda la aplicación.
*/
export const appConfig: ApplicationConfig = {
  providers: [
    /*
      Permite registrar listeners globales para errores del navegador.
    */
    provideBrowserGlobalErrorListeners(),

    /*
      Registra las rutas principales de la aplicación.
    */
    provideRouter(routes),

    /*
      Habilita HttpClient para consumir APIs del backend FastAPI.

      withFetch:
      Usa fetch como mecanismo de comunicación HTTP.

      withInterceptors:
      Registra los interceptors funcionales del core.

      Orden importante:
      - authInterceptor agrega token a las peticiones.
      - errorInterceptor maneja errores de respuesta.
    */
    provideHttpClient(
      withFetch(),
      withInterceptors([
        authInterceptor,
        errorInterceptor
      ])
    )
  ]
};