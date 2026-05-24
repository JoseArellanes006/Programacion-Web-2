/*
  Archivo de configuración para producción.

  Este archivo debe usarse solamente cuando la aplicación
  se compile para un entorno real.

  Por ahora conserva URLs de ejemplo hasta que exista
  un backend desplegado oficialmente.
*/

export const environment = {
  /*
    Indica que esta configuración corresponde a producción.
  */
  production: true,

  /*
    Nombre visible del sistema.
  */
  appName: 'MarketMap Analytics',

  /*
    URL pública del backend en producción.

    Esta URL solo funcionará cuando realmente exista
    ese dominio configurado y desplegado.
  */
  apiUrl: 'https://api.marketmap-analytics.com',

  /*
    URL pública del WebSocket en producción.
  */
  wsUrl: 'wss://api.marketmap-analytics.com/ws',

  /*
    Client ID generado en Google Cloud Console.

    Para usarlo en producción, también debes agregar el dominio real
    en los orígenes autorizados del cliente OAuth.
  */
  googleClientId: '704307847467-h12qpn0l9ua7p1nthdgf0eb2d8o8sf64.apps.googleusercontent.com'
};