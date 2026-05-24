import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';

/*
  ============================================================
  CONFIGURACIÓN GENERAL DE ANGULAR
  ============================================================

  Este archivo define los proveedores globales de la aplicación.

  En Angular 21 no se agrega provideZoneChangeDetection(),
  porque trabajaremos el proyecto sin zone.js.

  Aquí configuramos:

  - Manejo global de errores del navegador.
  - Sistema de rutas.
  - HttpClient para consumir el backend FastAPI.

  IMPORTANTE:
  HttpClient es necesario para que SensorService pueda hacer peticiones
  al backend usando métodos como:

  - http.get()
  - http.post()
  - http.delete()
*/

export const appConfig: ApplicationConfig = {
  providers: [
    /*
      Permite que Angular escuche errores globales del navegador.
    */
    provideBrowserGlobalErrorListeners(),

    /*
      Habilita el sistema de rutas de Angular.

      Las rutas están definidas en app.routes.ts.
    */
    provideRouter(routes),

    /*
      Habilita HttpClient en toda la aplicación.

      Sin esto, el servicio SensorService no podrá consumir la API
      del backend FastAPI.
    */
    provideHttpClient()
  ]
};