import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';

/*
  Este archivo concentra la configuración global de Angular.

  Aquí se registran los providers principales que la aplicación necesita
  para funcionar correctamente.

  En este proyecto son especialmente importantes:

  - provideRouter(routes)
    Activa el sistema de rutas de Angular para navegar entre
    la vista principal y la vista de detalle.

  - provideHttpClient()
    Habilita HttpClient en toda la aplicación.
    Esto es indispensable para que los servicios puedan consumir
    el backend FastAPI.

  - provideClientHydration(withEventReplay())
    Mantiene la configuración moderna del arranque del cliente.
    En este proyecto no afecta negativamente y puede dejarse.
*/
export const appConfig: ApplicationConfig = {
  providers: [
    /*
      Proveedor de Angular para manejo global de errores del navegador.
      Ayuda a capturar errores durante la ejecución de la aplicación.
    */
    provideBrowserGlobalErrorListeners(),

    /*
      Registra el sistema de rutas definido en app.routes.ts.
      Gracias a esto Angular puede mostrar componentes según la URL.
    */
    provideRouter(routes),

    /*
      Habilita HttpClient.

      Este provider es obligatorio cuando se quiere consumir una API,
      por ejemplo el backend en FastAPI.

      Si falta, Angular lanzará errores como:
      "No provider for HttpClient"
    */
    provideHttpClient(),

    /*
      Mantiene la hidratación del cliente y la reproducción de eventos.
      Puede conservarse sin problema en este proyecto.
    */
    provideClientHydration(withEventReplay())
  ]
};