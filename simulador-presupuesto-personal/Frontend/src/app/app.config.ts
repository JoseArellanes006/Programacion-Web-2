import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';

import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

/*
  app.config.ts

  Este archivo define la configuración global de la aplicación Angular.

  Aquí se registran los proveedores (providers) que estarán disponibles
  en toda la aplicación.

  En Angular moderno (standalone), este archivo reemplaza en gran parte
  lo que antes se hacía en AppModule.
*/

export const appConfig: ApplicationConfig = {
  providers: [
    /*
      Manejo global de errores del navegador.

      Permite que Angular capture errores no controlados y los procese
      de forma centralizada.
    */
    provideBrowserGlobalErrorListeners(),

    /*
      Configuración de detección de cambios.

      Angular utiliza Zone.js para detectar cuándo debe actualizar
      la interfaz automáticamente.

      eventCoalescing mejora el rendimiento agrupando eventos.
    */
    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    /*
      Habilita el sistema de rutas de Angular.

      Aquí se conecta el archivo app.routes.ts con la aplicación.
    */
    provideRouter(routes)
  ]
};