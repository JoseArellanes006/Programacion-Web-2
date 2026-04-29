/*
  main.ts

  Este archivo es el punto de entrada de la aplicación Angular.

  Aquí es donde se inicia (bootstrap) toda la aplicación.
*/

/*
  IMPORTANTE: Zone.js

  Angular utiliza Zone.js para detectar automáticamente cambios
  en la aplicación (por ejemplo: eventos, peticiones HTTP, timers, etc.).

  Sin esta importación, Angular no puede manejar correctamente
  la detección de cambios y lanza el error:

  NG0908: Angular requires Zone.js
*/
import 'zone.js';

/*
  bootstrapApplication es la función que arranca la aplicación
  en Angular moderno (standalone).

  Reemplaza el uso tradicional de AppModule.
*/
import { bootstrapApplication } from '@angular/platform-browser';

/*
  appConfig contiene la configuración global de Angular:
  - rutas
  - providers
  - configuración de Zone.js
*/
import { appConfig } from './app/app.config';

/*
  App es el componente raíz de la aplicación.

  Este componente contiene el <router-outlet /> que renderiza
  las páginas según la ruta activa.
*/
import { App } from './app/app';

/*
  Inicialización de la aplicación.

  Aquí Angular:
  1. Crea el componente raíz (App)
  2. Aplica la configuración definida en appConfig
  3. Monta la aplicación en el navegador
*/
bootstrapApplication(App, appConfig)

  /*
    Manejo de errores global durante el arranque.

    Si ocurre algún error crítico al iniciar la aplicación,
    se imprime en consola para facilitar el diagnóstico.
  */
  .catch((err) => console.error(err));