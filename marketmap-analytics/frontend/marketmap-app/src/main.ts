/*
  Archivo principal de arranque de la aplicación Angular.

  Este archivo inicializa la aplicación usando bootstrapApplication.

  Esta versión NO importa Zone.js.

  Antes se tenía:

  import 'zone.js';

  Pero esa importación no debe usarse si el proyecto está trabajando
  en modo zoneless.

  La detección de cambios se apoya en el modelo moderno de Angular:
  - signals
  - eventos de template
  - async pipe cuando aplique
  - actualizaciones explícitas de estado
*/

import { bootstrapApplication } from '@angular/platform-browser';

import { App } from './app/app';
import { appConfig } from './app/app.config';

/*
  Arranque principal de la aplicación.
*/
bootstrapApplication(App, appConfig)
  .catch((error) => {
    console.error(error);
  });