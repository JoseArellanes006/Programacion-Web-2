/*
  Archivo de configuración para desarrollo local.

  Este archivo se utiliza mientras trabajas en tu computadora.
  Angular se ejecutará normalmente en http://localhost:4200
  y FastAPI en http://127.0.0.1:8000.

  Si más adelante usas ngrok, una IP local o un servidor externo,
  aquí será donde se cambie la URL del backend para pruebas.
*/

export const environment = {
  /*
    Indica que esta configuración NO es de producción.
  */
  production: false,

  /*
    Nombre visible del sistema durante desarrollo.
  */
  appName: 'MarketMap Analytics',

  /*
    URL local del backend FastAPI.

    Cuando se levante FastAPI con:
    uvicorn app.main:app --reload

    normalmente estará disponible en:
    http://127.0.0.1:8000
  */
  apiUrl: 'http://127.0.0.1:8000',

  /*
    URL local del WebSocket.

    Debe coincidir con el endpoint WebSocket definido en FastAPI.

    Nota:
    El backend actualmente tiene rutas WebSocket con prefijo /ws.
    Si se usa una ruta específica por usuario, el servicio de Angular
    deberá construir la URL final con el id del usuario.
  */
  wsUrl: 'ws://127.0.0.1:8000/ws',

  /*
    Client ID generado en Google Cloud Console.

    Este valor permite que Angular cargue el inicio de sesión con Google.
    El mismo Client ID también se configura en el backend para validar
    el token recibido desde Google.
  */
  googleClientId: '704307847467-h12qpn0l9ua7p1nthdgf0eb2d8o8sf64.apps.googleusercontent.com'
};