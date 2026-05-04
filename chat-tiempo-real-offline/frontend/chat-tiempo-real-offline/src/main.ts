/*
  Importación de Zone.js

  Angular depende de Zone.js para detectar cambios automáticamente
  en la aplicación (change detection).

  Sin esta importación aparece el error:
  NG0908: Angular requires Zone.js

  Zone.js intercepta eventos asíncronos como:
  - clicks
  - peticiones HTTP
  - timers (setTimeout)
  - WebSockets

  y le avisa a Angular cuándo debe actualizar la vista.
*/
import 'zone.js';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

/*
  bootstrapApplication

  Punto de entrada de la aplicación Angular (standalone).

  Función:
  - inicia Angular;
  - monta el componente raíz (App);
  - aplica la configuración global (appConfig).

  Diferencia con Angular tradicional:
  - NO usa AppModule;
  - todo se configura aquí con providers.
*/
bootstrapApplication(App, appConfig)

  /*
    Manejo de errores en el arranque.

    Si ocurre un error durante el bootstrap (configuración,
    providers, rutas, etc.), se captura aquí y se imprime
    en consola.
  */
  .catch((err) => console.error(err));