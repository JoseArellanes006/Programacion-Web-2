/*
  Servicio global de autenticación.

  Este servicio administra el estado de sesión dentro del frontend.

  Responsabilidades principales:
  - Saber si el usuario está autenticado.
  - Guardar el usuario actual.
  - Guardar tokens recibidos desde el backend.
  - Cerrar sesión.
  - Exponer el estado de autenticación mediante signals.
  - Enviar al backend el idToken real recibido desde Google Identity Services.
  - Solicitar recuperación y restablecimiento de contraseña.
*/

import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { API_CONFIG } from '../config/api.config';
import { APP_CONSTANTS } from '../config/app.constants';
import { TokenService } from './token.service';

/*
  Rol permitido dentro del sistema.
*/
export type AuthRole =
  | typeof APP_CONSTANTS.roles.admin
  | typeof APP_CONSTANTS.roles.manager
  | typeof APP_CONSTANTS.roles.seller
  | typeof APP_CONSTANTS.roles.customer;

/*
  Usuario autenticado dentro del frontend.
*/
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  avatarUrl?: string | null;
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lastLoginAt?: string | null;
}

/*
  Respuesta esperada al iniciar sesión.
*/
export interface AuthSessionResponse {
  accessToken: string;
  refreshToken?: string | null;
  user: AuthUser;
}

/*
  Respuesta de solicitud de recuperación de contraseña.
*/
export interface ForgotPasswordResponse {
  message: string;
  resetToken?: string | null;
  resetUrl?: string | null;
}

/*
  Respuesta de restablecimiento de contraseña.
*/
export interface ResetPasswordResponse {
  message: string;
}

/*
  Datos mínimos para iniciar sesión con correo y contraseña.
*/
export interface LoginPayload {
  email: string;
  password: string;
}

/*
  Datos mínimos para registrar un usuario.
*/
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: AuthRole;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /*
    HttpClient se usa para comunicarse con FastAPI.
  */
  private readonly http = inject(HttpClient);

  /*
    TokenService centraliza el almacenamiento de tokens.
  */
  private readonly tokenService = inject(TokenService);

  /*
    PLATFORM_ID permite evitar errores cuando no existe localStorage,
    por ejemplo en SSR.
  */
  private readonly platformId = inject(PLATFORM_ID);

  /*
    Indica si Angular está ejecutándose en navegador.
  */
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /*
    Clave usada para guardar el usuario actual en localStorage.
  */
  private readonly currentUserKey = APP_CONSTANTS.storageKeys.currentUser;

  /*
    Signal privado que guarda el usuario actual.
  */
  private readonly currentUserSignal = signal<AuthUser | null>(
    this.loadUserFromStorage()
  );

  /*
    Signal público de solo lectura para consultar el usuario actual.
  */
  readonly currentUser = this.currentUserSignal.asReadonly();

  /*
    Signal computado que indica si existe usuario y token.
  */
  readonly isAuthenticated = computed(() => {
    return !!this.currentUserSignal() && this.tokenService.hasAccessToken();
  });

  /*
    Signal computado que regresa el rol del usuario actual.
  */
  readonly currentRole = computed(() => {
    return this.currentUserSignal()?.role ?? null;
  });

  /*
    Inicia sesión usando correo y contraseña.
  */
  login(payload: LoginPayload): Observable<AuthSessionResponse> {
    return this.http
      .post<AuthSessionResponse>(API_CONFIG.auth.login, payload)
      .pipe(
        tap((session) => {
          this.setSession(session);
        })
      );
  }

  /*
    Registra un usuario.
  */
  register(payload: RegisterPayload): Observable<AuthSessionResponse> {
    return this.http
      .post<AuthSessionResponse>(API_CONFIG.auth.register, payload)
      .pipe(
        tap((session) => {
          this.setSession(session);
        })
      );
  }

  /*
    Inicia sesión con Google.

    idToken:
    Es la credencial real recibida desde Google Identity Services.

    El backend espera exactamente:
    {
      "idToken": "..."
    }
  */
  loginWithGoogle(idToken: string): Observable<AuthSessionResponse> {
    return this.http
      .post<AuthSessionResponse>(
        API_CONFIG.auth.google,
        {
          idToken
        }
      )
      .pipe(
        tap((session) => {
          this.setSession(session);
        })
      );
  }

  /*
    Solicita recuperación de contraseña.

    En desarrollo, el backend puede devolver resetUrl para probar el flujo.
    En producción, el backend enviará el enlace por correo.
  */
  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(
      API_CONFIG.auth.forgotPassword,
      {
        email
      }
    );
  }

  /*
    Restablece la contraseña usando token de recuperación.
  */
  resetPassword(
    resetToken: string,
    newPassword: string
  ): Observable<ResetPasswordResponse> {
    return this.http.post<ResetPasswordResponse>(
      API_CONFIG.auth.resetPassword,
      {
        token: resetToken,
        newPassword
      }
    );
  }

  /*
    Consulta el usuario autenticado desde el backend.
  */
  loadCurrentUserFromApi(): Observable<AuthUser> {
    return this.http.get<AuthUser>(API_CONFIG.auth.me).pipe(
      tap((user) => {
        this.setCurrentUser(user);
      })
    );
  }

  /*
    Guarda la sesión completa en frontend.
  */
  setSession(session: AuthSessionResponse): void {
    this.tokenService.setAccessToken(session.accessToken);

    if (session.refreshToken) {
      this.tokenService.setRefreshToken(session.refreshToken);
    }

    this.setCurrentUser(session.user);
  }

  /*
    Guarda únicamente el usuario actual.
  */
  setCurrentUser(user: AuthUser): void {
    this.currentUserSignal.set(user);
    this.saveUserToStorage(user);
  }

  /*
    Cierra la sesión del usuario.
  */
  logout(): void {
    this.tokenService.clearTokens();
    this.currentUserSignal.set(null);
    this.removeUserFromStorage();
  }

  /*
    Verifica si el usuario actual tiene un rol específico.
  */
  hasRole(role: AuthRole): boolean {
    return this.currentUserSignal()?.role === role;
  }

  /*
    Verifica si el usuario actual tiene alguno de los roles indicados.
  */
  hasAnyRole(roles: AuthRole[]): boolean {
    const currentRole = this.currentUserSignal()?.role;

    if (!currentRole) {
      return false;
    }

    return roles.includes(currentRole);
  }

  /*
    Carga el usuario desde localStorage.
  */
  private loadUserFromStorage(): AuthUser | null {
    if (!this.isBrowser) {
      return null;
    }

    const rawUser = localStorage.getItem(this.currentUserKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as AuthUser;
    } catch {
      localStorage.removeItem(this.currentUserKey);
      return null;
    }
  }

  /*
    Guarda el usuario actual en localStorage.
  */
  private saveUserToStorage(user: AuthUser): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
  }

  /*
    Elimina el usuario actual de localStorage.
  */
  private removeUserFromStorage(): void {
    if (!this.isBrowser) {
      return;
    }

    localStorage.removeItem(this.currentUserKey);
  }
}