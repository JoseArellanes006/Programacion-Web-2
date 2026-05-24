/*
  Archivo de configuración por defecto.

  Este archivo se usa cuando Angular importa:

  import { environment } from '.../environments/environment';

  Para evitar que ng serve apunte por error a producción,
  aquí dejamos la configuración local de desarrollo.

  Backend local:
  http://127.0.0.1:8000

  Frontend local:
  http://localhost:4200
*/

export const environment = {
  /*
    Indica que esta configuración NO es de producción.
  */
  production: false,

  /*
    Nombre visible del sistema.
  */
  appName: 'MarketMap Analytics',

  /*
    URL local del backend FastAPI.

    Debe coincidir con el servidor levantado mediante:

    uvicorn app.main:app --reload
  */
  apiUrl: 'http://127.0.0.1:8000',

  /*
    URL local base del WebSocket.
  */
  wsUrl: 'ws://127.0.0.1:8000/ws',

  /*
    Client ID generado en Google Cloud Console.

    Este valor se usa en Angular para cargar Google Identity Services.
  */
  googleClientId: '704307847467-h12qpn0l9ua7p1nthdgf0eb2d8o8sf64.apps.googleusercontent.com'
};