/*
  Servicio encargado de manejar los tokens de autenticación.

  Este servicio centraliza el acceso a localStorage para guardar, leer y eliminar:
  - access token
  - refresh token

  Se mantiene separado de auth.service para que otros elementos del core,
  como interceptors o guards, puedan consultar el token sin depender
  directamente de toda la lógica de autenticación.
*/

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { APP_CONSTANTS } from '../config/app.constants';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  /*
    PLATFORM_ID permite saber si Angular se está ejecutando en navegador
    o en servidor.

    Esto es importante porque localStorage solo existe en el navegador.
  */
  private readonly platformId = inject(PLATFORM_ID);

  /*
    Indica si el código se está ejecutando en navegador.
  */
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /*
    Clave usada para guardar el access token en localStorage.
  */
  private readonly accessTokenKey = APP_CONSTANTS.storageKeys.accessToken;

  /*
    Clave usada para guardar el refresh token en localStorage.
  */
  private readonly refreshTokenKey = APP_CONSTANTS.storageKeys.refreshToken;

  /*
    Guarda el access token.

    El access token se usará para autenticar peticiones HTTP
    hacia el backend FastAPI.
  */
  setAccessToken(token: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.accessTokenKey, token);
  }

  /*
    Obtiene el access token actual.

    Si no existe o si Angular no está en navegador, regresa null.
  */
  getAccessToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(this.accessTokenKey);
  }

  /*
    Guarda el refresh token.

    Este token puede servir más adelante para renovar sesión
    sin obligar al usuario a iniciar sesión nuevamente.
  */
  setRefreshToken(token: string): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.refreshTokenKey, token);
  }

  /*
    Obtiene el refresh token actual.
  */
  getRefreshToken(): string | null {
    if (!this.isBrowser) {
      return null;
    }

    return localStorage.getItem(this.refreshTokenKey);
  }

  /*
    Elimina solamente el access token.
  */
  removeAccessToken(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.accessTokenKey);
  }

  /*
    Elimina solamente el refresh token.
  */
  removeRefreshToken(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.refreshTokenKey);
  }

  /*
    Elimina todos los tokens de autenticación.
  */
  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
  }

  /*
    Indica si existe un access token guardado.

    Esta función no garantiza que el token sea válido en el backend;
    solo indica que existe en el navegador.
  */
  hasAccessToken(): boolean {
    return !!this.getAccessToken();
  }
}